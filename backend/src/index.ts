import http from "http";
import app from "./app";
import { setupSocket } from "./utils/socket";
import { startJudgeWorker } from "./services/queue.service";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

// Start BullMQ Worker
startJudgeWorker();

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
