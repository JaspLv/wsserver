const createHttpServer = require("./server/server");
const connectWs = require("./ws/webSocket");
require('dotenv').config()

const PORT = process.env.PORT || 3000

const start = () => {
    const server = createHttpServer(PORT)
    connectWs(server)
}

start()
