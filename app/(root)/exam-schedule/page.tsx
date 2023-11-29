import UploadForm from '@/components/forms/UploadForm';
import ExamsTimetable from '@/components/tables/ExamsTimetable';
import { getExamsNames } from '@/lib/actions/exams.action';
import React from 'react'

export default async function ExamSchedule() {
    const examsNames = await getExamsNames();
   
  return (
    <div>
      <UploadForm uploadType='exams'/>
      <div>
        <h1>Exam Schedule</h1>
        <ExamsTimetable  examNames={examsNames}/>
      </div>
    </div>
  )
}

