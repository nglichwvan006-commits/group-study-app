import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./utils/passport";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import assignmentRoutes from "./routes/assignment.routes";
import chatRoutes from "./routes/chat.routes";
import resourceRoutes from "./routes/resource.routes";
import rankingRoutes from "./routes/ranking.routes";
import profileRoutes from "./routes/profile.routes";
import postRoutes from "./routes/post.routes";
import supportRoutes from "./routes/support.routes";
import petRoutes from "./routes/pet.routes";
import quizRoutes from "./routes/quiz.routes";
import mailboxRoutes from "./routes/mailbox.routes";

const app = express();

// Rate limiting setup
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

console.log("CORS Allowed Origin:", process.env.FRONTEND_URL || "Not Set (Defaulting to localhost)");

app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/mailbox", mailboxRoutes);

app.get("/", (req, res) => {
  res.send("Group Study API is running");
});

export default app;
