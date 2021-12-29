const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please provide product name"],
    trim: true,
    maxlength: [120, "product name should not be more than 120 chars"],
  },
  price: {
    type: Number,
    required: [true, "please provide price of product"],
    maxlength: [5, "price should not be more than 5 digits"],
  },
  description: {
    type: String,
    required: [true, "please provide description of product"],
    maxlength: [200, "description should not be more than 200 chars"],
  },
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [
      true,
      "please select category from short-sleeves, long-sleeves, sweatshirts, hoodies",
    ],
    enum: {
      values: ["shortsleeves", "longsleeves", "sweatshirts", "hoodies"],
      message:
        "please select categories only from short-sleeves, long-sleeves, sweatshirts, hoodies",
    },
  },
  stock: {
    type: Number,
    required: [true, "please provide stock"],
  },
  brand: {
    type: String,
    required: [true, "please enter brand for the product"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
