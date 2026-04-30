"use server";

import { connectDB } from "@/src/lib/db";
import AuditLog from "@/src/models/AuditLog";
import { requireAdmin } from "@/src/lib/rbac";

export async function getAuditLogs(params?: { page?: number; limit?: number }) {
  await requireAdmin();
  await connectDB();
  const { page = 1, limit = 40 } = params ?? {};

  const [rows, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(),
  ]);

  return {
    rows: rows.map((r) => ({
      _id: r._id.toString(),
      actorName: r.actorName,
      actorEmail: r.actorEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.summary,
      createdAt: r.createdAt,
    })),
    total,
    pages: Math.ceil(total / limit),
  };
}
