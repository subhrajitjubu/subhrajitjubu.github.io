"""
gfs_download.py - NOAA GFS 0.25 deg pipeline, UKMO-style.

Download: download_gfs_curl.sh pulls NOMADS GRIB2 parts with curl (one file
per forecast hour, all variables, region 60-100E / 0-40N).
Processing (Python, variable-wise): cfgrib/xarray reads each GRIB and emits
one JSON per variable+level (time-stacked), unit-converted, via
save_json.save_da_json (same layout as UKMO/: <fm>_partNNofNN.json when
large, else <fm>.json, always + <fm>_manifest.json).

  python gfs_download.py --date 20261108 --cycle 00 --max-lead 72
  python gfs_download.py --skip-download --keep-grib   # GRIBs already in place

Downloaded GRIBs are deleted after conversion (pass --keep-grib to retain).
Output stems are what GeoHEATMap loads as ../GFS/<stem>.
"""
import argparse
import os
import subprocess
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import xarray as xr

from save_json import save_da_json

BUILD = "2026-11-08-gfs-curl-2"
CYCLES = ("00", "06", "12", "18")

# Output stem -> cfgrib filter, cfgrib data var, unit conversion, units.
# Converted to human units to match UKMO/GeoHEATMap conventions.
def _surf(filt, var, s, o, u):
    return dict(filter=filt, var=var, scale=s, offset=o, units=u)

VARIABLES = {
    # --- surface / single level -------------------------------------------
    "tmp_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 2},
                      "t2m", 1.0, -273.15, "degC"),
    "dpt_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 2},
                      "d2m", 1.0, -273.15, "degC"),
    "rh_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 2},
                     "r2", 1.0, 0.0, "%"),
    "spfh_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 2},
                       "sh2", 1000.0, 0.0, "g/kg"),
    "u10": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 10},
                 "u10", 1.0, 0.0, "m s-1"),
    "v10": _surf({"typeOfLevel": "heightAboveGround", "stepType": "instant", "level": 10},
                 "v10", 1.0, 0.0, "m s-1"),
    "prmsl": _surf({"typeOfLevel": "meanSea", "stepType": "instant"},
                   "prmsl", 0.01, 0.0, "hPa"),
    "pres_sfc": _surf({"typeOfLevel": "surface", "stepType": "instant"},
                      "sp", 0.01, 0.0, "hPa"),
    "gust_sfc": _surf({"typeOfLevel": "surface", "stepType": "instant"},
                      "gust", 1.0, 0.0, "m s-1"),
    "tmax_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "avg", "level": 2},
                       "tmax", 1.0, -273.15, "degC"),
    "tmin_surf": _surf({"typeOfLevel": "heightAboveGround", "stepType": "avg", "level": 2},
                       "tmin", 1.0, -273.15, "degC"),
    "apcp": _surf({"typeOfLevel": "surface", "stepType": "accum"},
                  "acpcp", 1000.0, 0.0, "mm"),
    "prate": _surf({"typeOfLevel": "surface", "stepType": "avg"},
                   "prate", 3.6e6, 0.0, "mm h-1"),
    "cprat": _surf({"typeOfLevel": "surface", "stepType": "avg"},
                   "cpr", 3.6e6, 0.0, "mm h-1"),
    "crain": _surf({"typeOfLevel": "surface", "stepType": "avg"},
                   "crain", 1000.0, 0.0, "mm"),
    "refc": _surf({"typeOfLevel": "atmosphere", "stepType": "instant"},
                  "refc", 1.0, 0.0, "dBZ"),
    "tcdc": _surf({"typeOfLevel": "atmosphere", "stepType": "instant"},
                  "tcc", 1.0, 0.0, "%"),
}

# --- pressure levels (isobaricInhPa) ---------------------------------------
for _lev in (850, 500, 200):
    for _base, _var, _s, _o, _u in (
        ("tmp", "t", 1.0, -273.15, "degC"),
        ("rh", "r", 1.0, 0.0, "%"),
        ("u", "u", 1.0, 0.0, "m s-1"),
        ("v", "v", 1.0, 0.0, "m s-1"),
        ("gh", "gh", 1.0, 0.0, "m"),
    ):
        VARIABLES[f"{_base}_p{_lev}"] = _surf(
            {"typeOfLevel": "isobaricInhPa", "stepType": "instant", "level": _lev},
            _var, _s, _o, _u)

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


def cleanup_gribs(out):
    import glob as _glob
    n = 0
    for pat in ("*.grib2", "*.grib", "*.idx"):
        for path in _glob.glob(os.path.join(out, pat)):
            try:
                os.remove(path)
                n += 1
            except OSError:
                pass
    print(f"cleanup: removed {n} GRIB/index file(s) from {out}", flush=True)


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
    ap.add_argument("--keep-grib", action="store_true",
                    help="keep downloaded GRIBs (default: delete after conversion)")
    a = ap.parse_args()

    stems = [s.strip() for s in a.vars.split(",")] if a.vars else list(DEFAULT_VARS)
    for s in stems:
        if s not in VARIABLES:
            sys.exit(f"unknown variable {s!r} (see VARIABLES)")

    os.makedirs(a.out, exist_ok=True)

    if not a.skip_download:
        run_downloader(a.date, a.cycle, 0, a.max_lead, a.out)

    leads = list(range(0, a.max_lead + 1, a.lead_every))
    print(f"GFS {a.date} cycle {a.cycle}  leads {len(leads)} hourly steps  out {a.out}")

    # process variable-wise: one output per variable(+level), never merged
    for stem in stems:
        meta = VARIABLES[stem]
        print(f"=== variable {stem} ===", flush=True)
        frames, time_vals = [], []
        for fh in leads:
            path = os.path.join(a.out, f"gfs_60-100E_0-40N_f{fh:03d}.grib2")
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

    if not a.keep_grib:
        cleanup_gribs(a.out)

    print(f"done. JSON in {a.out}/")


if __name__ == "__main__":
    main()
