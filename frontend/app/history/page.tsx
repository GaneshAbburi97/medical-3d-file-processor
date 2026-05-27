"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listJobs } from "@/lib/jobs";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const jobs = await listJobs(user.uid);

      setItems(jobs);
      setBusy(false);
    });

    return () => unsub();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">

        <header className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            History
          </h1>

          <p className="mt-1 text-slate-600">
            Jobs saved in Firestore (per user).
          </p>
        </header>

        <section className="rounded-xl bg-white p-6 shadow-sm">

          {busy ? (
            <p className="text-slate-600">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-slate-600">
              No jobs yet. Go to Upload and run a demo.
            </p>
          ) : (
            <ul className="space-y-3">

              {items.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-mono text-sm">
                      {job.jobId}
                    </div>

                    <div className="text-xs text-slate-500">
                      type: {job.type} • status: {job.status}
                    </div>
                  </div>

                  <a
                    className="text-blue-600 underline"
                    href={`/results/${job.jobId}`}
                  >
                    Open
                  </a>
                </li>
              ))}

            </ul>
          )}

          <div className="mt-4 flex gap-3">
            <a
              className="rounded-lg bg-slate-900 px-4 py-2 text-white inline-block"
              href="/upload"
            >
              Back to Upload
            </a>
          </div>

        </section>
      </div>
    </main>
  );
}