import express from "express"; // Importa express
import http from "http"; // Importa http
import cors from "cors"; // Importa cors
import path from "path"; // Importa path
import { fileURLToPath } from "url"; // Importa fileURLToPath
import { Server as socketIo } from "socket.io"; // Importa socket.io

// Configuración del servidor express
const app = express();

// Habilita CORS
app.use(cors());

// Configuración del servidor HTTP
const server = http.createServer(app);

// Configuración del servidor de Socket.io
const io = new socketIo(server, {
  cors: {
    origin: "*", // Acepta todos los orígenes
    methods: ["GET", "POST"]
  }
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sirve archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Ruta básica para la página principal
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const users = {};      // { socketId: { username, status } }
const chatHistory = []; // Historial de mensajes
const MAX_HISTORY = 100;

// Escucha la conexión de clientes
io.on("connection", (socket) => {
  console.log("Nuevo usuario conectado");

  // Envía el historial de chat al nuevo usuario
  socket.emit("chatHistory", chatHistory);

  // Maneja el evento 'join' para añadir un nuevo usuario con el estado enviado
  socket.on("join", (data) => {
    // data: { username, status }
    users[socket.id] = { username: data.username, status: data.status || "online" };
    io.emit("userList", Object.values(users));
    io.emit("userJoined", data.username);
  });

  // Permite actualizar el estado del usuario
  socket.on("updateStatus", (newStatus) => {
    if (users[socket.id]) {
      users[socket.id].status = newStatus;
      io.emit("userList", Object.values(users));
    }
  });

  // Maneja la desconexión y actualiza la lista de usuarios
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const username = user.username;
      delete users[socket.id];
      io.emit("userList", Object.values(users));
      io.emit("userLeft", username);
    }
    console.log("Usuario desconectado");
  });

  // Escucha los mensajes, les asigna timestamp y los difunde
  socket.on("message", (msg) => {
    const timestamp = new Date().toISOString();
    const user = users[socket.id] ? users[socket.id].username : "Anon";
    const chatMsg = { username: user, message: msg, timestamp };
    chatHistory.push(chatMsg);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
    io.emit("chatMessage", chatMsg);
  });
});

// Inicia el servidor
server.listen(PORT, () => {
  console.log("Servidor iniciado en http://localhost:" + PORT);
});
