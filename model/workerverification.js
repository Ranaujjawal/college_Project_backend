import mongoose from "mongoose";
const userVerificationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    documents: [
      {
        documentType: {
          type: String,
          enum: ['AADHAR','IMAGE',],
          required: true,
        },
        documentUrl: {
          type: String,
          required: true,
        }
      },
    ],
    status:{
      type: String,
      enum: ['Pending', 'Verified', 'Rejected','None'],
      default: 'None',
    },
    remarks: {
      type: String,
      default:'',
    }
  },{timestamps:true});
  
  
  export const WrokerVerify = mongoose.model('WorkerVerify', userVerificationSchema);
  