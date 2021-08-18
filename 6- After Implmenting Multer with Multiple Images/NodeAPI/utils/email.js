const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) CREATING THE TRANSPORTER OBJECT

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) DEFINE THE MAIL OPTIONS

  const mailOptions = {
    from: '<Hemanth Vennelakanti hemanth@io.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) SENDING THE EMAIL

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
