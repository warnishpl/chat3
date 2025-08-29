import { v4 as uuid } from "uuid";

class Client {
  constructor(serverUrl, selectors) {
    this.ws = new WebSocket(serverUrl);
    this.id = uuid();

    this.UIsetup(selectors);

    this.ws.onopen = () => {
      this.name = (prompt("Enter your name:") || "Anonymous").trim();
      if (!this.name) this.name = "Anonymous";
      this.sendMessage("join", { id: this.id, name: this.name });
    };

    this.ws.onmessage = (message) => {
      console.log("Received:", message.data);
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "users":
          console.log("Users:", data.payload);
          const users = data.payload;
          this.usersList.innerHTML = "";
          users.forEach((user) => {
            const userElement = document.createElement("div");
            userElement.textContent = user.name;
            this.usersList.appendChild(userElement);
          });
          this.usersCount.textContent = `Users online: ${users.length}`;
          break;
        case "system":
          this.appendMessage(data.payload, "system-message");
          break;
        case "mess":
          this.appendMessage(
            `${data.payload.name}: ${data.payload.message}`,
            data.payload.id === this.id ? "own-message" : "foreign-message",
            new Date().toLocaleTimeString()
          );
          break;
        default:
          break;
      }
    };

    this.ws.onclose = () => {
      this.sendMessage("disconnect", { id: this.id, name: this.name });
    };

    window.addEventListener("beforeunload", () => {
      this.sendMessage("disconnect", { id: this.id, name: this.name });
      this.ws.close();
    });
  }

  sendMessage(type, payload) {
    const data = JSON.stringify({ type, payload });
    this.ws.send(data);
  }

  appendMessage(message, type, time = null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add(type);

    const messageElement = document.createElement("div");
    messageElement.textContent = message;

    wrapper.appendChild(messageElement);

    if (time) {
      const timeElement = document.createElement("div");
      timeElement.textContent = time;
      timeElement.classList.add("message-time");
      wrapper.appendChild(timeElement);
    }

    this.messagesList.appendChild(wrapper);
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }

  UIsetup({
    messagesList,
    messageInput,
    sendMessageButton,
    usersList,
    usersCount,
  }) {
    this.messagesList = messagesList;
    this.messageInput = messageInput;
    this.sendMessageButton = sendMessageButton;
    this.usersList = usersList;
    this.usersCount = usersCount;

    this.sendMessageButton.addEventListener("click", () => {
      const message = this.messageInput.value.trim();
      if (message) {
        this.sendMessage("mess", { id: this.id, name: this.name, message });
        this.messageInput.value = "";
      }
    });

    this.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.sendMessageButton.click();
      }
    });
  }
}

const client = new Client("ws://localhost:8080", {
  messagesList: document.querySelector(".messages-list"),
  messageInput: document.querySelector(".new-message-input"),
  sendMessageButton: document.querySelector(".send-message-button"),
  usersList: document.querySelector(".user-list-content"),
  usersCount: document.querySelector(".users-count"),
});
