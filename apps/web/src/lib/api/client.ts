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

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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
};

// ============================================================
// Progress API (per-learner)
// ============================================================
export const progressApi = {
  getLesson: (lessonId: string) => apiFetch(`/lessons/${lessonId}/progress`),
  setLesson: (lessonId: string, completed: boolean, token?: string) =>
    apiFetch(`/lessons/${lessonId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
      token,
    }),
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
};

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
  getBySlug: (slug: string) => apiFetch(`/programs/${slug}`),
  create: (data: any, token?: string) =>
    apiFetch("/programs", { method: "POST", body: JSON.stringify(data), token }),
  update: (id: string, data: any, token?: string) =>
    apiFetch(`/programs/${id}`, { method: "PUT", body: JSON.stringify(data), token }),
  publish: (id: string, token?: string) =>
    apiFetch(`/programs/${id}/publish`, { method: "PATCH", token }),
  delete: (id: string, token?: string) =>
    apiFetch(`/programs/${id}`, { method: "DELETE", token }),
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
};
