"""
gfs_vars.py - catalogue of NOAA GFS (0.25 deg, 1-hourly) variables pulled from
NOAA NOMADS OpenDAP.

  NOMADS dataset : gfs_0p25_1hr  (forecast cycles 00 / 06 / 12 / 18 UTC)
  URL pattern    : http://nomads.ncep.noaa.gov:80/dods/gfs_0p25_1hr/gfs<YYYYMMDD>/gfs_0p25_1hr_<HH>z

Only the variables verified in the existing GFS notebooks are listed; add more
as their NOMADS names are confirmed.

Keys are the output file stems written into GFS/ (geoheatmap resolves a
selector value <stem> to <stem>_manifest.json).
"""

# output stem -> {nomads variable, GFS short view name, units, conversion}
VARIABLES = {
    "apcpsfc": {
        "nomads": "apcpsfc",
        "label": "Surface accumulated precipitation",
        "units": "mm",
        # GFS apcpsfc is accumulated since the forecast start (m) -> mm
        "scale": 1000.0,
        "offset": 0.0,
    },
    "tmpsfc": {
        "nomads": "tmpsfc",
        "label": "Surface temperature",
        "units": "degC",
        # GFS tmpsfc is in K -> degC
        "scale": 1.0,
        "offset": -273.15,
    },
    "pressfc": {
        "nomads": "pressfc",
        "label": "Surface pressure",
        "units": "hPa",
        # GFS pressfc is in Pa -> hPa
        "scale": 0.01,
        "offset": 0.0,
    },
    "tcdcaveclm": {
        "nomads": "tcdcaveclm",
        "label": "Total cloud cover",
        "units": "%",
        # GFS tcdcaveclm is already in percent
        "scale": 1.0,
        "offset": 0.0,
    },
}

# default selection (all listed variables)
DEFAULT_VARS = list(VARIABLES)
