const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxLength: [40, 'A tour must have less or equal to 40 characters'],
            minLength: [5, 'A tour must have more or equal to 5 characters'],
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty should be either of easy, medium or hard',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    return val < this.price;
                },
                message: 'Price Discount should be lesser than Price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a image cover'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        slug: String,
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// SCHEMA - VIRTUALS

tourSchema.virtual('durationWeeks').get(function () {
    return Math.round(this.duration / 7);
});

// SCHEMA - VIRTUALS
// The ask is for a particular tour we need to get the reviews. But we dont have reviews reference in our toursSchmea. If we do that then it becomes child referencing & since there can be many reviews we cant store them in array & persist to DB.
// Instead we create virtuals which will populate the reviews property & set dynamically in the response.

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// DOCUMENT MIDDLEWAREs - Runs before .save() or .create()

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Embedding the users in tours is not good approach
/* tourSchema.pre('save', async function (next) {
  const guidesPromise = this.guides.map((id) => User.findById(id));
  this.guide = await Promise.all(guidesPromise);
  console.log(guidesPromise);
  console.log(this.guide);
  next();
}); */

tourSchema.post('save', function (doc, next) {
    console.log(doc);
    next();
});

// QUERY MIDDLEWARES - Runs for find(), findByID(), findByIDAndUpdate(), findByIDAndDelete()

tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v',
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`Quert took ${Date.now() - this.start} time`);
    next();
});

// AGGREGATE MIDDLWARES

tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});

// CREATING THE DB MODEL
// All the middlewares, instance methods & virtuals should be written before model creation

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
