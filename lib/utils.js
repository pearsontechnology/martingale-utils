'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var parseObjectPath = function parseObjectPath(src) {
  var removeQuotes = function removeQuotes(s) {
    return s.replace(/['"]/g, '');
  };
  return src.match(/[^."'[\]]+|"([^"]+")|'([^']+')/g).map(removeQuotes);
};

/*
Currently the following will work
  const data = {
    foo:{
      bar: [
        'bar 0',
        {
          some: 'value'
        },
        'bar 2'
      ]
    },
    'foo.bar': 'Different, eh?'
  };

  getObjectValue('foo', data);
  getObjectValue('foo.bar.0', data);
  getObjectValue('foo.bar[0]', data);
  getObjectValue('"foo.bar"', data);
  getObjectValue('\'foo.bar\'', data);

  getObjectValue('arr[arr.length-1]', {arr: [0, 1, 2]}) > 2
  getObjectValue('arr[idx]', {arr: [0, 1, 2], idx: 1}) > 1
  getObjectValue('arr || this', {no: 'arr element'}) > {no: 'arr element'}
//*/

var toFunc = function toFunc(args, src, obj) {
  try {
    var f = new Function(args, src).bind(obj);
    return f;
  } catch (e) {
    console.error(e);
    console.error('Args: ', args);
    console.error('Source: ', src);
    console.error('Data: ', obj);
    e.args = args;
    e.source = src;
    e.data = obj;
    return e;
  }
};

var getObjectValue = function getObjectValue(path, obj, defaultValue) {
  if (obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
    var src = Object.keys(obj).reduce(function (src, key) {
      if (isNumeric(key)) {
        return src;
      }
      var value = obj[key];
      return {
        keys: src.keys.concat(key),
        values: [].concat(_toConsumableArray(src.values), [value])
      };
    }, { keys: ['getObjectValue'], values: [getObjectValue] });
    // eslint-disable-next-line
    var _f = toFunc(src.keys, 'return ' + path + ';', obj);
    if (_f instanceof Error) {
      throw _f;
    }
    try {
      var res = _f.apply(undefined, _toConsumableArray(src.values));
      return res;
    } catch (e) {
      console.debug(e);
      console.debug('Path: ', path, 'Object: ', obj);
      return defaultValue;
    }
  }
  // eslint-disable-next-line
  var f = new Function('', 'return ' + path + ';').bind(obj);
  try {
    var _res = f();
    return _res;
  } catch (e) {
    console.debug(e);
    console.debug('Path: ', path, 'Object: ', obj);
    return defaultValue;
  }
};

var isNumeric = function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var reIsTrue = /^true$/i;
var reIsFalse = /^false$/i;

var isBoolean = function isBoolean(s) {
  return !!(reIsTrue.exec(s) || reIsFalse.exec(s));
};

var strToBool = function strToBool(s, defaultValue) {
  if (reIsTrue.exec(s)) {
    return true;
  }
  if (reIsFalse.exec(s)) {
    return false;
  }
  return defaultValue;
};

var isDateTime = function isDateTime(s) {
  return !isNaN(Date.parse(s));
};

var flatten = function flatten(a) {
  return Array.isArray(a) ? [].concat.apply([], a.map(flatten)) : a;
};

var betterType = function betterType(o) {
  var type = typeof o === 'undefined' ? 'undefined' : _typeof(o);
  if (type === 'object') {
    if (Array.isArray(o)) {
      return 'array';
    }
    if (o instanceof RegExp) {
      return 'regex';
    }
    if (o instanceof Date) {
      return 'date';
    }
    if (o === null) {
      return 'null';
    }
    return type;
  }
  return type;
};

var typeCheckers = {
  object: function object(o1, o2) {
    var keys1 = Object.keys(o1);
    var keys2 = Object.keys(o2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    var keysSame = keys1.filter(function (key) {
      return keys2.indexOf(key) > -1;
    });
    if (keysSame.length !== keys1.length) {
      return false;
    }
    return keys1.every(function (key) {
      // eslint-disable-next-line
      return isTheSame(o1[key], o2[key]);
    });
  },
  array: function array(a1, a2) {
    if (a1.length !== a2.length) {
      return false;
    }
    return a1.every(function (index) {
      // eslint-disable-next-line
      return isTheSame(a1[index], a2[index]);
    });
  },
  date: function date(d1, d2) {
    return d1.getTime() === d2.getTime();
  },
  default: function _default(a, b) {
    return a === b;
  }
};

var isTheSame = function isTheSame(o1, o2) {
  var type = betterType(o1);
  if (type !== betterType(o2)) {
    return false;
  }
  var checker = typeCheckers[type] || typeCheckers.default;
  return checker(o1, o2);
};

var clone = function clone(src) {
  if (null === src || (typeof src === 'undefined' ? 'undefined' : _typeof(src)) !== 'object') {
    return src;
  }

  if (Array.isArray(src)) {
    return src.map(clone);
  }

  if (src instanceof RegExp) {
    return new RegExp(src);
  }

  if (src instanceof Date) {
    return new Date(src);
  }

  return Object.keys(src).reduce(function (copy, key) {
    if (src.hasOwnProperty(key)) {
      return Object.assign({}, copy, _defineProperty({}, key, clone(src[key])));
    }
    return copy;
  }, {});
};

var merge = function merge() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!args.length) {
    return {};
  }
  return args.reduce(function (res, arg) {
    if (!res) {
      return arg;
    }
    if (Array.isArray(res)) {
      return [].concat(_toConsumableArray(res), _toConsumableArray(Array.isArray(arg) ? arg : [arg]));
    }
    if (Array.isArray(arg)) {
      return [res].concat(_toConsumableArray(arg));
    }
    var rType = typeof res === 'undefined' ? 'undefined' : _typeof(res);
    var aType = typeof arg === 'undefined' ? 'undefined' : _typeof(arg);
    if (rType !== 'object') {
      return arg;
    }
    if (aType !== 'object') {
      return [res, arg];
    }
    return Object.keys(arg).reduce(function (res, key) {
      return Object.assign({}, res, _defineProperty({}, key, merge(res[key], arg[key])));
    }, res);
  }, clone(args[0]));
};

var typedValueOf = function typedValueOf(s) {
  if (isNumeric(s)) {
    return +s;
  }
  if (isBoolean(s)) {
    return strToBool(s);
  }
  if (isDateTime(s)) {
    return new Date(Date.parse(s));
  }
  return s;
};

var parseQuery = function parseQuery() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.search.substring(1);

  if (typeof str != "string" || str.length == 0) {
    return {};
  }
  var s = str.split("&");
  var s_length = s.length;
  var query = {};
  for (var i = 0; i < s_length; i++) {
    var bit = s[i].split("=");
    var first = decodeURIComponent(bit[0]);
    if (first.length == 0) {
      continue;
    }
    var second = typedValueOf(decodeURIComponent(bit[1]));
    if (typeof query[first] === 'undefined') {
      query[first] = second;
      continue;
    }
    if (Array.isArray(query[first])) {
      query[first].push(second);
      continue;
    }
    query[first] = [query[first], second];
  }
  return query;
};

var getQueryParam = function getQueryParam(paramName, defaultValue) {
  var params = parseQuery();
  return getObjectValue(paramName, params, defaultValue);
};

module.exports = {
  parseObjectPath: parseObjectPath,
  getObjectValue: getObjectValue,
  isNumeric: isNumeric,
  isDateTime: isDateTime,
  isBoolean: isBoolean,
  strToBool: strToBool,
  flatten: flatten,
  betterType: betterType,
  isTheSame: isTheSame,
  clone: clone,
  merge: merge,
  typedValueOf: typedValueOf,
  parseQuery: parseQuery,
  getQueryParam: getQueryParam
};