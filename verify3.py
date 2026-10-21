import sys, os, glob
sys.path.insert(0, ".")
import numpy as np, h5py
from netCDF4 import Dataset
from mo_crop import RangeFile, box_indices, level_selection
from mo_aws import BASE

RUN = "20261020T0000Z"
CROPDIR = sys.argv[1] if len(sys.argv) > 1 else "./crop_cfg_test/global-deterministic-10km/" + RUN
LEVELS = {"pressure": [850.0, 500.0, 200.0]}

ok = True
for crop_path in sorted(glob.glob(os.path.join(CROPDIR, "*.nc"))):
    name = os.path.basename(crop_path)
    c = Dataset(crop_path)
    key = f"global-deterministic-10km/{RUN}/{name}"
    with h5py.File(RangeFile(BASE + key, 128 << 10), "r") as h:
        lat = np.asarray(h["latitude"][()], dtype="float64")
        lon = np.asarray(h["longitude"][()], dtype="float64")
        la0, la1, lo0, lo1 = box_indices(lat, lon, 0, 40, 40, 100)
        slat, slon = slice(la0, la1 + 1), slice(lo0, lo1 + 1)
        vd, vsel = level_selection(h, LEVELS)
        print("=" * 84)
        print(name, f"({os.path.getsize(crop_path)/1e6:.2f} MB)  vdim={vd}")
        if vd:
            cp = np.asarray(c.variables[vd][:])
            cs = cp / 100.0 if vd == "pressure" else cp
            print("   cropped levels:", [f"{x:g}" for x in cs])
            good = np.allclose(cs, [850, 500, 200])
            print("   levels correct:", good); ok &= good
        for vn, o in h.items():
            if not isinstance(o, h5py.Dataset) or o.ndim < 2: continue
            if o.attrs.get("CLASS"): continue
            if vn not in c.variables: continue
            if vn.endswith("_bnds"):
                sel = slat if vn.startswith("latitude") else slon
            elif o.ndim == 3:
                sel = (vsel, slat, slon) if not isinstance(vsel, slice) else (slice(None), slat, slon)
            else:
                sel = (slat, slon)
            src = np.asarray(o[sel])
            cmp_ = np.asarray(c.variables[vn][...])
            same = src.shape == cmp_.shape and np.array_equal(
                np.nan_to_num(src, nan=-9999.0), np.nan_to_num(cmp_, nan=-9999.0))
            print(f"   {vn:<42s} {str(src.shape):<18s} EXACT MATCH: {same}")
            ok &= same
    c.close()

print("\n" + ("ALL CHECKS PASSED" if ok else "MISMATCH DETECTED"))
