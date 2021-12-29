const app = require("./app");
const ConnectWithDB = require("./config/db");
const cloudinary = require("cloudinary");
require("dotenv").config();

// connect with database (locally)
ConnectWithDB();

// cloudinary config here
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { PORT } = process.env;

app.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
