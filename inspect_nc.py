import urllib.request, os, sys
from netCDF4 import Dataset

BASE = "https://met-office-atmospheric-model-data.s3.eu-west-2.amazonaws.com/"
KEY = sys.argv[1]

out = os.path.basename(KEY)
if not os.path.exists(out):
    with urllib.request.urlopen(BASE + KEY, timeout=300) as r, open(out, "wb") as f:
        f.write(r.read())
print("downloaded", out, os.path.getsize(out), "bytes")

ds = Dataset(out, "r")
print("\n=== GLOBAL ATTRS ===")
for a in ds.ncattrs():
    v = ds.getncattr(a)
    print(f"  {a} = {v}")

print("\n=== DIMENSIONS ===")
for k, v in ds.dimensions.items():
    print(f"  {k}: {len(v)}{' (unlimited)' if v.isunlimited() else ''}")

print("\n=== VARIABLES ===")
for k, v in ds.variables.items():
    print(f"\n  {k}  {v.dtype}  {v.dimensions}  {v.shape}")
    for a in v.ncattrs():
        print(f"      {a} = {v.getncattr(a)}")

print("\n=== COORD VAR VALUES (first/last) ===")
for k, v in ds.variables.items():
    if k == v.dimensions[0] or (v.ndim == 1 and len(v) <= 40):
        try:
            vals = v[:]
            print(f"  {k}: n={len(vals)}  {list(vals[:4])} ... {list(vals[-4:])}")
        except Exception as e:
            print(f"  {k}: <{e}>")
ds.close()
