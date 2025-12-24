import { Server } from "socket.io";

let io = null;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join session room
    socket.on("join-session", ({ sessionId, role }) => {
      if (!sessionId) {
        socket.emit("error", { message: "Session ID is required" });
        return;
      }

      const room = `session:${sessionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room} as ${role}`);

      // Notify others in the room
      socket.to(room).emit("user-joined", { socketId: socket.id, role });
    });

    // Handle code updates (only from participants)
    socket.on("code:update", ({ sessionId, code, language, senderRole }) => {
      if (senderRole !== "participant") {
        socket.emit("error", { message: "Only participants can send code updates" });
        return;
      }

      if (!sessionId) {
        socket.emit("error", { message: "Session ID is required" });
        return;
      }

      const room = `session:${sessionId}`;
      // Broadcast to all others in the room (hosts)
      socket.to(room).emit("code:update", {
        code,
        language,
        sessionId,
        timestamp: Date.now(),
      });

      console.log(`Code update broadcasted in room ${room}, code length: ${code?.length || 0}`);
    });

    // Handle language updates (only from participants)
    socket.on("language:update", ({ sessionId, language, senderRole }) => {
      if (senderRole !== "participant") {
        socket.emit("error", { message: "Only participants can send language updates" });
        return;
      }

      if (!sessionId) {
        socket.emit("error", { message: "Session ID is required" });
        return;
      }

      const room = `session:${sessionId}`;
      // Broadcast to all others in the room (hosts)
      socket.to(room).emit("language:update", {
        language,
        sessionId,
        timestamp: Date.now(),
      });

      console.log(`Language update broadcasted in room ${room}: ${language}`);
    });

    // Handle typing indicator
    socket.on("code:typing", ({ sessionId, senderRole }) => {
      if (senderRole !== "participant") return;

      if (!sessionId) return;

      const room = `session:${sessionId}`;
      socket.to(room).emit("code:typing", { sessionId });
    });

    // Handle code run output (only from participants)
    socket.on("code:run", ({ sessionId, output, senderRole }) => {
      if (senderRole !== "participant") {
        socket.emit("error", { message: "Only participants can send code run output" });
        return;
      }

      if (!sessionId) {
        socket.emit("error", { message: "Session ID is required" });
        return;
      }

      const room = `session:${sessionId}`;
      // Broadcast output to all others in the room (hosts)
      socket.to(room).emit("code:run", {
        output,
        sessionId,
        timestamp: Date.now(),
      });

      console.log(`Code run output broadcasted in room ${room}`);
    });

    // Leave session room
    socket.on("leave-session", ({ sessionId }) => {
      if (sessionId) {
        const room = `session:${sessionId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

