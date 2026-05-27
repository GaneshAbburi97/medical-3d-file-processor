"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onLogin() {
    setBusy(true);
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/upload");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/upload");
    } catch (e: any) {
      setErr(e.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border p-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={onLogin}
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : "Login"}
        </button>

        <button
          onClick={onGoogle}
          disabled={busy}
          className="w-full rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="text-sm text-slate-600">
          No account? <a className="text-blue-600 underline" href="/signup">Sign up</a>
        </p>

        {err && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      </div>
    </main>
  );
}