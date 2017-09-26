'use strict';

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var AWS4 = require('aws4');

/**
 * Callback for fetch wrappers
 * @callback fetchCallback
 * @param {object} error - Error if any
 * @param {object} result - String or JSON Object returned from the operation
 */

/**
 * @class fetchAuth
 * @param {string} username - Username to use for authentication
 * @param {string} password - Password to use for authentication
 * @param {string} bearer - Bearer Token to use for authentication
 * @param {string} raw - Whatever you want passed in the authentication header
 * @param {AWS4Auth} aws4 - Passed almost directly into AWS4.sign() See https://github.com/mhart/aws4 for more info
 */

var authToHeaders = function authToHeaders(options) {
  if (options.auth) {
    var _options$auth = options.auth,
        username = _options$auth.username,
        password = _options$auth.password,
        bearer = _options$auth.bearer,
        raw = _options$auth.raw,
        aws4 = _options$auth.aws4;

    options.headers = options.headers || {};
    if (username && password) {
      var unp = new Buffer(username + ':' + password).toString('base64');
      options.headers = Object.assign(options.headers, { Authorization: 'Basic ' + unp });
      return options;
    }
    if (bearer) {
      options.headers = Object.assign(options.headers, { Authorization: 'Bearer ' + bearer });
      return options;
    }
    if (raw) {
      options.headers = Object.assign(options.headers, { Authorization: raw });
      return options;
    }
    if (aws4) {
      var uri = options.url || options.uri;
      var uriConfig = !uri ? options : URL.parse(uri);
      var hostParts = uriConfig.host.split('.');
      uriConfig.service = uriConfig.service || hostParts[0];
      uriConfig.headers = uriConfig.headers || {};
      uriConfig.headers['content-type'] = 'application/json';
      if (hostParts[1] !== 'amazonaws') {
        uriConfig.region = hostParts[1];
      }
      return AWS4.sign(uriConfig, aws4);
    }
  }
  return options;
};

var appendCredentialsHeaders = function appendCredentialsHeaders() {
  for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
    options[_key] = arguments[_key];
  }

  return _utils.merge.apply(undefined, [{
    credentials: 'same-origin'
    //credentials: 'include',
    //'no-cors': true,
    //mode: 'no-cors'
  }].concat(options));
};

var makeFetchOptions = function makeFetchOptions() {
  for (var _len2 = arguments.length, options = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    options[_key2] = arguments[_key2];
  }

  var optionWithPayload = options.find(function (opt) {
    return typeof opt.payload !== 'undefined';
  });
  if (optionWithPayload) {
    return _utils.merge.apply(undefined, [{
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(optionWithPayload.payload)
    }].concat(options, [{
      method: (optionWithPayload.method || 'POST').toUpperCase()
    }]));
  }
  return _utils.merge.apply(undefined, options);
};

var getFetchArgs = function getFetchArgs() {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  if (typeof args[0] === 'string') {
    var _url = args[0],
        _args$ = args[1],
        _options = _args$ === undefined ? {} : _args$;

    return {
      url: _url,
      options: _options
    };
  }

  var _args$2 = args[0],
      url = _args$2.url,
      _objectWithoutPropert = _objectWithoutProperties(_args$2, ['url']),
      _objectWithoutPropert2 = _objectWithoutPropert,
      options = _objectWithoutPropert2 === undefined ? {} : _objectWithoutPropert2;

  return {
    url: url,
    options: options
  };
};

var getFetch = function getFetch(url) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var withCreds = options.auth ? authToHeaders(options) : appendCredentialsHeaders(options);
  var fetchOptions = makeFetchOptions(withCreds);
  console.debug('Fetching: ', url, fetchOptions);
  return (0, _isomorphicFetch2.default)(url, fetchOptions);
};

/**
 * Wrapper around isomorphic-fetch library to provide common functionality such as callback usage and auto parsing of returned values into JSON objects
 * @param {object} options
 * @param {string} options.url - URL to fetch from
 * @param {string} options.method - HTTP method to fetch with, defaults to GET
 * @param {object} options.headers - Headers to pass along to the fetch object
 * @param {fetchAuth} options.auth - Authorization Object
 * @param {...object} options.rest - Everything else is passed directly through to isomorphic-fetch
 * @param {fetchCallback} options.callback - Callback to be run when fetch operation completes
 */
var fetch = function fetch() {
  var _getFetchArgs = getFetchArgs.apply(undefined, arguments),
      url = _getFetchArgs.url,
      fOptions = _getFetchArgs.options;

  var options = Array.isArray(fOptions) ? _utils.merge.apply(undefined, _toConsumableArray(fOptions)) : fOptions;
  var fetch = getFetch(url, options);
  if (typeof options.callback !== 'function') {
    return fetch;
  }
  var callback = options.callback;

  return fetch.then(function (response) {
    var headers = response.headers;

    var contentType = headers.get('Content-Type');
    var r = response.clone().json().catch(function (e) {
      return response.text();
    });
    return r.then(function (json) {
      return callback(null, json, response, contentType);
    }).catch(function (e) {
      console.error(url, e);
      return callback(e);
    });
  }).catch(function (err) {
    return callback(err);
  });
};

var encodePayload = function encodePayload(payload) {
  if (typeof payload === 'string') {
    try {
      var json = JSON.parse(payload);
      return payload;
    } catch (e) {
      return JSON.stringify(payload);
    }
  }
  return JSON.stringify(payload);
};

var fetchJson = fetch;

var postJson = function postJson(options) {
  //}{method="post", body, payload, ...options})=>{
  console.log('postJson', options);
  return fetchJson(Object.assign({ method: 'post' }, options));
};

module.exports = {
  fetch: fetch,
  fetchJson: fetchJson,
  postJson: postJson
};