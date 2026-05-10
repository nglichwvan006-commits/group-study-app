import { Router } from "express";
import { getResources, createResource, deleteResource } from "../controllers/resource.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get("/", getResources as any);
router.post("/", createResource as any);
router.delete("/:id", deleteResource as any);

export default router;
