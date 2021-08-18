const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apifeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

exports.getAllTours = catchAsync(async (req, res) => {
    // console.log(req.middleware) - Logging our implemented custom middleware in app.js
    // console.log(req.query) - Object with all the query params
    // 1) FILTERING 2) SORTING 3) FIELDS LIMITING 4) Pagination

    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // 5) EXECUTING QUERY

    const tours = await features.query;

    // 6) SEND RESPONSE

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const tour = await Tour.findById(id).populate('reviews');

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        result: tour.length,
        data: {
            tour,
        },
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour,
        },
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: tour,
        },
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

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
    const { year } = req.params;
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
