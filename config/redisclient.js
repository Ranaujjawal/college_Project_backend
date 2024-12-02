import Rediss from 'ioredis'
import dotenv from 'dotenv'
dotenv.config()

export const Redisclient = new Rediss(process.env.REDIS_URL);