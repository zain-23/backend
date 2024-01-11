import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(401, "invalid channel id");
  }

  const existingSubscribe = await Subscription.findOneAndDelete({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (existingSubscribe) {
    return res
      .status(200)
      .json(new ApiResponse(201, "Unsubscribe successfully"));
  }

  const subscribed = await Subscription.create({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!subscribed) {
    throw new ApiError(500, "something went wrong while doing subscribe");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "subscribe successfully", subscribed));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(401, "invalid channel id");
  }

  const channelsSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscribers",
        },
      },
    },
    {
      $project: {
        subscriber: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channelsSubscribers) {
    throw new ApiError(500, "something went wrong while getting subscribers");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, "get subscriber successfully", channelsSubscribers)
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError("Inavalid channel id");
  }

  const subscribeChannels = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "channel",
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
              channel: {
                $first: "$channel",
              },
            },
          },
          {
            $project: {
              channel: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribe: {
          $size: "$subscribeTo",
        },
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        subscribeTo: 1,
        subscribe: 1,
      },
    },
  ]);

  if (!subscribeChannels) {
    throw new ApiError(500,"something went wrong while getting subscribed channels")
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "get subscribe channel", subscribeChannels));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
