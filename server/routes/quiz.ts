import { Router, Response } from "express";
import { db } from "../db";
import { notes, noteQuestions, quizAttempts, userSettings } from "../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../auth";

const router = Router();

router.use(authMiddleware);

router.get("/next", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userNoteIds = await db.select({ id: notes.id }).from(notes).where(eq(notes.user_id, userId));

    if (userNoteIds.length === 0) {
      res.status(404).json({ error: "No notes found. Add some notes first!" });
      return;
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
      res.status(404).json({ error: "No questions available. Generate questions from your notes!" });
      return;
    }

    res.json(questions[0]);
  } catch (error) {
    console.error("Get next question error:", error);
    res.status(500).json({ error: "Failed to get next question" });
  }
});

router.post("/attempt", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !selectedAnswer) {
      res.status(400).json({ error: "questionId and selectedAnswer are required" });
      return;
    }

    const [question] = await db.select().from(noteQuestions).where(eq(noteQuestions.id, questionId)).limit(1);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    const [attempt] = await db.insert(quizAttempts).values({
      user_id: userId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    }).returning();

    await db
      .update(noteQuestions)
      .set({
        times_shown: sql`${noteQuestions.times_shown} + 1`,
        ...(isCorrect ? { times_correct: sql`${noteQuestions.times_correct} + 1` } : {}),
      })
      .where(eq(noteQuestions.id, questionId));

    res.json({
      attempt,
      isCorrect,
      correctAnswer: question.correct_answer,
    });
  } catch (error) {
    console.error("Quiz attempt error:", error);
    res.status(500).json({ error: "Failed to record attempt" });
  }
});

router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const allAttempts = await db.select().from(quizAttempts).where(eq(quizAttempts.user_id, userId)).orderBy(desc(quizAttempts.answered_at));
    const totalAttempts = allAttempts.length;
    const correctCount = allAttempts.filter((a) => a.is_correct).length;

    let streak = 0;
    for (const attempt of allAttempts) {
      if (attempt.is_correct) {
        streak++;
      } else {
        break;
      }
    }

    const userNotes = await db.select({ id: notes.id }).from(notes).where(eq(notes.user_id, userId));
    const notesCount = userNotes.length;

    res.json({
      totalAttempts,
      correctCount,
      accuracy: totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0,
      streak,
      notesCount,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.post("/notification-answer", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !selectedAnswer) {
      res.status(400).json({ error: "questionId and selectedAnswer are required" });
      return;
    }

    const [question] = await db
      .select({
        id: noteQuestions.id,
        question: noteQuestions.question,
        correct_answer: noteQuestions.correct_answer,
        times_shown: noteQuestions.times_shown,
        times_correct: noteQuestions.times_correct,
        note_id: noteQuestions.note_id,
      })
      .from(noteQuestions)
      .innerJoin(notes, eq(noteQuestions.note_id, notes.id))
      .where(and(eq(noteQuestions.id, questionId), eq(notes.user_id, userId)))
      .limit(1);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    await db.insert(quizAttempts).values({
      user_id: userId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });

    await db
      .update(noteQuestions)
      .set({
        times_shown: sql`${noteQuestions.times_shown} + 1`,
        ...(isCorrect ? { times_correct: sql`${noteQuestions.times_correct} + 1` } : {}),
      })
      .where(eq(noteQuestions.id, questionId));

    await db
      .update(userSettings)
      .set({
        last_notification_answered: true,
        consecutive_ignores: 0,
      })
      .where(eq(userSettings.user_id, userId));

    res.json({
      isCorrect,
      correctAnswer: question.correct_answer,
    });
  } catch (error) {
    console.error("Notification answer error:", error);
    res.status(500).json({ error: "Failed to record notification answer" });
  }
});

export default router;
