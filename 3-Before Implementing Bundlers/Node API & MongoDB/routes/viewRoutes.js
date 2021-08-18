const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// Before going into the required controller we want to update the header pug template based on the authentication.
// Hence the below middleware is used
// authController.isLoggedIn - Will not throw any error in case user is not logged in. The reason is becuase if users visits our application for the first time then we display all the tours page then user clicks on login that time we should not throw any error. Hence the reason
router.use(authController.isLoggedIn); // If user is authenticated with cookie available then user object info is made accessible to the header pug template.

router.get('/', viewController.getOverview);
router.get('/tour/:slug', authController.protect, viewController.getTour);
router.get('/login', viewController.getLoginForm);

module.exports = router;
