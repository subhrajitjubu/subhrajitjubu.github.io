import json, collections

def s(v):
    if isinstance(v, str) and v.startswith("b'") and v.endswith("'"): return v[2:-1]
    return v

skip = {"latitude","longitude","latitude_bnds","longitude_bnds","bnds","forecast_period",
        "forecast_reference_time","time","latitude_longitude","projection_x_coordinate",
        "projection_y_coordinate","height","pressure","flag"}

rows = []
for fn in ("meta_10km_h5.json", "meta_missing.json", "meta_heightasl.json"):
    data = json.load(open(fn))
    if isinstance(data, dict): data = [data]
    for e in data:
        if "error" in e:
            print("ERR", e["key"], e["error"]); continue
        tok = e["key"].split("M-", 1)[1][:-3]
        for vn, v in e["datasets"].items():
            if vn in skip: continue
            if len(v["shape"]) < 2: continue
            a = v["attrs"]
            if "CLASS" in a: continue
            rows.append({"token": tok, "netcdf_var": vn,
                         "units": s(a.get("units","")), "std_name": s(a.get("standard_name","")),
                         "long_name": s(a.get("long_name","")), "shape": v["shape"],
                         "size_mb": e["size_bytes"]/1e6})

# merge, prefer first occurrence per token
merged = {}
for r in sorted(rows, key=lambda r: (r["token"], "flag" in r["netcdf_var"])):
    merged.setdefault(r["token"], r)

# drop 'flag' pseudo-vars (status flags, not data)
final = [r for r in merged.values() if r["netcdf_var"] != "flag"]
final.sort(key=lambda r: r["token"])

print(f"{'file variable token':<50s} {'netCDF variable':<52s} {'units':<10s} {'shape':<20s} MB")
print("-"*150)
for r in final:
    print(f"{r['token']:<50s} {r['netcdf_var']:<52s} {r['units']:<10s} {str(r['shape']):<20s} {r['size_mb']:.0f}")
print(f"\n{len(final)} file tokens described; "
      f"{len({r['token'].split('-PT')[0] for r in final})} base variables")

json.dump(final, open("var_units_all.json", "w"), indent=1)

# sanity: every archive token covered?
per_run = json.load(open("run_index_10km.json"))
FN = __import__("re").compile(r"^\d{8}T\d{4}Z-PT\d+H\d+M-(.+)\.nc$")
all_tok = {m.group(1) for f in per_run.values() for n, s in f for m in [FN.match(n)] if m}
covered = {r["token"] for r in final}
print("archive tokens:", len(all_tok), " covered:", len(all_tok & covered),
      " uncovered:", sorted(all_tok - covered))
