/* data route */

var plot_url = `/jisan`;
var chart_url = `/chart`
// console.log(picker.startDate.format('YYYY-MM-DD'));
//var url = `/data?${startDate}`;
var bikeLayer;

var map;
var layer;
var startDate = "2019-04-06";
var endDate = "2019-04-07";
var termID = 1;
//var plot_url = `/jisan?startDate=${startDate}&endDate=${endDate}`

function buildPlot(startDate, endDate) {
  plot_url = `/jisan?startDate=${startDate}&endDate=${endDate}`
  d3.json(plot_url).then(function(response) {
    // console.log("map");
    console.log(plot_url);
    // console.log("map");

    createMarkers(response);
    function createMarkers(response) {
      // Pull the "stations" property off of response.data
      var stations = response;

      // Initialize an array to hold bike markers
      var bikeMarkers = [];

      // Loop through the stations array
      for (var index = 0; index < stations.length; index++) {
        
        var station = stations[index];
        //console.log(station.long)
        // For each station, create a marker and bind a popup with the station's name
        var total_docks = station.num_bikes + station.num_empty_docks;
        //console.log(total_docks)
        // var bikeMarker = L.marker([station.lat, station.long]).bindPopup(
        //   "<h4>" + station.address + "<h3><h3>Capacity: " + total_docks + "<h3>" 
        // );
        //var num_bikes = [];
        //var times = [];
        //chart_url = `/chart?startDate=${startDate}&endDate=${endDate}&termID=${station.term_id}`

        // d3.json(chart_url).then(function(response) {
     
        //   var events = response;
        //   for (var i = 0; i < events.length; i++) {
        //     var event = events[i];
        //     console.log(event.term_id)
        //     // For each station, create a marker and bind a popup with the station's name
        //     times.push(event.time);
        //     num_bikes.push(event.num_bikes);
        //   }
        // })

          var bikeMarker = L.marker([station.lat, station.long])
          .bindPopup("<p>" + station.address + "<p><p>Capacity: " + total_docks + "<p>" + station.term_id + "<p>");

          console.log("TOMMY");
          console.log(startDate);
          console.log(endDate);

          bikeMarker.id = station.term_id;
          bikeMarker.on('click', function(e) {console.log(e.target.id)})
          bikeMarker.on('click', function(e) {buildChart(startDate, endDate,e.target.id)})
          
          //.bindPopup('<div id="plot"></div>')
          // .on('popupopen', function (e) {
          //   Plotly.newPlot('plot', [{
          //       x: times,
          //       y: num_bikes,
          //       mode: "lines",
          //       type: 'scatter'
          //   }], {
          //       autosize: true,
          //       width: 300,
          //       height: 150,
          //       margin: {
          //           l: 0,
          //           r: 0,
          //           b: 0,
          //           t: 0,
          //           pad: 0
          //       }
          //       });
          //   });
          
          bikeMarkers.push(bikeMarker);
        // Add the marker to the bikeMarkers array
      }
      console.log(bikeMarkers)
      //console.log(bikeMarkers);
      // Create a layer group made from the bike markers array, pass it into the createMap function
    createMap(L.layerGroup(bikeMarkers));
    }

    function createMap(bikeStations) {
      const API_KEY =
        "sk.eyJ1IjoicHJvZmVzc29yZGFydCIsImEiOiJjanU1eWp6cGswZ3ViNGRsbXFiem0wb2plIn0.EQfkhoPxPipXPYmCAO77vQ";
      //console.log(bikeStations);
      // Create the tile layer that will be the background of our map
  
      // Create a baseMaps object to hold the lightmap layer
      

      if (bikeLayer) {
        bikeLayer.clearLayers();
        map.removeControl(layer);
      }

      bikeLayer = bikeStations;

      // Create an overlayMaps object to hold the bikeStations layer
      var overlayMaps = {
        "Bike Stations": bikeLayer
      };

      // Create the map object with options
      if (!map) {
        var lightmap = L.tileLayer(
          "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}",
          {
            attribution:
              'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: "mapbox.light",
            accessToken: API_KEY
          }
        );
        var baseMaps = {
          "Light Map": lightmap
        };
        map = L.map("map", {
          center: [38.9072, -77.0369],
          zoom: 12,
          layers: [lightmap, bikeStations]
        });
        layer = L.control
          .layers(baseMaps, overlayMaps, {
            collapsed: false
          })
          .addTo(map);
      } else {
        map.addLayer(bikeLayer)
        layer = L.control
          .layers(baseMaps, overlayMaps, {
            collapsed: false
          })
          .addTo(map);
      }
    }

    // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map

  });
}

function buildChart(startDate, endDate, termID) {

  chart_url = `/chart?startDate=${startDate}&endDate=${endDate}&termID=${termID}`

  d3.json(chart_url).then(function(response) {
    var stations = response;
    // Initialize an array to hold bike markers
    var num_bikes = [];
    var times = [];

    for (var index = 0; index < stations.length; index++) {
      var station = stations[index];
      //console.log(station.long)
      // For each station, create a marker and bind a popup with the station's name
      times.push(station.time);
      num_bikes.push(station.num_bikes);
    }
    //console.log(times);
    //console.log(num_bikes);

    var trace = {
      type: "scatter",
      mode: "lines",
      name: "Bikes Available",
      x: times,
      y: num_bikes
    };

    var data = [trace];

    var layout = {
      title: "Number of Bikes Available",
      xaxis: {
        type: "date"
      },
      yaxis: {
        autorange: true,
        type: "linear"
      }
    };
    Plotly.newPlot("plot", data, layout);
  });
}

$(function() {
  $('input[name="daterange"]').daterangepicker(
    {
      opens: "left"
    },
    function(start, end, label) {
      (startDate = start.format("YYYY-MM-DD")),
        (endDate = end.format("YYYY-MM-DD")),
        (url = `/jisan`),
        console.log(startDate),
        console.log(
          "A new date selection was made: " +
            start.format("YYYY-MM-DD") +
            " to " +
            end.format("YYYY-MM-DD")
        );
      buildPlot(startDate,endDate);
    }
  );
});
buildPlot(startDate,endDate);

// map.on('click',function(e) {
//   buildChart(startDate,endDate,id)
// })

//buildChart(startDate,endDate,termID);