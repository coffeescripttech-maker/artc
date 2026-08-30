/**
 * CS#22 — College Readiness Program (CRP) DEMO content package.
 *
 * A representative learning + practice + assessment package for the ARC Review
 * Center organization. It demonstrates ARC LMS as a broader platform than the
 * BUCET simulator: guided lessons, foundational practice, small assessments,
 * and mastery progression.
 *
 * This is a DEMO / representative curriculum — it does NOT claim to replicate
 * any official college curriculum, admission requirements, or university
 * blueprint unless explicitly documented elsewhere in the repository.
 *
 * All identifiers are deterministic (stable slugs/ids) so the seeder is
 * idempotent: running it twice never duplicates records.
 */

export type CrpQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "NUMERIC"
  | "MULTIPLE_SELECT";

export interface CrpQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface CrpQuestionDef {
  /** Deterministic id used for the Question row (upsert key). */
  id: string;
  topicKey: string;
  type: CrpQuestionType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stem: string;
  options?: CrpQuestionOption[];
  /** Stored as the Question.correctAnswer Json. */
  correctAnswer: unknown;
  explanation: string;
  tags?: string[];
  passageId?: string;
}

export const CRP_ORG_SLUG = "arc-review-center";

export const CRP_PROGRAM = {
  slug: "college-readiness-program",
  name: "College Readiness Program",
  description:
    "Build foundational academic skills through guided lessons, practice activities, and readiness assessments. DEMO package — representative learning content, not an official college curriculum.",
  programType: "COLLEGE",
} as const;

export const CRP_CURRICULUM = {
  slug: "college-readiness-curriculum",
  name: "College Readiness Curriculum",
  description:
    "A four-track demo curriculum: Mathematics Foundations, Science Foundations, Language & Communication, and Critical Thinking.",
  stage: "COLLEGE",
} as const;

export interface CrpSubjectDef {
  key: string;
  name: string;
  slug: string;
  orderIndex: number;
  color: string;
}

export const CRP_SUBJECTS: CrpSubjectDef[] = [
  { key: "math", name: "Mathematics Foundations", slug: "crp-mathematics-foundations", orderIndex: 1, color: "#216FD1" },
  { key: "science", name: "Science Foundations", slug: "crp-science-foundations", orderIndex: 2, color: "#16B364" },
  { key: "language", name: "Language & Communication", slug: "crp-language-communication", orderIndex: 3, color: "#7B3FD0" },
  { key: "critical-thinking", name: "Critical Thinking", slug: "crp-critical-thinking", orderIndex: 4, color: "#F26522" },
];

export interface CrpModuleDef {
  key: string;
  subjectKey: string;
  name: string;
  orderIndex: number;
  description: string;
}

export const CRP_MODULES: CrpModuleDef[] = [
  { key: "math-algebra-essentials", subjectKey: "math", name: "Algebra Essentials", orderIndex: 1, description: "Expressions, equations, and functional relationships." },
  { key: "math-quantitative-reasoning", subjectKey: "math", name: "Quantitative Reasoning", orderIndex: 2, description: "Ratios, rates, percentages, and applied arithmetic." },
  { key: "math-problem-solving", subjectKey: "math", name: "Problem Solving", orderIndex: 3, description: "Representing and solving multi-step problems." },
  { key: "sci-scientific-thinking", subjectKey: "science", name: "Scientific Thinking", orderIndex: 1, description: "Variables, evidence, and the scientific method." },
  { key: "sci-life-physical", subjectKey: "science", name: "Life & Physical Science", orderIndex: 2, description: "Core concepts from biology, chemistry, and physics." },
  { key: "lang-grammar-usage", subjectKey: "language", name: "Grammar & Usage", orderIndex: 1, description: "Sentence construction and standard written English." },
  { key: "lang-reading-comprehension", subjectKey: "language", name: "Reading Comprehension", orderIndex: 2, description: "Main idea, inference, and evidence-based reading." },
  { key: "ct-logical-reasoning", subjectKey: "critical-thinking", name: "Logical Reasoning", orderIndex: 1, description: "Arguments, evidence, and logical structure." },
  { key: "ct-data-interpretation", subjectKey: "critical-thinking", name: "Data Interpretation", orderIndex: 2, description: "Reading charts, tables, and simple statistics." },
];

export interface CrpTopicDef {
  key: string;
  moduleKey: string;
  name: string;
  orderIndex: number;
  description: string;
}

export const CRP_TOPICS: CrpTopicDef[] = [
  { key: "top-expressions-equations", moduleKey: "math-algebra-essentials", name: "Expressions & Equations", orderIndex: 1, description: "Simplifying expressions and solving one-variable equations." },
  { key: "top-functions", moduleKey: "math-algebra-essentials", name: "Functions & Relationships", orderIndex: 2, description: "Function notation, evaluation, and linear relationships." },
  { key: "top-ratios-percentages", moduleKey: "math-quantitative-reasoning", name: "Ratios, Rates & Percentages", orderIndex: 1, description: "Proportions, unit rates, and percent problems." },
  { key: "top-multistep", moduleKey: "math-problem-solving", name: "Multi-Step Problems", orderIndex: 1, description: "Breaking word problems into sequential steps." },
  { key: "top-variables-evidence", moduleKey: "sci-scientific-thinking", name: "Variables & Evidence", orderIndex: 1, description: "Independent/dependent variables and interpreting evidence." },
  { key: "top-life-science", moduleKey: "sci-life-physical", name: "Life Science Concepts", orderIndex: 1, description: "Cells, energy flow, and ecosystems." },
  { key: "top-physical-science", moduleKey: "sci-life-physical", name: "Physical Science Concepts", orderIndex: 2, description: "Matter, energy, and basic physical laws." },
  { key: "top-sentence", moduleKey: "lang-grammar-usage", name: "Sentence Construction", orderIndex: 1, description: "Complete sentences, fragments, and clauses." },
  { key: "top-main-idea", moduleKey: "lang-reading-comprehension", name: "Main Idea & Inference", orderIndex: 1, description: "Identifying main ideas and drawing text-based inferences." },
  { key: "top-arguments", moduleKey: "ct-logical-reasoning", name: "Arguments & Evidence", orderIndex: 1, description: "Premises, conclusions, and evaluating evidence." },
  { key: "top-charts-tables", moduleKey: "ct-data-interpretation", name: "Charts & Tables", orderIndex: 1, description: "Reading tables, bar and line charts, and trends." },
];

export interface CrpLessonBlock {
  type: "heading" | "paragraph" | "keypoint" | "example" | "callout";
  level?: 2 | 3;
  text: string;
  title?: string;
  variant?: "info" | "tip" | "warning";
}

export interface CrpLessonDef {
  topicKey: string;
  slug: string;
  title: string;
  durationMinutes: number;
  description: string;
  blocks: CrpLessonBlock[];
}

export const CRP_LESSONS_A: CrpLessonDef[] = [
  {
    topicKey: "top-expressions-equations",
    slug: "crp-les-expressions-equations",
    title: "Expressions & Equations: The Language of Algebra",
    durationMinutes: 12,
    description: "Simplify expressions and solve linear equations step by step.",
    blocks: [
      { type: "heading", level: 2, text: "Expressions & Equations" },
      { type: "paragraph", text: "An expression combines numbers, variables, and operations — for example 3x + 5. An equation states that two expressions are equal, like 3x + 5 = 20. Solving means finding the value of the variable that makes the statement true." },
      { type: "example", title: "Worked example", text: "Solve 2x + 3 = 15. Subtract 3 from both sides: 2x = 12. Divide both sides by 2: x = 6." },
      { type: "keypoint", text: "Use inverse operations to isolate the variable. Whatever you do to one side of an equation, do to the other." },
      { type: "callout", variant: "tip", text: "Check your answer by substituting it back into the original equation." },
    ],
  },
  {
    topicKey: "top-functions",
    slug: "crp-les-functions-relationships",
    title: "Functions & Relationships: Inputs, Outputs, and Change",
    durationMinutes: 12,
    description: "Read and evaluate functions that describe real-world relationships.",
    blocks: [
      { type: "heading", level: 2, text: "Functions & Relationships" },
      { type: "paragraph", text: "A function maps each input to exactly one output. We write f(x) for the output when the input is x. Linear functions describe constant rates of change, like a worker earning ₱150 per hour." },
      { type: "example", title: "Worked example", text: "If f(x) = 3x − 2, then f(4) = 3(4) − 2 = 10. A job earning ₱150 per hour after h hours gives pay = 150h." },
      { type: "keypoint", text: "To evaluate a function, replace the variable with the given input, then simplify using the correct order of operations." },
    ],
  },
  {
    topicKey: "top-ratios-percentages",
    slug: "crp-les-ratios-percentages",
    title: "Ratios, Rates & Percentages: Comparing Quantities",
    durationMinutes: 12,
    description: "Work with ratios, unit rates, and percentage problems.",
    blocks: [
      { type: "heading", level: 2, text: "Ratios, Rates & Percentages" },
      { type: "paragraph", text: "A ratio compares two quantities, like 3 : 2. A rate compares quantities with different units, like 60 km per hour. A percentage is a ratio with a denominator of 100." },
      { type: "example", title: "Worked example", text: "What is 15% of ₱1,200? Convert percent to a decimal: 0.15 × 1,200 = ₱180." },
      { type: "keypoint", text: "Percent increase uses the original amount as the base, not the final amount." },
    ],
  },
];

export const CRP_LESSONS_B: CrpLessonDef[] = [
  {
    topicKey: "top-multistep",
    slug: "crp-les-multistep-problems",
    title: "Multi-Step Problems: From Story to Solution",
    durationMinutes: 12,
    description: "Translate word problems into step-by-step math plans.",
    blocks: [
      { type: "heading", level: 2, text: "Multi-Step Problems" },
      { type: "paragraph", text: "Word problems hide a sequence of operations. A strong strategy: read for the question, list the given facts, choose the operations, solve step by step, then check that the answer is reasonable." },
      { type: "example", title: "Worked example", text: "Maria buys 3 notebooks at ₱45 each and a pen at ₱30. Total = (3 × 45) + 30 = 135 + 30 = ₱165." },
      { type: "keypoint", text: "Label your intermediate answers — they keep multi-step reasoning from getting tangled." },
    ],
  },
  {
    topicKey: "top-variables-evidence",
    slug: "crp-les-variables-evidence",
    title: "Scientific Thinking: Variables & Evidence",
    durationMinutes: 12,
    description: "Design simple experiments and read evidence carefully.",
    blocks: [
      { type: "heading", level: 2, text: "Variables & Evidence" },
      { type: "paragraph", text: "In an experiment, the independent variable is what the researcher changes; the dependent variable is what is measured in response. A fair test changes only one thing at a time." },
      { type: "example", title: "Worked example", text: "Testing how light affects plant growth: the independent variable is the amount of light; the dependent variable is the plant's growth (height or mass)." },
      { type: "keypoint", text: "Data proves a relationship only when the comparison is controlled — keep everything else the same." },
    ],
  },
  {
    topicKey: "top-life-science",
    slug: "crp-les-life-science",
    title: "Life Science Core Concepts: Cells & Ecosystems",
    durationMinutes: 12,
    description: "Cells as the unit of life and energy flow in ecosystems.",
    blocks: [
      { type: "heading", level: 2, text: "Life Science Core Concepts" },
      { type: "paragraph", text: "The cell is the basic unit of structure and function in living things. Plants convert light energy into chemical energy through photosynthesis; consumers get energy by eating producers or other consumers." },
      { type: "example", title: "Worked example", text: "A food chain — grass → grasshopper → frog — shows energy flowing from producer to consumer." },
      { type: "keypoint", text: "Energy flows in one direction through a food chain; matter cycles (e.g., carbon, water)." },
    ],
  },
  {
    topicKey: "top-physical-science",
    slug: "crp-les-physical-science",
    title: "Physical Science Core Concepts: Matter & Energy",
    durationMinutes: 12,
    description: "States of matter, density, and basic energy concepts.",
    blocks: [
      { type: "heading", level: 2, text: "Physical Science Core Concepts" },
      { type: "paragraph", text: "Matter exists as solids, liquids, and gases. Density = mass ÷ volume. Energy is conserved — it can change form (e.g., chemical → motion) but is not created or destroyed." },
      { type: "example", title: "Worked example", text: "A 30 g object with a volume of 10 cm³ has density 30 ÷ 10 = 3 g/cm³. That is denser than water (1 g/cm³), so it would sink." },
      { type: "keypoint", text: "For density items, check units: grams per cubic centimeter (g/cm³)." },
    ],
  },
];

export const CRP_LESSONS_C: CrpLessonDef[] = [
  {
    topicKey: "top-sentence",
    slug: "crp-les-sentence-construction",
    title: "Sentence Construction: Clarity in Every Sentence",
    durationMinutes: 12,
    description: "Build complete, clear, and correct sentences.",
    blocks: [
      { type: "heading", level: 2, text: "Sentence Construction" },
      { type: "paragraph", text: "A complete sentence has a subject and a predicate and expresses a complete thought. A fragment is missing a subject or predicate; a run-on joins sentences without proper punctuation." },
      { type: "example", title: "Worked example", text: "\"Because it rained all day.\" is a fragment. \"The game was cancelled because it rained all day.\" is a complete sentence." },
      { type: "keypoint", text: "Read your sentence aloud — if it sounds unfinished, check for a missing subject, verb, or complete thought." },
    ],
  },
  {
    topicKey: "top-main-idea",
    slug: "crp-les-main-idea-inference",
    title: "Reading Comprehension: Main Idea & Inference",
    durationMinutes: 12,
    description: "Find the main idea and make evidence-based inferences.",
    blocks: [
      { type: "heading", level: 2, text: "Main Idea & Inference" },
      { type: "paragraph", text: "The main idea is the central claim the whole passage supports. An inference is a conclusion drawn from evidence in the text plus reasonable reasoning — never from outside knowledge alone." },
      { type: "example", title: "Worked example", text: "A paragraph lists the benefits of recycling (less waste, conserved resources, cleaner communities). Its main idea: recycling benefits communities and the environment." },
      { type: "keypoint", text: "The best answer has the tightest, most defensible link to the text — bigger is not always better." },
    ],
  },
  {
    topicKey: "top-arguments",
    slug: "crp-les-arguments-evidence",
    title: "Logical Reasoning: Arguments & Evidence",
    durationMinutes: 12,
    description: "Identify premises, conclusions, and evaluate evidence.",
    blocks: [
      { type: "heading", level: 2, text: "Arguments & Evidence" },
      { type: "paragraph", text: "An argument links premises (supporting claims) to a conclusion. To strengthen an argument, find evidence that connects its premises to its conclusion; to weaken it, find evidence that cuts that link." },
      { type: "example", title: "Worked example", text: "Claim: \"Students who read daily score higher on vocabulary tests.\" Evidence: \"Vocabulary growth correlates with hours spent reading.\" This evidence strengthens the claim." },
      { type: "keypoint", text: "Beware of fallacies — an ad hominem attacks the person instead of the argument." },
    ],
  },
  {
    topicKey: "top-charts-tables",
    slug: "crp-les-charts-tables",
    title: "Data Interpretation: Reading Charts & Tables",
    durationMinutes: 12,
    description: "Read tables, charts, and simple statistics accurately.",
    blocks: [
      { type: "heading", level: 2, text: "Charts & Tables" },
      { type: "paragraph", text: "Tables organize data in rows and columns; bar charts compare categories; line charts show change over time. Always read axis labels and units before comparing values." },
      { type: "example", title: "Worked example", text: "A bar chart shows sales: ₱100 in Jan, ₱150 in Feb, ₱125 in Mar. February had the highest sales; January had the lowest." },
      { type: "keypoint", text: "The mean is the average, the median is the middle value, and the mode is the most frequent value." },
    ],
  },
];

export const CRP_LESSONS: CrpLessonDef[] = [
  ...CRP_LESSONS_A,
  ...CRP_LESSONS_B,
  ...CRP_LESSONS_C,
];

export const CRP_QUESTIONS_A: CrpQuestionDef[] = [
  // ─── Mathematics Foundations ────────────────────────────────────────────────
  {
    id: "crp-q-math-01",
    topicKey: "top-expressions-equations",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is the value of x in the equation x + 7 = 15?",
    options: [
      { id: "a", text: "7", isCorrect: false },
      { id: "b", text: "8", isCorrect: true },
      { id: "c", text: "15", isCorrect: false },
      { id: "d", text: "22", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Subtract 7 from both sides: x = 15 − 7 = 8.",
    tags: ["crp", "mathematics", "equations"],
  },
  {
    id: "crp-q-math-02",
    topicKey: "top-expressions-equations",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Solve for x: 3x − 6 = 12.",
    options: [
      { id: "a", text: "2", isCorrect: false },
      { id: "b", text: "4", isCorrect: false },
      { id: "c", text: "6", isCorrect: true },
      { id: "d", text: "18", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Add 6 to both sides: 3x = 18. Divide by 3: x = 6.",
    tags: ["crp", "mathematics", "equations"],
  },
  {
    id: "crp-q-math-03",
    topicKey: "top-expressions-equations",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Simplify 4(x + 2) − 2x.",
    options: [
      { id: "a", text: "2x + 8", isCorrect: true },
      { id: "b", text: "6x + 8", isCorrect: false },
      { id: "c", text: "2x + 2", isCorrect: false },
      { id: "d", text: "6x", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Distribute: 4x + 8 − 2x = 2x + 8.",
    tags: ["crp", "mathematics", "equations"],
  },
  {
    id: "crp-q-math-04",
    topicKey: "top-expressions-equations",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Two angles are complementary. One angle is 4 times the other. What is the larger angle?",
    options: [
      { id: "a", text: "18°", isCorrect: false },
      { id: "b", text: "45°", isCorrect: false },
      { id: "c", text: "72°", isCorrect: true },
      { id: "d", text: "90°", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Let the smaller angle be a. Then a + 4a = 90 → 5a = 90 → a = 18, so the larger angle is 4 × 18 = 72°.",
    tags: ["crp", "mathematics", "equations"],
  },
  {
    id: "crp-q-math-05",
    topicKey: "top-functions",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "If f(x) = 2x + 3, what is f(4)?",
    options: [
      { id: "a", text: "8", isCorrect: false },
      { id: "b", text: "9", isCorrect: false },
      { id: "c", text: "11", isCorrect: true },
      { id: "d", text: "14", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Replace x with 4: f(4) = 2(4) + 3 = 8 + 3 = 11.",
    tags: ["crp", "mathematics", "functions"],
  },
  {
    id: "crp-q-math-06",
    topicKey: "top-functions",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "A prepaid call costs ₱5 per minute. Which function gives the total cost C for m minutes?",
    options: [
      { id: "a", text: "C(m) = m + 5", isCorrect: false },
      { id: "b", text: "C(m) = 5m", isCorrect: true },
      { id: "c", text: "C(m) = 5 ÷ m", isCorrect: false },
      { id: "d", text: "C(m) = m − 5", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Cost grows by ₱5 for every minute, so C(m) = 5m is the linear model.",
    tags: ["crp", "mathematics", "functions"],
  },
  {
    id: "crp-q-math-07",
    topicKey: "top-functions",
    type: "NUMERIC",
    difficulty: "HARD",
    stem: "If f(x) = x² − 2x, what is f(5)? (Enter only the number.)",
    correctAnswer: { value: 15, tolerance: 0.01 },
    explanation: "f(5) = 25 − 10 = 15.",
    tags: ["crp", "mathematics", "functions"],
  },
];

export const CRP_QUESTIONS_B: CrpQuestionDef[] = [
  {
    id: "crp-q-math-08",
    topicKey: "top-ratios-percentages",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is 25% of 80?",
    options: [
      { id: "a", text: "16", isCorrect: false },
      { id: "b", text: "20", isCorrect: true },
      { id: "c", text: "25", isCorrect: false },
      { id: "d", text: "40", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "0.25 × 80 = 20.",
    tags: ["crp", "mathematics", "percentages"],
  },
  {
    id: "crp-q-math-09",
    topicKey: "top-ratios-percentages",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "A cookie recipe needs 3 cups of flour for 12 cookies. How many cups are needed for 36 cookies?",
    options: [
      { id: "a", text: "6", isCorrect: false },
      { id: "b", text: "9", isCorrect: true },
      { id: "c", text: "12", isCorrect: false },
      { id: "d", text: "15", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "36 cookies is 3 times 12, so flour is 3 × 3 = 9 cups.",
    tags: ["crp", "mathematics", "ratios"],
  },
  {
    id: "crp-q-math-10",
    topicKey: "top-ratios-percentages",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "A ₱250 shirt is marked 30% off. What is the sale price?",
    options: [
      { id: "a", text: "₱75", isCorrect: false },
      { id: "b", text: "₱170", isCorrect: false },
      { id: "c", text: "₱175", isCorrect: true },
      { id: "d", text: "₱220", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Discount = 0.30 × 250 = ₱75. Sale price = 250 − 75 = ₱175.",
    tags: ["crp", "mathematics", "percentages"],
  },
  {
    id: "crp-q-math-11",
    topicKey: "top-multistep",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "A bus travels 60 km in 1 hour. At the same rate, how far will it travel in 3 hours?",
    options: [
      { id: "a", text: "120 km", isCorrect: false },
      { id: "b", text: "150 km", isCorrect: false },
      { id: "c", text: "180 km", isCorrect: true },
      { id: "d", text: "240 km", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Rate = 60 km/h, so 60 × 3 = 180 km.",
    tags: ["crp", "mathematics", "problem solving"],
  },
  {
    id: "crp-q-math-12",
    topicKey: "top-multistep",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "A school has 480 students. If 40% walk to school, how many students do NOT walk?",
    options: [
      { id: "a", text: "192", isCorrect: false },
      { id: "b", text: "240", isCorrect: false },
      { id: "c", text: "288", isCorrect: true },
      { id: "d", text: "320", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Walkers = 0.40 × 480 = 192. Non-walkers = 480 − 192 = 288.",
    tags: ["crp", "mathematics", "problem solving"],
  },
  {
    id: "crp-q-math-13",
    topicKey: "top-multistep",
    type: "NUMERIC",
    difficulty: "HARD",
    stem: "Ana saves ₱120 in the first week and adds ₱30 each week after. How much has she saved in total after 6 weeks? (Enter only the number.)",
    correctAnswer: { value: 270, tolerance: 0.01 },
    explanation: "Week 1 = 120; weeks 2–6 add 5 more weeks of ₱30 = 120 + 5 × 30 = 270.",
    tags: ["crp", "mathematics", "problem solving"],
  },
];

export const CRP_QUESTIONS_C: CrpQuestionDef[] = [
  // ─── Science Foundations ─────────────────────────────────────────────────────
  {
    id: "crp-q-sci-01",
    topicKey: "top-variables-evidence",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "In an experiment testing how fertilizer affects plant height, what is the dependent variable?",
    options: [
      { id: "a", text: "The type of fertilizer", isCorrect: false },
      { id: "b", text: "Plant height", isCorrect: true },
      { id: "c", text: "The amount of water", isCorrect: false },
      { id: "d", text: "The number of plants", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The dependent variable is what is measured — the outcome that may respond to the change.",
    tags: ["crp", "science", "scientific thinking"],
  },
  {
    id: "crp-q-sci-02",
    topicKey: "top-variables-evidence",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Why is it important to change only one variable at a time in an experiment?",
    options: [
      { id: "a", text: "It makes the experiment cheaper to run.", isCorrect: false },
      { id: "b", text: "It lets you know which variable caused the observed change.", isCorrect: true },
      { id: "c", text: "It guarantees the result will be positive.", isCorrect: false },
      { id: "d", text: "It eliminates the need for measurements.", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "A fair test attributes a change to the single variable that was varied.",
    tags: ["crp", "science", "scientific thinking"],
  },
  {
    id: "crp-q-sci-03",
    topicKey: "top-variables-evidence",
    type: "TRUE_FALSE",
    difficulty: "HARD",
    stem: "A correlation between two variables always proves that one causes the other.",
    correctAnswer: false,
    explanation: "Correlation can be coincidental or caused by a third factor — causation requires controlled evidence.",
    tags: ["crp", "science", "scientific thinking"],
  },
  {
    id: "crp-q-sci-04",
    topicKey: "top-life-science",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is the basic unit of structure and function in all living organisms?",
    options: [
      { id: "a", text: "The atom", isCorrect: false },
      { id: "b", text: "The cell", isCorrect: true },
      { id: "c", text: "The organ", isCorrect: false },
      { id: "d", text: "The molecule", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The cell is the basic unit of structure and function in living things.",
    tags: ["crp", "science", "life science"],
  },
  {
    id: "crp-q-sci-05",
    topicKey: "top-life-science",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which process do plants use to convert light energy into chemical energy?",
    options: [
      { id: "a", text: "Respiration", isCorrect: false },
      { id: "b", text: "Transpiration", isCorrect: false },
      { id: "c", text: "Photosynthesis", isCorrect: true },
      { id: "d", text: "Fermentation", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Photosynthesis uses light energy to build sugars from carbon dioxide and water.",
    tags: ["crp", "science", "life science"],
  },
  {
    id: "crp-q-sci-06",
    topicKey: "top-life-science",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "In the food chain grass → grasshopper → frog, which organism is the producer?",
    options: [
      { id: "a", text: "Grass", isCorrect: true },
      { id: "b", text: "Grasshopper", isCorrect: false },
      { id: "c", text: "Frog", isCorrect: false },
      { id: "d", text: "All of them", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Producers make their own food; grass is the only producer in this chain.",
    tags: ["crp", "science", "life science"],
  },
  {
    id: "crp-q-sci-07",
    topicKey: "top-physical-science",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "An object has a mass of 30 g and a volume of 10 cm³. What is its density?",
    options: [
      { id: "a", text: "0.33 g/cm³", isCorrect: false },
      { id: "b", text: "3 g/cm³", isCorrect: true },
      { id: "c", text: "30 g/cm³", isCorrect: false },
      { id: "d", text: "300 g/cm³", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Density = mass ÷ volume = 30 ÷ 10 = 3 g/cm³.",
    tags: ["crp", "science", "physical science"],
  },
  {
    id: "crp-q-sci-08",
    topicKey: "top-physical-science",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which state of matter has a definite shape and a definite volume?",
    options: [
      { id: "a", text: "Solid", isCorrect: true },
      { id: "b", text: "Liquid", isCorrect: false },
      { id: "c", text: "Gas", isCorrect: false },
      { id: "d", text: "Plasma", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Solids keep both shape and volume because their particles are tightly packed.",
    tags: ["crp", "science", "physical science"],
  },
  {
    id: "crp-q-sci-09",
    topicKey: "top-physical-science",
    type: "NUMERIC",
    difficulty: "HARD",
    stem: "A 6 kg object accelerates at 2 m/s². What is the force in newtons (F = ma)? (Enter only the number.)",
    correctAnswer: { value: 12, tolerance: 0.01 },
    explanation: "F = ma = 6 × 2 = 12 N.",
    tags: ["crp", "science", "physical science"],
  },
];

export const CRP_QUESTIONS_D: CrpQuestionDef[] = [
  // ─── Language & Communication ──────────────────────────────────────────────
  {
    id: "crp-q-lang-01",
    topicKey: "top-sentence",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Which of the following is a complete sentence?",
    options: [
      { id: "a", text: "Running down the street.", isCorrect: false },
      { id: "b", text: "She runs every morning.", isCorrect: true },
      { id: "c", text: "Although it was raining.", isCorrect: false },
      { id: "d", text: "The bright yellow bus.", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "A complete sentence has a subject, a predicate, and expresses a complete thought.",
    tags: ["crp", "language", "sentence structure"],
  },
  {
    id: "crp-q-lang-02",
    topicKey: "top-sentence",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which option turns the fragment “Because he was tired” into a complete sentence?",
    options: [
      { id: "a", text: "Because he was tired after the game.", isCorrect: false },
      { id: "b", text: "He went home because he was tired.", isCorrect: true },
      { id: "c", text: "Being tired because of the game.", isCorrect: false },
      { id: "d", text: "Tired, and because of that.", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Adding a main clause creates a complete sentence; the other choices remain fragments.",
    tags: ["crp", "language", "sentence structure"],
  },
  {
    id: "crp-q-lang-03",
    topicKey: "top-sentence",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Choose the correct verb: “Neither of the options ___ correct.”",
    options: [
      { id: "a", text: "are", isCorrect: false },
      { id: "b", text: "is", isCorrect: true },
      { id: "c", text: "were", isCorrect: false },
      { id: "d", text: "have been", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "With neither/nor, the verb agrees with the singular subject 'neither'.",
    tags: ["crp", "language", "sentence structure"],
  },
  {
    id: "crp-q-lang-04",
    topicKey: "top-sentence",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Which sentence demonstrates correct parallel structure?",
    options: [
      { id: "a", text: "She enjoys jogging, to swim, and hiking.", isCorrect: false },
      { id: "b", text: "She enjoys jogging, swimming, and hiking.", isCorrect: true },
      { id: "c", text: "She enjoys jog, swimming, and to hike.", isCorrect: false },
      { id: "d", text: "She enjoys jogging, swimming, and hikes.", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "All items in the list use the same -ing form, creating parallelism.",
    tags: ["crp", "language", "sentence structure"],
  },
  {
    id: "crp-q-lang-05",
    topicKey: "top-main-idea",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Read this paragraph: “Recycling reduces landfill waste. It conserves natural resources and saves energy. Communities with strong recycling programs report cleaner environments.” What is the main idea?",
    options: [
      { id: "a", text: "Recycling benefits communities and the environment.", isCorrect: true },
      { id: "b", text: "Landfills are the only waste solution.", isCorrect: false },
      { id: "c", text: "Recycling programs are expensive.", isCorrect: false },
      { id: "d", text: "Energy is conserved only by industry.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "The whole paragraph supports the claim that recycling benefits communities and the environment.",
    tags: ["crp", "language", "reading comprehension"],
  },
  {
    id: "crp-q-lang-06",
    topicKey: "top-main-idea",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "You see that the ground is wet and the sky is fully covered with clouds. Which inference is most reasonable?",
    options: [
      { id: "a", text: "It has rained recently.", isCorrect: true },
      { id: "b", text: "It will snow tomorrow.", isCorrect: false },
      { id: "c", text: "A typhoon is coming tonight.", isCorrect: false },
      { id: "d", text: "The ground was washed by a flood.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Wet ground with a clouded sky most directly supports the inference of recent rain.",
    tags: ["crp", "language", "reading comprehension"],
  },
  {
    id: "crp-q-lang-07",
    topicKey: "top-main-idea",
    type: "TRUE_FALSE",
    difficulty: "HARD",
    stem: "An inference must be stated directly in the text to be valid.",
    correctAnswer: false,
    explanation: "Inferences go beyond the literal text but must be supported by evidence from it.",
    tags: ["crp", "language", "reading comprehension"],
  },
];

export const CRP_QUESTIONS_E: CrpQuestionDef[] = [
  // ─── Critical Thinking ──────────────────────────────────────────────────────
  {
    id: "crp-q-ct-01",
    topicKey: "top-arguments",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "If all students must take the placement test, and Ana is a student, what can you conclude?",
    options: [
      { id: "a", text: "Ana must take the placement test.", isCorrect: true },
      { id: "b", text: "Ana must take a different test.", isCorrect: false },
      { id: "c", text: "Only Ana must take the test.", isCorrect: false },
      { id: "d", text: "No conclusion can be drawn.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "This is a valid deductive argument: the rule applies to Ana because she is a student.",
    tags: ["crp", "critical thinking", "arguments"],
  },
  {
    id: "crp-q-ct-02",
    topicKey: "top-arguments",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which evidence most strengthens the claim that daily reading improves vocabulary?",
    options: [
      { id: "a", text: "Students who read daily scored higher on vocabulary tests.", isCorrect: true },
      { id: "b", text: "Some students prefer watching movies.", isCorrect: false },
      { id: "c", text: "Vocabulary is mostly inherited.", isCorrect: false },
      { id: "d", text: "Libraries are open on weekdays.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Direct evidence linking reading to higher vocabulary scores supports the claim.",
    tags: ["crp", "critical thinking", "arguments"],
  },
  {
    id: "crp-q-ct-03",
    topicKey: "top-arguments",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "During a debate, a speaker says, “You can't trust her argument because she doesn't dress professionally.” Which fallacy is this?",
    options: [
      { id: "a", text: "Straw man", isCorrect: false },
      { id: "b", text: "Ad hominem", isCorrect: true },
      { id: "c", text: "Slippery slope", isCorrect: false },
      { id: "d", text: "False dilemma", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Ad hominem attacks the person instead of addressing the argument itself.",
    tags: ["crp", "critical thinking", "arguments"],
  },
  {
    id: "crp-q-ct-04",
    topicKey: "top-arguments",
    type: "MULTIPLE_SELECT",
    difficulty: "HARD",
    stem: "Which statements, if true, would most strengthen the claim that regular reading improves vocabulary? Select all that apply.",
    options: [
      { id: "a", text: "Vocabulary growth correlates with hours spent reading.", isCorrect: true },
      { id: "b", text: "Students who read daily scored higher on vocabulary tests.", isCorrect: true },
      { id: "c", text: "Some people enjoy movies more than books.", isCorrect: false },
      { id: "d", text: "Vocabulary size is inherited at birth.", isCorrect: false },
    ],
    correctAnswer: ["a", "b"],
    explanation: "Both choices provide supporting evidence; the other options either weaken or are irrelevant.",
    tags: ["crp", "critical thinking", "arguments"],
  },
  {
    id: "crp-q-ct-05",
    topicKey: "top-charts-tables",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "A table shows monthly sales: January ₱100, February ₱150, March ₱125. Which month had the highest sales?",
    options: [
      { id: "a", text: "January", isCorrect: false },
      { id: "b", text: "February", isCorrect: true },
      { id: "c", text: "March", isCorrect: false },
      { id: "d", text: "They were all equal", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "February at ₱150 is the highest value in the table.",
    tags: ["crp", "critical thinking", "data interpretation"],
  },
  {
    id: "crp-q-ct-06",
    topicKey: "top-charts-tables",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "The test scores are 4, 8, 8, and 12. What is the median?",
    options: [
      { id: "a", text: "4", isCorrect: false },
      { id: "b", text: "8", isCorrect: true },
      { id: "c", text: "10", isCorrect: false },
      { id: "d", text: "12", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Ordered data: 4, 8, 8, 12. The middle two values are 8 and 8, so the median is 8.",
    tags: ["crp", "critical thinking", "data interpretation"],
  },
  {
    id: "crp-q-ct-07",
    topicKey: "top-charts-tables",
    type: "NUMERIC",
    difficulty: "HARD",
    stem: "What is the mean of 10, 20, 30, and 40? (Enter only the number.)",
    correctAnswer: { value: 25, tolerance: 0.01 },
    explanation: "Sum = 100, divided by 4 values = 25.",
    tags: ["crp", "critical thinking", "data interpretation"],
  },
];

export const CRP_QUESTIONS: CrpQuestionDef[] = [
  ...CRP_QUESTIONS_A,
  ...CRP_QUESTIONS_B,
  ...CRP_QUESTIONS_C,
  ...CRP_QUESTIONS_D,
  ...CRP_QUESTIONS_E,
];

export const CRP_PRACTICE_ASSESSMENT = {
  slug: "crp-foundations-practice",
  name: "CRP Foundations Practice",
  description:
    "A short practice set drawn from the College Readiness question bank. DEMO practice — randomized order with instant explanations after submission. Not an official exam.",
  type: "PRACTICE",
  timeLimitMinutes: 15,
  passingScore: 60,
  maxAttempts: 3,
  randomizeQuestions: true,
  randomizeChoices: true,
  showExplanations: true,
  allowRetake: true,
  questionCount: 12,
  /** Subset of CRP_QUESTIONS wired to this practice assessment. */
  questionIds: [
    "crp-q-math-01",
    "crp-q-math-02",
    "crp-q-math-05",
    "crp-q-math-08",
    "crp-q-math-11",
    "crp-q-sci-01",
    "crp-q-sci-04",
    "crp-q-sci-07",
    "crp-q-lang-01",
    "crp-q-lang-05",
    "crp-q-ct-01",
    "crp-q-ct-05",
  ],
} as const;

export const CRP_DIAGNOSTIC_ASSESSMENT = {
  slug: "college-readiness-check",
  name: "College Readiness Check",
  description:
    "A brief readiness diagnostic that surfaces which foundational skills need attention. DEMO diagnostic — representative questions, not an official placement exam.",
  type: "DIAGNOSTIC",
  timeLimitMinutes: 12,
  passingScore: 60,
  maxAttempts: 2,
  randomizeQuestions: true,
  randomizeChoices: true,
  showExplanations: true,
  allowRetake: true,
  questionCount: 8,
  /** Subset of CRP_QUESTIONS wired to this diagnostic. */
  questionIds: [
    "crp-q-math-03",
    "crp-q-math-08",
    "crp-q-sci-02",
    "crp-q-sci-08",
    "crp-q-lang-03",
    "crp-q-lang-06",
    "crp-q-ct-03",
    "crp-q-ct-06",
  ],
} as const;

/** Both CRP assessments, in the order they should be created. */
export const CRP_ASSESSMENTS = [
  CRP_PRACTICE_ASSESSMENT,
  CRP_DIAGNOSTIC_ASSESSMENT,
] as const;

export const CRP_DEMO_STUDENT_EMAIL = "student@aratc.edu.ph";

/** Deterministic subject-key lookup for each topic. */
export const CRP_TOPIC_SUBJECT: Record<string, string> = Object.fromEntries(
  CRP_TOPICS.map((t) => {
    const mod = CRP_MODULES.find((m) => m.key === t.moduleKey);
    if (!mod) throw new Error(`CRP_TOPICS references unknown module '${t.moduleKey}'`);
    return [t.key, mod.subjectKey];
  }),
);

/** Aggregate question stats (used by the seeder + tests). */
export function crpQuestionStats() {
  const byTopic: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const q of CRP_QUESTIONS) {
    byTopic[q.topicKey] = (byTopic[q.topicKey] ?? 0) + 1;
    bySubject[CRP_TOPIC_SUBJECT[q.topicKey]] =
      (bySubject[CRP_TOPIC_SUBJECT[q.topicKey]] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    byType[q.type] = (byType[q.type] ?? 0) + 1;
  }
  return { total: CRP_QUESTIONS.length, byTopic, bySubject, byDifficulty, byType };
}

/**
 * Data-integrity validation for the demo content definition. Throws on any
 * structural defect (used by the test suite AND the seeder before writing).
 */
export function validateCrpSeed(): void {
  const topicKeys = new Set(CRP_TOPICS.map((t) => t.key));
  const subjectKeys = new Set(CRP_SUBJECTS.map((s) => s.key));
  const moduleKeys = new Set(CRP_MODULES.map((m) => m.key));
  const lessonTopicKeys = new Set(CRP_LESSONS.map((l) => l.topicKey));
  const questionIds = new Set<string>();

  // Hierarchy references are always resolvable and unique.
  for (const m of CRP_MODULES) {
    if (!subjectKeys.has(m.subjectKey)) throw new Error(`Module ${m.key} → unknown subject`);
  }
  for (const t of CRP_TOPICS) {
    if (!moduleKeys.has(t.moduleKey)) throw new Error(`Topic ${t.key} → unknown module`);
  }
  if (new Set(CRP_MODULES.map((m) => m.key)).size !== CRP_MODULES.length)
    throw new Error("Duplicate module keys");
  if (new Set(CRP_TOPICS.map((t) => t.key)).size !== CRP_TOPICS.length)
    throw new Error("Duplicate topic keys");
  if (new Set(CRP_LESSONS.map((l) => l.slug)).size !== CRP_LESSONS.length)
    throw new Error("Duplicate lesson slugs");

  // Every topic has exactly one lesson (demo design).
  for (const t of CRP_TOPICS) {
    if (!lessonTopicKeys.has(t.key)) throw new Error(`Topic ${t.key} has no lesson`);
  }

  for (const q of CRP_QUESTIONS) {
    if (questionIds.has(q.id)) throw new Error(`Duplicate question id ${q.id}`);
    questionIds.add(q.id);
    if (!topicKeys.has(q.topicKey)) throw new Error(`Question ${q.id} → unknown topic`);
    if (!q.stem.trim()) throw new Error(`Question ${q.id} has empty stem`);
    if (!q.explanation.trim()) throw new Error(`Question ${q.id} has no explanation`);
    if (!["EASY", "MEDIUM", "HARD"].includes(q.difficulty))
      throw new Error(`Question ${q.id} invalid difficulty`);
    if (typeof q.correctAnswer === "undefined" || q.correctAnswer === null)
      throw new Error(`Question ${q.id} missing correctAnswer`);

    if (q.type === "TRUE_FALSE") {
      if (typeof q.correctAnswer !== "boolean")
        throw new Error(`Question ${q.id} TF correctAnswer must be boolean`);
    } else if (q.type === "NUMERIC") {
      const ca = q.correctAnswer as { value: number };
      if (typeof ca?.value !== "number") throw new Error(`Question ${q.id} NUMERIC needs {value}`);
    } else {
      // MULTIPLE_CHOICE / MULTIPLE_SELECT
      if (!Array.isArray(q.options) || q.options.length < 2)
        throw new Error(`Question ${q.id} needs options`);
      const correct = q.options.filter((o) => o.isCorrect);
      if (q.type === "MULTIPLE_CHOICE" && correct.length !== 1)
        throw new Error(`Question ${q.id} MC needs exactly one correct option`);
      if (q.type === "MULTIPLE_SELECT" && correct.length < 2)
        throw new Error(`Question ${q.id} MS needs ≥2 correct options`);
      if (q.options.some((o) => !o.id || !o.text.trim()))
        throw new Error(`Question ${q.id} has a malformed option`);
      const ids = q.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length) throw new Error(`Question ${q.id} duplicate option ids`);
      const ca = q.correctAnswer as string[];
      if (!Array.isArray(ca) || !ca.every((id) => ids.includes(id)))
        throw new Error(`Question ${q.id} correctAnswer must reference option ids`);
    }
  }

  // Each assessment references only known questions, in the expected quantity.
  for (const asm of CRP_ASSESSMENTS) {
    if (asm.questionIds.length !== asm.questionCount)
      throw new Error(`${asm.slug} questionIds length mismatch`);
    for (const qid of asm.questionIds) {
      if (!questionIds.has(qid)) throw new Error(`${asm.slug} references unknown question ${qid}`);
    }
    if (asm.randomizeQuestions !== true)
      throw new Error(`${asm.slug} should randomize questions (CS#19 demo)`);
  }
}
