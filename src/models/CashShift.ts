import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICashShift extends Document {
  cashierId: Types.ObjectId;
  cashierName: string;
  openingFloat: number;
  openedAt: Date;
  closedAt?: Date;
  closingCounted?: number;
  expectedCash?: number;
  difference?: number;
  status: "OPEN" | "CLOSED";
  note?: string;
}

const CashShiftSchema = new Schema<ICashShift>(
  {
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cashierName: { type: String, required: true },
    openingFloat: { type: Number, required: true, min: 0 },
    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date },
    closingCounted: { type: Number },
    expectedCash: { type: Number },
    difference: { type: Number },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
    note: { type: String },
  },
  { timestamps: true }
);

CashShiftSchema.index({ cashierId: 1, status: 1 });
CashShiftSchema.index({ openedAt: -1 });

const CashShift: Model<ICashShift> =
  mongoose.models.CashShift ?? mongoose.model<ICashShift>("CashShift", CashShiftSchema);

export default CashShift;
