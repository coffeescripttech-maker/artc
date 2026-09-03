// CS#23.2 — Enterprise RBAC permission catalog. Single source of truth for
// every permission key, its display metadata, and the default grants per role.
// The seed (`seed-rbac.ts`) upserts these into the DB; the API middleware
// (`requirePermission`) resolves a caller's effective set from the DB so
// superadmin-configured grants take effect without re-issuing JWTs.
//
// `enforced: true`  → a route middleware actually checks this key today.
// `enforced: false` → catalogued for visibility/future enforcement only
//                     (learner + parent flows stay authenticate-gated).

export interface PermissionDef {
  key: string;
  resource: string;
  action: string;
  displayName: string;
  description: string;
  enforced: boolean;
}

const CONTENT_RESOURCES = [
  "programs",
  "subjects",
  "modules",
  "topics",
  "lessons",
  "assessments",
  "questions",
  "passages",
  "curriculum",
] as const;

function label(resource: string, action: string): string {
  const pretty = resource.charAt(0).toUpperCase() + resource.slice(1);
  const verbs: Record<string, string> = {
    create: "Create",
    update: "Edit",
    publish: "Publish",
    archive: "Archive",
    delete: "Delete",
  };
  return `${verbs[action] ?? action} ${pretty}`;
}

function contentDef(resource: string, action: string, enforced = true): PermissionDef {
  return {
    key: `${resource}.${action}`,
    resource,
    action,
    displayName: label(resource, action),
    description: `Allow ${action} on ${resource} (scope also depends on org context for org-owned content).`,
    enforced,
  };
}

/** Per-resource standard actions, in matrix display order. */
export const RESOURCE_ACTIONS = ["create", "update", "publish", "archive", "delete"] as const;

export const PERMISSION_CATALOG: PermissionDef[] = [
  // --- Content resources: standard CRUD lifecycle -------------------------
  ...CONTENT_RESOURCES.flatMap((r) => RESOURCE_ACTIONS.map((a) => contentDef(r, a))),

  // --- Content specials ---------------------------------------------------
  { key: "programs.template", resource: "programs", action: "template", displayName: "Create Programs from Template", description: "Bulk-create org content from the platform template.", enforced: true },
  { key: "programs.cet_generate", resource: "programs", action: "cet_generate", displayName: "Generate CET Exams for Program", description: "Trigger CET exam generation for a program.", enforced: true },
  { key: "modules.reorder", resource: "modules", action: "reorder", displayName: "Reorder Modules", description: "Change module ordering within a subject.", enforced: true },
  { key: "topics.reorder", resource: "topics", action: "reorder", displayName: "Reorder Topics", description: "Change topic ordering within a module.", enforced: true },
  { key: "lessons.reorder", resource: "lessons", action: "reorder", displayName: "Reorder Lessons", description: "Change lesson ordering within a topic.", enforced: true },
  { key: "curriculum.items_manage", resource: "curriculum", action: "items_manage", displayName: "Manage Curriculum Items", description: "Add, edit, reorder and remove curriculum items.", enforced: true },
  { key: "assessments.questions_manage", resource: "assessments", action: "questions_manage", displayName: "Manage Assessment Questions", description: "Add, reorder and remove questions on assessments.", enforced: true },
  { key: "assessments.auto_generate", resource: "assessments", action: "auto_generate", displayName: "Auto-generate Assessments", description: "Trigger automatic assessment generation.", enforced: true },
  { key: "questions.review", resource: "questions", action: "review", displayName: "Review Questions", description: "Move questions through the review workflow.", enforced: true },
  { key: "questions.links_manage", resource: "questions", action: "links_manage", displayName: "Manage Question Links", description: "Create, edit and remove question links.", enforced: true },
  { key: "questions.import", resource: "questions", action: "import", displayName: "Import Questions", description: "Import questions from PDF / bulk sources.", enforced: true },
  { key: "content.versions", resource: "content", action: "versions", displayName: "Manage Content Versions", description: "Draft, publish and roll back content versions.", enforced: true },
  { key: "media.upload", resource: "media", action: "upload", displayName: "Upload Media", description: "Upload media files used by content.", enforced: true },

  // --- Settings -----------------------------------------------------------
  { key: "settings.read", resource: "settings", action: "read", displayName: "View Settings", description: "Read platform general settings.", enforced: true },
  { key: "settings.update", resource: "settings", action: "update", displayName: "Update Settings", description: "Change platform general settings.", enforced: true },
  { key: "settings.brand_update", resource: "settings", action: "brand_update", displayName: "Update Branding", description: "Change brand colors and identity.", enforced: true },

  // --- Platform administration --------------------------------------------
  { key: "admin.stats_view", resource: "admin", action: "stats_view", displayName: "View Admin Statistics", description: "See the admin dashboard overview metrics.", enforced: true },
  { key: "admin.audit_view", resource: "admin", action: "audit_view", displayName: "View Audit Log", description: "Query the append-only audit event log.", enforced: true },
  { key: "platform.orgs_manage", resource: "platform", action: "orgs_manage", displayName: "Manage Organizations", description: "Create, update, suspend and delete organizations; invite admins.", enforced: true },
  { key: "orgs.list", resource: "orgs", action: "list", displayName: "List Organizations", description: "List all organizations (admin members UI).", enforced: true },
  { key: "orgs.users_search", resource: "orgs", action: "users_search", displayName: "Search Users", description: "Search the user base for membership pickers.", enforced: true },
  { key: "orgs.update", resource: "orgs", action: "update", displayName: "Update Organization Settings", description: "Update organization profile/settings (own organization for org admins; all organizations with platform.orgs_manage).", enforced: true },
  { key: "parents.read", resource: "parents", action: "read", displayName: "View Parents", description: "View the parents of an organization and their linked students.", enforced: true },
  { key: "parents.manage", resource: "parents", action: "manage", displayName: "Manage Parent Links", description: "Link and unlink parents to students inside an organization.", enforced: true },
  { key: "users.create", resource: "users", action: "create", displayName: "Create Organization Users", description: "Create user accounts inside an organization and assign existing non-platform roles.", enforced: true },

  // --- Teaching -------------------------------------------------------------
  { key: "batches.manage", resource: "batches", action: "manage", displayName: "Manage Batches", description: "Create batches and manage their members and reports.", enforced: true },

  // --- CET ------------------------------------------------------------------
  { key: "cet.universities_manage", resource: "cet", action: "universities_manage", displayName: "Manage Universities", description: "Create, edit and delete CET university records.", enforced: true },
  { key: "cet.exams_manage", resource: "cet", action: "exams_manage", displayName: "Manage CET Exams", description: "Create, edit, publish, archive CET exams.", enforced: true },
  { key: "cet.profiles_manage", resource: "cet", action: "profiles_manage", displayName: "Manage CET Profiles", description: "Create, edit, publish, archive CET profiles and coverage.", enforced: true },
  { key: "cet.programs_link", resource: "cet", action: "programs_link", displayName: "Link CET Exams to Programs", description: "Create and remove CET exam ↔ program links.", enforced: true },

  // --- Enrollment administration (CS#23.5) ----------------------------------
  { key: "enrollments.read", resource: "enrollments", action: "read", displayName: "View Enrollments", description: "List and view enrollments for programs within authorized scope.", enforced: true },
  { key: "enrollments.manage", resource: "enrollments", action: "manage", displayName: "Manage Enrollments", description: "Grant, update and revoke learner enrollments.", enforced: true },

  // --- Learner (advisory — flows remain authenticate-gated) ------------------
  { key: "assessments.take", resource: "assessments", action: "take", displayName: "Take Assessments", description: "Start and submit assessment attempts.", enforced: false },
  { key: "lessons.progress", resource: "lessons", action: "progress", displayName: "Track Lesson Progress", description: "Read and save personal lesson progress.", enforced: false },
  { key: "lessons.questions_respond", resource: "lessons", action: "questions_respond", displayName: "Answer Lesson Questions", description: "Save responses to embedded lesson questions.", enforced: true },
  { key: "enrollments.self", resource: "enrollments", action: "self", displayName: "View Own Enrollments", description: "List the learner's own enrollments.", enforced: false },
  { key: "progression.view", resource: "progression", action: "view", displayName: "View Own Progression", description: "See the learner's College Readiness ladder.", enforced: false },

  // --- Parent (advisory — reserved for future children-view features) --------
  { key: "children.view", resource: "children", action: "view", displayName: "View Linked Children", description: "See progress of children linked to this account.", enforced: false },
];

/** Default grants per platform role, mirroring today's enforced behavior. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: PERMISSION_CATALOG.map((p) => p.key),

  content_admin: [
    ...CONTENT_RESOURCES.flatMap((r) =>
      ["create", "update", "publish", "archive"].map((a) => `${r}.${a}`)
    ),
    "programs.template",
    "programs.cet_generate",
    "modules.reorder",
    "topics.reorder",
    "lessons.reorder",
    "curriculum.items_manage",
    "assessments.questions_manage",
    "assessments.auto_generate",
    "lessons.questions_respond",
    "questions.review",
    "questions.links_manage",
    "questions.import",
    "content.versions",
    "media.upload",
    "settings.read",
    "settings.update",
    "settings.brand_update",
    "admin.stats_view",
    "admin.audit_view",
    "orgs.list",
    "orgs.users_search",
    "orgs.update",
    "parents.read",
    "users.create",
    "enrollments.read",
    "enrollments.manage",
    "cet.exams_manage",
    "cet.profiles_manage",
    "cet.programs_link",
  ],

  school_admin: [
    "admin.stats_view",
    "admin.audit_view",
    "content.versions",
    "questions.import",
    "batches.manage",
    "orgs.users_search",
    "orgs.update",
    "parents.read",
    "parents.manage",
    "users.create",
    "enrollments.read",
    "enrollments.manage",
  ],

  teacher: ["batches.manage", "questions.import", "enrollments.read"],

  student: [
    "assessments.take",
    "lessons.progress",
    "lessons.questions_respond",
    "enrollments.self",
    "progression.view",
  ],

  parent: ["children.view"],
};

/** Roles whose permission set is managed in code only — not editable via the UI. */
export const SYSTEM_LOCKED_ROLES = ["super_admin"];
