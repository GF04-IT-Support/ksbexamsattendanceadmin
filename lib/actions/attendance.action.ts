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
        exam_name: true,
        sessions: {
          include: {
            venue: true,
            assignments: {
              include: {
                staff: {
                  include: {
                    attendances: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const filteredExams = exams.map((exam) => ({
      ...exam,
      sessions: exam.sessions.map((session) => ({
        ...session,
        assignments: session.assignments.map((assignment) => ({
          ...assignment,
          staff: {
            ...assignment.staff,
            attendances: assignment.staff.attendances.filter(
              (attendance) =>
                attendance.exam_session_id === session.exam_session_id
            ),
          },
        })),
      })),
    }));

    const sessions = filteredExams.map((exam) => ({
      ...exam,
      sessions: exam.sessions.filter((session) => {
        if (!session.assignments || session.assignments.length === 0) {
          return false;
        }

        const examVenues = exam.venue
          ? exam.venue.split(",").map((venue) => venue.trim())
          : [];
        return session.assignments.some(() => {
          const assignmentVenue = session.venue.name;
          return examVenues.includes(assignmentVenue);
        });
      }),
    }));

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
  status: string | null
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
