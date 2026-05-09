import http from "http";
import app from "./app";
import { setupSocket } from "./utils/socket";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
