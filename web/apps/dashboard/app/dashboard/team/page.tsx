"use client";

import { Fragment, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { ApiError, api, type AdminProfile, type RegisterInput } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { SkeletonRows } from "../../components/skeleton";

const emptyInvite: RegisterInput = { name: "", email: "", occupation: "", password: "" };

export default function TeamPage() {
  const { token, profile: me } = useAuth();
  const [team, setTeam] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [inviting, setInviting] = useState(false);
  const [inviteInput, setInviteInput] = useState<RegisterInput>(emptyInvite);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  // Two-step confirm instead of a native `confirm()` — this is a
  // destructive, permanent action, but a browser dialog blocks the whole
  // page (and any automated testing of it) until dismissed.
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.team
      .list(token)
      .then(setTeam)
      .catch(() => setError("Couldn't load the team."))
      .finally(() => setLoading(false));
  }, [token]);

  async function setRole(id: string, role: "admin" | "member") {
    if (!token) return;
    setPendingId(id);
    setError(null);
    try {
      const updated = await api.team.updateRole(token, id, role);
      setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change that role.");
    } finally {
      setPendingId(null);
    }
  }

  async function setProductPermission(id: string, canEditProducts: boolean) {
    if (!token) return;
    setPendingId(id);
    setError(null);
    try {
      const updated = await api.team.updatePermissions(token, id, canEditProducts);
      setTeam((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change that permission.");
    } finally {
      setPendingId(null);
    }
  }

  async function submitInvite() {
    if (!token) return;
    setInviteBusy(true);
    setInviteError(null);
    try {
      const session = await api.team.invite(token, inviteInput);
      setTeam((prev) => [...prev, session.profile]);
      setInviting(false);
      setInviteInput(emptyInvite);
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "Couldn't invite that teammate.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function submitReset(id: string) {
    if (!token) return;
    setResetBusy(true);
    setResetError(null);
    try {
      await api.team.resetPassword(token, id, resetPassword);
      setResettingId(null);
      setResetPassword("");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "Couldn't reset that password.");
    } finally {
      setResetBusy(false);
    }
  }

  async function removeMember(id: string) {
    if (!token) return;
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await api.team.remove(token, id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
      setConfirmRemoveId(null);
    } catch (err) {
      setRemoveError(err instanceof ApiError ? err.message : "Couldn't remove that teammate.");
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-fg">Team</h1>
          <p className="mt-1 text-sm text-muted">{team.length} accounts with dashboard access</p>
        </div>
        {me?.role === "admin" && (
          <button
            onClick={() => {
              setInviting((v) => !v);
              setInviteError(null);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-fg px-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            <UserPlus size={15} />
            Invite teammate
          </button>
        )}
      </div>

      {inviting && (
        <div className="mt-4 rounded-xl border border-line p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                disabled={inviteBusy}
                value={inviteInput.name}
                onChange={(e) => setInviteInput((v) => ({ ...v, name: e.target.value }))}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                disabled={inviteBusy}
                value={inviteInput.email}
                onChange={(e) => setInviteInput((v) => ({ ...v, email: e.target.value }))}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
              />
            </Field>
            <Field label="Occupation (optional)">
              <input
                disabled={inviteBusy}
                value={inviteInput.occupation}
                onChange={(e) => setInviteInput((v) => ({ ...v, occupation: e.target.value }))}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
              />
            </Field>
            <Field label="Initial password">
              <input
                type="password"
                disabled={inviteBusy}
                value={inviteInput.password}
                onChange={(e) => setInviteInput((v) => ({ ...v, password: e.target.value }))}
                className="h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
              />
            </Field>
          </div>
          {inviteError && <p className="mt-3 text-xs text-red-400">{inviteError}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={submitInvite}
              disabled={inviteBusy || !inviteInput.name || !inviteInput.email || !inviteInput.password}
              aria-busy={inviteBusy ? "true" : undefined}
              className="flex h-8 items-center gap-1.5 rounded-md bg-fg px-3 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviteBusy && <Loader2 size={13} className="animate-spin shrink-0" />}
              <span>{inviteBusy ? "Sending invite…" : "Send invite"}</span>
            </button>
            <button
              onClick={() => {
                setInviting(false);
                setInviteError(null);
                setInviteInput(emptyInvite);
              }}
              disabled={inviteBusy}
              className="h-8 rounded-md px-3 text-xs text-muted transition-colors hover:text-fg disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Occupation</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                {me?.role === "admin" && <th className="px-4 py-2.5 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <Fragment key={member.id}>
                  <tr className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-fg">
                      {member.name}
                      {member.id === me?.id && <span className="ml-1.5 text-xs text-muted">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{member.email}</td>
                    <td className="px-4 py-3 text-muted">{member.occupation ?? "—"}</td>
                    <td className="px-4 py-3">
                      {me?.role === "admin" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              disabled={pendingId === member.id}
                              onChange={(e) => setRole(member.id, e.target.value as "admin" | "member")}
                              className="h-8 rounded-md border border-line bg-surface px-2 text-xs text-fg capitalize outline-none focus:border-accent disabled:opacity-50"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                            {pendingId === member.id && (
                              <Loader2 size={13} className="animate-spin text-muted" />
                            )}
                          </div>
                          {member.role === "member" && (
                            <label className="flex items-center gap-1.5 text-xs text-muted">
                              <input
                                type="checkbox"
                                checked={member.can_edit_products}
                                disabled={pendingId === member.id}
                                onChange={(e) => setProductPermission(member.id, e.target.checked)}
                              />
                              Can edit products
                            </label>
                          )}
                        </div>
                      ) : (
                        <span className="text-fg capitalize">{member.role}</span>
                      )}
                    </td>
                    {me?.role === "admin" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {confirmRemoveId !== member.id && (
                            <button
                              onClick={() => {
                                setResettingId(resettingId === member.id ? null : member.id);
                                setResetError(null);
                                setResetPassword("");
                              }}
                              className="text-xs text-muted transition-colors hover:text-fg"
                            >
                              Reset password
                            </button>
                          )}
                          {member.id !== me?.id &&
                            (confirmRemoveId === member.id ? (
                              <span className="flex items-center gap-2">
                                <button
                                  onClick={() => removeMember(member.id)}
                                  disabled={removeBusy}
                                  aria-busy={removeBusy ? "true" : undefined}
                                  className="flex items-center gap-1 text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                                >
                                  {removeBusy && <Loader2 size={11} className="animate-spin shrink-0" />}
                                  <span>{removeBusy ? "Removing…" : "Confirm"}</span>
                                </button>
                                <button
                                  onClick={() => setConfirmRemoveId(null)}
                                  disabled={removeBusy}
                                  className="text-xs text-muted transition-colors hover:text-fg disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setConfirmRemoveId(member.id);
                                  setRemoveError(null);
                                }}
                                className="text-xs text-muted transition-colors hover:text-red-400"
                              >
                                Remove
                              </button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                  {confirmRemoveId === member.id && removeError && (
                    <tr className="border-b border-line last:border-0">
                      <td colSpan={5} className="px-4 py-2 text-xs text-red-400">
                        {removeError}
                      </td>
                    </tr>
                  )}
                  {resettingId === member.id && (
                    <tr className="border-b border-line bg-fg/[0.02] last:border-0">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs text-muted">New password for {member.name}</span>
                          <input
                            type="password"
                            placeholder="At least 8 characters"
                            disabled={resetBusy}
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            className="h-8 w-52 rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
                          />
                          <button
                            onClick={() => submitReset(member.id)}
                            disabled={resetBusy || resetPassword.length < 8}
                            aria-busy={resetBusy ? "true" : undefined}
                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-fg px-3 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resetBusy && <Loader2 size={12} className="animate-spin shrink-0" />}
                            <span>{resetBusy ? "Saving…" : "Save"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setResettingId(null);
                              setResetError(null);
                              setResetPassword("");
                            }}
                            disabled={resetBusy}
                            className="h-8 shrink-0 rounded-md px-2 text-xs text-muted transition-colors hover:text-fg disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          {resetError && <span className="text-xs text-red-400">{resetError}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
