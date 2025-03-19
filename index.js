// Confirhguración de servidor express
import express from "express"; // Importa express
import http from "http"; // Importa http
import cors from "cors"; // Importa cors
import { Server } from "socket.io"; // Importa socket.io
import path from "path"; // Importa path
import { fileURLToPath } from "url"; // Importa fileURLToPath

// Configuración de servidor express
const app = express();

// Habilita CORS
app.use(cors());

// Configuración de servidor http
const server = http.createServer(app);

// Configuración de servidor de socket
const io = new Server(server);

// Puerto de servidor
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sirve archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Ruta básica para la página principal	
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Escucha los eventos de conexión de los clientes
io.on("conection", (socket) => {
    console.log("Nuevo usuario conectado");

    // Maneja la coneción del cliente
    socket.on("disconnect", () => {
        console.log("Usuario desconectado");
    });
});

// Inicia el servidor en puerto exspecificado 
server.listen(PORT, () => {
    console.log("Servidor iniciado en http://localhost:" + PORT);
});

