const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Setting the schema options for virtuals importance
// As we know virtuals are never persisted in DB. We make some calculations based on the
// other fields & inorder to show them in output or resposne then we need to set
// the schema options as mentioned above

// QUERY MIDDLEWARE - FOR PARENT REFERENCING TOURS & USERS

reviewSchema.pre(/^find/, function (next) {
    this.populate([
        //{ path: 'tour', select: 'name' },
        { path: 'user', select: '-__v' },
    ]);
    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
