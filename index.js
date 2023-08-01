////////////////////////////
// >      Settings      < //
////////////////////////////
require('dotenv').config()
const secret = process.env.DOCKER_WEBSOCKETS_SECRET;
const webhook = process.env.DOCKER_WEBSOCKETS_WEBHOOK;


////////////////////////////
// >        Init        < //
////////////////////////////
const express = require('express');
const {Router} = require("express");
const routes = Router();
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const {Server} = require("socket.io");
const axios = require("axios");
const io = new Server(httpServer, {
        cors: {
            origin: "*"
        }
    }
);
const sockets = new Map()


app.use(express.json());
app.use('/', routes);


////////////////////////////
// >    HTTP Routing    < //
////////////////////////////
routes.get('/', (req, res) => {
    res.send('<h1>meow</h1>');
});
routes.post('/api', (req, res) => {
    const json = req.body;
    if (json.secret !== secret) {
        res.sendStatus(403);
    }

    wsApiHandler(json.action, json.data);
    res.sendStatus(200);
});


////////////////////////////
// >     WS Routing     < //
////////////////////////////
io.on('connection', (socket) => {
    socket.join('*');

    socket.on("login", async (data) => {
        socket.join(data);
        sockets.set(data, socket)

        socket.data.userId = data;
        sendWebHookConnect(data);
    });

    socket.on('disconnect', () => {
        if (socket.data.userId) {
            sendWebHookDisconnect(socket.data.userId);
        }
    });

    socket.on('publish', (payload) => {
        sendWebHookPublish(socket.data.userId, payload);
    });
});


/////////////////////////////
// >    WebSockets API   < //
/////////////////////////////
const wsApiHandler = async (action, data) => {
    if (action === 'publish') {
        if (Array.isArray(data.user_id)) {
            for (const user of data.user_id) {
                io.to(data.user_id).emit(user, data.payload)
            }
        }

        if (typeof data.user_id === 'string' || data.user_id instanceof String) {
            io.to(data.user_id).emit(data.user_id, data.payload)
        }
    }

    if (action === 'disconnect') {
        if (data.user_id === '*') {
            io.disconnectSockets(true)
            sockets.clear()
        }else {
            sockets.get(data.user_id).disconnect(true)
            sockets.delete(data.user_id)
        }
    }
};

/////////////////////////////
// >     WebHook API     < //
/////////////////////////////
const sendWebHook = async (action, data) => {
    if (webhook.length === 0) return;
    try {
        return await axios({
            url: 'http://caddy/webhooks/websocket',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            data: {action, data, secret}
        })
    } catch (e) {
        console.log(e);
        return false;
    }
};

const sendWebHookConnect = async (userId) => {
    await sendWebHook("connect", {"user_id": userId})
};

const sendWebHookDisconnect = async (userId) => {
    await sendWebHook("disconnect", {"user_id": userId})
};

const sendWebHookPublish = async (userId, payload) => {
    await sendWebHook("publish", {
        "user_id": userId,
        "payload": payload
    })
};


/////////////////////////////
// >        Start        < //
/////////////////////////////
httpServer.listen(3000, () => {
    console.log('listening on *:3000');
});
