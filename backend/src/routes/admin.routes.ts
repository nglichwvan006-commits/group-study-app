import { Router } from "express";
import { getUsers, createMember, deleteUser, muteUser, sendWarning, overrideScore, sendNotification } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { Role } from "../types/auth";

const router = Router();

router.use(authenticate, authorize([Role.ADMIN]));

router.get("/users", getUsers);
router.post("/users", createMember);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/mute", muteUser);
router.post("/notifications", sendNotification);
router.post("/warnings", sendWarning);
router.patch("/submissions/:id/override", overrideScore);

export default router;
