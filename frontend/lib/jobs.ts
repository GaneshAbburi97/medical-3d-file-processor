import { db } from "@/lib/firebase";

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

export async function saveJob(
  uid: string,
  jobId: string,
  type: "demo" | "upload"
) {
  await setDoc(doc(db, "jobs", jobId), {
    jobId,
    uid,
    type,
    status: "done",
    createdAt: serverTimestamp(),
  });
}

export async function listJobs(uid: string) {
  const q = query(
    collection(db, "jobs"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => d.data() as any);
}