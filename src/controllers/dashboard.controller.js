import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        videoIds: { $push: "$_id" },
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        totalVideos: 1,
        totalViews: 1,
        videoIds: 1,
      },
    },
  ]);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        totalSubscribers: 1,
      },
    },
  ]);

  const likes = await Like.aggregate([
    {
      $match: {
        video: { $in: videoStats[0].videoIds.map((video) => video._id) },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0, // Exclude the _id field
        totalLikes: 1,
      },
    },
  ]);

  if (!videoStats && !subscribers && !likes) {
    throw new ApiError(
      500,
      "some thing went wrong while getting channel status"
    );
  }

  const result = {
    videos: videoStats[0],
    subscribers: subscribers[0],
    likes: likes[0],
  };

  return res
    .status(200)
    .json(new ApiResponse(201, "get channel stats successfully", result));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!videos) {
    throw new ApiError(
      500,
      "something went wrong while getting the videos uploaded by the channel"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "get all channel videos successfully", videos));
});

export { getChannelStats, getChannelVideos };
