import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { USER } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { SUBSCRIPTION } from "../models/subscription.model.js";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await USER.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefresfToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from front end.☑️
  // validation - not empty.☑️
  // check if user is already exist :username,email.☑️
  // check for images :check for avatar.☑️
  // upload them cloudinary.☑️
  // create a user object to create an entry in db.
  // check for user creation.☑️
  // remove password and refresh token to send res.☑️
  // return user

  const { userName, email, fullName, password } = req.body;

  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await USER.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username is already exist");
  }

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  } else {
    throw new ApiError(400, "avatar image is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await USER.create({
    userName,
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await USER.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while register user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from front-end.
  // find user with email or username.
  // if user is not exist show error.
  // if user is exist then check if password is correct.
  // generate accessToken and refreshToken.
  // save refreshToken to db.
  // send acceccToken and refreshToken to user with the help of cookies.

  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(404, "username or email is required");
  }

  const user = await USER.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "username or email does'nt exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }
  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await USER.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        201,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loggedIn successFully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  const user = await USER.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  console.log("user", user);

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const inCommingRefreshToken =
    req.cookie?.refreshToken || req.body.refreshToken;

  console.log("inCommingRefreshToken", inCommingRefreshToken);

  if (!inCommingRefreshToken) {
    throw new ApiError(401, "invalid refresh Token");
  }

  try {
    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("decodedToken", decodedToken);

    const user = await USER.findById(decodedToken._id);
    console.log("user", user);

    if (!user) {
      throw new ApiError(401, "wrong refresh Token");
    }

    if (user.refreshToken !== inCommingRefreshToken) {
      throw new ApiError(401, "refresh token expired");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await user.generateAccessToken(user._id);
    console.log("accessToken", accessToken, newRefreshToken);
    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          201,
          {
            accessToken,
            newRefreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    console.log("ERROR while refreshing the token", error);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await USER.findById(req.user?._id);

  const checkPassword = await user.isPasswordCorrect(oldPassword);

  if (!checkPassword) {
    throw new ApiError(401, "Incorrect Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(201, "Password Change successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(401, "Invalid email or fullName");
  }

  const user = USER.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "User updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar is required");
  }

  const uploadedImage = await uploadOnCloudinary(avatarLocalPath);

  if (!uploadedImage.url) {
    throw new ApiError(401, "Error while uploading image try again later");
  }

  const user = await USER.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadedImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(401, "cover image is required");
  }

  const uploadedImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!uploadedImage.url) {
    throw new ApiError(401, "Error while uploading image try again later");
  }

  const user = await USER.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: uploadedImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(201, user, "cover image updated successfully"));
});

const getUserChannelsDetails = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName) {
    throw new ApiError(401, "Invalid user Name");
  }

  const channelDetail = await USER.aggregate([
    {
      $match: {
        userName: userName,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  console.log("channelDetail", channelDetail);
});

const channelSubscribed = asyncHandler(async (req, res) => {
  // recieve data from frontend.
  // check data :invalid.
  // find user with the help of logged in user.
  // get channel name with params
  // add user id to subscriber.
  // jis ko user subscriber kry us ki id add kro channel.

  const channelName = req.params.username;

  if (!channelName) {
    throw new ApiError(401, "error while subscriber the channel");
  }

  const user = await USER.findOne({ userName: channelName }).select(
    "-password -refreshToken -watchHistory -userName -email -fullName -avatar -coverImage"
  );

  if (!user) {
    throw new ApiError(401, "channel does't exist");
  }

  const subscribeDetail = await SUBSCRIPTION.create({
    subscriber: req.user?._id,
    channel: user._id,
  });

  return res
    .status(200)
    .json(new ApiError(201, subscribeDetail, "Subscribed Successfully"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const userWatchHistory = await USER.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
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
  console.log("userWatchHistory", userWatchHistory);
  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        userWatchHistory[0].watchHistory,
        "user history fetch successfully"
      )
    );
});

const createUserWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(401, "Invalid video id");
  }

  const user = req.user;
  user.watchHistory.push(videoId);

  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(201, user, "video added in watchHistory"));
});
export {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelsDetails,
  channelSubscribed,
  getUserWatchHistory,
  createUserWatchHistory,
};
