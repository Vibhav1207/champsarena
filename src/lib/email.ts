import * as fs from "fs";
import * as path from "path";

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function logSimulatedEmail(options: EmailOptions) {
  try {
    // Ensure scratch directory exists
    const scratchDir = path.join(process.cwd(), "scratch");
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }

    const logPath = path.join(scratchDir, "sent_emails.log");
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] TO: ${options.to}\nSUBJECT: ${options.subject}\nBODY:\n${options.body}\n------------------------------------------------------------\n\n`;

    fs.appendFileSync(logPath, entry, "utf8");
    console.log(`[Email Mock] Email logged to scratch/sent_emails.log for: ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email Mock] Failed to write simulated email:", error);
    return false;
  }
}
