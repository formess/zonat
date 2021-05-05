import xhr from '@mapbox/corslite';

import { Zoom } from 'leaflet/src/control/Control.Zoom';

import {
  DeliveryAreaMap,
  DeliveryAreaData,
  DigiTransitSearch,
  withMapData as withMyMapsData,
  HelNinjaTileLayer,
} from 'zonat'

window.addEventListener('DOMContentLoaded', function() {
  main(document.body);
});

function main(rootElement) {
  const config = new Config;

  const tiles = new HelNinjaTileLayer({
    style: 'hel-osm-high-contrast',
    language: 'fi'
  });
  const search = new DigiTransitSearch;
  const map = new DeliveryAreaMap(rootElement)
    .addLayer(tiles)
    .addControl(search)
    .addControl(new Zoom);

  withMyMapsData(config.mid, config.lid)((mapData) => {
    if (config.colors)
      setZoneColors(config.colors, mapData);
    if (mapData.name)
      document.title = mapData.name;
    const deliveryArea = new DeliveryAreaData(mapData).addTo(map);
    search.options.bounds = deliveryArea.getBounds().pad(1);
  });

  function setZoneColors(colors, mapData) {
    mapData.features = mapData.features.map((feature, index) => {
      if (colors[index])
        feature.properties.color = config.colors[index];
      return feature
    })
  }
}

function Config() {
  this.queryString = new URL(document.location).searchParams;
  this.mid = this.queryString.get('mid');
  this.lid = this.queryString.get('lid');
  this.colors = parseColors(this.queryString.get('colors'));

  function parseColors(str) {
    return typeof str === 'string' && str.split('-').map(parseColor)

    function parseColor(str) {
      return isHexTriplet(str) ? '#' + str : str
    }

    function isHexTriplet(str) {
      return /[[a-f0-9]{3,6}/i.test(str)
    }
  }
}
