const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')
const v3_request = require('../lib/v3_request')
const endpoints = require('../../endpoints')
const Cryptr = require('cryptr')
const jwt = require("jsonwebtoken")
const base64 = require('base-64');

function jwtSign(payload, callback) {
  let frame = {
    exp: 300
  }

  frame = { ...frame, ...payload }

  frame.exp = 300 // force set avoiding overwritting by payload

  jwt.sign(frame, payload.server_key, (err, token) => {
    if (err) {
      verbosity([err])
      return false
    }
    return callback(token)
  }, { expiresIn: 300 })

}

const requestApi = {
  token: (payload, response) => {
    v3_request({
      userToken: payload.userToken,
      endpoint: endpoints.refreshToken,
      ...payload
    }, (callback) => { response(callback) })
  },
  authFrame: (payload, response) => {
    const { username, password } = payload
    const cryptr = new Cryptr(payload.rc.server_key)

    if (username && password) {
      const frame = { username: base64.decode(username), password: cryptr.decrypt(password) }
      v3_request({
        body: frame,
        endpoint: endpoints.auth,
        ...payload
      }, (callback) => { response(callback) })
    } else {
      response({ err: 136, res: "not username&password sended" })
    }
  },
  dataFrame: (payload, response) => {
    v3_request({
      body: { user_id: payload.user_id, fetch: "user_data" },
      userToken: payload.userToken,
      endpoint: endpoints.get_data,
      ...payload
    }, (callback) => { response(callback) })
  },
}

module.exports = (socket) => {
  socket.on("token", (payload, callback) => {
    if (!payload.token) {
      callback({ code: 115, response: "cannot update an token if is not sended" })
    }

    payload.rc = socket._rc
    let token = payload.token

    try {
      const decoded = jwt.decode(payload.token)
      if (decoded) {
        token = decoded
      }
    } catch (error) {
      // terrible (⓿_⓿)
    }
    
    try {
      delete token.iat
    } catch (error) {
      // terrible (⓿_⓿)
    }

    if (typeof(token.session_token) == "undefined") {
      return callback({ code: 115, response: "the token providen not include access_token" })
    }

    if (typeof (payload.userToken) == "undefined") {
      payload.userToken = token.session_token
    }

    requestApi.token(payload, (callbackResponse) => {
      if (callbackResponse.res.code == 200) {
        const frame = { 
          ...token,
          session_token: callbackResponse.res.response.access_token,
          session_uuid: callbackResponse.res.response.user_id,
        }
  
        jwtSign({ ...frame, server_key: payload.rc.server_key }, (res) => {
          callback({ code: 100, response: { token: res } })
        })
      }else{
        callback({ code: 110, response: callbackResponse })
      }
    })
  })
  socket.on("authentication", (payload, callback) => {
    payload.rc = socket._rc
    let authFrame = null
    let dataFrame = null

    requestApi.authFrame({ username: payload.username, password: payload.password, ...payload }, (callbackResponse) => {
      if (callbackResponse.err) {

      }
      if (callbackResponse.res) {
        switch (callbackResponse.res.code) {
          case 400: {
            return callback(callbackResponse.res)
          }
          case 500: {
            return callback(callbackResponse.res)
          }
          default: {
            break;
          }
        }
        authFrame = callbackResponse.res.response

        const { user_id, access_token } = callbackResponse.res.response
        requestApi.dataFrame({ user_id: user_id, userToken: access_token, ...payload }, (callbackResponse) => {
          switch (callbackResponse.res.code) {
            case 400: {
              return callback(callbackResponse.res)
            }
            case 500: {
              return callback(callbackResponse.res)
            }
            default: {
              break;
            }
          }
          dataFrame = callbackResponse.res.response

          jwtSign({
            server_key: payload.rc.server_key,
            session_uuid: authFrame.user_id,
            session_token: authFrame.access_token,
            avatar: dataFrame.avatar,
            username: dataFrame.username,
            attributes: {
              isAdmin: dataFrame.admin,
              isDev: dataFrame.dev,
              isPro: dataFrame.is_pro
            }
          }, (token) => {
            return callback({ code: 100, response: { authFrame, dataFrame, token } })
          })



        })

      }
    })


  })

}

