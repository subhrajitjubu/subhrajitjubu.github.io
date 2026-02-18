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
            [0.00, '#e8f4f8'],
            [0.20, '#b0d4e8'],
            [0.40, '#5baed1'],
            [0.60, '#2171b5'],
            [0.80, '#08519c'],
            [1.00, '#08306b'],
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve metadata for the current variable path.
 * Matches by checking whether currentData ends with any known key,
 * so both "AOD_TOT" and "../src/AOD_TOT" resolve correctly.
 */
function getMeta(currentData) {
    for (const key of Object.keys(VARIABLE_META)) {
        if (currentData === key || currentData.endsWith('/' + key) || currentData.endsWith('\\' + key)) {
            return { key, ...VARIABLE_META[key] };
        }
    }
    // Fallback — generic jet-like scale
    return {
        key: 'unknown',
        label: currentData.split(/[\\/]/).pop(),
        unit: '',
        scale: [
            [0.00, '#2b0fff'],
            [0.25, '#00cfff'],
            [0.50, '#00e876'],
            [0.75, '#ff8c00'],
            [1.00, '#a80000'],
        ],
    };
}

/**
 * Compute 1st and 95th percentile min/max from an array of values.
 */
function percentileMinMax(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const idxMax = Math.ceil(0.95 * sorted.length) - 1;
    const idxMin = Math.ceil(0.01 * sorted.length) - 1;
    return { min: sorted[idxMin], max: sorted[idxMax] };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchData(dataType) {
    const url = `${dataType}.json`;
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    return response.json();
}

// ─── Load & orchestrate ───────────────────────────────────────────────────────

async function loadData() {
    const previousTimeIndex = parseInt(document.getElementById('time-selector').value, 10) || 0;

    const data = await fetchData(currentData);

    const timeData = data.coords.valid_time.data;
    const latData  = data.coords.latitude.data;
    const lonData  = data.coords.longitude.data;
    const sstData  = data.data;

    // Rebuild time selector
    const timeSelector = document.getElementById('time-selector');
    timeSelector.innerHTML = '';
    timeData.forEach((label, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = label;
        timeSelector.appendChild(opt);
    });
    if (timeSelector.options[previousTimeIndex]) {
        timeSelector.selectedIndex = previousTimeIndex;
    }

    // Load map topology
    const topology = await fetch('IND.json').then(r => r.json());

    const selectedIndex = parseInt(timeSelector.value, 10);
    renderHeatmap(selectedIndex, sstData, latData, lonData, topology, timeData);

    // Replace any previous listener to avoid stacking
    const newSelector = timeSelector.cloneNode(true);
    timeSelector.parentNode.replaceChild(newSelector, timeSelector);
    newSelector.selectedIndex = previousTimeIndex;
    newSelector.addEventListener('change', function () {
        const idx = parseInt(this.value, 10);
        if (!isNaN(idx)) renderHeatmap(idx, sstData, latData, lonData, topology, timeData);
    });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderHeatmap(timeIndex, sstData, latData, lonData, topology, timeData) {
    // Cache args so theme toggle can re-render without re-fetching
    window._lastRenderArgs = { timeIndex, sstData, latData, lonData, topology, timeData };

    const meta = getMeta(currentData);
    const tc   = (typeof getThemeColors === 'function') ? getThemeColors()
        : { text: '#d8e4f5', textDim: '#6b83a6', tooltipBg: 'rgba(13,22,39,0.96)',
            mapNull: '#0d1627', mapBorder: '#1e2f4a' };

    const sstForTime = sstData[timeIndex];

    // Build data array, filtering sentinel/missing values
    const formattedData = [];
    for (let i = 0; i < latData.length; i++) {
        for (let j = 0; j < lonData.length; j++) {
            const v = sstForTime[i][j];
            if (v === null || v === undefined || v === -273.15 || v === 0) continue;
            const lon = lonData[j] > 180 ? lonData[j] - 360 : lonData[j];
            formattedData.push({ lat: latData[i], lon, value: v });
        }
    }

    // Color axis bounds
    let minVal, maxVal;
    if (meta.fixedMin !== undefined && meta.fixedMax !== undefined) {
        minVal = meta.fixedMin;
        maxVal = meta.fixedMax;
    } else {
        const values = formattedData.map(p => p.value);
        ({ min: minVal, max: maxVal } = percentileMinMax(values));
    }

    const accentColor = (typeof isLight !== 'undefined' && isLight) ? '#0077cc' : '#38bdf8';

    Highcharts.mapChart('container', {
        chart: {
            map: topology,
            backgroundColor: 'transparent',
            style: { fontFamily: "'DM Sans', sans-serif" },
        },

        title: {
            text: meta.label,
            align: 'left',
            style: { color: tc.text, fontSize: '16px', fontWeight: '500', letterSpacing: '0.01em' },
        },

        subtitle: {
            text: `${timeData[timeIndex]} &nbsp;·&nbsp; ${meta.unit}`,
            align: 'left',
            useHTML: true,
            style: { color: tc.textDim, fontSize: '13px' },
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: { verticalAlign: 'bottom' },
        },

        mapView: {
            projection: { name: 'Mercator' },
            center: [80, 20],
            zoom: 5,
        },

        colorAxis: {
            min: minVal,
            max: maxVal,
            stops: meta.scale,
            labels: {
                style: { color: tc.textDim, fontSize: '11px', fontFamily: "'Space Mono', monospace" },
                formatter: function () { return Highcharts.numberFormat(this.value, 2); },
            },
        },

        plotOptions: {
            mapline: {
                enableMouseTracking: false,
                states: { inactive: { enabled: false } },
            },
        },

        tooltip: {
            useHTML: true,
            backgroundColor: tc.tooltipBg,
            borderColor: tc.mapBorder,
            borderRadius: 8,
            shadow: { color: 'rgba(0,0,0,0.5)', offsetX: 0, offsetY: 4, opacity: 0.4, width: 14 },
            style: { color: tc.text },
            formatter: function () {
                const p = this.point;
                return `<div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.8;padding:2px 0">
                    <div style="font-weight:500;color:${accentColor};margin-bottom:4px;font-size:14px">${meta.label}</div>
                    <div style="color:${tc.textDim};font-family:'Space Mono',monospace;font-size:11px">
                        ${p.lat.toFixed(2)}°N &nbsp; ${p.lon.toFixed(2)}°E
                    </div>
                    <div style="margin-top:6px;font-size:16px;font-weight:500;color:${tc.text}">
                        ${p.value.toFixed(3)}
                        <span style="font-size:12px;color:${tc.textDim};font-weight:400"> ${meta.unit}</span>
                    </div></div>`;
            },
        },

        series: [
            {
                name: 'Equal Earth',
                nullColor: tc.mapNull,
                borderColor: tc.mapBorder,
                interpolation: { enabled: true },
            },
            {
                name: meta.label,
                type: 'geoheatmap',
                colsize: 1,
                rowsize: 1,
                data: formattedData,
            },
            {
                type: 'mapline',
                name: 'Boundaries',
                nullColor: accentColor,
                data: Highcharts.geojson(topology),
            },
        ],
    });

    if (typeof updateStatusCard === 'function') {
        updateStatusCard(meta.label, meta.unit, timeData[timeIndex]);
    }
}
