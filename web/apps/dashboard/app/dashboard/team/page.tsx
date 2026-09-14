"use client";

import { useEffect, useState } from "react";
import { ApiError, api, type AdminProfile } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function TeamPage() {
  const { token, profile: me } = useAuth();
  const [team, setTeam] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  return (
    <main className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-xl font-medium text-fg">Team</h1>
      <p className="mt-1 text-sm text-muted">{team.length} accounts with dashboard access</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
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
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-fg">
                    {member.name}
                    {member.id === me?.id && <span className="ml-1.5 text-xs text-muted">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{member.email}</td>
                  <td className="px-4 py-3 text-muted">{member.occupation ?? "—"}</td>
                  <td className="px-4 py-3">
                    {me?.role === "admin" ? (
                      <select
                        value={member.role}
                        disabled={pendingId === member.id}
                        onChange={(e) => setRole(member.id, e.target.value as "admin" | "member")}
                        className="h-8 rounded-md border border-line bg-surface px-2 text-xs text-fg capitalize outline-none focus:border-accent disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <span className="text-fg capitalize">{member.role}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
