import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import errorHandler from './middlewares/error.middleware.js'
import { rawBodySaver } from './middlewares/rawBody.middleware.js'


const app = express()
// app.use(cors({
//     origin:process.env.CORS_ORIGINS,
//     credentials:true
// }))
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.json({limit:'16kb', verify: rawBodySaver})) // Use the rawBodySaver middleware
app.use(express.static("public"))
app.use(cookieParser())

import userRoutes from './routes/user.route.js'
import categoryRoutes from './routes/category.route.js'
import productRoutes from './routes/product.route.js'
import shadeRoutes from './routes/shade.route.js' 
import cartRoutes from './routes/cart.route.js'  
import razorpayWebhookRoute from './routes/razorpay.route.js'
import wishlistRoutes from './routes/wishlist.route.js'

app.use("/api/v1/users",userRoutes)
app.use("/api/v1/categories",categoryRoutes)
app.use("/api/v1/products",productRoutes)
app.use("/api/v1/shades",shadeRoutes)
app.use("/api/v1/cart",cartRoutes)
app.use("/api/v1/razorpay-webhook",razorpayWebhookRoute)
app.use("/api/v1/wishlist",wishlistRoutes)

app.use(errorHandler)

export {app}