import mongoose, { Schema, Types } from "mongoose";

const subscriptionSchemea = new Schema({
  subscriber: {
    type: Types.ObjectId,
    ref: "User",
  },
  channel: {
    type: Types.ObjectId,
    ref: "User",
  },
});

export const Subscription = mongoose.model("Subscription", subscriptionSchemea);
