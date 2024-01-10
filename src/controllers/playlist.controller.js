import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// All playlist Api Testing in done.

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  if (
    [name, description].some((field) => field === "" || field === undefined)
  ) {
    throw new ApiError(401, "playlist name and description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(
      500,
      "some thing went wrong while creating playlist try again later"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "playlist created successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "invalid user id");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "channelOwner",
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
              channelOwner: {
                $first: "$channelOwner",
              },
            },
          },
          {
            $project: {
              views: 1,
              duration: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              channelOwner: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        playlistVideos: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!userPlaylist) {
    throw new ApiError(
      500,
      "some thing went wrong while getting user playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "get user playlist successfully", userPlaylist));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
              channelOwner: {
                $first: "$user",
              },
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              channelOwner: 1,
            },
          },
        ],
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
        playlistOwner: {
          $first: "$user",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        createdAt: 1,
        playlistOwner: 1,
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(500, "some went wrong while getting playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "get playlist successfully", playlist[0]));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (
    [playlistId, videoId].some(
      (field) =>
        field === "" || field === undefined || isValidObjectId(field) === false
    )
  ) {
    throw new ApiError(401, "incorrect videoId or playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(500, "something went wrong while getting playlist");
  }

  playlist.videos.push(videoId);

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(201, "video added successfully in playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if ([playlistId, videoId].some((field) => isValidObjectId(field) === false)) {
    throw new ApiError(401, "invalid playlist id or video id");
  }

  const deletePlaylistVideo = await Playlist.updateMany(
    { _id: playlistId },
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        "video deleted successfully from playlist",
        deletePlaylistVideo
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid playlist id");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(500, "some thing went wrong while deleting playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, "playlist deleted successfully", deletedPlaylist)
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid playlist Id");
  }

  if (
    [name, description].some((field) => field === "" || field === undefined)
  ) {
    throw new ApiError(401, "name and description is required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "some thing went wrong while updating playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, "playlist updated successfully", updatedPlaylist)
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
