import Leaflet from "leaflet";
import "./node_modules/leaflet/dist/leaflet.css";
import LeafletOmnivore from "leaflet-omnivore";

const map = addMap(document.body);
addRasterTiles(map);
addIsoRatasLayer(map);

function addMap(element) {
  if (!element) { element = document.body };
  const div = document.createElement("div");
  div.setAttribute("class", "map");
  element.appendChild(div);

  const helsinkiCoordinates = [60.192059, 24.945831];

  const map = Leaflet.map(div, {
    center: helsinkiCoordinates,
    zoom: 13
  });
  return map;
}

function addRasterTiles(map) {
  var style = "high-contrast";
  const tileUrl = `https://tiles.hel.ninja/styles/hel-osm-${style}/{z}/{x}/{y}@2x@fi.png`;
  const tileLayer = Leaflet.tileLayer(tileUrl, {});
  tileLayer.addTo(map);
}

function addPaveLayer(map) {
  addGoogleMapsKmlLayer(map, '1XPZjR9bKFqduKwRkjHUECEhmcwhO53dW');
}

function addIsoRatasLayer(map) {
  addGoogleMapsKmlLayer(map, '1ZrmW-kxq4VK-ND9Hj6kWlcuD3-z18mBB');
}

function addGoogleMapsKmlLayer(map, mid) {
  LeafletOmnivore.kml(googleMapsKmlUrl(mid)).addTo(map);
}

function googleMapsKmlUrl(mid) {
  return `https://www.google.com/maps/d/kml?forcekml=1&mid=${mid}`
}
