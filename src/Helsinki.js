import { TileLayer } from 'leaflet/src/layer/tile/TileLayer';

// Leaflet TileLayer with raster tiles from tiles.hel.ninja
// See https://dev.hel.fi/maps and http://tiles.hel.ninja/ for details
export var HelNinjaTileLayer = TileLayer.extend({
  options: {
    maxZoom: 21,
    maxNativeZoom: 21,
    tileSize: 512,
    zoomOffset: -1
  },
  initialize(options = {}) {
    const tileUrl = helNinjaTileUrl(options);
    TileLayer.prototype.initialize.call(this, tileUrl, options);
  }
});

export function helNinjaTileUrl(options = {}) {
  const style = options.style || "hel-osm-bright"
  const lang = options.language || options.lang || "fi";
  return `https://tiles.hel.ninja/styles/${style}/{z}/{x}/{y}{r}@${lang}.png`;
}
