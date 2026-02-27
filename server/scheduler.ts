import { db } from "./db";
import { users, notes, noteQuestions, userSettings } from "../shared/schema";
import { eq, and, sql, isNull, lte } from "drizzle-orm";

function isInQuietHours(quietStart: string | null, quietEnd: string | null): boolean {
  if (!quietStart || !quietEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

async function sendExpoPushNotification(pushToken: string, question: any): Promise<boolean> {
  try {
    const body = `${question.question}\n\nA) ${question.option_a}\nB) ${question.option_b}\nC) ${question.option_c}\nD) ${question.option_d}`;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title: "Quizifications",
        body,
        data: { questionId: question.id, correct_answer: question.correct_answer },
        categoryId: "quiz",
        sound: "default",
      }),
    });

    if (!response.ok) {
      console.error(`Expo Push API error: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

async function processNotifications(): Promise<void> {
  try {
    const eligibleUsers = await db
      .select({
        userId: users.id,
        pushToken: users.push_token,
        settingsId: userSettings.id,
        notificationsEnabled: userSettings.notifications_enabled,
        quizIntervalMinutes: userSettings.quiz_interval_minutes,
        quietHoursStart: userSettings.quiet_hours_start,
        quietHoursEnd: userSettings.quiet_hours_end,
        lastNotificationAt: userSettings.last_notification_at,
        lastNotificationAnswered: userSettings.last_notification_answered,
        consecutiveIgnores: userSettings.consecutive_ignores,
        snoozedUntil: userSettings.snoozed_until,
      })
      .from(users)
      .innerJoin(userSettings, eq(users.id, userSettings.user_id))
      .where(
        and(
          eq(userSettings.notifications_enabled, true),
          sql`${users.push_token} IS NOT NULL`,
          sql`${users.push_token} != ''`
        )
      );

    console.log(`[Scheduler] Found ${eligibleUsers.length} users with notifications enabled and push tokens`);

    for (const user of eligibleUsers) {
      try {
        if (user.snoozedUntil && new Date(user.snoozedUntil) > new Date()) {
          console.log(`[Scheduler] User ${user.userId} is snoozed until ${user.snoozedUntil}`);
          continue;
        }

        if (isInQuietHours(user.quietHoursStart, user.quietHoursEnd)) {
          console.log(`[Scheduler] User ${user.userId} is in quiet hours`);
          continue;
        }

        const intervalMinutes = user.quizIntervalMinutes ?? 10;
        if (user.lastNotificationAt) {
          const elapsed = (Date.now() - new Date(user.lastNotificationAt).getTime()) / 1000 / 60;
          if (elapsed < intervalMinutes) {
            continue;
          }
        }

        if (user.lastNotificationAt && user.lastNotificationAnswered === false) {
          const newIgnores = (user.consecutiveIgnores ?? 0) + 1;

          if (newIgnores >= 3) {
            console.log(`[Scheduler] User ${user.userId} has ${newIgnores} consecutive ignores, snoozing for 1 hour`);
            await db
              .update(userSettings)
              .set({
                consecutive_ignores: 0,
                snoozed_until: new Date(Date.now() + 60 * 60 * 1000),
              })
              .where(eq(userSettings.user_id, user.userId));
            continue;
          }

          await db
            .update(userSettings)
            .set({ consecutive_ignores: newIgnores })
            .where(eq(userSettings.user_id, user.userId));

          console.log(`[Scheduler] User ${user.userId} ignored last notification (${newIgnores} consecutive)`);
        }

        const userNoteIds = await db.select({ id: notes.id }).from(notes).where(eq(notes.user_id, user.userId));

        if (userNoteIds.length === 0) {
          continue;
        }

        const noteIds = userNoteIds.map((n) => n.id);

        const questions = await db
          .select()
          .from(noteQuestions)
          .where(sql`${noteQuestions.note_id} IN ${noteIds}`)
          .orderBy(
            sql`${noteQuestions.times_shown} ASC`,
            sql`CASE WHEN ${noteQuestions.times_shown} = 0 THEN 0 ELSE CAST(${noteQuestions.times_correct} AS FLOAT) / ${noteQuestions.times_shown} END ASC`,
            sql`RANDOM()`
          )
          .limit(1);

        if (questions.length === 0) {
          continue;
        }

        const question = questions[0];

        const sent = await sendExpoPushNotification(user.pushToken!, question);

        if (sent) {
          await db
            .update(userSettings)
            .set({
              last_notification_at: new Date(),
              last_notification_question_id: question.id,
              last_notification_answered: false,
            })
            .where(eq(userSettings.user_id, user.userId));

          console.log(`[Scheduler] Sent notification to user ${user.userId}, question ${question.id}`);
        }
      } catch (userError) {
        console.error(`[Scheduler] Error processing user ${user.userId}:`, userError);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in processNotifications:", error);
  }
}

export function startScheduler(): void {
  console.log("[Scheduler] Starting notification scheduler (60s interval)");
  setInterval(processNotifications, 60 * 1000);
  processNotifications();
}
