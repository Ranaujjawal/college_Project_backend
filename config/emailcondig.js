import nodemailer from "nodemailer"
var transporter = nodemailer.createTransport({
    service: 'gmail',
    host:"smtp.gmail.com",
    port: 587,
    secure:false,
    auth: {
      user: "project.3.lnu@gmail.com",
      pass: "zjvxjxhdmnsqtubs"
    }
  });

  const sendMail =  async (email,otp) =>{
     try {
      await transporter.sendMail({
       from: '"final year project" <project.3.lnu@gmail.com>', // sender address
       to: email, // list of receivers
       subject: "otp for registration", // Subject line
       text: "Hi, Thank you for registring with us your OTP for registeration is :" + otp, 
     });
 
     } catch (e) {
      console.log("error sending otp try after sometime ",e)
     }
  };


const sendNewMessageNotification = async (recipientEmail, senderName) => {
  await sendMail({
    email: recipientEmail,
    subject: 'New Message Received',
    html: `
      <h1>New Message Notification</h1>
      <p>You have received a new message from ${senderName}.</p>
      <p>Log in to your account to view and respond to the message.</p>
    `
  });
};
export {sendMail,sendNewMessageNotification}
