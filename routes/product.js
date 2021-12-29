const express = require("express");
const router = express.Router();

const { isLoggedIn, customRole } = require("../middlewares/user");

const {
  addProduct,
  getAllProduct,
  admingetAllProduct,
  getSingleProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
  addReview,
  deleteReview,
  getOnlyReviewsForOneProduct,
} = require("../controllers/productController");

// user route
router.route("/products").get(getAllProduct);
router.route("/products/:id").get(getSingleProduct);
router
  .route("/review")
  .put(isLoggedIn, addReview)
  .delete(isLoggedIn, deleteReview);
router.route("/product/reviews").get(isLoggedIn, getOnlyReviewsForOneProduct);
// admin route
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);
router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), admingetAllProduct);

router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
