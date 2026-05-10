import { Router } from "express";
import { getFeed, createPost, deletePost } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get("/feed", getFeed as any);
router.post("/", createPost as any);
router.delete("/:id", deletePost as any);

export default router;
