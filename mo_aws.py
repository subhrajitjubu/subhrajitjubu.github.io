"""
mo_aws.py - read Met Office atmospheric model data straight from the public
S3 bucket, no AWS account required.

Bucket : s3://met-office-atmospheric-model-data  (eu-west-2, public read)
Datasets:
  global-deterministic-10km  - Global 10 km standard grid, 0-168 h
  uk-deterministic-2km       - UK 2 km standard grid,    0-120 h

Usage:
    import mo_aws as mo
    runs = mo.list_runs("global-deterministic-10km")
    files = mo.list_files("global-deterministic-10km", runs[-1])
    ds = mo.open("global-deterministic-10km", runs[-1], "temperature_on_pressure_levels")
"""
import urllib.request, urllib.parse, io, re, xml.etree.ElementTree as ET
import time

BUCKET = "met-office-atmospheric-model-data"
REGION = "eu-west-2"
BASE = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/"
NS = "{http://s3.amazonaws.com/doc/2006-03-01/}"
DATASETS = ("global-deterministic-10km", "uk-deterministic-2km")


# ---------------------------------------------------------------- listing ---
def _page(prefix="", delimiter="", token=None, max_keys=1000, retries=4):
    q = {"list-type": "2", "max-keys": str(max_keys)}
    if prefix: q["prefix"] = prefix
    if delimiter: q["delimiter"] = delimiter
    if token: q["continuation-token"] = token
    url = BASE + "?" + urllib.parse.urlencode(q)
    last = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                root = ET.fromstring(r.read())
            contents = [(c.find(f"{NS}Key").text,
                         int(c.find(f"{NS}Size").text),
                         c.find(f"{NS}LastModified").text)
                        for c in root.findall(f"{NS}Contents")]
            prefixes = [p.find(f"{NS}Prefix").text for p in root.findall(f"{NS}CommonPrefixes")]
            tr = root.find(f"{NS}IsTruncated")
            nxt = root.find(f"{NS}NextContinuationToken")
            return contents, prefixes, (nxt.text if nxt is not None else None), \
                   (tr is not None and tr.text == "true")
        except Exception as e:
            last = e; time.sleep(2 * (attempt + 1))
    raise last


def _walk(prefix="", delimiter=""):
    token, contents, prefixes = None, [], []
    while True:
        c, p, token, trunc = _page(prefix, delimiter, token)
        contents += c; prefixes += p
        if not trunc or not token: break
    return contents, prefixes


def list_runs(dataset):
    """Return sorted run-timestamp strings, e.g. '20261019T0600Z'."""
    if dataset not in DATASETS:
        raise ValueError(f"unknown dataset {dataset!r}; expected one of {DATASETS}")
    _, prefixes = _walk(f"{dataset}/", "/")
    return sorted(p.rstrip("/").split("/")[-1] for p in prefixes)


def list_files(dataset, run):
    """Return [(filename, size_bytes, last_modified)] for one run folder."""
    contents, _ = _walk(f"{dataset}/{run}/")
    return [(k.split("/")[-1], s, m) for k, s, m in contents]


def list_variables(dataset, run):
    """Return sorted distinct variable tokens for one run, e.g. 'temperature_on_pressure_levels'."""
    pat = re.compile(r"^\d{8}T\d{4}Z-PT\d+H\d+M-(.+)\.nc$")
    return sorted({m.group(1) for f, _, _ in list_files(dataset, run)
                   if (m := pat.match(f))})


def find_file(dataset, run, variable, lead_hour=None, period=None):
    """Locate the object key for a variable / lead time.

    lead_hour : forecast lead in hours (e.g. 24). If None, first match wins.
    period    : accumulation period token, e.g. 'PT03H' for the '-PT03H' variants.
    """
    pat = re.compile(r"^\d{8}T\d{4}Z-PT(\d+)H\d+M-(.+)\.nc$")
    for f, s, _ in list_files(dataset, run):
        m = pat.match(f)
        if not m: continue
        if m.group(2) != variable: continue
        if lead_hour is not None and int(m.group(1)) != lead_hour: continue
        if period is not None and not f.endswith(f"-{period}.nc"): continue
        return f"{dataset}/{run}/{f}", s
    raise KeyError(f"not found: {variable} lead={lead_hour} period={period}")


# ----------------------------------------------------------------- access ---
class HttpFile(io.RawIOBase):
    """Seekable read-only file over HTTP Range requests (no full download)."""

    def __init__(self, url):
        self.url, self.pos = url, 0
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=60) as r:
            self.size = int(r.headers["Content-Length"])

    def seekable(self): return True
    def readable(self): return True
    def writable(self): return False
    def seek(self, off, whence=io.SEEK_SET):
        self.pos = (off if whence == io.SEEK_SET else
                    self.pos + off if whence == io.SEEK_CUR else
                    self.size + off)
        return self.pos
    def tell(self): return self.pos
    def read(self, n=-1):
        if n is None or n < 0: n = self.size - self.pos
        if n <= 0: return b""
        end = min(self.pos + n, self.size) - 1
        req = urllib.request.Request(self.url, headers={"Range": f"bytes={self.pos}-{end}"})
        with urllib.request.urlopen(req, timeout=180) as r:
            data = r.read()
        self.pos += len(data)
        return data
    def readinto(self, b):
        d = self.read(len(b)); b[:len(d)] = d; return len(d)
    def flush(self): pass
    def close(self): pass


def download(dataset, run, variable, lead_hour=None, period=None, dest="."):
    """Download one NetCDF file to disk. Returns the local path."""
    import os
    key, size = find_file(dataset, run, variable, lead_hour, period)
    out = os.path.join(dest, key.split("/")[-1])
    with urllib.request.urlopen(BASE + key, timeout=600) as r, open(out, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    return out, size


def open(dataset, run, variable, lead_hour=None, period=None):
    """Open a NetCDF file lazily over HTTP range requests (h5py-backed).

    Returns an h5py.File. Data arrays are fetched on access, so you only
    pay for the bytes you actually read.
    """
    import h5py
    key, _ = find_file(dataset, run, variable, lead_hour, period)
    return h5py.File(HttpFile(BASE + key), "r")


if __name__ == "__main__":
    import sys
    ds = sys.argv[1] if len(sys.argv) > 1 else DATASETS[0]
    runs = list_runs(ds)
    print(f"{ds}: {len(runs)} runs, {runs[0]} -> {runs[-1]}")
    for v in list_variables(ds, runs[-1]):
        print("  ", v)
