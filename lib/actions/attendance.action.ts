"use server";

import prisma from "@/utils/prisma";

export async function fetchExamSessions(startDate: Date, endDate: Date) {
  endDate = endDate || startDate;
  try {
    const exams = await prisma.exam.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sessions: {
          include: {
            venue: true,
            assignments: {
              include: {
                staff: {
                  include: {
                    attendances: {
                      select: {
                        attendance_id: true,
                        attendance_status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const sessions = exams.filter((exam) => {
      if (exam.sessions.length === 0) {
        return false;
      }

      for (let session of exam.sessions) {
        if (session.assignments && session.assignments.length > 0) {
          return true;
        }
      }

      return false;
    });

    return sessions;
  } catch (error: any) {
    return {
      message: "An error occurred while fetching exam sessions.",
    };
  }
}

export async function takeAttendance(
  staffId: string,
  examSessionId: string,
  status: string
) {
  try {
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        staff_id: staffId,
        exam_session_id: examSessionId,
      },
    });

    let attendance;

    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: {
          attendance_id: existingAttendance.attendance_id,
        },
        data: {
          attendance_status: status,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          staff_id: staffId,
          exam_session_id: examSessionId,
          attendance_status: status,
        },
      });
    }

    return { message: "Attendance taken successfully" };
  } catch (error) {
    return {
      message: "An error occurred while taking attendance.",
    };
  }
}


