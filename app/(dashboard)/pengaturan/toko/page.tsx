import { requireAdmin } from "@/src/lib/rbac";
import { getStoreSettings, updateStoreSettings } from "@/src/actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export default async function PengaturanTokoPage() {
  await requireAdmin();
  const s = await getStoreSettings();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Pajak & diskon toko</h1>
        <p className="text-muted-foreground text-sm">
          Pajak dihitung dari subtotal setelah diskon. Batas diskon membatasi kasir di POS.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateStoreSettings} className="space-y-4">
            <div>
              <Label htmlFor="defaultTaxPercent">Pajak default (%)</Label>
              <Input
                id="defaultTaxPercent"
                name="defaultTaxPercent"
                type="number"
                step="0.1"
                defaultValue={s.defaultTaxPercent}
              />
            </div>
            <div>
              <Label htmlFor="maxDiscountPercentKasir">Maks diskon kasir (% dari subtotal)</Label>
              <Input
                id="maxDiscountPercentKasir"
                name="maxDiscountPercentKasir"
                type="number"
                step="1"
                defaultValue={s.maxDiscountPercentKasir}
              />
            </div>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
