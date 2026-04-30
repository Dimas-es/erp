import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { Sidebar } from "@/src/components/sidebar";
import { Topbar } from "@/src/components/topbar";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { name?: string; email?: string; role?: string };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex h-full print:hidden">
        <Sidebar
          userName={user.name ?? "User"}
          userRole={user.role ?? "KASIR"}
        />
      </div>
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "hsl(220 20% 98%)" }}
      >
        <div className="print:hidden">
          <Topbar
            userName={user.name ?? "User"}
            userRole={user.role ?? "KASIR"}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
