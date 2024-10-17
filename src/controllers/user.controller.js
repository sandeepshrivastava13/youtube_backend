import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const registerUser = asyncHandler(async function (req, res) {
  res.status(200).json({
    message: "ok",
  });

  //get user details from frontend
  //validation on data
  //check if user is already exists based on username, email

  //check for images, check for avatar
  //upload them to cloudinary,avatar
  //create user object - create entry in db
  //remove password and refresh token from response
  //check for user creation
  //return res

  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some((item) => item.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User is already exists with email and username");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const isUserCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!isUserCreated) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, isUserCreated, "User registered successfully"));
});

export { registerUser };
