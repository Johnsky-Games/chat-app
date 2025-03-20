document.addEventListener("DOMContentLoaded", function () {
  const usernameForm = document.getElementById("username-form");
  const usernameInput = document.getElementById("username-input");
  const socket = io.connect("http://localhost:3000");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const errorMessage = document.getElementById("error-message");
  const messages = document.getElementById("messages");
  const usersList = document.getElementById("users");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  const statusSelect = document.getElementById("status-select");
  const toggleBtn = document.getElementById("toggle-connection-btn");

  // Recupera datos guardados en localStorage
  let username = localStorage.getItem("username") || "";
  let myStatus = localStorage.getItem("myStatus") || "online";

  // Actualiza el selector y el indicador según el estado guardado
  statusSelect.value = myStatus;
  updateMyConnectionIndicator(myStatus);

  // Si ya hay username guardado, autoenvía el join con el estado actual y oculta el formulario
  if (username) {
    socket.emit("join", { username, status: myStatus });
    usernameForm.style.display = "none";
    toggleBtn.textContent = "Desconectar";
  } else {
    toggleBtn.textContent = "Conectar";
  }

  // Función para actualizar el indicador de estado del usuario
  function updateMyConnectionIndicator(status) {
    if (status === "online") {
      connectionStatus.style.backgroundColor = "var(--status-online)";
      statusText.textContent = "Online";
    } else if (status === "busy") {
      connectionStatus.style.backgroundColor = "var(--status-busy)";
      statusText.textContent = "Busy";
    } else if (status === "offline") {
      connectionStatus.style.backgroundColor = "var(--status-offline)";
      statusText.textContent = "Offline";
    }
  }

  // Al cambiar el select se actualiza el estado personal y se guarda
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      myStatus = newStatus;
      localStorage.setItem("myStatus", newStatus);
      updateMyConnectionIndicator(newStatus);
      socket.emit("updateStatus", newStatus);
    });
  }

  // Botón toggle de conexión/desconexión
  toggleBtn.addEventListener("click", () => {
    if (socket.connected) {
      // Desconecta: elimina username, vacía el chat y actualiza interfaz
      localStorage.removeItem("username");
      socket.disconnect();
      usernameForm.style.display = "block";
      messages.innerHTML = "";
      username = "";
      toggleBtn.textContent = "Conectar";
      updateMyConnectionIndicator("offline");
    } else {
      // Si no está conectado, muestra el formulario para ingresar nombre
      usernameForm.style.display = "block";
      toggleBtn.textContent = "Conectar";
    }
  });

  // Envío del formulario de ingreso
  usernameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim();
    if (username) {
      localStorage.setItem("username", username);
      // Reconecta si estaba desconectado
      socket.connect();
      socket.emit("join", { username, status: myStatus });
      usernameForm.style.opacity = "0";
      setTimeout(() => {
        usernameForm.style.display = "none";
      }, 300);
      toggleBtn.textContent = "Desconectar";
    }
  });

  // Función para agregar un mensaje al chat (con timestamp y alineación)
  function appendChatMessage(chatMsg) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    // Alinea a la derecha si es del usuario actual
    if (chatMsg.username === username) {
      messageElement.classList.add("message-sent");
    } else {
      messageElement.classList.add("message-received");
    }
    const messageContent = document.createElement("span");
    messageContent.textContent = `${chatMsg.username}: ${chatMsg.message}`;
    const timeSpan = document.createElement("span");
    timeSpan.classList.add("timestamp");
    const date = new Date(chatMsg.timestamp);
    timeSpan.textContent = date.toLocaleTimeString();
    messageElement.appendChild(messageContent);
    messageElement.appendChild(timeSpan);
    messages.appendChild(messageElement);
  }

  // Función para mostrar mensajes de sistema
  function appendSystemMessage(text) {
    const messageElement = document.createElement("div");
    messageElement.textContent = text;
    messageElement.classList.add("system-message");
    messages.appendChild(messageElement);
  }

  // Actualiza la lista de usuarios conectados
  socket.on("userList", (users) => {
    usersList.innerHTML = "";
    users.forEach((user) => {
      const userElement = document.createElement("li");
      const statusIndicator = document.createElement("span");
      statusIndicator.classList.add("status");
      if (user.status === "online") {
        statusIndicator.style.backgroundColor = "var(--status-online)";
      } else if (user.status === "busy") {
        statusIndicator.style.backgroundColor = "var(--status-busy)";
      } else {
        statusIndicator.style.backgroundColor = "var(--status-offline)";
      }
      const usernameSpan = document.createElement("span");
      usernameSpan.classList.add("username");
      usernameSpan.textContent = user.username;
      userElement.appendChild(statusIndicator);
      userElement.appendChild(usernameSpan);
      usersList.appendChild(userElement);
    });
  });

  // Carga el historial de chat para nuevos usuarios
  socket.on("chatHistory", (history) => {
    history.forEach((chatMsg) => {
      appendChatMessage(chatMsg);
    });
  });

  // Notifica cuando un usuario se une
  socket.on("userJoined", (user) => {
    appendSystemMessage(`${user} se ha unido al chat.`);
  });

  // Notifica cuando un usuario abandona
  socket.on("userLeft", (user) => {
    appendSystemMessage(`${user} ha abandonado el chat.`);
  });

  // Envío del mensaje (Enter sin Shift)
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      messageForm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }
  });

  // Envía el mensaje, con validación
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message === "") {
      errorMessage.classList.add("show");
      setTimeout(() => {
        errorMessage.classList.remove("show");
      }, 3000);
      return;
    }
    errorMessage.classList.remove("show");
    socket.emit("message", message);
    messageInput.value = "";
  });

  // Comprueba si el scroll está al fondo
  function isScrolledToBottom() {
    return messages.scrollHeight - messages.scrollTop <= messages.clientHeight + 50;
  }

  // Recibe y muestra mensajes de chat
  socket.on("chatMessage", (chatMsg) => {
    const wasScrolledToBottom = isScrolledToBottom();
    appendChatMessage(chatMsg);
    if (wasScrolledToBottom) {
      messages.scrollTop = messages.scrollHeight;
    }
  });

  // Actualiza el indicador cuando se conecta
  socket.on("connect", () => {
    console.log("Conectado al servidor");
    updateMyConnectionIndicator(myStatus);
    toggleBtn.textContent = "Desconectar";
  });

  // Actualiza el indicador al desconectar
  socket.on("disconnect", () => {
    console.log("Desconectado del servidor");
    updateMyConnectionIndicator("offline");
    toggleBtn.textContent = "Conectar";
  });

  socket.on("connect_error", (error) =>
    console.log("Error de conexión: " + error)
  );
});
