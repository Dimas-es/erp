"use client";

import { CrudDialog, type FieldDef } from "@/src/components/crud-dialog";
import { createCustomer } from "@/src/actions/customer";

export function PelangganCreateDialog({ fields }: { fields: FieldDef[] }) {
  return <CrudDialog title="Pelanggan" fields={fields} onSubmit={createCustomer} />;
}
