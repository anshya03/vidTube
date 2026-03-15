import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


export const verifyJWT = asyncHandler(async(req,__,next) =>{//You're using __ to say "I know res exists but I don't need it here".
    const token = req.cookies.accessToken || req.header
    ("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(401, "Unauthorized, token not found")
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)


        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401, "Unauthorized, user not found")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})