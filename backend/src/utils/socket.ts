import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "./jwt";
import prisma from "./prisma";
import { Role } from "../types/auth";

export const setupSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: true, // Allow all origins for debugging
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return next(new Error("User not found"));

      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.name} (${user.id})`);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${user.name} joined room: ${roomId}`);
    });

    socket.on("send_message", async (data) => {
      const { content, roomId } = data;
      if (!roomId) return;
      
      // Check if user is muted
      const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (currentUser?.isMuted) {
        return socket.emit("error", { message: "You are muted and cannot send messages." });
      }

      try {
        const message = await prisma.chatMessage.create({
          data: {
            content,
            roomId,
            userId: user.id,
          },
          include: {
            user: { select: { name: true, role: true } },
          },
        });

        io.to(roomId).emit("receive_message", message);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("delete_message", (data) => {
      const { id, roomId } = data;
      if (!roomId) return;
      io.to(roomId).emit("message_deleted", id);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.name}`);
    });
  });

  return io;
};
