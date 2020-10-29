const FormData = require("formdata-node")
const uri_compile = require('../uri_compiler')
const fetch = require('node-fetch')

module.exports = async (payload, callback) => {
  if (!payload) return false
  const { endpoint, body, userToken, options, rc } = payload

  let petition = {
    body: null,
    serverKey: rc.server_key,  // set in from socket payload
    userToken: null
  }

  body ? (petition.body = body) : null;
  userToken ? (petition.userToken = userToken) : null;

  let { method, url } = await uri_compile(endpoint)

  const requestBody = new FormData()
  requestBody.set("server_key", rc.server_key)

  let requestOptions = {
    method: method || 'POST',
    timeout: 0
  }

  if (options != null) {
    requestOptions = { ...requestOptions, ...options }
  }

  if (petition.userToken != null) {
    url = `${url}?access_token=${petition.userToken}`
  }

  if (petition.body != null) {
    try {
      const bodyLength = Object.keys(petition.body).length
      if (bodyLength > 0) {
        for (let index = 0; index < bodyLength; index++) {
          const ent = Object.entries(petition.body)[index]
          const key = ent[0]
          const value = ent[1]
          requestBody.append(key, value)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }
  fetch(url, {
    method: requestOptions.method,
    body: requestBody.stream,
    headers: requestBody.headers
  })
    .then(res => res.json())
    .then(async (response) => {
      return callback({ err: false, res: response })
    })
    .catch((error) => {
      return callback({ err: 110, res: error })
    })
}

