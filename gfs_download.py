"""
gfs_download.py - NOAA GFS 0.25 deg pipeline, UKMO-style.

Download (fast, per project script): download_gfs_curl.sh loops variable-wise
and pulls NOMADS GRIB2 parts with curl - one file per variable per forecast
hour, region 60-100E / 0-40N.
Processing (Python only, from then on): cfgrib/xarray reads each variable's
GRIBs, stacks its hourly steps, unit-converts, and writes JSON via
save_json.save_da_json (same layout as UKMO/: <fm>_partNNofNN.json when
large, else <fm>.json, always + <fm>_manifest.json) - one output per
variable, never merged across variables.

  python gfs_download.py --date 20261108 --cycle 00 --max-lead 72
  python gfs_download.py --skip-download   # GRIBs already in place

Output stems (GeoHEATMap ../GFS/<stem>): tmp_surf, pressfc, cld_amt_surf.
"""
import argparse
import glob
import os
import subprocess
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import xarray as xr

from save_json import save_da_json

BUILD = "2026-11-08-gfs-curl-1"
CYCLES = ("00", "06", "12", "18")

# output stem -> (cfgrib filter_by_keys, data var, unit scale/offset, units)
VARIABLES = {
    "tmp_surf": dict(filter={"typeOfLevel": "heightAboveGround",
                             "stepType": "instant", "level": 2},
                     var="t2m", scale=1.0, offset=-273.15, units="degC"),
    "pressfc": dict(filter={"typeOfLevel": "meanSea", "stepType": "instant"},
                    var="prmsl", scale=0.01, offset=0.0, units="hPa"),
    "cld_amt_surf": dict(filter={"typeOfLevel": "atmosphere", "stepType": "instant"},
                         var="tcc", scale=1.0, offset=0.0, units="%"),
}
DEFAULT_VARS = list(VARIABLES)


def run_downloader(date, cycle, f_start, f_end, out):
    script = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "download_gfs_curl.sh")
    if not os.path.isfile(script):
        sys.exit(f"download script not found: {script}")
    print(f"downloading via {script} ...", flush=True)
    subprocess.run(["bash", script, date, cycle, str(f_start), str(f_end)],
                   cwd=out, check=True)


def read_grib(path, meta):
    ds = xr.open_dataset(path, engine="cfgrib", filter_by_keys=meta["filter"])
    try:
        da = ds[meta["var"]].load()
        lats = np.asarray(da["latitude"].values, dtype="float64")
        lons = np.asarray(da["longitude"].values, dtype="float64")
        arr = np.asarray(da.values, dtype="float64") * meta["scale"] + meta["offset"]
        return arr, lats, lons
    finally:
        ds.close()


def main():
    print(f"gfs_download.py {BUILD}", flush=True)
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=date.today().strftime("%Y%m%d"))
    ap.add_argument("--cycle", default="00", choices=CYCLES)
    ap.add_argument("--out", default="GFS")
    ap.add_argument("--vars", default=None)
    ap.add_argument("--max-lead", type=int, default=72,
                    help="forecast hours to keep (hourly to 72 h = 3 days)")
    ap.add_argument("--lead-every", type=int, default=1,
                    help="keep every Nth hourly step (1 = hourly)")
    ap.add_argument("--max-json-mb", type=float, default=15.0)
    ap.add_argument("--skip-download", action="store_true",
                    help="skip the curl downloader, process GRIBs already in --out")
    a = ap.parse_args()

    stems = [s.strip() for s in a.vars.split(",")] if a.vars else list(DEFAULT_VARS)
    for s in stems:
        if s not in VARIABLES:
            sys.exit(f"unknown variable {s!r} (see VARIABLES)")

    os.makedirs(a.out, exist_ok=True)

    if not a.skip_download:
        run_downloader(a.date, a.cycle, 0, a.max_lead, a.out)

    leads = list(range(0, a.max_lead + 1, a.lead_every))
    print(f"GFS {a.date} cycle {a.cycle}  leads {leads}  out {a.out}")

    for stem in stems:
        meta = VARIABLES[stem]
        print(f"=== variable {stem} ===", flush=True)
        frames, time_vals = [], []
        for fh in leads:
            path = os.path.join(a.out, f"gfs_60-100E_0-40N_f{fh:03d}_{stem}.grib2")
            if not os.path.isfile(path):
                print(f"    f{fh:03d} absent, skipped", flush=True)
                continue
            arr, lats, lons = read_grib(path, meta)
            frames.append(arr)
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
            attrs={"units": meta["units"], "gfs_variable": stem},
        )
        paths = save_da_json(da, stem, outdir=a.out, decimals=2, indent=None,
                             max_bytes=int(a.max_json_mb * 1e6) if a.max_json_mb else None)
        if not isinstance(paths, list):
            paths = [paths]
        sizes = ", ".join(f"{os.path.getsize(p) / 1e6:.1f} MB" for p in paths)
        print(f"    -> {len(paths)} part(s): {sizes}", flush=True)

    print(f"done. JSON in {a.out}/")


if __name__ == "__main__":
    main()
