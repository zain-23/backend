import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "can't find video");
  }
  const skip = (page - 1) * limit;
  const videoComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
              fullName: 1,
              email: 1,
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
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  return res
    .status(201)
    .json(
      new ApiResponse(200, "get Video Comments Successfully", videoComments)
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content) {
    throw new ApiError(401, "message is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "can't find video");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(
      500,
      "something went while post the comment try again later"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Comment posted successfully", comment));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(401, "message is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "can't find comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(
      500,
      "something went while update the comment try again later"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Comment updated successfully", updatedComment));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "can't find comment");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(
      500,
      "something went while deleted the comment try again later"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        "Comment deletedComment successfully",
        deletedComment
      )
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
