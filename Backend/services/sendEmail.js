const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  try {
    // Verify credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim(),
      },
    });

    // Verify transporter connection
    await transporter.verify();

    // Email options
    const mailOptions = {
      from: `"Sahaj FMS" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    console.error('Full error:', error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
