const {Router} = require("express");
const ConnectedSockets = require("../../data/connectedSockets");
const GlobalWsConnect = require('../../data/globalWsConnect')
const path = require("path");
const routes = Router()

const SECRET = process.env.WEBSOCKET_API_SECRET

const sockets = new ConnectedSockets()
const io = GlobalWsConnect.get()

routes.post('/', (req, res) => {
    const {data} = req.body
    if (data.secret !== SECRET) return
    parseData(data.data)
})

routes.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'index.html'))
})

const parseData = (data) => {
    const {user_id, action} = data
    if (Array.isArray(user_id)) {
        for (const user of user_id) {
            sendResponseToClient(user, action, data.payload)
        }
        return
    }
    if (user_id === '*') {
        sendResponseToClient(null, action, data.payload)
        return
    }
    if (user_id) {
        sendResponseToClient(user_id, action, data.payload)
    }
}

const sendResponseToClient = (user = null, type, data = []) => {
    if (type === 'disconnect') disconnectClient(user)
    if (type === 'payload') sendToClient(user, data)
}

const disconnectClient = (user = null) => {
    if (user) {
        sockets.get(user).disconnect()
        sockets.remove(user)
        return
    }
    io.disconnectSockets(true)
}

const sendToClient = (user = undefined, data) => {
    if (user) return io.to(user).emit('payload', data)
    io.emit('payload', data)
}



module.exports = routes
