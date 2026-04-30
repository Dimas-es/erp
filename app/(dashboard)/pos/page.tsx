import { POSClient } from "@/src/components/pos-client";
import { auth } from "@/src/lib/auth";
import { getRole } from "@/src/lib/rbac";
import { getStoreSettings } from "@/src/actions/settings";
import { getOpenShiftForCashier } from "@/src/actions/shift";

export default async function POSPage() {
  const session = await auth();
  const role = getRole(session) ?? "KASIR";
  const settings = await getStoreSettings();
  let needsOpenShift = false;
  if (role === "KASIR") {
    const open = await getOpenShiftForCashier();
    needsOpenShift = !open;
  }

  return (
    <POSClient
      defaultTaxPercent={settings.defaultTaxPercent}
      maxDiscountPercentKasir={settings.maxDiscountPercentKasir}
      userRole={role}
      needsOpenShift={needsOpenShift}
    />
  );
}
