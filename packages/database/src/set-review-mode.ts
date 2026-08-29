/**
 * Sets the content-review policy for an organization (CS#6 — §15/§17).
 *
 * Usage: tsx src/set-review-mode.ts <org-slug> <direct|review>
 *   direct → teacher_auto_publish: true  (current default behavior)
 *   review → teacher_auto_publish: false (approval workflow required)
 */
import { prisma } from "./client";

async function main() {
  const slug = process.argv[2] ?? "sto-nino-academy";
  const mode = process.argv[3] ?? "review";
  const autoPublish = mode !== "review";

  const meta = { teacher_auto_publish: autoPublish };
  const org = await prisma.organization.update({
    where: { slug },
    data: {
      metadata: {
        ...((
          (await prisma.organization.findUnique({
            where: { slug },
            select: { metadata: true },
          }))?.metadata ?? {}
        ) as Record<string, unknown>),
        ...meta,
      },
    },
  });

  console.log(
    `Org "${org.name}" (${org.slug}) → ${
      autoPublish ? "DIRECT publish (auto)" : "REVIEW required (approval workflow)"
    }`,
  );
}

main()
  .catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());