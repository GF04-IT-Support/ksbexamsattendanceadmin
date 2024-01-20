"use client";

import React from "react";
import { Accordion, AccordionItem, Card, CardBody } from "@nextui-org/react";
import StaffDetailsTable from "../tables/StaffDetailsTable";
import ExamsScheduleTable from "../tables/ExamsScheduleTable";

type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type StaffProps = {
  id: string;
  label: string;
  examsNames: ExamName[];
};

export default function Invigilators({ id, label, examsNames }: StaffProps) {
  return (
    <>
      <Accordion
        className="mb-4"
        defaultExpandedKeys={["2"]}
        selectionMode="multiple"
      >
        <AccordionItem
          key="1"
          aria-label="Staff Details"
          subtitle="View Invigilators Details"
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
          subtitle="Assign invigilators to exams"
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
    </>
  );
}
