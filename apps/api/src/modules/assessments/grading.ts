/**
 * Assessment grading — tolerant to how questions were stored.
 *
 * Options/correctAnswer may be stored as real JSON or as JSON strings
 * (legacy double-encoding), so everything is parsed defensively. Correctness is
 * primarily derived from `options[].isCorrect`, falling back to `correctAnswer`.
 */

export function parseJson<T = unknown>(value: unknown): T | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export function getOptions(question: { options?: unknown }): QuestionOption[] {
  const parsed = parseJson<unknown>(question.options);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((o) => {
    const obj = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
    return {
      id: String(obj.id ?? ""),
      text: String(obj.text ?? ""),
      isCorrect: Boolean(obj.isCorrect),
    };
  });
}

function correctIds(question: { options?: unknown; correctAnswer?: unknown }): string[] {
  const flagged = getOptions(question)
    .filter((o) => o.isCorrect)
    .map((o) => o.id);
  if (flagged.length > 0) return flagged;

  const ca = parseJson<unknown>(question.correctAnswer);
  if (Array.isArray(ca)) return ca.map((v) => String(v));
  if (typeof ca === "string" || typeof ca === "number" || typeof ca === "boolean") return [String(ca)];
  return [];
}

const norm = (v: unknown): string => String(v ?? "").trim().toLowerCase();

/**
 * Returns true/false when auto-gradable, or null when it needs manual grading
 * (e.g. essays).
 */
export function gradeAnswer(
  question: { type: string; options?: unknown; correctAnswer?: unknown },
  answer: unknown
): boolean | null {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      const correct = correctIds(question);
      if (correct.length === 0) return null;
      return correct.includes(String(answer ?? ""));
    }

    case "MULTIPLE_SELECT": {
      const correct = new Set(correctIds(question));
      const given = new Set((Array.isArray(answer) ? answer : []).map((v) => String(v)));
      if (correct.size === 0) return null;
      if (correct.size !== given.size) return false;
      for (const id of correct) if (!given.has(id)) return false;
      return true;
    }

    case "FILL_IN_THE_BLANK": {
      const ca = parseJson<unknown>(question.correctAnswer);
      const acceptable = Array.isArray(ca) ? ca.map(norm) : [norm(ca)];
      if (acceptable.every((a) => a === "")) return null;
      return acceptable.includes(norm(answer));
    }

    case "MATCHING": {
      const ca = parseJson<unknown>(question.correctAnswer);
      if (ca == null) return null;
      return JSON.stringify(ca) === JSON.stringify(answer);
    }

    case "ESSAY":
    default:
      return null; // manual grading / unsupported → not auto-scored
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
