const express = require('express');
const server = require('http');
const socket = require("socket.io")
const axios = require('axios')
require('dotenv').config()

const BACK_URL = process.env.WEBSOCKET_API_ENDPOINT
const SECRET = process.env.WEBSOCKET_API_SECRET


const app = express()
server.createServer(app)
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
        sendResponseToClient(user_id, action, data.payload)
    }else {
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

/*
По итогу у тебя в апихе 2 экшна будет:
1.
{
  "secret": "secret_communication_password"
  "action": "publish",
  "data": {
    "user_id": "*",
    "payload": [
      "any message"
    ]
  }
}

2.
{
  "secret": "secret_communication_password"
  "action": "disconnect",
  "data": {
    "user_id": "*"
  }
}

Во всех кейсах user_ids может быть либо строкой, содержащей конкретный идентификатор, либо массивом, содержащий несколько идентификаторов, либо *, означающий что всем подключенным к тебе

Во всех кейсах secret это секретный ключ, по которму мы определяем что это действительно запрос между нами, а не пришедший извне. Секретный ключ знает только бэк и твой вебсокет сервер. Ты сначала проверяешь его, и только если он совпадает, продолжаешь работу. Иначе - этот запрос игнорируется

В первом кейсе payload может быть и массивом, и объектом, и строкой, и в целом чем угодно. payload нужно будет отдать на фронт в сыром виде "как есть"

Бэк уже готов слать запросы, ахах
}*/


server.listen(3000);
