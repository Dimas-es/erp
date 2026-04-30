import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session as Session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session.user as any).role !== "ADMIN") redirect("/");
  return session;
}

export function getRole(session: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.role as "ADMIN" | "KASIR" | undefined;
}
