import { Router } from "express";
import { getUsers, createMember, deleteUser, muteUser, sendWarning } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate, authorize([Role.ADMIN]));

router.get("/users", getUsers);
router.post("/users", createMember);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/mute", muteUser);
router.post("/warnings", sendWarning);

export default router;
