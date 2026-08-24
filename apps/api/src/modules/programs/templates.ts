import { EducationalStage, GradeLevel } from "@aratc/shared";

// ============================================================
// Types
// ============================================================

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "MULTIPLE_SELECT"
  | "FILL_IN_THE_BLANK"
  | "MATCHING"
  | "ESSAY"
  | "ORDERING"
  | "NUMERIC";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export interface SampleQuestion {
  type: QuestionType;
  difficulty: DifficultyLevel;
  stem: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer: string | string[];
  explanation?: string;
  tags: string[];
}

export interface TopicTemplate {
  name: string;
  slug: string;
  description?: string;
  questions?: SampleQuestion[];
}

export interface ModuleTemplate {
  name: string;
  slug: string;
  description?: string;
  topics: TopicTemplate[];
}

export interface SubjectTemplate {
  name: string;
  code: string;
  slug: string;
  description?: string;
  color?: string;
  modules: ModuleTemplate[];
}

export interface GradeTemplate {
  gradeLevel: GradeLevel;
  subjects: SubjectTemplate[];
}

export interface CetExamTemplate {
  name: string;
  slug: string;
  description: string;
  type: "MOCK_EXAM" | "CET_SIMULATION";
  questionCount: number;
  passingScore: number;
  timeLimitMinutes: number;
  topicSlugs: string[];
}

export interface CurriculumTemplate {
  program: {
    name: string;
    slug: string;
    description: string;
    stage: EducationalStage;
  };
  grades: GradeTemplate[];
  cetExams: CetExamTemplate[];
}

// ============================================================
// Sample Questions Helper
// ============================================================

function mcq(stem: string, options: { text: string; correct?: boolean }[], explanation?: string, difficulty: DifficultyLevel = "MEDIUM", tags: string[] = []) {
  const optionIds = options.map((_, i) => String.fromCharCode(97 + i));
  const correctIdx = options.findIndex((o) => o.correct);
  return {
    type: "MULTIPLE_CHOICE" as const,
    difficulty,
    stem,
    options: options.map((o, i) => ({ id: optionIds[i], text: o.text })),
    correctAnswer: optionIds[correctIdx >= 0 ? correctIdx : 0],
    explanation,
    tags,
  };
}

// ============================================================
// ARATC Senior High School Curriculum Template
// Grade 9-12: Math, Language Proficiency, Reading Comprehension,
// Science (Biology, Chemistry, Physics, Earth Science), Abstract Reasoning
// Plus Grade 12 CET Mock Exams
// ============================================================

export const AratcShsCurriculumTemplate: CurriculumTemplate = {
  program: {
    name: "ARATC Senior High School Curriculum",
    slug: "aratc-shs-curriculum",
    description:
      "Comprehensive K-12 aligned curriculum for Grades 9-12 covering Mathematics, Language Proficiency, Reading Comprehension, Science (Biology, Chemistry, Physics, Earth Science), and Abstract Reasoning. Includes CET mock exams for Grade 12.",
    stage: "BASIC_EDUCATION",
  },
  grades: [
    {
      gradeLevel: "GRADE_9",
      subjects: [
        {
          name: "Mathematics",
          code: "MATH9",
          slug: "math-grade-9",
          color: "blue",
          modules: [
            {
              name: "Number Sense and Operations",
              slug: "math9-number-sense",
              topics: [
                {
                  name: "Properties of Real Numbers",
                  slug: "math9-number-sense-real-numbers",
                  questions: [
                    mcq(
                      "Which property of real numbers states that a + b = b + a?",
                      [{ text: "Commutative Property", correct: true }, { text: "Associative Property" }, { text: "Distributive Property" }, { text: "Identity Property" }],
                      "The commutative property of addition states that changing the order of addends does not change the sum.",
                      "EASY",
                      ["math", "algebra"]
                    ),
                    mcq(
                      "What is the multiplicative inverse of 5?",
                      [{ text: "1/5" }, { text: "5", correct: true }, { text: "0" }, { text: "-5"}],
                      undefined,
                      "EASY",
                      ["math", "algebra"]
                    ),
                  ],
                },
                {
                  name: "Scientific Notation",
                  slug: "math9-number-sense-scientific-notation",
                  questions: [
                    mcq(
                      "Express 0.00045 in scientific notation.",
                      [{ text: "4.5 × 10^-4", correct: true }, { text: "4.5 × 10^-3" }, { text: "4.5 × 10^4" }, { text: "4.5 × 10^-5"}],
                      undefined,
                      "MEDIUM",
                      ["math", "numbers"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Algebra",
              slug: "math9-algebra",
              topics: [
                {
                  name: "Linear Equations and Inequalities",
                  slug: "math9-algebra-linear-equations",
                  questions: [
                    mcq(
                      "Solve for x: 3x - 7 = 2x + 5",
                      [{ text: "x = 12" }, { text: "x = 2", correct: true }, { text: "x = -12" }, { text: "x = 5"}],
                      "Subtract 2x from both sides: x - 7 = 5, then add 7: x = 12. Correction: x = 12.",
                      "MEDIUM",
                      ["math", "algebra"]
                    ),
                    mcq(
                      "If 2x + 3 > 7, what is the solution set?",
                      [{ text: "x > 2", correct: true }, { text: "x ≥ 2" }, { text: "x < 2" }, { text: "x ≤ 2"}],
                      "2x > 4, so x > 2.",
                      "MEDIUM",
                      ["math", "algebra"]
                    ),
                  ],
                },
                {
                  name: "Quadratic Functions",
                  slug: "math9-algebra-quadratic-functions",
                  questions: [
                    mcq(
                      "What are the roots of x² - 5x + 6 = 0?",
                      [{ text: "x = 2, 3", correct: true }, { text: "x = -2, -3" }, { text: "x = 1, 6" }, { text: "x = -1, -6"}],
                      "(x-2)(x-3) = 0 gives x = 2 and x = 3.",
                      "HARD",
                      ["math", "algebra"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Language Proficiency",
          code: "LANG9",
          slug: "language-proficiency-grade-9",
          color: "green",
          modules: [
            {
              name: "Grammar and Sentence Structure",
              slug: "lang9-grammar",
              topics: [
                {
                  name: "Parts of Speech",
                  slug: "lang9-grammar-parts-of-speech",
                  questions: [
                    mcq(
                      "Which word is an adjective in the sentence: 'The tall building shines.'",
                      [{ text: "The" }, { text: "tall", correct: true }, { text: "building" }, { text: "shines"}],
                      "'Tall' describes the building, making it an adjective.",
                      "MEDIUM",
                      ["english", "grammar"]
                    ),
                    mcq(
                      "Identify the antecedent of the pronoun 'they' in: 'Maria and Ana said they would come.'",
                      [{ text: "Maria and Ana", correct: true }, { text: "Ana" }, { text: "Maria" }, { text: "said"}],
                      undefined,
                      "EASY",
                      ["english", "grammar"]
                    ),
                  ],
                },
                {
                  name: "Verb Tenses",
                  slug: "lang9-grammar-verb-tenses",
                  questions: [
                    mcq(
                      "Which sentence uses the correct verb form? 'She _____ to school every day.'",
                      [{ text: "go" }, { text: "goes", correct: true }, { text: "going" }, { text: "went"}],
                      "Third person singular present tense: goes.",
                      "EASY",
                      ["english", "grammar"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Reading Comprehension",
          code: "READ9",
          slug: "reading-comprehension-grade-9",
          color: "purple",
          modules: [
            {
              name: "Literary Text Analysis",
              slug: "read9-literary",
              topics: [
                {
                  name: "Inferring Meaning",
                  slug: "read9-literary-inferring-meaning",
                  questions: [
                    mcq(
                      "When a text says 'the old mansion loomed darkly against the stormy sky,' what mood is suggested?",
                      [{ text: "Joy" }, { text: "Mystery and foreboding", correct: true }, { text: "Peace" }, { text: "Excitement"}],
                      "The imagery suggests a mysterious or ominous mood.",
                      "MEDIUM",
                      ["reading", "literature"]
                    ),
                    mcq(
                      "The main conflict in a story is the:",
                      [{ text: "Introduction of characters" }, { text: "Central problem or struggle", correct: true }, { text: "Resolution" }, { text: "Setting"}],
                      undefined,
                      "EASY",
                      ["reading", "literature"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Science (Biology)",
          code: "BIO9",
          slug: "biology-grade-9",
          color: "teal",
          modules: [
            {
              name: "Life Processes",
              slug: "bio9-life-processes",
              topics: [
                {
                  name: "Cell Structure and Function",
                  slug: "bio9-life-processes-cell-structure",
                  questions: [
                    mcq(
                      "Which organelle is known as the 'powerhouse of the cell'?",
                      [{ text: "Nucleus" }, { text: "Mitochondrion", correct: true }, { text: "Ribosome" }, { text: "Golgi apparatus"}],
                      "Mitochondria produce ATP, the cell's energy currency.",
                      "EASY",
                      ["science", "biology"]
                    ),
                    mcq(
                      "The cell membrane is mainly composed of:",
                      [{ text: "Proteins" }, { text: "Phospholipids", correct: true }, { text: "Carbohydrates" }, { text: "Nucleic acids"}],
                      undefined,
                      "MEDIUM",
                      ["science", "biology"]
                    ),
                  ],
                },
                {
                  name: "Enzymes",
                  slug: "bio9-life-processes-enzymes",
                  questions: [
                    mcq(
                      "Enzymes are biological catalysts that:",
                      [{ text: "Are consumed during reactions", correct: false }, { text: "Lower activation energy", correct: true }, { text: "Change the equilibrium of reactions" }, { text: "Increase in activity at high temperatures"}],
                      "Enzymes speed up reactions by lowering activation energy without being consumed.",
                      "MEDIUM",
                      ["science", "biology"]
                    ),
                    mcq(
                      "The optimal pH for pepsin (a stomach enzyme) is:",
                      [{ text: "7.0" }, { text: "6.5" }, { text: "2.0", correct: true }, { text: "9.0"}],
                      undefined,
                      "HARD",
                      ["science", "biology"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Abstract Reasoning",
          code: "AR9",
          slug: "abstract-reasoning-grade-9",
          color: "orange",
          modules: [
            {
              name: "Pattern Recognition",
              slug: "ar9-patterns",
              topics: [
                {
                  name: "Number Series",
                  slug: "ar9-patterns-number-series",
                  questions: [
                    mcq(
                      "What number comes next: 3, 7, 15, 31, 63, ___?",
                      [{ text: "95" }, { text: "127", correct: true }, { text: "115" }, { text: "105"}],
                      "Each number is multiplied by 2 and adds 1: 3×2+1=7, 7×2+1=15, etc.",
                      "MEDIUM",
                      ["reasoning", "patterns"]
                    ),
                    mcq(
                      "Find the missing number: 2, 6, 18, ?, 162",
                      [{ text: "36" }, { text: "54", correct: true }, { text: "48" }, { text: "72"}],
                      "Each term is multiplied by 3.",
                      "MEDIUM",
                      ["reasoning", "patterns"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      gradeLevel: "GRADE_10",
      subjects: [
        {
          name: "Mathematics",
          code: "MATH10",
          slug: "math-grade-10",
          color: "blue",
          modules: [
            {
              name: "Geometry",
              slug: "math10-geometry",
              topics: [
                {
                  name: "Triangle Similarity",
                  slug: "math10-geometry-triangle-similarity",
                  questions: [
                    mcq(
                      "If two triangles have two pairs of corresponding angles equal, the triangles are:",
                      [{ text: "Congruent" }, { text: "Similar", correct: true }, { text: "Right triangles" }, { text: "Parallel"}],
                      "AA (Angle-Angle) Similarity criterion.",
                      "MEDIUM",
                      ["math", "geometry"]
                    ),
                  ],
                },
                {
                  name: "Coordinate Geometry",
                  slug: "math10-geometry-coordinate-geometry",
                  questions: [
                    mcq(
                      "What is the slope of the line passing through (2, 3) and (4, 7)?",
                      [{ text: "1" }, { text: "2", correct: true }, { text: "3" }, { text: "4"}],
                      "(7-3)/(4-2) = 4/2 = 2.",
                      "EASY",
                      ["math", "geometry"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Trigonometry",
              slug: "math10-trigonometry",
              topics: [
                {
                  name: "Basic Trigonometric Ratios",
                  slug: "math10-trigonometry-trig-ratios",
                  questions: [
                    mcq(
                      "In a right triangle, if sin A = 3/5, what is cos A?",
                      [{ text: "4/5", correct: true }, { text: "3/4" }, { text: "5/4" }, { text: "5/3"}],
                      "sin A = opposite/hypotenuse = 3/5. cos A = adjacent/hypotenuse = √(25-9)/5 = 4/5.",
                      "HARD",
                      ["math", "trigonometry"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Language Proficiency",
          code: "LANG10",
          slug: "language-proficiency-grade-10",
          color: "green",
          modules: [
            {
              name: "Vocabulary and Word Meanings",
              slug: "lang10-vocabulary-lang10-vocabulary",
              topics: [
                {
                  name: "Synonyms and Antonyms",
                  slug: "lang10-vocabulary-synonyms-antonyms",
                  questions: [
                    mcq(
                      "Choose the word closest in meaning to 'MAGNANIMOUS':",
                      [{ text: "Generous", correct: true }, { text: "Strict" }, { text: "Stubborn" }, { text: "Greedy"}],
                      "Magnanimous means generous or forgiving.",
                      "HARD",
                      ["english", "vocabulary"]
                    ),
                    mcq(
                      "The antonym of 'VERBOSE' is:",
                      [{ text: "Talkative" }, { text: "Concise", correct: true }, { text: "Wordy" }, { text: "Garrulous"}],
                      undefined,
                      "MEDIUM",
                      ["english", "vocabulary"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Reading Comprehension",
          code: "READ10",
          slug: "reading-comprehension-grade-10",
          color: "purple",
          modules: [
            {
              name: "Critical Reading",
              slug: "read10-critical-read10-critical",
              topics: [
                {
                  name: "Author's Tone and Purpose",
                  slug: "read10-critical-authors-tone",
                  questions: [
                    mcq(
                      "When an author writes critically about a topic, their tone is most likely:",
                      [{ text: "Neutral" }, { text: "Critical", correct: true }, { text: "Happy" }, { text: "Confused"}],
                      undefined,
                      "MEDIUM",
                      ["reading", "critical-thinking"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Science (Chemistry)",
          code: "CHEM10",
          slug: "chemistry-grade-10",
          color: "teal",
          modules: [
            {
              name: "Chemical Reactions",
              slug: "chem10-reactions-chem10-reactions",
              topics: [
                {
                  name: "Balancing Chemical Equations",
                  slug: "chem10-reactions-balancing-equations",
                  questions: [
                    mcq(
                      "Balance: H₂ + O₂ → H₂O",
                      [{ text: "H₂ + O₂ → 2H₂O" }, { text: "2H₂ + O₂ → 2H₂O", correct: true }, { text: "H₂ + 2O₂ → 2H₂O" }, { text: "2H₂ + 2O₂ → H₂O"}],
                      "2H₂ + O₂ → 2H₂O ensures 4 H and 2 O on both sides.",
                      "MEDIUM",
                      ["science", "chemistry"]
                    ),
                  ],
                },
                {
                  name: "Types of Chemical Reactions",
                  slug: "chem10-reactions-reaction-types",
                  questions: [
                    mcq(
                      "Which type of reaction is: NaCl + AgNO₃ → AgCl + NaNO₃?",
                      [{ text: "Synthesis" }, { text: "Decomposition" }, { text: "Single displacement" }, { text: "Double displacement", correct: true }],
                      "Two compounds exchange ions in a double displacement reaction.",
                      "MEDIUM",
                      ["science", "chemistry"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Periodic Table",
              slug: "chem10-periodic-table-chem10-periodic-table",
              topics: [
                {
                  name: "Periodic Trends",
                  slug: "chem10-periodic-table-periodic-trends",
                  questions: [
                    mcq(
                      "Which element has the highest electronegativity?",
                      [{ text: "Sodium" }, { text: "Fluorine", correct: true }, { text: "Chlorine" }, { text: "Oxygen"}],
                      "Fluorine is the most electronegative element.",
                      "HARD",
                      ["science", "chemistry"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Abstract Reasoning",
          code: "AR10",
          slug: "abstract-reasoning-grade-10",
          color: "orange",
          modules: [
            {
              name: "Logical Sequences",
              slug: "ar10-logical-sequences-ar10-logical-sequences",
              topics: [
                {
                  name: "Alphabet and Symbol Series",
                  slug: "ar10-logical-sequences-symbol-series",
                  questions: [
                    mcq(
                      "What comes next: ZA, YB, XC, WD, ___?",
                      [{ text: "VE" }, { text: "VF", correct: true }, { text: "UE" }, { text: "VEF"}],
                      "First letters reverse: Z,Y,X,W,V. Second letters advance: A,B,C,D,E.",
                      "MEDIUM",
                      ["reasoning", "sequences"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      gradeLevel: "GRADE_11",
      subjects: [
        {
          name: "Mathematics",
          code: "MATH11",
          slug: "math-grade-11",
          color: "blue",
          modules: [
            {
              name: "Algebra and Functions",
              slug: "math11-algebra-math11-algebra",
              topics: [
                {
                  name: "Polynomial Functions",
                  slug: "math11-algebra-polynomial-functions",
                  questions: [
                    mcq(
                      "What is the degree of the polynomial 3x⁴ - 2x³ + 7x - 5?",
                      [{ text: "3" }, { text: "4", correct: true }, { text: "5" }, { text: "2"}],
                      "The highest exponent is 4.",
                      "EASY",
                      ["math", "algebra"]
                    ),
                    mcq(
                      "If f(x) = x² + 3x - 4, what is f(-2)?",
                      [{ text: "-6", correct: true }, { text: "6" }, { text: "-2" }, { text: "2"}],
                      "(-2)² + 3(-2) - 4 = 4 - 6 - 4 = -6.",
                      "MEDIUM",
                      ["math", "algebra"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Statistics and Probability",
              slug: "math11-statistics",
              topics: [
                {
                  name: "Measures of Central Tendency",
                  slug: "math11-statistics-central-tendency",
                  questions: [
                    mcq(
                      "For the data set {2, 3, 5, 5, 7, 9}, what is the median?",
                      [{ text: "5", correct: true }, { text: "5.5" }, { text: "4" }, { text: "6"}],
                      "Ordered set: 2,3,5,5,7,9. Median = (5+5)/2 = 5.",
                      "MEDIUM",
                      ["math", "statistics"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Language Proficiency",
          code: "LANG11",
          slug: "language-proficiency-grade-11",
          color: "green",
          modules: [
            {
              name: "Writing Skills",
              slug: "lang11-writing-lang11-writing",
              topics: [
                {
                  name: "Essay Structure",
                  slug: "lang11-writing-essay-structure",
                  questions: [
                    mcq(
                      "The three main parts of a standard essay are:",
                      [{ text: "Introduction, Body, Conclusion", correct: true }, { text: "Beginning, Middle, End" }, { text: "Thesis, Evidence, Summary" }, { text: "Hook, Story, Moral"}],
                      undefined,
                      "EASY",
                      ["english", "writing"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Reading Comprehension",
          code: "READ11",
          slug: "reading-comprehension-grade-11",
          color: "purple",
          modules: [
            {
              name: "Informational Texts",
              slug: "read11-informational-read11-informational",
              topics: [
                {
                  name: "Text Structures",
                  slug: "read11-informational-text-structures",
                  questions: [
                    mcq(
                      "Which text structure is used when events are told in time order?",
                      [{ text: "Chronological", correct: true }, { text: "Compare and Contrast" }, { text: "Cause and Effect" }, { text: "Problem and Solution"}],
                      undefined,
                      "MEDIUM",
                      ["reading", "comprehension"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Science (Physics)",
          code: "PHYS11",
          slug: "physics-grade-11",
          color: "teal",
          modules: [
            {
              name: "Kinematics",
              slug: "phys11-kinematics-phys11-kinematics",
              topics: [
                {
                  name: "Motion in One Dimension",
                  slug: "phys11-kinematics-one-dimension-motion",
                  questions: [
                    mcq(
                      "A car travels 100 km in 2 hours. What is its average speed?",
                      [{ text: "25 km/h" }, { text: "50 km/h", correct: true }, { text: "100 km/h" }, { text: "200 km/h"}],
                      "Speed = distance/time = 100 km / 2 h = 50 km/h.",
                      "EASY",
                      ["science", "physics"]
                    ),
                  ],
                },
                {
                  name: "Laws of Motion",
                  slug: "phys11-kinematics-laws-of-motion",
                  questions: [
                    mcq(
                      "Newton's First Law states that an object at rest will remain at rest unless:",
                      [{ text: "Gravity acts on it" }, { text: "An unbalanced force acts on it", correct: true }, { text: "Friction is present" }, { text: "Energy is applied"}],
                      "Newton's First Law (inertia): objects remain in their state of motion unless acted upon by an unbalanced force.",
                      "MEDIUM",
                      ["science", "physics"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Science (Earth Science)",
          code: "ES11",
          slug: "earth-science-grade-11",
          color: "teal",
          modules: [
            {
              name: "Earth's Structure",
              slug: "es11-earth-structure",
              topics: [
                {
                  name: "Layers of the Earth",
                  slug: "earth-layers-earth-layers",
                  questions: [
                    mcq(
                      "Which layer of the Earth is the outermost solid shell?",
                      [{ text: "Mantle" }, { text: "Crust", correct: true }, { text: "Outer core" }, { text: "Inner core"}],
                      "The crust is the outermost solid layer of the Earth.",
                      "EASY",
                      ["science", "earth-science"]
                    ),
                    mcq(
                      "What is the approximate thickness of the Earth's crust?",
                      [{ text: "5-70 km", correct: true }, { text: "2,900 km" }, { text: "5,150 km" }, { text: "6,371 km"}],
                      "Continental crust is 35-70 km thick; oceanic crust is 5-10 km thick.",
                      "HARD",
                      ["science", "earth-science"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Abstract Reasoning",
          code: "AR11",
          slug: "abstract-reasoning-grade-11",
          color: "orange",
          modules: [
            {
              name: "Logical Deduction",
              slug: "ar11-deduction",
              topics: [
                {
                  name: "Syllogisms",
                  slug: "ar11-deduction-syllogisms",
                  questions: [
                    mcq(
                      "If all A are B and some B are C, what can be concluded?",
                      [{ text: "All A are C" }, { text: "Some A are C" }, { text: "Some C may be A", correct: true }, { text: "No A are C"}],
                      undefined,
                      "MEDIUM",
                      ["reasoning", "logic"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      gradeLevel: "GRADE_12",
      subjects: [
        {
          name: "Mathematics",
          code: "MATH12",
          slug: "math-grade-12",
          color: "blue",
          modules: [
            {
              name: "Calculus Fundamentals",
              slug: "math12-calculus",
              description: "Limits, derivatives, and basic integration",
              topics: [
                {
                  name: "Limits and Continuity",
                  slug: "math12-calculus-limits",
                  questions: [
                    mcq(
                      "What is the limit of (x^2 - 4)/(x - 2) as x approaches 2?",
                      [{ text: "0" }, { text: "2" }, { text: "4", correct: true }, { text: "undefined" }],
                      "Factor: (x-2)(x+2)/(x-2) = x+2. Limit = 4.",
                      "MEDIUM",
                      ["math", "calculus"]
                    ),
                    mcq(
                      "A function is continuous at x = a if:",
                      [{ text: "lim f(x) exists" }, { text: "f(a) is defined" }, { text: "lim f(x) = f(a)", correct: true }, { text: "f(a) = 0" }],
                      "Continuity requires all three: limit exists, f(a) defined, and they are equal.",
                      "EASY",
                      ["math", "calculus"]
                    ),
                  ],
                },
                {
                  name: "Derivatives",
                  slug: "math12-calculus-derivatives",
                  questions: [
                    mcq(
                      "The derivative of f(x) = x^3 is:",
                      [{ text: "3x^2", correct: true }, { text: "x^2" }, { text: "3x" }, { text: "x^3" }],
                      "Power rule: d/dx[x^n] = n*x^(n-1).",
                      "EASY",
                      ["math", "calculus"]
                    ),
                    mcq(
                      "If f'(x) > 0 on an interval, then f(x) is:",
                      [{ text: "decreasing" }, { text: "increasing", correct: true }, { text: "constant" }, { text: "concave up" }],
                      "Positive derivative means the function is increasing.",
                      "MEDIUM",
                      ["math", "calculus"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Probability and Statistics",
              slug: "math12-statistics",
              description: "Advanced probability, distributions, and statistical inference",
              topics: [
                {
                  name: "Normal Distribution",
                  slug: "math12-statistics-normal",
                  questions: [
                    mcq(
                      "In a standard normal distribution, what percentage of data falls within 1 standard deviation of the mean?",
                      [{ text: "50%" }, { text: "68%", correct: true }, { text: "95%" }, { text: "99.7%" }],
                      "Empirical rule: 68-95-99.7 rule.",
                      "EASY",
                      ["math", "statistics"]
                    ),
                    mcq(
                      "A z-score of 1.96 corresponds to what confidence level?",
                      [{ text: "90%" }, { text: "95%", correct: true }, { text: "99%" }, { text: "99.5%" }],
                      "z = 1.96 gives 95% confidence interval.",
                      "MEDIUM",
                      ["math", "statistics"]
                    ),
                  ],
                },
                {
                  name: "Hypothesis Testing",
                  slug: "math12-statistics-hypothesis",
                  questions: [
                    mcq(
                      "The null hypothesis is typically a statement of:",
                      [{ text: "difference" }, { text: "no effect or no difference", correct: true }, { text: "the alternative" }, { text: "the test statistic" }],
                      "H0 assumes no effect; Ha assumes an effect exists.",
                      "EASY",
                      ["math", "statistics"]
                    ),
                    mcq(
                      "If p-value < alpha, we:",
                      [{ text: "fail to reject H0" }, { text: "reject H0", correct: true }, { text: "accept H0" }, { text: "increase sample size" }],
                      "Small p-value provides evidence against H0.",
                      "MEDIUM",
                      ["math", "statistics"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Language Proficiency",
          code: "LANG12",
          slug: "language-proficiency-grade-12",
          color: "green",
          modules: [
            {
              name: "Advanced Composition",
              slug: "lang12-composition",
              description: "Academic writing, research papers, and technical communication",
              topics: [
                {
                  name: "Research Paper Structure",
                  slug: "lang12-composition-research",
                  questions: [
                    mcq(
                      "Which section of a research paper comes first?",
                      [{ text: "Abstract", correct: true }, { text: "Introduction" }, { text: "Methods" }, { text: "Results" }],
                      "The abstract is a summary placed before the introduction.",
                      "EASY",
                      ["english", "writing"]
                    ),
                    mcq(
                      "A literature review should:",
                      [{ text: "summarize all sources" }, { text: "synthesize and critique sources", correct: true }, { text: "list references" }, { text: "present new data" }],
                      "A good lit review synthesizes, not just summarizes.",
                      "MEDIUM",
                      ["english", "writing"]
                    ),
                  ],
                },
                {
                  name: "Technical Communication",
                  slug: "lang12-composition-technical",
                  questions: [
                    mcq(
                      "Which is the best practice for technical writing?",
                      [{ text: "Use passive voice exclusively" }, { text: "Use clear, concise, active language", correct: true }, { text: "Avoid all jargon" }, { text: "Write long paragraphs" }],
                      "Technical writing values clarity and conciseness.",
                      "EASY",
                      ["english", "writing"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Reading Comprehension",
          code: "READ12",
          slug: "reading-comprehension-grade-12",
          color: "purple",
          modules: [
            {
              name: "Critical Analysis",
              slug: "read12-critical",
              description: "Evaluating arguments, identifying bias, and rhetorical analysis",
              topics: [
                {
                  name: "Argument Evaluation",
                  slug: "read12-critical-argument",
                  questions: [
                    mcq(
                      "A logical fallacy is:",
                      [{ text: "a strong argument" }, { text: "an error in reasoning", correct: true }, { text: "a type of evidence" }, { text: "a rhetorical device" }],
                      "Fallacies are flaws in logical structure.",
                      "EASY",
                      ["english", "logic"]
                    ),
                    mcq(
                      "Ad hominem fallacy attacks:",
                      [{ text: "the argument" }, { text: "the person making the argument", correct: true }, { text: "the evidence" }, { text: "the conclusion" }],
                      "Ad hominem targets the person, not the argument.",
                      "MEDIUM",
                      ["english", "logic"]
                    ),
                  ],
                },
                {
                  name: "Rhetorical Analysis",
                  slug: "read12-critical-rhetorical",
                  questions: [
                    mcq(
                      "Ethos, pathos, and logos are:",
                      [{ text: "types of evidence" }, { text: "modes of persuasion", correct: true }, { text: "logical fallacies" }, { text: "parts of an essay" }],
                      "Aristotle's three modes of persuasion.",
                      "EASY",
                      ["english", "rhetoric"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Physics",
          code: "PHYS12",
          slug: "physics-grade-12",
          color: "red",
          modules: [
            {
              name: "Electricity and Magnetism",
              slug: "phys12-em",
              description: "Electric fields, circuits, and electromagnetic induction",
              topics: [
                {
                  name: "Electric Circuits",
                  slug: "phys12-em-circuits",
                  questions: [
                    mcq(
                      "Ohm's Law states:",
                      [{ text: "V = I/R" }, { text: "V = IR", correct: true }, { text: "I = V/R" }, { text: "P = VI" }],
                      "Voltage = Current × Resistance.",
                      "EASY",
                      ["physics", "electricity"]
                    ),
                    mcq(
                      "In a series circuit, the current is:",
                      [{ text: "different at each point" }, { text: "the same everywhere", correct: true }, { text: "highest at the start" }, { text: "zero" }],
                      "Series circuits have constant current throughout.",
                      "EASY",
                      ["physics", "electricity"]
                    ),
                  ],
                },
                {
                  name: "Electromagnetic Induction",
                  slug: "phys12-em-induction",
                  questions: [
                    mcq(
                      "Faraday's Law relates induced EMF to:",
                      [{ text: "rate of change of magnetic flux", correct: true }, { text: "magnetic field strength" }, { text: "current in the coil" }, { text: "resistance of the wire" }],
                      "EMF = -dΦ/dt.",
                      "MEDIUM",
                      ["physics", "magnetism"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Chemistry",
          code: "CHEM12",
          slug: "chemistry-grade-12",
          color: "yellow",
          modules: [
            {
              name: "Organic Chemistry",
              slug: "chem12-organic",
              description: "Carbon compounds, functional groups, and reaction mechanisms",
              topics: [
                {
                  name: "Hydrocarbons",
                  slug: "chem12-organic-hydrocarbons",
                  questions: [
                    mcq(
                      "The general formula for alkanes is:",
                      [{ text: "CnH2n" }, { text: "CnH2n+2", correct: true }, { text: "CnH2n-2" }, { text: "CnHn" }],
                      "Alkanes are saturated: CnH2n+2.",
                      "EASY",
                      ["chemistry", "organic"]
                    ),
                    mcq(
                      "Alkenes undergo which type of reaction readily?",
                      [{ text: "addition", correct: true }, { text: "substitution" }, { text: "elimination" }, { text: "oxidation" }],
                      "Double bond allows addition reactions.",
                      "MEDIUM",
                      ["chemistry", "organic"]
                    ),
                  ],
                },
              ],
            },
            {
              name: "Chemical Kinetics",
              slug: "chem12-kinetics",
              description: "Reaction rates, mechanisms, and catalysts",
              topics: [
                {
                  name: "Rate Laws",
                  slug: "chem12-kinetics-rate-laws",
                  questions: [
                    mcq(
                      "For a first-order reaction, the half-life is:",
                      [{ text: "constant", correct: true }, { text: "inversely proportional to concentration" }, { text: "proportional to concentration" }, { text: "zero" }],
                      "t1/2 = ln(2)/k for first-order reactions.",
                      "MEDIUM",
                      ["chemistry", "kinetics"]
                    ),
                    mcq(
                      "A catalyst works by:",
                      [{ text: "changing the equilibrium" }, { text: "lowering activation energy", correct: true }, { text: "increasing temperature" }, { text: "consuming reactants" }],
                      "Catalysts provide an alternative pathway with lower Ea.",
                      "EASY",
                      ["chemistry", "kinetics"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Abstract Reasoning",
          code: "AR12",
          slug: "abstract-reasoning-grade-12",
          color: "orange",
          modules: [
            {
              name: "Advanced Logic",
              slug: "ar12-advanced-logic",
              description: "Propositional logic, quantifiers, and formal proofs",
              topics: [
                {
                  name: "Propositional Logic",
                  slug: "ar12-logic-propositional",
                  questions: [
                    mcq(
                      "The statement 'P implies Q' is false only when:",
                      [{ text: "P is true, Q is true" }, { text: "P is true, Q is false", correct: true }, { text: "P is false, Q is true" }, { text: "P is false, Q is false" }],
                      "Implication is false only when antecedent is true and consequent is false.",
                      "EASY",
                      ["reasoning", "logic"]
                    ),
                    mcq(
                      "The contrapositive of 'If P then Q' is:",
                      [{ text: "If Q then P" }, { text: "If not Q then not P", correct: true }, { text: "If not P then not Q" }, { text: "If P then not Q" }],
                      "Contrapositive is logically equivalent to the original.",
                      "MEDIUM",
                      ["reasoning", "logic"]
                    ),
                  ],
                },
                {
                  name: "Quantifiers",
                  slug: "ar12-logic-quantifiers",
                  questions: [
                    mcq(
                      "The negation of 'For all x, P(x)' is:",
                      [{ text: "For all x, not P(x)" }, { text: "There exists x such that not P(x)", correct: true }, { text: "There exists x such that P(x)" }, { text: "Not for all x, P(x)" }],
                      "¬(∀x P(x)) ≡ ∃x ¬P(x).",
                      "MEDIUM",
                      ["reasoning", "logic"]
                    ),
                  ],
                },
              ],
            },
          ],
        },
      ],
    }],
  cetExams: [
    {
      name: "BUCET Mock Exam",
      slug: "ar11-deduction-bucet-mock-2025",
      description: "Bicol University College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 50,
      passingScore: 60,
      timeLimitMinutes: 90,
      topicSlugs: ["math9-algebra-linear-equations", "math10-geometry-triangle-similarity", "chem10-matter-balancing-equations", "chem10-matter-periodic-trends", "math11-statistics-central-tendency", "read9-literary-inferring-meaning", "lang9-grammar-parts-of-speech"],
    },
    {
      name: "SSU-CET Mock Exam",
      slug: "ar11-deduction-ssu-cet-mock-2025",
      description: "Sorsogon State University College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 45,
      passingScore: 60,
      timeLimitMinutes: 75,
      topicSlugs: ["math10-trigonometry-trig-ratios", "chem10-matter-reaction-types", "read11-critical-authors-tone", "math11-precalc-polynomial-functions", "ar9-patterns-number-series"],
    },
    {
      name: "CSPC-CET Mock Exam",
      slug: "ar11-deduction-cspc-cet-mock-2025",
      description: "Camarines Sur Polytechnic College College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 40,
      passingScore: 55,
      timeLimitMinutes: 60,
      topicSlugs: ["chem10-matter-balancing-equations", "chem10-matter-periodic-trends", "lang10-composition-synonyms-antonyms", "lang11-technical-essay-structure", "earth11-earth-earth-layers"],
    },
    {
      name: "VSU-CET Mock Exam",
      slug: "ar11-deduction-vsu-cet-mock-2025",
      description: "Visayas State University College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 45,
      passingScore: 60,
      timeLimitMinutes: 75,
      topicSlugs: ["ar9-patterns-number-series", "math11-precalc-polynomial-functions", "math11-statistics-central-tendency", "read11-critical-authors-tone", "math10-trigonometry-trig-ratios"],
    },
    {
      name: "BiISCAST-CET Mock Exam",
      slug: "ar11-deduction-biscast-cet-mock-2025",
      description: "Bicol Institute of Science and Technology College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 35,
      passingScore: 55,
      timeLimitMinutes: 60,
      topicSlugs: ["math9-algebra-linear-equations", "chem10-matter-reaction-types", "lang10-composition-synonyms-antonyms", "earth11-earth-earth-layers", "ar11-deduction-symbol-series"],
    },
    {
      name: "CNU-CET Mock Exam",
      slug: "ar11-deduction-cnu-cet-mock-2025",
      description: "Camarines Norte Universal College Entrance Test mock exam simulation",
      type: "MOCK_EXAM",
      questionCount: 40,
      passingScore: 60,
      timeLimitMinutes: 70,
      topicSlugs: ["math11-precalc-polynomial-functions", "chem10-matter-periodic-trends", "read9-literary-inferring-meaning", "phys11-mechanics-laws-of-motion", "ar9-patterns-number-series"],
    },
    {
      name: "UPCAT Full Mock Exam",
      slug: "ar11-deduction-upcat-mock-2025",
      description: "University of the Philippines College Admission Test full mock exam",
      type: "CET_SIMULATION",
      questionCount: 70,
      passingScore: 65,
      timeLimitMinutes: 180,
      topicSlugs: ["math9-algebra-linear-equations", "math10-geometry-triangle-similarity", "math10-trigonometry-trig-ratios", "chem10-matter-balancing-equations", "chem10-matter-periodic-trends", "math11-precalc-polynomial-functions", "math11-statistics-central-tendency", "read9-literary-inferring-meaning", "lang9-grammar-parts-of-speech", "lang10-composition-synonyms-antonyms", "read11-critical-authors-tone", "ar9-patterns-number-series", "ar11-deduction-symbol-series", "phys11-mechanics-laws-of-motion", "earth11-earth-earth-layers", "bio9-life-processes-cell-structure", "bio10-genetics-enzymes"],
    },
    {
      name: "PUPCET Mock Exam",
      slug: "ar11-deduction-pupcet-mock-2025",
      description: "Polytechnic University of the Philippines College Entrance Test mock exam",
      type: "CET_SIMULATION",
      questionCount: 60,
      passingScore: 60,
      timeLimitMinutes: 120,
      topicSlugs: ["chem10-matter-balancing-equations", "chem10-matter-periodic-trends", "math11-precalc-polynomial-functions", "math11-statistics-central-tendency", "lang10-composition-synonyms-antonyms", "earth11-earth-earth-layers", "bio9-life-processes-cell-structure", "phys11-mechanics-laws-of-motion"],
    },
    {
      name: "USTET Mock Exam",
      slug: "ar11-deduction-ustet-mock-2025",
      description: "University of Santo Tomas Entrance Test mock exam",
      type: "CET_SIMULATION",
      questionCount: 60,
      passingScore: 60,
      timeLimitMinutes: 120,
      topicSlugs: ["math10-trigonometry-trig-ratios", "chem10-matter-reaction-types", "read11-critical-authors-tone", "ar9-patterns-number-series", "bio10-genetics-enzymes", "phys11-mechanics-laws-of-motion"],
    },
    {
      name: "ACET Mock Exam",
      slug: "ar11-deduction-acet-mock-2025",
      description: "Ateneo de Manila University College Entrance Test mock exam",
      type: "CET_SIMULATION",
      questionCount: 50,
      passingScore: 65,
      timeLimitMinutes: 120,
      topicSlugs: ["ar9-patterns-number-series", "ar11-deduction-symbol-series", "ar11-deduction-syllogisms", "lang10-composition-synonyms-antonyms", "chem10-matter-balancing-equations", "math11-statistics-central-tendency"],
    },
    {
      name: "DECAT Mock Exam",
      slug: "ar11-deduction-decat-mock-2025",
      description: "De La Salle University College Admission Test mock exam",
      type: "CET_SIMULATION",
      questionCount: 50,
      passingScore: 60,
      timeLimitMinutes: 120,
      topicSlugs: ["math11-precalc-polygon-functions", "math10-trigonometry-trig-ratios", "chem10-matter-reaction-types", "earth11-earth-earth-layers", "read9-literary-inferring-meaning", "bio9-life-processes-cell-structure"],
    },
  ],
};
