"""
mo_vars.py - catalogue of the Met Office global 10 km / UK 2 km model variables,
with semantic groups and level types, so you can select what to download
by category ("wind", "precip", ...) instead of by exact filename.

A base variable may be shipped in several period flavours:
  <base>            instantaneous
  <base>-PT01H      accumulated / averaged over the preceding hour
  <base>-PT03H      ... over 3 hours
  <base>-PT06H      ... over 6 hours
"""

# base, group, level-type, netCDF variable, units, period variants
CATALOGUE = [
    # --- thermodynamics -------------------------------------------------
    ("temperature_at_screen_level",              "thermo",     "surface",  "air_temperature",                  "K"),
    ("temperature_at_screen_level_min",          "thermo",     "surface",  "air_temperature",                  "K", ("PT01H", "PT03H", "PT06H")),
    ("temperature_at_screen_level_max",          "thermo",     "surface",  "air_temperature",                  "K", ("PT01H", "PT03H", "PT06H")),
    ("temperature_of_dew_point_at_screen_level", "thermo",     "surface",  "dew_point_temperature",            "K"),
    ("temperature_at_surface",                   "thermo",     "surface",  "surface_temperature",              "K"),
    ("temperature_at_tropopause",                "thermo",     "surface",  "tropopause_air_temperature",       "K"),
    ("temperature_on_pressure_levels",          "thermo",     "pressure", "air_temperature",                  "K"),
    ("wet_bulb_potential_temperature_on_pressure_levels", "thermo", "pressure", "wet_bulb_potential_temperature", "K"),

    # --- humidity --------------------------------------------------------
    ("relative_humidity_at_screen_level",        "humidity",   "surface",  "relative_humidity",                "1"),
    ("relative_humidity_on_pressure_levels",     "humidity",   "pressure", "relative_humidity",                "1"),

    # --- wind ------------------------------------------------------------
    ("wind_speed_at_10m",                        "wind",       "surface",  "wind_speed",                       "m s-1"),
    ("wind_direction_at_10m",                    "wind",       "surface",  "wind_from_direction",              "degrees"),
    ("wind_gust_at_10m",                         "wind",       "surface",  "wind_speed_of_gust",               "m s-1"),
    ("wind_gust_at_10m_max",                     "wind",       "surface",  "wind_speed_of_gust",               "m s-1", ("PT01H", "PT03H", "PT06H")),
    ("wind_speed_on_pressure_levels",            "wind",       "pressure", "wind_speed",                       "m s-1"),
    ("wind_direction_on_pressure_levels",        "wind",       "pressure", "wind_from_direction",              "degrees"),
    ("wind_vertical_velocity_on_pressure_levels","wind",       "pressure", "upward_air_velocity",              "m s-1"),

    # --- pressure & height ----------------------------------------------
    ("pressure_at_mean_sea_level",               "pressure",   "surface",  "air_pressure_at_sea_level",        "Pa"),
    ("pressure_at_tropopause",                   "pressure",   "surface",  "tropopause_air_pressure",          "Pa"),
    ("geopotential_height_on_pressure_levels",   "pressure",   "pressure", "geopotential_height",              "m"),
    ("height_ASL_on_pressure_levels",            "pressure",   "pressure", "geopotential_height",              "m"),
    ("height_of_orography",                      "terrain",    "surface",  "surface_altitude",                 "m"),

    # --- cloud -----------------------------------------------------------
    ("cloud_amount_of_total_cloud",              "cloud",      "surface",  "cloud_area_fraction",              "1"),
    ("cloud_amount_of_low_cloud",                "cloud",      "surface",  "low_type_cloud_area_fraction",     "1"),
    ("cloud_amount_of_medium_cloud",             "cloud",      "surface",  "medium_type_cloud_area_fraction",  "1"),
    ("cloud_amount_of_high_cloud",               "cloud",      "surface",  "high_type_cloud_area_fraction",    "1"),
    ("cloud_amount_of_total_convective_cloud",   "cloud",      "surface",  "convective_cloud_area_fraction",   "1"),
    ("cloud_amount_below_1000ft_ASL",            "cloud",      "surface",  "cloud_area_fraction_assuming_only_consider_surface_to_1000_feet_asl", "1"),
    ("cloud_amount_on_height_levels",            "cloud",      "height",   "cloud_volume_fraction_in_atmosphere_layer", "1"),

    # --- convective ------------------------------------------------------
    ("CAPE_surface",                             "convective", "surface",  "atmosphere_convective_available_potential_energy_wrt_surface", "J kg-1"),
    ("CAPE_mixed_layer_lowest_500m",             "convective", "surface",  "atmosphere_convective_available_potential_energy", "J kg-1"),
    ("CAPE_most_unstable_below_500hPa",          "convective", "surface",  "atmosphere_convective_available_potential_energy", "J kg-1"),
    ("CIN_surface",                              "convective", "surface",  "atmosphere_convective_inhibition_wrt_surface", "J kg-1"),
    ("CIN_mixed_layer_lowest_500m",              "convective", "surface",  "atmosphere_convective_inhibition", "J kg-1"),
    ("CIN_most_unstable_below_500hPa",           "convective", "surface",  "atmosphere_convective_inhibition", "J kg-1"),

    # --- precipitation / rain / snow --------------------------------------
    ("precipitation_rate",                       "precip",     "surface",  "lwe_precipitation_rate",           "m s-1"),
    ("precipitation_accumulation",               "precip",     "surface",  "lwe_thickness_of_precipitation_amount", "m", ("PT01H", "PT03H", "PT06H")),
    ("rainfall_rate",                            "precip",     "surface",  "rainfall_rate",                    "m s-1"),
    ("rainfall_accumulation",                    "precip",     "surface",  "thickness_of_rainfall_amount",     "m", ("PT01H", "PT03H", "PT06H")),
    ("rainfall_rate_from_convection",            "precip",     "surface",  "convective_rainfall_rate",         "m s-1"),
    ("rainfall_rate_from_convection_max",        "precip",     "surface",  "convective_rainfall_rate",         "m s-1", ("PT01H", "PT03H", "PT06H")),
    ("snowfall_rate",                            "precip",     "surface",  "lwe_snowfall_rate",                "m s-1"),
    ("snowfall_rate_from_convection",            "precip",     "surface",  "lwe_convective_snowfall_rate",     "m s-1"),
    ("snowfall_rate_from_convection_max",        "precip",     "surface",  "lwe_convective_snowfall_rate",     "m s-1", ("PT01H", "PT03H", "PT06H")),
    ("snowfall_rate_from_convection_mean",       "precip",     "surface",  "lwe_convective_snowfall_rate",     "m s-1", ("PT01H", "PT03H", "PT06H")),
    ("snow_depth_water_equivalent",              "precip",     "surface",  "lwe_thickness_of_surface_snow_amount", "m"),

    # --- radiation & surface flux -----------------------------------------
    ("radiation_flux_in_longwave_downward_at_surface",         "radiation", "surface", "surface_downwelling_longwave_flux_in_air", "W m-2"),
    ("radiation_flux_in_shortwave_direct_downward_at_surface", "radiation", "surface", "surface_direct_downwelling_shortwave_flux_in_air", "W m-2"),
    ("radiation_flux_in_shortwave_total_downward_at_surface",  "radiation", "surface", "surface_downwelling_shortwave_flux_in_air", "W m-2"),
    ("radiation_flux_in_uv_downward_at_surface",               "radiation", "surface", "surface_downwelling_ultraviolet_flux_in_air", "W m-2"),
    ("latent_heat_flux_at_surface_mean",                       "radiation", "surface", "surface_upward_latent_heat_flux", "W m-2", ("PT01H", "PT03H", "PT06H")),

    # --- visibility -------------------------------------------------------
    ("visibility_at_screen_level",               "visibility", "surface",  "visibility_in_air",                "m"),
    ("fog_fraction_at_screen_level",             "visibility", "surface",  "fog_area_fraction",                "1"),
]

GROUPS = sorted({c[1] for c in CATALOGUE})
LEVEL_TYPES = ("surface", "pressure", "height")

# base variable -> metadata
BY_BASE = {c[0]: dict(group=c[1], level=c[2], netcdf=c[3], units=c[4],
                      periods=c[5] if len(c) > 5 else ()) for c in CATALOGUE}


def tokens_for(base, periods=None):
    """File tokens for a base variable, optionally restricted to some periods."""
    p = BY_BASE[base]["periods"]
    if periods is not None:
        p = tuple(x for x in p if x in periods)
    if not p:
        return [base]
    return [f"{base}-{x}" for x in p]


def all_tokens():
    out = []
    for c in CATALOGUE:
        out.extend(tokens_for(c[0]))
    return sorted(out)


def describe(token):
    """Look a file token up -> dict(base, group, level, netcdf, units, period)."""
    base, _, period = token.partition("-PT")
    if period:
        period = "PT" + period
        if period not in BY_BASE.get(base, {}).get("periods", ()):
            base = token
            period = None
    meta = BY_BASE.get(base)
    if not meta:
        return None
    return dict(base=base, group=meta["group"], level=meta["level"],
                netcdf=meta["netcdf"], units=meta["units"], period=period)


def select(groups=None, level_types=None, vars_=None, exclude_groups=None,
           exclude_vars=None, periods=None):
    """Resolve a selection into a sorted list of file tokens.

    groups       : iterable of group names to include
    level_types  : iterable of 'surface' / 'pressure' / 'height'
    vars_        : iterable of explicit file tokens or base variables
    exclude_groups / exclude_vars : subtraction
    periods      : iterable of 'PT01H'/'PT03H'/'PT06H' (period variants only)
    """
    tokens = all_tokens()

    def keep(tok, use_periods=True):
        d = describe(tok)
        if d is None:
            return False
        if groups and d["group"] not in groups:
            return False
        if level_types and d["level"] not in level_types:
            return False
        if use_periods and periods and d["period"] and d["period"] not in periods:
            return False
        return True

    sel = {t for t in tokens if keep(t)}

    want = set()
    if vars_:
        for v in vars_:
            v = v.strip()
            if not v:
                continue
            if v in BY_BASE:
                want.update(tokens_for(v, periods))
            elif v in tokens:
                want.add(v)
            else:
                raise KeyError(f"unknown variable {v!r} "
                               f"(see --list-vars)")
        # explicit choices win over the period filter
        sel = (sel & want) | {t for t in want if keep(t, use_periods=False)}
    if exclude_groups:
        sel = {t for t in sel if describe(t)["group"] not in set(exclude_groups)}
    if exclude_vars:
        ex = set()
        for v in exclude_vars:
            v = v.strip()
            if v in BY_BASE:
                ex.update(tokens_for(v, periods))
            elif v in tokens:
                ex.add(v)
            else:
                raise KeyError(f"unknown variable {v!r}")
        sel -= ex
    return sorted(sel)


def print_catalogue():
    w = 78
    print("=" * w)
    print("Met Office model variable catalogue")
    print("=" * w)
    cur = None
    for c in CATALOGUE:
        base, group, level, netcdf, units = c[0], c[1], c[2], c[3], c[4]
        periods = c[5] if len(c) > 5 else ()
        if group != cur:
            cur = group
            print(f"\n[{group}]")
        pstr = "  " + (" +".join(periods) if periods else "instantaneous")
        print(f"  {base:<52s} {level:<9s} {units:<9s}")
        print(f"      netCDF: {netcdf}")
        print(f"      file tokens: {', '.join(tokens_for(base))}{pstr}")
    print("\n" + "=" * w)
    print(f"groups      : {', '.join(GROUPS)}")
    print(f"level types : {', '.join(LEVEL_TYPES)}")
    print(f"file tokens : {len(all_tokens())}")
    print("=" * w)
