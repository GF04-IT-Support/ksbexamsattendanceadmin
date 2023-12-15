import React from "react";
import StaffDetailsTable from "../tables/StaffDetailsTable";
import { Accordion, AccordionItem, Card, CardBody } from "@nextui-org/react";
import ExamsScheduleTable from "../tables/ExamsScheduleTable1";

type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type StaffProps = {
  id: string;
  label: string;
  examsNames: ExamName[];
};

export default function Security({ id, label, examsNames }: StaffProps) {
  return (
    <Accordion defaultExpandedKeys={["2"]} selectionMode="multiple">
      <AccordionItem
        key="1"
        aria-label="Staff Details"
        subtitle="View Security Details"
        title="Staff Details"
      >
        <Card>
          <CardBody>
            <StaffDetailsTable id={id} label={label} />
          </CardBody>
        </Card>
      </AccordionItem>
      <AccordionItem
        key="2"
        aria-label="Exams Assignment"
        subtitle="Assign security to exams"
        title="Exams Assignment"
      >
        <Card>
          <CardBody>
            <ExamsScheduleTable
              examsNames={examsNames}
              role={id}
              label={label}
            />
          </CardBody>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
