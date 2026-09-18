"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError, SubmitButton, TextField } from "../components/form";
import { AuthShell } from "../components/landing/auth-shell";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [occupation, setOccupation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        date_of_birth: dateOfBirth || undefined,
        occupation: occupation || undefined,
        password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="New accounts start with read access to crash reports. Ask the team for more."
      aside="Console access is granted per person, so the record stays readable."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <Field label="Name">
          <TextField
            autoComplete="name"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Email">
          <TextField
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of birth" optional>
            <TextField
              type="date"
              disabled={loading}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Field>
          <Field label="Occupation" optional>
            <TextField
              placeholder="e.g. Engineer"
              disabled={loading}
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Password">
          <TextField
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <TextField
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        <SubmitButton type="submit" loading={loading} loadingText="Creating account…" className="mt-1">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
