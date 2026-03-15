import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: null
    },

    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      default: null
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    }
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
