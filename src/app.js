import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import errorHandler from './middlewares/error.middleware.js'


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
import categoryRoutes from './routes/category.route.js'
import productRoutes from './routes/product.route.js'

app.use("/api/v1/users",userRoutes)
app.use("/api/v1/categories",categoryRoutes)
app.use("/api/v1/products",productRoutes)

app.use(errorHandler)

export {app}