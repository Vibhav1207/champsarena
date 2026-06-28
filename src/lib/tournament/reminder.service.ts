import { prisma } from "@/lib/db";
import { Tournament, RegistrationStatus, TournamentStatus } from "@prisma/client";

export class TournamentReminderService {
  /**
   * Check for upcoming tournaments and send reminders based on time windows
   * This method should be called periodically (e.g., every minute) by a cron service
   */
  public async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();

      // Get all upcoming squad tournaments that have open registration or are upcoming (but not started)
      // We don't send start-time reminders for ongoing tournaments
      const upcomingTournaments = await prisma.tournament.findMany({
        where: {
          mode: "SQUAD",
          status: {
            in: ["REGISTRATION_OPEN", "UPCOMING"] // Not ONGOING - we don't remind after start
          },
          startDate: {
            gt: now
          }
        },
        include: {
          squadRegistrations: {
            where: {
              status: "APPROVED"
            },
            include: {
              squad: {
                include: {
                  members: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          registrations: {
            where: {
              status: "APPROVED"
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Process each tournament for reminder eligibility
      for (const tournament of upcomingTournaments) {
        await this.processTournamentReminders(tournament, now);
      }
    } catch (error) {
      console.error("Error checking and sending tournament reminders:", error);
    }
  }

  /**
   * Process reminders for a specific tournament based on time windows
   * Uses precise time windows to minimize duplicate notifications
   */
  private async processTournamentReminders(
    tournament: any,
    now: Date
  ): Promise<void> {
    const timeUntilStart = tournament.startDate.getTime() - now.getTime();
    const minutesUntilStart = Math.floor(timeUntilStart / (1000 * 60)); // Round down to avoid edge cases
    const secondsUntilStart = Math.floor(timeUntilStart / 1000);

    // Define exact reminder times in seconds before start
    const reminderTimes = [
      { seconds: 60 * 60, type: 'HOUR' },      // 60 minutes
      { seconds: 30 * 60, type: 'THIRTY' },    // 30 minutes
      { seconds: 20 * 60, type: 'TWENTY' },    // 20 minutes
      { seconds: 10 * 60, type: 'TEN' },       // 10 minutes
      { seconds: 5 * 60, type: 'FIVE' }        // 5 minutes
    ];

    // Check if we're at any of the exact reminder times (within 30-second window)
    for (const reminder of reminderTimes) {
      const timeDiff = Math.abs(secondsUntilStart - reminder.seconds);

      // Only trigger if we're within 30 seconds of the target time
      if (timeDiff <= 30) {
        // Send the reminder - rely on precise timing to prevent most duplicates
        // In a production system with higher frequency checks, you might want
        // to add a more robust deduplication mechanism (e.g., database tracking)
        await this.sendTournamentReminders(tournament, reminder.type as 'HOUR' | 'THIRTY' | 'TWENTY' | 'TEN' | 'FIVE');
      }
    }
  }

  /**
   * Send reminders to eligible participants for a tournament
   */
  private async sendTournamentReminders(
    tournament: any,
    reminderType: 'HOUR' | 'THIRTY' | 'TWENTY' | 'TEN' | 'FIVE'
  ): Promise<void> {
    // Get all eligible recipients (squad members and individual registrants)
    const recipients = await this.getEligibleRecipients(tournament);

    if (recipients.length === 0) {
      return;
    }

    // Prepare message based on reminder type
    let baseMessage = "";

    if (reminderType === 'HOUR') {
      baseMessage = `🏆 Your tournament "${tournament.title}" starts in 1 hour!\n\nYour Room ID and Password are now available.`;
    } else if (reminderType === 'FIVE') {
      baseMessage = `🚨 Your tournament "${tournament.title}" starts in 5 minutes!\n\nPlease join the room now:\nRoom ID: ${tournament.id}\nPassword: ${this.generateRoomPassword(tournament.id)}\nGood luck!`;
    } else {
      const minutes =
        reminderType === 'THIRTY' ? 30 :
        reminderType === 'TWENTY' ? 20 :
        reminderType === 'TEN' ? 10 : 0;

      baseMessage = `⏰ Your tournament "${tournament.title}" starts in ${minutes} minutes.`;

      // Add room details for squad tournaments (only for team members)
      if (tournament.mode === "SQUAD") {
        baseMessage += `\n\n📍 Room Info:\nRoom ID: ${tournament.id}\nPassword: ${this.generateRoomPassword(tournament.id)}`;
      }
    }

    // Create notifications for all eligible recipients
    const notifications = recipients.map(recipient => {
      // Personalize the message slightly
      const isTeamCaptain =
        tournament.squadRegistrations.some((sr: any) =>
          sr.squad.captainId === recipient.id
        );

      let message = baseMessage;

      // Add a personal touch for captains
      if (isTeamCaptain && reminderType === 'HOUR') {
        message = `👑 Team Captain Notice:\n${message}\n\nAs team captain, please share the room details only with your team members.`;
      }

      return {
        userId: recipient.id,
        message: message,
        type: "INFO" as const,
      };
    });

    try {
      await prisma.notification.createMany({
        data: notifications,
      });

      console.log(`Sent ${reminderType} minute reminder for tournament "${tournament.title}" to ${notifications.length} users`);
    } catch (error) {
      console.error("Failed to create tournament reminders:", error);
    }

    // Send email notifications
    await this.sendEmailNotifications(recipients, tournament, baseMessage, reminderType);
  }

  /**
   * Get all eligible recipients for a tournament reminder
   * Only includes approved registered teams and their members
   * Excludes: unregistered users, rejected/pending registrations, visitors
   */
  private async getEligibleRecipients(tournament: any): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    isTeamCaptain: boolean;
  }>> {
    const recipients: Array<{
      id: string;
      name: string;
      email?: string;
      isTeamCaptain: boolean;
    }> = [];

    // Add members from approved squad registrations
    for (const squadReg of tournament.squadRegistrations) {
      if (squadReg.status !== "APPROVED") continue;

      const squad = squadReg.squad;

      // Add team captain
      const captain = squad.members.find((m: any) => m.id === squad.captainId);
      if (captain) {
        recipients.push({
          id: captain.id,
          name: captain.name,
          email: captain.email,
          isTeamCaptain: true
        });
      }

      // Add co-captain if exists and approved
      if (squad.coCaptainId) {
        const coCaptain = squad.members.find((m: any) => m.id === squad.coCaptainId);
        if (coCaptain) {
          recipients.push({
            id: coCaptain.id,
            name: coCaptain.name,
            email: coCaptain.email,
            isTeamCaptain: false
          });
        }
      }

      // Add regular team members (excluding captain and co-captain to avoid duplicates)
      const regularMembers = squad.members.filter((m: any) =>
        m.id !== squad.captainId && m.id !== squad.coCaptainId
      );

      for (const member of regularMembers) {
        recipients.push({
          id: member.id,
          name: member.name,
          email: member.email,
          isTeamCaptain: false
        });
      }
    }

    // For squad tournaments, individual registrations don't apply for room reminders
    // They get match-specific notifications through the match system
    // So we don't add individual registrants here for room-based reminders
    // (They would get game-start notifications from the match system instead)

    // Remove duplicates
    const seenIds = new Set<string>();
    return recipients.filter(recipient => {
      if (seenIds.has(recipient.id)) {
        return false;
      }
      seenIds.add(recipient.id);
      return true;
    });
  }

  /**
   * Generate a room password for a tournament
   * In production, this should be securely generated and stored
   */
  private generateRoomPassword(tournamentId: string): string {
    // Create a deterministic but non-obvious password from the tournament ID
    // In a real system, this would be randomly generated and stored securely
    let hash = 0;
    for (let i = 0; i < tournamentId.length; i++) {
      const char = tournamentId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Make it positive and convert to base 36 for alphanumeric
    const color = Math.abs(hash).toString(36);
    return color.substring(0, 8).toUpperCase();
  }

  /**
   * Send email notifications to users
   * Placeholder for email service integration
   */
  private async sendEmailNotifications(
    recipients: Array<{ id: string; name: string; email?: string | undefined; }>,
    tournament: any,
    message: string,
    reminderType: 'HOUR' | 'THIRTY' | 'TWENTY' | 'TEN' | 'FIVE'
  ): Promise<void> {
    // Filter recipients who have email addresses
    const emailRecipients = recipients.filter(r => r.email);

    if (emailRecipients.length === 0) {
      return;
    }

    // In a real implementation:
    // 1. Check user email notification preferences (would need DB field)
    // 2. Use email service (SendGrid, SES, Mailgun, etc.)
    // 3. Track delivery and handle bounces

    // For now, we'll just log that we would send emails
    const typeLabels: Record<string, string> = {
      HOUR: "1-hour",
      THIRTY: "30-minute",
      TWENTY: "20-minute",
      TEN: "10-minute",
      FIVE: "5-minute"
    };

    console.log(
      `[EMAIL QUEUE] Would send ${emailRecipients.length} ${typeLabels[reminderType]} reminder emails for tournament "${tournament.title}"`
    );

    // TODO: Implement actual email sending when email service is configured
    // Example:
    // const emailPromises = emailRecipients.map(recipient =>
    //   emailService.send({
    //     to: recipient.email,
    //     from: process.env.EMAIL_FROM,
    //     subject: `[Champions Arena] ${tournament.title} - Tournament Reminder`,
    //     html: this.generateEmailTemplate(tournament, message, reminderType)
    //   })
    // );
    // await Promise.allSettled(emailPromises);
  }
}