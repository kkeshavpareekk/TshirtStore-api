const express = require("express");
require("dotenv").config();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

// initialize app
const app = express();

// regular middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// temp check
app.set("view engine", "ejs");

// morgan middleware
app.use(morgan("tiny"));

// import all routes
const home = require("./routes/home");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/product");
const paymentRoute = require("./routes/payment");
const orderRoute = require("./routes/order");

// router middleware
app.use("/api/v1/", home);
app.use("/api/v1/", userRoute);
app.use("/api/v1/", productRoute);
app.use("/api/v1/", paymentRoute);
app.use("/api/v1/", orderRoute);


// test route for frontend testing
app.get("/signuptest", (req, res) => {
  res.render("signup_form");
});

//export app js
module.exports = app;
