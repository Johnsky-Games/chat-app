document.addEventListener("DOMContentLoaded", function () {
    const socket = io.connect("http://localhost:3000");
  
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const errorMessage = document.getElementById("error-message");
    const messages = document.getElementById("messages");
  
    // Envía el formulario cuando se presiona Enter (sin Shift) en el textarea
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }
    });
  
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
  
    // Función para determinar si el usuario está cerca del final
    function isScrolledToBottom() {
      return (
        messages.scrollHeight - messages.scrollTop <= messages.clientHeight + 50
      );
    }
  
    socket.on("chatMessage", (msg) => {
      const wasScrolledToBottom = isScrolledToBottom();
      const messageElement = document.createElement("div");
      messageElement.textContent = msg;
      messageElement.classList.add("message");
      messages.appendChild(messageElement);
  
      // Auto-scroll si el usuario ya estaba cerca del fondo
      if (wasScrolledToBottom) {
        messages.scrollTop = messages.scrollHeight;
      }
    });
  
    socket.on("connect", () =>
      console.log("Conectado al servidor de socket")
    );
    socket.on("disconnect", () =>
      console.log("Desconectado del servidor de socket")
    );
    socket.on("connect_error", (error) =>
      console.log("Error de conexión: " + error)
    );
  });
  