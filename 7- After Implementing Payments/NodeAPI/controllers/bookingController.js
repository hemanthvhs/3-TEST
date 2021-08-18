const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) GET THE INFO FOR THE CURRENTLY BOOKING TOUR BASED ON THE ID PASSED
  const tour = await Tour.findById(req.params.tourId);
  // 2) CREATE A CHECKOUT SESSION
  // BELOW REFERENCES KNOWLEDGE IS REQUIRED INORDER TO UNDERSTAND CREATING THE CHECKOUT SESSION
  // REF - https://stripe.com/docs/api/checkout/sessions/create?lang=node
  // REF - https://stripe.com/docs/payments/accept-a-payment
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });
  // 3) SEND THIS CHECKOUT SESSION AS A RESPONSE
  res.status(200).json({
    status: 'success',
    session,
  });
});
