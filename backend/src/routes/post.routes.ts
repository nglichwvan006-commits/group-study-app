import { Router } from "express";
import { getFeed, createPost, deletePost, createComment, deleteComment, toggleLike } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get("/feed", getFeed as any);
router.post("/", createPost as any);
router.delete("/:id", deletePost as any);

// Likes
router.post("/:id/toggle-like", toggleLike as any);

// Comments
router.post("/comments", createComment as any);
router.delete("/comments/:id", deleteComment as any);

export default router;
