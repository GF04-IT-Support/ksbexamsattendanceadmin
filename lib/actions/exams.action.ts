"use server";

import { spawn } from "child_process";
import path from "path";
import prisma from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import {
  addUnmatchedNamesToStaff,
  correlateInvigilatorsWithExams,
  fetchInvigilators,
  matchInvigilatorsWithAbbreviatedNames,
} from "../helpers/exams.helpers";
import { currentUser } from "@clerk/nextjs";
import { getStaffRoles } from "../helpers/staff.helpers";

export async function extractExamsSchedule(base64PdfData: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(
        process.cwd(),
        "utils/scripts/exams_schedule_extractor.py"
      );
      const pythonProcess = spawn("python", ["-u", scriptPath]);

      pythonProcess.stdin.setDefaultEncoding("utf-8");
      pythonProcess.stdin.write(base64PdfData);
      pythonProcess.stdin.end();

      let outputData = "";

      pythonProcess.stdout.on("data", (data) => {
        outputData += data;
      });

      //  pythonProcess.stderr.on('data', (data) => {
      //   resolve({ message: `An error occurred while uploading the exam schedule` });
      // });

      pythonProcess.on("close", async (code) => {
        if (code !== 0) {
          resolve({
            message: `An error occurred while uploading the exam schedule.`,
          });
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
            resolve({
              message: `The exam schedule has already been uploaded.`,
            });
            return;
          }

          const examName = await prisma.examName.create({
            data: {
              exam_name: exam_name,
            },
          });

          for (const exam of exams) {
            const dateParts = exam.Date.split("/");
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
          resolve({
            message: `The exam schedule has been uploaded successfully!`,
          });
        }
        revalidatePath("/exams-schedule");
      });
    } catch (err) {
      resolve({
        message: `An error occurred while uploading the exam schedule.`,
      });
    }
  });
}

export async function getExamsNames() {
  try {
    const examNames = await prisma.examName.findMany();
    return examNames;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getExamsSchedule(examsNameId: string, role?: string) {
  try {
    let exams;
    if (role) {
      exams = await prisma.exam.findMany({
        where: {
          exam_name_id: examsNameId,
        },
        include: {
          sessions: {
            include: {
              venue: true,
              assignments: {
                where: {
                  role: role,
                },
                include: {
                  staff: true,
                },
              },
            },
          },
        },
      });
    } else {
      exams = await prisma.exam.findMany({
        where: {
          exam_name_id: examsNameId,
        },
      });
    }

    return exams;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function extractInvigilatorsSchedule(base64PdfData: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(
        process.cwd(),
        "utils/scripts/invigilators_extractor.py"
      );
      const pythonProcess = spawn("python", ["-u", scriptPath]);

      pythonProcess.stdin.setDefaultEncoding("utf-8");
      pythonProcess.stdin.write(base64PdfData);
      pythonProcess.stdin.end();

      let outputData = "";

      pythonProcess.stdout.on("data", (data) => {
        outputData += data;
      });

      //  pythonProcess.stderr.on('data', (data) => {
      //   resolve({ message: `An error occurred while uploading the invigilator schedule` });
      // });

      pythonProcess.on("close", async (code) => {
        if (code !== 0) {
          resolve({
            message: `An error occurred while uploading the exam schedule.`,
          });
        } else {
          const result = JSON.parse(outputData);

          const invigilators = await fetchInvigilators();

          const { matchedData, unmatchedData } =
            await matchInvigilatorsWithAbbreviatedNames(invigilators, result);
          // console.log(matchedData);

          resolve({
            data: { matchedData, unmatchedData },
            message: `The invigilators schedule has been extracted successfully`,
          });

          //   if (unmatchedAbbreviatedNames.length) {
          //     await addUnmatchedNamesToStaff(unmatchedAbbreviatedNames);

          //     invigilators = await fetchInvigilators();

          //       ({ correlation, unmatchedAbbreviatedNames } = await matchInvigilatorsWithAbbreviatedNames(invigilators, result));
          //   }

          //  for (const invigilators of correlation) {
          //      await correlateInvigilatorsWithExams(invigilators.full_name, invigilators.details, invigilators.staff_id);
          //   }

          //   revalidatePath('/staff-management')
          //   resolve({ message: `The invigilators schedule has been uploaded successfully!` });
        }
      });
    } catch (err) {
      resolve({
        message: `An error occurred while extracting the invigilator's schedule.`,
      });
    }
  });
}

export async function addConfirmedInvigilatorsToExams(confirmedData: any) {
  const user = await currentUser();

  if (!user) return null;

  try {
    await correlateInvigilatorsWithExams(confirmedData);

    return {
      message: "The invigilator's schedule has been uploaded successfully!",
    };
  } catch (error) {
    return {
      message: "An error occurred while uploading the invigilator's schedule.",
    };
  }
}

export async function editExamsSchedule(exam_id: string, data: any) {
  try {
    await prisma.exam.update({
      where: {
        exam_id: exam_id,
      },
      data: data,
    });
    return { message: "The exam schedule has been updated successfully!" };
  } catch (error: any) {
    return { message: "An error occurred while updating the exam schedule." };
  }
}

export async function assignStaffToExamSession(
  exam_id: string,
  venue_name: string,
  staff_ids: string[],
  role: string
) {
  const user = await currentUser();

  if (!user) return null;

  try {
    let venue = await prisma.venue.findFirst({
      where: { name: venue_name },
    });

    if (!venue) {
      venue = await prisma.venue.create({
        data: { name: venue_name },
      });
    }

    let examSession = await prisma.examSession.upsert({
      where: {
        exam_id: exam_id,
        venue_id: venue.venue_id,
      },
      update: {},
      create: {
        exam_id: exam_id,
        venue_id: venue.venue_id,
        createdBy: user.id,
      },
    });

    const existingAssignments = await prisma.staffAssignment.findMany({
      where: {
        exam_session_id: examSession.exam_session_id,
        role: role,
      },
    });

    for (let assignment of existingAssignments) {
      if (!staff_ids.includes(assignment.staff_id)) {
        await prisma.staffAssignment.delete({
          where: {
            id: assignment.id,
          },
        });
      }
    }

    for (let staff_id of staff_ids) {
      const existingAssignment = await prisma.staffAssignment.findFirst({
        where: {
          staff_id: staff_id,
          exam_session_id: examSession.exam_session_id,
          role: role,
        },
      });

      if (!existingAssignment) {
        await prisma.staffAssignment.create({
          data: {
            staff_id: staff_id,
            exam_session_id: examSession.exam_session_id,
            role: role,
          },
        });
      }
    }

    return {
      message:
        "Staff member(s) have been assigned to the exam session successfully",
    };
  } catch (error: any) {
    return {
      message:
        "An error occurred while assigning staff members to the exam session.",
    };
  }
}
