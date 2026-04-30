"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/src/lib/db";
import User from "@/src/models/User";
import { requireAdmin } from "@/src/lib/rbac";
import { z } from "zod";

const UserCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "KASIR"]),
});

const UserUpdateSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["ADMIN", "KASIR"]),
});

export async function getUsers() {
  await requireAdmin();
  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active !== false,
    createdAt: u.createdAt,
  }));
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = UserCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  const exists = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (exists) return { error: "Email sudah terdaftar" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    passwordHash,
    role: parsed.data.role,
    active: true,
  });

  const { writeAuditLog } = await import("@/src/lib/audit");
  const s = await (await import("@/src/lib/auth")).auth();
  if (s?.user) {
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "USER_CREATE",
      entityType: "User",
      summary: `Buat pengguna ${parsed.data.email}`,
      metadata: { role: parsed.data.role },
    });
  }

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();
  await connectDB();

  const parsed = UserUpdateSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  await User.findByIdAndUpdate(id, {
    name: parsed.data.name,
    role: parsed.data.role,
  });

  const s = await (await import("@/src/lib/auth")).auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "USER_UPDATE",
      entityType: "User",
      entityId: id,
      summary: `Perbarui pengguna ${id}`,
    });
  }

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}

export async function setUserActive(id: string, active: boolean) {
  await requireAdmin();
  await connectDB();

  const me = await (await import("@/src/lib/auth")).auth();
  if (me?.user && (me.user as { id: string }).id === id && !active) {
    return { error: "Tidak bisa menonaktifkan akun sendiri" };
  }

  await User.findByIdAndUpdate(id, { active });

  const s = await (await import("@/src/lib/auth")).auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: active ? "USER_ACTIVATE" : "USER_DEACTIVATE",
      entityType: "User",
      entityId: id,
      summary: active ? "Aktifkan pengguna" : "Nonaktifkan pengguna",
    });
  }

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}

export async function resetUserPassword(id: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 6) return { error: "Password minimal 6 karakter" };

  await connectDB();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(id, { passwordHash });

  const s = await (await import("@/src/lib/auth")).auth();
  if (s?.user) {
    const { writeAuditLog } = await import("@/src/lib/audit");
    await writeAuditLog({
      actorId: (s.user as { id: string }).id,
      actorName: s.user.name ?? "",
      actorEmail: s.user.email ?? "",
      action: "USER_RESET_PASSWORD",
      entityType: "User",
      entityId: id,
      summary: "Reset password pengguna",
    });
  }

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}
