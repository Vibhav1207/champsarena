"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import Navigation from "./navigation";

interface NavSession {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  } | null;
  notifications?: {
    count: number;
    recent: Array<{
      id: string;
      message: string;
      createdAt: string;
      read: boolean;
    }>;
  };
}

// Cache notifications for 30 seconds to reduce DB load
const getCachedNotifications = unstable_cache(
  async (userId: string) => {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          message: true,
          createdAt: true,
          read: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    ]);

    return {
      count: unreadCount,
      recent: notifications.map((n: typeof notifications[0]) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  },
  ["notifications"],
  { revalidate: 30, tags: ["notifications"] }
);

export async function getNavigationData(): Promise<NavSession> {
  const session = await auth();

  if (!session?.user?.id) {
    return { user: null };
  }

  // Fetch notifications using cached function
  const notifications = await getCachedNotifications(session.user.id);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email!,
      image: session.user.image,
      role: (session.user as any).role || "USER",
    },
    notifications,
  };
}

// Server component wrapper that fetches data and passes to client component
export default async function NavigationWrapper() {
  const data = await getNavigationData();
  return <Navigation initialSession={data} initialNotifications={data.notifications} />;
}