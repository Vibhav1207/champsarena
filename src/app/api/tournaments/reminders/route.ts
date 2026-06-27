import { NextRequest, NextResponse } from "next/server";
import { TournamentReminderService } from "@/lib/tournament/reminder.service";

/**
 * Tournament Reminder API Endpoint
 *
 * POST /api/tournaments/reminders
 *   Triggers a check for upcoming tournaments and sends reminders to eligible participants.
 *   Should be called periodically (e.g., every minute) by an external cron service.
 *
 * GET /api/tournaments/reminders
 *   Returns service status information.
 *
 * SETUP:
 * To enable automatic reminders, configure a cron service to call this endpoint:
 *
 * Example using cron (every minute):
 *   * * * * * curl -X POST https://your-domain.com/api/tournaments/reminders
 *
 * Example using Vercel Cron Jobs:
 *   In vercel.json: { "crons": [ { "path": "/api/tournaments/reminders" }] }
 *
 * SECURITY (optional):
 * Set the TOURNAMENT_REMINDER_SECRET environment variable and include:
 *   Authorization: Bearer <your-secret>
 * in the cron request headers for protection.
 */

export const dynamic = "force-dynamic";

/**
 * POST /api/tournaments/reminders - Trigger tournament reminder check
 * This endpoint should be called periodically (e.g., every minute) by an external cron service
 * to check for upcoming tournaments and send reminders to eligible participants.
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add simple authentication for the cron job
    // In production, you might want to use a secret token, IP whitelisting, or signature verification
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.TOURNAMENT_REMINDER_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reminderService = new TournamentReminderService();
    await reminderService.checkAndSendReminders();

    return NextResponse.json({
      success: true,
      message: "Tournament reminder check completed",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Failed to check tournament reminders:", error);
    return NextResponse.json(
      { error: "Failed to process tournament reminders" },
      { status: 500 }
    );
  }
}

/**
* GET /api/tournaments/reminders - Get reminder service status (for monitoring)
*/
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      service: "Tournament Reminder Service",
      status: "active",
      description: "Use POST to trigger reminder checks. Call this endpoint periodically (e.g., every minute) via cron service.",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get service status" },
      { status: 500 }
    );
  }
}