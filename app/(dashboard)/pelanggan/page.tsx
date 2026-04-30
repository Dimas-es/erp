import { requireAdmin } from "@/src/lib/rbac";
import { getCustomers } from "@/src/actions/customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { FieldDef } from "@/src/components/crud-dialog";
import { PelangganCreateDialog } from "@/src/components/pelanggan-create-dialog";
import { PelangganRowActions } from "@/src/components/pelanggan-row-actions";

const fields: FieldDef[] = [
  { name: "name", label: "Nama", placeholder: "Nama pelanggan" },
  { name: "phone", label: "Telepon", placeholder: "08…" },
  { name: "address", label: "Alamat", placeholder: "Opsional" },
  { name: "notes", label: "Catatan", placeholder: "Opsional" },
];

export default async function PelangganPage() {
  await requireAdmin();
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggan</h1>
          <p className="text-muted-foreground text-sm">Master data pelanggan</p>
        </div>
        <PelangganCreateDialog fields={fields} />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{customers.length} pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Belum ada data</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.address || "—"}</TableCell>
                    <TableCell className="text-right">
                      <PelangganRowActions
                        fields={fields}
                        customer={{
                          _id: c._id,
                          name: c.name,
                          phone: c.phone,
                          address: c.address,
                          notes: c.notes,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
