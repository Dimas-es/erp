import { requireAdmin } from "@/src/lib/rbac";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/src/actions/supplier";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { CrudDialog, DeleteButton } from "@/src/components/crud-dialog";
import { Button } from "@/src/components/ui/button";
import { Pencil } from "lucide-react";

const fields = [
  { name: "name", label: "Nama Supplier", placeholder: "Contoh: PT. Semen Gresik" },
  { name: "phone", label: "Telepon", placeholder: "Contoh: 081234567890" },
  { name: "address", label: "Alamat", placeholder: "Contoh: Jl. Industri No. 1" },
];

export default async function SupplierPage() {
  await requireAdmin();
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier</h1>
          <p className="text-muted-foreground">Kelola data supplier</p>
        </div>
        <CrudDialog
          title="Supplier"
          fields={fields}
          onSubmit={createSupplier}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total {suppliers.length} supplier</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada supplier.
            </p>
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
                {suppliers.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone || "-"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{s.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CrudDialog
                          title="Supplier"
                          fields={fields}
                          mode="edit"
                          defaultValues={{ name: s.name, phone: s.phone, address: s.address }}
                          onSubmit={updateSupplier.bind(null, s._id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          label={s.name}
                          onDelete={deleteSupplier.bind(null, s._id)}
                        />
                      </div>
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
