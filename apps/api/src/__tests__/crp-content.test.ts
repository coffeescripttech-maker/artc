import { describe, it, expect } from "vitest";
import {
  CRP_ORG_SLUG,
  CRP_PROGRAM,
  CRP_CURRICULUM,
  CRP_SUBJECTS,
  CRP_MODULES,
  CRP_TOPICS,
  CRP_LESSONS,
  CRP_QUESTIONS,
  CRP_PRACTICE_ASSESSMENT,
  CRP_DIAGNOSTIC_ASSESSMENT,
  CRP_ASSESSMENTS,
  CRP_TOPIC_SUBJECT,
  validateCrpSeed,
  // BUCET regression: the existing package must stay intact.
  validateBucetSeed,
} from "@aratc/shared";

// CS#22 — the College Readiness Program demo content package must stay
// internally consistent. These tests pin the definition so future edits
// cannot silently break the seeder, the assessment engine, or the player.

describe("CRP demo content package", () => {
  it("passes its own structural validation", () => {
    expect(() => validateCrpSeed()).not.toThrow();
  });

  it("has a coherent hierarchy (subject → module → topic → lesson)", () => {
    const moduleKeys = new Set(CRP_MODULES.map((m) => m.key));
    const topicKeys = new Set(CRP_TOPICS.map((t) => t.key));
    expect(CRP_SUBJECTS.length).toBe(4);
    expect(CRP_MODULES.every((m) => new Set(CRP_SUBJECTS.map((s) => s.key)).has(m.subjectKey))).toBe(true);
    expect(CRP_TOPICS.every((t) => moduleKeys.has(t.moduleKey))).toBe(true);
    expect(CRP_LESSONS.length).toBe(topicKeys.size); // one lesson per topic
    expect(CRP_LESSONS.every((l) => topicKeys.has(l.topicKey))).toBe(true);
  });

  it("targets the 30–40 question demo budget with a realistic difficulty mix", () => {
    expect(CRP_QUESTIONS.length).toBeGreaterThanOrEqual(30);
    expect(CRP_QUESTIONS.length).toBeLessThanOrEqual(40);
    const easy = CRP_QUESTIONS.filter((q) => q.difficulty === "EASY").length;
    const medium = CRP_QUESTIONS.filter((q) => q.difficulty === "MEDIUM").length;
    const hard = CRP_QUESTIONS.filter((q) => q.difficulty === "HARD").length;
    expect(easy).toBeGreaterThan(0);
    expect(medium).toBeGreaterThan(easy);
    expect(hard).toBeGreaterThan(0);
    expect(hard).toBeLessThan(medium);
  });

  it("demonstrates multiple question types with valid answer references", () => {
    const types = new Set(CRP_QUESTIONS.map((q) => q.type));
    expect(types.has("MULTIPLE_CHOICE")).toBe(true);
    expect(types.has("TRUE_FALSE")).toBe(true);
    expect(types.has("MULTIPLE_SELECT")).toBe(true);
    expect(types.has("NUMERIC")).toBe(true);

    for (const q of CRP_QUESTIONS) {
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
    for (const q of CRP_QUESTIONS.filter((x) => x.type === "NUMERIC")) {
      expect(q.correctAnswer).toHaveProperty("value");
      expect(typeof (q.correctAnswer as { value: number }).value).toBe("number");
    }
    for (const q of CRP_QUESTIONS.filter((x) => x.type === "MULTIPLE_SELECT")) {
      const arr = q.correctAnswer as string[];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(1);
    }
  });

  it("wires every question to a real topic and subject", () => {
    const topicKeys = new Set(CRP_TOPICS.map((t) => t.key));
    const subjectKeys = new Set(CRP_SUBJECTS.map((s) => s.key));
    for (const q of CRP_QUESTIONS) {
      expect(topicKeys.has(q.topicKey)).toBe(true);
      expect(subjectKeys.has(CRP_TOPIC_SUBJECT[q.topicKey])).toBe(true);
    }
  });
});

describe("CRP assessments", () => {
  it("configures the practice assessment for learning reinforcement", () => {
    expect(CRP_PRACTICE_ASSESSMENT.type).toBe("PRACTICE");
    expect(CRP_PRACTICE_ASSESSMENT.randomizeQuestions).toBe(true);
    expect(CRP_PRACTICE_ASSESSMENT.randomizeChoices).toBe(true);
    expect(CRP_PRACTICE_ASSESSMENT.allowRetake).toBe(true);
    expect(CRP_PRACTICE_ASSESSMENT.showExplanations).toBe(true);
    expect(CRP_PRACTICE_ASSESSMENT.questionIds.length).toBe(CRP_PRACTICE_ASSESSMENT.questionCount);
  });

  it("configures the optional readiness diagnostic", () => {
    expect(CRP_DIAGNOSTIC_ASSESSMENT.type).toBe("DIAGNOSTIC");
    expect(CRP_DIAGNOSTIC_ASSESSMENT.randomizeQuestions).toBe(true);
    expect(CRP_DIAGNOSTIC_ASSESSMENT.questionIds.length).toBe(CRP_DIAGNOSTIC_ASSESSMENT.questionCount);
  });

  it("references only real questions from the CRP bank", () => {
    const known = new Set(CRP_QUESTIONS.map((q) => q.id));
    for (const asm of CRP_ASSESSMENTS) {
      for (const id of asm.questionIds) {
        expect(known.has(id)).toBe(true);
      }
    }
  });
});

describe("CRP demo labeling", () => {
  it("keeps demo labeling honest (no fabricated official-curriculum claims)", () => {
    const text = `${CRP_PROGRAM.description} ${CRP_PRACTICE_ASSESSMENT.description} ${CRP_DIAGNOSTIC_ASSESSMENT.description}`.toLowerCase();
    expect(text).toContain("demo");
    expect(CRP_PROGRAM.slug).toBe("college-readiness-program");
    expect(CRP_ORG_SLUG).toBe("arc-review-center");
    expect(CRP_CURRICULUM.slug).toBe("college-readiness-curriculum");
    expect(CRP_PROGRAM.programType).toBe("COLLEGE");
  });
});

describe("CS#20 BUCET regression", () => {
  it("still passes its own structural validation", () => {
    expect(() => validateBucetSeed()).not.toThrow();
  });
});
