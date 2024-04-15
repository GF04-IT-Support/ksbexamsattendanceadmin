import StaffTabs from "@/components/tabs/StaffTabs";
import { getExamsNames } from "@/lib/actions/exams.action";
import React from "react";

export default async function StaffManagement() {
  const examsNames = await getExamsNames();

  return (
    <div>
      <StaffTabs examsNames={examsNames} />
    </div>
  );
}
