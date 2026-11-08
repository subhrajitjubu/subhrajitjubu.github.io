"""
gfs_download.py - fetch NOAA GFS 0.25 deg 1-hourly fields from NOAA NOMADS
OpenDAP, cropped to a lat/lon box, mirroring the UKMO mo_crop.py workflow.

  python gfs_download.py --lat 0 40 --lon 40 100 --out GFS --max-lead 60
  python gfs_download.py --date 20261107 --cycle 00 --vars apcpsfc,tmpsfc

Writes one NetCDF per variable (<stem>.nc) into --out, then converts each to
JSON parts + <stem>_manifest.json via save_json.save_da_json (same layout as
UKMO/: <fm>_partNNofNN.json, never a single <fm>.json).

The box follows UKMO_run.yml (lat 0-40, lon 40-100). --lead-every 3 keeps
3-hourly steps (like the ECMWF pipeline) to keep JSON sizes down.
"""
import argparse
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import xarray as xr

from gfs_vars import VARIABLES, DEFAULT_VARS
from save_json import save_da_json

BUILD = "2026-11-08-gfs-nomads-1"
CYCLES = ("00", "06", "12", "18")


def nomads_url(ymd, cycle):
    return f"http://nomads.ncep.noaa.gov:80/dods/gfs_0p25_1hr/gfs{ymd}/gfs_0p25_1hr_{cycle}z"


def fetch(ymd, cycle, var_out, lat0, lat1, lon0, lon1, max_lead, lead_every):
    """Load one variable cropped to the box, as an xarray DataArray."""
    meta = VARIABLES[var_out]
    url = nomads_url(ymd, cycle)
    ds = xr.open_dataset(url, decode_times=True)
    try:
        # NOMADS advertises longitude 0..360; the India box uses 40..100 E.
        da = ds[meta["nomads"]].sel(lon=slice(lon0, lon1), lat=slice(lat0, lat1))
        if "time" in da.dims:
            steps = da.sizes["time"]
            keep = min(max_lead, steps)
            idx = list(range(0, keep, lead_every))
            da = da.isel(time=idx)
        da = da.load()  # fetch now, while the dataset handle is alive
    finally:
        ds.close()
    # ensure a leading `time` axis for save_json's time-splitting
    dims = list(da.dims)
    if "time" not in dims:
        da = da.expand_dims("time")
        da = da.assign_coords(time=xr.DataArray([0], dims=["time"]))
    return da, meta


def convert_units(da, meta):
    out = da.astype("float64") * meta["scale"] + meta["offset"]
    out.attrs = dict(da.attrs)
    out.attrs["units"] = meta["units"]
    return out


def main():
    print(f"gfs_download.py {BUILD}", flush=True)
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date.today().strftime("%Y%m%d"),
                    help="forecast date YYYYMMDD (default: today)")
    ap.add_argument("--cycle", default="00", choices=CYCLES,
                    help="forecast cycle HH (default: 00)")
    ap.add_argument("--lat", nargs=2, type=float, default=(0.0, 40.0), metavar=("MIN", "MAX"))
    ap.add_argument("--lon", nargs=2, type=float, default=(40.0, 100.0), metavar=("MIN", "MAX"))
    ap.add_argument("--out", default="GFS", help="output directory")
    ap.add_argument("--vars", default=None,
                    help="comma-separated output stems (default: all)")
    ap.add_argument("--max-lead", type=int, default=60, help="forecast hours to keep")
    ap.add_argument("--lead-every", type=int, default=3,
                    help="keep every Nth hourly step (3 = 3-hourly, default 3)")
    ap.add_argument("--max-json-mb", type=float, default=15.0,
                    help="split each JSON into parts <= this many MB (default 15)")
    a = ap.parse_args()

    stems = [s.strip() for s in a.vars.split(",")] if a.vars else list(DEFAULT_VARS)
    for s in stems:
        if s not in VARIABLES:
            sys.exit(f"unknown variable {s!r} (see gfs_vars.VARIABLES)")

    os.makedirs(a.out, exist_ok=True)
    print(f"GFS {a.date} cycle {a.cycle}  box lat[{a.lat[0]},{a.lat[1]}] "
          f"lon[{a.lon[0]},{a.lon[1]}]  lead 0-{a.max_lead}h every {a.lead_every}h")

    for stem in stems:
        print(f"  {stem} ...", flush=True)
        da, meta = fetch(a.date, a.cycle, stem,
                         a.lat[0], a.lat[1], a.lon[0], a.lon[1],
                         a.max_lead, a.lead_every)
        da = convert_units(da, meta)
        da = da.rename("data")
        da.attrs["gfs_variable"] = meta["nomads"]
        # NetCDF snapshot next to the JSON (same as mo_crop writing .nc)
        ncpath = os.path.join(a.out, f"{stem}.nc")
        da.to_netcdf(ncpath)
        print(f"    -> {ncpath} dims={dict(da.sizes)}", flush=True)
        # JSON parts + manifest (the geoheatmap contract)
        paths = save_da_json(da, stem, outdir=a.out, decimals=2, indent=None,
                             max_bytes=int(a.max_json_mb * 1e6) if a.max_json_mb else None)
        if not isinstance(paths, list):
            paths = [paths]
        sizes = ", ".join(f"{os.path.getsize(p) / 1e6:.1f} MB" for p in paths)
        print(f"    -> {len(paths)} part(s): {sizes}", flush=True)

    print(f"done. JSON in {a.out}/")


if __name__ == "__main__":
    main()
