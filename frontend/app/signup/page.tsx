"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSignup() {
    setBusy(true);
    setErr(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/upload");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign up</h1>

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border p-3"
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={onSignup}
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : "Create account"}
        </button>

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <a className="text-blue-600 underline" href="/login">
            Login
          </a>
        </p>

        {err && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>
        )}
      </div>
    </main>
  );
}