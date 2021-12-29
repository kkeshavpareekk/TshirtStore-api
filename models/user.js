const mongoose = require("mongoose");
const validator = require("validator");
const brcypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name!!"], // if error occures , this error meassage is displayed
    maxlength: [40, "Name Should be under 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email!!"],
    validate: [validator.isEmail, "Please Enter Correct Email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password!!"],
    minlength: [6, "Password should be at least 6 chars long"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      required: true,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ecrypt the password before saving (using PRE HOOKS)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await brcypt.hash(this.password, 10);
});

// valid the password with already saved user password
userSchema.methods.isValidatedPassword = async function (userSendPassword) {
  return await brcypt.compare(userSendPassword, this.password);
};

// create and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

// generate forgot password token(not basically a token but a random string)
userSchema.methods.getForgotPasswordToken = function () {
  // generate a random and long string
  const forgotToken = crypto.randomBytes(20).toString("hex");

  // getting a hash - make sure to get a hash on backend
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotToken)
    .digest("hex");

  // time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

  return forgotToken;
};

module.exports = mongoose.model("User", userSchema);
