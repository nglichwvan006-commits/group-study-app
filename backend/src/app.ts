import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./utils/passport";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import assignmentRoutes from "./routes/assignment.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Group Study API is running");
});

export default app;
