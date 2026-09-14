"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError, SubmitButton, TextField } from "../components/form";
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
    <main className="flex min-h-screen items-center justify-center bg-surface/40 px-4 py-12">
      <div className="w-full max-w-[380px]">
        <p className="text-center font-mono text-[13px] font-medium tracking-tight text-fg">
          True<span className="text-accent">Label</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-bg p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h1 className="text-lg font-medium text-fg">Create your account</h1>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <FormError message={error} />
            <Field label="Name">
              <TextField
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Email">
              <TextField
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth" optional>
                <TextField
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </Field>
              <Field label="Occupation" optional>
                <TextField
                  placeholder="e.g. Engineer"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
            <SubmitButton type="submit" loading={loading}>
              Create account
            </SubmitButton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-fg underline underline-offset-4 hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
