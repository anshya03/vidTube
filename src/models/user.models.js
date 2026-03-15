/*
id string pk
username string
email string
fullName string
avatar string
coverImage string
watchHistory objectId[] videos
password string
refreshToken string
createdAt Date
updatedAt Date
*/

import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {   
            type: String,
            required: true
        },
        coverImage: {
            type: String,//cloudinary URL
    }, 
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]  
        },
        refreshToken:{
            type: String
        } 
    },
    {
        timestamps: true
    }
)


userSchema.pre("save", async function() {
    if(!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}
//When user logs in, you can't decrypt the hashed password. Instead bcrypt compares the plain text password they typed with the stored hash.

userSchema.methods.generateAccessToken = function (){
    //short lived access token
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY});
}

userSchema.methods.generateRefreshToken = function (){
    //long lived refresh token
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
{ expiresIn: process.env.REFRESH_TOKEN_EXPIRY});
}



export const User = mongoose.model("User", userSchema)