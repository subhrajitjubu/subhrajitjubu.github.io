"""
mo_to_json.py - convert cropped Met Office NetCDF files to JSON.

Works on the merged files produced by `mo_crop.py --merge` (one file per
variable, with a time dimension) and on the split files too.

    python mo_to_json.py cropped/global-deterministic-10km/20261020T0600Z_cropped
    python mo_to_json.py path/to/file.nc --outdir ./json
    python mo_to_json.py <dir> --decimals 2 --no-flag

The writer is save_json.save_da_json, which is ~28x faster than the usual
`to_dict(data='list')` + json.dump route and produces strict, valid JSON
(NaN -> null rather than a bare NaN).
"""
import argparse, glob, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import xarray as xr

from save_json import save_da_json, _tolist, _dumps, _jsonable

# variables that are metadata rather than data
SKIP = {
    "latitude", "longitude", "latitude_bnds", "longitude_bnds", "bnds",
    "time", "forecast_period", "forecast_reference_time", "latitude_longitude",
    "projection_x_coordinate", "projection_y_coordinate",
    "projection_x_coordinate_bnds", "projection_y_coordinate_bnds",
    "pressure", "height",
}


def open_nc(path):
    """Open a NetCDF as an xarray Dataset, decoding the CF time axis."""
    ds = xr.open_dataset(path, decode_times=True, mask_and_scale=True)
    return ds


def pick_data_var(ds):
    """Choose the data variable: the one that is not a coordinate or metadata."""
    cands = [v for v in ds.data_vars
             if v not in SKIP and v not in ("flag",) and ds[v].ndim >= 2]
    if not cands:
        cands = [v for v in ds.data_vars if v not in SKIP and ds[v].ndim >= 2]
    if not cands:
        raise ValueError("no data variable found")
    # prefer the biggest
    return max(cands, key=lambda v: ds[v].size)


def nc_to_json(path, outdir=None, decimals=2, indent=None, include_flag=True,
               drop_time_dim=True, extra_vars=None, quiet=False, convert_units=True,
               max_mb=20.0):
    """Convert one NetCDF to JSON. Returns the JSON path (or list of paths)."""
    ds = open_nc(path)
    try:
        name = pick_data_var(ds)
        da = ds[name]

        # keep only the coords that actually index this variable
        keep = {c: v for c, v in ds.coords.items() if c in da.dims}
        da = da.assign_coords(keep)

        # forecast_reference_time is a scalar variable in the merged files -
        # promote it to a coord so it lands in the JSON coords block
        if "forecast_reference_time" in ds.variables:
            v = ds["forecast_reference_time"]
            vals = np.atleast_1d(np.asarray(v.values))
            units = v.attrs.get("units", "seconds since 1970-01-01 00:00:00")
            cal = v.attrs.get("calendar", "standard")
            try:
                from netCDF4 import num2date
                dt = num2date(vals, units, cal)
                dt64 = np.array([np.datetime64(d.replace(tzinfo=None).isoformat()) for d in dt])
            except Exception:
                dt64 = vals
            dt64 = dt64[0] if dt64.size == 1 else dt64
            if "forecast_reference_time" not in da.coords:
                da = da.assign_coords(forecast_reference_time=dt64)

        extras = {}
        if include_flag and "flag" in ds.variables and "flag" in da.dims:
            fl = ds["flag"]
            fl = fl.assign_coords({c: v for c, v in ds.coords.items() if c in fl.dims})
            extras["flag"] = fl
        for v in (extra_vars or []):
            if v in ds.variables:
                ev = ds[v]
                extras[v] = ev.assign_coords({c: c2 for c, c2 in ds.coords.items()
                                              if c in ev.dims})

        stem = os.path.splitext(os.path.basename(path))[0]
        outdir = outdir or os.path.dirname(os.path.abspath(path))
        os.makedirs(outdir, exist_ok=True)
        t0 = time.perf_counter()
        jpath = save_da_json(da, stem, outdir=outdir, decimals=decimals,
                             indent=indent, drop_time_dim=drop_time_dim,
                             extras=extras or None, convert_units=convert_units,
                             max_bytes=int(max_mb * 1e6) if max_mb else None)
        if not quiet:
            names = jpath if isinstance(jpath, list) else [jpath]
            sz = sum(os.path.getsize(p) for p in names) / 1e6
            note = f"  ({len(names)} parts)" if len(names) > 1 else ""
            print(f"  {os.path.basename(path):<58s} -> {os.path.basename(names[0]):<58s} "
                  f"{sz:8.2f} MB  ({time.perf_counter()-t0:.1f}s){note}")
        return jpath
    finally:
        ds.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", nargs="+", help="NetCDF file(s) or directory(ies)")
    ap.add_argument("--outdir", default=None, help="where to write the .json files")
    ap.add_argument("--decimals", type=int, default=2,
                    help="round floats to N places (-1 for full precision)")
    ap.add_argument("--indent", type=int, default=None, help="pretty-print indent")
    ap.add_argument("--no-flag", action="store_true",
                    help="skip the status-flag variable")
    ap.add_argument("--keep-time", action="store_true",
                    help="keep the time axis even when it has length 1")
    ap.add_argument("--extra", default=None,
                    help="comma-separated extra variables to include")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--no-convert-units", action="store_true",
                    help="keep native units (K, m, m s-1) instead of degC / mm / mm h-1")
    ap.add_argument("--max-mb", type=float, default=20.0,
                    help="split each output into parts no bigger than this many MB "
                         "along the time axis (0 = never split). Default 20 MB, "
                         "comfortably under GitHub's 25 MB file limit.")
    a = ap.parse_args()

    decimals = None if a.decimals is not None and a.decimals < 0 else a.decimals

    files = []
    for t in a.target:
        if os.path.isdir(t):
            files += sorted(glob.glob(os.path.join(t, "**", "*.nc"), recursive=True))
        else:
            files += glob.glob(t)
    files = [f for f in files if os.path.isfile(f)]
    if not files:
        sys.exit("no .nc files found")

    if not a.quiet:
        print(f"converting {len(files)} file(s) -> json")
    t0 = time.perf_counter()
    for f in files:
        try:
            nc_to_json(f, outdir=a.outdir, decimals=decimals, indent=a.indent,
                       include_flag=not a.no_flag,
                       drop_time_dim=not a.keep_time,
                       extra_vars=(a.extra.split(",") if a.extra else None),
                       convert_units=not a.no_convert_units,
                       max_mb=a.max_mb,
                       quiet=a.quiet)
        except Exception as e:
            print(f"  FAILED {os.path.basename(f)}: {e}")
    if not a.quiet:
        print(f"done in {time.perf_counter()-t0:.1f}s")


if __name__ == "__main__":
    main()
