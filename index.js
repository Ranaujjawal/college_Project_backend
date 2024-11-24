import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes from './routers/auth.js';
import messageRoutes from './routers/chat.js';
import userRoutes from './routers/user.js';
import { setupWebSocket } from './controller/websocket.js';
import RedisStore from "connect-redis"
import session from "express-session"
import {createClient} from "redis"
// import Redis from 'ioredis'
import Redis from 'redis'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv'

dotenv.config()
const app = express();


connectDB();
let redisClient = createClient()
  

let redisStore = new RedisStore({
  client: redisClient
})

const allowedOrigin = process.env.CLIENT_URL;



// Middleware
app.use('/uploads', express.static(path.join(__dirname, '..', '/uploads/')));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,  // Allow specific client URL from environment variable
  credentials: true, //process.env.CLIENT_URL
}));
app.use(
  session({
    store: redisStore,
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      
      secure: false } 
  })
);


// Routes
app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
app.use('/users', userRoutes);

const server = app.listen(process.env.PORT || 4040, () => {
  console.log(`Server running on port ${process.env.PORT || 4040}`);
});



// Setup WebSocket
const wss = setupWebSocket(server);
//console.log(wss);
 