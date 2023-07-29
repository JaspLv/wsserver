const express = require('express')
const http = require('http')

const app = express()

const createHttpServer = (PORT) => {
    const server = http.createServer(app)
    app.use(express.json())
    app.use('/', require('./routes/index'))

    server.listen(PORT, () => console.log('Server has been started', PORT))

    return server
}


module.exports = createHttpServer

