import type { BrandSettings, GeneralSettings } from "@aratc/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface FetchOptions extends RequestInit {
  token?: string;
  _skipAuth?: boolean; // Internal flag to skip auto-token
}

/**
 * Get auth token from localStorage (client-side only)
 */
function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, _skipAuth, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Use provided token, or auto-get from localStorage (unless _skipAuth is true)
  const authToken = _skipAuth ? undefined : (token || getToken());
  if (authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================
// Subjects API
// ============================================================
export const subjectsApi = {
  list: () => apiFetch("/subjects"),
  getById: (id: string) => apiFetch(`/subjects/${id}`),
  getBySlug: (slug: string) => apiFetch(`/subjects/slug/${slug}`),
  getStats: (id: string) => apiFetch(`/subjects/${id}/stats`),
  create: (data: any, token?: string) =>
    apiFetch("/subjects", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/subjects/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/subjects/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/subjects/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/subjects/${id}`, { method: "DELETE", token }),
};

// ============================================================
// Curriculum API
// ============================================================
export const curriculumApi = {
  list: (programId?: string) =>
    apiFetch(programId ? `/curriculums?programId=${programId}` : "/curriculums"),
  getById: (id: string) => apiFetch(`/curriculums/${id}`),
  getBySlug: (slug: string) => apiFetch(`/curriculums/slug/${slug}`),
  getStats: (id: string) => apiFetch(`/curriculums/${id}/stats`),
  create: (data: any, token?: string) =>
    apiFetch("/curriculums", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/curriculums/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/curriculums/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/curriculums/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/curriculums/${id}`, { method: "DELETE", token }),
  addItem: (curriculumId: string, data: any, token?: string) =>
    apiFetch(`/curriculums/${curriculumId}/items`, { method: "POST", body: JSON.stringify(data), token }),
  updateItem: (curriculumId: string, itemId: string, data: any, token?: string) =>
    apiFetch(`/curriculums/${curriculumId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data), token }),
  reorderItems: (curriculumId: string, itemIds: string[], token?: string) =>
    apiFetch(`/curriculums/${curriculumId}/items`, { method: "PUT", body: JSON.stringify(itemIds), token }),
  removeItem: (curriculumId: string, itemId: string, token?: string) =>
    apiFetch(`/curriculums/${curriculumId}/items/${itemId}`, { method: "DELETE", token }),
};

// ============================================================
// Modules API
// ============================================================
export const modulesApi = {
  list: (subjectId?: string) =>
    apiFetch(subjectId ? `/modules?subjectId=${subjectId}` : "/modules"),
  getById: (id: string) => apiFetch(`/modules/${id}`),
  create: (data: any, token?: string) =>
    apiFetch("/modules", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/modules/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/modules/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/modules/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/modules/${id}`, { method: "DELETE", token }),
  reorder: (subjectId: string, moduleIds: string[], token?: string) =>
    apiFetch(`/modules/subject/${subjectId}/reorder`, { method: "PUT", body: JSON.stringify(moduleIds), token }),
};

// ============================================================
// Topics API
// ============================================================
export const topicsApi = {
  list: (moduleId?: string) =>
    apiFetch(moduleId ? `/topics?moduleId=${moduleId}` : "/topics"),
  listAll: () => apiFetch("/topics/all"),
  getById: (id: string) => apiFetch(`/topics/${id}`),
  create: (data: any, token?: string) =>
    apiFetch("/topics", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/topics/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/topics/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/topics/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/topics/${id}`, { method: "DELETE", token }),
  reorder: (moduleId: string, topicIds: string[], token?: string) =>
    apiFetch(`/topics/module/${moduleId}/reorder`, { method: "PUT", body: JSON.stringify(topicIds), token }),
};

// ============================================================
// Lessons API
// ============================================================
export const lessonsApi = {
  list: (topicId?: string) =>
    apiFetch(topicId ? `/lessons?topicId=${topicId}` : "/lessons"),
  getById: (id: string) => apiFetch(`/lessons/${id}`),
  getBySubject: (subjectId: string) => apiFetch(`/lessons/subject/${subjectId}`),
  getStats: (topicId: string) => apiFetch(`/lessons/topic/${topicId}/stats`),
  create: (data: any, token?: string) =>
    apiFetch("/lessons", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/lessons/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/lessons/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/lessons/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/lessons/${id}`, { method: "DELETE", token }),
  reorder: (topicId: string, lessonIds: string[], token?: string) =>
    apiFetch(`/lessons/topic/${topicId}/reorder`, { method: "PUT", body: JSON.stringify(lessonIds), token }),
  // Lesson question responses (Phase 4)
  respondToQuestion: (
    lessonId: string,
    questionId: string,
    data: { answer?: unknown; isCorrect: boolean; pointsEarned?: number; blockId?: string },
    token?: string
  ) =>
    apiFetch(`/lessons/${lessonId}/questions/${questionId}/respond`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  getQuestionResponse: async (lessonId: string, questionId: string, token?: string) => {
    try {
      return await apiFetch<{ answer?: unknown; isCorrect: boolean; pointsEarned: number; attemptedAt: string }>(
        `/lessons/${lessonId}/questions/${questionId}/response`,
        { token }
      );
    } catch (e: any) {
      // 404 = no prior response recorded; treat as "no previous answer"
      if (e?.message?.includes("404") || e?.message?.includes("No response recorded")) {
        return null;
      }
      throw e;
    }
  },
};

// ============================================================
// Progress API (per-learner)
// ============================================================
export const progressApi = {
  getLesson: (lessonId: string) => apiFetch(`/lessons/${lessonId}/progress`),
  getLessonWithQuestions: (lessonId: string) =>
    apiFetch(`/lessons/${lessonId}/progress/questions`),
  setLesson: (lessonId: string, completed: boolean, token?: string) =>
    apiFetch(`/lessons/${lessonId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
      token,
    }),
  progression: (programId?: string) =>
    apiFetch(`/progression${programId ? `?programId=${programId}` : ""}`),
};

// ============================================================
// Progression API (College Readiness ladder)
// ============================================================
export const progressionApi = {
  get: (programId?: string) =>
    apiFetch(
      `/progression${programId ? `?programId=${programId}` : ""}`
    ),
  weakTopics: (programId?: string) =>
    apiFetch(`/progression/weak-topics${programId ? `?programId=${programId}` : ""}`),
  activity: (limit?: number) =>
    apiFetch(`/progression/activity${limit ? `?limit=${limit}` : ""}`),
  recommendations: (assessmentId: string) =>
    apiFetch(`/progression/assessments/${assessmentId}/recommendations`),
};

// ============================================================
// Batches API (teacher classes)
// ============================================================

export interface BatchMemberRow {
  id: string;
  currentGradeLevel: string | null;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
}

export interface BatchDetail {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  isOwner: boolean;
  owner: { id: string; firstName: string; lastName: string };
  teachers: { id: string; firstName: string; lastName: string }[];
  program: { id: string; name: string };
  members: BatchMemberRow[];
}

export const batchesApi = {
  my: () => apiFetch("/batches/my"),
  create: (data: { name: string; programId: string; description?: string }, token?: string) =>
    apiFetch("/batches", { method: "POST", body: JSON.stringify(data), token }),
  myReport: () => apiFetch("/batches/my/report"),
  getById: (id: string): Promise<BatchDetail> => apiFetch(`/batches/${id}`),
  addMember: (
    id: string,
    email: string,
    token?: string
  ): Promise<BatchMemberRow> =>
    apiFetch(`/batches/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ email }),
      token,
    }),
  removeMember: (id: string, memberId: string, token?: string) =>
    apiFetch(`/batches/${id}/members/${memberId}`, { method: "DELETE", token }),
};

// ============================================================
// Media API (uploads)
// ============================================================
export const mediaApi = {
  upload: (
    payload: { contentBase64: string; mimeType: string; filename?: string },
    token?: string
  ) => apiFetch("/media", { method: "POST", body: JSON.stringify(payload), token }),
};

// ============================================================
// Question Bank API
// ============================================================
export const questionsApi = {
  list: (filters?: { subjectId?: string; topicId?: string; type?: string; difficulty?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
    if (filters?.topicId) params.append("topicId", filters.topicId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.difficulty) params.append("difficulty", filters.difficulty);
    if (filters?.status) params.append("status", filters.status);
    const query = params.toString();
    return apiFetch(`/questions${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiFetch(`/questions/${id}`),
  getStats: (id?: string) => apiFetch(id ? `/questions/${id}/stats` : "/questions/stats"),
  getBySubject: (subjectId: string) => apiFetch(`/questions/subject/${subjectId}`),
  getByTopic: (topicId: string) => apiFetch(`/questions/topic/${topicId}`),
  getByExam: (examId: string) => apiFetch(`/questions/exam/${examId}`),
  getByAssessment: (assessmentId: string) => apiFetch(`/questions/assessment/${assessmentId}`),
  create: (data: any, token?: string) =>
    apiFetch("/questions", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/questions/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  review: (id: string, status: "PUBLISHED" | "UNDER_REVIEW", token?: string) =>
    apiFetch(`/questions/${id}/review`, { method: "PATCH", body: JSON.stringify({ status }), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/questions/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/questions/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/questions/${id}`, { method: "DELETE", token }),
  // Links
  createLink: (questionId: string, data: any, token?: string) =>
    apiFetch(`/questions/${questionId}/links`, { method: "POST", body: JSON.stringify(data), token }),
  updateLink: (linkId: string, data: any, token?: string) =>
    apiFetch(`/questions/links/${linkId}`, { method: "PATCH", body: JSON.stringify(data), token }),
  removeLink: (linkId: string, token?: string) =>
    apiFetch(`/questions/links/${linkId}`, { method: "DELETE", token }),
  // PDF Import workflow
  mine: () => apiFetch("/questions/mine"),

  /** Step 1 — upload a PDF and get its raw text back (no AI involved) */
  extractPdfText: async (
    file: File,
    programName?: string,
    subjectName?: string
  ): Promise<{ pdfText: string; programName: string | null; subjectName: string | null }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (programName) formData.append("programName", programName);
    if (subjectName) formData.append("subjectName", subjectName);

    const response = await fetch(`${API_BASE_URL}/questions/import/extract-text`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || error?.message || `HTTP error ${response.status}`);
    }
    return response.json();
  },

  /** Step 2 — send reviewed PDF text to Gemini for structured extraction */
  previewExtraction: (payload: {
    pdfText: string;
    programName?: string | null;
    subjectName?: string | null;
  }): Promise<ImportPreviewResult> =>
    apiFetch("/questions/import/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Step 3 — import reviewed questions into the question bank */
  importBulk: (payload: {
    questions: any[];
    programId: string;
    subjectId?: string | null;
    topicId?: string | null;
  }): Promise<{ message: string; created: number; skipped: number; errors: string[] }> =>
    apiFetch("/questions/import/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface ExtractedQuestionPreview {
  questionNumber: number;
  pageNumber?: number | null;
  type:
    | "multiple_choice"
    | "multiple_select"
    | "true_false"
    | "identification"
    | "fill_in_the_blank"
    | "matching_type"
    | "essay";
  question: string;
  choices?: { label: string; text: string }[] | null;
  correctAnswer?: string | null;
  correctAnswerText?: string | null;
  explanation?: string | null;
  hasImage?: boolean;
  confidence?: number;
  extractionNote?: string | null;
}

export interface ImportPreviewResult {
  documentSummary: {
    title?: string | null;
    totalQuestions: number;
    questionTypes: string[];
    answerKeyLocation?: string | null;
    hasAnswerKey: boolean;
    processingWarnings: string[];
  };
  questions: ExtractedQuestionPreview[];
}

// ============================================================
// Assessments API
// ============================================================
export const assessmentsApi = {
  list: (filters?: { programId?: string; type?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.programId) params.append("programId", filters.programId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    const query = params.toString();
    return apiFetch(`/assessments${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiFetch(`/assessments/${id}`),
  getBySlug: (slug: string) => apiFetch(`/assessments/slug/${slug}`),
  getStats: (id: string) => apiFetch(`/assessments/${id}/stats`),
  create: (data: any, token?: string) =>
    apiFetch("/assessments", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/assessments/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/assessments/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/assessments/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/assessments/${id}`, { method: "DELETE", token }),
  // Questions
  addQuestion: (assessmentId: string, data: any, token?: string) =>
    apiFetch(`/assessments/${assessmentId}/questions`, { method: "POST", body: JSON.stringify(data), token }),
  removeQuestion: (assessmentId: string, questionId: string, token?: string) =>
    apiFetch(`/assessments/${assessmentId}/questions/${questionId}`, { method: "DELETE", token }),
  reorderQuestions: (assessmentId: string, questionIds: string[], token?: string) =>
    apiFetch(`/assessments/${assessmentId}/questions`, { method: "PUT", body: JSON.stringify(questionIds), token }),
  autoGenerate: (assessmentId: string, data: any, token?: string) =>
    apiFetch(`/assessments/${assessmentId}/auto-generate`, { method: "POST", body: JSON.stringify(data), token }),
  // Learner
  start: (assessmentId: string, token?: string) =>
    apiFetch(`/assessments/${assessmentId}/start`, { method: "POST", token }),
  submit: (attemptId: string, answers: any[], token?: string) =>
    apiFetch(`/assessments/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers }), token }),
  myAttempts: () => apiFetch(`/assessments/me/attempts`),
  getAttempt: (attemptId: string) => apiFetch(`/assessments/attempts/${attemptId}`),
  recommendations: (assessmentId: string) => apiFetch(`/assessments/${assessmentId}/recommendations`),
};

// ============================================================
// CET API
// ============================================================
export const cetApi = {
  // Universities
  listUniversities: () => apiFetch("/cet/universities"),
  getUniversity: (id: string) => apiFetch(`/cet/universities/${id}`),
  createUniversity: (data: any, token?: string) =>
    apiFetch("/cet/universities", { method: "POST", body: JSON.stringify(data), token }),
  updateUniversity: (id: string, data: any, token?: string) =>
    apiFetch(`/cet/universities/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  deleteUniversity: (id: string, token?: string) =>
    apiFetch(`/cet/universities/${id}`, { method: "DELETE", token }),

  // Exams
  listExams: () => apiFetch("/cet/exams"),
  getExam: (id: string) => apiFetch(`/cet/exams/${id}`),
  getExamStats: (id: string) => apiFetch(`/cet/exams/${id}/stats`),
  createExam: (data: any, token?: string) =>
    apiFetch("/cet/exams", { method: "POST", body: JSON.stringify(data), token }),
  updateExam: (id: string, data: any, token?: string) =>
    apiFetch(`/cet/exams/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publishExam: (id: string, token?: string) =>
    apiFetch(`/cet/exams/${id}/publish`, { method: "PATCH", token }),
  archiveExam: (id: string, token?: string) =>
    apiFetch(`/cet/exams/${id}/archive`, { method: "PATCH", token }),
  deleteExam: (id: string, token?: string) =>
    apiFetch(`/cet/exams/${id}`, { method: "DELETE", token }),

  // Profiles
  listProfiles: (examId?: string) =>
    apiFetch(examId ? `/cet/profiles?examId=${examId}` : "/cet/profiles"),
  getProfile: (id: string) => apiFetch(`/cet/profiles/${id}`),
  getProfileStats: (id: string) => apiFetch(`/cet/profiles/${id}/stats`),
  createProfile: (data: any, token?: string) =>
    apiFetch("/cet/profiles", { method: "POST", body: JSON.stringify(data), token }),
  updateProfile: (id: string, data: any, token?: string) =>
    apiFetch(`/cet/profiles/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publishProfile: (id: string, token?: string) =>
    apiFetch(`/cet/profiles/${id}/publish`, { method: "PATCH", token }),
  archiveProfile: (id: string, token?: string) =>
    apiFetch(`/cet/profiles/${id}/archive`, { method: "PATCH", token }),
  deleteProfile: (id: string, token?: string) =>
    apiFetch(`/cet/profiles/${id}`, { method: "DELETE", token }),
  // Coverage
  addCoverage: (profileId: string, data: any, token?: string) =>
    apiFetch(`/cet/profiles/${profileId}/coverage`, { method: "POST", body: JSON.stringify(data), token }),
  updateCoverage: (coverageId: string, data: any, token?: string) =>
    apiFetch(`/cet/profiles/coverage/${coverageId}`, { method: "PATCH", body: JSON.stringify(data), token }),
  removeCoverage: (coverageId: string, token?: string) =>
    apiFetch(`/cet/profiles/coverage/${coverageId}`, { method: "DELETE", token }),

  // Program links
  getProgramExams: (programId: string) => apiFetch(`/cet/programs/${programId}/exams`),
  linkProgramExam: (programId: string, data: any, token?: string) =>
    apiFetch(`/cet/programs/${programId}/exams`, { method: "POST", body: JSON.stringify(data), token }),
  unlinkProgramExam: (programId: string, examId: string, token?: string) =>
    apiFetch(`/cet/programs/${programId}/exams/${examId}`, { method: "DELETE", token }),
};

// ============================================================
// Programs API (extended)
// ============================================================
export const programsApi = {
  list: () => apiFetch("/programs"),
  getById: (id: string, token?: string) => apiFetch(`/programs/by-id/${id}`, { token }),
  getBySlug: (slug: string) => apiFetch(`/programs/${slug}`),
  create: (data: any, token?: string) =>
    apiFetch("/programs", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/programs/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/programs/${id}/publish`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/programs/${id}`, { method: "DELETE", token }),
  createFromTemplate: (token?: string) =>
    apiFetch("/programs/template", { method: "POST", token }),
  generateCetExams: (programId: string, token?: string) =>
    apiFetch(`/programs/${programId}/cet-exams`, { method: "POST", token }),
};

// ============================================================
// Passages API
// ============================================================
export const passagesApi = {
  list: (token?: string) =>
    apiFetch("/passages", { token }),
  getById: (id: string, token?: string) =>
    apiFetch(`/passages/${id}`, { token }),
  create: (data: any, token?: string) =>
    apiFetch("/passages", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/passages/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/passages/${id}/publish`, { method: "PATCH", token }),
  archive: (id: string, token?: string) =>
    apiFetch(`/passages/${id}/archive`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/passages/${id}`, { method: "DELETE", token }),
};

// ============================================================
// Site Settings API (brand theme + organization info)
// ============================================================
export const settingsApi = {
  getBrand: () => apiFetch<BrandSettings>("/settings/brand", { _skipAuth: true }),
  updateBrand: (data: BrandSettings, token?: string) =>
    apiFetch("/settings/brand", { method: "PUT", body: JSON.stringify(data), token }),
  getGeneral: () => apiFetch<GeneralSettings>("/settings/general"),
  updateGeneral: (data: GeneralSettings, token?: string) =>
    apiFetch("/settings/general", { method: "PUT", body: JSON.stringify(data), token }),
};

export default {
  subjects: subjectsApi,
  curriculum: curriculumApi,
  modules: modulesApi,
  topics: topicsApi,
  lessons: lessonsApi,
  questions: questionsApi,
  progress: progressApi,
  media: mediaApi,
  assessments: assessmentsApi,
  cet: cetApi,
  programs: programsApi,
  passages: passagesApi,
  progression: progressionApi,
  settings: settingsApi,
};
