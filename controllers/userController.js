const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const emailHelper = require("../utils/emailHelper");
const cloudinary = require("cloudinary");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError("please, upload a photo", 400));
  }

  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return next(new CustomError("email, password and email are required", 400));
  }

  const file = req.files.photo;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  //   user is created and now let's LOGIN
  //   and generate a jwttoken and store as a cookie
  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  // check for email and password
  if (!email || !password) {
    return next(new CustomError("please provide email and password", 400));
  }

  // get user from DB
  const user = await User.findOne({ email }).select("+password");

  // if user not exits
  if (!user) {
    return next(new CustomError("not registered user", 400));
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    return next(new CustomError("Incorrect Password", 400));
  }

  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "successfully logout...",
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;
  // check for email in user database
  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomError("No User Exist With This Email!!"));
  }
  const forgotToken = user.getForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;
  const message = `copy paste this link in your url and hit enter \n\n ${myUrl}`;

  try {
    await emailHelper({
      toEmail: user.email,
      subject: "TshirtStore - Password Reset Mail",
      message,
    });
    res.status(200).json({
      success: true,
      message: "Email sent successful",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.save({ validateBeforeSave: false });

    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;
  const encryptedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: encryptedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("token is invalid or expired!!", 500));
  }

  if (req.body.password !== req.body.confPassword) {
    return next(
      new CustomError("password and confirm password did not match", 400)
    );
  }

  user.password = req.body.password;

  // reseting the forgot password token and expiry to undefined
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  // now send him the token or let him to login with new password my choice
  cookieToken(user, res);
});

exports.getLoggedInUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("+password");
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectOldPassword) {
    return next(new CustomError("wrong old password", 400));
  }

  user.password = req.body.password;
  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  if (!req.body.name || !req.body.email) {
    return next(CustomError("pleasse provide name and email to update", 400));
  }

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.files) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;

    // delete the photo on cloudinary
    const resp = await cloudinary.v2.uploader.destroy(imageId);

    // upload the photo on cloudinary
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

exports.adminGetSingleUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("no user found", 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  if (!req.body.name || !req.body.email || !req.body.role) {
    return next(CustomError("pleasse provide name and email to update", 400));
  }

  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminDeleteOneUserDetails = BigPromise(async (req, res, next) => {
  
  const user = await User.findById(req.params.id)

  if(!user){
    return next(new CustomError("no such user found", 401))
  }

  const ImageId = user.photo.id 
  
  await cloudinary.v2.uploader.destroy(ImageId)

  await user.remove()

  res.status(200).json({
    success: true,
  });
});

exports.managerAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  return res.status(200).json({
    success: true,
    users,
  });
});
