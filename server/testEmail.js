require("dotenv").config();

const nodemailer = require("nodemailer");

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    console.log("Gmail SMTP connected successfully!");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: "MERN Authentication Email Test",
      text: "Your Nodemailer email configuration is working!",
    });

    console.log("Email sent successfully!");
    console.log(info.messageId);

  } catch (error) {
    console.error("Email error:", error.message);
  }
};

testEmail();