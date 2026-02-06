import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_WANSHITONG_HOST,
  port: Number(process.env.REDIS_WANSHITONG_PORT),
  password: process.env.REDIS_WANSHITONG_PASSWORD,
})

export default redis