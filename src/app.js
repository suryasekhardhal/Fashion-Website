import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'


const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGINS,
    credentials:true
}))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.json({limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())

import userRoutes from './routes/user.route.js'

app.use("/api/v1/users",userRoutes)

export {app}