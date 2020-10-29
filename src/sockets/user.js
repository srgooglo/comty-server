const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')
const v3_request = require('../lib/v3_request')
const endpoints = require('../../endpoints')

const requestApi = {
    data: (payload, response) => {
        v3_request({
            body: { user_id: payload.user_id, fetch: "user_data" },
            userToken: payload.userToken,
            endpoint: endpoints.get_data,
            ...payload
        }, (callback) => { response(callback) })
    },
    profileData: (payload, response) => {

    }
}
const requestKeys = Object.keys(requestApi)

module.exports = (socket) => {
    socket.on("get", (payload, callback) => {
        if (!callback)
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
        } else {
            return callback({ err: 146, res: `requesting from ${from} is not available` })
        }
    })
}

