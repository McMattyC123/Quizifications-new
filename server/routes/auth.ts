import { Router, Request, Response } from "express";
import { db } from "../db";
import { users, userSettings, notes, noteQuestions, quizAttempts } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { signToken, hashPassword, comparePassword, authMiddleware, AuthRequest } from "../auth";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: "Email, password, and displayName are required" });
      return;
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const password_hash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      email,
      password_hash,
      display_name: displayName,
      auth_provider: "email",
    }).returning();

    await db.insert(userSettings).values({ user_id: user.id });

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.delete("/account", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await db.delete(quizAttempts).where(eq(quizAttempts.user_id, userId));

    const userNotes = await db.select({ id: notes.id }).from(notes).where(eq(notes.user_id, userId));
    for (const note of userNotes) {
      await db.delete(noteQuestions).where(eq(noteQuestions.note_id, note.id));
    }

    await db.delete(notes).where(eq(notes.user_id, userId));
    await db.delete(userSettings).where(eq(userSettings.user_id, userId));
    await db.delete(users).where(eq(users.id, userId));

    res.json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
