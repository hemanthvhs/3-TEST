const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourID) filter = { tour: req.params.tourID };
  const reviews = await Review.find(filter);
  res.status(200).json({
    status: 'success',
    length: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourID;
  if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body); // req.body - all the necessary fields for the collection creation is taken & rest are ignored. Hence we can directly write as req.body
  res.status(201).json({
    status: 'sucess',
    data: {
      review: newReview,
    },
  });
});
