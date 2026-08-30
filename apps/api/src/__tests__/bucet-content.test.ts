import { describe, it, expect } from "vitest";
import {
  BUCET_ORG_SLUG,
  BUCET_PROGRAM,
  BUCET_CURRICULUM,
  BUCET_SUBJECTS,
  BUCET_MODULES,
  BUCET_TOPICS,
  BUCET_LESSONS,
  BUCET_QUESTIONS,
  BUCET_ASSESSMENT,
  BUCET_TOPIC_SUBJECT,
  validateBucetSeed,
} from "@aratc/shared";

// CS#20 — the BUCET demo content package must stay internally consistent.
// These tests pin the definition so future edits cannot silently break the
// seeder, the assessment engine, or the player.

describe("BUCET demo content package", () => {
  it("passes its own structural validation", () => {
    expect(() => validateBucetSeed()).not.toThrow();
  });

  it("has a coherent hierarchy (subject → module → topic → lesson)", () => {
    const moduleKeys = new Set(BUCET_MODULES.map((m) => m.key));
    const topicKeys = new Set(BUCET_TOPICS.map((t) => t.key));
    expect(BUCET_SUBJECTS.length).toBe(4);
    expect(BUCET_MODULES.every((m) => new Set(BUCET_SUBJECTS.map((s) => s.key)).has(m.subjectKey))).toBe(true);
    expect(BUCET_TOPICS.every((t) => moduleKeys.has(t.moduleKey))).toBe(true);
    expect(BUCET_LESSONS.length).toBe(topicKeys.size); // one lesson per topic
    expect(BUCET_LESSONS.every((l) => topicKeys.has(l.topicKey))).toBe(true);
  });

  it("targets the 40–60 question demo budget with a realistic difficulty mix", () => {
    expect(BUCET_QUESTIONS.length).toBeGreaterThanOrEqual(40);
    expect(BUCET_QUESTIONS.length).toBeLessThanOrEqual(60);
    const easy = BUCET_QUESTIONS.filter((q) => q.difficulty === "EASY").length;
    const medium = BUCET_QUESTIONS.filter((q) => q.difficulty === "MEDIUM").length;
    const hard = BUCET_QUESTIONS.filter((q) => q.difficulty === "HARD").length;
    expect(easy).toBeGreaterThan(0);
    expect(medium).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(0);
    expect(hard).toBeLessThan(medium);
  });

  it("demonstrates multiple question types with valid answer references", () => {
    const types = new Set(BUCET_QUESTIONS.map((q) => q.type));
    expect(types.has("MULTIPLE_CHOICE")).toBe(true);
    expect(types.has("TRUE_FALSE")).toBe(true);
    expect(types.has("MULTIPLE_SELECT")).toBe(true);
    expect(types.has("NUMERIC")).toBe(true);

    for (const q of BUCET_QUESTIONS) {
      expect(q.stem.length).toBeGreaterThan(5);
      expect(q.explanation).toBeTruthy();
      if (q.options) {
        const ids = q.options.map((o) => o.id);
        expect(new Set(ids).size).toBe(ids.length);
        const correct = q.options.filter((o) => o.isCorrect);
        expect(correct.length).toBeGreaterThan(0);
        if (Array.isArray(q.correctAnswer)) {
          for (const id of q.correctAnswer) expect(ids).toContain(id);
        }
      }
    }
  });

  it("uses engine-compatible answer formats (numeric value/tolerance, select id arrays)", () => {
    for (const q of BUCET_QUESTIONS.filter((x) => x.type === "NUMERIC")) {
      expect(q.correctAnswer).toHaveProperty("value");
      expect(typeof (q.correctAnswer as { value: number }).value).toBe("number");
    }
    for (const q of BUCET_QUESTIONS.filter((x) => x.type === "MULTIPLE_SELECT")) {
      const arr = q.correctAnswer as string[];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(1);
    }
  });

  it("links passage-based questions to a defined passage on the reading topic", () => {
    const passageQuestions = BUCET_QUESTIONS.filter((q) => q.passageId);
    expect(passageQuestions.length).toBeGreaterThan(0);
    for (const q of passageQuestions) {
      expect(BUCET_TOPIC_SUBJECT[q.topicKey]).toBe("english");
    }
  });

  it("configures the demo mock exam for CS#19 randomization", () => {
    expect(BUCET_ASSESSMENT.type).toBe("MOCK_EXAM");
    expect(BUCET_ASSESSMENT.randomizeQuestions).toBe(true);
    expect(BUCET_ASSESSMENT.randomizeChoices).toBe(true);
    expect(BUCET_ASSESSMENT.timeLimitMinutes).toBeGreaterThan(0);
    expect(BUCET_ASSESSMENT.passingScore).toBeGreaterThan(0);
    expect(BUCET_ASSESSMENT.passingScore).toBeLessThan(100);
    expect(BUCET_ASSESSMENT.slug).not.toContain("official");
  });

  it("keeps demo labeling honest (no fabricated official-spec claims)", () => {
    const text = `${BUCET_PROGRAM.description} ${BUCET_ASSESSMENT.description}`.toLowerCase();
    expect(text).toContain("demo");
    expect(BUCET_PROGRAM.slug).toBe("bucet-reviewer");
    expect(BUCET_ORG_SLUG).toBe("arc-review-center");
    expect(BUCET_CURRICULUM.slug).toBe("bucet-reviewer-curriculum");
  });
});
