import Leaflet from "leaflet";
import "./node_modules/leaflet/dist/leaflet.css";
import { kml as kmlToGeoJson } from 'togeojson';
import CartoColor from 'cartocolor';

const paveMid = "1XPZjR9bKFqduKwRkjHUECEhmcwhO53dW";
const isoRatasMid = "1ZrmW-kxq4VK-ND9Hj6kWlcuD3-z18mBB";

const map = addMap(document.body);
addRasterTiles(map);

const fetchDeliveryArea =
  fetchKmlDocument(googleMapsKmlUrl(isoRatasMid))
    .then(parseKmlDocument);

fetchDeliveryArea.then(function(deliveryArea) {
  console.log("Fetched delivery area", deliveryArea);
  const delivery = deliveryZonesLayer(deliveryArea);
  delivery.addTo(map);
  const outside = outsideLayer(delivery);
  outside.addTo(map);
  const legend = deliveryZonesLegendControl(delivery, { title: deliveryArea.name } );
  legend.addTo(map);
  map.setMaxBounds(delivery.getBounds().pad(0.05));
  map.setMinZoom(map.getBoundsZoom(delivery.getBounds()));
  map.setZoom(map.getMinZoom());
  map.panInsideBounds(delivery.getBounds());
});

function deliveryZonesLayer(deliveryZones) {
  const zonesLayer = new Leaflet.GeoJSON(deliveryZones)
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
          fillOpacity: 0.2,
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

function deliveryZonesLegendControl(zonesLayer, options) {
  const legend = new Leaflet.Control({ position: 'topright' });
  legend.onAdd = function() {
    const legendDiv = DomUtil.create('div', 'legend');
    if (options.title) {
      const legendTitle = DomUtil.create('h4', 'legend__title', legendDiv);
      legendTitle.textContent = options.title;
    }
    zonesLayer.getLayers().forEach(function(zoneLayer, index) {
      const name = zoneLayer.feature.properties.name;
      const color = !zoneLayer.getLayers
            ? zoneLayer.options.color
            : zoneLayer.getLayers()[0].options.color;
      const zoneDiv = DomUtil.create('div', 'legend__zone', legendDiv);
      const colorSpan = DomUtil.create('span', 'legend__zone-color', zoneDiv);
      colorSpan.style.background = color;
      const nameSpan = DomUtil.create('span', 'legend__zone-name', zoneDiv);
      nameSpan.textContent = name;
      zoneDiv.addEventListener('click', function(event) {
        zoneLayer._map.fitBounds(zoneLayer.getBounds());
      });
      zoneDiv.addEventListener('mouseover', function(event) {
        zoneLayer.fireEvent('mouseover')
      });
      zoneDiv.addEventListener('focus', function(event) {
        zoneLayer.fireEvent('mouseover')
      });
      zoneDiv.addEventListener('mouseout', function(event) {
        zoneLayer.fireEvent('mouseout')
      });
      zoneDiv.addEventListener('blur', function(event) {
        zoneLayer.fireEvent('mouseout')
      });
      zoneLayer.on('mouseover', function(event) {
        DomUtil.addClass(zoneDiv, "legend__zone--focused")
      });
      zoneLayer.on('mouseout', function(event) {
        DomUtil.removeClass(zoneDiv, "legend__zone--focused")
      });
    });
    return legendDiv;
  }
  return legend;
}

function outsideLayer(insideLayer) {
  const bounds = insideLayer.getBounds().pad(1);
  var world = [ bounds.getSouthWest(), bounds.getNorthWest(),
                bounds.getNorthEast(), bounds.getSouthEast() ];
  const holes = layerPolygons(insideLayer);
  return new Leaflet.Polygon(
    [world, ...holes],
    { stroke: false,
      fillColor: "grey",
      fillOpacity: 0.8,
    }
  );
  function layerPolygons(layer) {
    if (layer.getLayers)
      return [...layer.getLayers().map(layerPolygons)];
    else if (layer.getLatLngs)
      return [...layer.getLatLngs()]
    else {
      console.warn("layerPolygons: something went wrong", layer);
      return [];
    }
  }
}

function addMap(element) {
  if (!element) { element = document.body };
  const div = document.createElement("div");
  div.setAttribute("class", "map");
  element.appendChild(div);

  const helsinkiCoordinates = [60.192059, 24.945831];

  const map = new Leaflet.Map(div, {
    center: helsinkiCoordinates,
    zoom: 12,
    zoomSnap: 0.5,
    maxBoundsViscosity: 0.75,
    renderer: new Leaflet.SVG({ padding: 1 })
  });
  return map;
}

function addRasterTiles(map) {
  var style = "high-contrast";
  const tileUrl = `https://tiles.hel.ninja/styles/hel-osm-${style}/{z}/{x}/{y}@2x@fi.png`;
  const tileLayer = new Leaflet.TileLayer(tileUrl, {});
  tileLayer.addTo(map);
}

function googleMapsKmlUrl(mid) {
  return `https://www.google.com/maps/d/kml?forcekml=1&mid=${mid}`
}

function parseKmlDocument(xml) {
  console.info('parsing KML document', xml);
  return new Promise(function(resolve, reject) {
    const kml = kmlToGeoJson(xml);
    const name = xml.querySelector('Document > name');
    const description = xml.querySelector('Document > description');
    if (name && name.textContent)
      kml.name = name.textContent;
    if (description && description.textContent)
      kml.description = description.textContent;
    if (kml.type === "FeatureCollection" && kml.features && kml.features.length > 0)
      resolve(kml);
    else
      reject(kml);
  });
}

function fetchKmlDocument(url) {
  return new Promise(function(resolve, reject) {
    withKmlDocument(url, function(error, xml) {
      if (xml && !error)
        resolve(xml);
      else
        reject(error);
    })
  });
}

function withKmlDocument(url, callback) {
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
