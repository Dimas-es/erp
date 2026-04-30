import { requireAdmin } from "@/src/lib/rbac";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/src/actions/category";
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
  { name: "name", label: "Nama Kategori", placeholder: "Contoh: Semen & Beton" },
];

export default async function KategoriPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-muted-foreground">Kelola kategori produk</p>
        </div>
        <CrudDialog
          title="Kategori"
          fields={fields}
          onSubmit={createCategory}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Total {categories.length} kategori
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada kategori. Tambahkan kategori pertama.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cat.slug}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CrudDialog
                          title="Kategori"
                          fields={fields}
                          mode="edit"
                          defaultValues={{ name: cat.name }}
                          onSubmit={updateCategory.bind(null, cat._id)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          label={cat.name}
                          onDelete={deleteCategory.bind(null, cat._id)}
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
