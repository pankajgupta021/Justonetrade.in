import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN_PROVIDER"]);
  if (!auth.isAuthorized || !auth.user) return auth.response!;

  try {
    const body = await req.json();
    const { currentPassword, newEmail, newPassword } = body as {
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
    };

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { success: false, error: "Provide a new email or new password to update." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, passwordHash: true, email: true, role: true },
    });

    if (!user || user.role !== "ADMIN_PROVIDER") {
      return NextResponse.json(
        { success: false, error: "Access denied." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password. Please try again." },
        { status: 401 }
      );
    }

    const updateData: { email?: string; passwordHash?: string } = {};

    if (newEmail) {
      const trimmedEmail = newEmail.trim().toLowerCase();

      if (trimmedEmail === user.email) {
        return NextResponse.json(
          { success: false, error: "New email is the same as your current email." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "That email address is already in use." },
          { status: 409 }
        );
      }

      updateData.email = trimmedEmail;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    // 5. Persist
    await prisma.user.update({ where: { id: user.id }, data: updateData });

    return NextResponse.json({
      success: true,
      message: newEmail && newPassword
        ? "Email and password updated successfully."
        : newEmail
          ? "Email updated successfully."
          : "Password updated successfully.",
    });
  } catch (err) {
    console.error("update-credentials error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
