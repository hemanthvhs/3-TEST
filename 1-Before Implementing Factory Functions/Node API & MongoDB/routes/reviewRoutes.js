const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// Setting mergeParams: true will retain the req URL params.
// There's a case when user access endpoint as - .../api/v1/tours/12345678/reviews
// In the above case, the router first moves to tour router then find the match for /:tourID/reviews then redirected to review Router.
// Once redirected, we wil loose the tourID params from req.params, Inorder to retain those values we use {mergeParams: true}

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
