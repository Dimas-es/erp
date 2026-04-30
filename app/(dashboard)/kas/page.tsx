import { auth } from "@/src/lib/auth";
import { getRole } from "@/src/lib/rbac";
import { getOpenShiftForCashier, getShiftHistory } from "@/src/actions/shift";
import { ShiftControls } from "@/src/components/shift-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { formatRupiah } from "@/src/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/src/components/ui/badge";

export default async function KasPage() {
  const session = await auth();
  if (!session?.user) return null;
  const role = getRole(session) ?? "KASIR";

  const openShiftRow =
    role === "KASIR" ? await getOpenShiftForCashier() : null;

  const serializedOpen = openShiftRow
    ? {
        _id: openShiftRow._id,
        openedAt:
          typeof openShiftRow.openedAt === "string"
            ? openShiftRow.openedAt
            : new Date(openShiftRow.openedAt).toISOString(),
        openingFloat: openShiftRow.openingFloat,
      }
    : null;

  const { shifts } = await getShiftHistory({ limit: 30 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kas & shift</h1>
        <p className="text-muted-foreground text-sm">
          Kasir membuka dan menutup shift; admin melihat seluruh riwayat.
        </p>
      </div>

      <ShiftControls openShiftRow={serializedOpen} userRole={role} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Riwayat shift</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kasir</TableHead>
                <TableHead>Buka</TableHead>
                <TableHead>Tutup</TableHead>
                <TableHead className="text-right">Saldo awal</TableHead>
                <TableHead className="text-right">Harusnya</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada data
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell className="font-medium">{s.cashierName}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(s.openedAt), "d MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {s.closedAt
                        ? format(new Date(s.closedAt), "d MMM HH:mm", { locale: id })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(s.openingFloat)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {s.expectedCash != null ? formatRupiah(s.expectedCash) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.difference != null ? formatRupiah(s.difference) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "OPEN" ? "warning" : "secondary"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
