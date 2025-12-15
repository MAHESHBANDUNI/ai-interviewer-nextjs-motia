import jwt from 'jsonwebtoken';
import "dotenv/config";

// Generate JWT Token
const tokenGeneration = async(user) => {
    return jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roleId: user.roleId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  };

  export default tokenGeneration;