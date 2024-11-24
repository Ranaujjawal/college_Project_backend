import mongoose from "mongoose";
import { connectDB } from './config/db.js'
import { User } from "./model/user.js";
connectDB();
const professions = ['plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'gardener'];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const users = Array.from({ length: 30 }).map((_, i) => ({
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  password: `$2a$10$${Math.random().toString(36).slice(-16)}`, // Random bcrypt hash
  location: {
    description: `Location ${i + 1}, Tripura, India`,
    coordinates: [
      91.2867777 + Math.random() * 0.1, // Longitude variation
      23.831457 + Math.random() * 0.1, // Latitude variation
    ],
  },
  loc: {
    type: 'Point',
    coordinates: [
      91.2867777 + Math.random() * 0.1,
      23.831457 + Math.random() * 0.1,
    ],
  },
  role: 'worker',
  avatar: 'default-avatar.png',
  profession: professions[randomBetween(0, professions.length - 1)],
  hourlyRate: randomBetween(50, 200),
  rating: 0,
  totalRatings: 0,
  isVerified: false,
}));

// Insert into the database
User.insertMany(users)
  .then(() => console.log('Users created successfully!'))
  .catch(err => console.error('Error creating users:', err));
