class GlobalWsConnect {
    constructor() {
        if (this.instance) return this
        this.io = null
        this.instance = this
    }

    set(io) {
        this.io = io
    }

    get() {
        return this.io
    }

}

module.exports = new GlobalWsConnect()
