// Use this link to get the GeoJSON data.
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var boundariesUrl = "./static/data/PB2002_boundaries.json";
var orogeniesURL = "./static/data/PB2002_orogens.json"

// Create three layerGroups
var earthquake = L.layerGroup();
var plateBoundaries = new L.layerGroup();
var orogeniesBoundaries = L.layerGroup()

// Create the tile layers
// Define streetMap, topoMap, and oceanMap base layers
var world = Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16
});

var topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});

var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 13
});

// Create a baseMaps object.
var baseMaps = {
    "World Features": world,
    "Topographic Map": topo,
    "Satellite Map": satellite, 
    "Ocean Seabed Map": ocean
};

// create a default overlay to add to the base overlap on load
var overlayMaps = {
    "Earthquakes": earthquake,
    "Plate Boundaries": plateBoundaries,
    "Orogeny Zones": orogeniesBoundaries
};

// Create our map, giving it the streetmap and what will be the earthquake layer to display on load.    
var myMap = L.map("map", {
    center: [
        37.09, -95.71
    ],
    zoom: 2,
    layers: [world, earthquake]
});

// Incorporate default baseMaps and overlayMaps
L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(myMap);

// Getting our GeoJSON data
d3.json(queryUrl).then(function(earthquakeData) {
    // get markerSize by multiplying magnitude
    function scaledMarker(magnitude) {
        return magnitude * 4;
    };  
    // Tis function that will determine the color of a earthquake based on the depth category that it belongs to
    function chooseColor(depth) {
      switch(true) {
        case depth < 10: 
            return "#3366ff";
        case depth < 30: 
            return "#6666ff";
        case depth < 50: 
            return "#9966ff";
        case depth < 70: 
            return "#cc33ff";
        case depth < 90: 
            return "#ff00ff";
        default:
            return "#cc0099";
      }
    }    

        // Create a GeoJSON layer containing the features array on the earthquakeData object
        // Run function once for each needed statistic in the earthquake array
        // Use the point to layer function described in the leaflet documentation
    L.geoJSON(earthquakeData, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng,
            {
              radius: scaledMarker(feature.properties.mag),
              color: "#ffffff",
              fillColor: chooseColor(feature.geometry.coordinates[2]),
              fillOpacity: 1,
              stroke: true,
              weight: 0.75
            }
        ); 
    },
    onEachFeature: function(feature, layer) {
        layer.bindPopup(`<h3>Location: ${feature.properties.place} Magnitude: ${feature.properties.mag}</h3><hr><p>${new Date(feature.properties.time)}</p>`);
    }  
}).addTo(earthquake);    
// add earthquake layer to map
earthquake.addTo(myMap);      

// Filter the JSON data generously provided by Fraxen
d3.json(boundariesUrl).then(function(data) {
    console.log(data);
    // Adding our geoJSON data, along with style information, to the tectonic plates layer.
    L.geoJson(data, {
       color: "#ccff33",
       weight: 3
    }).addTo(plateBoundaries);
    // Then add the tectonicplates layer to the map.
    plateBoundaries.addTo(myMap);
});

    // Filter the JSON data generously provided by Fraxen
d3.json(orogeniesURL).then(function(data) {
    // Adding our geoJSON data, along with style information, to the tectonicplates layer.
    L.geoJson(data, {
        color: "#e64c4c",
        fillColor: "#cc0000",
        fillOpacity: 0.4
    }).addTo(orogeniesBoundaries);
    // Then add the tectonicplates layer to the map.
    orogeniesBoundaries.addTo(myMap);
});
        
    // Create Legend on the bottom right for earthquake depth
    var legend = L.control({position: "bottomright"});
    // Insert the legend Div class
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend"),
        depth = [-10, 10, 30, 50, 70, 90];
    
        div.innerHTML += "<h4>Epicenter Depth</h4>"
    
        // loop thru  the intervals to create a label with corresponding color
        for (var i = 0; i < depth.length; i++) {
            div.innerHTML +=
            '<i style="background:' + chooseColor(depth[i]) + '"></i> ' +
            depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
            }
        return div;
    };
    // Add the info legend to the map
    legend.addTo(myMap);        
}); 