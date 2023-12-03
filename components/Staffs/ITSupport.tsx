import React from 'react'
import StaffDetailsTable from '../tables/StaffDetailsTable'
import { Accordion, AccordionItem, Card, CardBody } from '@nextui-org/react';
import ExamsScheduleTable from '../tables/ExamsScheduleTable';

type StaffProps = {
  id: string;
  label: string;
};

export default function ITSupport({id, label}: StaffProps) {
  return (
    <Accordion defaultExpandedKeys={["1"]} selectionMode='multiple'>
      <AccordionItem key="1" aria-label="Staff Details" subtitle="View IT Support Details" title="Staff Details">
        <Card>
          <CardBody>
        <StaffDetailsTable id={id} label={label} />
          </CardBody>
        </Card>
      </AccordionItem>
      <AccordionItem key="2" aria-label="Exams Assignment" subtitle="Assign IT Support to exams" title="Exams Assignment">
        <Card>
          <CardBody>
            <ExamsScheduleTable />
          </CardBody>
        </Card>
      </AccordionItem>
    </Accordion>
  )
}
