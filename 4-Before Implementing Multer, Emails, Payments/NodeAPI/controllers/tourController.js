const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apifeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { price: 1 } },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plans = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTours: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans,
    },
  });
});

// /tours-within/:distance/center/:latlong/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi --> This is the expected query or api endpoint

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // We need to find the maximum radius from our location which is the center which is the passed latitude and longitude
  // The reason why we are finding distance in radians is becuase that is the format mongodb query accepts but no kilometers or miles
  // For miles we need to divide distance by 3963.2
  // For km we need to divide distance by 6378.1
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,long'
      )
    );
  }

  // Finding tours (documents) within the specified distance from the center (user provided latitude and longitude)
  // Since we need to find the tours within the specified distance we need to use $geoWithin
  // We want the distance from center to the radius we want in a circle. For that we use $centerSphere
  // $centerSphere - Defines a circle for a geospatial query that uses spherical geometry. The query returns documents that are within the bounds of the circle
  // $centerSphere takes an array where first index is the center point (user specified lat & long) & second index will be radius measured in radians (Calculated above)

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// /tours-within/:distance/center/:latlong/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi --> This is the expected query or api endpoint
// CALCULATING THE DISTANCE FROM USER SPECIFIED LOCATION TO THE START LOCATIONS OF THE TOUR
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.00062137 : 0.01; // 1m = 0.00062137 miles and 1m = 0.01 KM

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,long'
      )
    );
  }

  // Geospatial Aggregation Stage - Only one such stage which is $geoNear

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance', // The output field that contains the calculated distance.
        distanceMultiplier: multiplier, // The output will be in meters conver that to km or miles based on the user request
      },
    },
    { $project: { distance: 1, name: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});
