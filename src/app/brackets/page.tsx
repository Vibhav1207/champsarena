import { Suspense } from "react";
import BracketsClient from "./BracketsClient";

export default function BracketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-black uppercase tracking-widest">
        Loading Battle Brackets...
      </div>
    }>
      <BracketsClient />
    </Suspense>
  );
}