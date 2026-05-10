import { Router } from "express";
import { searchUsers, getProfile, updateMyProfile } from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get("/search", searchUsers as any);
router.get("/:id", getProfile as any);
router.patch("/me", updateMyProfile as any);

export default router;
