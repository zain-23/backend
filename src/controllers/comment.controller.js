import mongoose from "mongoose";
import { COMMENTS } from "../models/comments.model.js";
import { VIDEO } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId && !content) {
    throw new ApiError(401, "All field are required");
  }

  const video = await VIDEO.findById(videoId);

  if (new mongoose.Types.ObjectId(videoId) === video?._id) {
    throw new ApiError(401, "Incorrect video id");
  }

  const loggedInUser = req.user;

  const comment = await COMMENTS.create({
    video: videoId,
    content,
    owner: loggedInUser?._id,
  });

  if (!comment) {
    throw new ApiError(505, "Error while post comment try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Comment Posted successfully", comment));
});

export { addComments };
