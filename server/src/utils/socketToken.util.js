import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Generate Socket JWT Token
const socketTokenGeneration = async({ interviewId, durationMin, userId, role }) => {
  const durationInMinutes = Number(durationMin) + 1;

  return jwt.sign(
    {
      userId: userId,
      role: role,
      interviewId: interviewId,
    },
    process.env.SOCKET_JWT_SECRET,
    {
      expiresIn: `${durationInMinutes}m`,
    }
  );
};

export default socketTokenGeneration;
