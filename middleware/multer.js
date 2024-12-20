// import multer from "multer"

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public")
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//       cb(null, file.originalname+ '-' + uniqueSuffix)
//     }
//   })
  
//  export const upload = multer({ storage})
import multer from "multer";

// Use memoryStorage to avoid saving files locally
const storage = multer.memoryStorage();

export const upload = multer({ storage });
