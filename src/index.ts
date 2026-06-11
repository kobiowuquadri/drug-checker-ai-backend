import express from 'express'
import dotenv from 'dotenv'
import { connectToDB } from './database/db.js' 
import router from './routes/index.js'
import morgan from 'morgan';
import type { RequestHandler } from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser'
dotenv.config();


//routes
const port = process.env.PORT

const app = express()

//middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev') as RequestHandler)
app.use(cookieParser())

 
app.use(cors())


//routes
router(app)

connectToDB()

app.get('/', (req: any, res: any) => {
    res.send('Backend Connected Successfully')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})