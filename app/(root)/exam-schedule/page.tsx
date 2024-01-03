import ExamsUploadModal from "@/components/modals/ExamsUploadModal";
import ExamsTimetable from "@/components/tables/ExamsTimetable";
import { getExamsNames } from "@/lib/actions/exams.action";
import React from "react";

export default async function ExamSchedule() {
  const examsNames = await getExamsNames();

  return (
    <div>
      <ExamsTimetable examNames={examsNames} />
    </div>
  );
}
