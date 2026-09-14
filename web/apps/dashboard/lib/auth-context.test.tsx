import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-context";
import { api } from "./api";

vi.mock("./api", () => ({
  api: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const TOKEN_KEY = "truelabel-dashboard:token";
const profile = {
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  occupation: null,
  role: "member" as const,
  can_edit_products: false,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  localStorage.clear();
  vi.mocked(api.me).mockReset();
  vi.mocked(api.login).mockReset();
  vi.mocked(api.register).mockReset();
  vi.mocked(api.logout).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthProvider session restore", () => {
  it("starts signed out with no stored token, and stops loading", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("restores the session when the stored token is still valid", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");
    vi.mocked(api.me).mockResolvedValue(profile);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(api.me).toHaveBeenCalledWith("valid-token");
    expect(result.current.token).toBe("valid-token");
    expect(result.current.profile).toEqual(profile);
  });

  it("clears a stored token that the backend no longer accepts", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-token");
    vi.mocked(api.me).mockRejectedValue(new Error("401"));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("AuthProvider login/register/logout", () => {
  it("login stores the token and profile, and persists to localStorage", async () => {
    vi.mocked(api.login).mockResolvedValue({ token: "new-token", profile });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login({ email: "ada@example.com", password: "x" });
    });

    expect(result.current.token).toBe("new-token");
    expect(result.current.profile).toEqual(profile);
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new-token");
  });

  it("register applies the session the same way login does", async () => {
    vi.mocked(api.register).mockResolvedValue({ token: "reg-token", profile });
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({ name: "Ada", email: "ada@example.com", password: "x" });
    });

    expect(result.current.token).toBe("reg-token");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("reg-token");
  });

  it("logout clears local state even if the server call fails", async () => {
    vi.mocked(api.login).mockResolvedValue({ token: "new-token", profile });
    vi.mocked(api.logout).mockRejectedValue(new Error("network down"));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.login({ email: "ada@example.com", password: "x" });
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("logout is a no-op call-wise when there was never a session", async () => {
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(api.logout).not.toHaveBeenCalled();
  });
});
