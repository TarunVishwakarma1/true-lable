"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, Send, ShieldAlert } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

interface RequestAccessProps {
  resourceName?: string;
}

export function RestrictedAccessView({ resourceName = "this resource" }: RequestAccessProps) {
  const { token, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestAccess(token, {
        resource: resourceName,
        message: message.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface/50 p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldAlert size={24} />
        </div>

        <h2 className="mt-5 text-lg font-semibold tracking-tight text-fg">
          Access Restricted
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Your account <span className="font-mono text-fg">({profile?.email})</span> currently has the{" "}
          <span className="rounded-md border border-line bg-fg/[0.04] px-1.5 py-0.5 font-mono text-xs text-accent">
            new-user
          </span>{" "}
          role, which provides view access to <strong className="text-fg">Crash Reports</strong>.
        </p>

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-500">
            <div className="flex items-center justify-center gap-1.5 font-medium">
              <Check size={14} />
              <span>Access Request Sent!</span>
            </div>
            <p className="mt-1 text-muted">
              An administrator has been notified via webhooks and will review your request shortly.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-medium text-muted uppercase tracking-wider">
                Note for Administrator (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                placeholder={`Hi! I would like access to ${resourceName} / elevation to Member role...`}
                className="mt-1.5 h-24 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs text-fg placeholder:text-muted/60 outline-none focus:border-accent disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500">{error}</p>
            )}

            <button
              onClick={handleRequest}
              disabled={loading}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-fg text-xs font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin text-bg" />
              ) : (
                <Send size={13} />
              )}
              <span>{loading ? "Sending Request…" : "Request Access from Admin"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RequestAccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { token, profile } = useAuth();
  const [resource, setResource] = useState("Member Role");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleRequest() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.requestAccess(token, {
        resource,
        message: message.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <KeyRound size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">Request Role Elevation</h3>
            <p className="text-[11px] text-muted">Ask an admin to elevate your role</p>
          </div>
        </div>

        {success ? (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs text-emerald-500">
            <Check size={16} className="mx-auto" />
            <p className="mt-1 font-medium">Request Sent Successfully</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-muted uppercase">Requested Access</label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                disabled={loading}
                className="mt-1 h-8 w-full rounded-lg border border-line bg-surface px-2.5 text-xs text-fg outline-none focus:border-accent"
              >
                <option value="Member Role">Member Role (Full Dashboard Access)</option>
                <option value="Product Editor">Product Editor Access</option>
                <option value="Admin Role">Admin Role</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted uppercase">Reason (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                placeholder="Reason or project details..."
                className="mt-1 h-20 w-full resize-none rounded-lg border border-line bg-surface p-2 text-xs text-fg placeholder:text-muted/60 outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-8 rounded-full border border-line px-3.5 text-xs font-medium text-muted hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequest}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-fg px-4 text-xs font-medium text-bg hover:opacity-90 disabled:opacity-50"
              >
                {loading && <Loader2 size={11} className="animate-spin text-bg" />}
                <span>{loading ? "Sending…" : "Submit Request"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
