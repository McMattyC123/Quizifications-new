import { Router, Response } from "express";
import { db } from "../db";
import { userSettings, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    let [settings] = await db.select().from(userSettings).where(eq(userSettings.user_id, userId)).limit(1);

    if (!settings) {
      [settings] = await db.insert(userSettings).values({ user_id: userId }).returning();
    }

    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notifications_enabled, quiz_frequency, quiet_hours_start, quiet_hours_end } = req.body;

    const updateData: Record<string, any> = {};
    if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
    if (quiz_frequency !== undefined) updateData.quiz_frequency = quiz_frequency;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updateData.quiet_hours_end = quiet_hours_end;

    let [settings] = await db.select().from(userSettings).where(eq(userSettings.user_id, userId)).limit(1);

    if (!settings) {
      [settings] = await db.insert(userSettings).values({ user_id: userId, ...updateData }).returning();
    } else {
      [settings] = await db.update(userSettings).set(updateData).where(eq(userSettings.user_id, userId)).returning();
    }

    res.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.put("/push-token", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { pushToken } = req.body;

    if (!pushToken) {
      res.status(400).json({ error: "pushToken is required" });
      return;
    }

    await db.update(users).set({ push_token: pushToken }).where(eq(users.id, userId));

    res.json({ success: true, message: "Push token updated" });
  } catch (error) {
    console.error("Update push token error:", error);
    res.status(500).json({ error: "Failed to update push token" });
  }
});

export default router;
