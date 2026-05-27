"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveJob } from "@/lib/jobs";

const API = process.env.NEXT_PUBLIC_API_BASE!;

export default function UploadPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  async function runDemo() {
    if (!uid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/jobs/local-demo`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      await saveJob(uid, data.job_id, "demo");
      router.push(`/results/${data.job_id}`);
    } catch (e: any) {
      setError(e?.message ?? "Demo failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAndRun() {
    if (!uid) return;
    if (!file) {
      setError("Please select a .nii or .nii.gz file.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/jobs/local-upload-and-run`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      await saveJob(uid, data.job_id, "upload");
      router.push(`/results/${data.job_id}`);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Upload</h1>
          <p className="mt-1 text-slate-600">
            Upload a <b>.nii</b> / <b>.nii.gz</b> file and run processing on your local backend.
          </p>
        </header>

        <section className="rounded-xl bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Select NIfTI file</label>
            <input
              className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3"
              type="file"
              accept=".nii,.nii.gz"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={uploadAndRun}
              disabled={!uid || busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Processing..." : "Upload & Process"}
            </button>

            <button
              onClick={runDemo}
              disabled={!uid || busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 disabled:opacity-50"
            >
              Run Demo (No Upload)
            </button>

            <button
              onClick={() => router.push("/history")}
              className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-white"
            >
              History
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}