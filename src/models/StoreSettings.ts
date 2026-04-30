import mongoose, { Schema, Model } from "mongoose";

export interface IStoreSettings {
  _id: string;
  defaultTaxPercent: number;
  maxDiscountPercentKasir: number;
  updatedAt?: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    _id: { type: String, default: "default" },
    defaultTaxPercent: { type: Number, default: 11, min: 0, max: 100 },
    maxDiscountPercentKasir: { type: Number, default: 15, min: 0, max: 100 },
  },
  { timestamps: true }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StoreSettings: Model<any> =
  mongoose.models.StoreSettings ??
  mongoose.model("StoreSettings", StoreSettingsSchema);

export default StoreSettings;
