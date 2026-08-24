const fs = require('fs');
let content = fs.readFileSync('apps/api/src/modules/programs/templates.ts', 'utf8');

// Grade 12 definition to insert after Grade 11
const grade12 = `,
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
    }`;

  // Find the closing of Grade 11 (the last grade before cetExams) and insert Grade 12
  const insertPoint = content.lastIndexOf('cetExams: [');
  if (insertPoint === -1) {
    console.error('Could not find cetExams to insert Grade 12');
    process.exit(1);
  }

  // Find the end of the last grade (the ] that closes the grades array)
  const gradesEnd = content.indexOf('],\n  cetExams:', insertPoint - 500);
  if (gradesEnd === -1) {
    console.error('Could not find grades array end');
    process.exit(1);
  }

  const newContent = content.slice(0, gradesEnd) + grade12 + content.slice(gradesEnd);
  fs.writeFileSync('apps/api/src/modules/programs/templates.ts', newContent);
  console.log('Added Grade 12');