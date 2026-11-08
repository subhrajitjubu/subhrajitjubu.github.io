"""jobs_fetch.py - snapshot the MET-JOBS RSS feed to jobs_data.json.

The feed server (maillists.reading.ac.uk) sends no CORS headers, so the
Jobs page cannot fetch it directly from a browser. This script runs in
GitHub Actions (see .github/workflows/jobs_run.yml) and commits the
parsed snapshot; the page reads the same-origin JSON instead.
"""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET

RSS_URL = "https://maillists.reading.ac.uk/scripts/wa-READING.exe?RSS&L=MET-JOBS&v=1.0&LIMIT=100"
OUT = "jobs_data.json"
NS = {"rss": "http://purl.org/rss/1.0/", "dc": "http://purl.org/dc/elements/1.1/"}


def main() -> int:
    req = urllib.request.Request(RSS_URL, headers={"User-Agent": "Mozilla/5.0 (jobs snapshot bot)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        xml = resp.read()

    root = ET.fromstring(xml)
    items = []
    for item in root.iter("{http://purl.org/rss/1.0/}item"):
        title = item.findtext("rss:title", default="", namespaces=NS) or "No title"
        link = item.findtext("rss:link", default="", namespaces=NS) or item.get("rdf:about", "#")
        pub = item.findtext("rss:pubDate", default="", namespaces=NS) or item.findtext(
            "dc:date", default="", namespaces=NS) or "Unknown date"
        items.append({"title": title.strip(), "link": link.strip(), "pubDate": pub.strip()})

    if not items:
        print("no <item> entries parsed - refusing to overwrite snapshot", file=sys.stderr)
        return 1

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(items, fh, indent=1, ensure_ascii=False)
        fh.write("\n")
    print(f"wrote {len(items)} items to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
