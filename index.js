import Leaflet from "leaflet";
import "./node_modules/leaflet/dist/leaflet.css";
import { kml as parseKml } from 'togeojson';
import CartoColor from 'cartocolor';

const paveMid = "1XPZjR9bKFqduKwRkjHUECEhmcwhO53dW";
const isoRatasMid = "1ZrmW-kxq4VK-ND9Hj6kWlcuD3-z18mBB";

const map = addMap(document.body);
addRasterTiles(map);

withGoogleMapsKmlDocument(isoRatasMid, function(err, xml) {
  if (!xml) {
    if (err)
      console.error(err);
    throw new Error("Failed to load map document");
  }
  const kml = parseKml(xml);
  const delivery = deliveryZonesLayer(kml);
  delivery.addTo(map);
  const outside = outsideLayer(delivery);
  outside.addTo(map);
  map.setMaxBounds(delivery.getBounds().pad(0.05));
  map.setMinZoom(map.getBoundsZoom(delivery.getBounds()));
  map.setZoom(map.getMinZoom());
  map.panInsideBounds(delivery.getBounds());
});

function deliveryZonesLayer(deliveryZones) {
  const zonesLayer = Leaflet.geoJSON(deliveryZones)
  const zoneLayers = zonesLayer.getLayers();
  const colors = CartoColor.Sunset[zoneLayers.length];
  zoneLayers.forEach(function(zoneLayer, index) {
    const style = {
      weight: 3,
      color: colors[index],
      fillOpacity: 0.5
    }
    zoneLayer.on({
      mouseover: function(event) {
        zoneLayer.setStyle({
          weight: 6,
          fillOpacity: 0.3,
        });
        zoneLayer.bringToFront();
      },
      mouseout: function(event) {
        zoneLayer.setStyle(style);
      },
      click: function(event) {
        if (zoneLayer._map)
          zoneLayer._map.fitBounds(zoneLayer.getBounds());
      }
    })
    zoneLayer.setStyle(style);
  })
  return zonesLayer;
}

function outsideLayer(insideLayer) {
  console.log(insideLayer);
  var world =
    [ insideLayer.getBounds().pad(1).getSouthWest(),
      insideLayer.getBounds().pad(1).getNorthWest(),
      insideLayer.getBounds().pad(1).getNorthEast(),
      insideLayer.getBounds().pad(1).getSouthEast()
    ];
  const holes = insideLayer.getLayers().map(layer => layer.getLatLngs()).flat();
  const nonDeliveryPolygon = Leaflet.polygon(
    [world, ...holes],
    { stroke: false,
      fillColor: "grey",
      fillOpacity: 0.8,
    }
  );
  return nonDeliveryPolygon;
}

function addMap(element) {
  if (!element) { element = document.body };
  const div = document.createElement("div");
  div.setAttribute("class", "map");
  element.appendChild(div);

  const helsinkiCoordinates = [60.192059, 24.945831];

  const map = Leaflet.map(div, {
    center: helsinkiCoordinates,
    zoom: 12,
    zoomSnap: 0.5,
    maxBoundsViscosity: 0.75,
    renderer: Leaflet.svg({ padding: 1 })
  });
  return map;
}

function addRasterTiles(map) {
  var style = "high-contrast";
  const tileUrl = `https://tiles.hel.ninja/styles/hel-osm-${style}/{z}/{x}/{y}@2x@fi.png`;
  const tileLayer = Leaflet.tileLayer(tileUrl, {});
  tileLayer.addTo(map);
}

function googleMapsKmlUrl(mid) {
  return `https://www.google.com/maps/d/kml?forcekml=1&mid=${mid}`
}

function withGoogleMapsKmlDocument(mid, callback) {
  const url = googleMapsKmlUrl(mid);
  const request = new XMLHttpRequest;
  request.open('GET', url);
  request.send();
  withXhrXmlResponse(request, callback);
  return request;
}

function withXhrXmlResponse(request, callback) {
  if (request.status === 200 && request.responseXML)
    callback(null, request.responseXML);
  // TODO: try parsing `request.responseText`
  else if (request.readyState !== (request.readyState.DONE || 4))
    request.addEventListener("loadend", () => withXhrXmlResponse(request, callback));
  else
    callback(request, null);
  return request;
}
