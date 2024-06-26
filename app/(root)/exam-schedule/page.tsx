import ExamsTimetable from "@/components/tables/ExamsTimetable";
import { getExamsNames } from "@/lib/actions/exams.action";
import React from "react";

export const dynamic = "force-dynamic";

export default async function ExamSchedule() {
  const examsNames = await getExamsNames();

  return (
    <>
      <ExamsTimetable examNames={examsNames} />
    </>
  );
}
