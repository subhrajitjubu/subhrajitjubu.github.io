"""
gfs_vars.py - catalogue of NOAA GFS (0.25 deg) variables pulled from the
AWS Open Data bucket (noaa-gfs-bdp-pds, atmos NetCDF files).

Keys are the output file stems written into GFS/ (geoheatmap resolves a
selector value <stem> to <stem>_manifest.json). See gfs_download.VARIABLES
for the actual fetch configuration - this module is documentation.
"""

# output stem -> atmos NetCDF variable, conversion, label
VARIABLES = {
    "pressfc": dict(nc="pressfc", units="hPa", label="Surface Pressure"),
    "tmp_surf": dict(nc="tmp (lowest pfull level)", units="degC", label="Surface Temperature"),
    "cld_amt_surf": dict(nc="cld_amt (lowest pfull level)", units="%", label="Cloud Amount (lowest layer)"),
}

DEFAULT_VARS = list(VARIABLES)
