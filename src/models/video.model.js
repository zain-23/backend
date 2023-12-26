import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videpSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudnary URL
      required: [true, "video is required"],
    },
    thumbnail: {
      type: String, //cloudnary URL
      required: [true, "thumbnail is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    duration: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

videpSchema.plugin(mongooseAggregatePaginate);

export const VIDEO = mongoose.model("Video", videpSchema);
