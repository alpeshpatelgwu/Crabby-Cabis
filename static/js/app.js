/* data route */


var url = "/data";
function buildPlot() {
  d3.json(url).then(function(response) {
    
    console.log("look here")
    console.log(url)
    console.log("look here")

    createMarkers(response)
    function createMarkers(response) {

      // Pull the "stations" property off of response.data
      var stations = response;
    
      // Initialize an array to hold bike markers
      var bikeMarkers = [];
    
      // Loop through the stations array
      for (var index = 0; index < stations.length; index++) {
        var station = stations[index]
        //console.log(station.long)
        // For each station, create a marker and bind a popup with the station's name
        var total_docks = station.num_bikes + station.num_empty_docks;
        //console.log(total_docks)
        var bikeMarker = L.marker([station.lat, station.long])
          .bindPopup("<h3>" + station.address + "<h3><h3>Capacity: " + total_docks + "<h3>");
    
        // Add the marker to the bikeMarkers array
        bikeMarkers.push(bikeMarker);
        
      }
      console.log(bikeMarkers)
      // Create a layer group made from the bike markers array, pass it into the createMap function
      createMap(L.layerGroup(bikeMarkers));
    }
    
    function createMap(bikeStations) {
      const API_KEY = "sk.eyJ1IjoicHJvZmVzc29yZGFydCIsImEiOiJjanU1eWp6cGswZ3ViNGRsbXFiem0wb2plIn0.EQfkhoPxPipXPYmCAO77vQ";
      //console.log(bikeStations);
      // Create the tile layer that will be the background of our map
      var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
      });
    
      // Create a baseMaps object to hold the lightmap layer
      var baseMaps = {
        "Light Map": lightmap
      };
    
      // Create an overlayMaps object to hold the bikeStations layer
      var overlayMaps = {
        "Bike Stations": bikeStations
      };
    
      // Create the map object with options
      var map = L.map("map", {
        center: [38.9072, -77.0369],
        zoom: 12,
        layers: [lightmap, bikeStations]
      });
    
      // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
      L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
      }).addTo(map);

      console.log(map);
    }
})
}

buildPlot();

