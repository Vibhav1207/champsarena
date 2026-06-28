import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-center h-16 border-b-4 border-primary bg-white">
          <span className="material-symbols-outlined text-primary text-2xl">emoji_events</span>
        </div>
        <main className="flex-1 flex bg-black items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin"></div>
        </main>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}