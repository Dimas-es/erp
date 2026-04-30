import { connectDB } from "@/src/lib/db";
import AuditLog from "@/src/models/AuditLog";

export type AuditPayload = {
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(payload: AuditPayload) {
  await connectDB();
  await AuditLog.create({
    actorId: payload.actorId,
    actorName: payload.actorName,
    actorEmail: payload.actorEmail,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    summary: payload.summary,
    metadata: payload.metadata,
  });
}
