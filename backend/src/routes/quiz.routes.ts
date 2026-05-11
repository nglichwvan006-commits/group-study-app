import { Router } from "express";
import { getTodayQuiz, answerQuiz, getQuickQuiz, checkQuickAnswer } from "../controllers/quiz.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/today", authenticate as any, getTodayQuiz as any);
router.post("/answer", authenticate as any, answerQuiz as any);
router.get("/quick", authenticate as any, getQuickQuiz as any);
router.post("/quick/check", authenticate as any, checkQuickAnswer as any);

export default router;
