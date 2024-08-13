const apiKey = "2f838ba31533455e980dccc5b9c6fc86";
const baseUrl = "https://api.geoapify.com/v2/places";

let dataDivArray = [];
let markersArray = [];
let polyline = null;
let myMap; // Declare myMap in the global scope

function successCallback(position) {
  let lat = position.coords.latitude;
  let lon = position.coords.longitude;
  console.log(lat, lon);

  // Creating the map object
  myMap = L.map("map", {
    center: [lat, lon],
    zoom: 15 // Adjusted zoom level to a more reasonable value
  });

  // Adding the tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(myMap);

  const radius = 500000;
  const limit = 20;
  const categories = [
    { category: 'catering.restaurant', icon: 'brunch_dining' },
    { category: 'catering.cafe', icon: 'local_cafe' },
    { category: 'rental.bicycle', icon: 'directions_bike' },
    { category: 'tourism.attraction', icon: 'attractions' },
    { category: 'tourism.sights', icon: 'flag' },
    { category: 'amenity.toilet', icon: 'bathroom' },
    { category: 'commercial.shopping_mall', icon: 'local_mall' },
    { category: 'commercial.marketplace', icon: 'stadium' },
    { category: 'service.beauty.spa', icon: 'spa' },
    { category: 'leisure.spa', icon: 'spa' },
    { category: 'entertainment.museum', icon: 'museum' },
    { category: 'entertainment.zoo', icon: 'park' },
    { category: 'healthcare.hospital', icon: 'local_hospital' },
    { category: 'service.travel_agency', icon: 'travel' },
    { category: 'public_transport', icon: 'directions_bus' },
    { category: 'office.travel_agent', icon: 'travel' },
    { category: 'populated_place.district', icon: 'flag' },
    { category: 'airport', icon: 'connecting_airports' }

    // Add more categories and colors as needed
  ];

  categories.forEach(({ category, icon }) => { // Updated to correctly destructure `icon`
    const filter = `circle:${lon},${lat},${radius}`;
    const bias = `proximity:${lon},${lat}`;

    // Construct the URL parameters
    const params = new URLSearchParams({
      categories: category,
      limit: limit,
      filter: filter,
      bias: bias,
      apiKey: apiKey
    });

    fetch(`${baseUrl}?${params.toString()}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log(`Places result for ${category}:`, data);

        // Create a new marker cluster group.
        var markers = L.markerClusterGroup();

        // Loop through the data.
        data.features.forEach(feature => {
          var location = feature.geometry;
          if (location) {
            // Define the icon you want to use from Google Material Icons
            var iconHtml = `<span class="material-icons" style="font-size:24px;">${icon}</span>`;
            
            var marker = L.marker([location.coordinates[1], location.coordinates[0]], {
              icon: L.divIcon({
                html: iconHtml, 
                className: 'custom-marker', // Custom class for additional styling
                iconSize: [24, 24], // Size of the icon container
                iconAnchor: [12, 24], // Anchor the icon to the marker's location
              })
            })
            .bindPopup(feature.properties.name)
            .on('click', function() {
              displayData(feature.properties, [location.coordinates[1], location.coordinates[0]]);
            });
            markers.addLayer(marker);
          }
        });

        // Add our marker cluster layer to the map.
        myMap.addLayer(markers);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  });
};

const errorCallback = (error) => {
  console.log(error);
};

navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

function displayData(properties, coordinates) {
  console.log('Marker clicked:', properties);

  // Store the properties object and coordinates in the array
  dataDivArray.push(properties);
  markersArray.push(coordinates);
  console.log('Current dataDivArray:', dataDivArray);
  console.log('Current markersArray:', markersArray);

  // Update draggable p tags and draw the line
  updateDraggableTags();
  drawPolyline();
}

function updateDraggableTags() {
  const draggableElements = document.querySelectorAll('.draggable');
  draggableElements.forEach((element, index) => {
    if (index < dataDivArray.length) {
      element.textContent = `${index + 1}. ${dataDivArray[index].name} : ${dataDivArray[index].address_line2 || 'N/A'}, ${dataDivArray[index].opening_hours || 'N/A'}`;
    }
  });
}

function drawPolyline() {
  if (polyline) {
    polyline.remove();
  }

  polyline = L.polyline(markersArray, { color: 'blue' }).addTo(myMap);
}

// Initialize SortableJS for each container
document.querySelectorAll('.dragndropContainer').forEach((container, idx) => {
  console.log(`Initializing Sortable for container ${idx + 1}`);
  Sortable.create(container, {
    onEnd: function (evt) {
      console.log(`Sortable onEnd triggered for container ${idx + 1}`);
      updateMarkersArray();
      drawPolyline();
    }
  });
});

function updateMarkersArray() {
  let newMarkersArray = [];
  const draggableElements = document.querySelectorAll('.draggable');
  console.log('Draggable elements:', draggableElements);

  draggableElements.forEach((el, index) => {
    const elementText = el.textContent.split('. ')[0]; // Extract the original index from text
    const originalIndex = parseInt(elementText, 10) - 1;
    console.log(`Element ${index + 1} was originally at index ${originalIndex}`);
    
    if (!isNaN(originalIndex) && originalIndex < markersArray.length) {
      newMarkersArray.push(markersArray[originalIndex]);
    }
  });

  markersArray = newMarkersArray;
  console.log('Updated markersArray:', markersArray);
}
