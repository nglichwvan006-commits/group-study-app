import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma";
import { Role } from "../types/auth";

const ADMIN_EMAIL = "nglich.wvan006@gmail.com";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "google_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google_client_secret",
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email found"));

        if (email !== ADMIN_EMAIL) {
          return done(null, false, { message: "Unauthorized email" });
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              role: Role.ADMIN,
            },
          });
        } else if (user.role !== Role.ADMIN) {
          // In case a member with this email was created (unlikely given requirements, but safety first)
          user = await prisma.user.update({
            where: { email },
            data: { role: Role.ADMIN },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
