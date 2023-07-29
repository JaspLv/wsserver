const axios = require("axios")
const {Server} = require("socket.io");
const ConnectedSockets = require("../data/connectedSockets");
const GlobalWsConnect = require('../data/globalWsConnect')

const BACK_URL = process.env.WEBSOCKET_API_ENDPOINT
const SECRET = process.env.WEBSOCKET_API_SECRET

const sockets = new ConnectedSockets()

const connectWs = (server) => {
    const io = new Server(server);
    console.log('Ws has been connected')
    addHandlers(io)
    GlobalWsConnect.set(io)
}

const addHandlers = io => {
    io.on("connection", async socket => {
        await sendToBack({action: 'connect', data: {user_id: socket.id}})
        socket.join(socket.id);
        sockets.add(socket.id, socket)
        socket.on("payload", async data => {
            if (!data) return
            const res = await sendToBack({action: "payload", data: {user_id: socket.id, payload: data}})
            if (!res) return
            if (!res.status) socket.disconnect(true)
        });

        socket.on('disconnect', async reason => {
            await sendToBack({action: 'disconnect', data: {user_id: socket.id, payload: {reason}}})
        })
    });
}

const sendToBack = async (data) => {
    try {
        return await axios.post(BACK_URL,
            {...data, secret: SECRET},
            {
                headers:
                    {
                        'Content-Type': 'application/json;charset=utf-8'
                    }
            }
        )
    } catch (e) {
        console.log(e)
        return false
    }
}

module.exports = connectWs
