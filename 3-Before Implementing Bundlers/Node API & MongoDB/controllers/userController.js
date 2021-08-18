const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

const filterData = (reqBodyObj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(reqBodyObj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObj[key] = reqBodyObj[key];
  });

  return filteredObj;
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup to create the use',
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Check is password & confirmPassword is provided in the req body
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }

  // 2) Remove unwanted fields that are not required to store / update in DB

  const filteredObj = filterData(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  // const user = await User.findById(req.user.id);
  // user.password = req.body.password;
  // user.confirmPassword = req.body.confirmPassword;
  // await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // We always set the active to false if user asks for delete
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
