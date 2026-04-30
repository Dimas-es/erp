"use client";

import { CrudDialog, DeleteButton, type FieldDef } from "@/src/components/crud-dialog";
import { Button } from "@/src/components/ui/button";
import { Pencil } from "lucide-react";
import { updateCustomer, deleteCustomer } from "@/src/actions/customer";

export function PelangganRowActions({
  fields,
  customer,
}: {
  fields: FieldDef[];
  customer: {
    _id: string;
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
}) {
  return (
    <>
      <CrudDialog
        title="Pelanggan"
        fields={fields}
        mode="edit"
        defaultValues={{
          name: customer.name,
          phone: customer.phone ?? "",
          address: customer.address ?? "",
          notes: customer.notes ?? "",
        }}
        onSubmit={(fd) => updateCustomer(customer._id, fd)}
        trigger={
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />
      <DeleteButton label={customer.name} onDelete={() => deleteCustomer(customer._id)} />
    </>
  );
}
