"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "email";
  placeholder?: string;
  defaultValue?: string | number;
}

interface CrudDialogProps {
  title: string;
  fields: FieldDef[];
  defaultValues?: Record<string, string | number>;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
}

export function CrudDialog({
  title,
  fields,
  defaultValues,
  onSubmit,
  trigger,
  mode = "create",
}: CrudDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? `${title} berhasil ditambahkan` : `${title} berhasil diperbarui`);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? `Tambah ${title}` : `Edit ${title}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                defaultValue={defaultValues?.[field.name] ?? field.defaultValue ?? ""}
                required
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteButtonProps {
  label: string;
  onDelete: () => Promise<{ success?: boolean }>;
}

export function DeleteButton({ label, onDelete }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Hapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) return;
    startTransition(async () => {
      await onDelete();
      toast.success(`${label} berhasil dihapus`);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

export { Pencil };
