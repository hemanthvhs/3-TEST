const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// const userRouter = express.Router(); Not good practice to name the router

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updatePassword', authController.updatePassword);

router.use(authController.protect); // All the below routes require protection hence instead of writing in every route we will pass the request into the protect middleware. After this valdiation then the router goes to the necessary route. No need to define there explicitly

router.get('/me', userController.getMe, userController.getUser); // Actually we need to check if user is logged in then we need to process the req.
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); // All the below routes can be only accessed if the current user role is admin

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
