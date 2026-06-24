"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginTrainer(formData: any) {
  const { email, password, captchaAnswer, captchaToken } = formData;

  // CAPTCHA verification
  const { verifyCaptcha } = await import("@/lib/captcha");
  if (!verifyCaptcha(captchaAnswer, captchaToken)) {
    return { error: "Security puzzle solved incorrectly. Please try again." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/profile",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const errMsg = (error as any).cause?.err?.message || error.message || "";
      if (errMsg.includes("LOCKOUT")) {
        return { error: "This account is temporarily locked. Try again in 15 minutes." };
      }
      if (errMsg.includes("LOCKED_NOW")) {
        return { error: "Too many failed attempts. Your account has been locked for 15 minutes." };
      }
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid trainer credentials." };
        default:
          return { error: "Something went wrong during entry." };
      }
    }
    throw error;
  }
}

export async function registerTrainer(formData: any) {
  const { name, email, password, captchaAnswer, captchaToken } = formData;

  // CAPTCHA verification
  const { verifyCaptcha } = await import("@/lib/captcha");
  if (!verifyCaptcha(captchaAnswer, captchaToken)) {
    return { error: "Security puzzle solved incorrectly. Please try again." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { error: "Email is already registered to a trainer." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create trainer ID and default username from name
    const generatedUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username: generatedUsername,
        password: hashedPassword,
        favPokemon: null,
      },
    });

    // Send welcome email
    const { logSimulatedEmail } = await import("@/lib/email");
    await logSimulatedEmail({
      to: email,
      subject: "Welcome to ChampsArena!",
      body: `Hello  ${name},\n\nWelcome to ChampsArena! Your trainer profile has been created successfully.\nYour official username is: ${generatedUsername}\n\nPrepare for battle!\n- ChampsArena Team`,
    });

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/profile",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration succeeded, but auto-login failed. Please sign in manually." };
    }
    throw error;
  }
}

export async function logoutTrainer() {
  await signOut({ redirectTo: "/login" });
}

export async function socialLogin(provider: "google" | "discord") {
  await signIn(provider, { redirectTo: "/profile" });
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Prevent user enumeration by returning success anyway
      return { success: true };
    }

    const resetToken = Math.random().toString(36).substring(2, 15);
    const { logSimulatedEmail } = await import("@/lib/email");
    await logSimulatedEmail({
      to: email,
      subject: "ChampsArena Password Reset Key",
      body: `Hello,\n\nYou requested a password reset key for ChampsArena.\nReset Token: ${resetToken}\nReset Link: http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to initiate password reset." };
  }
}

export async function completePasswordReset(formData: any) {
  const { email, password, confirmPassword, token } = formData;
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (!token) {
    return { error: "Reset token is missing or invalid." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return { error: "Trainer profile not found." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update security credentials." };
  }
}
