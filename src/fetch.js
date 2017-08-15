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

const fetch = (...args)=>{
  if(typeof(args[0])==='string'){
    const [
      url,
      options
    ] = args;
    return isofetch(url, makeFetchOptions(appendCredentialsHeaders(options)));
  }
  const {
    url,
    ...options
  } = args[0];
  return isofetch(url, makeFetchOptions(appendCredentialsHeaders(options)));
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

const fetchJson=({url, callback, payload, ...options})=>{
  return fetch(url, makeFetchOptions(options, {payload}))
    .then((response)=>{
      const {
        headers
      } = response;
      const contentType = headers.get('Content-Type');
      const r = response.clone().json().catch((e)=>{
        console.error('Not JSON', url, e);
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

const postJson=({method="post", body, payload, ...options})=>{
  fetchJson(makeFetchOptions(options, {method, payload: payload||body}));
};

module.exports = {
  fetch,
  fetchJson,
  postJson
};
