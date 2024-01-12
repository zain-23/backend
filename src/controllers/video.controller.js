import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ];

  if (query) {
    pipeline.push({
      $match: {
        title: { $regex: query, $option: "i" },
      },
    });
  }
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

  const video = await uploadOnCloudinary("youtube/video", videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(
    "youtube/videoThumbnail",
    thumbnailFileLocalPath
  );

  if (!video) {
    throw new ApiError(500, "Some thing went wrong while uploading video");
  }

  if (!thumbnail) {
    throw new ApiError(500, "Some thing went wrong while uploading thumbnail");
  }

  const publishedVideo = await Video.create({
    title,
    description,
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    duration: Math.round(video?.duration),
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

  // delete on thumbnail
  const existingVideo = await Video.findById(videoId);
  const deleteThumbnailFromCloudinary = await deleteFromCloudinary(
    "youtube/video",
    existingVideo.thumbnail
  );

  if (deleteThumbnailFromCloudinary?.result === "ok") {
    let thumbnailFileLocalPath;
    if (req.file && req.file.path) {
      thumbnailFileLocalPath = req.file.path;
    }

    const thumbnailCloudinary = await uploadOnCloudinary(
      "youtube/videoThumbnail",
      thumbnailFileLocalPath
    );

    if (!thumbnailCloudinary) {
      throw new ApiError("something went wrong while updating video details");
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnailCloudinary.url,
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
  } else {
    throw new ApiError(
      500,
      "something went wrong while updating video try again"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "can't find video");
  }

  const deleteThumbnailFromCloudinary = await deleteFromCloudinary(
    "youtube/videoThumbnail",
    video.thumbnail
  );

  if (!deleteThumbnailFromCloudinary) {
    throw new ApiError(500, "something went wrong while deleting thumbnail");
  }

  const deleteVideoFromCloudinary = await deleteFromCloudinary(
    "youtube/video",
    video.videoFile
  );

  if (!deleteVideoFromCloudinary) {
    throw new ApiError(500, "something went wrong while deleting video");
  }

  const deleteFromDB = await Video.findByIdAndDelete(video._id);

  return res
    .status(200)
    .json(new ApiResponse(201, "video deleted successfully", deleteFromDB));
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
