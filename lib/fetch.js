'use strict';

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var appendCredentialsHeaders = function appendCredentialsHeaders() {
  for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
    options[_key] = arguments[_key];
  }

  return _utils.merge.apply(undefined, [{
    credentials: 'same-origin'
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

var getFetch = function getFetch(url, options) {
  var withCreds = appendCredentialsHeaders(options);
  var fetchOptions = makeFetchOptions(withCreds);
  return (0, _isomorphicFetch2.default)(url, fetchOptions);
};

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