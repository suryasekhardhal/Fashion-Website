import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"


const generateAccessTokenAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404,"User not found")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, error.message || "Token generation failed")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    const {name,email,password,phone} = req.body
    if(!name) {
        throw new ApiError(400,"Name is required")
    }
    if(!email) {
        throw new ApiError(400,"Email is required")
    }
    if(!password) {
        throw new ApiError(400,"Password is required")
    }
    if(!phone) {
        throw new ApiError(400,"Phone is required")
    }

    const existedUser = await User.findOne({email})

    if(existedUser) {
        throw new ApiError(409,"User already exists with this email or name")
    }

    const user = await User.create({
        name,
        email,
        password,
        phone
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500,"Failed to create user")
    }

    // Auto login after registration
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(createdUser._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:'strict',
        maxAge:7*24*60*60*1000 // 7 days
    }

    return res.status(201)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponce(
        200,
        {
            user:loggedInUser,
            accessToken
        },
        "User register and logged in successfully"
    )
    )

    // return res.status(201).json(new ApiResponce("User registered successfully",createdUser))

})

const signInUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body
    if(!email) {
        throw new ApiError(400,"Email is required")
    }
    if(!password) {
        throw new ApiError(400,"Password is required")
    }

    // const user = await User.findOne({email})
    // console.log("SignIn user controller user.findOne",user);
    const user = await User.findOne({ email }).select("+password");

    
    if (!user) {
        throw new ApiError(404,"User not registered with this email")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid password")
    }
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:'strict',
        maxAge:7*24*60*60*1000 // 7 days
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponce(
        200,
        {
            user:loggedInUser,
            accessToken
        },
        "User logged in successfully"
    )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    if (!req.user) {
        throw new ApiError(401,"Unauthorized user")
    }
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true,
        }
    );
    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:'strict',
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponce(
        200,
        null,
        "User logged out successfully"
    ))
})

const generateNewAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized to generate access token request")
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
    }

    const user = await User.findById(decodedToken?._id).select("+refreshToken")
    if (!user) {
        throw new ApiError(404,"User not found")
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401,"Invalid refresh token")
    }

    const newAccessToken = user.generateAccessToken()

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:'strict',
        maxAge:15 * 60 * 1000
    }

    return res.status(200)
    .cookie("accessToken",newAccessToken,options)
    .json(new ApiResponce(
        200,
        {
            accessToken:newAccessToken
        },
        "New access token generated successfully"
    ))
})

// change password, forgot password, reset password can be added later
// profile update can be added later
// get user profile can be added later
// get all users can be added later (for admin)

export {registerUser,signInUser,logoutUser,generateNewAccessToken,}