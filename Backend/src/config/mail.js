const nodemailer = require("nodemailer");

const transPorter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vaghelanimoj013@gmail.com",
    pass: "bhju uftt zfrb zvwf",
  },
});

async function senData(to, subject,html) {
  const mailFormat = {
    from: "vaghelanimoj013@gmail.com",
    to: to,
    subject: subject,
    html: html,
  };
  await transPorter.sendMail(mailFormat, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("mail sent");
    }
  });
}
module.exports = senData;
