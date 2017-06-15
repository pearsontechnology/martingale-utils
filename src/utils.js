const parseObjectPath = (src)=>{
  const removeQuotes=(s)=>s.replace(/['"]/g, '');
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
    }, {keys: ['getObjectValue', 'parseQuery', 'getQueryParam'], values: [getObjectValue, parseQuery, getQueryParam]});
    // eslint-disable-next-line
    const f = toFunc(src.keys, `return ${path};`, obj);
    if( f instanceof Error ){
      throw f;
    }
    try{
      const res = f(...src.values);
      return res;
    }catch(e){
      console.debug(e);
      console.debug('Path: ', path, 'Object: ', obj);
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

const isNumeric = (n)=>!isNaN(parseFloat(n)) && isFinite(n);

const reIsTrue = /^true$/i;
const reIsFalse = /^false$/i;

const isBoolean=(s)=>!!(reIsTrue.exec(s)||reIsFalse.exec(s));

const strToBool=(s, defaultValue)=>{
  if(reIsTrue.exec(s)){
    return true;
  }
  if(reIsFalse.exec(s)){
    return false;
  }
  return defaultValue;
};

const isDateTime=(s)=>!isNaN(Date.parse(s));

const flatten = (a)=>{
  return Array.isArray(a) ? [].concat.apply([], a.map(flatten)) : a;
};

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

const isTheSame = (o1, o2)=>{
  const type = betterType(o1)
  if(type!==betterType(o2)){
    return false;
  }
  const checker = typeCheckers[type]||typeCheckers.default;
  return checker(o1, o2);
};

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

const getQueryParam = (paramName, defaultValue)=>{
  const params = parseQuery();
  return getObjectValue(paramName, params, defaultValue);
};

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
  makeQueryParams
};
