import UpcomingExamsTable from "@/components/tables/UpcomingExamsTable";
import { getUpcomingExamsSchedule } from "@/lib/actions/exams.action";

export default async function Dashboard() {
  const upcomingExams = await getUpcomingExamsSchedule();
  return (
    <div>
      <UpcomingExamsTable upcomingExams={upcomingExams} />
    </div>
  );
}
