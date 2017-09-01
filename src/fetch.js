import isofetch from 'isomorphic-fetch';
import {
  merge
} from './utils';
const AWS4 = require('aws4');

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

const authToHeaders = (options)=>{
  if(options.auth){
    const {
      username,
      password,
      bearer,
      raw,
      aws4
    } = options.auth;
    options.headers = options.headers || {};
    if(username && password){
      const unp = new Buffer(username + ':' + password).toString('base64');
      options.headers = Object.assign(options.headers, {Authorization: 'Basic ' + unp});
      return options;
    }
    if(bearer){
      options.headers = Object.assign(options.headers, {Authorization: 'Bearer ' + bearer});
      return options;
    }
    if(raw){
      options.headers = Object.assign(options.headers, {Authorization: raw});
      return options;
    }
    if(aws4){
      const uri = options.url || options.uri;
      const uriConfig = !uri?options:URL.parse(uri);
      const hostParts = uriConfig.host.split('.');
      uriConfig.service = uriConfig.service || hostParts[0];
      uriConfig.headers = uriConfig.headers || {};
      uriConfig.headers['content-type'] = 'application/json';
      if(hostParts[1]!=='amazonaws'){
        uriConfig.region = hostParts[1];
      }
      return AWS4.sign(uriConfig, aws4);
    }
  }
  return options;
};

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
  return merge(...options);
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

const getFetch = (url, options = {})=>{
  const withCreds = options.auth?authToHeaders(options):appendCredentialsHeaders(options);
  const fetchOptions = makeFetchOptions(withCreds);
  return isofetch(url, fetchOptions);
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
const fetch = (...args)=>{
  const {
    url,
    options: fOptions
  } = getFetchArgs(...args);
  const options = Array.isArray(fOptions)?merge(...fOptions):fOptions;
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

const fetchJson = fetch;

const postJson=(options)=>{//}{method="post", body, payload, ...options})=>{
  console.log('postJson', options)
  return fetchJson(Object.assign({method: 'post'}, options));
};

module.exports = {
  fetch,
  fetchJson,
  postJson
};
