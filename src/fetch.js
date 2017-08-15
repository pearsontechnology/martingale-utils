import isofetch from 'isomorphic-fetch';
import {
  merge
} from './utils';

const appendCredentialsHeaders = (...options)=>{
  return merge({
    credentials: 'same-origin',
    //credentials: 'include',
    //'no-cors': true,
    //mode: 'no-cors'
  }, ...options);
};

const makeFetchOptions = (...options)=>{
  const optionWithPayload = options.find((opt)=>typeof(opt.payload)!=='undefined');
  if(optionWithPayload){
    return merge({
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(optionWithPayload.payload)
    }, ...options, {
      method: (optionWithPayload.method||'POST').toUpperCase()
    });
  }
  return merge(options);
};

const getFetchArgs = (...args)=>{
  if(typeof(args[0])==='string'){
    const [
      url,
      options = {}
    ] = args;
    return {
      url,
      options
    };
  }
  const {
    url,
    ...options = {}
  } = args[0];
  return {
    url,
    options
  };
};

const getFetch = (url, options)=>{
  return isofetch(url, makeFetchOptions(appendCredentialsHeaders(options)));
};

const fetch = (...args)=>{
  const {
    url,
    options: fOptions
  } = getFetchArgs(...args);
  const options = Array.isArray(fOptions)?Object.assign(...fOptions):fOptions;
  const fetch = getFetch(url, options);
  if(typeof(options.callback)!=='function'){
    return fetch;
  }
  const {
    callback
  } = options;
  return fetch.then((response)=>{
    const {
      headers
    } = response;
    const contentType = headers.get('Content-Type');
    const r = response.clone().json().catch((e)=>{
      return response.text();
    });
    return r
      .then(json=>{
        return callback(null, json, response, contentType);
      })
      .catch(e=>{
        console.error(url, e);
        return callback(e);
      });
  })
  .catch((err)=>callback(err));
};

const encodePayload = (payload)=>{
  if(typeof(payload)==='string'){
    try{
      const json = JSON.parse(payload);
      return payload;
    }catch(e){
      return JSON.stringify(payload);
    }
  }
  return JSON.stringify(payload);
};

const fetchJson=({url, payload, ...options})=>{
  return fetch(url, makeFetchOptions(options, {payload}));
};

const postJson=({method="post", body, payload, ...options})=>{
  fetchJson(makeFetchOptions(options, {method, payload: payload||body}));
};

module.exports = {
  fetch,
  fetchJson,
  postJson
};
