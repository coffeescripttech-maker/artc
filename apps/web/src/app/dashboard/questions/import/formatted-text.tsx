"use client";

import { useMemo } from "react";
import { cn } from "@aratc/ui";
import { FileText } from "lucide-react";

// ============================================================
// Lightweight questionnaire parser — best-effort beautification of raw
// extracted PDF text. Falls back gracefully: anything it can't classify
// renders as a plain paragraph, so nothing is ever lost or hidden.
// ============================================================

interface ParsedChoice {
  label: string;
  text: string;
}

type ParsedBlock =
  | { kind: "heading"; text: string }
  | { kind: "question"; number: string; text: string }
  | { kind: "choices"; items: ParsedChoice[] }
  | { kind: "answer"; text: string }
  | { kind: "paragraph"; text: string };

// Matches: "1.", "1)", "12 ." — question starts
const QUESTION_RE = /^(\d{1,3})[.)]\s+(.*)$/;
// Matches: "A.", "a)", "B -", "A :" — choice starts (single letter)
const CHOICE_RE = /^([A-Za-z])[.)\s-]\s*(.*)$/;
// Matches: "Answer: A", "ANSWER: B", "Ans. A"
const ANSWER_RE = /^(answer|ans|key)\s*[.:\-]\s*(.+)$/i;
// All-caps short line — probably a section header like "MATH QUIZ" or "PART I"
const HEADING_RE = /^([A-Z0-9][A-Z0-9 ,.&'\-()]{3,60})$/;
// Roman numeral section like "I.", "II." at line start with title
const ROMAN_RE = /^(X{0,3}(IX|IV|V?I{0,3}))\.\s+(.+)$/;

function isBlank(s: string): boolean {
  return !s || s.trim().length === 0;
}

function parseQuestionnaire(rawText: string): ParsedBlock[] {
  const lines = rawText.split(/\r?\n/);
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isBlank(trimmed)) {
      i++;
      continue;
    }

    // Answer key line
    const answerMatch = trimmed.match(ANSWER_RE);
    if (answerMatch) {
      blocks.push({ kind: "answer", text: answerMatch[2] });
      i++;
      continue;
    }

    // Question start
    const qMatch = trimmed.match(QUESTION_RE);
    if (qMatch && !CHOICE_RE.test(trimmed)) {
      let text = qMatch[2];
      i++;

      // Continuation lines: append until we hit a blank line, a new
      // question, a choice, an answer line, or end
      while (i < lines.length) {
        const next = lines[i].trim();
        if (
          isBlank(next) ||
          QUESTION_RE.test(next) ||
          ANSWER_RE.test(next) ||
          HEADING_RE.test(next) ||
          ROMAN_RE.test(next)
        ) {
          break;
        }
        const nextChoice = next.match(CHOICE_RE);
        if (nextChoice && nextChoice[1].length === 1 && /[A-Da-d]/.test(nextChoice[1])) {
          break;
        }
        text += " " + next;
        i++;
      }

      blocks.push({ kind: "question", number: qMatch[1], text: text.trim() });
      continue;
    }

    // Choice start (A. text / A) text / a. text)
    const cMatch = trimmed.match(CHOICE_RE);
    if (cMatch && /[A-Za-z]/.test(cMatch[1]) && cMatch[1].length === 1) {
      const items: ParsedChoice[] = [];

      // Collect consecutive choice lines
      while (i < lines.length) {
        const cur = lines[i].trim();
        if (isBlank(cur)) {
          // Look ahead — choices sometimes have a blank between them
          let j = i + 1;
          while (j < lines.length && isBlank(lines[j].trim())) j++;
          const after = lines[j]?.trim() ?? "";
          const afterMatch = after.match(CHOICE_RE);
          if (afterMatch && afterMatch[1].length === 1 && /[A-Za-z]/.test(afterMatch[1])) {
            i = j;
            continue;
          }
          break;
        }

        const curMatch = cur.match(CHOICE_RE);
        if (curMatch && curMatch[1].length === 1 && /[A-Za-z]/.test(curMatch[1])) {
          let choiceText = curMatch[2];
          // Choice continuation (wrapped) lines
          let k = i + 1;
          while (k < lines.length) {
            const cont = lines[k].trim();
            if (
              isBlank(cont) ||
              QUESTION_RE.test(cont) ||
              CHOICE_RE.test(cont) ||
              ANSWER_RE.test(cont)
            ) {
              break;
            }
            choiceText += " " + cont;
            k++;
          }
          items.push({ label: curMatch[1].toUpperCase(), text: choiceText.trim() });
          i = k;
          continue;
        }
        break;
      }

      if (items.length >= 2) {
        blocks.push({ kind: "choices", items });
        continue;
      }
      // Single stray letter line — treat as paragraph, don't loop forever
      blocks.push({ kind: "paragraph", text: trimmed });
      i++;
      continue;
    }

    // Section heading (all caps or roman numeral)
    if (HEADING_RE.test(trimmed) || ROMAN_RE.test(trimmed)) {
      blocks.push({ kind: "heading", text: trimmed });
      i++;
      continue;
    }

    // Plain paragraph — merge wrapped lines until blank/question/choice
    let para = trimmed;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        isBlank(next) ||
        QUESTION_RE.test(next) ||
        ANSWER_RE.test(next) ||
        HEADING_RE.test(next) ||
        ROMAN_RE.test(next) ||
        (CHOICE_RE.test(next) && next.match(CHOICE_RE)![1].length === 1)
      ) {
        break;
      }
      para += " " + next;
      i++;
    }
    blocks.push({ kind: "paragraph", text: para });
  }

  return blocks;
}

/**
 * Renders raw extracted PDF text as a clean, questionnaire-style document.
 * Purely presentational — the raw text stays the source of truth and is
 * always one toggle away.
 */
export function FormattedQuestionnaire({ rawText }: { rawText: string }) {
  const blocks = useMemo(() => parseQuestionnaire(rawText), [rawText]);

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-10 w-10 text-arc-slate-300 mb-3" />
        <p className="text-sm text-arc-slate-400">Nothing to display yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-arc-slate-200 rounded-lg shadow-sm px-8 py-10">
      {/* Document header rule — like a real exam paper */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-arc-navy-900">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-arc-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-arc-slate-400">
            Extracted Document
          </span>
        </div>
        <span className="text-xs text-arc-slate-400">
          {blocks.filter((b) => b.kind === "question").length} questions detected
        </span>
      </div>

      <div className="space-y-4">
        {blocks.map((block, idx) => {
          switch (block.kind) {
            case "heading":
              return (
                <h3
                  key={idx}
                  className="text-center text-sm font-bold uppercase tracking-wide text-arc-navy-900 pt-4"
                >
                  {block.text}
                </h3>
              );

            case "question":
              return (
                <div key={idx} className="flex gap-3 pt-2">
                  <span className="text-sm font-bold text-arc-navy-900 w-7 shrink-0 text-right">
                    {block.number}.
                  </span>
                  <p className="text-sm text-arc-navy-800 leading-relaxed flex-1">
                    {block.text}
                  </p>
                </div>
              );

            case "choices":
              return (
                <div key={idx} className="pl-10 grid gap-1.5">
                  {block.items.map((item, cIdx) => (
                    <div key={cIdx} className="flex gap-2.5 items-baseline">
                      <span className="text-sm font-semibold text-arc-navy-600 w-4 shrink-0">
                        {item.label}.
                      </span>
                      <span className="text-sm text-arc-navy-700 leading-relaxed">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              );

            case "answer":
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 ml-10 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 w-fit"
                >
                  <span className="text-xs font-bold text-green-700">ANSWER</span>
                  <span className="text-xs font-medium text-green-800">{block.text}</span>
                </div>
              );

            case "paragraph":
            default:
              return (
                <p
                  key={idx}
                  className={cn(
                    "text-sm text-arc-navy-700 leading-relaxed",
                    // Instructions often follow headings — center short lines
                    block.text.length < 80 && "text-center text-arc-slate-500 italic"
                  )}
                >
                  {block.text}
                </p>
              );
          }
        })}
      </div>
    </div>
  );
}
