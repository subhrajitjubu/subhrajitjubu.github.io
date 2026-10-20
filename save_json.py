"""
save_json.py - fast JSON export of xarray DataArrays.

The original `dict_l` approach has three structural costs:

  1. `data.squeeze()` strips *every* length-1 dimension, not just the time
     axis, so a (1, 3, 427, 427) array silently becomes (3, 427, 427) and the
     time coordinate is lost.
  2. `to_dict(data='list')` materialises the whole array as nested Python
     lists first - for a (7, 3, 427, 427) field that is ~3.8 M Python float
     objects, several hundred MB of RAM, before a single byte is written.
  3. `round_numbers` + `convert_types` are two full recursive Python walks
     over that structure, element by element.

This version rounds with numpy (vectorised), converts with ndarray.tolist()
(one C-level pass instead of a Python loop), and streams one time slice at a
time straight to the file so peak memory stays at one slice.

Public API:
    save_da_json(data, fm, ...)      -> path written
    dict_l(data, fm)                 -> drop-in replacement for the original
"""
import json
import logging
import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import xarray as xr

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

try:                                            # optional, big speed-up
    import orjson

    def _dumps(obj, indent=None):
        if indent is None:
            return orjson.dumps(obj).decode()
        return orjson.dumps(obj, option=orjson.OPT_INDENT_2).decode()
    _FAST = True
except ImportError:                             # pragma: no cover
    _FAST = False

    def _dumps(obj, indent=None):
        return json.dumps(obj, indent=indent, separators=(",", ":") if indent is None else None)


# ---------------------------------------------------------- unit conversion ---
# Keyed by CF standard_name. Each rule converts the native unit into a more
# human one: metres -> millimetres, kelvin -> degrees Celsius, and
# metres/second -> millimetres/hour for precipitation rates.
UNIT_CONVERSIONS = {
    # --- temperature: K -> degC ---
    "air_temperature":                       dict(scale=1.0, offset=-273.15, unit="degC", from_unit="K"),
    "surface_temperature":                   dict(scale=1.0, offset=-273.15, unit="degC", from_unit="K"),
    "tropopause_air_temperature":            dict(scale=1.0, offset=-273.15, unit="degC", from_unit="K"),
    "dew_point_temperature":                 dict(scale=1.0, offset=-273.15, unit="degC", from_unit="K"),
    "wet_bulb_potential_temperature":        dict(scale=1.0, offset=-273.15, unit="degC", from_unit="K"),
    # --- precipitation amounts: m -> mm ---
    "lwe_thickness_of_precipitation_amount": dict(scale=1000.0, offset=0.0, unit="mm", from_unit="m"),
    "thickness_of_rainfall_amount":          dict(scale=1000.0, offset=0.0, unit="mm", from_unit="m"),
    "lwe_thickness_of_surface_snow_amount":  dict(scale=1000.0, offset=0.0, unit="mm", from_unit="m"),
    # --- precipitation rates: m s-1 -> mm h-1 ---
    "lwe_precipitation_rate":                dict(scale=3.6e6, offset=0.0, unit="mm h-1", from_unit="m s-1"),
    "rainfall_rate":                         dict(scale=3.6e6, offset=0.0, unit="mm h-1", from_unit="m s-1"),
    "convective_rainfall_rate":              dict(scale=3.6e6, offset=0.0, unit="mm h-1", from_unit="m s-1"),
    "lwe_snowfall_rate":                     dict(scale=3.6e6, offset=0.0, unit="mm h-1", from_unit="m s-1"),
    "lwe_convective_snowfall_rate":          dict(scale=3.6e6, offset=0.0, unit="mm h-1", from_unit="m s-1"),
}


def apply_unit_conversion(da, table=None):
    """Convert a DataArray to friendlier units if its standard_name is in the table.

    Returns (converted_da, rule_or_None). The original unit is preserved in
    the attributes as `units_original` plus a `unit_conversion` note, so no
    information is lost. Already-converted arrays are left alone.
    """
    tbl = UNIT_CONVERSIONS if table is None else table
    name = da.attrs.get("standard_name") or da.name
    rule = tbl.get(name)
    if rule is None:
        return da, None
    current = da.attrs.get("units", "")
    if current and rule.get("from_unit") and current != rule["from_unit"]:
        # already converted (or in some other unit) - leave it be
        return da, None
    out = da.astype("float64") * rule["scale"] + rule["offset"]
    out.attrs = dict(da.attrs)
    out.attrs["units"] = rule["unit"]
    out.attrs["units_original"] = current
    out.attrs["unit_conversion"] = f"{current or '?'} -> {rule['unit']}"
    return out, rule


# ----------------------------------------------------------------- helpers ---
def _iso(a):
    """datetime64 array -> ISO-8601 strings (shape preserving)."""
    a = np.asarray(a)
    if a.ndim == 0:
        a = a.reshape(1)
    try:
        ts = pd.to_datetime(a.astype("datetime64[ns]").ravel())
        out = ts.strftime("%Y-%m-%dT%H:%M:%S").tolist()
    except Exception:
        out = [str(x) for x in a.ravel().tolist()]
    if np.asarray(a).ndim == 0:
        return out[0]
    return np.asarray(out, dtype=object).reshape(np.asarray(a).shape).tolist()


def _jsonable(obj):
    """Coerce a scalar/attr value into something json.dump can handle."""
    if isinstance(obj, np.datetime64):
        return _iso(obj)
    if isinstance(obj, (pd.Timestamp, datetime)):
        return pd.Timestamp(obj).isoformat()
    if isinstance(obj, timedelta):
        return obj.total_seconds()
    if isinstance(obj, np.ndarray):
        if obj.dtype.kind == "M":
            return _iso(obj)
        return _jsonable(obj.tolist())
    if isinstance(obj, (np.generic,)):
        return _jsonable(obj.item())
    if isinstance(obj, (set, tuple)):
        return list(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", "replace")
    if isinstance(obj, (int, float, str, bool)) or obj is None:
        return obj
    return str(obj)


def _tolist(arr, decimals=2, nan_to_null=True):
    """ndarray -> nested python lists, rounded and NaN-cleaned, fast."""
    a = np.asarray(arr)
    if a.dtype.kind == "f":
        if decimals is not None:
            # round in float64: rounding a float32 in place keeps float32
            # representation error (0.12 -> 0.1199999973...), whereas the
            # original round(float(x), 2) rounds the double and gives a clean 0.12
            a = np.round(a.astype(np.float64), decimals)
        if nan_to_null and a.size and np.isnan(a).any():
            # NaN -> null. Do it with a vectorised mask: a per-row `x != x` test
            # does not work, because CPython's list comparison short-circuits on
            # object identity, so the same NaN object compares equal to itself.
            o = a.astype(object)
            o[np.isnan(a)] = None
            return o.tolist()
        return a.tolist()
    if a.dtype.kind in "iub":
        return a.astype(np.int64).tolist() if a.dtype.kind == "b" else a.tolist()
    if a.dtype.kind == "M":                       # datetime64 -> ISO-8601
        return _iso(a)
    return a.astype(str).tolist()


def _coords(data):
    out = {}
    for name, c in data.coords.items():
        vals = c.values
        if vals.dtype.kind == "M":
            out[name] = _iso(vals)
        elif vals.ndim == 0:
            out[name] = _jsonable(vals.item())
        else:
            out[name] = _tolist(vals, decimals=None)
    return out


def _attrs(data):
    return {k: _jsonable(v) for k, v in data.attrs.items()}


# -------------------------------------------------------------------- main ---
def save_da_json(data, fm, outdir=None, decimals=2, indent=None,
                 nan_to_null=True, drop_time_dim=True, include_attrs=True,
                 extras=None, convert_units=True, unit_table=None,
                 max_bytes=None):
    """Write an xarray DataArray to JSON.

    data          : xr.DataArray (or Dataset -> use .to_dataarray())
    fm            : file name stem; the file is <fm>.json
    outdir        : directory to write into (default: os.getcwd())
    decimals      : round floats to this many places (None = keep full precision)
    indent        : pretty-print indent (None = compact, much smaller/faster)
    nan_to_null   : emit NaN as JSON null instead of the invalid bare NaN
    drop_time_dim : if the time axis has length 1, drop it (saves a level)
    include_attrs : include data.attrs in the output
    extras        : optional dict of extra name -> DataArray, written under
                    the "extras" key as {name: {"dims": [...], "data": [...]}}
    convert_units : apply UNIT_CONVERSIONS (K -> degC, m -> mm, m s-1 -> mm h-1)
    unit_table    : override the conversion table
    max_bytes     : split the output into parts no bigger than this, along the
                    time axis. One file -> <fm>.json; several -> <fm>_partNNofNN.json
                    Each part is a complete, valid document with its own (sliced)
                    time / forecast_period coordinates.

    Returns the path written, or a list of paths when the output was split.
    """
    if not isinstance(data, xr.DataArray):
        data = xr.DataArray(data)

    if drop_time_dim and data.ndim > 1 and "time" in data.dims and data.sizes["time"] == 1:
        data = data.isel(time=0, drop=True)

    if convert_units:
        data, _rule = apply_unit_conversion(data, unit_table)

    outdir = outdir or os.getcwd()
    os.makedirs(outdir, exist_ok=True)

    arr = data.values
    dims = list(data.dims)
    # leading time axis is the one we stream (and split) over
    tdim = dims.index("time") if ("time" in dims and arr.ndim > 1) else None

    log = logging.getLogger(__name__)
    log.info("Saving %s  dims=%s shape=%s%s",
             os.path.join(outdir, fm + ".json"), dims, arr.shape,
             "  (orjson)" if _FAST else "")

    # move the streamed axis to the front so slices are contiguous
    if tdim is not None and tdim != 0:
        order = [tdim] + [i for i in range(arr.ndim) if i != tdim]
        arr = np.transpose(arr, order)
        dims = [dims[i] for i in order]
        tdim = 0

    coords = _coords(data)
    time_coords = {k for k, v in data.coords.items() if "time" in v.dims}
    attrs = _attrs(data) if (include_attrs and data.attrs) else None

    # extras -> (dims, values, is time-indexed)
    ex = {}
    for name, e in (extras or {}).items():
        ex[name] = (list(e.dims), np.asarray(e.values), "time" in e.dims)

    # serialise one time slice at a time: this is also the unit we split on
    if tdim is None:
        slices = [_dumps(_tolist(arr, decimals, nan_to_null), indent)]
        n = None
    else:
        n = arr.shape[0]
        slices = [_dumps(_tolist(arr[i], decimals, nan_to_null), indent)
                  for i in range(n)]

    def _part_coords(a, b):
        if a is None:
            return coords
        return {k: (v[a:b] if (k in time_coords and isinstance(v, list)) else v)
                for k, v in coords.items()}

    def _overhead(a, b):
        """Bytes a part spends on everything except its data values."""
        size = len(_dumps(_part_coords(a, b), indent)) + len(_dumps(dims, None)) + 40
        if attrs:
            size += len(_dumps(attrs, indent))
        for name, (edims, ev, istime) in ex.items():
            vals = ev[a:b] if (a is not None and istime) else ev
            size += (len(_dumps(name, None)) + len(_dumps(edims, None))
                     + len(_dumps(_tolist(vals, decimals, nan_to_null), indent)) + 40)
        return size

    # pack whole time slices into parts that stay under max_bytes
    if max_bytes and n:
        # overhead grows a little as time strings are added, so size every part
        # against the full-length coordinate block - an upper bound
        budget = max(max_bytes - _overhead(0, n), 1)
        groups, start = [], 0
        while start < n:
            used, end = 0, start
            while end < n:
                step = len(slices[end]) + 1
                if end > start and used + step > budget:
                    break
                used += step
                end += 1
            groups.append((start, end))
            start = end
        if len(groups) > 1:
            log.info("splitting %s into %d part(s) of <= %.1f MB",
                     fm, len(groups), max_bytes / 1e6)
    elif n:
        groups = [(0, n)]
    else:
        groups = [(None, None)]

    paths = []
    nparts = len(groups)
    for gi, (a, b) in enumerate(groups, 1):
        if nparts == 1:
            path = os.path.join(outdir, f"{fm}.json")
        else:
            path = os.path.join(outdir, f"{fm}_part{gi:02d}of{nparts:02d}.json")

        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write('{"coords":')
            fh.write(_dumps(_part_coords(a, b), indent))
            fh.write(',"dims":')
            fh.write(_dumps(dims, None))
            if attrs:
                fh.write(',"attrs":')
                fh.write(_dumps(attrs, indent))
            fh.write(',"data":')
            if a is None:
                fh.write(slices[0])
            else:
                fh.write("[")
                for i in range(a, b):
                    if i > a:
                        fh.write(",")
                    fh.write("\n" if indent else "")
                    fh.write(slices[i])
                fh.write("\n" if indent else "")
                fh.write("]")
            if ex:
                fh.write(',"extras":{')
                for k, (name, (edims, ev, istime)) in enumerate(ex.items()):
                    if k:
                        fh.write(",")
                    fh.write("\n" if indent else "")
                    vals = ev[a:b] if (a is not None and istime) else ev
                    fh.write(_dumps(name, None) + ":")
                    fh.write('{"dims":')
                    fh.write(_dumps(edims, None))
                    fh.write(',"data":')
                    fh.write(_dumps(_tolist(vals, decimals, nan_to_null), indent))
                    fh.write("}")
                fh.write("\n" if indent else "")
                fh.write("}")
            fh.write("}")

        size = os.path.getsize(path)
        log.info("Data successfully saved -> %s (%.1f MB)", path, size / 1e6)
        if max_bytes and size > max_bytes:
            log.warning("%s is %.1f MB, over the %.1f MB budget - a single time "
                        "slice is larger than the limit",
                        os.path.basename(path), size / 1e6, max_bytes / 1e6)
        paths.append(path)

    return paths[0] if len(paths) == 1 else paths


def dict_l(data, fm, outdir=None, **kw):
    """Drop-in replacement for the original dict_l(data, fm).

    Same signature and same '<fm>.json' naming, but fast and safe.
    """
    try:
        return save_da_json(data, fm, outdir=outdir, **kw)
    except Exception as e:
        logging.error("An error occurred: %s", e)
        raise
