import { requireAdmin } from "@/src/lib/rbac";
import { getUsers } from "@/src/actions/user";
import { auth } from "@/src/lib/auth";
import { UsersAdminTable } from "@/src/components/users-admin-table";

export default async function PenggunaPage() {
  await requireAdmin();
  const users = await getUsers();
  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengguna</h1>
        <p className="text-muted-foreground text-sm">Kelola akun kasir dan admin</p>
      </div>
      <UsersAdminTable users={users} currentUserId={currentUserId} />
    </div>
  );
}
