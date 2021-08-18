const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // COnverting 90days to milliseconds
    ),
    httpOnly: true, // This means that this cookie cannot be accessed by client side javascript to manipulate or access
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // For development secure will be false by default.

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // Since user contains password property. We are removing it.

  res.status(statusCode).json({
    status: 'sucess',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const reqObj = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
  };
  const newUser = await User.create(reqObj);

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // 1) CHECK IF BODY CONTAINS EMAIL AND PASSWORD

  const { email, password } = req.body;
  if (!email || !password) {
    next(new AppError('Please provide email & password', 400));
  }
  // 2) CHECK IF USER IS AVAILABLE IN DB AS PER EMAIL PROVIDED
  // If user deletes himself by using the route /deleteMe, then active will be set to false
  // We have a pre hook query middleware which will run before executing the await User.findOne({ email }).select('+password')
  // And removes all the inactive users (Refer the query middleware in userModel)
  const user = await User.findOne({ email }).select('+password');

  // 3) VALIDATE THE PASSWORD SENT BY THE USER & ACTUAL PASSWORD
  // user.checkPassowrd() is an instance method which will be available on each user document. Logic written in userModel
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Check if req header contains token

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in ! Please login to get the access',
        401
      )
    );
  }

  // 2) Verifying the token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user is available in DB for the token provided

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new AppError(
        'The user belonging to that token, does no longer exist',
        401
      )
    );
  }

  // 4) Check if user has changed the password after token is issued

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  // ...roles = ['admin', 'lead-guide'].  Generally by defualt user is the role if not specified
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permissions to perform this action', 403)
    );
  }

  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Check if email exists in the req body & check if user for that email exists in DB.

  if (!req.body.email) {
    return next(
      new AppError(
        'Please provide your email inorder to reset the password',
        400
      )
    );
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  // 2) Generate the password reset token

  const resetToken = await user.createPasswordResetToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false }); // Since in the instance method we are setting the passwordResetToken & Date for the doucment & hence it needs to be saved in DB

  // 3) Send the reset token to users email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password ? Submit a PATCH request with your password and passwordConfirm to ${resetURL}.\nIf you did not forget your password, please ignore this email`;

  const mailOptions = {
    email: user.email,
    subject: 'Your Password Reset Token (Valid for 10 Min)',
    message,
  };

  try {
    await sendEmail(mailOptions);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email! Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Check if token is valid token - Token should not be modified & Token should not expire

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Check for hashed token matches with the token in DB & Token Expires time is in the future
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gte: Date.now() },
  });

  if (!user) {
    return next(new AppError('The token is invalid or epired', 404));
  }

  // 2) Update the password in the DB

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save(); // We want validators to run inorder to check if password & confirmpaswword are same - Hence we dont provide validateBeforeSave : false

  // 3) Send the token

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  const user = await User.findById(req.user.id).select('+password');

  if (!req.body.currentPassword || !req.body.newPassword) {
    return next(
      new AppError('Current Password & New Password is required', 404)
    );
  }

  // 2) Check if user posted is correct

  if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is incorrect', 403));
  }

  // 3) If so update the pasword
  user.password = req.body.newPassword;
  await user.save({ validateBeforeSave: false });

  // 4) Log user in - Send Token
  createSendToken(user, 200, res);
});
