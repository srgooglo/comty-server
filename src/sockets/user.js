const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')
const v3_request = require('../lib/v3_request')
const endpoints = require('../../endpoints')


const apiRequest_Actions = (payload, response) => {
    try {
        const { user_id, action } = payload
        if (!user_id || !action) {
            response({ code: 115, response: "user_id/action not provided" })
        }
        v3_request({
            body: { user_id, action },
            userToken: payload.userToken,
            endpoint: endpoints.user_actions,
            ...payload
        }, (callback) => { response(callback) })
    } catch (error) {
        verbosity([error])
        return false
    }
}

const apiRequest_Get = {
    data: (payload, response) => {
        v3_request({
            body: { user_id: payload.user_id, fetch: "user_data" },
            userToken: payload.userToken,
            endpoint: endpoints.get_data,
            ...payload
        }, (callback) => { response(callback) })
    },
    profileData: (payload, response) => {
        v3_request({
            body: { username: payload.username },
            userToken: payload.userToken,
            endpoint: endpoints.profileData,
            ...payload
        }, (callback) => { response(callback) })
    }
}
const requestKeys = Object.keys(apiRequest_Get)

module.exports = (socket) => {
    socket.on("get", (payload, callback) => {
        try {
            if (typeof (payload) !== "object") {
                return callback({ err: 146, res: "payload is not an object" })
            }
            payload.rc = socket._rc
            const { from } = payload
            if (requestKeys.includes(from)) {
                apiRequest_Get[from](payload, (response => {
                    if (typeof (callback) !== "undefined") {
                        return callback(response.res)
                    }
                    return false
                }))
            } else {
                return callback({ err: 146, res: `requesting from ${from} is not available` })
            }
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

            apiRequest_Actions(payload, (response => {
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
}

