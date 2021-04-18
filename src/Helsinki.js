import { TileLayer } from 'leaflet/src/layer/tile/TileLayer';
import { LatLng } from 'leaflet/src/geo/LatLng';

// Leaflet TileLayer with raster tiles from tiles.hel.ninja
// See https://dev.hel.fi/maps and http://tiles.hel.ninja/ for details
export var HelNinjaTileLayer = TileLayer.extend({
  options: {
    maxZoom: 21,
    tileSize: 512,
    zoomOffset: -1,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  initialize(options = {}) {
    const tileUrl = helNinjaTileUrl(options);
    TileLayer.prototype.initialize.call(this, tileUrl, options);
  },
  beforeAdd: function(map) {
    setMapCenter(map, centerLatLng);
    return TileLayer.prototype.beforeAdd.call(this, map);
  }
});

export function helNinjaTileUrl(options = {}) {
  const style = options.style || "hel-osm-bright"
  const lang = options.language || options.lang || "fi";
  return `https://tiles.hel.ninja/styles/${style}/{z}/{x}/{y}{r}@${lang}.png`;
}

export var centerLatLng = new LatLng(60.192059, 24.945831);

function setMapCenter(map, center) {
  if (!map.options.center || !map._loaded) {
    map.options.center = center;
    map.setView(center, map.options.zoom || 11, { reset: true })
  }
}
