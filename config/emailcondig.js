import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()
var transporter = nodemailer.createTransport({
    service: 'gmail',
    host:"smtp.gmail.com",
    port: 587,
    secure:false,
    auth: {
      user: "project.3.lnu@gmail.com",
      pass: process.env.NODEMAILERPASSWORD
    }
  });

  const sendMail =  async (email,otp) =>{
     try {
      await transporter.sendMail({
       from: '"final year project" <project.3.lnu@gmail.com>', // sender address
       to: email, // list of receivers
       subject: "otp for registration", // Subject line
       html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #4CAF50;">Hello, ${email}!</h2>
            <p>Your single-use code is:</p>
            <h1 style="color: #FF5733; font-size: 2rem;">${otp}</h1>
            <p>
                If you didn't request this code, you can safely ignore this email.
                Someone else might have typed your email address by mistake.
            </p>
            <br />
            <p>Thanks,</p>
            <p><strong>The Near.in Team</strong></p>
        </div>
    `,
     });
 
     } catch (e) {
      console.log("error sending otp try after sometime ",e)
     }
  };

  const sendforgototp =  async (email,otp) =>{
    try {
     await transporter.sendMail({
      from: '"final year project" <project.3.lnu@gmail.com>', // sender address
      to: email, // list of receivers
      subject: "otp for Password Reset", // Subject line
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #4CAF50;">Hello, ${email}!</h2>
            <p>Your single-use code is:</p>
            <h1 style="color: #FF5733; font-size: 2rem;">${otp}</h1>
            <p>
                If you didn't request  password reset, you can safely ignore this email.
                Someone else might have typed your email address by mistake.
            </p>
            <br />
            <p>Thanks,</p>
            <p><strong>The Near.in Team</strong></p>
        </div>
    `,
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
export {sendMail,sendNewMessageNotification,sendforgototp};
