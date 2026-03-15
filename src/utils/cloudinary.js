import { v2 as cloudinary } from 'cloudinary';//v2 is version 
import fs from "fs"//delets a file from local storage after uploading it to cloudinary
import dotenv from "dotenv"

dotenv.config()


//configuere cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type: "auto",//cloudinary detects which type of file is this
        }
        )

        //delete the file from local storage
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.error("Cloudinary upload failed:", error?.message)
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (error) {
        console.error("Cloudinary delete failed:", error?.message)
        return null

    }
}

export { cloudinary, uploadOnCloudinary, deleteFromCloudinary }