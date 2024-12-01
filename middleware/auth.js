import jwt from 'jsonwebtoken';

export const getUserDataFromRequest = (req) => {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
        if (err) reject(err);
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });
};
export const AdminauthenticateToken = (req,res,next) => {
  const token = req.cookies?.tokenadmin;
  if (!token) {
    console.log("no token");
    return res.status(401).json('Authentication required');
  }

  jwt.verify(token, process.env.JWT_SECRET_ADMIN, {}, (err, userData) => {
    if (err) {
      console.log("invalid token",err);
      return res.status(403).json('Invalid token');
    
    }
    req.userData = userData;
    next();
  });
};

export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    console.log("no token");
    return res.status(401).json('Authentication required');
  }

  jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
    if (err) {
      console.log("invalid token",err);
      return res.status(403).json('Invalid token');
    
    }
    req.userData = userData;
    next();
  });
};