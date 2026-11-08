#!/usr/bin/env bash
# GFS hourly download with curl - 3 days, 60-100E, 0-40N
# Pressure: TMP/UGRD/VGRD/HGT/RH at 850/500/200 mb
# Surface: TMP/DPT/RH/SPFH 2m, UGRD/VGRD 10m, PRMSL MSL, PRES/GUST/TMAX/TMIN, APCP/PRATE/CPRAT/ACPCP/CRAIN
# Entire: PWAT/REFC/TCDC
# Each GRIB part is ~1.6 MB (<10 MB limit). NOMADS returns GRIB2 binary via curl.
# Usage:
#   bash download_gfs_curl.sh [DATE YYYYMMDD] [CYCLE 00|06|12|18] [F_START] [F_END]
#   bash download_gfs_curl.sh 20261108 00 0 72
#   bash download_gfs_curl.sh 20261108 00 1 1    # test one file
set -euo pipefail

DATE="${1:-20261108}"
CYCLE="${2:-00}"
F_START="${3:-0}"
F_END="${4:-72}"
MAX_BYTES=$((10 * 1024 * 1024))

# NOMADS GRIB Filter parameters - keep in sync with download_herbie_3days.py SEARCH
VARS="var_TMP=on&var_UGRD=on&var_VGRD=on&var_HGT=on&var_RH=on&var_DPT=on&var_SPFH=on&var_PRMSL=on&var_PRES=on&var_APCP=on&var_GUST=on&var_PWAT=on&var_REFC=on&var_TCDC=on&var_TMAX=on&var_TMIN=on&var_PRATE=on&var_CPRAT=on&var_ACPCP=on&var_CRAIN=on"
LEVELS="lev_850_mb=on&lev_500_mb=on&lev_200_mb=on&lev_2_m_above_ground=on&lev_10_m_above_ground=on&lev_mean_sea_level=on&lev_surface=on&lev_entire_atmosphere=on"
REGION="subregion=&leftlon=60&rightlon=100&toplat=40&bottomlat=0"

for ((i=F_START; i<=F_END; i++)); do
  f=$(printf "f%03d" "$i")
  url="https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25_1hr.pl?file=gfs.t${CYCLE}z.pgrb2.0p25.${f}&${VARS}&${LEVELS}&${REGION}&dir=%2Fgfs.${DATE}%2F${CYCLE}%2Fatmos"
  out="gfs_60-100E_0-40N_${f}.grib2"
  echo "Downloading $out  ($DATE $CYCLE UTC)"
  curl -fL --retry 3 --retry-delay 10 -o "$out" "$url"

  if command -v stat >/dev/null 2>&1; then
    size=$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")
  else
    size=$(wc -c < "$out")
  fi
  echo "  size: $size bytes"
  if [ "$size" -gt "$MAX_BYTES" ]; then
    echo "ERROR: $out exceeds 10 MB ($size bytes)" >&2
    exit 1
  fi
  if [ "$size" -lt 10000 ]; then
    echo "ERROR: $out looks too small / not GRIB - check DATE/CYCLE availability" >&2
    head -c 500 "$out" >&2 || true
    exit 1
  fi

  # NOMADS requires ~10s between requests
  if [ "$i" -lt "$F_END" ]; then
    sleep 11
  fi
done

echo "Done. All GRIB parts <= 10 MB."
ls -lh gfs_60-100E_0-40N_*.grib2
