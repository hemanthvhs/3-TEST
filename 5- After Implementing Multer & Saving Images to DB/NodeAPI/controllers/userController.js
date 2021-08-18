const multer = require('multer');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

const diskStorage = multer.diskStorage({
  // 1) WHERE TO STORE ON THE DISK - PATH
  destination: (req, file, cb) => {
    cb(null, 'public/img/users'); // First parameter is the error. Here it is no error hence null
  },

  // 2) UPDATING THE FILENAME
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const fileName = `user-${req.user.id}-${Date.now()}`;
    const completeFileName = `${fileName}.${ext}`;
    cb(null, completeFileName);
  },
});

const multerFilter = (req, file, cb) => {
  // Accept only images else throw error
  // For any image that is .jpg or .png or .bitmap -> The mimetype would be image/<type>. Check the console or add  console.log(req.file) in updateMe contorller to check
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // To accept the file pass `true`
  } else {
    cb(new AppError('Please upload only images', 400), false); // To reject this file pass `false`,
  }
};

// const upload = multer({ dest: 'public/img/users' }); // Defining the destination where the uploaded file should be stored in the filestorage. This will add the uploaded file details on the request and can be accessed as req.file. Check the console.log(req.file) in updateMe controller

// Inorder to gain much more flexibility on storing files to disk we need to use Disk Storage

const upload = multer({
  storage: diskStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo'); // Uploading only single photo

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
  console.log(req.file);
  console.log(req.body);
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
  if (req.file) filteredObj.photo = req.file.filename; // If user uploads a photo then that filename we are storing in DB. Incase user is new & signedup then that time we need to display default.jpg image. For that set photo field to default: 'default.jpg' in user model
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
