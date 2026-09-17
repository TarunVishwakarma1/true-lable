"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, Key, Loader2, Shield, Trash2, UserPlus } from "lucide-react";
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
  const [resetSuccessId, setResetSuccessId] = useState<string | null>(null);

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
      setResetSuccessId(id);
      setTimeout(() => {
        setResettingId(null);
        setResetSuccessId(null);
        setResetPassword("");
      }, 1500);
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
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Team</h1>
          <p className="mt-1 text-xs text-muted">
            {team.length} accounts with dashboard access
          </p>
        </div>
        {me?.role === "admin" && (
          <button
            onClick={() => {
              setInviting((v) => !v);
              setInviteError(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-3.5 text-xs font-medium text-bg transition-all hover:opacity-90 shadow-xs"
          >
            <UserPlus size={13} />
            <span>{inviting ? "Close Form" : "Invite teammate"}</span>
          </button>
        )}
      </div>

      {/* Invite Teammate Drawer / Card */}
      {inviting && (
        <div className="mt-6 rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-sm font-medium text-fg">Invite New Teammate</h2>
              <p className="mt-0.5 text-xs text-muted">
                Grant access to the TrueLabel management console.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                disabled={inviteBusy}
                placeholder="e.g. Alex Rivera"
                value={inviteInput.name}
                onChange={(e) => setInviteInput((v) => ({ ...v, name: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Work Email">
              <input
                type="email"
                disabled={inviteBusy}
                placeholder="alex@truelabel.fun"
                value={inviteInput.email}
                onChange={(e) => setInviteInput((v) => ({ ...v, email: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Occupation (optional)">
              <input
                disabled={inviteBusy}
                placeholder="e.g. Food Chemist, Developer"
                value={inviteInput.occupation}
                onChange={(e) => setInviteInput((v) => ({ ...v, occupation: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Initial Password">
              <input
                type="password"
                disabled={inviteBusy}
                placeholder="At least 8 characters"
                value={inviteInput.password}
                onChange={(e) => setInviteInput((v) => ({ ...v, password: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>

          {inviteError && (
            <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500">
              {inviteError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
            <button
              onClick={() => {
                setInviting(false);
                setInviteError(null);
                setInviteInput(emptyInvite);
              }}
              disabled={inviteBusy}
              className="h-8 rounded-full border border-line bg-surface px-3.5 text-xs font-medium text-muted transition-colors hover:border-fg/20 hover:text-fg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitInvite}
              disabled={inviteBusy || !inviteInput.name || !inviteInput.email || !inviteInput.password}
              aria-busy={inviteBusy ? "true" : undefined}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-4 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {inviteBusy && <Loader2 size={12} className="animate-spin text-bg" />}
              <span>{inviteBusy ? "Sending Invite…" : "Send invite"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <SkeletonRows rows={4} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-rose-500">{error}</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-fg/[0.02] text-[11px] font-medium tracking-wider text-muted uppercase">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Occupation</th>
                <th className="px-5 py-3">Role & Permissions</th>
                {me?.role === "admin" && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {team.map((member) => {
                const isCurrentMe = member.id === me?.id;
                return (
                  <Fragment key={member.id}>
                    <tr className="transition-colors hover:bg-fg/[0.02]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-fg/[0.08] font-medium text-[11px] text-fg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-fg">{member.name}</span>
                              {isCurrentMe && (
                                <span className="rounded-full border border-line bg-fg/[0.04] px-1.5 py-0.2 text-[10px] text-muted">
                                  you
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted font-mono text-[11px]">{member.email}</td>
                      <td className="px-5 py-3.5 text-muted">{member.occupation ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {me?.role === "admin" ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role}
                                disabled={pendingId === member.id}
                                onChange={(e) => setRole(member.id, e.target.value as "admin" | "member")}
                                className="h-7 rounded-md border border-line bg-surface px-2 text-xs capitalize text-fg outline-none focus:border-accent disabled:opacity-50"
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              {pendingId === member.id && (
                                <Loader2 size={12} className="animate-spin text-muted" />
                              )}
                            </div>
                            {member.role === "member" && (
                              <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={member.can_edit_products}
                                  disabled={pendingId === member.id}
                                  onChange={(e) => setProductPermission(member.id, e.target.checked)}
                                  className="h-3.5 w-3.5 rounded border-line bg-surface text-fg focus:ring-0"
                                />
                                <span>Can edit products</span>
                              </label>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-fg/[0.03] px-2.5 py-0.5 text-[11px] capitalize text-fg">
                            <Shield size={10} className="text-muted" />
                            {member.role}
                          </span>
                        )}
                      </td>
                      {me?.role === "admin" && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {confirmRemoveId !== member.id && (
                              <button
                                onClick={() => {
                                  setResettingId(resettingId === member.id ? null : member.id);
                                  setResetError(null);
                                  setResetPassword("");
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:border-fg/20 hover:text-fg"
                              >
                                <Key size={11} />
                                <span>Reset</span>
                              </button>
                            )}
                            {!isCurrentMe &&
                              (confirmRemoveId === member.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => removeMember(member.id)}
                                    disabled={removeBusy}
                                    aria-busy={removeBusy ? "true" : undefined}
                                    className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-1 text-[11px] font-medium text-rose-500 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
                                  >
                                    {removeBusy && <Loader2 size={10} className="animate-spin" />}
                                    <span>Confirm</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveId(null)}
                                    disabled={removeBusy}
                                    className="rounded-md border border-line px-2 py-1 text-[11px] text-muted transition-colors hover:text-fg disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConfirmRemoveId(member.id);
                                    setRemoveError(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-[11px] text-muted transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
                                >
                                  <Trash2 size={11} />
                                  <span>Remove</span>
                                </button>
                              ))}
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Remove Error Alert */}
                    {confirmRemoveId === member.id && removeError && (
                      <tr className="border-b border-line bg-rose-500/5">
                        <td colSpan={5} className="px-5 py-2 text-xs text-rose-500">
                          {removeError}
                        </td>
                      </tr>
                    )}

                    {/* Reset Password Expandable Row */}
                    {resettingId === member.id && (
                      <tr className="border-b border-line bg-fg/[0.02]">
                        <td colSpan={5} className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="shrink-0 text-xs text-muted">
                              Set new password for <strong className="text-fg">{member.name}</strong>:
                            </span>
                            <input
                              type="password"
                              placeholder="At least 8 characters"
                              disabled={resetBusy || resetSuccessId === member.id}
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              className="h-7 w-48 rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-50"
                            />
                            <button
                              onClick={() => submitReset(member.id)}
                              disabled={resetBusy || resetPassword.length < 8 || resetSuccessId === member.id}
                              aria-busy={resetBusy ? "true" : undefined}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-fg px-3 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                            >
                              {resetBusy ? (
                                <Loader2 size={11} className="animate-spin text-bg" />
                              ) : resetSuccessId === member.id ? (
                                <Check size={11} className="text-emerald-500" />
                              ) : null}
                              <span>{resetBusy ? "Saving…" : resetSuccessId === member.id ? "Updated!" : "Save Password"}</span>
                            </button>
                            <button
                              onClick={() => {
                                setResettingId(null);
                                setResetError(null);
                                setResetPassword("");
                              }}
                              disabled={resetBusy}
                              className="h-7 rounded-md px-2 text-xs text-muted transition-colors hover:text-fg disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            {resetError && <span className="text-xs text-rose-500">{resetError}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-line bg-surface px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}
