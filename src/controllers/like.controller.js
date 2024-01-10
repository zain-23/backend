import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// All Tweet Api Testing in done.

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid id");
  }

  const existingLike = await Like.findOneAndDelete({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, "Unliked video successfully"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!newLike) {
    throw new ApiError(500, "some thing went wrong doing like to video");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "liked video successfully", newLike));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "Invalid id");
  }

  const existingLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, "Unliked comment successfully"));
  }

  const commentLike = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!commentLike) {
    throw new ApiError(401, "some thing went wrong doing like to comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "liked comment successfully", commentLike));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(401, "Invalid id");
  }

  const existingLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, "Unliked tweet successfully"));
  }

  const commentLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!commentLike) {
    throw new ApiError(401, "some thing went wrong doing like to tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "liked tweet successfully", commentLike));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "user",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              user: {
                $first: "$user",
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $project: {
        video: 1,
        likedBy: 1,
      },
    },
  ]);

  if (!likedVideos) {
    throw new ApiError(401, "something went wrong while getting liked videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "liked videos successfully", likedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
