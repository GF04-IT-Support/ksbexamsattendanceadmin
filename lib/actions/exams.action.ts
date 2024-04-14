"use server";

import prisma from "@/utils/prisma";
import { revalidatePath } from "next/cache";
import {
  correlateInvigilatorsWithExams,
  fetchInvigilators,
  matchInvigilatorsWithAbbreviatedNames,
} from "@/lib/helpers/exams.helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import axios from "@/utils/axios";
import { sortDataByStartTime } from "../helpers/date.helpers";

export async function extractExamsSchedule(
  base64PdfData: string,
  exam_name_id?: string
) {
  try {
    if (exam_name_id) {
      await deleteExamsSchedule(exam_name_id);
    }

    const response = await axios.post("/exams-schedule/extract", {
      base64_pdf_data: base64PdfData,
    });

    if (response.error) {
      return {
        message: "An error occurred while uploading the exam schedule.",
      };
    }

    const exams = response.data.exams_schedule;
    const exam_name = response.data.exam_name;

    const existingExamName = await prisma.examName.findUnique({
      where: {
        exam_name: exam_name,
      },
    });

    if (existingExamName) {
      return {
        message: "The exam schedule has already been uploaded.",
      };
    }

    const allExams = await prisma.examName.findMany();

    const examName = await prisma.examName.create({
      data: {
        exam_name: exam_name,
        order: String(allExams.length + 1),
      },
    });

    for (const exam of exams) {
      const venueNames = exam.Venue.split(",").map((v: any) => v.trim());

      for (const venueName of venueNames) {
        let venue = await prisma.venue.findUnique({
          where: {
            name: venueName,
          },
        });

        if (!venue) {
          venue = await prisma.venue.create({
            data: {
              name: venueName,
            },
          });
        }
      }

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

    revalidatePath("/exam-schedule");

    return {
      message: "The exam schedule has been uploaded successfully",
    };
  } catch (error) {
    return {
      message: "An error occurred while uploading the exam schedule.",
    };
  }
}

export async function getExamsNames() {
  try {
    const examNames = await prisma.examName.findMany({
      where: {
        selected: true,
      },
      orderBy: {
        order: "desc",
      },
    });
    return examNames;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getAllExamsNames() {
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
    const examNameIds = examsNameId.split(",").filter((id) => id.trim() !== "");
    if (role) {
      exams = await prisma.exam.findMany({
        where: {
          exam_name_id: {
            in: examNameIds,
          },
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
          exam_name_id: {
            in: examNameIds,
          },
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
    const currentDateWithoutTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    let upcomingExams = await prisma.exam.findMany({
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
        end_time: "asc",
      },
    });

    upcomingExams = upcomingExams.filter((exam) => {
      const examDate = new Date(exam.date);
      const examDateWithoutTime = new Date(
        examDate.getFullYear(),
        examDate.getMonth(),
        examDate.getDate()
      );

      const endTimeParts = exam.end_time.split(":");
      let hours = parseInt(endTimeParts[0]);
      const isPM = exam.end_time.toLowerCase().includes("pm");

      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }

      const constructedDate = new Date(examDateWithoutTime);
      constructedDate.setHours(hours);
      constructedDate.setMinutes(parseInt(endTimeParts[1]));

      return constructedDate >= currentDate;
    });

    upcomingExams = sortDataByStartTime(upcomingExams);
    return upcomingExams;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function extractInvigilatorsSchedule(base64PdfData: string) {
  try {
    const response = await axios.post("/invigilators/extract", {
      base64_pdf_data: base64PdfData,
    });

    console.log(response);

    if (response.error) {
      return {
        message:
          "An error occurred while uploading the invigilator's schedule.",
      };
    }

    const { invigilators_schedule: result } = response.data;
    const invigilators = await fetchInvigilators();

    const { matchedData, unmatchedData } =
      await matchInvigilatorsWithAbbreviatedNames(invigilators, result);

    revalidatePath("/invigilators-schedule");

    return {
      data: { matchedData, unmatchedData },
      message: `The invigilators schedule has been extracted successfully`,
    };
  } catch (error) {
    return {
      message: `An error occurred while extracting the invigilator's schedule.`,
    };
  }
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

export async function createExamsSchedule(exam_name_id: string, data: any) {
  if (data.date) {
    data.date = new Date(data.date);
  }
  try {
    await prisma.exam.create({
      data: {
        date: data.date,
        start_time: data.start_time.trim(),
        end_time: data.end_time.trim(),
        exam_code: data.exam_code.trim(),
        venue: data.venue.trim(),
        year: data.year.trim(),
        exam_name: {
          connect: {
            exam_name_id: exam_name_id,
          },
        },
      },
    });
    revalidatePath("/exams-schedule");
    return { message: "The exam schedule has been created successfully" };
  } catch (error: any) {
    return { message: "An error occurred while creating the exam schedule." };
  }
}

export async function editExamsSchedule(exam_id: string, data: any) {
  const trimmedData = Object.keys(data).reduce((acc, key) => {
    acc[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
    return acc;
  }, {} as any);

  if (trimmedData.date) {
    trimmedData.date = new Date(trimmedData.date);
  }

  try {
    await prisma.exam.update({
      where: {
        exam_id: exam_id,
      },
      data: trimmedData,
    });
    revalidatePath("/exams-schedule");
    return { message: "The exam schedule has been updated successfully" };
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

export async function deleteExamsSession(exam_id: string) {
  try {
    await prisma.exam.delete({
      where: {
        exam_id: exam_id,
      },
    });
    revalidatePath("/exams-schedule");
    return { message: "Exam session deleted successfully" };
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
      // If keepExisting is false, delete all existing staff assignments
      await prisma.staffAssignment.deleteMany({
        where: {
          exam_session_id: examSession.exam_session_id,
          role: role,
        },
      });
    }

    // If staff_ids is not empty, proceed with creating new assignments
    if (staff_ids.length > 0) {
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

export async function lockOrUnlockAllExamsSessions(
  exam_name_id: string,
  locked: boolean
) {
  try {
    await prisma.exam.updateMany({
      where: {
        exam_name_id: exam_name_id,
      },
      data: {
        locked: locked,
      },
    });
    revalidatePath("/exams-schedule");
    return {
      message: `All ${locked ? "locked" : "unlocked"} exam sessions have been ${
        locked ? "locked" : "unlocked"
      } successfully`,
    };
  } catch (error) {
    return {
      message: `An error occurred while ${
        locked ? "locking" : "unlocking"
      } the exam`,
    };
  }
}

export async function createNewExamsSchedule(exam_name: string) {
  try {
    const allExams = await prisma.examName.findMany();

    const newExams = await prisma.examName.create({
      data: {
        exam_name: exam_name,
        order: String(allExams.length + 1),
      },
    });
    revalidatePath("/exams-schedule");
    return {
      message: "The exam schedule has been created successfully",
      newExams,
    };
  } catch (error: any) {
    return { message: "An error occurred while creating the exam schedule" };
  }
}

export async function editExams(examNameOrder: any[]) {
  try {
    const updates = examNameOrder.map(
      ({ exam_name, exam_name_id, order, archived, selected }) =>
        prisma.examName.update({
          where: { exam_name_id },
          data: { order, exam_name, archived, selected },
        })
    );

    await prisma.$transaction(updates);

    revalidatePath("/exams-schedule");

    return { message: "Exams edited successfully" };
  } catch (error: any) {
    return { message: "An error occurred while editing exams" };
  }
}
