const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')
const v3_request = require('../lib/v3_request')
const endpoints = require('../../endpoints')

const typeToMap = {
    feed: "get_news_feed",
    user: "get_user_posts",
    saved: "saved",
    post: "post"
}

const apiRequest_actions = (payload, response) => {
    try {
        const { post_id, action } = payload
        if (!post_id || !action) {
            response({ code: 115, response: "post_id/action not provided" })
        }
        v3_request({
            body: { post_id, action },
            userToken: payload.userToken,
            endpoint: endpoints.post_actions,
            ...payload
        }, (callback) => { response(callback) })
    } catch (error) {
        verbosity([error])
        return false
    }
}

const apiRequest_posts = (payload, response) => {
    try {
        if (typeof (payload.limit) == "undefined") {
            payload.limit = 20
        }
        if (typeof (payload.from) == "undefined") {
            payload.from = "feed" // by default 
        }
        if (typeof (payload.id) == "undefined") {
            payload.id = 0 // by default 
        }
        console.log(payload)
        v3_request({
            body: { limit: payload.limit, fetch: typeToMap[payload.from], id: payload.id, post_id: payload.post_id },
            userToken: payload.userToken,
            endpoint: endpoints.posts,
            ...payload
        }, (callback) => { response(callback) })
    } catch (error) {
        verbosity([error])
        return false
    }
}


module.exports = (socket) => {
    socket.on("get", (payload, callback) => {
        try {
            if (!socket._rc || !payload)
                return callback({ err: 110, res: "socket_rc/payload not avialable" })
            if (typeof (payload) !== "object")
                return callback({ err: 146, res: "payload is not an object" })

            payload.rc = socket._rc

            apiRequest_posts(payload, (response => {
                if (typeof (callback) !== "undefined") {
                    return callback(response.res)
                }
                return false
            }))
        } catch (error) {
            verbosity([error])
            return false
        }
    })
    socket.on("actions", (payload, callback) => {
        try {
            if (!socket._rc || !payload)
                return callback({ err: 110, res: "socket_rc/payload not avialable" })
            if (typeof (payload) !== "object")
                return callback({ err: 146, res: "payload is not an object" })

            payload.rc = socket._rc

            apiRequest_actions(payload, (response => {
                if (typeof (callback) !== "undefined") {
                    return callback(response.res)
                }
            }))
        } catch (error) {
            verbosity([error])
            return false
        }
    })
}

