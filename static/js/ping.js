

//const API_KEY = "sk.eyJ1IjoicHJvZmVzc29yZGFydCIsImEiOiJjanU1eWp6cGswZ3ViNGRsbXFiem0wb2plIn0.EQfkhoPxPipXPYmCAO77vQ";
// Create the tile layer that will be the background of our map
// var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
//     attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
//     maxZoom: 18,
//     id: "mapbox.light",
//     accessToken: API_KEY
// });

// // Create a baseMaps object to hold the lightmap layer
// var baseMaps = {
//     "Light Map": lightmap
// };


// Create the map object with options
// var map = L.map("map", {
//     center: [38.9072, -77.0369],
//     zoom: 12,
//     //layers: [lightmap]
// });




var center = [38.907192, -77.036873];

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});

map = new L.Map('map', {layers: [osm], center: new L.LatLng(center[0], center[1]), zoom: 10});

var options = {
	duration: 1500, //Default: 800 - Sets the transition duration for the ping layer
	fps : 32, //Default: 32 - Sets the target framerate for the ping animation
	opacityRange: [ 1, 0 ],  //Default: [ 1, 0 ] - Sets the range of the opacity scale used to fade out the pings as they age
	//radiusRange: [ 2, 6 ] //Default: [ 3, 15 ] - Sets the range of the radius scale used to size the pings as they age
};

var pingLayer = L.pingLayer(options).addTo(map);  //adds pingLayer to map w/ options created above

pingLayer
	.lng(function(d) { return d[0]; })          
    .lat(function(d) { return d[1]; });         


url = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/5/query?where=1%3D1&outFields=*&outSR=4326&f=json";

var obj;
var count = 0;
var biketotals = 0;
var newDict = [];
var currentDict = [];



fetch(url)
    .then(res => res.json())
    .then(data => obj = data)
    .then(obj => sessionStorage.setItem('startDict', JSON.stringify(obj)));

var currentDict = JSON.parse(sessionStorage.getItem('startDict'));

fetch(url)
    .then(res => res.json())
    .then(data => obj = data)
    .then(obj => createPings(obj));



setInterval(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => obj = data)
      .then(obj => createPings(obj))
    }, 90000);
    

function createPings(newDict){

    var bikePings_added = [];
    var bikePings_removed = [];
    var bikesadded = 0;
    var bikesremoved = 0;
    var bikePing_add = [];
    var bikePing_remove = [];
    var bikeDifference = 0;  
    var currentDict = JSON.parse(sessionStorage.getItem('startDict'));


    for (var i = 0; i < 533; i++) {
        for (var j = 0; j < 533; j++){

        if(newDict.features[i].attributes.ID == currentDict.features[j].attributes.ID){

            bikeDifference = newDict.features[i].attributes.NUMBER_OF_BIKES - currentDict.features[i].attributes.NUMBER_OF_BIKES;

            if (bikeDifference > 0){
                bikePing_add.push(newDict.features[i].attributes.LONGITUDE, newDict.features[i].attributes.LATITUDE);
                bikePings_added.push(bikePing_add);
                bikePing_add = [];
                bikesadded = bikeDifference + bikesadded;
            }
            
            if (bikeDifference < 0){
                bikePing_remove.push(newDict.features[i].attributes.LONGITUDE, newDict.features[i].attributes.LATITUDE);
                bikePings_removed.push(bikePing_remove);
                bikePing_remove = [];
                bikesremoved = bikeDifference - bikesremoved;
            }
        }
    }
};
    
    console.log("bikes added: " + bikesadded);
    console.log("bike added object: ");
    console.log(bikePings_added);
    console.log(bikePings_added[0]);

    console.log("bikes removed: " + bikesremoved);
    console.log("bike removed object: ");
    console.log(bikePings_removed);
    console.log(bikePings_removed[0]);


    var paused = false;
    
        if(!paused) {

            var addedlength = Object.keys(bikePings_added).length;
            var removedlength = Object.keys(bikePings_removed).length;

            var addedtime = Math.round(90000/addedlength);
            var removedtime = Math.round(90000/removedlength);

            console.log("added time: " + addedtime);
            console.log("added time: " + removedtime);

            function loopThroughReturnArray(bikePings) {
                for (var i = 0; i < bikePings.length; i++) {
                    (function (i) {
                        setTimeout(function () {
                            pingLayer.ping(bikePings[i], "red" );
                            console.log(bikePings[i]);
                        }, addedtime * i);
                    })(i);
                };
            }
            

            function loopThroughRemoveArray(bikePings) {
                for (var i = 0; i < bikePings.length; i++) {
                    (function (i) {
                        setTimeout(function () {
                            pingLayer.ping(bikePings[i], "green" );
                            console.log(bikePings[i]);
                        }, removedtime * i);
                    })(i);
                };
            }
            
            loopThroughReturnArray(bikePings_added);
            loopThroughRemoveArray(bikePings_removed);
        }

    function togglePlay() {
        paused = !paused;
        d3.select('button').text((paused)? 'Play' : 'Pause');

        if(!paused) {
            window.setTimeout();

        }
    }
    
    bikePings_removed = []; 
    bikePings_added = []; 
    localStorage.setItem('storeDict', JSON.stringify(newDict));
    var currentDict = JSON.parse(localStorage.getItem('storeDict'));
    var newDict = [];

};



