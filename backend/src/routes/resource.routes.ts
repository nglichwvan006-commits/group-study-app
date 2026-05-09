import { Router } from "express";
import { getResources, createResource, deleteResource } from "../controllers/resource.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getResources);
router.post("/", createResource);
router.delete("/:id", deleteResource);

export default router;
