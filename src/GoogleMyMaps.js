import { kml as kmlToGeoJson } from '@tmcw/togeojson';
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
  return (
    'https://www.google.com/maps/d/kml' +
      '?' + 'forcekml=1' +
      '&' + 'mid=' + mid +
      (!lid ? '' : ('&' + 'lid=' + lid))
  )
}
