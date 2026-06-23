"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginTrainer(formData: any) {
  const { email, password } = formData;
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/profile",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
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
  const { name, email, password } = formData;
  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { error: "Email is already registered to a trainer." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        favPokemon: null,
        homeRegion: "Kanto",
      },
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
