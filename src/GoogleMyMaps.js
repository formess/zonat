import { kml as kmlToGeoJson } from 'togeojson';
import xhr from '@mapbox/corslite';

export function withMapData(mid, lid) {
  if (!mid) return function(resolve, reject) {
    console.warn("Google map id wasn't provided");
  };
  const url = kmlUrl(mid, lid);
  return function(resolve, reject) {
    return withKmlDocument(url)(
      (kmlDocument) => resolve(parseKmlDocument(kmlDocument)),
      reject || function(error) {
        console.error(
          'Failed to load data from Google MyMaps',
          { mid, url, error }
        );
      }
    )
  }
}

export function parseKmlDocument(xml) {
  console.info('Converting KML document from XML to GeoJSON', xml);
  const kml = kmlToGeoJson(xml);
  const name = xml.querySelector('Document > name');
  const description = xml.querySelector('Document > description');
  if (name && name.textContent)
    kml.name = name.textContent;
  if (description && description.textContent)
    kml.description = description.textContent;
  return kml;
}

export function withKmlDocument(url) {
  return function(resolve, reject) {
    xhr(url, function(error, response) {
      if (error)
        reject && reject(error);
      else if (response && response.responseXML)
        resolve && resolve(response.responseXML);
      else if (response) {
        console.error('No responseXML in XHR from ', url);
        reject && reject(response);
      }
    })
  }
}

export function kmlUrl(mid, lid) {
  const url = new URL('https://www.google.com/maps/d/kml');
  url.searchParams.set('forcekml', '1');
  url.searchParams.set('mid', mid);
  if (lid)
    url.searchParams.set('lid', lid);
  return url.toString();
}
