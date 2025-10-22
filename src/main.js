import "./style.css";

const map = L.map("map").setView([0.06, 37.54], 4);

const OSM = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

var googleSat = L.tileLayer(
  "http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }
);

const googleHybrid = L.tileLayer(
  "http://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }
);

// const kenyaCounties = L.tileLayer.wms("/geoserver/wms?time=" + Date.now(), {
//   layers: "Site_Visit:kenya counties",
//   format: "image/png",
//   opacity: 0.5,
//   transparent: true,
// });

// const allParcels = L.tileLayer.wms(
//   "http://188.166.118.37:8080/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:all_parcels&outputFormat=application/json"
// );

//Control
const baseLayers = {
  "Open Street Map": OSM,
  "Google Satellite": googleSat,
  "Google Map Hybrid": googleHybrid,
};

//Marker
const yellowPin = L.icon({
  iconUrl: "./myIcon.png",
  iconSize: [60, 60],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

//PostGIS + Geoserver
let marker;
const parcelImage = document.getElementById("parcel_image");
const parceNum = document.getElementById("parcel_num");
const owner = document.getElementById("owner_name");
const surveyor = document.getElementById("Surveyor_name");
const date = document.getElementById("survey_date");
const northings = document.getElementById("northings");
const eastings = document.getElementById("eastings");
const height = document.getElementById("height");
const zone = document.getElementById("zone");
const location = document.getElementById("location");

fetch(
  "/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=topp:all_parcels&outputFormat=application/json"
)
  .then((r) => r.json())
  .then((data) => {
    const parcel = L.geoJSON(data, {
      style: { color: "blue", width: 1 },
      onEachFeature: (feature, layer) => {
        const centroid = layer.getBounds().getCenter();
        marker = L.marker(centroid, {
          icon: yellowPin,
        })
          .bindTooltip(`<b>${feature.properties.parcel_no}</b>`)
          .addTo(map);

        // display parcel details
        marker.on("click", (e) => {
          const sidebar = document.getElementById("sidebar");
          sidebar.style.display = "block";

          parcelImage.src = `${feature.properties.parcel_img}`;
          parceNum.innerHTML = `${feature.properties.parcel_no}`;
          owner.innerHTML = `${feature.properties.owner}`;
          surveyor.innerHTML = `${feature.properties.surveyor}`;
          northings.innerHTML = `${feature.properties.northing}`;
          eastings.innerHTML = `${feature.properties.eastings}`;
          height.innerHTML = `${feature.properties.height}`;
          zone.innerHTML = `${feature.properties.zone}`;
          location.innerHTML = `${feature.properties.location}`;
        });
      },
    }).addTo(map);

    map.fitBounds(parcel.getBounds());
  });

//close sidebar
document
  .getElementById("close-btn")
  .addEventListener("click", function closeSidebar() {
    sidebar.style.display = "none";
  });

// Getting by clicking on the map
// map.on("click", function (e) {
//   const lat = e.latlng.lat;
//   const lng = e.latlng.lng;

//   console.log(lat, lng);
// });

//search functionality
async function searchParcel(query) {
  try {
    // Safely encode the search term to prevent injection
    const encodedTerm = encodeURIComponent(query);

    // Construct the CQL_FILTER with ILIKE for parcel_no, owner, and location
    const cqlFilter = `parcel_no ILIKE '%${encodedTerm}%' 
    OR owner ILIKE '%${encodedTerm}%' 
    OR location ILIKE '%${encodedTerm}%'`;

    const url =
      `/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature` +
      `&typeName=topp:all_parcels` +
      `&outputFormat=application/json` +
      `&CQL_FILTER=parcel_no= '${encodedTerm}'`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch data from Geoserver!");
    }

    const geojson = await response.json();

    if (geojson) {
      if (window.searchLayer) map.removeLayer(window.searchLayer);

      window.searchLayer = L.geoJSON(geojson).addTo(map);

      const bounds = window.searchLayer.getBounds();
      if (bounds.isValid) {
        map.fitBounds(bounds);
      } else {
        alert(`No parcels found for ${query}`);
      }
      // map.fitBounds(searchLayer.getBounds());
    } else {
      alert("Parcel Not Found!");
    }
  } catch (error) {
    console.error("Search error:", error);
  }
  document.getElementById("searchBox").innerHTML = "";
}
//Handle input and search using Enter Key
document.getElementById("searchBox").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = e.target.value.trim();
    if (query) searchParcel(query);
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("searchBox").value = "";
});

// const overLay = {
//   "Kenya Counties": kenyaCounties,
//   // "All Parcels": allParcels,
//   // "land parcels": landParcels,
// };
L.control.layers(baseLayers).addTo(map);
