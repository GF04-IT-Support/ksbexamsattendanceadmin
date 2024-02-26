"use server";

import { exec as execCb } from "child_process";
import { promisify } from "util";
import path from "path";
import prisma from "@/utils/prisma";
import { getStaffRoles } from "../helpers/staff.helpers";

const exec = promisify(execCb);

type StaffInfo = {
  Name: string;
  Position: string;
  Department: string;
};

export async function extractStaffInfo() {
  try {
    const scriptPath = path.join(
      process.cwd(),
      "utils/scripts/extract_staff_info.py"
    );
    const { stdout } = await exec(`python -u "${scriptPath}"`);

    const data: StaffInfo[] = JSON.parse(stdout);

    for (const { Name, Position, Department } of data) {
      const existingStaff = await prisma.staff.findFirst({
        where: { staff_name: Name },
      });

      if (existingStaff) {
        await prisma.staff.update({
          where: { staff_id: existingStaff.staff_id },
          data: { staff_role: Position, department: Department },
        });
      } else {
        await prisma.staff.create({
          data: {
            staff_name: Name,
            staff_role: Position,
            department: Department,
          },
        });
      }
    }
  } catch (error) {
    console.error(`exec error: ${error}`);
  }
}

export async function fetchStaffDetails(id: string) {
  let staffRoles = getStaffRoles(id);

  try {
    const staffDetails = await prisma.staff.findMany({
      where: { staff_role: { in: staffRoles } },
    });

    return staffDetails;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function deleteStaffDetails(id: string) {
  try {
    await prisma.staff.delete({ where: { staff_id: id } });
    return { message: "Staff deleted successfully" };
  } catch (error: any) {
    return { message: "An error occurred while deleting the staff." };
  }
}

export async function updateStaffDetails(id: string, data: any) {
  try {
    await prisma.staff.update({
      where: { staff_id: id },
      data,
    });
    return { message: "Staff details updated successfully" };
  } catch (error: any) {
    return { message: "An error occurred while updating the staff details." };
  }
}

export async function createNewStaff(data: any) {
  try {
    const trimmedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
      return acc;
    }, {} as any);

    const staffDetails = await prisma.staff.create({ data: trimmedData });
    return { message: "Staff created successfully", data: staffDetails };
  } catch (error: any) {
    return { message: "An error occurred while creating the staff." };
  }
}
