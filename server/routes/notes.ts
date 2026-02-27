import { Router, Response } from "express";
import { db } from "../db";
import { notes, noteQuestions } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userNotes = await db.select().from(notes).where(eq(notes.user_id, userId));
    res.json(userNotes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    const [note] = await db.insert(notes).values({
      user_id: userId,
      title,
      content,
    }).returning();

    res.json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const noteId = parseInt(req.params.id as string);

    const [note] = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).limit(1);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    await db.delete(noteQuestions).where(eq(noteQuestions.note_id, noteId));
    await db.delete(notes).where(eq(notes.id, noteId));

    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

router.get("/:id/questions", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const noteId = parseInt(req.params.id as string);

    const [note] = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).limit(1);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const questions = await db.select().from(noteQuestions).where(eq(noteQuestions.note_id, noteId));
    res.json(questions);
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ error: "Failed to get questions" });
  }
});

router.post("/:id/generate-questions", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const noteId = parseInt(req.params.id as string);

    const [note] = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).limit(1);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      res.status(500).json({ error: "Claude API key not configured. Set CLAUDE_API_KEY environment variable." });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are creating quiz questions for a passive knowledge retention app. The user has notes on a specific topic. Your job is to generate comprehensive multiple choice questions that test broad knowledge about this topic — not just what's written in the notes, but what someone studying this subject should know.

Think of yourself as a teacher who has searched the web for the best practice exam questions on this topic. Generate questions that cover:
- Key facts and definitions related to the topic
- Common exam questions about this subject
- Important concepts a student should know
- Practical applications and real-world connections

Generate 10 multiple choice quiz questions based on the topic of these notes.
Each question should have exactly 4 answer choices (A, B, C, D) with only one correct answer.
Return ONLY a valid JSON array with no markdown:
[{"question": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_answer": "A"}]

The correct_answer should be the letter (A, B, C, or D).

USER'S NOTES:
${note.content}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    const inserted: any[] = [];
    for (const q of questions) {
      const [question] = await db.insert(noteQuestions).values({
        note_id: noteId,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
      }).returning();
      inserted.push(question);
    }

    res.json(inserted);
  } catch (error) {
    console.error("Generate questions error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

router.post("/ocr", async (req: AuthRequest, res: Response) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      res.status(400).json({ error: "base64Image is required" });
      return;
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      res.status(500).json({ error: "Claude API key not configured. Set CLAUDE_API_KEY environment variable." });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64Image },
              },
              {
                type: "text",
                text: "Extract all the text from this image of notes. Return only the extracted text.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || null;

    res.json({ text });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: "Failed to extract text from image" });
  }
});

export default router;
