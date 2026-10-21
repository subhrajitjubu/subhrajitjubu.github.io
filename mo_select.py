"""
mo_select.py - interactive toggle picker for Met Office model variables.

Walks you through the catalogue in sections (surface / pressure / height),
lets you toggle individual variables on and off, choose the vertical levels,
and writes a selection JSON that mo_crop.py can consume with --config.

    python mo_select.py                          # pick surface variables
    python mo_select.py --section all            # surface + pressure + height
    python mo_select.py --section pressure       # pressure-level variables
    python mo_select.py --out selection.json     # where to save
    python mo_select.py --non-interactive --vars wind_speed_at_10m ...
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mo_vars

try:
    import colorama
    colorama.just_fix_windows_console()
except Exception:
    pass

# ------------------------------------------------------------------ colour ---
class C:
    reset = "\033[0m"; bold = "\033[1m"; dim = "\033[2m"
    red = "\033[31m"; green = "\033[32m"; yellow = "\033[33m"
    blue = "\033[34m"; cyan = "\033[36m"; white = "\033[37m"


def hr(ch="=", n=78):
    return ch * n


# ------------------------------------------------------------------- state ---
class Picker:
    def __init__(self, lat, lon, lead, periods, level_types):
        self.lat, self.lon, self.lead, self.periods = lat, lon, lead, periods
        self.level_types = level_types
        self.selected = set()          # chosen file tokens
        self.plevels = []
        self.hlevels = []
        self.sections = []             # [(title, kind, [(token, base, group, units)])]
        self.current = 0

    # -- section construction ------------------------------------------------
    def build(self):
        want = set(self.level_types)
        for kind, title in (("surface", "SURFACE VARIABLES"),
                            ("pressure", "PRESSURE-LEVEL VARIABLES"),
                            ("height", "HEIGHT-LEVEL VARIABLES")):
            if kind not in want:
                continue
            rows = []
            for c in mo_vars.CATALOGUE:
                base, group, level, netcdf, units = c[0], c[1], c[2], c[3], c[4]
                if level != kind:
                    continue
                for tok in mo_vars.tokens_for(base):
                    rows.append((tok, base, group, units, netcdf))
            rows.sort(key=lambda r: (r[2], r[0]))
            if rows:
                self.sections.append((title, kind, rows))
        # default: nothing selected
        for _, _, rows in self.sections:
            for tok, *_ in rows:
                self.selected.discard(tok)

    # -- helpers --------------------------------------------------------------
    def current_rows(self):
        return self.sections[self.current][2]

    def toggle(self, tok):
        if tok in self.selected:
            self.selected.discard(tok)
        else:
            self.selected.add(tok)

    def set_all(self, on):
        for _, _, rows in self.sections:
            for tok, *_ in rows:
                if on:
                    self.selected.add(tok)
                else:
                    self.selected.discard(tok)

    def toggle_group(self, g):
        rows = [r for _, _, rs in self.sections for r in rs if r[2] == g]
        all_on = all(r[0] in self.selected for r in rows)
        for r in rows:
            if all_on:
                self.selected.discard(r[0])
            else:
                self.selected.add(r[0])

    def parse_spec(self, spec):
        """'1,3,5-9' -> set of 1-based indices"""
        out = set()
        for part in spec.split(","):
            part = part.strip()
            if not part:
                continue
            if "-" in part:
                a, b = part.split("-", 1)
                try:
                    out.update(range(int(a), int(b) + 1))
                except ValueError:
                    pass
            else:
                try:
                    out.add(int(part))
                except ValueError:
                    pass
        return out

    # -- rendering ------------------------------------------------------------
    def draw(self):
        title, kind, rows = self.sections[self.current]
        print()
        print(hr())
        print(f" {C.bold}{title}{C.reset}  "
              f"({C.cyan}{len(self.selected)}{C.reset} selected overall)   "
              f"section {self.current+1}/{len(self.sections)}")
        print(hr("-"))
        last_group = None
        for i, (tok, base, group, units, netcdf) in enumerate(rows, 1):
            if group != last_group:
                last_group = group
                print(f"  {C.dim}--- {group} ---{C.reset}")
            mark = f"{C.green}[x]{C.reset}" if tok in self.selected else f"{C.dim}[ ]{C.reset}"
            print(f"  {mark} {i:>3d}  {tok:<56s} {C.dim}{units:<8s}{C.reset}")
        print(hr("-"))
        print(f" {C.yellow}levels{C.reset}: "
              f"pressure={self.plevels if self.plevels else 'all'}  "
              f"height={self.hlevels if self.hlevels else 'all'}")
        print(f" {C.yellow}box{C.reset}: lat {self.lat[0]}..{self.lat[1]}  "
              f"lon {self.lon[0]}..{self.lon[1]}   "
              f"{C.yellow}lead{C.reset}: 0..{self.lead}h   "
              f"{C.yellow}periods{C.reset}: {','.join(self.periods) if self.periods else 'all'}")
        print(hr("-"))
        print(" toggle> number | range (1-5) | comma list | "
              "'a' all on | 'n' all off | 'g <group>' | "
              "'c' next section | 'q' done")

    # -- interaction ----------------------------------------------------------
    def run(self):
        self.build()
        if not self.sections:
            print("nothing to choose from")
            return
        while True:
            self.draw()
            try:
                spec = input("> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not spec:
                break
            low = spec.lower()
            if low in ("q", "quit", "done", "exit"):
                break
            if low in ("a", "all"):
                self.set_all(True); continue
            if low in ("n", "none"):
                self.set_all(False); continue
            if low in ("c", "next"):
                self.current = (self.current + 1) % len(self.sections); continue
            if low == "p":          # cycle previous section
                self.current = (self.current - 1) % len(self.sections); continue
            if low.startswith("g "):
                g = spec[2:].strip()
                if g in mo_vars.GROUPS:
                    self.toggle_group(g)
                else:
                    print(f"  ! unknown group {g!r}; try one of {', '.join(mo_vars.GROUPS)}")
                continue
            if low.startswith("pl "):     # set pressure levels
                self.plevels = [float(x) for x in spec[3:].replace(",", " ").split()]
                continue
            if low.startswith("hl "):     # set height levels
                self.hlevels = [float(x) for x in spec[3:].replace(",", " ").split()]
                continue
            if low.startswith("lead "):
                try:
                    self.lead = int(spec[5:].strip())
                except ValueError:
                    print("  ! lead must be an integer number of hours")
                continue
            idxs = self.parse_spec(spec)
            if not idxs:
                print("  ! could not parse that")
                continue
            rows = self.current_rows()
            for i in idxs:
                if 1 <= i <= len(rows):
                    self.toggle(rows[i-1][0])
                else:
                    print(f"  ! index {i} out of range (1..{len(rows)})")

    # -- output ---------------------------------------------------------------
    def to_config(self):
        cfg = {
            "vars": sorted(self.selected),
            "lat": list(self.lat),
            "lon": list(self.lon),
            "max_lead": self.lead,
        }
        if self.periods:
            cfg["periods"] = list(self.periods)
        if self.plevels:
            cfg["plevels"] = list(self.plevels)
        if self.hlevels:
            cfg["hlevels"] = list(self.hlevels)
        return cfg

    def summary(self):
        toks = sorted(self.selected)
        bygrp = {}
        for t in toks:
            d = mo_vars.describe(t)
            bygrp.setdefault((d["group"], d["level"]), []).append(t)
        print()
        print(hr("="))
        print(f" SELECTION: {len(toks)} file token(s)")
        for (g, lv), ts in sorted(bygrp.items()):
            print(f"   {g:<12s} {lv:<9s} {len(ts):3d}  {', '.join(ts[:4])}"
                  f"{' ...' if len(ts) > 4 else ''}")
        print(hr("="))


# -------------------------------------------------------------------- main ---
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--section", default="surface",
                    choices=["surface", "pressure", "height", "all"])
    ap.add_argument("--lat", nargs=2, type=float, default=[0.0, 40.0])
    ap.add_argument("--lon", nargs=2, type=float, default=[40.0, 100.0])
    ap.add_argument("--lead", type=int, default=48)
    ap.add_argument("--periods", default="PT01H,PT03H",
                    help="comma-separated period variants, or 'all'")
    ap.add_argument("--out", default="selection.json")
    ap.add_argument("--non-interactive", action="store_true")
    ap.add_argument("--vars", default=None, help="comma-separated (non-interactive)")
    ap.add_argument("--plevels", nargs="*", type=float, default=None)
    ap.add_argument("--hlevels", nargs="*", type=float, default=None)
    a = ap.parse_args()

    periods = ([p.strip() for p in a.periods.split(",") if p.strip()]
               if a.periods.lower() != "all" else None)
    kinds = (["surface", "pressure", "height"] if a.section == "all" else [a.section])

    p = Picker(a.lat, a.lon, a.lead, periods, kinds)

    if a.non_interactive:
        if a.vars:
            for v in a.vars.split(","):
                v = v.strip()
                toks = mo_vars.tokens_for(v, periods) if v in mo_vars.BY_BASE else [v]
                p.selected.update(toks)
        else:
            p.set_all(True)
        p.plevels = a.plevels or []
        p.hlevels = a.hlevels or []
    else:
        p.plevels = a.plevels or []
        p.hlevels = a.hlevels or []
        p.run()

    p.summary()
    cfg = p.to_config()
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh, indent=2)
    print(f"written: {a.out}")
    print()
    print("download with:")
    print(f"  python mo_crop.py --config {a.out} --workers 12 --skip-existing")
    print()
    print("or explicitly:")
    vt = cfg["vars"]
    v = ",".join(vt) if len(vt) <= 4 else f"{vt[0]},{vt[1]},{vt[2]},... ({len(vt)} total)"
    extra = ("--plevels " + " ".join(str(x) for x in cfg["plevels"])) if cfg.get("plevels") else ""
    extra += (" --hlevels " + " ".join(str(x) for x in cfg["hlevels"])) if cfg.get("hlevels") else ""
    print(f"  python mo_crop.py --lat {cfg['lat'][0]} {cfg['lat'][1]} "
          f"--lon {cfg['lon'][0]} {cfg['lon'][1]} --max-lead {cfg['max_lead']} "
          f"--vars {v} {extra} --out ./cropped")


if __name__ == "__main__":
    main()
