"use server"

import { exec as execCb, spawn } from 'child_process';
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

export async function extractExamsSchedule(base64PdfData: string, fileName: string) {
  try {
    const existingExamName = await prisma.examName.findUnique({
      where: {
        exam_name: fileName,
      },
    });

    if (existingExamName) {
      console.log(`The exam schedule from the file "${fileName}" has already been uploaded.`);
      return;
    }

    const scriptPath = path.join(process.cwd(), 'utils/scripts/exams_schedule_extractor.py');
    const pythonProcess = spawn('python', ['-u', scriptPath]);

    pythonProcess.stdin.setDefaultEncoding('utf-8');
    pythonProcess.stdin.write(base64PdfData);
    pythonProcess.stdin.end();

    let outputData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data;
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.log(`child process exited with code ${code}`);
      } else {
        const exams = JSON.parse(outputData);

        const examName = await prisma.examName.create({
          data: {
            exam_name: fileName,
          },
        });

        for (const exam of exams) {
          const dateParts = exam.Date.split('/');
          const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          const date = new Date(isoDate);

          await prisma.exam.create({
            data: {
              date: date,
              start_time: exam["Start Time"],
              end_time: exam["End Time"],
              exam_code: exam["Course Code"],
              venue: exam.Venue,
              exam_name: {
                connect: {
                  exam_name_id: examName.exam_name_id,
                },
              },
            },
          });
        }
      }
    });

  } catch (error) {
    console.error(`exec error: ${error}`);
  }
}