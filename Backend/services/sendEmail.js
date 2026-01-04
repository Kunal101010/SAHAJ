const nodemailer = require("nodemailer");
require("dotenv").config()

const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your App Password
      },
    });

    // Email options
    const mailOptions = {
      from: `"Kiran Rai" <${process.env.EMAIL_USER}>`, // Sender address must match EMAIL_USER
      to: options.email, // Recipient's email address
      subject: options.subject, // Email subject
      text: options.message, // Email body in plain text
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
