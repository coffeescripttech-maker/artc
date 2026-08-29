import "dotenv/config";
import { buildApp } from "./app";

const app = buildApp();
const PORT = process.env.API_PORT || 4000;

app.listen(PORT, () => {
  console.log(`ARATC API running on http://localhost:${PORT}`);
});
