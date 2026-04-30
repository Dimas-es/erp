"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { createUser, updateUser, setUserActive, resetUserPassword } from "@/src/actions/user";
import { Plus } from "lucide-react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export function UsersAdminTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [openCreate, setOpenCreate] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Pengguna baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah pengguna</DialogTitle>
            </DialogHeader>
            <CreateUserForm
              onDone={() => {
                setOpenCreate(false);
                router.refresh();
              }}
              startTransition={startTransition}
              pending={pending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u._id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{u.role}</Badge>
              </TableCell>
              <TableCell>
                {u.active ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="destructive">Nonaktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <EditUserDialog user={u} startTransition={startTransition} pending={pending} />
                <ResetPwdDialog userId={u._id} startTransition={startTransition} pending={pending} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending || u._id === currentUserId}
                  onClick={() => {
                    startTransition(async () => {
                      const r = await setUserActive(u._id, !u.active);
                      if (r.error) toast.error(r.error);
                      else {
                        toast.success(u.active ? "Dinonaktifkan" : "Diaktifkan");
                        router.refresh();
                      }
                    });
                  }}
                >
                  {u.active ? "Off" : "On"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateUserForm({
  onDone,
  startTransition,
  pending,
}: {
  onDone: () => void;
  startTransition: (fn: () => void | Promise<void>) => void;
  pending: boolean;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await createUser(fd);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Pengguna dibuat");
            onDone();
          }
        });
      }}
    >
      <div>
        <Label>Nama</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required />
      </div>
      <div>
        <Label>Password</Label>
        <Input name="password" type="password" required minLength={6} />
      </div>
      <div>
        <Label>Role</Label>
        <select
          name="role"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue="KASIR"
        >
          <option value="KASIR">KASIR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditUserDialog({
  user,
  startTransition,
  pending,
}: {
  user: UserRow;
  startTransition: (fn: () => void | Promise<void>) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.email}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await updateUser(user._id, fd);
              if (r.error) toast.error(r.error);
              else {
                toast.success("Diperbarui");
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <div>
            <Label>Nama</Label>
            <Input name="name" defaultValue={user.name} required />
          </div>
          <div>
            <Label>Role</Label>
            <select
              name="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              defaultValue={user.role}
            >
              <option value="KASIR">KASIR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPwdDialog({
  userId,
  startTransition,
  pending,
}: {
  userId: string;
  startTransition: (fn: () => void | Promise<void>) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Reset pwd
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password baru</DialogTitle>
        </DialogHeader>
        <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={6} />
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const r = await resetUserPassword(userId, pwd);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Password diperbarui");
                  setOpen(false);
                  setPwd("");
                  router.refresh();
                }
              });
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
