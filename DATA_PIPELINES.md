# Data pipelines — one discipline for ECMWF, GFS and UKMO

All weather data workflows follow the same rules, so every run leaves the repo
in the same shape and any workflow can safely read it.

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
4. **Plain push everywhere — no history rewriting.** Every data workflow
   (`ads_for.yaml`, `ads_oo.yaml`, `gfs.yml`, `UKMO_run.yml`) commits and then
   does a normal fast-forward push, rebasing and retrying once if another run
   pushed first. Nothing runs `purge_history.sh` and nothing force-pushes.

   ```bash
   git commit -m "Update … JSON"
   git push origin main || {
     git pull --rebase --autostash origin main
     git push origin main
   }
   ```

   Consequence: `.git` grows by one run's data per run (≈75 MB ECMWF,
   ≈250 MB GFS, ≈1.7 GB UKMO). If pushes start getting rejected for size,
   `purge_history.sh <folder>` is still available as a **manual** cleanup —
   it rewrites history, so re-clone afterwards.

   Workflows that only need the latest tree must take the remote tip with
   `git fetch origin main && git reset --hard FETCH_HEAD`, never a merge-style
   `git pull` on a checkout that may be stale.

## Workflows

| Model  | Workflow             | Data output | Notes |
|--------|----------------------|-------------|-------|
| ECMWF  | `ads_for.yaml`, `ads_oo.yaml` | `srcc/*.json` | CDS notebooks `srcc/plott_*.ipynb`; needs `CDSAPI_KEY` secret |
| GFS    | `gfs.yml`            | `GFS/*.json`  | `bash download_gfs_curl.sh` (hourly 0–72 h) → `gfs_download.py` |
| UKMO   | `UKMO_run.yml`       | `UKMO/*.json` | `mo_crop.py --merge --to-json` from the Met Office S3 archive |

## Checking size

```bash
du -sh .git        # grows by ~one run's data per run now that nothing purges
```

If `.git` (or the remote) grows too much, run the purge manually and
force-push once:

```bash
bash purge_history.sh GFS   # or UKMO
git push --force origin main
```

> Caveat: the purge rewrites history and force-pushes, so only generated
> data paths should ever go through it.
