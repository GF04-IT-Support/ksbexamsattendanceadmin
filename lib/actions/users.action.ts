"use server";

import prisma from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export async function fetchUsers() {
  try {
    const users = await prisma.user.findMany({
      // where: {
      //   googleId: {
      //     not: null,
      //   },
      // },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subRole: true,
        googleId: true,
        blocked: true,
      },
    });
    return users;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/user-management");
    return { message: "User deleted successfully" };
  } catch (error: any) {
    return { message: "An error occurred while deleting the user." };
  }
}

export async function blockUnblockUser(id: string, blocked: boolean) {
  try {
    await prisma.user.update({ where: { id }, data: { blocked } });
    revalidatePath("/user-management");
    return {
      message: `User ${blocked ? "blocked" : "unblocked"} successfully`,
    };
  } catch (error: any) {
    return {
      message: `An error occurred while ${
        blocked ? "blocking" : "unblocking"
      } the user.`,
    };
  }
}

export async function addNewUser(data: any) {
  try {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (emailExists) {
      return { message: "Email already exists" };
    }

    await prisma.user.create({ data });
    return { message: "User created successfully" };
  } catch (error: any) {
    return { message: "An error occurred while creating the user." };
  }
}
