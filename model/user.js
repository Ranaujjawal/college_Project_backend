import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'worker'],
    default: 'customer'
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  profession: {
    type: String,
    enum: ['none', 'plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'gardener'],
    default: 'none'
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  pastChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
},{
  timestamps: true
});


export const  User = mongoose.model('User', userSchema);
