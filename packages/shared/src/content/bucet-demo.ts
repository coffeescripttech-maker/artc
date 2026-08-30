/**
 * CS#20 — BUCET Reviewer + CBT Mock Exam DEMO content package.
 *
 * This is a compact, internally consistent demonstration package for the ARC
 * Review Center organization. It is a DEMO curriculum — it does NOT claim to
 * replicate the official BUCET blueprint, subject distribution, or scoring
 * rules, unless explicitly documented elsewhere in the repository.
 *
 * All identifiers are deterministic (stable slugs/ids) so the seeder is
 * idempotent: running it twice never duplicates records.
 */

export type BucetQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "NUMERIC"
  | "MULTIPLE_SELECT";

export interface BucetQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BucetQuestionDef {
  /** Deterministic id used for the Question row (upsert key). */
  id: string;
  topicKey: string;
  type: BucetQuestionType;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stem: string;
  options?: BucetQuestionOption[];
  /** Stored as the Question.correctAnswer Json. */
  correctAnswer: unknown;
  explanation: string;
  tags?: string[];
  passageId?: string;
}

export const BUCET_ORG_SLUG = "arc-review-center";

export const BUCET_PROGRAM = {
  slug: "bucet-reviewer",
  name: "BUCET Reviewer & CBT Mock Exam",
  description:
    "Focused reviewer and mock-exam program for the BUCET-style college entrance examination. DEMO package — includes a randomized, timed mock examination built from the BUCET question bank.",
  programType: "COLLEGE_ENTRANCE",
} as const;

export const BUCET_CURRICULUM = {
  slug: "bucet-reviewer-curriculum",
  name: "BUCET Reviewer Curriculum",
  description:
    "A four-track demo curriculum: Mathematics, Science, English & Language, and Reading & Critical Thinking.",
  stage: "ENTRANCE_EXAM",
} as const;

export interface BucetSubjectDef {
  key: string;
  name: string;
  slug: string;
  orderIndex: number;
  color: string;
}

export const BUCET_SUBJECTS: BucetSubjectDef[] = [
  { key: "math", name: "Mathematics", slug: "bucet-mathematics", orderIndex: 1, color: "#2563eb" },
  { key: "science", name: "Science", slug: "bucet-science", orderIndex: 2, color: "#059669" },
  { key: "english", name: "English & Language", slug: "bucet-english-language", orderIndex: 3, color: "#d97706" },
  { key: "reading", name: "Reading & Critical Thinking", slug: "bucet-reading-critical-thinking", orderIndex: 4, color: "#9333ea" },
];

export interface BucetModuleDef {
  key: string;
  subjectKey: string;
  name: string;
  orderIndex: number;
  description: string;
}

export const BUCET_MODULES: BucetModuleDef[] = [
  { key: "math-algebra", subjectKey: "math", name: "Algebra", orderIndex: 1, description: "Linear equations and functions." },
  { key: "math-geometry", subjectKey: "math", name: "Geometry", orderIndex: 2, description: "Plane geometry basics." },
  { key: "math-problem-solving", subjectKey: "math", name: "Problem Solving", orderIndex: 3, description: "Applied quantitative reasoning." },
  { key: "sci-general", subjectKey: "science", name: "General Science", orderIndex: 1, description: "Biology and physical science fundamentals." },
  { key: "sci-reasoning", subjectKey: "science", name: "Scientific Reasoning", orderIndex: 2, description: "Interpreting and evaluating data." },
  { key: "eng-grammar", subjectKey: "english", name: "Grammar", orderIndex: 1, description: "Sentence structure and standard usage." },
  { key: "eng-reading", subjectKey: "english", name: "Reading Comprehension", orderIndex: 2, description: "Passage analysis for entrance exams." },
  { key: "rdg-reading", subjectKey: "reading", name: "Critical Reading", orderIndex: 1, description: "Main idea, inference, and author intent." },
  { key: "rdg-logical", subjectKey: "reading", name: "Logical Reasoning", orderIndex: 2, description: "Patterns, analogies, and argument structure." },
];

export interface BucetTopicDef {
  key: string;
  moduleKey: string;
  name: string;
  orderIndex: number;
  description: string;
}

export const BUCET_TOPICS: BucetTopicDef[] = [
  { key: "math-linear-equations", moduleKey: "math-algebra", name: "Linear Equations", orderIndex: 1, description: "Solving one-variable linear equations." },
  { key: "math-functions", moduleKey: "math-algebra", name: "Functions", orderIndex: 2, description: "Function notation, evaluation, and linear models." },
  { key: "math-plane-geometry", moduleKey: "math-geometry", name: "Plane Geometry", orderIndex: 1, description: "Angles, triangles, and circles." },
  { key: "math-quantitative-reasoning", moduleKey: "math-problem-solving", name: "Quantitative Reasoning", orderIndex: 1, description: "Percentages, sequences, and word problems." },
  { key: "sci-biology", moduleKey: "sci-general", name: "Biology Fundamentals", orderIndex: 1, description: "Cells, organelles, and life processes." },
  { key: "sci-physical", moduleKey: "sci-general", name: "Physical Science", orderIndex: 2, description: "Matter, forces, and motion." },
  { key: "sci-data", moduleKey: "sci-reasoning", name: "Data Interpretation", orderIndex: 1, description: "Reading tables, means, medians, and variance." },
  { key: "eng-sentence", moduleKey: "eng-grammar", name: "Sentence Structure", orderIndex: 1, description: "Complete sentences, fragments, and parallelism." },
  { key: "eng-usage", moduleKey: "eng-grammar", name: "Usage", orderIndex: 2, description: "Subject–verb agreement and word choice." },
  { key: "eng-passage", moduleKey: "eng-reading", name: "Passage Analysis", orderIndex: 1, description: "Reading a short passage and answering detail and inference items." },
  { key: "rdg-main-idea", moduleKey: "rdg-reading", name: "Main Idea & Inference", orderIndex: 1, description: "Stating the main idea and drawing reasonable inferences." },
  { key: "rdg-patterns", moduleKey: "rdg-logical", name: "Patterns & Arguments", orderIndex: 1, description: "Sequences, analogies, fallacies, and strengthening arguments." },
];
export interface BucetLessonBlock {
  type: "heading" | "paragraph" | "keypoint" | "example" | "callout";
  level?: 2 | 3;
  text: string;
  title?: string;
  variant?: "info" | "tip" | "warning";
}

export interface BucetLessonDef {
  topicKey: string;
  slug: string;
  title: string;
  durationMinutes: number;
  description: string;
  blocks: BucetLessonBlock[];
}

export const BUCET_LESSONS: BucetLessonDef[] = [
  {
    topicKey: "math-linear-equations",
    slug: "bucet-les-linear-equations",
    title: "Linear Equations: Solving for the Unknown",
    durationMinutes: 12,
    description: "Isolate the variable using inverse operations.",
    blocks: [
      { type: "heading", level: 2, text: "Linear Equations" },
      { type: "paragraph", text: "A linear equation in one variable has the form ax + b = c. Solving means isolating the variable on one side using inverse operations." },
      { type: "example", title: "Worked example", text: "Solve 3x − 5 = 16. Add 5 to both sides: 3x = 21. Divide both sides by 3: x = 7." },
      { type: "keypoint", text: "Whatever you do to one side of the equation, do to the other. This preserves equality." },
      { type: "callout", variant: "tip", text: "Check your answer by substituting it back into the original equation." },
    ],
  },
  {
    topicKey: "math-functions",
    slug: "bucet-les-functions",
    title: "Functions: From Inputs to Outputs",
    durationMinutes: 12,
    description: "Function notation and evaluation.",
    blocks: [
      { type: "heading", level: 2, text: "Functions" },
      { type: "paragraph", text: "A function maps each input to exactly one output. We write f(x) to mean the output when the input is x." },
      { type: "example", title: "Worked example", text: "If f(x) = 2x + 1, then f(3) = 2(3) + 1 = 7." },
      { type: "keypoint", text: "Linear functions like d = 60t describe constant rates: replace the variable with the given value, then evaluate." },
      { type: "callout", variant: "info", text: "On entrance exams, function evaluation is usually the first 'algebra' item — practice substitution speed." },
    ],
  },
  {
    topicKey: "math-plane-geometry",
    slug: "bucet-les-plane-geometry",
    title: "Plane Geometry: Angles and Shapes",
    durationMinutes: 12,
    description: "Triangles, angles, and circles.",
    blocks: [
      { type: "heading", level: 2, text: "Plane Geometry" },
      { type: "paragraph", text: "The interior angles of a triangle always sum to 180°. Complementary angles sum to 90°; supplementary angles sum to 180°." },
      { type: "example", title: "Circle facts", text: "Area = πr² and circumference = 2πr. A circle with radius 3 has area 9π." },
      { type: "keypoint", text: "Memorize the three angle facts (triangle, complementary, supplementary) — they are the backbone of most geometry items." },
    ],
  },
  {
    topicKey: "math-quantitative-reasoning",
    slug: "bucet-les-quantitative-reasoning",
    title: "Quantitative Reasoning: Patterns & Word Problems",
    durationMinutes: 15,
    description: "Percentages, sequences, and classic word problems.",
    blocks: [
      { type: "heading", level: 2, text: "Quantitative Reasoning" },
      { type: "paragraph", text: "Quantitative items test arithmetic thinking: discounts, sequences, averages, and simple systems of equations." },
      { type: "example", title: "Discount", text: "20% of ₱450 is 0.20 × 450 = ₱90. The sale price is 450 − 90 = ₱360." },
      { type: "example", title: "Sequence", text: "2, 6, 10, 14, … adds 4 each time, so the 7th term is 2 + 6(4) = 26." },
      { type: "keypoint", text: "Write down what you know, convert percentages to decimals, and eliminate unreasonable answer choices early." },
    ],
  },
  {
    topicKey: "sci-biology",
    slug: "bucet-les-biology-fundamentals",
    title: "Biology Fundamentals: Cells and Life",
    durationMinutes: 12,
    description: "Cells, organelles, and plant processes.",
    blocks: [
      { type: "heading", level: 2, text: "Biology Fundamentals" },
      { type: "paragraph", text: "The cell is the basic unit of life. Chloroplasts capture sunlight for photosynthesis; transpiration is water loss through leaves." },
      { type: "example", title: "Cell theory", text: "All living things are made of cells, the cell is the basic unit of structure, and all cells come from pre-existing cells." },
      { type: "keypoint", text: "Match organelle to function: mitochondria = energy, chloroplast = photosynthesis, nucleus = genetic control." },
    ],
  },
  {
    topicKey: "sci-physical",
    slug: "bucet-les-physical-science",
    title: "Physical Science: Matter, Forces, and Motion",
    durationMinutes: 12,
    description: "States of matter and Newton's laws.",
    blocks: [
      { type: "heading", level: 2, text: "Physical Science" },
      { type: "paragraph", text: "Solids have fixed shape and volume. Newton's Second Law states F = ma; force is measured in newtons (N)." },
      { type: "example", title: "Force", text: "A 2 kg object accelerating at 3 m/s² experiences F = 2 × 3 = 6 N." },
      { type: "keypoint", text: "For F = ma items, convert masses to kg and check the units of the answer choices." },
    ],
  },
  {
    topicKey: "sci-data",
    slug: "bucet-les-data-interpretation",
    title: "Scientific Reasoning: Reading Data",
    durationMinutes: 12,
    description: "Mean, median, mode, and spread.",
    blocks: [
      { type: "heading", level: 2, text: "Reading Data" },
      { type: "paragraph", text: "The mean is the arithmetic average, the median is the middle value of an ordered list, and the mode is the most frequent value." },
      { type: "example", title: "Mean", text: "Heights 12, 15, 9, 14 cm have mean (12+15+9+14)/4 = 12.5 cm." },
      { type: "keypoint", text: "Always sort data before finding the median. Larger spread means higher variance, even if the mean is the same." },
    ],
  },
  {
    topicKey: "eng-sentence",
    slug: "bucet-les-sentence-structure",
    title: "Grammar: Building Complete Sentences",
    durationMinutes: 12,
    description: "Complete sentences, fragments, and parallel structure.",
    blocks: [
      { type: "heading", level: 2, text: "Sentence Structure" },
      { type: "paragraph", text: "A complete sentence has a subject and a predicate and expresses a complete thought. A fragment is missing one of these." },
      { type: "example", title: "Fragment fix", text: "“Because he was tired.” is a fragment. “He went home because he was tired.” is a complete sentence." },
      { type: "keypoint", text: "Parallel structure keeps lists consistent: jogging, swimming, and hiking — not jogging, swim, and to hike." },
    ],
  },
{
    topicKey: "eng-usage",
    slug: "bucet-les-usage",
    title: "Grammar: Word Choice and Agreement",
    durationMinutes: 12,
    description: "Subject–verb agreement, pronouns, and commonly confused words.",
    blocks: [
      { type: "heading", level: 2, text: "Usage" },
      { type: "paragraph", text: "Singular subjects take singular verbs: neither of the options is correct. Affect is usually a verb; effect is usually a noun." },
      { type: "example", title: "Agreement", text: "“Everyone must bring their own ID” uses the singular they in modern usage." },
      { type: "keypoint", text: "Ignore intervening phrases when checking agreement: the verb agrees with the true subject, not the nearest noun." },
    ],
  },
  {
    topicKey: "eng-passage",
    slug: "bucet-les-passage-analysis",
    title: "Reading Comprehension: Analyzing Passages",
    durationMinutes: 15,
    description: "How to answer detail, vocabulary, and best-title items.",
    blocks: [
      { type: "heading", level: 2, text: "Passage Analysis" },
      { type: "paragraph", text: "Read the passage once for the gist, then return to specific questions. Vocabulary-in-context items ask what a word means in the passage." },
      { type: "example", title: "Strategy", text: "For a detail item, locate the exact sentence before choosing. For a 'supported by the passage' item, eliminate choices the passage never mentions." },
      { type: "keypoint", text: "Correct inference items are always supported by evidence in the text — never by outside knowledge." },
    ],
  },
  {
    topicKey: "rdg-main-idea",
    slug: "bucet-les-main-idea-inference",
    title: "Critical Reading: Main Idea and Inference",
    durationMinutes: 12,
    description: "Stating the main idea and drawing reasonable inferences.",
    blocks: [
      { type: "heading", level: 2, text: "Main Idea & Inference" },
      { type: "paragraph", text: "The main idea is a general claim the whole passage supports. An inference is a conclusion drawn only from evidence and reasoning." },
      { type: "example", title: "Inference", text: "“The ground is wet and the sky is cloudy” most reasonably supports the inference that it has rained recently." },
      { type: "keypoint", text: "The best answer is the one with the tightest, most defensible link to the text — not the broadest statement." },
    ],
  },
  {
    topicKey: "rdg-patterns",
    slug: "bucet-les-patterns-arguments",
    title: "Logical Reasoning: Patterns and Arguments",
    durationMinutes: 15,
    description: "Sequences, analogies, and evaluating arguments.",
    blocks: [
      { type: "heading", level: 2, text: "Logical Reasoning" },
      { type: "paragraph", text: "Number series, letter series, and analogies test pattern recognition. Argument items ask you to strengthen, weaken, or identify fallacies." },
      { type: "example", title: "Series", text: "3, 6, 12, 24, … doubles each time, so the next term is 48. A, C, E, G, … skips every other letter, so next is I." },
      { type: "keypoint", text: "An ad hominem fallacy attacks the person instead of the argument. When strengthening an argument, find evidence that connects the premise to the claim." },
    ],
  },
];
export const BUCET_PASSAGE = {
  id: "bucet-passage-eagle",
  title: "The Philippine Eagle",
  content:
    "The Philippine eagle, one of the largest eagles in the world, is endemic to the Philippines. It feeds primarily on small mammals and birds. Habitat loss and hunting have made it critically endangered. Conservation programs now breed eagles in captivity and release them into protected forests.",
} as const;

export const BUCET_QUESTIONS: BucetQuestionDef[] = [
  // ─── Mathematics ───────────────────────────────────────────────────────────
  {
    id: "bucet-q-math-01",
    topicKey: "math-linear-equations",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Solve for x: x + 7 = 15.",
    options: [
      { id: "a", text: "6", isCorrect: false },
      { id: "b", text: "7", isCorrect: false },
      { id: "c", text: "8", isCorrect: true },
      { id: "d", text: "9", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Subtract 7 from both sides: x = 15 − 7 = 8.",
    tags: ["bucet", "mathematics", "algebra"],
  },
  {
    id: "bucet-q-math-02",
    topicKey: "math-linear-equations",
    type: "NUMERIC",
    difficulty: "MEDIUM",
    stem: "Solve for x: 3x − 5 = 16. (Enter only the number.)",
    correctAnswer: { value: 7, tolerance: 0.01 },
    explanation: "Add 5 to both sides: 3x = 21. Divide by 3: x = 7.",
    tags: ["bucet", "mathematics", "algebra"],
  },
  {
    id: "bucet-q-math-03",
    topicKey: "math-linear-equations",
    type: "MULTIPLE_SELECT",
    difficulty: "MEDIUM",
    stem: "Which of the following equations are linear in one variable? Select all that apply.",
    options: [
      { id: "a", text: "2x + 3 = 11", isCorrect: true },
      { id: "b", text: "x² = 25", isCorrect: false },
      { id: "c", text: "4y − 1 = 3y + 5", isCorrect: true },
      { id: "d", text: "xy = 12", isCorrect: false },
    ],
    correctAnswer: ["a", "c"],
    explanation: "Linear equations have variables raised only to the first power. x² and xy are not linear.",
    tags: ["bucet", "mathematics", "algebra"],
  },
  {
    id: "bucet-q-math-04",
    topicKey: "math-functions",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "If f(x) = 2x + 1, what is f(3)?",
    options: [
      { id: "a", text: "5", isCorrect: false },
      { id: "b", text: "6", isCorrect: false },
      { id: "c", text: "7", isCorrect: true },
      { id: "d", text: "9", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "f(3) = 2(3) + 1 = 7.",
    tags: ["bucet", "mathematics", "functions"],
  },
  {
    id: "bucet-q-math-05",
    topicKey: "math-functions",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "A car travels at 60 km per hour. Using d = 60t, how many kilometers does it travel in 2.5 hours?",
    options: [
      { id: "a", text: "120 km", isCorrect: false },
      { id: "b", text: "150 km", isCorrect: true },
      { id: "c", text: "160 km", isCorrect: false },
      { id: "d", text: "180 km", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "d = 60 × 2.5 = 150 km.",
    tags: ["bucet", "mathematics", "functions"],
  },
  {
    id: "bucet-q-math-06",
    topicKey: "math-functions",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "If g(x) = x² − 1, what is g(−2)?",
    options: [
      { id: "a", text: "−5", isCorrect: false },
      { id: "b", text: "−3", isCorrect: false },
      { id: "c", text: "3", isCorrect: true },
      { id: "d", text: "5", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "g(−2) = (−2)² − 1 = 4 − 1 = 3.",
    tags: ["bucet", "mathematics", "functions"],
  },
  {
    id: "bucet-q-math-07",
    topicKey: "math-plane-geometry",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is the sum of the interior angles of a triangle?",
    options: [
      { id: "a", text: "90°", isCorrect: false },
      { id: "b", text: "180°", isCorrect: true },
      { id: "c", text: "270°", isCorrect: false },
      { id: "d", text: "360°", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The interior angles of any triangle sum to 180°.",
    tags: ["bucet", "mathematics", "geometry"],
  },
  {
    id: "bucet-q-math-08",
    topicKey: "math-plane-geometry",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Two angles are complementary. One measures 35°. What is the other?",
    options: [
      { id: "a", text: "35°", isCorrect: false },
      { id: "b", text: "55°", isCorrect: true },
      { id: "c", text: "65°", isCorrect: false },
      { id: "d", text: "145°", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Complementary angles sum to 90°, so the other angle is 90 − 35 = 55°.",
    tags: ["bucet", "mathematics", "geometry"],
  },
  {
    id: "bucet-q-math-09",
    topicKey: "math-plane-geometry",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "What is the exact area of a circle with radius 3?",
    options: [
      { id: "a", text: "6π", isCorrect: false },
      { id: "b", text: "9π", isCorrect: true },
      { id: "c", text: "12π", isCorrect: false },
      { id: "d", text: "18π", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Area = πr² = π(3²) = 9π.",
    tags: ["bucet", "mathematics", "geometry"],
  },
  {
    id: "bucet-q-math-10",
    topicKey: "math-quantitative-reasoning",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "A shirt costs ₱450 and is on sale at 20% off. What is the discount?",
    options: [
      { id: "a", text: "₱45", isCorrect: false },
      { id: "b", text: "₱90", isCorrect: true },
      { id: "c", text: "₱110", isCorrect: false },
      { id: "d", text: "₱360", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "20% of 450 = 0.20 × 450 = ₱90.",
    tags: ["bucet", "mathematics", "problem solving"],
  },
  {
    id: "bucet-q-math-11",
    topicKey: "math-quantitative-reasoning",
    type: "NUMERIC",
    difficulty: "MEDIUM",
    stem: "What is the 7th term of the sequence 2, 6, 10, 14, …? (Enter only the number.)",
    correctAnswer: { value: 26, tolerance: 0.01 },
    explanation: "Each term adds 4. Term n is 2 + 4(n − 1), so term 7 is 2 + 24 = 26.",
    tags: ["bucet", "mathematics", "problem solving"],
  },
  {
    id: "bucet-q-math-12",
    topicKey: "math-quantitative-reasoning",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "A bag has 4 red and 6 blue marbles. One marble is drawn at random. What is the probability it is blue?",
    options: [
      { id: "a", text: "0.4", isCorrect: false },
      { id: "b", text: "0.5", isCorrect: false },
      { id: "c", text: "0.6", isCorrect: true },
      { id: "d", text: "0.7", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "6 blue out of 10 total marbles = 6/10 = 0.6.",
    tags: ["bucet", "mathematics", "problem solving"],
  },
  {
    id: "bucet-q-math-13",
    topicKey: "math-quantitative-reasoning",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "If m = 2n + 3 and m + n = 12, what is n?",
    options: [
      { id: "a", text: "2", isCorrect: false },
      { id: "b", text: "3", isCorrect: true },
      { id: "c", text: "4", isCorrect: false },
      { id: "d", text: "6", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Substitute m: (2n + 3) + n = 12 → 3n = 9 → n = 3.",
    tags: ["bucet", "mathematics", "problem solving"],
  },
// ─── Science ───────────────────────────────────────────────────────────────
  {
    id: "bucet-q-sci-01",
    topicKey: "sci-biology",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is the basic structural and functional unit of all living organisms?",
    options: [
      { id: "a", text: "The atom", isCorrect: false },
      { id: "b", text: "The cell", isCorrect: true },
      { id: "c", text: "The organ", isCorrect: false },
      { id: "d", text: "The molecule", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The cell is the basic unit of structure and function in all living things.",
    tags: ["bucet", "science", "biology"],
  },
  {
    id: "bucet-q-sci-02",
    topicKey: "sci-biology",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which organelle is responsible for photosynthesis in plant cells?",
    options: [
      { id: "a", text: "Mitochondrion", isCorrect: false },
      { id: "b", text: "Nucleus", isCorrect: false },
      { id: "c", text: "Chloroplast", isCorrect: true },
      { id: "d", text: "Ribosome", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Chloroplasts contain chlorophyll and convert light energy into chemical energy.",
    tags: ["bucet", "science", "biology"],
  },
  {
    id: "bucet-q-sci-03",
    topicKey: "sci-biology",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "What is the process by which plants release water vapor through their leaves?",
    options: [
      { id: "a", text: "Respiration", isCorrect: false },
      { id: "b", text: "Transpiration", isCorrect: true },
      { id: "c", text: "Photosynthesis", isCorrect: false },
      { id: "d", text: "Fermentation", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Transpiration is the loss of water vapor mainly through stomata on leaves.",
    tags: ["bucet", "science", "biology"],
  },
  {
    id: "bucet-q-sci-04",
    topicKey: "sci-biology",
    type: "TRUE_FALSE",
    difficulty: "MEDIUM",
    stem: "The cell theory states that all cells come from pre-existing cells.",
    correctAnswer: true,
    explanation: "This is one of the three statements of the modern cell theory.",
    tags: ["bucet", "science", "biology"],
  },
  {
    id: "bucet-q-sci-05",
    topicKey: "sci-physical",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Which state of matter has a definite shape and a definite volume?",
    options: [
      { id: "a", text: "Solid", isCorrect: true },
      { id: "b", text: "Liquid", isCorrect: false },
      { id: "c", text: "Gas", isCorrect: false },
      { id: "d", text: "Plasma", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Solids keep both their shape and volume because their particles are tightly packed.",
    tags: ["bucet", "science", "physical science"],
  },
  {
    id: "bucet-q-sci-06",
    topicKey: "sci-physical",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which law states that force equals mass times acceleration (F = ma)?",
    options: [
      { id: "a", text: "Newton's First Law", isCorrect: false },
      { id: "b", text: "Newton's Second Law", isCorrect: true },
      { id: "c", text: "Newton's Third Law", isCorrect: false },
      { id: "d", text: "The Law of Conservation of Energy", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Newton's second law relates net force, mass, and acceleration: F = ma.",
    tags: ["bucet", "science", "physical science"],
  },
  {
    id: "bucet-q-sci-07",
    topicKey: "sci-physical",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "What is the SI unit of force?",
    options: [
      { id: "a", text: "Joule", isCorrect: false },
      { id: "b", text: "Watt", isCorrect: false },
      { id: "c", text: "Newton", isCorrect: true },
      { id: "d", text: "Pascal", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Force is measured in newtons (N); 1 N = 1 kg·m/s².",
    tags: ["bucet", "science", "physical science"],
  },
  {
    id: "bucet-q-sci-08",
    topicKey: "sci-physical",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "A 2 kg object accelerates at 3 m/s². What is the net force on it?",
    options: [
      { id: "a", text: "1.5 N", isCorrect: false },
      { id: "b", text: "5 N", isCorrect: false },
      { id: "c", text: "6 N", isCorrect: true },
      { id: "d", text: "12 N", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "F = ma = 2 × 3 = 6 N.",
    tags: ["bucet", "science", "physical science"],
  },
  {
    id: "bucet-q-sci-09",
    topicKey: "sci-data",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "The heights of four plants are 12, 15, 9, and 14 cm. What is the mean height?",
    options: [
      { id: "a", text: "12.0 cm", isCorrect: false },
      { id: "b", text: "12.5 cm", isCorrect: true },
      { id: "c", text: "13.0 cm", isCorrect: false },
      { id: "d", text: "14.0 cm", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Mean = (12 + 15 + 9 + 14) / 4 = 50 / 4 = 12.5 cm.",
    tags: ["bucet", "science", "data interpretation"],
  },
  {
    id: "bucet-q-sci-10",
    topicKey: "sci-data",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "What is the median of the data set 3, 7, 8, 12, 20?",
    options: [
      { id: "a", text: "7", isCorrect: false },
      { id: "b", text: "8", isCorrect: true },
      { id: "c", text: "10", isCorrect: false },
      { id: "d", text: "12", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "In the ordered set, the middle value (3rd of 5) is 8.",
    tags: ["bucet", "science", "data interpretation"],
  },
  {
    id: "bucet-q-sci-11",
    topicKey: "sci-data",
    type: "TRUE_FALSE",
    difficulty: "EASY",
    stem: "The mode is the value that appears most frequently in a data set.",
    correctAnswer: true,
    explanation: "By definition, the mode is the most frequent value.",
    tags: ["bucet", "science", "data interpretation"],
  },
  {
    id: "bucet-q-sci-12",
    topicKey: "sci-data",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Two trials record: Trial A = {10, 12, 11, 11} and Trial B = {5, 20, 10, 13}. Which trial has the greater spread (variance)?",
    options: [
      { id: "a", text: "Trial A", isCorrect: false },
      { id: "b", text: "Trial B", isCorrect: true },
      { id: "c", text: "They are equal", isCorrect: false },
      { id: "d", text: "Cannot be determined", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Trial B has values farther from its mean, so its variance is larger.",
    tags: ["bucet", "science", "data interpretation"],
  },
// ─── English & Language ────────────────────────────────────────────────────
  {
    id: "bucet-q-eng-01",
    topicKey: "eng-sentence",
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
    tags: ["bucet", "english", "sentence structure"],
  },
  {
    id: "bucet-q-eng-02",
    topicKey: "eng-sentence",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "In the sentence “The diligent students passed the exam,” what is the subject?",
    options: [
      { id: "a", text: "The exam", isCorrect: false },
      { id: "b", text: "Students", isCorrect: true },
      { id: "c", text: "Passed", isCorrect: false },
      { id: "d", text: "Diligent", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The subject is who or what the sentence is about: the students.",
    tags: ["bucet", "english", "sentence structure"],
  },
  {
    id: "bucet-q-eng-03",
    topicKey: "eng-sentence",
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
    explanation: "Adding a main clause makes a complete sentence; the other options remain fragments.",
    tags: ["bucet", "english", "sentence structure"],
  },
  {
    id: "bucet-q-eng-04",
    topicKey: "eng-usage",
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
    tags: ["bucet", "english", "usage"],
  },
  {
    id: "bucet-q-eng-05",
    topicKey: "eng-usage",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Choose the correct pronoun: “___ and I went to the library.”",
    options: [
      { id: "a", text: "Her", isCorrect: false },
      { id: "b", text: "She", isCorrect: true },
      { id: "c", text: "Hers", isCorrect: false },
      { id: "d", text: "Him", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The pronoun is part of the subject, so use the subject form 'she'.",
    tags: ["bucet", "english", "usage"],
  },
  {
    id: "bucet-q-eng-06",
    topicKey: "eng-usage",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "The new policy will ___ all students next semester.",
    options: [
      { id: "a", text: "effect", isCorrect: false },
      { id: "b", text: "affect", isCorrect: true },
      { id: "c", text: "effective", isCorrect: false },
      { id: "d", text: "affects", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Affect is a verb meaning to influence; the future 'will affect' is correct.",
    tags: ["bucet", "english", "usage"],
  },
  {
    id: "bucet-q-eng-07",
    topicKey: "eng-passage",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Based on the passage, what does the word “endemic” most likely mean?",
    options: [
      { id: "a", text: "Able to fly long distances", isCorrect: false },
      { id: "b", text: "Native only to a specific region", isCorrect: true },
      { id: "c", text: "Dangerous to humans", isCorrect: false },
      { id: "d", text: "Kept in captivity", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The passage says the eagle is endemic to the Philippines — found naturally only there.",
    tags: ["bucet", "english", "reading comprehension"],
    passageId: "bucet-passage-eagle",
  },
  {
    id: "bucet-q-eng-08",
    topicKey: "eng-passage",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "According to the passage, which factors have made the Philippine eagle critically endangered?",
    options: [
      { id: "a", text: "Air pollution and noise", isCorrect: false },
      { id: "b", text: "Habitat loss and hunting", isCorrect: true },
      { id: "c", text: "Climate change only", isCorrect: false },
      { id: "d", text: "Competition with other eagles", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The passage names habitat loss and hunting as the endangerment factors.",
    tags: ["bucet", "english", "reading comprehension"],
    passageId: "bucet-passage-eagle",
  },
  {
    id: "bucet-q-eng-09",
    topicKey: "eng-passage",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Which statement is best supported by the passage?",
    options: [
      { id: "a", text: "Conservation programs breed eagles in captivity.", isCorrect: true },
      { id: "b", text: "The Philippine eagle is abundant in the wild.", isCorrect: false },
      { id: "c", text: "Eagles feed mostly on fish.", isCorrect: false },
      { id: "d", text: "The eagle is the largest bird in the world.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "The passage states that conservation programs breed eagles in captivity and release them into protected forests.",
    tags: ["bucet", "english", "reading comprehension"],
    passageId: "bucet-passage-eagle",
  },
  {
    id: "bucet-q-eng-10",
    topicKey: "eng-passage",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Based on the passage, which action would most likely help the Philippine eagle recover?",
    options: [
      { id: "a", text: "Protecting remaining forest habitats", isCorrect: true },
      { id: "b", text: "Increasing urban development", isCorrect: false },
      { id: "c", text: "Feeding eagles a diet of fish", isCorrect: false },
      { id: "d", text: "Removing all eagles from the wild", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "Since habitat loss is a stated cause, protecting forests directly addresses it.",
    tags: ["bucet", "english", "reading comprehension"],
    passageId: "bucet-passage-eagle",
  },
  {
    id: "bucet-q-eng-11",
    topicKey: "eng-usage",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Choose the correct word: “Everyone must bring ___ own identification.”",
    options: [
      { id: "a", text: "his or her", isCorrect: false },
      { id: "b", text: "their", isCorrect: true },
      { id: "c", text: "they", isCorrect: false },
      { id: "d", text: "them", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Singular 'they' is the standard modern choice for indefinite pronouns like everyone.",
    tags: ["bucet", "english", "usage"],
  },
  {
    id: "bucet-q-eng-12",
    topicKey: "eng-sentence",
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
    tags: ["bucet", "english", "sentence structure"],
  },
// ─── Reading & Critical Thinking ─────────────────────────────────────────────
  {
    id: "bucet-q-rdg-01",
    topicKey: "rdg-main-idea",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "Read this paragraph: “Recycling reduces landfill waste. It conserves natural resources and saves energy. Communities with strong recycling programs report cleaner environments.” What is the main idea?",
    options: [
      { id: "a", text: "Recycling benefits communities and the environment.", isCorrect: true },
      { id: "b", text: "Landfills are the only waste solution.", isCorrect: false },
      { id: "c", text: "Recycling programs are expensive.", isCorrect: false },
      { id: "d", text: "Energy is conserved only by industry.", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "The whole paragraph supports the claim that recycling benefits communities and the environment.",
    tags: ["bucet", "reading", "main idea"],
  },
  {
    id: "bucet-q-rdg-02",
    topicKey: "rdg-main-idea",
    type: "TRUE_FALSE",
    difficulty: "EASY",
    stem: "An inference is a conclusion drawn from evidence and reasoning.",
    correctAnswer: true,
    explanation: "Inferences go beyond the literal text but must be supported by evidence.",
    tags: ["bucet", "reading", "inference"],
  },
  {
    id: "bucet-q-rdg-03",
    topicKey: "rdg-main-idea",
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
    explanation: "Wet ground plus a cloud-covered sky most directly supports a recent rain.",
    tags: ["bucet", "reading", "inference"],
  },
  {
    id: "bucet-q-rdg-04",
    topicKey: "rdg-main-idea",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Mia always arrives on time. Today she left home late. Based on these facts, what is the most reasonable conclusion?",
    options: [
      { id: "a", text: "She will definitely be late.", isCorrect: false },
      { id: "b", text: "She may be late today.", isCorrect: true },
      { id: "c", text: "She skipped her class.", isCorrect: false },
      { id: "d", text: "She changed her route.", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Leaving late raises the possibility of lateness, but other factors could still make her on time — 'may' is the defensible claim.",
    tags: ["bucet", "reading", "inference"],
  },
  {
    id: "bucet-q-rdg-05",
    topicKey: "rdg-main-idea",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "An encyclopedia article about volcanoes is most likely written in which tone?",
    options: [
      { id: "a", text: "Humorous and casual", isCorrect: false },
      { id: "b", text: "Objective and factual", isCorrect: true },
      { id: "c", text: "Angry and persuasive", isCorrect: false },
      { id: "d", text: "Poetic and emotional", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Reference sources use an objective, factual tone to inform without bias.",
    tags: ["bucet", "reading", "author intent"],
  },
  {
    id: "bucet-q-rdg-06",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "What is the next number in the series 3, 6, 12, 24, …?",
    options: [
      { id: "a", text: "30", isCorrect: false },
      { id: "b", text: "36", isCorrect: false },
      { id: "c", text: "48", isCorrect: true },
      { id: "d", text: "72", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "Each term doubles, so the next is 24 × 2 = 48.",
    tags: ["bucet", "reading", "patterns"],
  },
  {
    id: "bucet-q-rdg-07",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Complete the letter series: A, C, E, G, ___.",
    options: [
      { id: "a", text: "H", isCorrect: false },
      { id: "b", text: "I", isCorrect: true },
      { id: "c", text: "J", isCorrect: false },
      { id: "d", text: "K", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "The series skips every other letter, so I follows G.",
    tags: ["bucet", "reading", "patterns"],
  },
  {
    id: "bucet-q-rdg-08",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    stem: "Doctor is to hospital as teacher is to ___.",
    options: [
      { id: "a", text: "Classroom", isCorrect: true },
      { id: "b", text: "Patient", isCorrect: false },
      { id: "c", text: "Medicine", isCorrect: false },
      { id: "d", text: "Lesson", isCorrect: false },
    ],
    correctAnswer: ["a"],
    explanation: "A doctor works in a hospital; analogously, a teacher works in a classroom.",
    tags: ["bucet", "reading", "analogy"],
  },
  {
    id: "bucet-q-rdg-09",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "Consider: “All toads are amphibians. Some amphibians live in water.” Which conclusion necessarily follows?",
    options: [
      { id: "a", text: "All toads live in water.", isCorrect: false },
      { id: "b", text: "All amphibians are toads.", isCorrect: false },
      { id: "c", text: "Toads are amphibians.", isCorrect: true },
      { id: "d", text: "Some toads are not amphibians.", isCorrect: false },
    ],
    correctAnswer: ["c"],
    explanation: "The premise directly states that toads are amphibians; the water statement does not let us conclude about toads specifically.",
    tags: ["bucet", "reading", "arguments"],
  },
  {
    id: "bucet-q-rdg-10",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_SELECT",
    difficulty: "MEDIUM",
    stem: "Which statements, if true, would most strengthen the argument that regular reading improves vocabulary? Select all that apply.",
    options: [
      { id: "a", text: "Students who read daily scored higher on vocabulary tests.", isCorrect: true },
      { id: "b", text: "Vocabulary growth correlates with hours spent reading.", isCorrect: true },
      { id: "c", text: "Some people enjoy watching movies more than reading.", isCorrect: false },
      { id: "d", text: "Vocabulary is mostly inherited.", isCorrect: false },
    ],
    correctAnswer: ["a", "b"],
    explanation: "Evidence linking reading to vocabulary directly supports the claim; the other choices do not.",
    tags: ["bucet", "reading", "arguments"],
  },
  {
    id: "bucet-q-rdg-11",
    topicKey: "rdg-patterns",
    type: "MULTIPLE_CHOICE",
    difficulty: "HARD",
    stem: "During a debate, one speaker says, “You can't trust her argument because she wears glasses.” Which fallacy is this?",
    options: [
      { id: "a", text: "Straw man", isCorrect: false },
      { id: "b", text: "Ad hominem", isCorrect: true },
      { id: "c", text: "Slippery slope", isCorrect: false },
      { id: "d", text: "False dilemma", isCorrect: false },
    ],
    correctAnswer: ["b"],
    explanation: "Ad hominem attacks the person instead of addressing the argument itself.",
    tags: ["bucet", "reading", "fallacies"],
  },
];
export const BUCET_ASSESSMENT = {
  slug: "bucet-mock-exam-demo",
  name: "BUCET Mock Examination — Demo",
  description:
    "A randomized, timed demo mock exam drawn from the BUCET Reviewer question bank. DEMO config: 60 minutes, passing score 60%. This is not a claim about the official BUCET exam specifications.",
  type: "MOCK_EXAM",
  timeLimitMinutes: 60,
  passingScore: 60,
  maxAttempts: 3,
  randomizeQuestions: true,
  randomizeChoices: true,
  showExplanations: true,
  allowRetake: true,
} as const;

export const BUCET_DEMO_STUDENT_EMAIL = "student@aratc.edu.ph";

/** Deterministic subject-key lookup for each topic. */
export const BUCET_TOPIC_SUBJECT: Record<string, string> = Object.fromEntries(
  BUCET_TOPICS.map((t) => {
    const mod = BUCET_MODULES.find((m) => m.key === t.moduleKey);
    if (!mod) throw new Error(`BUCET_TOPICS references unknown module '${t.moduleKey}'`);
    return [t.key, mod.subjectKey];
  }),
);

/** Aggregate question stats (used by the seeder + tests). */
export function bucetQuestionStats() {
  const byTopic: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const q of BUCET_QUESTIONS) {
    byTopic[q.topicKey] = (byTopic[q.topicKey] ?? 0) + 1;
    bySubject[BUCET_TOPIC_SUBJECT[q.topicKey]] =
      (bySubject[BUCET_TOPIC_SUBJECT[q.topicKey]] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    byType[q.type] = (byType[q.type] ?? 0) + 1;
  }
  return { total: BUCET_QUESTIONS.length, byTopic, bySubject, byDifficulty, byType };
}

/**
 * Data-integrity validation for the demo content definition. Throws on any
 * structural defect (used by the test suite AND the seeder before writing).
 */
export function validateBucetSeed(): void {
  const topicKeys = new Set(BUCET_TOPICS.map((t) => t.key));
  const subjectKeys = new Set(BUCET_SUBJECTS.map((s) => s.key));
  const moduleKeys = new Set(BUCET_MODULES.map((m) => m.key));
  const lessonTopicKeys = new Set(BUCET_LESSONS.map((l) => l.topicKey));
  const questionIds = new Set<string>();

  // Hierarchy references are always resolvable and unique.
  for (const m of BUCET_MODULES) {
    if (!subjectKeys.has(m.subjectKey)) throw new Error(`Module ${m.key} → unknown subject`);
  }
  for (const t of BUCET_TOPICS) {
    if (!moduleKeys.has(t.moduleKey)) throw new Error(`Topic ${t.key} → unknown module`);
  }
  if (new Set(BUCET_MODULES.map((m) => m.key)).size !== BUCET_MODULES.length)
    throw new Error("Duplicate module keys");
  if (new Set(BUCET_TOPICS.map((t) => t.key)).size !== BUCET_TOPICS.length)
    throw new Error("Duplicate topic keys");
  if (new Set(BUCET_LESSONS.map((l) => l.slug)).size !== BUCET_LESSONS.length)
    throw new Error("Duplicate lesson slugs");

  // Every topic has exactly one lesson (demo design).
  for (const t of BUCET_TOPICS) {
    if (!lessonTopicKeys.has(t.key)) throw new Error(`Topic ${t.key} has no lesson`);
  }

  for (const q of BUCET_QUESTIONS) {
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

    if (q.passageId === "bucet-passage-eagle" && q.topicKey !== "eng-passage")
      throw new Error(`Question ${q.id} passage linked to wrong topic`);
  }

  // Assessment references a question set equal to the definition (48).
  if (BUCET_ASSESSMENT.randomizeQuestions !== true)
    throw new Error("Demo mock exam should randomize questions (CS#19 demo)");
}