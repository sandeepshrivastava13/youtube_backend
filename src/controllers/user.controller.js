import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

const registerUser = asyncHandler(async function (req, res) {
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

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User is already exists with email and username");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar is required");
  // }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // if (!avatar) {
  //   throw new ApiError(400, "Something went wrong while uploading avatar");
  // }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: "",
    coverImage: "",
    password,
  });

  const isUserCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!isUserCreated) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res.status(201).json("User created successfully");
});

const loginUser = asyncHandler(async (req, res) => {
  //get details from the user
  //check validation on the basis of email
  //find the user
  //password check
  //access token and refresh token generate
  //send token through secure cookies
  //send res

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //any communication to database you have to use await

  const options = { httpOnly: true, secure: true }; //with the help of options - httpOnly and secure it is modify by the server not by the client(i.e frontend)

  //refresh token and access token send with the help of cookie

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      statusCode: 200,
      message: "Logged in successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
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
  const options = { httpOnly: true, secure: true }; //with the help of options - httpOnly and secure it is modify by the server not by the client(i.e frontend)

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json("User logged out Successfully");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "nvalid refrwsh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshToken(user._id);
    const options = { httpOnly: true, secure: true }; //with the help of options - httpOnly and secure it is modify by the server not by the client(i.e frontend)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        statusCode: 200,
        message: "token refresh successfully",
        accessToken: accessToken,
        refreshToken: newRefreshToken,
      });
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!(newRefreshToken === confirmPassword)) {
    throw new ApiError(400, "Please enter valid passowrd");
  }
  const user = await User.findById(req.user._id);
  const isPassowrdValid = await user.isPasswordCorrect(oldPassword);
  if (!isPassowrdValid) {
    throw new ApiError(400, "Invalid olo password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    sttatus: 200,
    message: "Passowrd changed successfully",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    statusCode: 200,
    user: req.user,
    message: "user feteched successfully",
  });
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res.status(200).json({
    statusCode: 200,
    data: user,
    message: "User detail updated successfully",
  });
});

const updateUserAvatar = asyncHandler(async (req, res) => {});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
};
