// import dotenv from 'dotenv' 
// import {v2 as cloudinary} from "cloudinary"
// import fs  from "fs"

// dotenv.config()

//   cloudinary.config({ 
//         cloud_name: process.env.CLOUDNIARY_CLOUD_NAME, 
//         api_key: process.env.CLOUDNIARY_API_KEY, 
//         api_secret: process.env.CLOUDNIARY_API_SECRET
//     });

//     const uploadonCloudinary =  async (localFilePath) =>{
//         //console.log(process.env.CLOUDNIARY_CLOUD_NAME,process.env.CLOUDNIARY_API_KEY,process.env.CLOUDNIARY_API_SECRET)
//         try {
//             if(!localFilePath) {
//              console.log("path not found");
//                 return null;
//             }
//             const response = await cloudinary.uploader.upload(
//                 localFilePath,{
//                     resource_type: "auto"
//                 })
//                // console.log("file is uploaded on cloudinary : ", response.url);
//                 fs.unlinkSync(localFilePath);
//                 return response;
//         } catch (error) {
//            fs.unlinkSync(localFilePath) // remove the locally saved temporary file
//           console.log("error: ",error);
//             return null;
//         }
//     }
//     export {uploadonCloudinary}
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDNIARY_CLOUD_NAME,
    api_key: process.env.CLOUDNIARY_API_KEY,
    api_secret: process.env.CLOUDNIARY_API_SECRET,
});

const uploadonCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "avatars" }, // Customize folder if needed
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        stream.end(fileBuffer);
    });
};

export { uploadonCloudinary };
