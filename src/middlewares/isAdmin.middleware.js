import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";


const admin = asyncHandler(async(req,res,next)=>{
    const user = req.user
    if (!user) {
        throw new ApiError(401,"Invalid user || User ont Found")
    }
    if(user.role !== 'admin') {
        throw new ApiError(403,"Admin access required")
    }
    next()
})
export {admin};