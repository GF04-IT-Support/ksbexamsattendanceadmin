"use server";

import { spawn } from "child_process";
import path from "path";
import prisma from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import {
  correlateInvigilatorsWithExams,
  fetchInvigilators,
  matchInvigilatorsWithAbbreviatedNames,
} from "../helpers/exams.helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

const pythonPath = process.env.PYTHON_PATH as string;

export async function extractExamsSchedule(
  base64PdfData: string,
  exam_name_id?: string
) {
  return new Promise(async (resolve, reject) => {
    try {
      if (exam_name_id) {
        await deleteExamsSchedule(exam_name_id);
      }

      const scriptPath = path.join(
        process.cwd(),
        "utils/scripts/exams_schedule_extractor.py"
      );
      const pythonProcess = spawn(pythonPath, ["-u", scriptPath]);

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

export async function getUpcomingExamsSchedule() {
  try {
    const currentDate = new Date();

    const upcomingExams = await prisma.exam.findMany({
      where: {
        date: {
          gte: currentDate,
        },
      },
      // where: {
      //   AND: [
      //     { date: { gte: new Date("2023-08-23") } },
      //     { date: { lte: new Date("2023-08-27") } },
      //   ],
      // },
      include: {
        sessions: {
          include: {
            venue: true,
            assignments: {
              include: {
                staff: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return upcomingExams;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function extractInvigilatorsSchedule(base64PdfData: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const scriptPath = path.join(
        process.cwd(),
        "utils/scripts/invigilators_extractor.py"
      );
      const pythonProcess = spawn(pythonPath, ["-u", scriptPath]);

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

          resolve({
            data: { matchedData, unmatchedData },
            message: `The invigilators schedule has been extracted successfully`,
          });
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
  try {
    let unmatchedDetails;
    const result = await correlateInvigilatorsWithExams(confirmedData);

    if (result) {
      unmatchedDetails = result.unmatchedDetails;
    }

    return {
      message: "The invigilators schedule has been uploaded successfully",
      unmatchedDetails,
    };
  } catch (error) {
    return {
      message: "An error occurred while uploading the invigilator's schedule.",
    };
  }
}

export async function editExamsSchedule(exam_id: string, data: any) {
  if (data.date) {
    data.date = new Date(data.date);
  }
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

export async function deleteExamsSchedule(exam_name_id: string) {
  try {
    await prisma.examName.delete({
      where: {
        exam_name_id: exam_name_id,
      },
    });
    revalidatePath("/exams-schedule");
    return { message: "Exam deleted successfully" };
  } catch (error: any) {
    return { message: "An error occurred while deleting the exam schedule." };
  }
}

export async function assignStaffToExamSession(
  exam_id: string,
  venue_name: string,
  staff_ids: string[],
  role: string,
  keepExisting: boolean = false
) {
  const { user }: any = await getServerSession(authOptions);

  try {
    const venues = await prisma.venue.findMany();
    const venueMap = new Map(venues.map((venue) => [venue.name, venue]));

    if (!venueMap.has(venue_name)) {
      const newVenue = await prisma.venue.create({
        data: { name: venue_name },
      });
      venueMap.set(venue_name, newVenue);
    }

    const venue: any = venueMap.get(venue_name);

    const examSessions = await prisma.examSession.findMany({
      where: {
        exam_id: exam_id,
        venue_id: venue.venue_id,
      },
    });

    const examSessionMap = new Map(
      examSessions.map((examSession) => [examSession.exam_id, examSession])
    );

    if (!examSessionMap.has(exam_id)) {
      const newExamSession = await prisma.examSession.create({
        data: {
          exam_id: exam_id,
          venue_id: venue.venue_id,
          createdBy: user.id,
        },
      });
      examSessionMap.set(exam_id, newExamSession);
    }

    const examSession: any = examSessionMap.get(exam_id);

    if (!keepExisting) {
      await prisma.staffAssignment.deleteMany({
        where: {
          exam_session_id: examSession.exam_session_id,
          role: role,
        },
      });
    }

    const existingAssignments = await prisma.staffAssignment.findMany({
      where: {
        staff_id: {
          in: staff_ids,
        },
        exam_session_id: examSession.exam_session_id,
        role: role,
      },
    });

    const assignmentsToCreate = staff_ids.filter(
      (staff_id) =>
        !existingAssignments.some(
          (assignment) => assignment.staff_id === staff_id
        )
    );

    await prisma.staffAssignment.createMany({
      data: assignmentsToCreate.map((staff_id) => ({
        staff_id: staff_id,
        exam_session_id: examSession.exam_session_id,
        role: role,
      })),
    });

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

export async function lockOrUnlockExams(exam_id: string, locked: boolean) {
  try {
    await prisma.exam.update({
      where: {
        exam_id: exam_id,
      },
      data: {
        locked: locked,
      },
    });
    revalidatePath("/staff-management");
    return { message: "The exam has been locked successfully!" };
  } catch (error: any) {
    return { message: "An error occurred while locking the exam." };
  }
}
