import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import * as cookie from 'cookie'; // npm install cookie
import jwt from 'jsonwebtoken'; // If your ID is inside a JWT

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3002",
      credentials: true // MANDATORY to allow cookies
    }
  });

  io.on('connection', (socket) => {
    // 1. Grab cookies from the headers
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    

    const userId = cookies['userId']; 


    if (userId) {
      console.log(`👤 User ${userId} connected and joined private room.`);
      socket.join(userId); // Join room named after UserID
    }

    socket.on('disconnect', () => console.log('❌ Client disconnected'));
  });

  return io;
};