# Cropping Met Office global 10 km data to a lat/lon box, straight from S3

No AWS account needed — the bucket is public-read. The AWS CLI is not required
either; everything here uses the S3 REST API over HTTPS.

## The command

```powershell
python mo_crop.py --lat 0 40 --lon 40 100 --plevels 850 500 200 --out ./cropped --workers 12
```

Writes to `./cropped/global-deterministic-10km/<run>/`, one cropped NetCDF per
source file, mirroring the upstream layout.

## Why it is cheap

The source files are NetCDF4 (HDF5) with `(128,128)` chunking, so a hyperslab read
only touches the chunks that intersect your box. Reads are HTTP Range requests;
`mo_crop.py` adds a 128 KB read-ahead window so HDF5's many small scattered
metadata reads don't each cost a full window.

Measured on the 10 km global grid, box = lat 0–40 / lon 40–100 (427×427 cells,
3.7 % of the grid area):

| file | source | pulled from S3 | cropped output |
|---|---|---|---|
| `temperature_at_screen_level` (2-D) | 7.3 MB | 1.7 MB (23 %) | 0.24 MB |
| `temperature_on_pressure_levels` (3 levels) | 158 MB | 8.2 MB (5 %) | 0.39 MB |
| `wind_speed_on_pressure_levels` (3 levels) | 228 MB | 8.2 MB (4 %) | 0.58 MB |

Output is zlib-compressed with the upstream chunking, so a 37-level global field
lands at 4.3 MB for the cropped box instead of 27 MB raw.

Output is **bit-exact** against the source (verified with `verify2.py`):
`np.array_equal` holds for every data variable, the `flag` status variable, and
the lat/lon coordinate arrays and bounds.

## Options

| flag | meaning |
|---|---|
| `--dataset` | `global-deterministic-10km` (default) or `uk-deterministic-2km` |
| `--run` | run timestamp, e.g. `20261020T0000Z`. Default `LATEST` |
| `--lat MIN MAX` | latitude box in degrees north (required) |
| `--lon MIN MAX` | longitude box in degrees east (required) |
| `--plevels` | pressure levels to keep, in hPa, e.g. `--plevels 850 500 200` |
| `--hlevels` | height levels to keep, in metres, e.g. `--hlevels 1000 2000` |
| `--split-levels` | write one file per vertical level instead of one file holding every level |
| `--level-groups` | split pressure-level variables into these groups, one file each, e.g. `--level-groups 850,500 200` |
| `--vars` | comma-separated variable tokens (default: all) |
| `--max-lead` | only lead times up to this many hours |
| `--lead-every` | keep every Nth forecast hour (default 1; the archive is hourly to 48 h, so `3` gives 0,3,…,48) |
| `--merge` | one NetCDF per variable with a `time` dimension, instead of one per source file |
| `--to-json` | also write a `.json` next to each cropped NetCDF (degC / mm / mm h⁻¹) |
| `--max-json-mb` | with `--to-json`, split each output into parts no bigger than this (default 20 MB, `0` = never split) |
| `--workers` | parallel processes (default = CPU count) |
| `--window` | HTTP read-ahead window in bytes; `0` = adaptive (default) |
| `--dry-run` | list the files that would be written |

## Keeping the JSON under a file-size limit

GitHub refuses a push containing any file over 100 MB and warns from 50 MB, and
the web uploader stops at 25 MB. A 48 h boxed field at 427×427 is roughly 50 MB
of JSON, so `--to-json` splits along the time axis by default:

```powershell
python mo_crop.py --lat 0 40 --lon 40 100 --max-lead 48 --out ./cropped \
    --merge --to-json --split-levels --plevels 850 500 200 \
    --vars temperature_on_pressure_levels --max-json-mb 20
```

```
temperature_on_pressure_levels_p850hPa_part01of02.json   18.8 MB
temperature_on_pressure_levels_p850hPa_part02of02.json   10.2 MB
```

Each part is a complete document with the same `dims` and `attrs`, its own
sliced `time` and `forecast_period` coordinates, and a contiguous block of
forecast steps. Concatenating the parts in order reproduces the unsplit file
exactly. A file that needs no split keeps its plain `<name>.json` name.

With `--max-lead 4` (or `0`) there is a single time step and `drop_time_dim`
removes the time axis, so time splitting cannot shrink the file. In that case a
large level field is split along its vertical axis instead, and each part gets
the matching slice of the `pressure` / `height` coordinate:

```
geopotential_height_on_pressure_levels_part01of03.json   (levels  0-11)
geopotential_height_on_pressure_levels_part02of03.json   (levels 12-23)
geopotential_height_on_pressure_levels_part03of03.json   (levels 24-36)
```

Cheapest way to stay small in the first place is `--split-levels` with an
explicit `--plevels`: three levels of a 48 h field are a few MB per file.

`python mo_to_json.py` takes the same option as `--max-mb`.

## Splitting by level

A pressure- or height-level variable normally lands in one file with all the
selected levels on a vertical axis. Two flags break that up.

```powershell
# one file per level
python mo_crop.py --lat 0 40 --lon 40 100 --vars temperature_on_pressure_levels \
    --plevels 850 500 200 --split-levels --merge --to-json --out ./cropped
```

```
temperature_on_pressure_levels_p850hPa.nc
temperature_on_pressure_levels_p500hPa.nc
temperature_on_pressure_levels_p200hPa.nc
```

```powershell
# one file per group of levels
python mo_crop.py --lat 0 40 --lon 40 100 --vars temperature_on_pressure_levels \
    --level-groups 850,500 200 --merge --to-json --out ./cropped
```

```
temperature_on_pressure_levels_p850-500hPa.nc
temperature_on_pressure_levels_p200hPa.nc
```

Height-level variables split the same way, with an `_h<level>m` suffix:

```
cloud_amount_on_height_levels_h1000m.nc
```

Notes:

- The split happens at download time — each file is cropped straight out of the
  source, so the values are bit-exact against the unsplit file.
- `--level-groups` applies to pressure variables; `--split-levels` applies to
  both. If both are given, the groups win for pressure and the per-level split
  still applies to height variables.
- Without `--plevels` / `--hlevels`, `--split-levels` uses every level the
  source file carries (37 pressure levels, 33 height levels).
- Surface variables have no vertical axis, so they are unaffected.
- In the non-merged layout the suffix is inserted before the `.nc`, e.g.
  `20261020T0700Z-PT0003H00M-temperature_on_pressure_levels_p850hPa.nc`.


## Grid arithmetic

The 10 km grid is 1920 × 2560, lat ±89.9531° (0.09375° step), lon ±179.9297°
(0.140625° step). `mo_crop.py` resolves the box to cell-centre indices:

```
lat 0–40   -> indices 960..1386   (427 points)
lon 40–100 -> indices 1564..1990  (427 points)
```

Cell centres inside the box are kept; the edge cells that straddle the boundary
are excluded. `latitude_bnds`/`longitude_bnds` are cropped to match, so cell
areas are still correct.

## Which run to pick

The archive holds 4 cycles/day, but they are **not** the same length:

- **00Z / 12Z runs → 0–168 h** (the full 7-day forecast)
- **06Z / 18Z runs → 0–66 h or 0–69 h** only

For a complete 0–168 h record, use a 00Z or 12Z run.

## Reading the cropped output

```python
from netCDF4 import Dataset
ds = Dataset("./cropped/global-deterministic-10km/20261020T0000Z/20261020T0300Z-PT0003H00M-temperature_on_pressure_levels.nc")
print(ds.dimensions["pressure"])          # 3
print(ds.variables["pressure"][:] / 100) # [850. 500. 200.] hPa
print(ds.variables["air_temperature"].shape)  # (3, 427, 427)
```

The `flag` variable (`status_flag`, above/below surface pressure) is preserved
alongside the data on pressure-level fields.

## Keeping the git repo small

Overwriting a file with the same name does **not** stop git growing: git stores
content, not filenames, so every daily version stays in history. A 4.5 MB file
rewritten 6 times adds ~9.9 MB to `.git`; deleting the file in a later commit
frees nothing.

`purge_history.sh` keeps only the current version:

```bash
git add -A UKMO/ && git commit -m "Update Met Office 06UTC JSON"
bash purge_history.sh UKMO     # strips older UKMO/*.json out of every commit
git push --force origin main   # history was rewritten
```

```
 day  file MB   .git MB
   1      4.48    1.66
   2      4.48    1.66
   3      4.48    1.66      <- flat, and HEAD still holds the day-3 file
```

It preserves the rest of the history (code commits are untouched) and replaces
the data commit with exactly one. Because it rewrites history, anything cloned
before the rewrite has to be re-cloned, and the branch needs `--force`.

**Caveat:** this frees the space in *your* clone and on the CI runner. A remote
keeps the superseded commits as dangling objects until it garbage-collects; a
bare repo measured above stayed at 3.9 MB after a force-push and dropped to
1.7 MB only after a manual `git gc --prune=now`. GitHub does not let you trigger
that, so server-side storage is not guaranteed to shrink.

## Running in GitHub Actions

`.github/workflows/UKMO_run.yml` runs every 6 hours, resolves the newest run,
crops it into `UKMO/`, then commits, purges old data versions and force-pushes.

Keep the `mo_crop.py` arguments in a bash array:

```bash
opts=(
  --run "$RUN"
  --lat 0 40 --lon 40 100
  --max-lead 48
  --out ./cropped
  --merge --to-json
  --split-levels --plevels 850 500 200
  --periods PT01H
  --max-json-mb 20
  --workers 12
  --vars "$VARS"
)
python mo_crop.py "${opts[@]}"
```

A `#` comment inside a backslash-continued command silently truncates it: the
comment ends the command, and every flag after it becomes a separate (failing)
command. A run written that way started with `--to-json \` followed by
`# --merge \` and therefore ignored `--split-levels`, `--periods`,
`--workers` and `--vars` - it downloaded all 53 variables with 4 workers and no
error, because the Python process aborted first and `bash -e` never reached the
orphaned flags. An array has no continuation to break.

The JSON export runs in a child process (`mo_to_json.py <dir> --max-mb 20`).
On the runners, netCDF4's HDF5 teardown aborts the interpreter with `double free
or corruption (!prev)` *after* every file has been written - the child itself
reproduced this with netCDF4 alone. The child therefore ends with `os._exit()`,
and the parent never loads netCDF4 at all (only h5py) and leaves the same way,
so no process runs HDF5's exit handlers. The parent still treats a non-zero
child status as a failed export.

Because a stale copy of either file once cost a full run (the failure only
surfaced after all 33 files were written), `mo_crop.py` and `mo_to_json.py`
print a `BUILD` line at startup and the workflow fails immediately unless both
`grep -q json-subprocess mo_crop.py` and `grep -q child-exit mo_to_json.py`
match. If you update the workflow, copy both Python files too.

## Related

- `mo_aws.py` — lower-level helper: list runs/files/variables, download a whole
  file, or open one lazily over HTTP range requests.
- `verify2.py` — checks cropped output against the source, byte for byte.
