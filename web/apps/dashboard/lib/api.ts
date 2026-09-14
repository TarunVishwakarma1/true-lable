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
  role: "admin" | "member";
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

function query(params: Record<string, string | number | undefined>): string {
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
    updateRole: (token: string, id: string, role: "admin" | "member") =>
      request<AdminProfile>(`/api/v1/admin/team/${id}/role`, { method: "PATCH", token, body: { role } }),
  },
};
