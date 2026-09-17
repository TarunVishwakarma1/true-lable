"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Field, FormError, SelectField, SubmitButton, TextArea, TextField } from "../../../components/form";
import { RestrictedAccessView } from "../../../components/request-access";
import { ApiError, api, type Platform, type Severity } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

const PLATFORMS: Platform[] = ["ios", "backend", "web"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function NewCrashReportPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [platform, setPlatform] = useState<Platform>("ios");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [appVersion, setAppVersion] = useState("");
  const [osVersion, setOsVersion] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (profile?.role === "new-user") {
    return <RestrictedAccessView resourceName="Filing Crash Reports" />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const report = await api.crashReports.create(token, {
        platform,
        title,
        severity,
        description: description || undefined,
        stack_trace: stackTrace || undefined,
        app_version: appVersion || undefined,
        os_version: osVersion || undefined,
        device_model: deviceModel || undefined,
      });
      router.push(`/dashboard/crash-reports/${report.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the report.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-8 py-10">
      <Link
        href="/dashboard/crash-reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} />
        Crash reports
      </Link>

      <h1 className="mt-4 text-xl font-medium text-fg">File a crash report</h1>
      <p className="mt-1 text-sm text-muted">
        For anything with no automated path yet — a TestFlight crash log, a user email, a bug you hit yourself.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <FormError message={error} />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Platform">
            <SelectField disabled={loading} value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label="Severity">
            <SelectField disabled={loading} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>

        <Field label="Title">
          <TextField required disabled={loading} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Description" optional>
          <TextArea rows={3} disabled={loading} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Stack trace" optional>
          <TextArea
            rows={6}
            disabled={loading}
            className="font-mono text-xs"
            value={stackTrace}
            onChange={(e) => setStackTrace(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="App version" optional>
            <TextField disabled={loading} value={appVersion} onChange={(e) => setAppVersion(e.target.value)} />
          </Field>
          <Field label="OS version" optional>
            <TextField disabled={loading} value={osVersion} onChange={(e) => setOsVersion(e.target.value)} />
          </Field>
          <Field label="Device" optional>
            <TextField disabled={loading} value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} />
          </Field>
        </div>

        <SubmitButton type="submit" loading={loading} loadingText="Creating report…" className="w-auto self-start px-6">
          Create report
        </SubmitButton>
      </form>
    </main>
  );
}
