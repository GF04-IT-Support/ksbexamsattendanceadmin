"use server"

import { spawn } from 'child_process';
import path from 'path';
import prisma from '@/utils/prisma';
import { revalidatePath } from 'next/cache';
import { addUnmatchedNamesToStaff, correlateInvigilatorsWithExams, fetchInvigilators, matchInvigilatorsWithAbbreviatedNames } from '../helpers/exams.helpers';

export async function extractExamsSchedule(base64PdfData: string) {
  return new Promise(async (resolve, reject) => {
    try {
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
          resolve({ message: `An error occurred while uploading the exam schedule.` });
        } else {
          const result = JSON.parse(outputData);
          const exams = result.exams_schedule;
          const exam_name = result.exam_name;

          const existingExamName = await prisma.examName.findUnique({
            where: {
              exam_name: exam_name,
            },
          });

          if (existingExamName) {
            resolve({ message: `The exam schedule has already been uploaded.` });
            return;
          }

          const examName = await prisma.examName.create({
            data: {
              exam_name: exam_name,
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
                year: exam.Year,
                exam_name: {
                  connect: {
                    exam_name_id: examName.exam_name_id,
                  },
                },
              },
            });
          }
          resolve({ message: `The exam schedule has been uploaded successfully!` });
        }
        revalidatePath('/exams-schedule');
      });

    } catch (err) {
      resolve({ message: `An error occurred while uploading the exam schedule.` });
    }
  });
}

export async function getExamsNames() {
    try {
        const examNames = await prisma.examName.findMany();
        return examNames;
    } catch (error:any) {
        throw new Error(error);
    }
}

export async function getExamsSchedule(examsNameId: string) {
    try {
        const exams = await prisma.exam.findMany({
            where: {
                exam_name_id: examsNameId
            }
        });
        return exams;
    } catch (error:any) {
        throw new Error(error);
    }
}



export async function extractInvigilatorsSchedule(base64PdfData: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(process.cwd(), 'utils/scripts/invigilators_extractor.py');
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
          resolve({ message: `An error occurred while uploading the exam schedule.` });
        } else {
          const result = JSON.parse(outputData);

          let invigilators = await fetchInvigilators();
          

          let { correlation, unmatchedAbbreviatedNames } = await matchInvigilatorsWithAbbreviatedNames(invigilators, result);

          if (unmatchedAbbreviatedNames.length) {
            await addUnmatchedNamesToStaff(unmatchedAbbreviatedNames);

            invigilators = await fetchInvigilators();

              ({ correlation, unmatchedAbbreviatedNames } = await matchInvigilatorsWithAbbreviatedNames(invigilators, result));
          }

         for (const invigilators of correlation) {
             await correlateInvigilatorsWithExams(invigilators.full_name, invigilators.details, invigilators.staff_id);
          }
          
          revalidatePath('/staff-management')
          resolve({ message: `The invigilator's schedule has been uploaded successfully!` });
        }
      });
    } catch (err) {
      resolve({ message: `An error occurred while uploading the invigilator's schedule.` });
    }
  });
}

export async function editExamsSchedule(exam_id:string, data:any) {
    try {
        await prisma.exam.update({
            where: {
                exam_id: exam_id
            },
            data: data
        });
        return {message: "The exam schedule has been updated successfully!"}
    } catch (error:any) {
        return {message: "An error occurred while updating the exam schedule."}
    }
}

