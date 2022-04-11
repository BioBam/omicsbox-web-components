export class WebSocketRequest {
  constructor(args) {
    this.args = args;
    this.reqidMap = {};
    //this.setup();
  }
  setup() {
    this.webSocket = new WebSocket(this.args.url, this.args.protocols);
    this.webSocket.onmessage = (e) => {
      var eData = JSON.parse(e.data.replace(/\bNaN\b/g, '"."'));
      var cb = this.reqidMap[eData.reqid];
      if (cb != null) {
        delete this.reqidMap[eData.reqid];
        cb(eData.data);
      } else {
        if (this.args.serverCallback != null) {
          this.args.serverCallback(eData);
        }
      }
    };
    this.webSocket.onopen = (e) => {
      if (this.args.onopen != null) {
        this.args.onopen(e);
      }
    };
    this.webSocket.onclose = (e) => {
      if (this.args.onclose != null) {
        this.args.onclose(e);
      }
    };
    this.webSocket.onerror = (e) => {
      if (this.args.onerror != null) {
        this.args.onerror(e);
      }
    };

    // The 'onclose' does not seem to be triggered when closing the websocket.
    // Surprisingly, this works (it should be the same?)
    this.webSocket.addEventListener(
      "close",
      function (event) {
        this.webSocket = null;
        setTimeout(
          function () {
            console.log("Reconnecting");
            this.setup();
          }.bind(this),
          2000
        );
      }.bind(this)
    );
  }
  close() {
    this.webSocket.close();
  }
  sendJson(data, cb) {
    var reqId = this.genReqid(cb);
    this.trySend({ reqid: reqId, data: data });
  }
  async restRequest(endpoint, method, data = {}, cb = () => {}) {
    const restResponse = await fetch(`${this.args.url}/${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: method,
      body: method !== "GET" ? JSON.stringify(data) : undefined,
    });
    const responseJson = await restResponse.json();

    cb(responseJson);
  }
  trySend(reqItem) {
    // switch (this.webSocket.readyState) {
    //     case 1: // OPEN	1	La conexión está abierta y lista para comunicar.
    //         this.webSocket.send(JSON.stringify(reqItem));
    //         break;
    //     case 3: // CLOSED	3	La conexión está cerrada o no puede ser abierta.
    //         this.setup();
    //         setTimeout(() => {
    //             this.trySend(reqItem);
    //         }, 50);
    //         break;
    //     default:
    //         // CONNECTING	0	La conexión no está aún abierta.
    //         // CLOSING 2	La conexión está siendo cerrada.
    //         setTimeout(() => {
    //             this.trySend(reqItem);
    //         }, 50);
    // }
  }
  genReqid(cb) {
    var id =
      this.randomString(10) +
      (Date.now() + performance.now()).toString().replace(".", "");
    while (this.reqidMap[id] != null) {
      id = Date.now().toString();
    }
    this.reqidMap[id] = cb;
    return id;
  }
  randomString(length) {
    var characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    length = length || 10;
    var str = "";
    for (var i = 0; i < length; i++) {
      str += characters.charAt(this.randomNumber(0, characters.length - 1));
    }
    return str;
  }
  randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
