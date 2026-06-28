import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-primary">
        <span className="material-symbols-outlined animate-spin text-5xl">progress_activity</span>
        <p className="text-lg font-bold uppercase tracking-wider">Loading trainer parameters…</p>
      </div>
    }>
      <ProfileClient />
    </Suspense>
  );
}