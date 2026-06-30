import express from 'express'
import dotenv from 'dotenv'
import { connectToDB } from './database/db.js' 
import router from './routes/index.js'
import './schemas/index.js'
import morgan from 'morgan';
import type { RequestHandler } from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser'
dotenv.config();


//routes
const port = process.env.PORT

const app = express()
const allowedOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

//middleware
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true, limit: "5mb" }))
app.use(morgan('dev') as RequestHandler)
app.use(cookieParser())

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))


//routes
router(app)

connectToDB()

app.get('/', (req: any, res: any) => {
    res.send('Backend Connected Successfully')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
