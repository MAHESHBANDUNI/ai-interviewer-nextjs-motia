import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import tokenGeneration from "../../utils/jwtToken.util";
import {ApiError} from "../../utils/apiError.util";

export const AuthService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        role: true
      }
    })  
    if (!user) {throw new ApiError("User does not exist", 404)};  
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError("Invalid password", 401);
    }  
    
    // Generate JWT token
    const token = await tokenGeneration(user);
    if (!token) {
      logger.error(`Token generation failed for email: ${email}`);
      throw new ApiError(500, 'Token generation failed.');
    }
    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.roleName,
      token: token
    };
  },
  async signup( email, password, firstName, lastName, phone ){
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      throw new ApiError("User with this email already exists", 400 );

    const hashed = await bcrypt.hash(password, 10);

    const user =await prisma.user.create({
      data: { email, passwordHash: hashed, firstName, lastName, phone, roleId: 1},
    });

    await prisma.admin.create({
      data: { adminId: user.userId, email, firstName, lastName, phone},
    });

    return user;
  }
};
