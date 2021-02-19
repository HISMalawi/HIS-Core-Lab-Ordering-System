"use strict";

const Utils = (function () {
  /**
   * Returns an object containing all query parameters (ie the key=value pairs in the url after ?).
   * 
   * @returns {Object} parameter => value mappings for ecerything the url.
   */
  function queryParams() {
    const queries = window.location.search.replace(/^\?/, '').split('&');

    return queries.map(query => query.split('='))
                  .reduce((object, [key, value]) => ({ ...object, [key]: value }), {});
  }

  function zipArrays(...arrays) {
    const [head, ...tail] = arrays;

    return head.map((item, index) => [item, ...(tail.map(array => array[index]))]);
  }

  function arrayIntersection(comparator, ...arrays) {
    const [baseArray, ...rest] = arrays.sort(array => array.length);

    return baseArray.reduce((intersections, value) => {
      const totalMatches = rest.filter(array => array.find(cmpValue => comparator(value, cmpValue))).length;
      if (totalMatches < rest.length) return intersections;

      return [value, ...intersections];
    }, []);
  }

  function arrayDifference(comparator, left, right) {
    return left.map(lvalue => right.find(rvalue => comparator(lvalue, rvalue)) ? null : lvalue)
               .filter(value => value !== null);
  }

  function arrayCompact(indexer, array) {
    const indexTable = {};

    array.forEach(item => {
      const index = indexer(item);

      if (indexTable[index]) return;

      indexTable[index] = item;
    });

    return Object.values(indexTable);
  }

  function apiConfig() {
    return {
      protocol: sessionStorage.apiProtocol,
      host: sessionStorage.apiURL,
      port: sessionStorage.apiPort
    };
  }

  async function apiGet(path) {
    return fetch(expandApiPath(path), {
      method: 'GET',
      headers: apiRequestHeaders()
    });
  }

  async function apiPut(path, json) {
    return fetch(expandApiPath(path), {
      method: 'PUT',
      headers: apiRequestHeaders(),
      body: JSON.stringify(json)
    });
  }
  
  function formatApiError(responseBody) {
    let message;

    if (responseBody['errors']) {
      message = responseBody['errors'].join('; ');
    } else if (responseBody['exception']) {
      message = `${responseBody['error']} - ${responseBody['exception'].slice(0, 80)}...`
    } else if (responseBody['error']) {
      message = responseBody['error'];
    } else {
      message = `Unknown error type: ${JSON.stringify(responseBody)}`
    }
    
    message = message.replace('<', '&lt;');
    message = message.replace('>', '&gt;');
    
    return `API Error - ${message}`;
  }
  
  function flashErrorAndRedirectToHome(message) {
    // TODO: Replace the console.error below with some kind of notification
    // and redirect to home.
    console.error(message);
    if (sessionStorage.patientID) {
      window.location.href = `/views/patient_dashboard.html?patient_id=${sessionStorage.patientID}`;
    } else {
      window.location.href = `/index.html`;
    }
  }

  function expandApiPath(path) {
    const { protocol, host, port } = apiConfig();
    path = path.replace(/^\//, '');

    return `${protocol}://${host}:${port}/api/v1/${path}`
  }

  function apiRequestHeaders(extraHeaders = {}) {
    const headers = new Headers();

    headers.append('Authorization', sessionStorage.getItem('authorization'));
    headers.append('Content-Type', 'application/json');

    Object.keys(extraHeaders).forEach(key => headers.append(key, extraHeaders[key]));

    return headers;
  }

  return {
    apiGet,
    apiPut,
    arrayCompact,
    arrayDifference,
    arrayIntersection,
    flashErrorAndRedirectToHome,
    formatApiError,
    queryParams,
    zipArrays
  };
})();

