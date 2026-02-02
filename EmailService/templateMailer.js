const mailTransport = require("./mailTransport");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");


const helloTemplate = ejs.compile(
  fs.readFileSync(path.join(__dirname, "./templates/code.ejs"), "utf8")
);


exports.sendHello = ({ to, templateVar }) => {
  mailTransport.send({
    to,
    subject: "Подтверждение регистрации PLANLIFT",
    text: `Ваш код подтверждения: ${templateVar.code}`,
    html: helloTemplate(templateVar)
  });
};

const resetTemplate = ejs.compile(
  fs.readFileSync(path.join(__dirname, "./templates/reset-code.ejs"), "utf8")
);



exports.sendResetPassword = ({ to, templateVar }) => {
  mailTransport.send({
    to,
    subject: "Восстановление пароля PLANLIFT",
    text: `Ваш код для сброса пароля: ${templateVar.code}`,
    html: resetTemplate(templateVar) 
  });
};