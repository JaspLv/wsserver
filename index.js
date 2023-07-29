const express = require('express');
const http = require('http');
const socket = require("socket.io")
const axios = require('axios')
require('dotenv').config()

const BACK_URL = process.env.WEBSOCKET_API_ENDPOINT
const SECRET = process.env.WEBSOCKET_API_SECRET
const PORT = process.env.PORT


const app = express()
const server = http.createServer(app)
const io = socket(server);

app.use(express.json())

io.on("connection", (socket) => {
    socket.on("new user", async (data) => {
        if (!data) return
        if (data.secret !== SECRET) return
        const res = await axios.post(BACK_URL, {secret: SECRET, action: "publish", data})
        if (!res.status) socket.disconnect(true)
        socket.join(data.user_id);
    });

    socket.on("disconnect", () => {
        io.emit("user disconnected");
    });
});


app.post('/', (req, res) => {
    const { data } = req.body
    if (data.secret !== SECRET) return
    parseData(data.data)
})

const parseData = (data) => {
    const { user_id, action } = data
    if (Array.isArray(user_id)) {
        for (const user of user_id) {
            sendResponseToClient(user, action, data.payload)
        }
        return
    }
    if (!isNum(user_id)) {
        return sendResponseToClient(user_id, action, data.payload)
    }
    if (user_id === '*') {
        sendResponseToClient(null, action, data.payload)
    }
}

const sendResponseToClient = (user = null, type, data = []) => {
    if (type === 'disconnect') disconnectUser(user)
    if (type === 'publish') sendData(user, data)
}

const disconnectUser = (user = null) => {
    if (user) return io.to(user).disconnect(true)
    io.disconnect(true)
}

const sendData = (user = undefined, data) => {
    if (user) return io.to(user).emit('publish', data)
    io.emit('publish', data)
}

const isNum = val => !isNaN(parseInt(val))



server.listen(PORT, () => console.log('Server has been started', PORT));
