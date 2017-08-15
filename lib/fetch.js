'use strict';

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  return (0, _utils.merge)(options);
};

var fetch = function fetch() {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  if (typeof args[0] === 'string') {
    var _url = args[0],
        _options = args[1];

    return (0, _isomorphicFetch2.default)(_url, makeFetchOptions(appendCredentialsHeaders(_options)));
  }

  var _args$ = args[0],
      url = _args$.url,
      options = _objectWithoutProperties(_args$, ['url']);

  return (0, _isomorphicFetch2.default)(url, makeFetchOptions(appendCredentialsHeaders(options)));
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

var fetchJson = function fetchJson(_ref) {
  var url = _ref.url,
      callback = _ref.callback,
      payload = _ref.payload,
      options = _objectWithoutProperties(_ref, ['url', 'callback', 'payload']);

  return fetch(url, makeFetchOptions(options, { payload: payload })).then(function (response) {
    var headers = response.headers;

    var contentType = headers.get('Content-Type');
    var r = response.clone().json().catch(function (e) {
      console.error('Not JSON', url, e);
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

var postJson = function postJson(_ref2) {
  var _ref2$method = _ref2.method,
      method = _ref2$method === undefined ? "post" : _ref2$method,
      body = _ref2.body,
      payload = _ref2.payload,
      options = _objectWithoutProperties(_ref2, ['method', 'body', 'payload']);

  fetchJson(makeFetchOptions(options, { method: method, payload: payload || body }));
};

module.exports = {
  fetch: fetch,
  fetchJson: fetchJson,
  postJson: postJson
};