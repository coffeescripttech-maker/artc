import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRoutes } from "./modules/auth/routes";
import { programRoutes } from "./modules/programs/routes";
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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ARATC API running on http://localhost:${PORT}`);
});
