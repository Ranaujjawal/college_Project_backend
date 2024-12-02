import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Admin} from '../model/admin.js';
import {WrokerVerify} from '../model/workerverification.js'
import { User } from '../model/user.js';
import { sendMail,sendforgototp,sendmessage } from '../config/emailcondig.js';
import {uploadonCloudinary} from '../config/cloudinary.js'
import dotenv from 'dotenv';
import mongoose from 'mongoose'
dotenv.config();

export const adminlogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  try {
    const foundUser = await Admin.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (!passOk) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    jwt.sign(
      { userId: foundUser._id, email },
      process.env.JWT_SECRET_ADMIN,
      {},
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).json({ message: 'Error generating token' });
        }
        res
          .cookie('tokenadmin', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true, // Adjust based on environment
          })
          .status(200)
          .json({ success: true, id: foundUser._id, token }); // Send token back for confirmation
          
        //console.log('Generated Token:', token); // This should now log
      }
    );

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json('Server error');
  }
};

export const adminRegister = async (req, res) => {
    
    const { email,password,secret } = req.body;
  
    try {
      console.log("admin register",req.body)
        const existingUser = await Admin.findOne({email});

        if (existingUser) {
          //  console.log("hello")
          return res.status(403).json({

            message: 'User with this email or username already exists'
          });
        }
       // console.log("yha")
      const hashedPassword = await bcrypt.hash(password, 10);
        if(secret!==process.env.AdminSecret){
            console.log(error)
            return res.status(400).json({
                message: 'Wrong secret key'
              });
            }
           // console.log("yhaaaa")
      const createdUser = await Admin.create({
        email: email,
        password: hashedPassword,
      });
  
      res.status(200).json({
        success:true,
        message:"user created successfully"
      })
     createdUser.save();
    //  jwt.sign(
    //     { 
    //       userId: createdUser._id,
    //       email: createdUser.email,
    //     },
    //     process.env.JWT_SECRET_ADMIN,
    //     {},
    //     (err, token) => {
    //       if (err) throw err;
    //       res.cookie('tokenadmin', token, { sameSite: 'none', secure: true })
    //         .status(201)
    //         .json({
    //           success:true,
    //           id: createdUser._id,
    //           message: 'Registration completed successfully'
    //         });
    //     }
    //   );
  
    } catch (err) {
      console.error('Registration completion error:', err);
      res.status(500).json({
        message: 'Error completing registration'
      });
    }
  };
  
export const adminlogout = (req, res) => {
    res.cookie('tokenadmin', '', { sameSite: 'none', secure: true }).json({
      success: true,
      message: 'logout Successfully',
    });
  };

export const listWorkers = async (req, res) => {
  const ourUserId = req.userData.userId;
    try {
      const worker = await WrokerVerify.findOne({userId:ourUserId});
      res.status(200).json(worker);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching workers' });
    }
  };
  
  // Set worker status
export const setWorkerStatus = async (req, res) => {
    const { workerId, status ,remark} = req.body;

    try {
      const worker = await WrokerVerify.findById(workerId);
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
  
      if (!['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      const email=worker.email;
      await WrokerVerify.findOneAndUpdate({email},{status:status, remarks:remark},{ new: true })
      const uId=worker.userId;
      if(status==='Verified'){
        const orgworker=await User.findOneAndUpdate(uId,{isVerified:true},{new:true});
        const subject = 'Document Verification Successful'
        await sendmessage(worker.email,  remark,subject);
      }
      if(status==='Rejected'){
        const subject = 'Document Verification failed'
        await sendmessage(worker.email,  remark,subject);
      }
      res.status(200).json({ message: `Worker status updated to ${status}` });
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: 'Error updating worker status' });
    }
  };
  
  // Send report to worker on suspicious activity
export const sendSuspiciousReport = async (req, res) => {
    const { workerId, message } = req.body;
    try {
      const worker = await User.findById({workerId});
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      const subject = 'Suspicious Activity'
      await sendmessage(worker.email,  message,subject);
      res.status(200).json({ message: 'Report sent successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error sending report' });
    }
  };


export const submitDocuments = async (req, res) => {
  const ourUserId = req.userData.userId;
  const { documentname1,documentname2 } = req.body;
 console.log(req.body);
  try {
    const existingVerification = await User.findById(ourUserId);
    if (existingVerification) {
      await WrokerVerify.deleteOne({ email: existingVerification.email });
    }
    // Uploading both documents to Cloudinary
           const file1Buffer = req.files.document1[0].buffer;
            const file1Result = await uploadonCloudinary(file1Buffer);
            let file1 =  file1Result.url; // Use Cloudinary's returned URL
            const file2Buffer = req.files.document2[0].buffer;
            const file2Result = await uploadonCloudinary(file2Buffer);
            let file2 =  file2Result.url; // Use Cloudinary's returned URL
    //const file1 = await uploadonCloudinary(req.files.document1[0].path);
    //const file2 = await uploadonCloudinary(req.files.document2[0].path);

   
    const newVerification = new WrokerVerify({
      userId:ourUserId,
      fullName:existingVerification.name,
      email:existingVerification.email,
      documents: [
        {
          documentType: documentname1,
          documentUrl: file1,
        },
        {
          documentType: documentname2,
          documentUrl: file2,
        },
      ],
      status:'Pending'
    });

    await newVerification.save();
    
    
    const subject = 'Verification Document submission'
    const message = 'Document submitted successfully. Verification is under progress'
    await sendmessage(existingVerification.email,  message,subject);
    res.status(200).json({
       success:true,
       message: 'Documents submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting documents' });
  }
};

export const listPendingDocuments = async (req, res) => {
    try {
      const pendingDocuments = await WrokerVerify.find({
        'status': 'Pending',
      })
  
      if (pendingDocuments.length === 0) {
        console.log("no document");
        return res.status(404).json({ message: 'No pending documents found' });
      }
  
      res.status(200).json(pendingDocuments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving pending documents' });
    }
  };
  