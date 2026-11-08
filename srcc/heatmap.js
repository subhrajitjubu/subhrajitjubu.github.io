// ─── Variable metadata ────────────────────────────────────────────────────────
// Each key matches the value used in the data-selector dropdown (currentData).
// "key" is the path suffix used to match; matching is done via endsWith so
// both "../src/2m_temp" and "2m_temp" resolve correctly.

const VARIABLE_META = {
    '2m_temp': {
        label: '2m Temperature',
        unit: 'K',
        scale: [
            [0.00, '#2b0fff'],   // deep cold blue
            [0.15, '#1e90ff'],
            [0.30, '#00cfff'],
            [0.42, '#00e876'],
            [0.50, '#a8ff00'],
            [0.60, '#ffe600'],
            [0.72, '#ff8c00'],
            [0.85, '#ff2200'],
            [1.00, '#a80000'],   // extreme heat
        ],
    },
    'D2M': {
        label: 'Dew Point Temperature',
        unit: 'K',
        scale: [
            [0.00, '#2b0fff'],   // deep cold blue
            [0.15, '#1e90ff'],
            [0.30, '#00cfff'],
            [0.42, '#00e876'],
            [0.50, '#a8ff00'],
            [0.60, '#ffe600'],
            [0.72, '#ff8c00'],
            [0.85, '#ff2200'],
            [1.00, '#a80000'],   // extreme heat
        ],
    },
    'rf': {
        label: 'Rainfall',
        unit: 'mm',
        scale: [
            [0.00, '#ffffff'],
            [0.10, '#c6e9f7'],
            [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'],
            [0.55, '#0b5ea8'],
            [0.70, '#083680'],
            [0.85, '#4b0082'],
            [1.00, '#8b0000'],
        ],
    },
    'CP': {
        label: 'Convective Rainfall',
        unit: 'mm',
        scale: [
            [0.00, '#ffffff'],
            [0.15, '#b3e5fc'],
            [0.30, '#4db6e8'],
            [0.50, '#0288d1'],
            [0.70, '#01579b'],
            [0.85, '#6a1b9a'],
            [1.00, '#880e4f'],
        ],
    },
    'CAPE': {
        label: 'CAPE',
        unit: 'J kg⁻¹',
        scale: [
            [0.00, '#f5f5f5'],
            [0.15, '#ffffcc'],
            [0.30, '#c7e9b4'],
            [0.45, '#7fcdbb'],
            [0.60, '#fc8d59'],
            [0.78, '#d73027'],
            [1.00, '#7b0000'],
        ],
    },
    'CIN': {
        label: 'Convective Inhibition',
        unit: 'J kg⁻¹',
        scale: [
            [0.00, '#fafafa'],
            [0.20, '#d9d9d9'],
            [0.40, '#969696'],
            [0.60, '#525252'],
            [0.80, '#252525'],
            [1.00, '#000000'],
        ],
    },
    'tcwv': {
        label: 'Total Column Water Vapour',
        unit: 'kg m⁻²',
        scale: [
            [0.00, '#ffffd9'],
            [0.20, '#c7e9b4'],
            [0.35, '#41b6c4'],
            [0.50, '#1d91c0'],
            [0.65, '#225ea8'],
            [0.80, '#253494'],
            [1.00, '#081d58'],
        ],
    },
    'msl': {
        label: 'Mean Sea Level Pressure',
        unit: 'hPa',
        scale: [
            [0.00, '#4575b4'],
            [0.20, '#74add1'],
            [0.40, '#e0f3f8'],
            [0.50, '#ffffbf'],
            [0.60, '#fee090'],
            [0.80, '#f46d43'],
            [1.00, '#d73027'],
        ],
    },
    'div850': {
        label: '850 hPa Divergence',
        unit: '×10⁻⁵ s⁻¹',
        scale: [
            [0.00, '#8b0000'],
            [0.25, '#ff6600'],
            [0.45, '#fffacd'],
            [0.55, '#fffacd'],
            [0.75, '#4db8ff'],
            [1.00, '#00008b'],
        ],
    },
    'rh850': {
        label: '850 hPa Relative Humidity',
        unit: '%',
        scale: [
            [0.00, '#f7fbff'],
            [0.25, '#c6dbef'],
            [0.50, '#6baed6'],
            [0.75, '#2171b5'],
            [1.00, '#08306b'],
        ],
    },
    'vo850': {
        label: '850 hPa Vorticity',
        unit: '×10⁻⁵ s⁻¹',
        scale: [
            [0.00, '#543005'],
            [0.25, '#bf812d'],
            [0.45, '#f5f5f5'],
            [0.55, '#f5f5f5'],
            [0.75, '#4393c3'],
            [1.00, '#053061'],
        ],
    },
    'gh850': {
        label: '850 hPa Geopotential Height',
        unit: 'm',
        scale: [
            [0.00, '#4575b4'],
            [0.25, '#91bfdb'],
            [0.50, '#ffffbf'],
            [0.75, '#fc8d59'],
            [1.00, '#d73027'],
        ],
    },
    'div500': {
        label: '500 hPa Divergence',
        unit: '×10⁻⁵ s⁻¹',
        scale: [
            [0.00, '#8b0000'],
            [0.25, '#ff6600'],
            [0.45, '#fffacd'],
            [0.55, '#fffacd'],
            [0.75, '#4db8ff'],
            [1.00, '#00008b'],
        ],
    },
    'rh500': {
        label: '500 hPa Relative Humidity',
        unit: '%',
        scale: [
            [0.00, '#f7fbff'],
            [0.25, '#c6dbef'],
            [0.50, '#6baed6'],
            [0.75, '#2171b5'],
            [1.00, '#08306b'],
        ],
    },
    'vo500': {
        label: '500 hPa Vorticity',
        unit: '×10⁻⁵ s⁻¹',
        scale: [
            [0.00, '#543005'],
            [0.25, '#bf812d'],
            [0.45, '#f5f5f5'],
            [0.55, '#f5f5f5'],
            [0.75, '#4393c3'],
            [1.00, '#053061'],
        ],
    },
    'gh500': {
        label: '500 hPa Geopotential Height',
        unit: 'm',
        scale: [
            [0.00, '#4575b4'],
            [0.25, '#91bfdb'],
            [0.50, '#ffffbf'],
            [0.75, '#fc8d59'],
            [1.00, '#d73027'],
        ],
    },
    'LCC': {
        label: 'Low Cloud Cover',
        unit: '%',
        scale: [
            [0.00, '#f0f9ff'],
            [0.30, '#bae6fd'],
            [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'],
            [1.00, '#0369a1'],
        ],
    },
    'MCC': {
        label: 'Mid Cloud Cover',
        unit: '%',
        scale: [
            [0.00, '#f0f9ff'],
            [0.30, '#bae6fd'],
            [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'],
            [1.00, '#0369a1'],
        ],
    },
    'HCC': {
        label: 'High Cloud Cover',
        unit: '%',
        scale: [
            [0.00, '#f0f9ff'],
            [0.30, '#bae6fd'],
            [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'],
            [1.00, '#0369a1'],
        ],
    },
    'TCC': {
        label: 'Total Cloud Cover',
        unit: '%',
        scale: [
            [0.00, '#fafafa'],
            [0.25, '#d4e8f5'],
            [0.50, '#88c4e8'],
            [0.75, '#3a90c8'],
            [1.00, '#0a4a7c'],
        ],
    },
    'PM25': {
        label: 'PM 2.5',
        unit: 'µg m⁻³',
        fixedMin: 0,
        fixedMax: 250,
        scale: [
            [0.000, '#ffffff'],
            [0.063, '#d1d6ea'],
            [0.196, '#8791bf'],
            [0.326, '#bcbc63'],
            [0.463, '#f2e50a'],
            [0.583, '#f4a307'],
            [0.720, '#f76005'],
            [1.000, '#ff0000'],
        ],
    },
    'PM10': {
        label: 'PM 10',
        unit: 'µg m⁻³',
        fixedMin: 0,
        fixedMax: 500,
        scale: [
            [0.000, '#ffffff'],
            [0.063, '#d1d6ea'],
            [0.196, '#8791bf'],
            [0.326, '#bcbc63'],
            [0.463, '#f2e50a'],
            [0.583, '#f4a307'],
            [0.720, '#f76005'],
            [1.000, '#ff0000'],
        ],
    },
    'AOD_TOT': {
        label: 'Total AOD (550 nm)',
        unit: 'dimensionless',
        fixedMin: 0.001,
        fixedMax: 3,
        scale: [
            [0.000, '#ffffff'],
            [0.126, '#a5add6'],
            [0.256, '#a3a58e'],
            [0.393, '#d6d138'],
            [0.523, '#f2c40a'],
            [0.653, '#f78205'],
            [0.790, '#f93f02'],
            [1.000, '#ff0000'],
        ],
    },
    'AOD_DUST': {
        label: 'Dust AOD (550 nm)',
        unit: 'dimensionless',
        fixedMin: 0.001,
        fixedMax: 3,
        scale: [
            [0.00, '#fff8f0'],
            [0.20, '#f5d9a8'],
            [0.40, '#e6a94a'],
            [0.60, '#c46e10'],
            [0.80, '#7a3800'],
            [1.00, '#3d1a00'],
        ],
    },
    'AOD_SEA': {
        label: 'Sea Salt AOD (550 nm)',
        unit: 'dimensionless',
        fixedMin: 0.001,
        fixedMax: 3,
        scale: [
            [0.00, '#f0f9ff'],
            [0.20, '#bae6fd'],
            [0.40, '#38bdf8'],
            [0.60, '#0284c7'],
            [0.80, '#075985'],
            [1.00, '#0c2f4a'],
        ],
    },
    'AOD_SUL': {
        label: 'Sulphate AOD (550 nm)',
        unit: 'dimensionless',
        fixedMin: 0.001,
        fixedMax: 3,
        scale: [
            [0.00, '#fffff0'],
            [0.25, '#d4f0a0'],
            [0.50, '#78c44a'],
            [0.75, '#2a7a10'],
            [1.00, '#0d3500'],
        ],
    },
    'AOD_NIT': {
        label: 'Nitrate AOD (550 nm)',
        unit: 'dimensionless',
        fixedMin: 0.001,
        fixedMax: 3,
        scale: [
            [0.00, '#fff0f8'],
            [0.25, '#f0b0d8'],
            [0.50, '#d060a0'],
            [0.75, '#900060'],
            [1.00, '#400020'],
        ],
    },

    // ─── UKMO variables (values already unit-converted by the pipeline:
    // K -> degC, m -> mm, m s-1 -> mm h-1 where applicable) ───
    'temperature_at_screen_level': {
        label: 'Screen Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_at_screen_level_max-PT01H': {
        label: 'Max Screen Temp (1-hr)', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_at_screen_level_min-PT01H': {
        label: 'Min Screen Temp (1-hr)', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_at_surface': {
        label: 'Surface Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_on_pressure_levels_p850hPa': {
        label: '850 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_on_pressure_levels_p500hPa': {
        label: '500 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'temperature_on_pressure_levels_p200hPa': {
        label: '200 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'pressure_at_mean_sea_level': {
        label: 'Mean Sea Level Pressure', unit: 'Pa',
        scale: [
            [0.00, '#4575b4'], [0.20, '#74add1'], [0.40, '#e0f3f8'],
            [0.50, '#ffffbf'], [0.60, '#fee090'], [0.80, '#f46d43'], [1.00, '#d73027'],
        ],
    },
    'rainfall_accumulation-PT01H': {
        label: 'Rainfall (1-hr)', unit: 'mm',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'precipitation_accumulation-PT01H': {
        label: 'Precipitation (1-hr)', unit: 'mm',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'rainfall_rate': {
        label: 'Rainfall Rate', unit: 'mm h-1',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'precipitation_rate': {
        label: 'Precipitation Rate', unit: 'mm h-1',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'rainfall_rate_from_convection': {
        label: 'Convective Rainfall Rate', unit: 'mm h-1',
        scale: [
            [0.00, '#ffffff'], [0.15, '#b3e5fc'], [0.30, '#4db6e8'],
            [0.50, '#0288d1'], [0.70, '#01579b'], [0.85, '#6a1b9a'], [1.00, '#880e4f'],
        ],
    },
    'relative_humidity_at_screen_level': {
        label: 'Screen Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'relative_humidity_on_pressure_levels_p850hPa': {
        label: '850 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'relative_humidity_on_pressure_levels_p500hPa': {
        label: '500 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'relative_humidity_on_pressure_levels_p200hPa': {
        label: '200 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'CAPE_surface': {
        label: 'CAPE (Surface)', unit: 'J kg⁻¹',
        scale: [
            [0.00, '#f5f5f5'], [0.15, '#ffffcc'], [0.30, '#c7e9b4'],
            [0.45, '#7fcdbb'], [0.60, '#fc8d59'], [0.78, '#d73027'], [1.00, '#7b0000'],
        ],
    },
    'CIN_surface': {
        label: 'CIN (Surface)', unit: 'J kg⁻¹',
        scale: [
            [0.00, '#fafafa'], [0.20, '#d9d9d9'], [0.40, '#969696'],
            [0.60, '#525252'], [0.80, '#252525'], [1.00, '#000000'],
        ],
    },
    'cloud_amount_of_total_cloud': {
        label: 'Total Cloud Cover', unit: '%',
        scale: [
            [0.00, '#fafafa'], [0.25, '#d4e8f5'], [0.50, '#88c4e8'],
            [0.75, '#3a90c8'], [1.00, '#0a4a7c'],
        ],
    },
    'cloud_amount_of_low_cloud': {
        label: 'Low Cloud Cover', unit: '%',
        scale: [
            [0.00, '#f0f9ff'], [0.30, '#bae6fd'], [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'], [1.00, '#0369a1'],
        ],
    },
    'cloud_amount_of_medium_cloud': {
        label: 'Mid Cloud Cover', unit: '%',
        scale: [
            [0.00, '#f0f9ff'], [0.30, '#bae6fd'], [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'], [1.00, '#0369a1'],
        ],
    },
    'cloud_amount_of_high_cloud': {
        label: 'High Cloud Cover', unit: '%',
        scale: [
            [0.00, '#f0f9ff'], [0.30, '#bae6fd'], [0.60, '#7dd3fc'],
            [0.80, '#38bdf8'], [1.00, '#0369a1'],
        ],
    },

    // wind speed — shared 0..30 m s⁻¹ blue→green→amber→red scale
    'wind_speed_at_10m': {
        label: '10 m Wind Speed', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_gust_at_10m': {
        label: '10 m Wind Gust', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_gust_at_10m_max-PT01H': {
        label: 'Max Gust (1-hr)', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_speed_on_pressure_levels_p850hPa': {
        label: '850 hPa Wind Speed', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_speed_on_pressure_levels_p500hPa': {
        label: '500 hPa Wind Speed', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_speed_on_pressure_levels_p200hPa': {
        label: '200 hPa Wind Speed', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'wind_direction_at_10m': {
        label: '10 m Wind Direction', unit: '°',
        scale: [
            [0.00, '#3b82f6'], [0.16, '#8b5cf6'], [0.33, '#ec4899'],
            [0.50, '#facc15'], [0.66, '#22c55e'], [0.83, '#06b6d4'], [1.00, '#3b82f6'],
        ],
    },
    'wind_direction_on_pressure_levels_p850hPa': {
        label: '850 hPa Wind Direction', unit: '°',
        scale: [
            [0.00, '#3b82f6'], [0.16, '#8b5cf6'], [0.33, '#ec4899'],
            [0.50, '#facc15'], [0.66, '#22c55e'], [0.83, '#06b6d4'], [1.00, '#3b82f6'],
        ],
    },
    'wind_direction_on_pressure_levels_p500hPa': {
        label: '500 hPa Wind Direction', unit: '°',
        scale: [
            [0.00, '#3b82f6'], [0.16, '#8b5cf6'], [0.33, '#ec4899'],
            [0.50, '#facc15'], [0.66, '#22c55e'], [0.83, '#06b6d4'], [1.00, '#3b82f6'],
        ],
    },
    'wind_direction_on_pressure_levels_p200hPa': {
        label: '200 hPa Wind Direction', unit: '°',
        scale: [
            [0.00, '#3b82f6'], [0.16, '#8b5cf6'], [0.33, '#ec4899'],
            [0.50, '#facc15'], [0.66, '#22c55e'], [0.83, '#06b6d4'], [1.00, '#3b82f6'],
        ],
    },

    // ─── NOAA GFS variables (unit-converted by gfs_download.py) ───
    'tmp_surf': {
        label: '2 m Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'dpt_surf': {
        label: '2 m Dew Point', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'rh_surf': {
        label: '2 m Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'spfh_surf': {
        label: '2 m Specific Humidity', unit: 'g/kg',
        scale: [
            [0.00, '#fff7ec'], [0.25, '#fee6ce'], [0.50, '#fdd0a2'],
            [0.75, '#fdbb84'], [1.00, '#e34a33'],
        ],
    },
    'u10': {
        label: '10 m U Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'v10': {
        label: '10 m V Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'prmsl': {
        label: 'Mean Sea Level Pressure', unit: 'hPa',
        scale: [
            [0.00, '#4575b4'], [0.20, '#74add1'], [0.40, '#e0f3f8'],
            [0.50, '#ffffbf'], [0.60, '#fee090'], [0.80, '#f46d43'], [1.00, '#d73027'],
        ],
    },
    'pres_sfc': {
        label: 'Surface Pressure', unit: 'hPa',
        scale: [
            [0.00, '#4575b4'], [0.20, '#74add1'], [0.40, '#e0f3f8'],
            [0.50, '#ffffbf'], [0.60, '#fee090'], [0.80, '#f46d43'], [1.00, '#d73027'],
        ],
    },
    'gust_sfc': {
        label: 'Surface Gust', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'tmax_surf': {
        label: '2 m Max Temp', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'tmin_surf': {
        label: '2 m Min Temp', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'apcp': {
        label: 'Accumulated Precipitation', unit: 'mm',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'prate': {
        label: 'Precipitation Rate', unit: 'mm h-1',
        scale: [
            [0.00, '#ffffff'], [0.10, '#c6e9f7'], [0.25, '#74c8f0'],
            [0.40, '#1e9fd4'], [0.55, '#0b5ea8'], [0.70, '#083680'],
            [0.85, '#4b0082'], [1.00, '#8b0000'],
        ],
    },
    'cprat': {
        label: 'Convective Precip Rate', unit: 'mm h-1',
        scale: [
            [0.00, '#ffffff'], [0.15, '#b3e5fc'], [0.30, '#4db6e8'],
            [0.50, '#0288d1'], [0.70, '#01579b'], [0.85, '#6a1b9a'], [1.00, '#880e4f'],
        ],
    },
    'crain': {
        label: 'Convective Rain', unit: 'mm',
        scale: [
            [0.00, '#ffffff'], [0.15, '#b3e5fc'], [0.30, '#4db6e8'],
            [0.50, '#0288d1'], [0.70, '#01579b'], [0.85, '#6a1b9a'], [1.00, '#880e4f'],
        ],
    },
    'tcdc': {
        label: 'Total Cloud Cover', unit: '%',
        scale: [
            [0.00, '#fafafa'], [0.25, '#d4e8f5'], [0.50, '#88c4e8'],
            [0.75, '#3a90c8'], [1.00, '#0a4a7c'],
        ],
    },
    'refc': {
        label: 'Reflectivity', unit: 'dBZ',
        scale: [
            [0.00, '#f5f5f5'], [0.20, '#a1d99b'], [0.40, '#31a354'],
            [0.60, '#3182bd'], [0.80, '#756bb1'], [1.00, '#54278f'],
        ],
    },
    'tmp_p850': {
        label: '850 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'rh_p850': {
        label: '850 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'u_p850': {
        label: '850 hPa U Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'v_p850': {
        label: '850 hPa V Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'gh_p850': {
        label: '850 hPa Geopotential Height', unit: 'm',
        scale: [
            [0.00, '#4575b4'], [0.25, '#91bfdb'], [0.50, '#e0f3f8'],
            [0.75, '#fdae61'], [1.00, '#d73027'],
        ],
    },
    'tmp_p500': {
        label: '500 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'rh_p500': {
        label: '500 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'u_p500': {
        label: '500 hPa U Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'v_p500': {
        label: '500 hPa V Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'gh_p500': {
        label: '500 hPa Geopotential Height', unit: 'm',
        scale: [
            [0.00, '#4575b4'], [0.25, '#91bfdb'], [0.50, '#e0f3f8'],
            [0.75, '#fdae61'], [1.00, '#d73027'],
        ],
    },
    'tmp_p200': {
        label: '200 hPa Temperature', unit: 'degC',
        scale: [
            [0.00, '#2b0fff'], [0.15, '#1e90ff'], [0.30, '#00cfff'],
            [0.42, '#00e876'], [0.50, '#a8ff00'], [0.60, '#ffe600'],
            [0.72, '#ff8c00'], [0.85, '#ff2200'], [1.00, '#a80000'],
        ],
    },
    'rh_p200': {
        label: '200 hPa Relative Humidity', unit: '%',
        scale: [
            [0.00, '#f7fbff'], [0.25, '#c6dbef'], [0.50, '#6baed6'],
            [0.75, '#2171b5'], [1.00, '#08306b'],
        ],
    },
    'u_p200': {
        label: '200 hPa U Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'v_p200': {
        label: '200 hPa V Wind', unit: 'm s-1',
        scale: [
            [0.00, '#eff6ff'], [0.20, '#93c5fd'], [0.38, '#38bdf8'],
            [0.52, '#22c55e'], [0.66, '#f59e0b'], [0.80, '#f97316'], [1.00, '#dc2626'],
        ],
    },
    'gh_p200': {
        label: '200 hPa Geopotential Height', unit: 'm',
        scale: [
            [0.00, '#4575b4'], [0.25, '#91bfdb'], [0.50, '#e0f3f8'],
            [0.75, '#fdae61'], [1.00, '#d73027'],
        ],
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function resolveKey(currentData) {
    const base = String(currentData || '').split(/[\\/]/).pop().replace(/\.json$/i, '');
    let best = null;
    for (const key of Object.keys(VARIABLE_META)) {
        if (base === key || base.startsWith(key)) {
            if (!best || key.length > best.length) best = key;
        }
    }
    return best || base;
}

function getMeta(currentData) {
    return VARIABLE_META[resolveKey(currentData)] || VARIABLE_META['2m_temp'];
}

function tcColors() {
    if (typeof getThemeColors === 'function') return getThemeColors();
    return document.documentElement.classList.contains('light')
        ? { text: '#18263d', textDim: '#4a6080', tooltipBg: 'rgba(255,255,255,0.97)', mapNull: '#dce4ef', mapBorder: '#8aa0c0' }
        : { text: '#d8e4f5', textDim: '#6b83a6', tooltipBg: 'rgba(13,22,39,0.96)', mapNull: '#0d1627', mapBorder: '#1e2f4a' };
}

function percentileMinMax(values) {
    const n = values.length;
    if (!n) return { min: 0, max: 1 };
    const a = [];
    for (let i = 0; i < n; i++) {
        const v = values[i];
        if (v === null || v === undefined || !isFinite(v)) continue;
        a.push(v);
    }
    a.sort((x, y) => x - y);
    if (!a.length) return { min: 0, max: 1 };
    const lo = a[Math.max(0, Math.floor(a.length * 0.02))];
    const hi = a[Math.min(a.length - 1, Math.floor(a.length * 0.98))];
    return lo === hi ? { min: lo - 1, max: hi + 1 } : { min: lo, max: hi };
}

// ─── Data fetching (UKMO parts layout, in-memory cache) ───────────────────

const DATA_CACHE = new Map();
const CACHE_MAX = 2;                  // 0.1° parts are 25–50 MB — keep at most 2
const _topologyPromise = { p: null };

function siblingUrl(base, name) {
    const cut = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
    return (cut >= 0 ? base.slice(0, cut + 1) : '') + name;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    return response.json();
}

// UKMO writes coords as raw arrays; ECMWF writes {dims, attrs, data} objects.
// Normalise both to plain arrays for reads, and merge either shape along time.
function coordArr(value) {
    return Array.isArray(value) ? value : (value && value.data) || [];
}

// Concatenate parts along the time axis — frames appended, and any coord whose
// per-part length equals that part's frame count is concatenated too.
// latitude/longitude and scalar coords are left untouched.
function mergeParts(parts) {
    const first = parts[0];
    const frameCounts = parts.map(p => Array.isArray(p.data) ? p.data.length : 0);
    const coords = {};
    for (const name of Object.keys(first.coords || {})) {
        const perPart = parts.map(p => (p.coords && p.coords[name]) || null);
        const ok = perPart.every((c, i) => Array.isArray(c)
            ? c.length === frameCounts[i]
            : (c && Array.isArray(c.data) && c.data.length === frameCounts[i]));
        if (ok) {
            const merged = perPart.flatMap(c => Array.isArray(c) ? c : c.data);
            coords[name] = Array.isArray(first.coords[name])
                ? merged
                : { ...first.coords[name], data: merged };
        } else {
            coords[name] = first.coords[name];
        }
    }
    return { dims: first.dims, attrs: first.attrs, coords, data: parts.flatMap(p => p.data) };
}

// UKMO pressure-level files are 4D [time][pressure][lat][lon] with a single
// level. The canvas renderer expects [time][lat][lon], so drop any extra
// non-temporal, non-spatial axis (selecting index 0). ECMWF files are
// already [step][lat][lon] and pass through untouched.
function squeezeToTimeLatLon(data) {
    if (!data || !Array.isArray(data.data) || !Array.isArray(data.dims)) return data;
    const spatial = new Set(['latitude', 'longitude', 'lat', 'lon']);
    const temporal = new Set(['time', 'step', 'valid_time']);
    let dims = [...data.dims];
    let arr = data.data;
    const take0 = (a, depth, target) => {
        if (!Array.isArray(a)) return a;
        if (depth === target) return a[0];
        return a.map(sub => take0(sub, depth + 1, target));
    };
    while (dims.length > 3) {
        const idx = dims.findIndex(d => !temporal.has(d) && !spatial.has(d));
        if (idx === -1) break;
        arr = take0(arr, 0, idx);
        dims.splice(idx, 1);
    }
    data.data = arr;
    data.dims = dims;
    return data;
}

async function fetchData(dataType) {
    const base = String(dataType).replace(/\.json$/i, '');
    const key = base.split(/[\\/]/).pop().toLowerCase();
    if (DATA_CACHE.has(key)) {
        console.log(`Cache hit: ${key}`);
        return DATA_CACHE.get(key);
    }
    const manifestUrl = `${base}_manifest.json`;
    const res = await fetch(manifestUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching manifest ${manifestUrl}`);
    const manifest = await res.json();
    const names = Array.isArray(manifest.parts) ? manifest.parts : [];
    console.log(`Manifest ${manifestUrl}: ${names.length} part(s)`);
    const parts = [];
    for (const name of names) parts.push(await fetchJson(siblingUrl(base, name)));
    if (!parts.length) throw new Error(`No parts listed in ${manifestUrl}`);
    const data = squeezeToTimeLatLon(parts.length > 1 ? mergeParts(parts) : parts[0]);
    DATA_CACHE.set(key, data);
    if (DATA_CACHE.size > CACHE_MAX) {
        const oldest = DATA_CACHE.keys().next().value;
        console.log(`Cache evict: ${oldest}`);
        DATA_CACHE.delete(oldest);
    }
    return data;
}

async function getTopology() {
    if (!_topologyPromise.p) {
        _topologyPromise.p = fetchJson('IND_1.json');
    }
    return _topologyPromise.p;
}

// ─── Mercator projection & view ─────────────────────────────────────────────

const DEG = Math.PI / 180;
const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * DEG / 2));
const unmerc = y => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;

const view = { cx: 0, cy: 0, scale: 1, fitScale: 1 };
let canvasW = 0, canvasH = 0, dpr = 1;

// Fit the map to mainland India (covers all datasets in this page)
const INDIA_X0 = 67.5 * DEG, INDIA_X1 = 99.5 * DEG;
const INDIA_Y0 = merc(6.5), INDIA_Y1 = merc(37.5);

function toPx(wx, wy) {
    return [(wx - view.cx) * view.scale + canvasW / 2,
            canvasH / 2 - (wy - view.cy) * view.scale];
}
function toWorld(px, py) {
    return [(px - canvasW / 2) / view.scale + view.cx,
            view.cy + (canvasH / 2 - py) / view.scale];
}
function resetView() {
    const s = 0.94;
    view.cx = (INDIA_X0 + INDIA_X1) / 2;
    view.cy = (INDIA_Y0 + INDIA_Y1) / 2;
    view.scale = Math.min(canvasW / ((INDIA_X1 - INDIA_X0) * s),
                          canvasH / ((INDIA_Y1 - INDIA_Y0) * s));
    view.fitScale = view.scale;
    clampView();
}

// Keep a good chunk of India in frame — Highcharts clamped the map too.
// Without this the map can be panned/zoomed completely off-screen.
// At least 25% of India's width/height must stay visible.
function clampView() {
    if (!canvasW || !canvasH) return;
    const w = canvasW / view.scale, h = canvasH / view.scale;
    const iw = (INDIA_X1 - INDIA_X0) * 0.25, ih = (INDIA_Y1 - INDIA_Y0) * 0.25;
    view.cx = Math.min(Math.max(view.cx, INDIA_X0 + iw - w / 2), INDIA_X1 - iw + w / 2);
    view.cy = Math.min(Math.max(view.cy, INDIA_Y0 + ih - h / 2), INDIA_Y1 - ih + h / 2);
}

function zoomAt(px, py, factor) {
    if (!canvasW) return;
    const [wx, wy] = toWorld(px, py);
    const next = Math.min(Math.max(view.scale * factor, view.fitScale * 0.6), view.fitScale * 80);
    view.scale = next;
    view.cx = wx - (px - canvasW / 2) / next;
    view.cy = wy + (canvasH / 2 - py) / next;
    clampView();
}

// ─── Canvas element + UI overlay (works on both pages) ─────────────────────

let CURR = { data: null, timeIndex: 0, lat: null, lon: null, colW: null, rowEdges: null,
             topology: null, rings: null, timeData: [], cols: 0, rows: 0, meta: null };

let gridCache = { key: null, img: null };
const lutCache = new Map();

// NCAR NCL colormap selection (ncar_colormaps.js). 'default' keeps the
// per-variable scale from VARIABLE_META.
let currentColormap = 'default';

function activeStops(meta) {
    if (currentColormap !== 'default'
        && typeof NCAR_COLORMAPS !== 'undefined'
        && NCAR_COLORMAPS[currentColormap]) {
        return NCAR_COLORMAPS[currentColormap];
    }
    return (meta && meta.scale) || [];
}

function setColormap(name) {
    currentColormap = name || 'default';
    lutCache.clear();
    gridCache = { key: null, img: null };
    if (CURR.data) draw();
}

function gridKey(timeIndex) { return `${currentColormap}|${CURR.meta && CURR.meta.label}|${timeIndex}`; }

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
}

function lutFor(meta) {
    const cacheKey = `${currentColormap}|${meta && meta.label}`;
    if (lutCache.has(cacheKey)) return lutCache.get(cacheKey);
    const stops = activeStops(meta).map(([pos, col]) => [pos, hexToRgb(col)]).sort((a, b) => a[0] - b[0]);
    const lut = new Array(256);
    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        let a = stops[0], b = stops[stops.length - 1];
        for (let k = 0; k < stops.length - 1; k++) {
            if (t >= stops[k][0] && t <= stops[k + 1][0]) { a = stops[k]; b = stops[k + 1]; break; }
        }
        const f = (t - a[0]) / Math.max(1e-9, b[0] - a[0]);
        lut[i] = [a[1][0] + (b[1][0] - a[1][0]) * f | 0,
                  a[1][1] + (b[1][1] - a[1][1]) * f | 0,
                  a[1][2] + (b[1][2] - a[1][2]) * f | 0];
    }
    lutCache.set(cacheKey, lut);
    return lut;
}

function buildGridImage(timeIndex) {
    const key = gridKey(timeIndex);
    if (gridCache.key === key) return gridCache.img;
    const { cols, rows, lat, lon, data, meta } = CURR;
    const lut = lutFor(meta);
    const frame = data.data[timeIndex];
    const values = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const v = frame[r][c];
        if (v !== null && v !== undefined && isFinite(v)) values.push(v);
    }
    const { min, max } = (meta.fixedMin !== undefined && meta.fixedMax !== undefined)
        ? { min: meta.fixedMin, max: meta.fixedMax }
        : percentileMinMax(values);
    CURR.minV = min; CURR.maxV = max;
    const img = document.createElement('canvas');
    img.width = cols; img.height = rows;
    const ctx = img.getContext('2d');
    const id = ctx.createImageData(cols, rows);
    const px = id.data;
    const inv = 255 / Math.max(1e-9, max - min);
    for (let r = 0; r < rows; r++) {
        const row = frame[r];
        for (let c = 0; c < cols; c++) {
            const v = row[c];
            const o = (r * cols + c) * 4;
            if (v === null || v === undefined || !isFinite(v)) { px[o + 3] = 0; continue; }
            let t = (v - min) * inv;
            t = t < 0 ? 0 : t > 255 ? 255 : t | 0;
            const col = lut[t];
            px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255;
        }
    }
    ctx.putImageData(id, 0, 0);
    gridCache = { key, img, min, max };
    return img;
}

// row/col edge arrays (world coords): rows top→bottom (lat desc), cols left→right
function computeGridEdges() {
    const { lat, lon } = CURR;
    const rows = lat.length, cols = lon.length;
    const dLat = Math.abs(lat[0] - lat[rows - 1]) / (rows - 1 || 1);
    const dLon = Math.abs(lon[cols - 1] - lon[0]) / (cols - 1 || 1);
    CURR.rowEdges = new Array(rows + 1);
    for (let i = 0; i <= rows; i++) CURR.rowEdges[i] = merc(lat[0] + dLat / 2 - i * dLat);
    CURR.colEdges = new Array(cols + 1);
    for (let i = 0; i <= cols; i++) CURR.colEdges[i] = (lon[0] - dLon / 2 + i * dLon) * DEG;
    CURR.cols = cols; CURR.rows = rows;
}

function indiaPath() {
    const p = new Path2D();
    const topo = CURR.topology;
    if (!topo || !topo.features) return p;
    for (const f of topo.features) {
        const geoms = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
        for (const poly of geoms) for (const ring of poly) {
            ring.forEach(([lon, lat], i) => {
                const [x, y] = toPx(lon * DEG, merc(lat));
                i ? p.lineTo(x, y) : p.moveTo(x, y);
            });
            p.closePath();
        }
    }
    return p;
}

function draw() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas || !CURR.data) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);

    const tc = tcColors();
    const path = indiaPath();

    // Land fill
    ctx.fillStyle = tc.mapNull;
    ctx.fill(path);

    // Heatmap clipped to land — single stretched blit, no row seams
    ctx.save();
    ctx.clip(path);
    const img = buildGridImage(CURR.timeIndex);
    const [x0] = toPx(CURR.colEdges[0], 0);
    const [x1] = toPx(CURR.colEdges[CURR.colEdges.length - 1], 0);
    const yTop = toPx(0, CURR.rowEdges[0])[1];
    const yBot = toPx(0, CURR.rowEdges[CURR.rows])[1];
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, CURR.cols, CURR.rows,
        x0, yTop, x1 - x0, yBot - yTop);
    ctx.restore();

    // Land outlines — light touch so they don't read as seams over the heat
    ctx.strokeStyle = tc.mapBorder;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 0.6;
    ctx.stroke(path);
    ctx.globalAlpha = 1;

    // Legend + status card
    updateLegend(CURR.meta, CURR.minV, CURR.maxV);
    if (typeof updateStatusCard === 'function') {
        updateStatusCard(CURR.meta.label, CURR.meta.unit, CURR.timeData[CURR.timeIndex]);
    }
    window._lastRenderArgs = { timeIndex: CURR.timeIndex };
}

// Flat list of India outline rings ([[lon,lat], ...]) for hover hit-testing,
// so tooltips only fire where the heatmap itself is drawn (clipped to land).
function buildRings(topology) {
    const rings = [];
    for (const f of (topology && topology.features) || []) {
        const geoms = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
        for (const poly of geoms) for (const ring of poly) rings.push(ring);
    }
    return rings;
}

function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function isOverLand(lon, lat) {
    if (!CURR.rings) return false;
    for (const ring of CURR.rings) if (pointInRing(lon, lat, ring)) return true;
    return false;
}

// ─── Legend & zoom controls ──────────────────────────────────────────────────

const overlayCSS = `
#map-canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
#map-canvas.dragging { cursor: grabbing; }
.map-title { position:absolute; top:18px; left:20px; z-index:3; pointer-events:none; }
.map-title h1 { margin:0; font:600 15px/1.3 'DM Sans',sans-serif; letter-spacing:.02em; }
.map-title p { margin:3px 0 0; font:11px 'Space Mono',monospace; opacity:.75; letter-spacing:.04em; }
.map-legend { position:absolute; left:20px; bottom:20px; z-index:3; width:190px; pointer-events:none; }
.map-legend .ends { display:flex; justify-content:space-between; font:10px 'Space Mono',monospace; opacity:.85; margin-bottom:4px; }
.map-legend .bar { height:10px; border-radius:6px; border:1px solid rgba(128,128,128,.35); }
.map-legend .unit { font:10px 'Space Mono',monospace; opacity:.6; margin-top:4px; }
.zoom-controls { position:absolute; right:20px; bottom:20px; z-index:3; display:flex; flex-direction:column; gap:6px; }
.zoom-controls button { width:34px; height:34px; border-radius:8px; border:1px solid rgba(128,128,128,.35); background:transparent; color:inherit; font:16px 'DM Sans',sans-serif; cursor:pointer; transition:.15s; backdrop-filter: blur(6px); }
.zoom-controls button:hover { background:rgba(128,128,128,.18); }
.map-tooltip { position:absolute; z-index:4; pointer-events:none; display:none; padding:10px 12px; border-radius:8px; border:1px solid rgba(128,128,128,.35); backdrop-filter: blur(8px); min-width:150px; }
.map-tooltip .tt-label { font:500 11px 'DM Sans',sans-serif; opacity:.8; letter-spacing:.05em; text-transform:uppercase; }
.map-tooltip .tt-coord { font:10px 'Space Mono',monospace; opacity:.6; margin:6px 0 4px; }
.map-tooltip .tt-val { font:500 17px 'DM Sans',sans-serif; }
.map-tooltip .tt-val span { font-size:11px; opacity:.7; font-weight:400; }
.map-error { position:absolute; z-index:5; left:20px; top:20px; max-width:420px; padding:12px 14px; border-radius:10px; border:1px solid rgba(255,90,90,.4); background:rgba(60,10,10,.35); color:#ffb4b4; font:12px 'DM Sans',sans-serif; display:none; }
`;

function ensureUI() {
    const container = document.getElementById('container');
    if (!container) return;
    if (document.getElementById('map-ui')) return;
    const host = container.parentElement || container;
    if (!host.style.position) host.style.position = 'relative';
    if (!container.style.position) container.style.position = 'relative';

    // canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'map-canvas';
    container.appendChild(canvas);

    // overlay styles
    const style = document.createElement('style');
    style.textContent = overlayCSS;
    document.head.appendChild(style);

    // UI wrapper
    const ui = document.createElement('div');
    ui.id = 'map-ui';
    ui.innerHTML = `
        <div class="map-title"><h1 id="map-title-label">—</h1><p id="map-title-sub">—</p></div>
        <div class="map-legend">
            <div class="ends"><span id="leg-min">—</span><span id="leg-max">—</span></div>
            <div class="bar" id="leg-bar"></div>
            <div class="unit" id="leg-unit">—</div>
        </div>
        <div class="zoom-controls">
            <button id="zoom-in" aria-label="Zoom in">+</button>
            <button id="zoom-out" aria-label="Zoom out">−</button>
            <button id="zoom-reset" aria-label="Reset view">⟲</button>
        </div>
        <div class="map-tooltip" id="map-tooltip"></div>
        <div class="map-error" id="map-error"></div>
    `;
    host.appendChild(ui);
    // loading overlay used by loadData if the page doesn't provide one
    if (!document.getElementById('loading')) {
        const ov = document.createElement('div');
        ov.className = 'loading-overlay';
        ov.id = 'loading';
        ov.innerHTML = '<div class="spinner"></div><div class="loading-text">FETCHING DATA…</div>';
        host.appendChild(ov);
        const s = document.createElement('style');
        s.textContent = '.loading-overlay{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(10,15,25,.45);backdrop-filter:blur(4px);transition:opacity .25s}.loading-overlay.hidden{opacity:0;pointer-events:none}.spinner{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#38bdf8;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.loading-text{font:11px \'Space Mono\',monospace;letter-spacing:.15em;color:#8aa0c0}';
        document.head.appendChild(s);
    }

    // sizing
    function resize() {
        const rect = container.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvasW = Math.max(1, Math.round(rect.width));
        canvasH = Math.max(1, Math.round(rect.height));
        canvas.width = Math.round(canvasW * dpr);
        canvas.height = Math.round(canvasH * dpr);
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (CURR.data) { resetView(); draw(); }
    }
    new ResizeObserver(resize).observe(container);

    // interactions
    let drag = null;
    canvas.addEventListener('mousedown', e => {
        drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
        canvas.classList.add('dragging');
        try { if (e.pointerId !== undefined) canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
    });
    canvas.addEventListener('mousemove', e => {
        if (drag) {
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            view.cx = drag.cx - dx / view.scale;
            view.cy = drag.cy + dy / view.scale;
            clampView();
            draw();
            return;
        }
        showTooltip(e);
    });
    const endDrag = () => { drag = null; canvas.classList.remove('dragging'); };
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', () => { endDrag(); hideTooltip(); });
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016));
        draw();
    }, { passive: false });

    document.getElementById('zoom-in').addEventListener('click', () => { zoomAt(canvasW / 2, canvasH / 2, 1.35); draw(); });
    document.getElementById('zoom-out').addEventListener('click', () => { zoomAt(canvasW / 2, canvasH / 2, 1 / 1.35); draw(); });
    document.getElementById('zoom-reset').addEventListener('click', () => { resetView(); draw(); });

    // initial sizing
    resize();
}

function updateLegend(meta, minV, maxV) {
    const bar = document.getElementById('leg-bar');
    const stops = activeStops(meta).map(([p, c]) => `${c} ${Math.round(p * 100)}%`).join(', ');
    if (bar) bar.style.background = `linear-gradient(90deg, ${stops})`;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('leg-min', minV === undefined ? '—' : minV.toFixed(2));
    set('leg-max', maxV === undefined ? '—' : maxV.toFixed(2));
    set('leg-unit', meta.unit || '');
    set('map-title-label', meta.label || '');
    set('map-title-sub', `${CURR.timeData[CURR.timeIndex] || ''} · ${meta.unit || ''}`);
    const tc = tcColors();
    const t = document.getElementById('map-title-label');
    const s = document.getElementById('map-title-sub');
    if (t) t.style.color = tc.text;
    if (s) s.style.color = tc.textDim;
    const legend = document.querySelector('.map-legend');
    if (legend) legend.style.color = tc.text;
    const zoom = document.querySelector('.zoom-controls');
    if (zoom) zoom.style.color = tc.text;
}



function showTooltip(e) {
    const tip = document.getElementById('map-tooltip');
    if (!tip || !CURR.data) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const [wx, wy] = toWorld(px, py);
    const lon = wx / DEG, lat = unmerc(wy);
    const c = findCell(lon, lat);
    if (!c || !isOverLand(lon, lat)) { tip.style.display = 'none'; return; }
    const v = CURR.data.data[CURR.timeIndex][c.row][c.col];
    if (v === null || v === undefined || !isFinite(v)) { tip.style.display = 'none'; return; }
    const meta = CURR.meta;
    tip.innerHTML = `
        <div class="tt-label">${meta.label}</div>
        <div class="tt-coord">${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(2)}°E</div>
        <div class="tt-val">${v.toFixed(3)}<span> ${meta.unit}</span></div>`;
    tip.style.display = 'block';
    const host = tip.parentElement.getBoundingClientRect();
    tip.style.left = Math.min(px + 14, host.width - tip.offsetWidth - 8) + 'px';
    tip.style.top = Math.max(py - 40, 8) + 'px';
    const tc = tcColors();
    tip.style.background = tc.tooltipBg;
    tip.style.color = tc.text;
}

function hideTooltip() { const tip = document.getElementById('map-tooltip'); if (tip) tip.style.display = 'none'; }

function findCell(lon, lat) {
    const { lon: lonArr, lat: latArr, rowEdges } = CURR;
    if (!lonArr || !latArr) return null;
    const cols = lonArr.length;
    const colMin = lonArr[0], colMax = lonArr[cols - 1];
    if (lon < Math.min(colMin, colMax) || lon > Math.max(colMin, colMax) ||
        lat < Math.min(latArr[0], latArr[latArr.length - 1]) || lat > Math.max(latArr[0], latArr[latArr.length - 1])) {
        return null;
    }
    // columns: uniform spacing → direct index
    const dLon = (lonArr[cols - 1] - lonArr[0]) / (cols - 1);
    let col = Math.round((lon - lonArr[0]) / dLon);
    if (col < 0 || col >= cols) return null;
    // rows: merc not uniform → binary search on edges (rowEdges decreases with row index)
    let lo = 0, hi = rowEdges.length - 1;
    // find i such that rowEdges[i] >= wy > rowEdges[i+1]
    const wy = merc(lat);
    let row = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (rowEdges[mid] > wy) { lo = mid + 1; row = mid; } else { hi = mid - 1; }
    }
    if (row < 0 || row >= CURR.rows) return null;
    return { row, col };
}

// ─── Load & orchestrate ──────────────────────────────────────────────────────

async function loadData() {
    const timeSelector = document.getElementById('time-selector');
    const previousTimeIndex = parseInt((timeSelector && timeSelector.value) || '0', 10) || 0;

    const show = () => { const el = document.getElementById('loading'); if (el) el.classList.remove('hidden'); };
    const hide = () => { const el = document.getElementById('loading'); if (el) el.classList.add('hidden'); };

    show();
    try {
        const [data, topology] = await Promise.all([fetchData(currentData), getTopology()]);
        CURR.data = data;
        CURR.topology = topology;
        CURR.rings = buildRings(topology);
        CURR.meta = getMeta(currentData);
        CURR.timeData = coordArr(data.coords.valid_time || data.coords.time);
        if (!CURR.timeData.length) throw new Error('no time coordinates in ' + currentData);
        CURR.timeIndex = Math.min(Math.max(0, previousTimeIndex), CURR.timeData.length - 1);

        // Normalise axis orientation once: latitudes descending, longitudes ascending
        const latRaw = coordArr(data.coords.latitude).slice();
        const lonRaw = coordArr(data.coords.longitude).slice();
        let latOrder = latRaw[0] >= latRaw[latRaw.length - 1] ? 'desc' : 'asc';
        let lonOrder = lonRaw[0] <= lonRaw[lonRaw.length - 1] ? 'asc' : 'desc';
        if (latOrder === 'asc' || lonOrder === 'desc') {
            data.data = data.data.map(frame => {
                let f = frame;
                if (latOrder === 'asc') f = f.slice().reverse();
                if (lonOrder === 'desc') f = f.map(r => r.slice().reverse());
                return f;
            });
            if (latOrder === 'asc') latRaw.reverse();
            if (lonOrder === 'desc') lonRaw.reverse();
        }
        CURR.lat = latRaw;
        CURR.lon = lonRaw;
        computeGridEdges();
        gridCache = { key: null, img: null };
        // release the cached image for previous dataset
        if (CURR.prevData && CURR.prevData !== data) gridCache = { key: null, img: null };
        CURR.prevData = data;

        // Rebuild time selector
        if (timeSelector) {
            timeSelector.innerHTML = '';
            CURR.timeData.forEach((label, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                opt.textContent = label;
                timeSelector.appendChild(opt);
            });
            timeSelector.value = String(CURR.timeIndex);
        }

        ensureUI();
        resetView();
        draw();
        hide();

        // Time selector → instant redraw, no refetch
        if (timeSelector && !timeSelector._wired) {
            timeSelector._wired = true;
            timeSelector.addEventListener('change', () => {
                const idx = parseInt(timeSelector.value, 10);
                if (!isNaN(idx)) { CURR.timeIndex = idx; draw(); }
            });
        }
    } catch (err) {
        console.error('loadData failed:', err);
        hide();
        showError(err);
    }
}

function showError(err) {
    ensureUI();
    const box = document.getElementById('map-error');
    if (!box) return;
    const detail = (err && err.stack) ? err.stack.split('\n').slice(0, 3).join(' | ')
        : (err && err.message ? err.message : String(err));
    box.textContent = `Could not load the dataset — ${detail}`;
    console.error('Dataset failed to load:', err);
    box.style.display = 'block';
    box.innerHTML = `<strong>Dataset failed to load.</strong><br>${box.textContent}<br><button id="map-retry" style="margin-top:8px;padding:4px 12px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer">Retry</button>`;
    const btn = document.getElementById('map-retry');
    if (btn) btn.addEventListener('click', () => { box.style.display = 'none'; loadData(); });
}

function renderHeatmap(timeIndex, _sstData, _latData, _lonData, _topology, _timeData) {
    // Legacy page hook: re-render current frame only
    CURR.timeIndex = Math.max(0, Math.min(timeIndex | 0, CURR.timeData.length - 1));
    draw();
}
