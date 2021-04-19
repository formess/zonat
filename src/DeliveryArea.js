import { Map } from 'leaflet/src/map';
import { SVG, Polygon } from 'leaflet/src/layer/vector';
import { LayerGroup } from 'leaflet/src/layer/LayerGroup';
import { GeoJSON } from 'leaflet/src/layer/GeoJSON';
import { Control } from 'leaflet/src/control';
import { create as createElement, addClass, removeClass } from 'leaflet/src/dom/DomUtil';
import { on as onDomEvent } from 'leaflet/src/dom/DomEvent';

export var DeliveryAreaMap = Map.extend({
  options: {
    maxBoundsViscosity: 0.75,
    renderer: new SVG({ padding: 2 }),
    zoomSnap: 0.5,
    zoomDelta: 0.5
  }
});

export var DeliveryArea = GeoJSON.extend({
  initialize(deliveryZones, options) {
    GeoJSON.prototype.initialize.call(this, deliveryZones, options)
    this.getLayers().forEach((zoneLayer, index) => {
      zoneLayer.on(this.zoneEventHandlers(zoneLayer))
      zoneLayer.setStyle(this.zoneStyle(zoneLayer));
    });
  },
  onAdd(map) {
    LayerGroup.prototype.onAdd.call(this, map);
    map.setMaxBounds(this.getBounds().pad(0.25));
    map.setMinZoom(map.getBoundsZoom(this.getBounds()));
    map.setZoom(map.getMinZoom());
    map.panInsideBounds(this.getBounds());
  },
  zoneEventHandlers(zoneLayer) {
    const stateStyle = (state) => this.zoneStyle(zoneLayer, state)
    return {
      mouseover(event) {
        zoneLayer.setStyle(stateStyle('focused'));
        zoneLayer.bringToFront();
      },
      mouseout(event) {
        zoneLayer.setStyle(stateStyle('normal'));
      },
      click(event) {
        if (zoneLayer._map)
          zoneLayer._map.flyToBounds(zoneLayer.getBounds());
      }
    }
  },
  zoneStyle(zoneLayer, state) {
    return {
      weight: state === 'focused' ? 6 : 3,
      color: zoneLayer.feature.properties.fill,
      fillOpacity: state === 'focused' ? 0.2 : 0.5
    }
  }
});

export var DeliveryAreaLegend = Control.extend({
  options: { position: 'topright' },
  initialize(zonesLayer, options) {
    this.zonesLayer = zonesLayer;
    Control.prototype.initialize.call(this, options);
  },
  onAdd(map) {
    const legendDiv = createElement('div', 'legend');
    if (this.options.title) {
      const legendTitle = createElement('h4', 'legend__title', legendDiv);
      legendTitle.textContent = this.options.title;
    }
    this.zonesLayer.getLayers().forEach((zoneLayer, index) => {
      const name = zoneLayer.feature.properties.name;
      const color = !zoneLayer.getLayers
            ? zoneLayer.options.color
            : zoneLayer.getLayers()[0].options.color;
      const zoneDiv = createElement('div', 'legend__zone', legendDiv);
      const colorSpan = createElement('span', 'legend__zone-color', zoneDiv);
      colorSpan.style.background = color;
      const nameSpan = createElement('span', 'legend__zone-name', zoneDiv);
      nameSpan.textContent = name;
      onDomEvent(zoneDiv, {
        click() { map.flyToBounds(zoneLayer.getBounds()) },
        mouseover() { zoneLayer.fireEvent('mouseover') },
        mouseout() { zoneLayer.fireEvent('mouseout') },
        focus() { zoneLayer.fireEvent('mouseover') },
        blur() { zoneLayer.fireEvent('mouseout') },
      });
      zoneLayer.on({
        mouseover() { addClass(zoneDiv, "legend__zone--focused") },
        mouseout() { removeClass(zoneDiv, "legend__zone--focused") },
      });
    });
    return legendDiv;
  }
});

export var InvertedDeliveryArea = Polygon.extend({
  initialize(internal, options) {
    const bounds = internal.getBounds().pad(1);
    const world = [ bounds.getSouthWest(), bounds.getNorthWest(),
                    bounds.getNorthEast(), bounds.getSouthEast() ];
    const holes = layerPolygons(internal);
    Polygon.prototype.initialize.call(this, [world, ...holes], options);
  }
});

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