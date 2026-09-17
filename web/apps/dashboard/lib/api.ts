const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Envelope<T> {
  status: "success" | "error";
  data: T | null;
  error: string | null;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json: Envelope<T> | null = await res.json().catch(() => null);

  if (!res.ok || !json || json.status === "error") {
    throw new ApiError(json?.error ?? `Request failed (${res.status})`, res.status);
  }
  return json.data as T;
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  occupation: string | null;
  role: "admin" | "member" | "new-user";
  can_edit_products: boolean;
  created_at: string;
}

export interface AdminSession {
  token: string;
  profile: AdminProfile;
}

export interface RegisterInput {
  name: string;
  email: string;
  date_of_birth?: string;
  occupation?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type Platform = "ios" | "backend" | "web";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "submitted" | "pending" | "in_review" | "in_progress" | "done" | "wont_fix";

export interface CrashReport {
  id: string;
  platform: Platform;
  title: string;
  description: string | null;
  stack_trace: string | null;
  app_version: string | null;
  os_version: string | null;
  device_model: string | null;
  severity: Severity;
  status: ReportStatus;
  source: "app" | "manual";
  device_id: string | null;
  reported_by: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CrashReportPage {
  items: CrashReport[];
  total: number;
}

export interface CrashReportFilters {
  status?: ReportStatus;
  platform?: Platform;
  severity?: Severity;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCrashReportInput {
  platform: Platform;
  title: string;
  description?: string;
  stack_trace?: string;
  app_version?: string;
  os_version?: string;
  device_model?: string;
  severity?: Severity;
}

export interface GitHubIssueRef {
  number: number;
  url: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
}

export interface AuditLogFilters {
  action?: string;
  target_type?: string;
  limit?: number;
  offset?: number;
}

// Mirrors the backend's `Product` struct field-for-field — the admin
// product editor needs full detail, not the lighter `ProductCard` the
// public consumer endpoints return.
export interface Product {
  id: string;
  barcode: string;
  country: string;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  nutrition_facts: Record<string, unknown>;
  ingredients: string | null;
  allergens: string | null;
  source: string;
  verified: boolean;
  verification_count: number;
  confidence_score: number | null;
  additives: unknown[] | null;
  nova_group: number | null;
  nutriscore_grade: string | null;
  is_vegan: boolean | null;
  is_vegetarian: boolean | null;
  is_palm_oil_free: boolean | null;
  category: string | null;
  allergens_tags: string[] | null;
  traces_tags: string[] | null;
  labels_tags: string[] | null;
  categories_tags: string[] | null;
  nutrient_levels: Record<string, unknown> | null;
  serving_size: string | null;
  serving_quantity: number | null;
  quantity: string | null;
  nutriscore_score: number | null;
  ecoscore_grade: string | null;
  completeness: number | null;
  off_synced_at: string | null;
  off_last_modified: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductPage {
  items: Product[];
  total: number;
}

export interface AdminProductFilters {
  q?: string;
  country?: string;
  verified?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}

// Only the curated, admin-editable subset — see the backend's
// `AdminUpdateProductRequest` doc comment for what's deliberately excluded
// and why. All optional: send just the fields that changed.
export interface AdminUpdateProductInput {
  product_name?: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  allergens?: string[];
  image_url?: string;
  quantity?: string;
  nutrition_facts?: Record<string, unknown>;
  additives?: unknown[];
  nova_group?: number;
  nutriscore_grade?: string;
  is_vegan?: boolean;
  is_vegetarian?: boolean;
  is_palm_oil_free?: boolean;
}

// Mirrors the backend's `User` struct — one row per device, not per
// account. Read-only surface in the dashboard: no admin mutation exists.
export interface AppUser {
  device_id: string;
  country: string;
  dietary_preferences: string[];
  plus_since: string | null;
  plus_expires_at: string | null;
  plus_source: string | null;
  apple_user_id: string | null;
  email: string | null;
  display_name: string | null;
  linked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserPage {
  items: AppUser[];
  total: number;
}

export interface AdminUserFilters {
  q?: string;
  plus_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ContributionStats {
  confirmations: number;
  contributions: number;
  helped_verify: number;
  member_since: string | null;
}

export type AdminUserDetail = AppUser & { stats: ContributionStats };

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const api = {
  register: (input: RegisterInput) =>
    request<AdminSession>("/api/v1/admin/auth/register", { method: "POST", body: input }),
  login: (input: LoginInput) =>
    request<AdminSession>("/api/v1/admin/auth/login", { method: "POST", body: input }),
  me: (token: string) => request<AdminProfile>("/api/v1/admin/auth/me", { token }),
  logout: (token: string) =>
    request<{ signed_out: boolean }>("/api/v1/admin/auth/logout", { method: "POST", token }),

  requestAccess: (token: string, input: { resource?: string; message?: string } = {}) =>
    request<{ requested: boolean }>("/api/v1/admin/auth/request-access", {
      method: "POST",
      token,
      body: input,
    }),

  crashReports: {
    list: (token: string, filters: CrashReportFilters = {}) =>
      request<CrashReportPage>(`/api/v1/admin/crash-reports${query({ ...filters })}`, { token }),
    get: (token: string, id: string) =>
      request<CrashReport>(`/api/v1/admin/crash-reports/${id}`, { token }),
    create: (token: string, input: CreateCrashReportInput) =>
      request<CrashReport>("/api/v1/admin/crash-reports", { method: "POST", token, body: input }),
    update: (token: string, id: string, patch: { status?: ReportStatus; severity?: Severity }) =>
      request<CrashReport>(`/api/v1/admin/crash-reports/${id}`, {
        method: "PATCH",
        token,
        body: patch,
      }),
    publishToGithub: (token: string, id: string) =>
      request<GitHubIssueRef>(`/api/v1/admin/crash-reports/${id}/github-issue`, {
        method: "POST",
        token,
      }),
  },

  team: {
    list: (token: string) => request<AdminProfile[]>("/api/v1/admin/team", { token }),
    updateRole: (token: string, id: string, role: "admin" | "member" | "new-user") =>
      request<AdminProfile>(`/api/v1/admin/team/${id}/role`, { method: "PATCH", token, body: { role } }),
    resetPassword: (token: string, id: string, newPassword: string) =>
      request<{ reset: boolean }>(`/api/v1/admin/team/${id}/password`, {
        method: "PATCH",
        token,
        body: { new_password: newPassword },
      }),
    // Deliberately not `api.register` — that call never attaches a token,
    // so the backend would see no calling admin and refuse every invite
    // past the first account. Same endpoint, invite just carries the
    // inviting admin's own session.
    invite: (token: string, input: RegisterInput) =>
      request<AdminSession>("/api/v1/admin/auth/register", { method: "POST", token, body: input }),
    remove: (token: string, id: string) =>
      request<{ removed: boolean }>(`/api/v1/admin/team/${id}`, { method: "DELETE", token }),
    updatePermissions: (token: string, id: string, canEditProducts: boolean) =>
      request<AdminProfile>(`/api/v1/admin/team/${id}/permissions`, {
        method: "PATCH",
        token,
        body: { can_edit_products: canEditProducts },
      }),
  },

  activity: {
    list: (token: string, filters: AuditLogFilters = {}) =>
      request<AuditLogPage>(`/api/v1/admin/activity${query({ ...filters })}`, { token }),
  },

  products: {
    list: (token: string, filters: AdminProductFilters = {}) =>
      request<AdminProductPage>(`/api/v1/admin/products${query({ ...filters })}`, { token }),
    get: (token: string, id: string) => request<Product>(`/api/v1/admin/products/${id}`, { token }),
    update: (token: string, id: string, patch: AdminUpdateProductInput) =>
      request<Product>(`/api/v1/admin/products/${id}`, { method: "PATCH", token, body: patch }),
    verify: (token: string, id: string, verified: boolean) =>
      request<Product>(`/api/v1/admin/products/${id}/verify`, { method: "POST", token, body: { verified } }),
  },

  users: {
    list: (token: string, filters: AdminUserFilters = {}) =>
      request<AdminUserPage>(`/api/v1/admin/users${query({ ...filters })}`, { token }),
    get: (token: string, deviceId: string) =>
      request<AdminUserDetail>(`/api/v1/admin/users/${deviceId}`, { token }),
  },

  notifications: {
    list: (token: string) =>
      request<NotificationListResponse>("/api/v1/admin/notifications", { token }),
    markRead: (token: string, id: string) =>
      request<{ marked_read: boolean }>(`/api/v1/admin/notifications/${id}/read`, {
        method: "PATCH",
        token,
      }),
    markAllRead: (token: string) =>
      request<{ all_marked_read: boolean }>("/api/v1/admin/notifications/read-all", {
        method: "POST",
        token,
      }),
  },
};

export interface DashboardNotification {
  id: string;
  user_id: string | null;
  target_role: string | null;
  title: string;
  message: string;
  category: "user_registration" | "access_request" | "role_change" | "permission_change" | "crash_report" | string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: DashboardNotification[];
  unread_count: number;
}

