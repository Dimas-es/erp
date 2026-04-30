import { requireAdmin } from "@/src/lib/rbac";
import { getAuditLogs } from "@/src/actions/audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent } from "@/src/components/ui/card";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AuditPage() {
  await requireAdmin();
  const { rows } = await getAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log audit</h1>
        <p className="text-muted-foreground text-sm">Riwayat aksi penting di sistem</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Ringkasan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Belum ada log
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(r.createdAt), "d MMM yyyy HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.actorName}</div>
                      <div className="text-xs text-muted-foreground">{r.actorEmail}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 rounded">{r.action}</code>
                    </TableCell>
                    <TableCell className="text-sm">{r.summary}</TableCell>
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
