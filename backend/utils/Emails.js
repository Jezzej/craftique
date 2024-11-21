const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "user@gmail.com",
    pass: "demoUser@123",
  },
});

exports.sendMail = async(receiverEmail,subject,body) => {
    await transporter.sendMail({
    from: process.env.EMAIL,
    to: receiverEmail,
    subject: subject,
    html: body
  });
};
