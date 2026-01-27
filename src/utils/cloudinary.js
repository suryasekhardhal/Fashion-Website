const cloudinary = require('cloudinary').v2;
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 const uploadOnCloudinary = async (localFilePath)=>{
        try {
            if(!localFilePath) return null
            // upload on cloudinary
            const responce = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            // file upload successfully
            // console.log("file uploaded",responce.url);
            fs.unlinkSync(localFilePath)
            return responce;
            
        } catch (error) {
            fs.unlinkSync(localFilePath)
            return null;
        }
    }
    export { uploadOnCloudinary }