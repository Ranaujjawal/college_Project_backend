import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User} from '../model/user.js';
import { OTP } from '../model/otp.js';
import { sendMail,sendforgototp,sendmessage } from '../config/emailcondig.js';
import { otpGeneratot } from '../config/otpgenerator.js';
import {uploadonCloudinary} from '../config/cloudinary.js'
import dotenv from 'dotenv';
import mongoose from 'mongoose'
import { Redisclient } from '../config/redisclient.js';
dotenv.config();


export const login = async (req, res) => {
  const { email, password } = req.body;
  //console.log(req.body)
  try {
    const foundUser = await User.findOne({ email });
   if  (!foundUser) {
      return res.status(401).json('User not found');
    }

    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (!passOk) {
      return res.status(401).json('Wrong password');
    }

    jwt.sign(
      { userId: foundUser._id, email },
      process.env.JWT_SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, { sameSite: 'none', secure: true }).json({
          id: foundUser._id,
        });
      }
    );
  } catch (err) {
    res.status(500).json('Server error');
  }
};

export const register = async (req, res) => {
  //console.log(req.body);
  try {
    const normalizedBody = Object.assign({}, req.body);
    const { 
      name, 
      email, 
      password, 
      location: rawLocation, 
      role = 'customer', 
      profession = 'none',
      hourlyRate = 0 ,
    } = normalizedBody;
    const location = {
      description: rawLocation.description,
      coordinates: rawLocation.coordinates.map(coord => parseFloat(coord)), // Convert strings to numbers
    };

    //console.log("hello",name,email,password,location,role,profession);

    const exists = await Redisclient.exists(email); 
    if (exists) { // If the key exists, delete it 
      await Redisclient.del(email);
        }
        
    const existingUser = await User.findOne({email});
    
    if (existingUser) {
     // console.log("user exist");
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Generate OTP
    const otp = otpGeneratot();
    await OTP.deleteOne({email});
    // Save OTP to database
    await OTP.create({
      email,
      otp,
    });

    let avatarLocalPath="";
     if(req.files.avatar){  
      avatarLocalPath =  req.files?.avatar[0]?.path;
     }
   
      
  
      let avatarimage,avatarurl;
   if(avatarLocalPath){
    avatarimage = await uploadonCloudinary(avatarLocalPath);
    avatarurl=avatarimage.url;
   }

    
  
   
   const tempUser = {
      name,
      email,
      password,
      location,
      role,
      profession: role === 'worker' ? profession : 'none',
      hourlyRate: role === 'worker' ? hourlyRate : 0,
      avatar:avatarurl
    };
    req.session.tempUser;
    await req.session.save();
    req.session.cookie.expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    // Send OTP to user's email
    await sendMail(email, otp);
    await Redisclient.set(email, JSON.stringify(tempUser),'EX', 15 * 60);
    res.cookie('registeremail', email, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
    });

  } catch (err) {
    console.error('Registration initiation error:', err);
    res.status(500).json({
      
      message: 'Error initiating registration process'
    });
  }
};


export const verifyOTPAndRegister = async (req, res) => {
  try {
  //console.log(req.session);
  const { otp } = req.body;
  const email = req.cookies.registeremail;
    if (!email) {
      return res.status(400).json({ message: 'Session over. Please restart the process.' });
    }
  const tempUserData = await Redisclient.get(email);
  if (!tempUserData) {
    return res.status(400).json({ message: 'Session expired. Please restart the registration process.' });
  }
  const tempUser = JSON.parse(tempUserData);
 // const tempUser = req.session.tempUser;
 //console.log("temp user : ",tempUser)
  // if (!tempUser) {
  //   return res.status(400).json({
  //     message: 'Registration session expired. Please start over.'
  //   });
  // }

  
    
    const otpRecord = await OTP.findOne({
      email: tempUser.email
    });

    if (!otpRecord || otpRecord.otp!=otp) {
      //console.log("userotp",otp,"databaseotp",otpRecord.otp);
      return res.status(400).json({
        message: 'Invalid OTP or OTP expired'
      });
    }

    
    const hashedPassword = await bcrypt.hash(tempUser.password, 10);

    const loc = {
      type: "Point",
      coordinates: tempUser.location.coordinates, // [longitude, latitude]
    };

    const createdUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: hashedPassword,
      location: { description: tempUser.location.description, coordinates: tempUser.location.coordinates },
      loc: loc,
      role: tempUser.role,
      profession: tempUser.profession,
      hourlyRate: tempUser.hourlyRate,
      avatar:tempUser.avatar
    });

    
    await OTP.deleteOne({ _id: otpRecord._id });

   
    delete req.session.tempUser

   
    jwt.sign(
      { 
        userId: createdUser._id,
        email: createdUser.email,
      },
      process.env.JWT_SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie('token', token, { sameSite: 'none', secure: true })
          .status(201)
          .json({
            success:true,
            id: createdUser._id,
            message: 'Registration completed successfully'
          });
      }
    );
    sendmessage(tempUser.email,"Registeration Successful","Registeration")
  } catch (err) {
    console.error('Registration completion error:', err);
    res.status(500).json({
      message: 'Error completing registration'
    });
  }
};


export const resendOTP = async (req, res) => {
  const email = req.cookies.registeremail;
  
  if (!email) {
    return res.status(400).json({
      message: 'Registration session expired. Please start over.'
    });
  }

  try {
    
    await OTP.deleteOne({ email: email});

   
    const otp = otpGeneratot();

  
    await OTP.create({
      email: email,
      otp,
    });

   
    await sendMail(email, otp);

    res.status(200).json({
      success:true,
      message: 'New OTP sent successfully'
    });

  } catch (err) {
    console.error('OTP resend error:', err);
    res.status(500).json({
      message: 'Error resending OTP'
    });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', { sameSite: 'none', secure: true }).json({
    success: true,
    message: 'logout Successfully',
  });
};

export const initiateForgotPassword = async (req, res) => {
  const { email } = req.body;
 // console.log(email);
 //console.log(req.session);
  try {
    // Check if user exists
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status:false,
        message: 'No user found with this email address'
      });
    }

    // Delete any existing OTP for this email
    await OTP.deleteOne({ email });

    // Generate new OTP
    const otp = otpGeneratot();

    // Save OTP
    await OTP.create({
      email,
      otp
    });

    // Store email in session for later verification

    // Send OTP
    await sendforgototp(email,otp);
    res.cookie('resetemail', email, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
    res.status(200).json({
      status:true,
      message: 'Password reset OTP has been sent to your email'
    });

  } catch (err) {
    console.error('Forgot password initiation error:', err);
    res.status(500).json({
      message: 'Error initiating password reset process'
    });
  }
};


export const verifyForgotPasswordOTP = async (req, res) => {
  const { otp } = req.body;
  const email = req.cookies.resetemail;
 // console.log(email,otp)
  if (!email) {
    return res.status(400).json({
      message: 'Password reset session expired. Please start over.'
    });
  }

  try {
    const otpRecord = await OTP.findOne({
      email,
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Invalid OTP or OTP expired'
      });
    }

    // jwt.sign(
    //   { email:  email },
    //   process.env.JWT_SECRET,
    //   {expiresIn: '15m'},
    //   (err, token) => {
    //     if (err) throw err;
    //     res.cookie('resetToken', resetToken, { sameSite: 'none', secure: true }).json({
          
    //     });
    //   }
    // );
    // OTP is valid - generate a temporary token for password reset
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Token expires in 15 minutes
    );
    res.cookie('resetoken', resetToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    delete req.session.tempuser;
    req.session.tempuser ={
      email,
      resetToken
    }
    res.status(200).json({
      status:true,
      message: 'OTP verified successfully',
      resetToken
    });
    
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({
      message: 'Error verifying OTP'
    });
  }
};


export const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const resetToken=req.cookies.resetoken;
  
 // console.log(resetToken,newPassword);
  if (!resetToken || !newPassword) {
    return res.status(400).json({
      message: 'Missing required fields'
    });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const email = decoded.email;
    //console.log(email,newPassword);
    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    const user = await User.findOneAndUpdate(
      { email },
      { 
        password: hashedPassword,
 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Clear reset email from session
    delete req.session.tempUser;
    sendmessage(email,"Password Reset Successfully","Password Reset")
    res.status(200).json({
      message: 'Password reset successfully'
    });
    
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid or expired reset token'
      });
    }
    console.error('Password reset error:', err);
    res.status(500).json({
      message: 'Error resetting password'
    });
  }
};


export const resendForgotPasswordOTP = async (req, res) => {
  try {
    const email = req.cookies.resetemail;

  if (!email) {
    return res.status(400).json({
      message: 'Password reset session expired. Please start over.'
    });
  }

  
    // Delete existing OTP
    await OTP.deleteOne({ 
      email,
      type: 'password_reset'
    });

    // Generate new OTP
    const otp = otpGeneratot();

    // Save new OTP
    await OTP.create({
      email,
      otp,
      type: 'password_reset'
    });

    // Send new OTP
    await sendforgototp(
      email,
      otp
      
    );

    res.status(200).json({
      message: 'New password reset OTP sent successfully'
    });

  } catch (err) {
    console.error('OTP resend error:', err);
    res.status(500).json({
      message: 'Error resending OTP'
    });
  }
};

export const updateUserRating = async (req, res) => {
  try {
  const { userId,rating } = req.body;
  
 
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 0 and 5'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Calculate new average rating
    const newTotalRatings = user.totalRatings + 1;
    const newRating = ((user.rating * user.totalRatings) + rating) / newTotalRatings;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          rating: Number(newRating.toFixed(1)),
          totalRatings: newTotalRatings
        }
      },
      { new: true, select: '-password' }
    );

    res.status(200).json({
      success:true,
      message: 'Rating updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('Rating update error:', err);
    res.status(500).json({
      message: 'Error updating rating'
    });
  }
};


export const getWorkers = async (req, res) => {
  
  const ourUserId = req.userData.userId;

  try {
    const data = req.body;

    let rawLocation = data.params.location;
    let minRating = data.params.minRating;
    let maxPrice = data.params.maxPrice;
    let profession = data.params.profession;
    let radius = data.params.radius;
    let sortBy = data.params.sortBy;

    let location = "";
    if (rawLocation && rawLocation.coordinates) {
      location = {
        description: rawLocation.description || "Unknown Location",
        coordinates: rawLocation.coordinates.map((coord) => parseFloat(coord)),
      };

      if (
        !location.coordinates ||
        location.coordinates.length !== 2 ||
        isNaN(location.coordinates[0]) ||
        isNaN(location.coordinates[1])
      ) {
       // console.log("Invalid or missing coordinates");
        location = null; // Reset location for fallback
      }
    }

    let query = {
      role: "worker",
      _id: { $ne: ourUserId },
    };

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    if (maxPrice) {
      query.hourlyRate = { $lte: Number(maxPrice) };
    }
    if (profession && profession !== "all") {
      query.profession = profession;
    }

    if (location && location.coordinates) {
      const point = {
        type: "Point",
        coordinates: location.coordinates,
      };
  
      query.loc = {
        $near: {
          $geometry: point,
          $maxDistance: radius * 1000, // Convert radius to meters
        },
      };
    } else {
      //console.log("Empty coordinates, skipping geospatial query.");
    }

    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "rating":
          sort = { rating: -1 };
          break;
        case "price_low":
          sort = { hourlyRate: 1 };
          break;
        case "price_high":
          sort = { hourlyRate: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const workers = await User.find(query).select("-password").sort(sort).lean();

    res.status(200).json({
      success:true,
      count: workers.length,
      workers,
    });
  } catch (err) {
    console.error("Get workers error:", err);
    res.status(500).json({
      message: "Error fetching workers",
    });
  }
};

