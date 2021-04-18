import { kml as kmlToGeoJson } from 'togeojson';

export function withMapData(mid) {
  const url = kmlUrl(mid);
  return function(resolve, reject) {
    return withKmlDocument(url)(
      (kmlDocument) => resolve(parseKmlDocument(kmlDocument)),
      reject
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
    const request = new XMLHttpRequest;
    request.open('GET', url);
    request.send();
    return withXhrXmlResponse(request)(resolve, reject);
  }
}

function withXhrXmlResponse(request) {
  return function(resolve, reject) {
    if (request.status === 200 && request.responseXML && resolve)
      resolve(request.responseXML);
    else if (request.readyState !== (request.readyState.DONE || 4))
      request.addEventListener("loadend", () => withXhrXmlResponse(request)(resolve, reject));
    else if (reject)
      reject(request);
    return request;
  }
}

export function kmlUrl(mid) {
  return `https://www.google.com/maps/d/kml?forcekml=1&mid=${mid}`
}
