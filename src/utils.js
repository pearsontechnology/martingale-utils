const {
  singular,
  plural
} = require('pluralize');

/**
 * Takes in a string and returns an array of strings that define a path.
 * Splits based on quotes, .'s and. []'s
 * @param {string} source - Source string to parse
 * @return {array} Array of strings
 *
 * @example
 * const res = parseObjectPath('foo.bar[0]."biz-baz"');
 * // res would equal: ['foo', 'bar', '0', 'biz-baz']
 */
const parseObjectPath = (src)=>{
  const removeQuotes=(s)=>s.replace(/['"]/g, '');
  return src.match(/[^."'[\]]+|"([^"]+")|'([^']+')/g).map(removeQuotes);
};

const toFunc = (args, src, obj)=>{
  try {
    const f = new Function(args, src).bind(obj);
    return f;
  } catch(e) {
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

/**
 * Returns the value from the path or calculation against the given object, if no value is found then returns defaultValue
 * @param {string} path - Path to the value to be returned
 * @param {object} obj - Object to retrieve value from
 * @param {any} defaultValue - Value to return if the value could not be found or calculated from the object passed in
 *
 * @example
 * //Currently the following will work
 * const data = {
 *   foo:{
 *     bar: [
 *       'bar 0',
 *       {
 *         some: 'value'
 *       },
 *       'bar 2'
 *     ]
 *   },
 *   'foo.bar': 'Different, eh?'
 * };
 *
 * getObjectValue('foo', data);
 * getObjectValue('foo.bar.0', data);
 * getObjectValue('foo.bar[0]', data);
 * getObjectValue('"foo.bar"', data);
 * getObjectValue('\'foo.bar\'', data);
 *
 * getObjectValue('arr[arr.length-1]', {arr: [0, 1, 2]}) > 2
 * getObjectValue('arr[idx]', {arr: [0, 1, 2], idx: 1}) > 1
 * getObjectValue('arr || this', {no: 'arr element'}) > {no: 'arr element'}
 *
 */
const getObjectValue = (path, obj, defaultValue)=>{
  if(obj && typeof(obj)==='object'){
    const src = Object.keys(obj).reduce((src, key)=>{
      if(isNumeric(key)){
        return src;
      }
      const value = obj[key];
      return {
        keys: src.keys.concat(key),
        values: [...src.values, value]
      };
    }, {
      keys: ['getObjectValue', 'parseQuery', 'getQueryParam', 'addQueryParams', 'extractQueryParams', 'singular', 'plural'],
      values: [getObjectValue, parseQuery, getQueryParam, addQueryParams, extractQueryParams, singular, plural]
    });
    // eslint-disable-next-line
    const f = toFunc(src.keys, `return ${path};`, obj);
    if( f instanceof Error ){
      throw f;
    }
    try{
      const res = f(...src.values);
      return res;
    }catch(e){
      if(typeof(defaultValue)!=='undefined'){
        console.debug(e);
        console.debug('Path: ', path, 'Object: ', obj);
        return defaultValue;
      }
      console.error(e);
      console.error('Path: ', path, 'Object: ', obj);
      return defaultValue;
    }
  }
  // eslint-disable-next-line
  const f = (new Function('', `return ${path};`)).bind(obj);
  try{
    const res = f();
    return res;
  }catch(e){
    console.debug(e);
    console.debug('Path: ', path, 'Object: ', obj);
    return defaultValue;
  }
};

/**
 * Returns true is the passed in value is a numeric value or false if it is not
 * @param {any} n - The value to test
 * @return {boolean} true if the value was a numeric value, false it it was not
 */
const isNumeric = (n)=>!isNaN(parseFloat(n)) && isFinite(n);

const reIsTrue = /^true$/i;
const reIsFalse = /^false$/i;

/**
 * Returns true is the passed in value is "true" or "false" (strings)
 * @param {string} s - The value to test
 * @return {boolean} true if the value was either "true" or "false", returns false otherwise
 */
const isBoolean=(s)=>!!(reIsTrue.exec(s)||reIsFalse.exec(s));

/**
 * Returns true is the passed in value is "true", false if the passed in value was "false", or defaultValue if the passed in value was not "true" or "false"
 * @param {string} s - The value to test
 * @param {any} defaultValue - Value to return if not "true" or "false" is passed in
 * @return {boolean}
 */
const strToBool=(s, defaultValue)=>{
  if(reIsTrue.exec(s)){
    return true;
  }
  if(reIsFalse.exec(s)){
    return false;
  }
  return defaultValue;
};

/**
 * Returns true is the passed in value is a valid value that Date.parse() can parse, otherwise returns false.
 * @param {string} s - The value to test
 * @return {boolean} true if the value was a valid value that Date.parse() could parse.
 */
const isDateTime=(s)=>!isNaN(Date.parse(s));

/**
 * Flattens an Array of Arrays
 * @param {array} a - Array of Array's
 * @return {array} the flattened array
 */
const flatten = (a)=>{
  return Array.isArray(a) ? [].concat.apply([], a.map(flatten)) : a;
};

/**
 * Returns the type of the value passed in.
 * @param {any} o - Value to find type of
 * @return {('object'|'array'|'date'|'regex'|'null'|'undefined'|'number'|'boolean'|'string'|'symbol'|'function')} The type of the value passed in
 */
const betterType = (o)=>{
  const type = typeof(o);
  if(type === 'object'){
    if(Array.isArray(o)){
      return 'array';
    }
    if(o instanceof RegExp){
      return 'regex';
    }
    if(o instanceof Date){
      return 'date';
    }
    if(o === null){
      return 'null';
    }
    return type;
  }
  return type;
};

const typeCheckers={
  object(o1, o2){
    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);
    if(keys1.length !== keys2.length){
      return false;
    }
    const keysSame = keys1.filter((key)=>keys2.indexOf(key)>-1);
    if(keysSame.length!==keys1.length){
      return false;
    }
    return keys1.every((key)=>{
      // eslint-disable-next-line
      return isTheSame(o1[key], o2[key]);
    });
  },
  array(a1, a2){
    if(a1.length !== a2.length){
      return false;
    }
    return a1.every((index)=>{
      // eslint-disable-next-line
      return isTheSame(a1[index], a2[index]);
    });
  },
  date(d1, d2){
    return d1.getTime()===d2.getTime();
  },
  default(a, b){
    return a === b;
  }
};

/**
 * Performs a deep test of o1 and o2 to see if they are the same.  Recursivly steps through Object Keys/Values and Arrays to check all child types.
 * @param {any} o1 - First value to test
 * @param {any} o2 - Second value to test
 * @return {boolean} Returns true if the two are the same, false otherwise
 */
const isTheSame = (o1, o2)=>{
  const type = betterType(o1)
  if(type!==betterType(o2)){
    return false;
  }
  const checker = typeCheckers[type]||typeCheckers.default;
  return checker(o1, o2);
};

/**
 * Creates a deep copy of the source and returns it
 * @param {any} src - Thing to clone
 */
const clone = (src)=>{
  if(null === src || typeof(src) !== 'object'){
    return src;
  }

  if(Array.isArray(src)){
    return src.map(clone);
  }

  if(src instanceof RegExp){
    return new RegExp(src);
  }

  if(src instanceof Date){
    return new Date(src);
  }

  return Object.keys(src).reduce((copy, key)=>{
    if(src.hasOwnProperty(key)){
      return Object.assign({}, copy, {[key]: clone(src[key])});
    }
    return copy;
  }, {});
};

/**
 * Performs a recursive merge of all values passed in, if two values are different (string and object as an example) then a new Array will be created that contains both values.
 */
const merge = (...args)=>{
  if(!args.length){
    return {};
  }
  return args.reduce((res, arg)=>{
    if(!res){
      return arg;
    }
    if(Array.isArray(res)){
      return [...res, ...(Array.isArray(arg)?arg:[arg])];
    }
    if(Array.isArray(arg)){
      return [res, ...arg];
    }
    const rType = typeof(res);
    const aType = typeof(arg);
    if(rType !== 'object'){
      return arg;
    }
    if(aType !== 'object'){
      return [res, arg];
    }
    return Object.keys(arg).reduce((res, key)=>{
      return Object.assign({}, res, {[key]: merge(res[key], arg[key])});
    }, res);
  }, clone(args[0]));
};

/**
 * Accepts a string and returns the typed value of it, Boolean, Number, or Date().  If the string isn't a Boolean, Number, or Date(), then returns the origional string.
 * @param {string} s - The string to transform
 * @return {number|boolean|date|string} - The transformed value
 */
const typedValueOf = (s)=>{
  if(isNumeric(s)){
    return +s;
  }
  if(isBoolean(s)){
    return strToBool(s);
  }
  if(isDateTime(s)){
    return new Date(Date.parse(s));
  }
  return s;
};

/**
 * Prases the query part of the window.location.search or the passed in string and returns it as a JavaScript Object.  Creates Arrays or Objects for nested values.
 * @param {string} str - The value to parse
 * @return {object} Object representing the key/value paris found in the query string.
 */
const parseQuery = (str=window.location.search.substring(1))=>{
  if(typeof str != "string" || str.length == 0){
    return {};
  }
  const s = str.split("&");
  const s_length = s.length;
  const query = {};
  for(let i = 0; i < s_length; i++){
    const bit = s[i].split("=");
    const first = decodeURIComponent(bit[0]);
    if(first.length == 0){
      continue;
    }
    const second = typedValueOf(decodeURIComponent(bit[1]));
    if(typeof(query[first]) === 'undefined'){
      query[first] = second;
      continue;
    }
    if(Array.isArray(query[first])){
      query[first].push(second);
      continue;
    }
    query[first] = [query[first], second];
  }
  return query;
};

/**
 * Returns the value of the requested query parameter or defaultValue if it isn't found in the query string.
 * @param {string} paramName - Name of the query parameter to fetch.
 * @param {any} defaultValue - Value to return if it isn't found.
 * @return {any} Value found or defaultValue
 */
const getQueryParam = (paramName, defaultValue)=>{
  const params = parseQuery();
  return getObjectValue(paramName, params, defaultValue);
};

/**
 * Accepts an Object and an optional prefix and returns a valid query string representation of it.
 * @param {object} props - JavaScript object to convert to query string
 * @param {string} prefix - Optional prefix to prepend to the name
 * @return {string} Query string representation of the object
 */
const makeQueryParams = (props, prefix)=>{
  const propNames = Object.keys(props).filter((p)=>props.hasOwnProperty(p));
  return propNames.map((p)=>{
    const k = encodeURIComponent(p);
    const key = prefix?`${prefix}[${k}]`:k;
    const v = props[p];
    const value = (typeof(v)==='object')?makeQueryParams(v, key):encodeURIComponent(props[p]);
    return `${key}=${value}`;
  }).join('&');
};

/**
 * Appends the given object as query string values to the passed in url
 * @param {string} url - The URL to append values to
 * @param {object} props - JavaScript object of values to be appeneded
 * @return {string} Mutated URL with new properties appended to it
 */
const addQueryParams=(url, props)=>{
  const pageParams = makeQueryParams(props);
  if(!pageParams){
    return url;
  }
  return url.indexOf('?')>-1?`${url}&${pageParams}`:`${url}?${pageParams}`;
};

/**
 * Extracts only the query parameters requested and returns them either as a query string an object.
 * @param {array} paramNames - Array of named parameters to extract
 * @param {boolean} asString - If true then values will be returned as a query string value, otherwise returned as an object
 * @return {string|object} The resulting extracted values
 */
const extractQueryParams=(paramNames, asString=true)=>{
  const existingParams = parseQuery();
  const params = paramNames.reduce((params, key)=>{
    const value = getObjectValue(key, existingParams);
    if(typeof(value)==='undefined'){
      return params;
    }
    return Object.assign({}, params, {[key]: value});
  }, {});
  if(asString){
    return addQueryParams('', params);
  }
  return params;
};

/**
 * Tests the passed in object to see if it is a server side error object.
 * @param {object} o - The object to test.
 * @return {boolean} Returns true if the passed value is a server side error, false if it was not.
 */
const isErrorObject = (o)=>{
  if(betterType(o)==='object'){
    return o.statusCode && o.error && o.message;
  }
  return false;
};

module.exports = {
  parseObjectPath,
  getObjectValue,
  isNumeric,
  isDateTime,
  isBoolean,
  strToBool,
  flatten,
  betterType,
  isTheSame,
  clone,
  merge,
  typedValueOf,
  parseQuery,
  getQueryParam,
  makeQueryParams,
  addQueryParams,
  extractQueryParams,
  isErrorObject
};
