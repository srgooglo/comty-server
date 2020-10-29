const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')
const v3_request = require('../lib/v3_request')
const endpoints = require('../../endpoints')

const requestApi = {
    feed: (payload, response) => {
        if (typeof(payload.limit) == "undefined") {
            payload.limit = 20
        }
        v3_request({
            body: {limit: payload.limit, fetch: "get_news_feed"},
            userToken: payload.userToken,
            endpoint: endpoints.posts,
            ...payload
        }, (callback) => { response(callback) })
    },
    user: (payload, response) => {

    },
    hashtag: (payload, response) => {

    }
}
const requestKeys = Object.keys(requestApi)

module.exports = (socket) => {
    socket.on("get", (payload, callback) => {
        if(!callback)
            return false
        if (typeof (payload) !== "object") {
            return callback({ err: 146, res: "payload is not an object" })
        }
        payload.rc = socket._rc
        const { from } = payload
        if (requestKeys.includes(from)) {
            requestApi[from](payload, (response => {
                return callback(response.res)
            }))
        }else {
            return callback({ err: 146, res: `requesting from ${from} is not available` })
        }
    })
}

