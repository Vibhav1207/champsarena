import { redirect } from "next/navigation";

export default async function LeaderboardGameRedirectPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  redirect(`/games/${game}/leaderboards`);
}
