

function daysSince1800ToCalendar(days) {
    const startDate = new Date('1800-01-01T00:00:00Z');
    const offset = 5.5 * 60 * 60 * 1000;
    const targetDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    const localDate = new Date(targetDate.getTime() + offset);
    return `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`;
    // return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

}

async function fetchData(dataType) {
    const response = await fetch(`${dataType}.json`);
    return response.json();
}



async function loadData() {
    const previousTimeIndex = document.getElementById('time-selector').value || 0; // Preserve selected index

    const data = await fetchData(currentData);
    const data1 =  await fetchData("TIME");
    // console.log(data1.data);


    const timeData =data1.data;
    const latData = data.coords.latitude.data;
    const lonData = data.coords.longitude.data;
    const sstData = data.data;

    const timeSelector = document.getElementById('time-selector');
    timeSelector.innerHTML = ''; // Clear previous options

    // Populate time options in the selector
    timeData.forEach((days, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = days;
        timeSelector.appendChild(option);
    });

    if (timeSelector.options[previousTimeIndex]) {
        timeSelector.selectedIndex = previousTimeIndex;
    };

    // Load the base world map topology
    const topology = await fetch('IND.geojson').then(response => response.json());
    // console.log(topology);
    const selectedTimeIndex = parseInt(timeSelector.value, 10);
    createGeoHeatmapForTime(selectedTimeIndex, sstData, latData, lonData, topology, timeData);


    timeSelector.addEventListener('change', function () {
        const timeIndex = parseInt(this.value, 10);
        if (!isNaN(timeIndex)) {
            createGeoHeatmapForTime(timeIndex, sstData, latData, lonData, topology, timeData);
        }
    });
}

async function createGeoHeatmapForTime(timeIndex, sstData, latData, lonData, topology, timeData) {
    const sstForTime = sstData[timeIndex];
    // console.log(timeData[timeIndex]);

    const formattedData = [];

    for (let i = 0; i < latData.length; i += 1) {
        for (let j = 0; j < lonData.length; j += 1) {
            const tempValue = sstForTime[i][j];
            if (tempValue !== null && tempValue !== undefined && tempValue !== -273.15&& tempValue !== 0) {
                let adjustedLon = lonData[j] > 180 ? lonData[j] - 360 : lonData[j];
                formattedData.push({
                    lat: latData[i],
                    lon: adjustedLon,
                    value: tempValue
                });
            }
        }
    }
    const values = formattedData.map(item => item.value);
    const sortedValues = values.sort((a, b) => a - b);
    const indexmax = Math.ceil(0.95 * sortedValues.length) - 1; 
    const indexmin = Math.ceil(0.01 * sortedValues.length) - 1; 
    const maxTemp90Percentile = sortedValues[indexmax];
    const minTemp90Percentile = sortedValues[indexmin];
    // console.log(maxTemp90Percentile,minTemp90Percentile);

    // minTemp = minTemp90Percentile;
    // maxTemp = maxTemp90Percentile;


    let pp;
    if (currentData === 'AOD_SEA' || currentData === 'AOD_DUST' || currentData === 'PM25' 
        || currentData === 'PM10' 
        || currentData === 'AOD_TOT' || currentData === 'AOD_SUL' || currentData === 'AOD_NIT') 
        {
            pp=[
                [0.000, 'rgba(255, 255, 255, 1.0)'], 
                [0.063, 'rgba(209, 214, 234, 1.0)'], 
                [0.126, 'rgba(165, 173, 214, 1.0)'], 
                [0.196, 'rgba(135, 145, 191, 1.0)'], 
                [0.256, 'rgba(163, 165, 142, 1.0)'], 
                [0.326, 'rgba(188, 188, 99, 1.0)'],  
                [0.393, 'rgba(214, 209, 56, 1.0)'],  
                [0.463, 'rgba(242, 229, 10, 1.0)'],  
                [0.523, 'rgba(242, 196, 10, 1.0)'],   
                [0.583, 'rgba(244, 163, 7, 1.0)'],  
                [0.653, 'rgba(247, 130, 5, 1.0)'],   
                [0.720, 'rgba(247, 96, 5, 1.0)'],     
                [0.790, 'rgba(249, 63, 2, 1.0)'],     
                [0.853, 'rgba(252, 30, 0, 1.0)'],    
                [1.000, 'rgba(255, 0, 0, 1.0)']      
            ]
        }
        else{
            pp=[[0.001, 'rgba(255, 255, 255,0.8)'],
            [0.008, 'rgba(0, 0, 14,0.8)'],
            [0.012, 'rgba(0, 0, 21,0.8)'],
            [0.016, 'rgba(0, 0, 28,0.8)'],
            [0.02, 'rgba(0, 0, 35,0.8)'],
            [0.024, 'rgba(0, 0, 42,0.8)'],
            [0.027, 'rgba(0, 0, 49,0.8)'],
            [0.031, 'rgba(0, 0, 56,0.8)'],
            [0.035, 'rgba(0, 0, 63,0.8)'],
            [0.039, 'rgba(0, 0, 70,0.8)'],
            [0.043, 'rgba(0, 0, 77,0.8)'],
            [0.047, 'rgba(0, 0, 84,0.8)'],
            [0.051, 'rgba(0, 0, 91,0.8)'],
            [0.055, 'rgba(0, 0, 98,0.8)'],
            [0.059, 'rgba(0, 0, 105,0.8)'],
            [0.063, 'rgba(0, 0, 112,0.8)'],
            [0.067, 'rgba(0, 0, 119,0.8)'],
            [0.071, 'rgba(0, 0, 126,0.8)'],
            [0.075, 'rgba(0, 0, 133,0.8)'],
            [0.078, 'rgba(0, 0, 140,0.8)'],
            [0.082, 'rgba(0, 0, 147,0.8)'],
            [0.086, 'rgba(0, 0, 154,0.8)'],
            [0.09, 'rgba(0, 0, 161,0.8)'],
            [0.094, 'rgba(0, 0, 168,0.8)'],
            [0.098, 'rgba(0, 0, 175,0.8)'],
            [0.102, 'rgba(0, 0, 182,0.8)'],
            [0.106, 'rgba(0, 0, 189,0.8)'],
            [0.11, 'rgba(0, 0, 196,0.8)'],
            [0.114, 'rgba(0, 0, 203,0.8)'],
            [0.118, 'rgba(0, 0, 210,0.8)'],
            [0.122, 'rgba(0, 0, 217,0.8)'],
            [0.125, 'rgba(0, 0, 224,0.8)'],
            [0.129, 'rgba(0, 0, 231,0.8)'],
            [0.133, 'rgba(0, 0, 238,0.8)'],
            [0.137, 'rgba(0, 0, 245,0.8)'],
            [0.141, 'rgba(0, 0, 252,0.8)'],
            [0.145, 'rgba(0, 4, 255,0.8)'],
            [0.149, 'rgba(0, 11, 255,0.8)'],
            [0.153, 'rgba(0, 18, 255,0.8)'],
            [0.157, 'rgba(0, 25, 255,0.8)'],
            [0.161, 'rgba(0, 32, 255,0.8)'],
            [0.165, 'rgba(0, 39, 255,0.8)'],
            [0.169, 'rgba(0, 46, 255,0.8)'],
            [0.173, 'rgba(0, 53, 255,0.8)'],
            [0.176, 'rgba(0, 60, 255,0.8)'],
            [0.18, 'rgba(0, 67, 255,0.8)'],
            [0.184, 'rgba(0, 74, 255,0.8)'],
            [0.188, 'rgba(0, 81, 255,0.8)'],
            [0.192, 'rgba(0, 88, 255,0.8)'],
            [0.196, 'rgba(0, 95, 255,0.8)'],
            [0.2, 'rgba(0, 102, 255,0.8)'],
            [0.204, 'rgba(0, 109, 255,0.8)'],
            [0.208, 'rgba(0, 116, 255,0.8)'],
            [0.212, 'rgba(0, 123, 255,0.8)'],
            [0.216, 'rgba(0, 130, 255,0.8)'],
            [0.22, 'rgba(0, 137, 255,0.8)'],
            [0.224, 'rgba(0, 144, 255,0.8)'],
            [0.227, 'rgba(0, 151, 255,0.8)'],
            [0.231, 'rgba(0, 158, 255,0.8)'],
            [0.235, 'rgba(0, 165, 255,0.8)'],
            [0.239, 'rgba(0, 172, 255,0.8)'],
            [0.243, 'rgba(0, 179, 255,0.8)'],
            [0.247, 'rgba(0, 186, 255,0.8)'],
            [0.251, 'rgba(0, 193, 255,0.8)'],
            [0.255, 'rgba(0, 200, 255,0.8)'],
            [0.259, 'rgba(0, 207, 255,0.8)'],
            [0.263, 'rgba(0, 214, 255,0.8)'],
            [0.267, 'rgba(0, 221, 255,0.8)'],
            [0.271, 'rgba(0, 227, 255,0.8)'],
            [0.275, 'rgba(0, 235, 255,0.8)'],
            [0.278, 'rgba(0, 242, 255,0.8)'],
            [0.282, 'rgba(0, 249, 255,0.8)'],
            [0.286, 'rgba(0, 255, 254,0.8)'],
            [0.29, 'rgba(0, 255, 246,0.8)'],
            [0.294, 'rgba(0, 255, 239,0.8)'],
            [0.298, 'rgba(0, 255, 232,0.8)'],
            [0.302, 'rgba(0, 255, 226,0.8)'],
            [0.306, 'rgba(0, 255, 218,0.8)'],
            [0.31, 'rgba(0, 255, 211,0.8)'],
            [0.314, 'rgba(0, 255, 204,0.8)'],
            [0.318, 'rgba(0, 255, 198,0.8)'],
            [0.322, 'rgba(0, 255, 190,0.8)'],
            [0.325, 'rgba(0, 255, 183,0.8)'],
            [0.329, 'rgba(0, 255, 177,0.8)'],
            [0.333, 'rgba(0, 255, 170,0.8)'],
            [0.337, 'rgba(0, 255, 162,0.8)'],
            [0.341, 'rgba(0, 255, 155,0.8)'],
            [0.345, 'rgba(0, 255, 149,0.8)'],
            [0.349, 'rgba(0, 255, 142,0.8)'],
            [0.353, 'rgba(0, 255, 134,0.8)'],
            [0.357, 'rgba(0, 255, 127,0.8)'],
            [0.361, 'rgba(0, 255, 120,0.8)'],
            [0.365, 'rgba(0, 255, 114,0.8)'],
            [0.369, 'rgba(0, 255, 106,0.8)'],
            [0.373, 'rgba(0, 255, 99,0.8)'],
            [0.376, 'rgba(0, 255, 92,0.8)'],
            [0.38, 'rgba(0, 255, 86,0.8)'],
            [0.384, 'rgba(0, 255, 78,0.8)'],
            [0.388, 'rgba(0, 255, 71,0.8)'],
            [0.392, 'rgba(0, 255, 64,0.8)'],
            [0.396, 'rgba(0, 255, 58,0.8)'],
            [0.4, 'rgba(0, 255, 50,0.8)'],
            [0.404, 'rgba(0, 255, 43,0.8)'],
            [0.408, 'rgba(0, 255, 36,0.8)'],
            [0.412, 'rgba(0, 255, 30,0.8)'],
            [0.416, 'rgba(0, 255, 22,0.8)'],
            [0.42, 'rgba(0, 255, 15,0.8)'],
            [0.424, 'rgba(0, 255, 8,0.8)'],
            [0.427, 'rgba(0, 255, 2,0.8)'],
            [0.431, 'rgba(5, 255, 0,0.8)'],
            [0.435, 'rgba(12, 255, 0,0.8)'],
            [0.439, 'rgba(19, 255, 0,0.8)'],
            [0.443, 'rgba(26, 255, 0,0.8)'],
            [0.447, 'rgba(33, 255, 0,0.8)'],
            [0.451, 'rgba(40, 255, 0,0.8)'],
            [0.455, 'rgba(47, 255, 0,0.8)'],
            [0.459, 'rgba(54, 255, 0,0.8)'],
            [0.463, 'rgba(61, 255, 0,0.8)'],
            [0.467, 'rgba(68, 255, 0,0.8)'],
            [0.471, 'rgba(75, 255, 0,0.8)'],
            [0.475, 'rgba(82, 255, 0,0.8)'],
            [0.478, 'rgba(89, 255, 0,0.8)'],
            [0.482, 'rgba(96, 255, 0,0.8)'],
            [0.486, 'rgba(103, 255, 0,0.8)'],
            [0.49, 'rgba(110, 255, 0,0.8)'],
            [0.494, 'rgba(117, 255, 0,0.8)'],
            [0.498, 'rgba(124, 255, 0,0.8)'],
            [0.502, 'rgba(131, 255, 0,0.8)'],
            [0.506, 'rgba(138, 255, 0,0.8)'],
            [0.51, 'rgba(145, 255, 0,0.8)'],
            [0.514, 'rgba(151, 255, 0,0.8)'],
            [0.518, 'rgba(159, 255, 0,0.8)'],
            [0.522, 'rgba(166, 255, 0,0.8)'],
            [0.525, 'rgba(173, 255, 0,0.8)'],
            [0.529, 'rgba(180, 255, 0,0.8)'],
            [0.533, 'rgba(187, 255, 0,0.8)'],
            [0.537, 'rgba(194, 255, 0,0.8)'],
            [0.541, 'rgba(201, 255, 0,0.8)'],
            [0.545, 'rgba(207, 255, 0,0.8)'],
            [0.549, 'rgba(215, 255, 0,0.8)'],
            [0.553, 'rgba(222, 255, 0,0.8)'],
            [0.557, 'rgba(229, 255, 0,0.8)'],
            [0.561, 'rgba(236, 255, 0,0.8)'],
            [0.565, 'rgba(243, 255, 0,0.8)'],
            [0.569, 'rgba(250, 255, 0,0.8)'],
            [0.573, 'rgba(255, 254, 0,0.8)'],
            [0.576, 'rgba(255, 251, 0,0.8)'],
            [0.58, 'rgba(255, 249, 0,0.8)'],
            [0.584, 'rgba(255, 246, 0,0.8)'],
            [0.588, 'rgba(255, 244, 0,0.8)'],
            [0.592, 'rgba(255, 241, 0,0.8)'],
            [0.596, 'rgba(255, 239, 0,0.8)'],
            [0.6, 'rgba(255, 237, 0,0.8)'],
            [0.604, 'rgba(255, 234, 0,0.8)'],
            [0.608, 'rgba(255, 232, 0,0.8)'],
            [0.612, 'rgba(255, 229, 0,0.8)'],
            [0.616, 'rgba(255, 227, 0,0.8)'],
            [0.62, 'rgba(255, 224, 0,0.8)'],
            [0.624, 'rgba(255, 222, 0,0.8)'],
            [0.627, 'rgba(255, 219, 0,0.8)'],
            [0.631, 'rgba(255, 217, 0,0.8)'],
            [0.635, 'rgba(255, 214, 0,0.8)'],
            [0.639, 'rgba(255, 212, 0,0.8)'],
            [0.643, 'rgba(255, 209, 0,0.8)'],
            [0.647, 'rgba(255, 207, 0,0.8)'],
            [0.651, 'rgba(255, 204, 0,0.8)'],
            [0.655, 'rgba(255, 202, 0,0.8)'],
            [0.659, 'rgba(255, 199, 0,0.8)'],
            [0.663, 'rgba(255, 197, 0,0.8)'],
            [0.667, 'rgba(255, 195, 0,0.8)'],
            [0.671, 'rgba(255, 192, 0,0.8)'],
            [0.675, 'rgba(255, 190, 0,0.8)'],
            [0.678, 'rgba(255, 187, 0,0.8)'],
            [0.682, 'rgba(255, 185, 0,0.8)'],
            [0.686, 'rgba(255, 182, 0,0.8)'],
            [0.69, 'rgba(255, 180, 0,0.8)'],
            [0.694, 'rgba(255, 177, 0,0.8)'],
            [0.698, 'rgba(255, 175, 0,0.8)'],
            [0.702, 'rgba(255, 172, 0,0.8)'],
            [0.706, 'rgba(255, 170, 0,0.8)'],
            [0.71, 'rgba(255, 167, 0,0.8)'],
            [0.714, 'rgba(255, 165, 0,0.8)'],
            [0.718, 'rgba(255, 161, 0,0.8)'],
            [0.722, 'rgba(255, 156, 0,0.8)'],
            [0.725, 'rgba(255, 152, 0,0.8)'],
            [0.729, 'rgba(255, 147, 0,0.8)'],
            [0.733, 'rgba(255, 143, 0,0.8)'],
            [0.737, 'rgba(255, 138, 0,0.8)'],
            [0.741, 'rgba(255, 133, 0,0.8)'],
            [0.745, 'rgba(255, 129, 0,0.8)'],
            [0.749, 'rgba(255, 124, 0,0.8)'],
            [0.753, 'rgba(255, 120, 0,0.8)'],
            [0.757, 'rgba(255, 115, 0,0.8)'],
            [0.761, 'rgba(255, 111, 0,0.8)'],
            [0.765, 'rgba(255, 106, 0,0.8)'],
            [0.769, 'rgba(255, 102, 0,0.8)'],
            [0.773, 'rgba(255, 97, 0,0.8)'],
            [0.776, 'rgba(255, 93, 0,0.8)'],
            [0.78, 'rgba(255, 88, 0,0.8)'],
            [0.784, 'rgba(255, 84, 0,0.8)'],
            [0.788, 'rgba(255, 79, 0,0.8)'],
            [0.792, 'rgba(255, 75, 0,0.8)'],
            [0.796, 'rgba(255, 70, 0,0.8)'],
            [0.8, 'rgba(255, 65, 0,0.8)'],
            [0.804, 'rgba(255, 61, 0,0.8)'],
            [0.808, 'rgba(255, 56, 0,0.8)'],
            [0.812, 'rgba(255, 52, 0,0.8)'],
            [0.816, 'rgba(255, 47, 0,0.8)'],
            [0.82, 'rgba(255, 43, 0,0.8)'],
            [0.824, 'rgba(255, 38, 0,0.8)'],
            [0.827, 'rgba(255, 34, 0,0.8)'],
            [0.831, 'rgba(255, 29, 0,0.8)'],
            [0.835, 'rgba(255, 25, 0,0.8)'],
            [0.839, 'rgba(255, 20, 0,0.8)'],
            [0.843, 'rgba(255, 16, 0,0.8)'],
            [0.847, 'rgba(255, 11, 0,0.8)'],
            [0.851, 'rgba(255, 7, 0,0.8)'],
            [0.855, 'rgba(255, 2, 0,0.8)'],
            [0.859, 'rgba(255, 2, 2,0.8)'],
            [0.863, 'rgba(255, 10, 10,0.8)'],
            [0.867, 'rgba(255, 17, 17,0.8)'],
            [0.871, 'rgba(255, 24, 24,0.8)'],
            [0.875, 'rgba(255, 31, 31,0.8)'],
            [0.878, 'rgba(255, 38, 38,0.8)'],
            [0.882, 'rgba(255, 45, 45,0.8)'],
            [0.886, 'rgba(255, 52, 52,0.8)'],
            [0.89, 'rgba(255, 58, 58,0.8)'],
            [0.894, 'rgba(255, 66, 66,0.8)'],
            [0.898, 'rgba(255, 73, 73,0.8)'],
            [0.902, 'rgba(255, 80, 80,0.8)'],
            [0.906, 'rgba(255, 87, 87,0.8)'],
            [0.91, 'rgba(255, 94, 94,0.8)'],
            [0.914, 'rgba(255, 101, 101,0.8)'],
            [1, 'rgba(255, 107, 107,0.8)'],
            ]
        }    


    let minTemp;
    let maxTemp;
    
    if (currentData === 'AOD_SEA' || currentData === 'AOD_DUST' 
        || currentData === 'AOD_TOT' || currentData === 'AOD_SUL' || currentData === 'AOD_NIT') {
        minTemp = 0.001;
        maxTemp = 3;
        
        
    } else {
        minTemp = minTemp90Percentile;
        maxTemp = maxTemp90Percentile;
       
    }
    
    // // Now you can use minTemp and maxTemp here
    console.log(minTemp, maxTemp);










    let dataType;
if (currentData === '2m_temp') {
dataType = 'Temperature (k)';
} else if (currentData === 'tcwv') {
dataType = 'Total Column Water Vapor (kg m-2)';
} else if (currentData === 'rf') {
dataType = 'Rainfall (mm)';
} else if (currentData === 'msl') {
dataType = 'Mean Sea Level (hPa)';
} 
else if (currentData === 'PM25') {
    dataType = 'PM2.5 (µg/m³)';
}    else if (currentData === 'PM10') {
    dataType = 'PM10(µg/m³)';
}else {
dataType = 'Unknown Data Type';
}


    Highcharts.mapChart('container', {
        chart: {
            map: topology,
            backgroundColor: '#ffffff'
            // '#222'
        },

        title: {
            text: `GeoHeatmap Time ${timeData[timeIndex]}`,//for ${dataType} 
            align: 'left',
            style: {
                color: '#000000'
            }
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        mapView: {
            projection: {
                name: 'Mercator'
            },
            center: [80, 20],
            zoom: 5
        },

        colorAxis: {
            min: minTemp,
            max: maxTemp, // Adjust max based on your temperature range
            stops:pp

            
            
                        
           ,
            labels: {
                style: {
                    color: '#000000'
                }
            }
        },

        plotOptions: {
            mapline: {
                enableMouseTracking: false,
                states: {
                    inactive: {
                        enabled: false
                    }
                }

            }
        },
        series: [{
            name: 'Equal Earth',
            nullColor: '#000',
            borderColor: '#222',
            interpolation: {
                enabled: true
            },
        }, {
            name: currentData === 'rf' ? 'Rainfall' : 'Mean Sea Level',
            colsize: 1,
            rowsize: 1,
            data: formattedData,
            type: 'geoheatmap',
            tooltip: {
                headerFormat: '<span style="font-size: 14">Lon: {point.point.lon:.2f}° Lat: {point.point.lat:.2f}°</span><br/>',
                pointFormat: 'Value: {point.value:.2f}'
            },
        }, {
            nullColor: '#383838',
            type: 'mapline',
            name: 'Outlines of the Continents',
            data: Highcharts.geojson(topology)
        }]
    });
}


