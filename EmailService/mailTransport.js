require("dotenv").config();


const { GMAIL_PASS_KEY, GMAIL_USER } = process.env;

const gmailUser = GMAIL_USER;
const gmailPasskey = GMAIL_PASS_KEY;

const nodemailer = require("nodemailer");
const createTransporter = (gmailUser, gmailPasskey) => {
  const mailConfig = {
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailPasskey,
    },
    tls: { rejectUnauthorized: false },
  };
  return nodemailer.createTransport(mailConfig);
};

const transporter = createTransporter(gmailUser, gmailPasskey);

exports.send = ({ to, subject, text, html }) => {
  transporter.sendMail(
    {
      from: `Pet-project <${gmailUser}@gmail.com>`,
      to,
      subject,
      text,
      html,
    },
    (error, info) => {
      if (error) {
        console.log("Error sending email: " + error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
}