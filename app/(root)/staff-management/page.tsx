import StaffTabs from '@/components/tabs/StaffTabs'
import { getExamsNames } from '@/lib/actions/exams.action';
import React from 'react';

export default async function StaffManagement() {
  const examsNames = await getExamsNames()
 
  return (
    <div className='w-full'>
      <StaffTabs examsNames={examsNames}/>
    </div>
  )
}


