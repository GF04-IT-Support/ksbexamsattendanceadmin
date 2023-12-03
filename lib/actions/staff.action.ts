"use server"

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import prisma from '@/utils/prisma';
import { revalidatePath } from 'next/cache';

const exec = promisify(execCb); 

type StaffInfo = {
  Name: string;
  Position: string;
  Department: string;
};

export async function extractStaffInfo() {
  try {
    const scriptPath = path.join(process.cwd(), 'utils/scripts/extract_staff_info.py');
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
          data: { staff_name: Name, staff_role: Position, department: Department },
        });
      }
    }
    
  } catch (error) {
    console.error(`exec error: ${error}`);
  }
}

export async function fetchStaffDetails(id: string) {
  let staffRoles;
  switch (id) {
    case 'invigilators':
      staffRoles = ['Lecturer', 'Part-Time Lecturer', 'PhD Student', 'Other'];
      break;
    case 'security':
      staffRoles = ['Security'];
      break;
    case 'nurses':
      staffRoles = ['Nurse'];
      break;
    case 'itSupport':
      staffRoles = ['IT Support'];
      break;
    case 'administrative':
      staffRoles = ['Administrative', 'Other'];
      break;
    default:
      throw new Error(`Invalid id: ${id}`);
  }

  try {
    const staffDetails = await prisma.staff.findMany({
    where: { staff_role: { in: staffRoles } },
  });

  return staffDetails;
  } catch (error: any) {
    throw new Error(error);
  }
}