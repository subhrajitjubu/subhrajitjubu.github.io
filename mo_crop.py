"""
mo_crop.py - pull a lat/lon sub-region of a Met Office model run straight from S3
without downloading the full global files.

Why this is cheap: the source NetCDFs are HDF4/HDF5 with (128,128) chunking, so a
hyperslab read only touches the chunks that intersect your box (~5-6% of the file).
Reads are issued as HTTP Range requests, and a read-ahead window coalesces the
chunks of one vertical level into a single request. Work is spread over processes
because each request costs an HTTPS round trip.

Examples
--------
  # latest global run, box lat 0-40 / lon 40-100, every variable, one file per source
  python mo_crop.py --lat 0 40 --lon 40 100 --out ./cropped

  # one variable, all lead times merged into a single NetCDF with a time dimension
  python mo_crop.py --vars temperature_on_pressure_levels --merge --out ./cropped

  # 12Z run (the cycle that carries the full 0-168 h forecast)
  python mo_crop.py --run 20261019T1200Z --vars wind_speed_at_10m --out ./cropped
"""
import argparse, atexit, io, os, re, sys, time, json, glob, subprocess
import urllib.request
import numpy as np
import h5py

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mo_aws import list_runs, list_files, BASE
import mo_vars

FN = re.compile(r"^(\d{8}T\d{4})Z-PT(\d+)H\d+M-(.+)\.nc$")
# Printed at startup and checked by the workflow, so a run can never silently
# use an older copy of this file again.
BUILD = "2026-10-21-json-subprocess"
WINDOW = 512 * 1024          # read-ahead window per HTTP Range request
SKIP_ATTRS = {"CLASS", "NAME", "DIMENSION_SCALE", "DIMENSION_LIST", "REFERENCE_LIST",
              "_Netcdf4Dimid", "_Netcdf4Coordinates", "_FillValue"}


# ------------------------------------------------------------------ reader ---
class RangeFile(io.RawIOBase):
    """Seekable HTTP Range reader with a read-ahead window and byte accounting."""
    def __init__(self, url, window=WINDOW):
        self.url, self.pos, self.nbytes, self.nreq = url, 0, 0, 0
        self.window = window
        self._buf, self._buf_start = b"", 0
        # The HEAD is a normal HTTPS round trip and can time out like any other
        # request, so retry it instead of losing a whole lead time to one blip.
        req = urllib.request.Request(url, method="HEAD")
        last = None
        for attempt in range(5):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    self.size = int(r.headers["Content-Length"])
                break
            except Exception as e:
                last = e
                time.sleep(min(2 ** attempt, 20))
        else:
            raise last

    def seekable(self): return True
    def readable(self): return True
    def writable(self): return False
    def seek(self, off, whence=io.SEEK_SET):
        self.pos = (off if whence == io.SEEK_SET else
                    self.pos + off if whence == io.SEEK_CUR else self.size + off)
        return self.pos
    def tell(self): return self.pos

    def _fetch(self, start, end):
        last = None
        for attempt in range(6):
            try:
                req = urllib.request.Request(self.url, headers={"Range": f"bytes={start}-{end}"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    data = r.read()
                if len(data) != end - start + 1:
                    raise IOError(f"short read {len(data)} != {end-start+1}")
                self.nbytes += len(data); self.nreq += 1
                return data
            except Exception as e:
                last = e
                time.sleep(min(2 ** attempt, 30))
        raise last

    def read(self, n=-1):
        if n is None or n < 0: n = self.size - self.pos
        if n <= 0: return b""
        bs, be = self._buf_start, self._buf_start + len(self._buf)
        if bs <= self.pos and self.pos + n <= be:
            off = self.pos - bs
            self.pos += n
            return self._buf[off:off + n]
        start = self.pos
        end = min(start + max(n, self.window), self.size) - 1
        self._buf = self._fetch(start, end)
        self._buf_start = start
        off = self.pos - self._buf_start
        self.pos += n
        return self._buf[off:off + n]

    def readinto(self, b):
        d = self.read(len(b)); b[:len(d)] = d; return len(d)
    def flush(self): pass
    def close(self): pass


def dec(v):
    if isinstance(v, bytes): return v.decode()
    if isinstance(v, np.ndarray):
        if v.dtype.kind == "S": return [x.decode() for x in v.ravel().tolist()]
        return v.tolist()
    if isinstance(v, np.generic): return v.item()
    return v


# ---------------------------------------------------------------- geometry ---
def box_indices(lat, lon, lat0, lat1, lon0, lon1):
    """Inclusive index bounds of the grid cell centres inside the requested box."""
    la = np.where((lat >= lat0) & (lat <= lat1))[0]
    lo = np.where((lon >= lon0) & (lon <= lon1))[0]
    if la.size == 0 or lo.size == 0:
        raise ValueError(f"box lat[{lat0},{lat1}] lon[{lon0},{lon1}] is outside the grid")
    return int(la[0]), int(la[-1]), int(lo[0]), int(lo[-1])


# ------------------------------------------------------------------ writer ---
def _copy_attrs(src, dst, skip=SKIP_ATTRS):
    for k, v in src.attrs.items():
        if k in skip: continue
        try: dst.setncattr(k, dec(v))
        except Exception: pass


def level_selection(h5, levels):
    """Work out the vertical dimension and which levels to keep.

    levels : {"pressure": [850, 500, 200], "height": [1000, 2000]}
             (values in hPa for pressure, metres for height)
    Returns (vdim, vsel) where vsel is slice(None) or an index array.
    """
    vdim = None
    for cand in ("pressure", "height"):
        o = h5.get(cand)
        if o is not None and isinstance(o, h5py.Dataset) and o.ndim == 1 and o.size > 1:
            vdim = cand; break
    if vdim is None:
        return None, slice(None)
    want = (levels or {}).get(vdim)
    if not want:
        return vdim, slice(None)
    vals = np.asarray(h5[vdim][()], dtype="float64")
    scale = 100.0 if vdim == "pressure" else 1.0     # Pa -> hPa
    tgt = np.asarray(want, dtype="float64")
    idx = []
    for w in tgt:
        j = int(np.argmin(np.abs(vals / scale - w)))
        if abs(vals[j] / scale - w) > (0.51 if vdim == "pressure" else 0.51):
            raise ValueError(f"{vdim} level {w} not present in file "
                             f"(nearest {vals[j]/scale:g})")
        if j not in idx:
            idx.append(j)
    return vdim, np.array(idx)


def _level_coord(dataset, run, fname, kind):
    """Read the vertical coordinate of one source file.

    kind : "pressure" (returned in hPa) or "height" (in metres)
    Returns None if the file has no such coordinate.
    """
    with h5py.File(RangeFile(f"{BASE}{dataset}/{run}/{fname}", 128 << 10), "r") as h:
        o = h.get(kind)
        if o is None or not isinstance(o, h5py.Dataset) or o.ndim != 1 or o.size < 2:
            return None
        v = np.asarray(o[()], dtype="float64")
    return (v / 100.0) if kind == "pressure" else v


def _level_suffix(kind, group, unit):
    """Filename suffix for a group of levels: _p850hPa, _p850-500hPa, _h1000m."""
    if len(group) == 1:
        return f"_{kind}{group[0]:g}{unit}"
    return f"_{kind}{'-'.join(f'{x:g}' for x in group)}{unit}"


def _level_groups(kind, dataset, run, parsed, want, explicit):
    """Work out the level groups for one vertical level type.

    explicit : groups the user asked for (already parsed) - wins outright
    want     : the user's --plevels / --hlevels selection
    otherwise: every level the source file actually carries
    """
    if explicit:
        return [list(g) for g in explicit]
    if want:
        return [[l] for l in want]
    # no explicit selection - read the levels off a representative file
    for f, lead, tok, size in parsed:
        d = mo_vars.describe(tok)
        if not d or d["level"] != kind:
            continue
        v = _level_coord(dataset, run, f, kind)
        if v is not None and v.size:
            return [[float(x)] for x in v]
    return []


def _build_skeleton(dst, h5, box, nlead=None, levels=None):
    from netCDF4 import Dataset  # noqa
    lat = np.asarray(h5["latitude"][()], dtype="float64")
    lon = np.asarray(h5["longitude"][()], dtype="float64")
    la0, la1, lo0, lo1 = box
    nlat, nlon = la1 - la0 + 1, lo1 - lo0 + 1

    vdim = None
    for cand in ("pressure", "height"):
        o = h5.get(cand)
        if o is not None and isinstance(o, h5py.Dataset) and o.ndim == 1 and o.size > 1:
            vdim = cand; break

    # Level selection: pull the requested levels out of the vertical coordinate,
    # keeping the user's ordering.
    vdim, vsel = level_selection(h5, levels)

    if vdim:
        dst.createDimension(vdim, len(h5[vdim]) if isinstance(vsel, slice) else len(vsel))
    if nlead: dst.createDimension("time", nlead)
    dst.createDimension("latitude", nlat)
    dst.createDimension("longitude", nlon)
    dst.createDimension("bnds", 2)

    if vdim:
        v = dst.createVariable(vdim, "f4", (vdim,))
        v[:] = np.asarray(h5[vdim][()], dtype="f4")[vsel]
        _copy_attrs(h5[vdim], v)

    la = dst.createVariable("latitude", "f4", ("latitude",))
    la[:] = lat[la0:la1 + 1].astype("f4"); _copy_attrs(h5["latitude"], la)
    lo = dst.createVariable("longitude", "f4", ("longitude",))
    lo[:] = lon[lo0:lo1 + 1].astype("f4"); _copy_attrs(h5["longitude"], lo)

    for nm, idx in (("latitude_bnds", slice(la0, la1 + 1)),
                    ("longitude_bnds", slice(lo0, lo1 + 1))):
        if nm in h5:
            b = dst.createVariable(nm, "f4", (nm.split("_")[0], "bnds"))
            b[:] = np.asarray(h5[nm][idx], dtype="f4")

    if "latitude_longitude" in h5:
        g = dst.createVariable("latitude_longitude", "i4", ())
        g[...] = 0; _copy_attrs(h5["latitude_longitude"], g)

    if nlead:
        t = dst.createVariable("time", "i8", ("time",))
        t.units = "seconds since 1970-01-01 00:00:00"
        t.standard_name = "time"; t.calendar = "standard"
        fp = dst.createVariable("forecast_period", "i4", ("time",))
        fp.units = "seconds"; fp.standard_name = "forecast_period"
    else:
        for nm, dt in (("time", "i8"), ("forecast_period", "i4"), ("forecast_reference_time", "i8")):
            if nm in h5:
                v = dst.createVariable(nm, dt, ())
                v[...] = np.asarray(h5[nm][()]).astype(dt)
                _copy_attrs(h5[nm], v)
    return vdim


def _datavars(h5):
    out = []
    for nm, o in h5.items():
        if not isinstance(o, h5py.Dataset) or o.ndim < 2: continue
        at = {k: dec(v) for k, v in o.attrs.items()}
        if at.get("CLASS"): continue
        if nm in ("latitude", "longitude", "latitude_bnds", "longitude_bnds"): continue
        out.append((nm, o.ndim, o.dtype, at))
    return out


# ------------------------------------------------------------------- jobs ---
def crop_group(job):
    """Crop one variable group (one or more lead times) -> writes one NetCDF.

    job = (dataset, run, token, [(fname, lead), ...], box, outdir, outname, merge)
    """
    from netCDF4 import Dataset
    dataset, run, token, items, box, outdir, outname, merge, window, src_size, levels, skip_existing = job
    la0, la1, lo0, lo1 = box
    slat, slon = slice(la0, la1 + 1), slice(lo0, lo1 + 1)
    outpath = os.path.join(outdir, outname)
    t0 = time.time()
    src_bytes = 0

    if skip_existing and os.path.exists(outpath) and os.path.getsize(outpath) > 0:
        return (outpath, 0, os.path.getsize(outpath), la1 - la0 + 1, lo1 - lo0 + 1, 0.0)

    # Write to a .part file and rename at the end, so a half-written file is
    # never visible to --skip-existing or to a reader.
    tmppath = outpath + ".part"

    # Adaptive read-ahead. h5py issues many small scattered reads for HDF5
    # metadata (superblock, object headers, chunk index), and every miss costs a
    # full window, so a huge window multiplies the metadata cost. 128 KB keeps
    # the request count low without dragging in megabytes of metadata.
    if window == 0:
        window = 128 << 10

    # pass 1: schema + skeleton from the first lead time
    fh = RangeFile(f"{BASE}{dataset}/{run}/{items[0][0]}", window)
    dst = Dataset(tmppath, "w", format="NETCDF4")
    with h5py.File(fh, "r") as h5:
        for k, v in h5.attrs.items():
            if k == "_NCProperties": continue
            try: dst.setncattr(k, dec(v))
            except Exception: pass
        vdim = _build_skeleton(dst, h5, box, len(items) if merge else None, levels)
        dvs = _datavars(h5)
        for nm, ndim, dtype, at in dvs:
            names = ([vdim, "latitude", "longitude"] if ndim == 3 else ["latitude", "longitude"])
            if merge: names = ["time"] + names
            names = [n for n in names if n in dst.dimensions]
            fv = at.get("_FillValue", None)
            kw = {"fill_value": fv} if fv is not None else {}
            # normalise endianness (source is big-endian; netCDF4 warns on mismatch)
            nd = np.dtype(dtype).newbyteorder("=")
            # keep the source chunking so compression behaves the same
            src_chunks = None
            if nm in h5 and isinstance(h5[nm], h5py.Dataset):
                src_chunks = h5[nm].chunks
            if src_chunks:
                ch = []
                for i, nmv in enumerate(names):
                    c = src_chunks[i] if i < len(src_chunks) else None
                    ch.append(min(c, len(dst.dimensions[nmv])) if c else len(dst.dimensions[nmv]))
                kw["chunksizes"] = tuple(ch)
            if nd.kind == "f" or nd.kind == "i":
                kw.update(zlib=True, complevel=4)
            ov = dst.createVariable(nm, nd.type, tuple(names), **kw)
            for k, v in at.items():
                if k in SKIP_ATTRS: continue
                try: ov.setncattr(k, v)
                except Exception: pass
        if merge:
            frt = dst.createVariable("forecast_reference_time", "i8", ())
            frt.units = "seconds since 1970-01-01 00:00:00"
            frt.standard_name = "forecast_reference_time"; frt.calendar = "standard"
        src_bytes += fh.nbytes

    for ti, (fname, lead, _sz) in enumerate(items):
        f2 = RangeFile(f"{BASE}{dataset}/{run}/{fname}", window)
        with h5py.File(f2, "r") as h5:
            # re-derive the level selection from this lead time (identical layout)
            _vd, vsel = level_selection(h5, levels)
            for nm, ndim, dtype, at in dvs:
                if ndim == 3:
                    sel = (vsel, slat, slon) if not isinstance(vsel, slice) else (slice(None), slat, slon)
                else:
                    sel = (slat, slon)
                data = np.asarray(h5[nm][sel])
                ov = dst.variables[nm]
                if merge: ov[ti, ...] = data
                else: ov[...] = data
            if merge:
                dst.variables["time"][ti] = np.asarray(h5["time"][()])
                dst.variables["forecast_period"][ti] = np.asarray(h5["forecast_period"][()])
                dst.variables["forecast_reference_time"][...] = np.asarray(h5["forecast_reference_time"][()])
        src_bytes += f2.nbytes
    dst.close()
    os.replace(tmppath, outpath)
    return (outpath, src_bytes, os.path.getsize(outpath), la1 - la0 + 1, lo1 - lo0 + 1,
            time.time() - t0)


def safe_crop(job):
    """Run one job; a failure must not take the whole run down."""
    try:
        return crop_group(job), None
    except Exception as e:
        return None, (job[6], repr(e))


# ------------------------------------------------------------------- main ---
def _exit_cleanly(code=0):
    """Leave without running interpreter shutdown.

    On the Linux runners, netCDF4 (pulled in by xarray for the JSON export) and
    h5py (the range reader) each bring their own HDF5 build. With both loaded,
    HDF5's atexit handlers can double-free and abort the interpreter with
    "double free or corruption (!prev)" / exit code 134 - but only *after* every
    file has been written and closed. Calling _exit() skips those handlers and
    keeps the run's result; without it the step fails despite having succeeded.
    """
    for s in (sys.stdout, sys.stderr):
        try: s.flush()
        except Exception: pass
    os._exit(code)


def main():
    print(f"mo_crop.py {BUILD}", flush=True)
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", default="global-deterministic-10km")
    ap.add_argument("--run", default="LATEST")
    ap.add_argument("--lat", nargs=2, type=float, default=None, metavar=("MIN", "MAX"))
    ap.add_argument("--lon", nargs=2, type=float, default=None, metavar=("MIN", "MAX"))
    ap.add_argument("--out", default="cropped")
    ap.add_argument("--vars", default=None,
                    help="comma-separated variables (base name or file token)")
    ap.add_argument("--groups", default=None,
                    help="comma-separated groups to include: " + ",".join(mo_vars.GROUPS))
    ap.add_argument("--exclude-groups", default=None)
    ap.add_argument("--exclude-vars", default=None)
    ap.add_argument("--level-types", default=None,
                    help="comma-separated: surface,pressure,height")
    ap.add_argument("--periods", default=None,
                    help="restrict accumulation variants: PT01H,PT03H,PT06H")
    ap.add_argument("--max-lead", type=int, default=None)
    ap.add_argument("--lead-every", type=int, default=1, metavar="HOURS",
                    help="keep every Nth forecast hour (default 1 = every lead "
                         "the archive has). The archive is hourly to 48 h, so "
                         "--lead-every 3 cuts a 0-48 h run from 49 to 17 steps.")
    ap.add_argument("--plevels", nargs="+", type=float, default=None,
                    help="pressure levels in hPa to keep, e.g. --plevels 850 500 200")
    ap.add_argument("--hlevels", nargs="+", type=float, default=None,
                    help="height levels in metres to keep, e.g. --hlevels 1000 2000")
    ap.add_argument("--split-levels", action="store_true",
                    help="write one file per vertical level instead of one file "
                         "holding every level (pressure and height variables)")
    ap.add_argument("--level-groups", nargs="+", default=None, metavar="LEVELS",
                    help="split pressure-level variables into these groups, one "
                         "file each, e.g. --level-groups 850,500 200")
    ap.add_argument("--list-vars", action="store_true", help="print the catalogue and exit")
    ap.add_argument("--list-levels", action="store_true",
                    help="print the available vertical levels for this run and exit")
    ap.add_argument("--config", default=None,
                    help="JSON file with any of the selection options")
    ap.add_argument("--merge", action="store_true")
    ap.add_argument("--workers", type=int, default=max(2, (os.cpu_count() or 4)))
    ap.add_argument("--window", type=int, default=0,
                    help="HTTP read-ahead window in bytes (0 = adaptive by file size)")
    ap.add_argument("--skip-existing", action="store_true",
                    help="leave files that already exist alone (resumable)")
    ap.add_argument("--to-json", action="store_true",
                    help="also write a .json next to each cropped NetCDF")
    ap.add_argument("--max-json-mb", type=float, default=20.0,
                    help="with --to-json, split each output into parts no bigger "
                         "than this many MB (0 = never split). Default 20 MB, "
                         "safely under GitHub's 25 MB file limit.")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    # a --config file can supply any of the selection options
    if a.config:
        # utf-8-sig also tolerates a BOM (Windows editors like to add one)
        with open(a.config, encoding="utf-8-sig") as fh:
            cfg = json.load(fh)
        for k, v in cfg.items():
            if not hasattr(a, k):
                continue
            cur = getattr(a, k)
            if cur in (None, False, []) and v not in (None, False, []):
                setattr(a, k, v)

    if a.list_vars:
        mo_vars.print_catalogue()
        return

    if a.lat is None or a.lon is None:
        if not a.list_levels:
            sys.exit("--lat MIN MAX and --lon MIN MAX are required "
                     "(unless --list-vars / --list-levels)")

    runs = list_runs(a.dataset)
    run = runs[-1] if a.run.upper() == "LATEST" else a.run
    if run not in runs:
        sys.exit(f"run {run} not in archive (latest is {runs[-1]})")

    def split(s):
        if s is None:
            return None
        if isinstance(s, (list, tuple)):
            return [str(x).strip() for x in s if str(x).strip()]
        return [x.strip() for x in s.split(",") if x.strip()]

    groups = split(a.groups)
    exclude_groups = split(a.exclude_groups)
    level_types = split(a.level_types)
    periods = split(a.periods)
    vars_ = split(a.vars)
    exclude_vars = split(a.exclude_vars)

    # ---- which variables ------------------------------------------------
    tokens = mo_vars.select(groups=groups, level_types=level_types, vars_=vars_,
                            exclude_groups=exclude_groups, exclude_vars=exclude_vars,
                            periods=periods)
    if not tokens:
        sys.exit("selection matched no variables - use --list-vars to see the catalogue")

    # ---- which levels ---------------------------------------------------
    levels = {}
    if a.plevels: levels["pressure"] = a.plevels
    if a.hlevels: levels["height"] = a.hlevels

    if a.list_levels:
        print(f"available vertical levels for {a.dataset} run {run}:")
        seen = set()
        for f, size, _ in list_files(a.dataset, run):
            m = FN.match(f)
            if not m: continue
            tok = m.group(3)
            if tok in seen: continue
            if "_on_pressure_levels" not in tok and "_on_height_levels" not in tok:
                continue
            seen.add(tok)
            with h5py.File(RangeFile(f"{BASE}{a.dataset}/{run}/{f}", 128 << 10), "r") as h:
                for cand in ("pressure", "height"):
                    o = h.get(cand)
                    if o is not None and isinstance(o, h5py.Dataset) and o.ndim == 1 and o.size > 1:
                        v = np.asarray(o[()], dtype="float64")
                        sc = 100.0 if cand == "pressure" else 1.0
                        unit = "hPa" if cand == "pressure" else "m"
                        print(f"  {tok:<48s} {cand:<8s} n={v.size:3d} {unit}: "
                              f"{', '.join(f'{x/sc:g}' for x in v)}")
        return

    want = set(tokens)
    parsed = []
    for f, size, _ in list_files(a.dataset, run):
        m = FN.match(f)
        if not m: continue
        vt, lead, tok = m.groups()
        if tok not in want: continue
        if a.max_lead is not None and int(lead) > a.max_lead: continue
        parsed.append((f, int(lead), tok, size))
    if a.lead_every and a.lead_every > 1:
        parsed = [r for r in parsed if r[1] % a.lead_every == 0]
        if not parsed:
            sys.exit(f"--lead-every {a.lead_every} left no lead times "
                     f"(max lead {a.max_lead})")
    parsed.sort(key=lambda r: (r[2], r[1]))

    vgroups = {}
    for f, lead, tok, size in parsed:
        vgroups.setdefault(tok, []).append((f, lead, size))

    # ---- level splitting -------------------------------------------------
    # A pressure- or height-level variable can be written as one file per
    # level, or as one file per group of levels.
    pgroups, hgroups = [], []
    if a.level_groups:
        pgroups = []
        for g in a.level_groups:
            vals = [float(x) for x in str(g).replace(" ", "").split(",") if x]
            if vals:
                pgroups.append(vals)
        if a.plevels:
            flat = sorted({x for g in pgroups for x in g})
            if flat != sorted(a.plevels):
                print(f"  note: --level-groups overrides --plevels "
                      f"({', '.join(f'{x:g}' for x in flat)} vs "
                      f"{', '.join(f'{x:g}' for x in a.plevels)})")
    if a.split_levels:
        if not pgroups:
            pgroups = _level_groups("pressure", a.dataset, run, parsed, a.plevels, None)
        hgroups = _level_groups("height", a.dataset, run, parsed, a.hlevels, None)

    # discover the grid from one representative file
    rep = parsed[0][0]
    with h5py.File(RangeFile(f"{BASE}{a.dataset}/{run}/{rep}"), "r") as h:
        lat = np.asarray(h["latitude"][()], dtype="float64")
        lon = np.asarray(h["longitude"][()], dtype="float64")
    box = box_indices(lat, lon, a.lat[0], a.lat[1], a.lon[0], a.lon[1])
    la0, la1, lo0, lo1 = box
    nlat, nlon = la1 - la0 + 1, lo1 - lo0 + 1
    print(f"dataset {a.dataset}   run {run}")
    print(f"box lat[{a.lat[0]},{a.lat[1]}] lon[{a.lon[0]},{a.lon[1]}] -> "
          f"lat idx {la0}..{la1} ({nlat})  lon idx {lo0}..{lo1} ({nlon})")
    print(f"variables {len(vgroups)}   source files {len(parsed)}   workers {a.workers}")
    print("selection:")
    if groups: print(f"  groups        : {', '.join(groups)}")
    if level_types: print(f"  level types   : {', '.join(level_types)}")
    if periods: print(f"  periods       : {', '.join(periods)}")
    if vars_: print(f"  explicit vars : {', '.join(vars_)}")
    if exclude_groups: print(f"  excl. groups  : {', '.join(exclude_groups)}")
    if exclude_vars: print(f"  excl. vars    : {', '.join(exclude_vars)}")
    if a.plevels: print(f"  pressure lvls : {', '.join(f'{x:g}' for x in a.plevels)} hPa")
    if a.hlevels: print(f"  height lvls   : {', '.join(f'{x:g}' for x in a.hlevels)} m")
    if a.max_lead is not None: print(f"  max lead      : {a.max_lead} h")
    if a.lead_every and a.lead_every > 1:
        print(f"  lead step     : every {a.lead_every} h")
    if pgroups:
        print(f"  split lvls    : pressure -> {len(pgroups)} file(s): "
              + ", ".join("-".join(f"{x:g}" for x in g) for g in pgroups))
    if hgroups:
        print(f"  split lvls    : height -> {len(hgroups)} file(s): "
              + ", ".join("-".join(f"{x:g}" for x in g) for g in hgroups))
    # per-group breakdown
    bygrp = {}
    for tok in vgroups:
        d = mo_vars.describe(tok)
        bygrp.setdefault((d["group"], d["level"]), []).append(tok)
    for (g, lv), toks in sorted(bygrp.items()):
        print(f"    {g:<12s} {lv:<9s} {len(toks):3d} variable(s)")

    outdir = os.path.join(a.out, a.dataset, f"{run}_cropped" if a.merge else run)
    os.makedirs(outdir, exist_ok=True)

    jobs = []
    for tok, items in sorted(vgroups.items()):
        d = mo_vars.describe(tok)
        lt = d["level"] if d else "surface"

        # (filename suffix, level override) pairs for this variable
        subs = [("", {})]
        if lt == "pressure" and pgroups:
            subs = [(_level_suffix("p", g, "hPa"), {"pressure": list(g)}) for g in pgroups]
        elif lt == "height" and hgroups:
            subs = [(_level_suffix("h", g, "m"), {"height": list(g)}) for g in hgroups]

        for suffix, over in subs:
            lv = dict(levels)
            lv.update(over)
            if a.merge:
                # one job per variable: all lead times into one time-series file
                jobs.append((a.dataset, run, tok, items, box, outdir,
                             f"{tok}{suffix}.nc", True,
                             a.window, items[0][2], lv, a.skip_existing))
            else:
                # one job per source file: maximum parallelism
                for f, lead, size in items:
                    stem, ext = os.path.splitext(f)
                    jobs.append((a.dataset, run, tok, [(f, lead, size)], box, outdir,
                                 f"{stem}{suffix}{ext}", False,
                                 a.window, size, lv, a.skip_existing))

    if a.dry_run:
        for j in jobs: print("  ", os.path.join(outdir, j[6]))
        return

    # Guard against two instances writing the same directory at once (they
    # would fight over the same output files).
    lock = os.path.join(outdir, ".lock")
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
    except FileExistsError:
        sys.exit(f"another mo_crop run appears to be writing to {outdir}\n"
                 f"(lock file {lock}); delete it if that is not the case")

    def drop_lock():
        try: os.remove(lock)
        except OSError: pass

    # _exit_cleanly() below skips atexit, so this only covers the error paths
    atexit.register(drop_lock)

    import concurrent.futures as cf
    t0 = time.time()
    gs = go = 0
    done = 0
    failed = []

    with cf.ProcessPoolExecutor(max_workers=a.workers) as ex:
        for res, err in ex.map(safe_crop, jobs, chunksize=1):
            done += 1
            if err:
                failed.append(err)
                print(f"  [{done}/{len(jobs)}] FAILED {err[0]}: {err[1]}", flush=True)
                continue
            outpath, sb, ob, nl, nn, secs = res
            gs += sb; go += ob
            if done % 25 == 0 or done == len(jobs):
                print(f"  [{done}/{len(jobs)}] {outpath.split(os.sep)[-1]:<58s} "
                      f"src {sb/1e6:7.1f} MB -> out {ob/1e6:6.1f} MB ({secs:.0f}s) "
                      f"| cum {gs/1e9:.2f} GB -> {go/1e9:.2f} GB", flush=True)
    print(f"\nTOTAL transferred {gs/1e9:.2f} GB  ->  written {go/1e9:.2f} GB  "
          f"in {(time.time()-t0)/60:.1f} min")
    if failed:
        print(f"{len(failed)} file(s) FAILED:")
        for name, e in failed[:20]:
            print(f"   {name}: {e}")
        if len(failed) == len(jobs):
            drop_lock()
            print("every source file failed - nothing to write", flush=True)
            _exit_cleanly(1)

    if a.to_json:
        # Export in a child process. xarray pulls in netCDF4 and this process
        # already has h5py; both ship their own HDF5, and loading the two in one
        # interpreter makes HDF5's exit handlers abort with
        # "double free or corruption (!prev)" *after* every file is written.
        # The child only loads netCDF4, the parent only h5py, so neither can
        # corrupt the other's HDF5 state.
        print("\nwriting JSON alongside the NetCDF files ...", flush=True)
        script = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                              "mo_to_json.py")
        rc = subprocess.call([sys.executable, script, outdir,
                              "--max-mb", str(a.max_json_mb)])
        ncs = sorted(glob.glob(os.path.join(outdir, "*.nc")))
        js = sorted(glob.glob(os.path.join(outdir, "*.json")))
        tot = sum(os.path.getsize(p) for p in js)
        print(f"  {len(ncs)} nc -> {len(js)} json file(s), {tot/1e9:.2f} GB total",
              flush=True)
        if rc != 0:
            drop_lock()
            print(f"JSON export failed (exit {rc})", flush=True)
            _exit_cleanly(rc)

    drop_lock()
    print(f"output: {outdir}", flush=True)
    _exit_cleanly(0)


if __name__ == "__main__":
    main()
