import ExamsUploadModal from "@/components/modals/ExamsUploadModal";
import ExamsTimetable from "@/components/tables/ExamsTimetable";
import { getExamsNames } from "@/lib/actions/exams.action";
import { fetchStaffDetails } from "@/lib/actions/staff.action";
import { useInvigilatorsStore } from "@/zustand/store";
import React from "react";

export default async function ExamSchedule() {
  const examsNames = await getExamsNames();
  const staffDetails = await fetchStaffDetails("invigilators");

  return (
    <div>
      <ExamsUploadModal />
      <ExamsTimetable examNames={examsNames} />
    </div>
  );
}
