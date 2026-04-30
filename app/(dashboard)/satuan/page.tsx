import { requireAdmin } from "@/src/lib/rbac";
import { getUnits, createUnit, updateUnit, deleteUnit } from "@/src/actions/unit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { CrudDialog, DeleteButton } from "@/src/components/crud-dialog";
import { Button } from "@/src/components/ui/button";
import { Pencil } from "lucide-react";

const fields = [
  { name: "name", label: "Nama Satuan", placeholder: "Contoh: Kilogram" },
  { name: "symbol", label: "Simbol", placeholder: "Contoh: kg" },
];

export default async function SatuanPage() {
  await requireAdmin();
  const units = await getUnits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satuan</h1>
          <p className="text-muted-foreground">Kelola satuan produk</p>
        </div>
        <CrudDialog
          title="Satuan"
          fields={fields}
          onSubmit={createUnit}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Total {units.length} satuan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada satuan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Simbol</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit._id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{unit.symbol}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CrudDialog
                          title="Satuan"
                          fields={fields}
                          mode="edit"
                          defaultValues={{ name: unit.name, symbol: unit.symbol }}
                          onSubmit={updateUnit.bind(null, unit._id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          label={unit.name}
                          onDelete={deleteUnit.bind(null, unit._id)}
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
