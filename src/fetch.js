import fetch from 'isomorphic-fetch';
import {
  merge
} from './utils';

const makeFetchOptions = (...options)=>{
  return merge({
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    }
  }, ...options);
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
  return fetch(url, makeFetchOptions(options, {body: encodePayload(payload)}))
    .then((response)=>{
      const {
        headers
      } = response;
      const contentType = headers.has('Content-Type')?headers.get('Content-Type'):'text/plain';
      if(contentType.match('json')){
        return response.json()
        .then((json)=>{
          return callback(null, json, response, contentType);
        })
        .catch((err)=>callback(err));
      }
      return response.text()
      .then((respText)=>{
        return callback(null, respText, response, contentType);
      })
      .catch((err)=>callback(err));
    })
    .catch((err)=>callback(err));
};

const postJson=({method="post", body, payload, ...options})=>{
  const jsonBody = JSON.stringify(payload || body);
  fetchJson(makeFetchOptions(options, {method, body: jsonBody}));
};

module.exports = {
  fetch,
  fetchJson,
  postJson
};
