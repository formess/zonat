import { Tooltip } from 'leaflet/src/layer/Tooltip';
import { CircleMarker } from 'leaflet/src/layer/vector/CircleMarker';

import Pelias from 'pelias-leaflet-plugin/src/core';

export var Search = Pelias.extend({
  options: {
    layers: [
      'address',
      'street',
      'neighbourhood',
      'localadmin',
      'locality',
      'postalcode'
    ]
  },
  showMarker(text, latlng) {
    this._map.setView(latlng, this._map.getZoom() || 8);
    const marker = new CircleMarker(latlng, {
      color: 'red',
      pane: 'markerPane',
    });
    this.markers.push(marker);
    marker.bindTooltip(text);
    marker.addTo(this._map);
    marker.openTooltip();
  },
  removeMarkers() {
    this.markers.forEach(marker => this._map.removeLayer(marker))
    this.markers = [];
  },
});

export var DigiTransitSearch = Search.extend({
  options: {
    url: 'https://api.digitransit.fi/geocoding/v1/',
    attribution: '<a href="https://digitransit.fi/">HSL</a>',
  },
  initialize(options) {
    const apiKey = undefined;
    Pelias.prototype.initialize.call(this, apiKey, options);
  },
});
