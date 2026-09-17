import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";

interface AuthFormProps {
  mode: "signIn" | "signUp";
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow: mode });
    } catch {
      setError(
        mode === "signIn"
          ? "Couldn't sign in - check your email and password."
          : "Couldn't create an account - try a different email.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold text-cocoa-soft">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-cocoa outline-none focus:border-peach"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-cocoa-soft">
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-cocoa outline-none focus:border-peach"
        />
      </label>
      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-xl bg-peach px-4 py-2 font-bold text-white shadow-sm transition hover:bg-peach-dark disabled:opacity-60"
      >
        {mode === "signIn" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}
