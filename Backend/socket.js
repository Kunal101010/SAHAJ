const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173", // Allow frontend to connect
            methods: ["GET", "POST"],
            credentials: true
        },
        // Prefer WebSocket from the start — avoids the polling→upgrade round-trip delay
        transports: ['websocket', 'polling'],
        // Faster heartbeat: detect dead connections quickly so rooms stay clean
        pingInterval: 10000,  // check every 10s (default: 25s)
        pingTimeout: 5000,    // consider dead after 5s no pong (default: 20s)
        // Compress payloads only when they're large enough to benefit
        perMessageDeflate: {
            threshold: 512  // only compress messages larger than 512 bytes
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected: " + socket.id);

        socket.on('join', (userId) => {
            if (userId) {
                socket.join(userId.toString());
                console.log(`Socket ${socket.id} joined room ${userId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected: " + socket.id);
        });
    });

    return io;
};

const getSocketIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getSocketIO };
