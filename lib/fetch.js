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
    credentials: 'same-origin',
    'no-cors': true
  }].concat(options));
};

var makeFetchOptions = function makeFetchOptions() {
  for (var _len2 = arguments.length, options = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    options[_key2] = arguments[_key2];
  }

  return appendCredentialsHeaders.apply(undefined, [{
    headers: {
      'Content-Type': 'application/json'
    }
  }].concat(options));
};

var fetch = function fetch(url) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return (0, _isomorphicFetch2.default)(url, appendCredentialsHeaders(options));
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

  return fetch(url, makeFetchOptions(options, { body: encodePayload(payload) })).then(function (response) {
    var headers = response.headers;

    var contentType = headers.has('Content-Type') ? headers.get('Content-Type') : 'text/plain';
    if (contentType.match('json')) {
      return response.json().then(function (json) {
        return callback(null, json, response, contentType);
      }).catch(function (err) {
        return callback(err);
      });
    }
    return response.text().then(function (respText) {
      return callback(null, respText, response, contentType);
    }).catch(function (err) {
      return callback(err);
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

  var jsonBody = JSON.stringify(payload || body);
  fetchJson(makeFetchOptions(options, { method: method, body: jsonBody }));
};

module.exports = {
  fetch: fetch,
  fetchJson: fetchJson,
  postJson: postJson
};