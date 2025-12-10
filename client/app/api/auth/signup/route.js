import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma";

export async function POST(req) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    if (!email || !password ||!firstName || !lastName)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser)
      return NextResponse.json({ error: "User exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    const user =await prisma.user.create({
      data: { email, passwordHash: hashed, firstName, lastName, phone, roleId: 1},
    });

    await prisma.admin.create({
      data: { adminId: user.userId, email, firstName, lastName, phone},
    });

    return NextResponse.json({ message: "User created" }, {status: 201});
  } catch (err) {
    console.error('Error', err);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}
