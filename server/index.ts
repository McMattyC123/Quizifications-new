import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";
import quizRoutes from "./routes/quiz";
import settingsRoutes from "./routes/settings";
import { startScheduler } from "./scheduler";

const app = express();

const PORT = process.env.PORT || 5000;


app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Quizifications server running on http://0.0.0.0:${PORT}`);
  startScheduler();
});
