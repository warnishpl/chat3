import WebSocket, { WebSocketServer } from "ws";

class ChatServer {
  constructor(port) {
    this.wss = new WebSocketServer({ port });
    this.users = [];

    this.wss.on("connection", (ws) => this.handleMessage(ws));
    console.log(`WebSocket server is running on ws://localhost:${port}`);
  }

  handleJoin(payload) {
    let name = this.trimString(payload.name);
    console.log(name);

    if (!name) name = "Anonymous";
    if (name.length > 20) {
      name = name.substring(0, 20) + "…";
    }

    const cleanPayload = { ...payload, name };

    console.log("User joined:", cleanPayload);
    this.users.push(cleanPayload);

    this.broadcast({ type: "users", payload: this.users });
    this.broadcast({
      type: "system",
      payload: `${cleanPayload.name} has joined the chat.`,
    });
  }

  handleDisconnection(payload) {
    console.log("User disconnected:", payload);
    this.users = this.users.filter((user) => user.id !== payload.id);
    this.broadcast({ type: "users", payload: this.users });
    this.broadcast({
      type: "system",
      payload: `${payload.name} has left the chat.`,
    });
  }

  handleMessage(ws) {
    ws.on("message", (data) => {
      const { type, payload } = JSON.parse(data);
      switch (type) {
        case "join":
          this.handleJoin(payload);
          break;
        case "disconnect":
          this.handleDisconnection(payload);
          break;
        case "mess":
          const cleanMessage = this.trimString(payload.message);
          const cleanName = this.trimString(payload.name);

          console.log(
            `Message from ${cleanName} (ID: ${payload.id}): ${cleanMessage}`
          );
          this.broadcast({
            type: "mess",
            payload: { ...payload, message: cleanMessage, name: cleanName },
          });
          break;
        default:
          break;
      }
    });
  }

  broadcast(message) {
    message = JSON.stringify(message);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  trimString(str) {
    const cleanStr = str.replace(/\s+/g, " ").trim();
    if (!cleanStr) return;
    return cleanStr;
  }
}

const chatServer = new ChatServer(8080);
