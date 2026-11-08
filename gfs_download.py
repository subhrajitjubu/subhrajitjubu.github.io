"""
gfs_download.py - fetch NOAA GFS 0.25 deg forecast fields from the AWS Open
Data S3 bucket (noaa-gfs-bdp-pds), cropped to a lat/lon box, mirroring the
UKMO mo_crop.py workflow.

  python gfs_download.py --date 20261107 --cycle 00 --lat 0 40 --lon 40 100 --out GFS

Each forecast hour lives in its own NetCDF (gfs.t<HHz>.atmf<HHH>.nc, several
GB each). Edges are read over HTTP Range requests with h5py, so only the
chunks intersecting the box are transferred - the same trick mo_crop.py uses
for the Met Office files.

Variables (atmos NetCDF names -> output stems):
  pressfc     surface pressure            (Pa -> hPa)
  tmp[level0] surface temperature         (K -> degC)
  cld_amt[0] cloud amount, lowest layer   (fraction -> %)

Writes one NetCDF per variable into --out, then converts each to JSON parts
+ <stem>_manifest.json via save_json.save_da_json (same layout as UKMO/:
<fm>_partNNofNN.json, never a single <fm>.json). 3-hourly steps by default.
"""
import argparse
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import xarray as xr
import h5py

from mo_crop import RangeFile
from save_json import save_da_json

BUILD = "2026-11-08-gfs-s3-1"
BUCKET = "noaa-gfs-bdp-pds"
CYCLES = ("00", "06", "12", "18")

# output stem -> (atmos variable, level index or None for surface-only var,
#                unit conversion scale/offset, units, label)
VARIABLES = {
    "pressfc": dict(nc="pressfc", level=None, scale=0.01, offset=0.0,
                    units="hPa", label="Surface Pressure"),
    "tmp_surf": dict(nc="tmp", level=0, scale=1.0, offset=-273.15,
                     units="degC", label="Surface Temperature"),
    "cld_amt_surf": dict(nc="cld_amt", level=0, scale=100.0, offset=0.0,
                         units="%", label="Cloud Amount (lowest layer)"),
}
DEFAULT_VARS = list(VARIABLES)


def s3_url(ymd, cycle, fh):
    return (f"https://{BUCKET}.s3.amazonaws.com/gfs.{ymd}/{cycle}/atmos/"
            f"gfs.t{cycle}z.atmf{fh:03d}.nc")


def box_slices(h5, lat0, lat1, lon0, lon1):
    """Row/col slice indices for the box, from the 1-D edge profiles."""
    lats = np.asarray(h5["lat"][()])[:, 0]   # (nlat,) along rows
    lons = np.asarray(h5["lon"][()])[0, :]   # (nlon,) along cols
    r0, r1 = np.where((lats >= lat0) & (lats <= lat1))[0][[0, -1]]
    c0, c1 = np.where((lons >= lon0) & (lons <= lon1))[0][[0, -1]]
    return slice(int(r0), int(r1) + 1), slice(int(c0), int(c1) + 1), lats, lons


def fetch_lead(ymd, cycle, fh, stem, box):
    """Read one variable's cropped slice for one forecast hour (None if absent)."""
    import urllib.error
    url = s3_url(ymd, cycle, fh)
    try:
        fh_obj = RangeFile(url, 128 << 10)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None, None, None
        raise
    with h5py.File(fh_obj, "r") as h:
        rs, cs, lats, lons = box_slices(h, *box)
        meta = VARIABLES[stem]
        if meta["level"] is None:
            arr = np.asarray(h[meta["nc"]][0, rs, cs], dtype="float64")
        else:
            arr = np.asarray(h[meta["nc"]][0, meta["level"], rs, cs], dtype="float64")
        return arr, lats[rs], lons[cs]


def main():
    print(f"gfs_download.py {BUILD}", flush=True)
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date.today().strftime("%Y%m%d"))
    ap.add_argument("--cycle", default="00", choices=CYCLES)
    ap.add_argument("--lat", nargs=2, type=float, default=(0.0, 40.0), metavar=("MIN", "MAX"))
    ap.add_argument("--lon", nargs=2, type=float, default=(40.0, 100.0), metavar=("MIN", "MAX"))
    ap.add_argument("--out", default="GFS")
    ap.add_argument("--vars", default=None)
    ap.add_argument("--max-lead", type=int, default=12,
                    help="forecast hours to keep (atmos NetCDF ships 0-12 h)")
    ap.add_argument("--lead-every", type=int, default=3)
    ap.add_argument("--max-json-mb", type=float, default=15.0)
    a = ap.parse_args()

    stems = [s.strip() for s in a.vars.split(",")] if a.vars else list(DEFAULT_VARS)
    for s in stems:
        if s not in VARIABLES:
            sys.exit(f"unknown variable {s!r} (see VARIABLES)")

    os.makedirs(a.out, exist_ok=True)
    box = (a.lat[0], a.lat[1], a.lon[0], a.lon[1])
    print(f"GFS {a.date} cycle {a.cycle}  box lat[{a.lat[0]},{a.lat[1]}] "
          f"lon[{a.lon[0]},{a.lon[1]}]  lead 0-{a.max_lead}h every {a.lead_every}h")

    leads = list(range(0, a.max_lead + 1, a.lead_every))
    for stem in stems:
        meta = VARIABLES[stem]
        print(f"  {stem} ({meta['nc']}) ...", flush=True)
        frames, time_vals = [], []
        for fh in leads:
            arr, lats, lons = fetch_lead(a.date, a.cycle, fh, stem, box)
            if arr is None:
                print(f"    f{fh:03d} absent, skipped", flush=True)
                continue
            frames.append(arr * meta["scale"] + meta["offset"])
            time_vals.append(fh)
            print(f"    f{fh:03d} done", flush=True)
        if not frames:
            print(f"    {stem}: no usable forecast hours, skipped", flush=True)
            continue
        da = xr.DataArray(
            np.stack(frames),
            dims=["time", "latitude", "longitude"],
            coords={
                "time": ("time", time_vals),
                "latitude": ("latitude", lats),
                "longitude": ("longitude", lons),
            },
            name="data",
            attrs={"units": meta["units"], "gfs_variable": meta["nc"],
                   "long_name": meta["label"]},
        )
        ncpath = os.path.join(a.out, f"{stem}.nc")
        da.to_netcdf(ncpath)
        print(f"    -> {ncpath} dims={dict(da.sizes)}", flush=True)
        paths = save_da_json(da, stem, outdir=a.out, decimals=2, indent=None,
                             max_bytes=int(a.max_json_mb * 1e6) if a.max_json_mb else None)
        if not isinstance(paths, list):
            paths = [paths]
        sizes = ", ".join(f"{os.path.getsize(p) / 1e6:.1f} MB" for p in paths)
        print(f"    -> {len(paths)} part(s): {sizes}", flush=True)

    print(f"done. JSON in {a.out}/")


if __name__ == "__main__":
    main()
