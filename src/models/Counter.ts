import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Counter: Model<any> =
  mongoose.models.Counter ?? mongoose.model("Counter", CounterSchema);

export default Counter;
