const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary");
const Product = require("../models/product");
const WhereClause = require("../utils/whereClause");

exports.addProduct = BigPromise(async (req, res, next) => {
  //images
  let imageArray = [];
  if (!req.files) {
    return next(new CustomError("please upload image for the product", 401));
  }

  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );

      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imageArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProduct = BigPromise(async (req, res, next) => {
  const resultperPage = 6;
  const totalcountProduct = await Product.countDocuments();

  const productObj = new WhereClause(Product, req.query).search().filter();

  let products = await productObj.base;

  const filteredProductNumber = products.length;

  productObj.pager(resultperPage);

  products = await productObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    totalcountProduct,
    filteredProductNumber,
  });
});

exports.getSingleProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("no product found with id", 401));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const alreadyReviewed = product.reviews.find(
    (rev) => req.user._id.toString() === rev.user.toString()
  );

  console.log(alreadyReviewed);

  if (alreadyReviewed) {
    alreadyReviewed.comment = comment;
    alreadyReviewed.rating = rating;
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  // adjust ratings
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // save
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    product
  });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);

  const review = product.reviews.filter(
    (rev) => req.user._id.toString() !== rev.user.toString()
  );

  // adjust ratings
  const ratings = (review.length > 0) ?
    review.reduce((acc, item) => item.rating + acc, 0) / review.length : 0;

  // update the product
  await Product.findByIdAndUpdate(
    productId,
    {
      reviews: review,
      ratings: ratings,
      numberOfReviews: review.length,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.porduct_id);

  res.status.json({
    success: true,
    reviews: product.reviews,
  });
});

// admin controllers
exports.admingetAllProduct = BigPromise(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("no product found with id", 401));
  }

  if (req.files) {
    let imagesArray = [];

    // destroy the existing images
    for (let index = 0; index < product.photos.length; index++) {
      const res = await cloudinary.v2.uploader.destroy(
        product.photos[index].id
      );
    }

    // upload new photos
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
    req.body.photos = imagesArray;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("no product found with id", 401));
  }

  // destroy the existing images
  for (let index = 0; index < product.photos.length; index++) {
    const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "product was deleted",
  });
});
