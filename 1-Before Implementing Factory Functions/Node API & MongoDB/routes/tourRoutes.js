const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

//const tourRouter = express.Router(); Not better way of naming

const router = express.Router();

//router.param('id', tourController.checkID); Example: express param middleware

router.use('/:tourID/reviews', reviewRouter); // Redirecting to review Router. This is called Nested routes

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plans/:year').get(tourController.getMonthlyPlan);

router
    .route('/')
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour);

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;
