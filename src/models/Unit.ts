import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUnit extends Document {
  name: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true },
    symbol: { type: String, required: true },
  },
  { timestamps: true }
);

const Unit: Model<IUnit> =
  mongoose.models.Unit ?? mongoose.model<IUnit>("Unit", UnitSchema);

export default Unit;
