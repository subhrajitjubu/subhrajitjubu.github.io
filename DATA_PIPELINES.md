# Data pipelines — one discipline for ECMWF, GFS and UKMO

All weather data workflows follow the same rules so git history never grows
with old forecast runs.

## The rules

1. **Generated data only.** `src/`, `srcc/*.json` (ECMWF — `srcc/IND.json` is the
   exception, it's the boundary, not data), `UKMO/`, `GFS/` hold nothing but
   generated JSON. No hand-edited files in those paths.
2. **Split layout, ≤ 15 MB.** Every variable is written as
   `<fm>_partNNofNN.json` (when large) + `<fm>_manifest.json`.
   GeoHEATMap loads the manifest and merges parts. Never commit a single
   `<fm>.json` for a field that exceeds the budget.
3. **Wipe before write.** Each run deletes the previous JSON first, so a
   changed part count can't leave stale files behind.
4. **ECMWF/ADS: plain push, no history rewrite.** `ads_for.yaml` and
   `ads_oo.yaml` commit and then do a normal fast-forward push (rebase and
   retry if another workflow pushed first). They never run `purge_history.sh`
   and never force-push — a rewritten history made their `git pull` abort with
   exit 128 and lost the run's data.

5. **UKMO / GFS: purge, then force-push.** After committing:

   ```bash
   bash purge_history.sh <folder>   # UKMO | GFS
   git push --force origin main
   ```

   `purge_history.sh` drops every older version of that path from all
   commits and garbage-collects, so `.git` stays the size of **one run's
   data**, not the sum of all runs. `fetch-depth: 0` is required — the
   rewrite needs full history. This is the only reason those workflows
   rewrite history, so any workflow reading the repo must take the remote tip
   with `git fetch origin main && git reset --hard FETCH_HEAD` instead of a
   merge-style `git pull`.

## Workflows

| Model  | Workflow             | Data output | Notes |
|--------|----------------------|-------------|-------|
| ECMWF  | `ads_for.yaml`, `ads_oo.yaml` | `srcc/*.json` | CDS notebooks `srcc/plott_*.ipynb`; needs `CDSAPI_KEY` secret; plain push (no purge) |
| GFS    | `gfs.yml`            | `GFS/*.json`  | `bash download_gfs_curl.sh` (hourly 0–72 h) → `gfs_download.py` |
| UKMO   | `UKMO_run.yml`       | `UKMO/*.json` | `mo_crop.py --merge --to-json` from the Met Office S3 archive |

## Checking size

```bash
du -sh .git        # should be ~one run's data, not growing over time
```

If `.git` does grow (manual data commits, merges), re-run the purge
locally and force-push:

```bash
bash purge_history.sh GFS   # or UKMO
git push --force origin main
```

> Caveat: the purge rewrites history and force-pushes, so only generated
> data paths should ever go through it.
