import mongoose, { Schema, Types } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface Ivideo extends Document {
  videoFile: string;
  thumbnail: string;
  owner: Types.ObjectId;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema({
  videoFile: {
    type: String,
    require: true,
  },
  thumbnail: {
    type: String,
    require: true,
  },
  owner: {
    type: Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    require: [true, "Title is Required "],
  },
  description: {
    type: String,
    require: [true, "Description is Required "],
  },
  duration: {
    type: Number,
    require: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
});

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<Ivideo>("Video", VideoSchema);
