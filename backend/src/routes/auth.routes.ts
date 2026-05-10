import { Router } from "express";
import passport from "passport";
import { loginMember, googleCallback, refreshToken, logout, getMe, registerMember } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Member Auth
router.post("/login", loginMember as any);
router.post("/register", registerMember as any);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=auth_failed", session: false }),
  googleCallback
);

// Token management
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", authenticate as any, getMe as any);

export default router;
