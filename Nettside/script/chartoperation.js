var ctx = document.getElementById('myChart').getContext('2d'); //Defines the basic graphic element of the graph

var myLineChart = new Chart(ctx, { //Defines the graph
    type: 'line', //Defines the type of graph
    data: { //Decides how the data (content of the graph will be)
        labels: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '08:00', '09:00'], //Labels define the values of the x-axis (and can be altered at a later point/live)
        datasets: [ //Datasets refers to the different graphs and the data they contain
            {
                label: 'Temperatur', //Label of dataset/graph 1
                data: dataArr1, //The dataArray that actually stores the data
                backgroundColor: [ //The background color of the graph (usually not in use)
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [ //The border color of the graph (the color of the actual line)
                    'rgba(255, 99, 12, 1)'
                ],
                borderWidth: 1, //The width of the graph line
                fill: false
            },
            {
                label: 'Lysstyrke',
                data: dataArr2,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgb(29,28,255)'
                ],
                borderWidth: 1,
                fill: false
            }
        ]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true //Keep this true to begin at zero in the graph
                }
            }]
        },
        responsive: true,
        maintainAspectRatio: false
    }
});
