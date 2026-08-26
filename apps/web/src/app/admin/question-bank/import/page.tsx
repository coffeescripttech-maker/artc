import { redirect } from "next/navigation";

/**
 * The PDF import workflow lives under the dashboard area
 * (shared by admins, content admins, and teachers).
 */
export default function ImportQuestionsPage() {
  redirect("/dashboard/questions/import");
}
