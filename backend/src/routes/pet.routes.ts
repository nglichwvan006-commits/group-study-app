import { Router } from "express";
import { getMyPet, selectPet, useSkill, revivePet, getTargetList } from "../controllers/pet.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authenticate as any, getMyPet as any);
router.post("/select", authenticate as any, selectPet as any);
router.post("/use-skill", authenticate as any, useSkill as any);
router.post("/revive", authenticate as any, revivePet as any);
router.get("/targets", authenticate as any, getTargetList as any);

export default router;
