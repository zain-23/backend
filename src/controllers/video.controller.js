import mongoose from "mongoose";
import { COMMENTS } from "../models/comments.model.js";
import { VIDEO } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((data) => data === "" || data === undefined)) {
    throw new ApiError(401, "All fields are required");
  }

  let videoFileLocalPath;
  let thumbnailLocalPath;

  if (
    req.files &&
    Array.isArray(req.files?.videoFile) &&
    Array.isArray(req.files?.thumbnail)
  ) {
    videoFileLocalPath = req.files?.videoFile[0]?.path;
    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  }

  if (!videoFileLocalPath && !thumbnailLocalPath) {
    throw new ApiError(401, "video or thumbnailLocalPath is required");
  }

  const uploadedvideoFile = await uploadOnCloudinary(videoFileLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedvideoFile) {
    throw new ApiError(
      500,
      "some went wrong while uploading video try again later"
    );
  }

  if (!uploadedThumbnail) {
    throw new ApiError(
      500,
      "some went wrong while uploading thumbnail try again later"
    );
  }

  const videoUploaded = await VIDEO.create({
    title: title,
    description: description,
    owner: req.user?._id,
    videoFile: uploadedvideoFile.url,
    thumbnail: uploadedThumbnail.url,
    duration: Math.floor(uploadedvideoFile.duration),
  });

  if (!videoUploaded) {
    throw new ApiError(
      500,
      "some went wrong while uploading video try again later"
    );
  }
  return res
    .status(201)
    .json(new ApiResponse(201, videoUploaded, "video uploaded successfully"));
});

const getSingleVideo = asyncHandler(async (req, res) => {
  // get video id with params.
  // check not empty.
  // get video from db.
  // check if video is exist.
  // then find video Comments with video id.
  // then in Comment used aggregate pipeline and lookup users.
  // if comment doesn't exist return 0.
  // create an object with video detail and comment detail and return the res.

  const { id } = req.params;
  console.log("id", id);
  if (!id) {
    throw new ApiError(401, "video id is required");
  }

  const video = await VIDEO.findById(id);
  console.log("video", video);
  if (!video) {
    throw new ApiError(401, "can't find video");
  }

  const comment = await COMMENTS.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(201, "getting data", comment));
});

export { uploadVideo, getSingleVideo };
