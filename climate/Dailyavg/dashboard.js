
    // Function to load GeoJSON
    function loadGeoJSON(file) {
        fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Clear existing layers
                map.eachLayer(function (layer) {
                    if (layer instanceof L.GeoJSON) {
                        map.removeLayer(layer);
                    }
                });

                // Add GeoJSON layer to the map
                L.geoJSON(data, {
                    style: style,
                    onEachFeature: onEachFeature
                }).addTo(map);
            })
            .catch(error => console.error('Error loading GeoJSON:', error));
    }

    // Function to populate the date selector
    function populateDateSelector() {
        const selector = document.getElementById('date-selector');
        selector.innerHTML = ''; // Clear existing options

        // Generate the list of dates for a leap year (366 days)
        const year = 2024; // Example leap year
        const startDate = new Date(year, 0, 1); // January 1
        const endDate = new Date(year, 11, 31); // December 31
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = date.toLocaleString('default', { month: 'long' }).toLowerCase().slice(0, 3); // Get month in lowercase
            const dateString = `${day}-${month}`;
            const option = document.createElement('option');
            option.value = `${dateString}.geojson`;
            option.textContent = dateString;
            selector.appendChild(option);
        }

        // Load the first file by default
        if (selector.options.length > 0) {
            loadGeoJSON(selector.options[0].value);
        }
    }

    // Event listener for date selection

    // Function to handle each feature
    function onEachFeature(feature, layer) {
        if (feature.properties) {
            layer.bindPopup(`<strong>District:</strong> ${feature.properties.District}
<strong>RAINFALL (mm/day):</strong> ${feature.properties.RAINFALL} mm`);
          let highlightedLayer = null;

            // Add a click event to zoom into the feature and show the chart
            layer.on('click', function() {
              if (highlightedLayer) {
                      highlightedLayer.setStyle({
                          weight: 2,
                          color: 'white',
                          dashArray: '3',
                          fillOpacity: 0.7,
                      });
                  }

                  // Highlight the clicked layer
                  layer.setStyle({
                      weight: 5,
                      color: '#666',
                      dashArray: '',
                      fillOpacity: 0.9,
                  });
                  highlightedLayer = layer;

                const center = layer.getBounds().getCenter();
                map.setView(center, 7);


              // map.fitBounds(layer.getBounds());
              
                loadTimeSeriesData(feature.properties.District);
            });
        }
    }

    // Function to load time series data for the selected feature
    function loadTimeSeriesData(district) {
        // Example: Fetch time series data from a JSON file or API
        // Replace this URL with the actual data source
        const timeSeriesDataUrl = `${district}.json`;

        fetch(timeSeriesDataUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
              console.log(data.RAINFALL)
              const datesString = data.TIME;


                renderLineChart(datesString,data.RAINFALL,district);
            })
            .catch(error => console.error('Error loading time series data:', error));
    }
    
    

   

    function renderLineChart(time1,data1, district) {
    // Check if values is an array and contains data
    const values = Object.values(data1);
    const time = Object.values(time1);
    console.log(time)

    // if (!Array.isArray(values)) {
    //     console.error('Values must be an array.');
    //     return;
    // }

    // if (values.length === 0) {
    //     console.error('Values array must not be empty.');
    //     return;
    // }

    // Generate default x-axis categories if dates are not provided
//     const defaultDates = Array.from({ length: values.length }, (_, i) => `Day ${i + 1}`);
//     const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
    
// const result = average( values ); // 5


        const movingMean = values.map((_, index, arr) => {
            if (index < 2) return null; // Not enough data for a 3-day mean
            const sum = arr[index - 2] + arr[index - 1] + arr[index];
            return sum / 3;
        });

        // Replace leading nulls with nulls to match the chart length
        const paddedMovingMean = new Array(7).fill(null).concat(movingMean.slice(7));
        const sanitizedValues = values.map(val => (val === null || val === undefined ? 0 : val));

        const sanitizedMovingMean = paddedMovingMean.map(val => (val === null || val === undefined ? 0 : val));

        const defaultDates = Array.from({ length: values.length }, (_, i) => {
            const date = new Date(2020, 0, i + 1); // 2020 is a leap year
            return date.toLocaleDateString('en-US', { day: '2-digit',  month: '2-digit',});
        });
        console.log(defaultDates);


    // Render the Highcharts chart
    Highcharts.chart('chart-container', {
        chart: {
            type: 'column',
            zoomType: 'xy', // Enable zooming along the X-axis
        },
        title: {
            text: `Daily climatological Rainfall for ${district}`
        },
        subtitle: {
            text: 'Use mouse to zoom and pan'
        },
        xAxis: {
            categories: time,
            title: {
                text: 'Days'
            }
        },
        yAxis: {
            title: {
                text: 'Rainfall (mm/day)'
            }
        },
    //     tooltip: {
    //         headerFormat: '<b>{series.name}, Date: {point.key}</b><br>',
    //         pointFormat: '{point.y} Kg',
    //         xDateFormat: ' %d %B, %Y',
    //   },
        tooltip:
        {
            outside: true,
            split: false,
            shared: true,

            useHTML: true,
            headerFormat: '{point.key}',
            xDateFormat: ' %d %b',

            pointFormat: '<p style="font-size:12px;margin:0px;padding-top:1px;padding-bottom:1px;color:{series.color};">{series.name} <strong>{point.y}</strong></p>',
            valueDecimals: 2,
            backgroundColor: 'rgb(21, 104, 212)',
            borderWidth: 0,
            style: {
                width: '150px',
                padding: '0px'
            },
            shadow: false
        },
        
        
        
        // {
        //     shared: true,
        //     xDateFormat: '%Y-%m-%d',
        //     headerFormat: '{point.x:%e %b %H:%M}',

        //                 formatter: function () {
        //         return `
                    
        //             <b>${this.points[0].series.name}:</b> ${this.points[0].y.toFixed(2)} mm<br>
        //             <b>${this.points[1]?.series.name || 'N/A'}:</b> ${this.points[1]?.y?.toFixed(2) || 'N/A'} mm
        //         `;
        //     }
        // },
        series: [
            {
                name: 'Daily Rainfall',
                data: sanitizedValues,
                color: 'rgba(75, 192, 192, 1)'
            },
            {
                name: '7-Day Moving Mean',
                data: sanitizedMovingMean,
                color: 'red',
                type:'line',
                dashStyle: 'ShortDash'
            }
        ]
            ,        
        accessibility: {
            description: `Line chart showing daily rainfall data for ${district}.`
        }
    });
}











    function getColor(rainfall) {
            return   rainfall > 25 ? '#800026' :
               rainfall > 15 ? '#BD0026' :
               rainfall > 10 ? '#E31A1C' :
               rainfall > 5 ? '#FC4E2A' :
               rainfall > 2 ? '#FD8D3C' :
               rainfall > 1 ? 'rgb(57, 224, 132)' :
               rainfall > 0 ? 'rgb(121, 141, 141)' :
                              '#FFEDA0';
    }

    // Function to style the GeoJSON layer
    function style(feature) {
        return {
            fillColor: getColor(feature.properties.RAINFALL),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    // Populate the date selector
    populateDateSelector();





    