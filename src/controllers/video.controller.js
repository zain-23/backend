import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (
    [title, description].some((fields) => fields === "" || fields === undefined)
  ) {
    throw new ApiError(401, "Title and Description is required");
  }

  let videoFileLocalPath;
  let thumbnailFileLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    Array.isArray(req.files.thumbnail)
  ) {
    videoFileLocalPath = req.files?.videoFile[0].path;
    thumbnailFileLocalPath = req.files?.thumbnail[0].path;
  }

  if (!videoFileLocalPath && !thumbnailFileLocalPath) {
    throw new ApiError(401, "Thumbanil and video is required");
  }

  const video = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  if (!video) {
    throw new ApiError(500, "Some thing went wrong while uploading video");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Some thing went wrong while uploading thumbnail");
  }

  const publishedVideo = await Video.create({
    title,
    description,
    video: video.url,
    thumbnail: thumbnail.url,
    duration: Math.round(video.duration),
    owner: req.user?._id,
  });

  if (!publishedVideo) {
    throw new ApiError(
      500,
      "Some thing went wrong while publishing video try again later"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "video published successfully", publishedVideo));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "can't find video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "get video successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }
  let thumbnailFileLocalPath;
  if (req.file && req.file.path) {
    thumbnailFileLocalPath = req.file.path;
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnailFileLocalPath,
      },
    },
    {
      new: true,
    }
  );

  if (!video) {
    throw new ApiError(500, "some thing went wrong while updating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(500, "can't find video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "video deleted successfully", video));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  const updateVideoStatusUpdate = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!video) {
    throw new ApiError(500, "can't find video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        "video status updated successfully",
        updateVideoStatusUpdate
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
