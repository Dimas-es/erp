import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: "text", phone: "text" });

const Customer: Model<ICustomer> =
  mongoose.models.Customer ?? mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
