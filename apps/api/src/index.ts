import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/routes";
import { programRoutes } from "./modules/programs/routes";
import { subjectRoutes } from "./modules/subjects/routes";
import { curriculumRoutes } from "./modules/curriculum/routes";
import { moduleRoutes } from "./modules/modules/routes";
import { topicRoutes } from "./modules/topics/routes";
import { lessonRoutes } from "./modules/lessons/routes";
import { questionBankRoutes } from "./modules/question-bank/routes";
import { assessmentRoutes } from "./modules/assessments/routes";
import { cetRoutes } from "./modules/cet/routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();
const PORT = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/programs", programRoutes);
app.use("/programs", programRoutes); // Also accessible without /api prefix
app.use("/api/subjects", subjectRoutes);
app.use("/subjects", subjectRoutes); // Also accessible without /api prefix
app.use("/api/curriculums", curriculumRoutes);
app.use("/curriculums", curriculumRoutes); // Also accessible without /api prefix
app.use("/api/modules", moduleRoutes);
app.use("/modules", moduleRoutes); // Also accessible without /api prefix
app.use("/api/topics", topicRoutes);
app.use("/topics", topicRoutes); // Also accessible without /api prefix
app.use("/api/lessons", lessonRoutes);
app.use("/lessons", lessonRoutes); // Also accessible without /api prefix
app.use("/api/questions", questionBankRoutes);
app.use("/questions", questionBankRoutes); // Also accessible without /api prefix
app.use("/api/assessments", assessmentRoutes);
app.use("/assessments", assessmentRoutes); // Also accessible without /api prefix
app.use("/api/cet", cetRoutes);
app.use("/cet", cetRoutes); // Also accessible without /api prefix

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ARATC API running on http://localhost:${PORT}`);
});
