class ConnectedSockets {
    constructor() {
        if (this.instance) return this
        this.instance = this
        this.sockets = new Map()
    }

    add(id, socket) {
        this.sockets.set(id, socket)
    }

    remove(id) {
        this.sockets.delete(id)
    }

    get(id) {
       return this.sockets.get(id)
    }
}


module.exports = ConnectedSockets
