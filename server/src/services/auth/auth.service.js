import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

export const AuthService = {
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        role: true
      }
    })  
    if (!user) throw new Error("User does not exist")  
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid password")
    }  
    return {
      id: user.userId,
      email: user.email,
      name: user.firstName + " " + user.lastName,
      role: user.role.roleName
    };
  },
  async signup( email, password, firstName, lastName, phone ){
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      throw new Error({ error: "User exists" }, { status: 400 });

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
