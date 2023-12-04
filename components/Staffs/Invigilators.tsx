"use client";

import React from 'react';
import { Accordion, AccordionItem, Card, CardBody, CardHeader, Chip, Modal, ModalContent, useDisclosure } from '@nextui-org/react';
import UploadForm from '../forms/UploadForm';
import StaffDetailsTable from '../tables/StaffDetailsTable';
import useSWR from 'swr';
import { getExamsNames } from '@/lib/actions/exams.action';
import ExamsScheduleTable from '../tables/ExamsScheduleTable';

type StaffProps = {
  id: string;
  label: string;
};

export default function Invigilators({ id, label }: StaffProps) {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  const { data: examsNames = [], mutate, isLoading } = useSWR(
    `examsNames`,
    () => getExamsNames(),
    // { revalidateOnMount: false, revalidateOnFocus: false }
  );
  return (
    <>
    <Accordion className='mb-4' defaultExpandedKeys={["1"]} selectionMode='multiple'>
      <AccordionItem key="1" aria-label="Staff Details" subtitle="View Invigilators Details" title="Staff Details">
        <Card>
          <CardBody>
        <StaffDetailsTable id={id} label={label} />
          </CardBody>
        </Card>
      </AccordionItem>
      <AccordionItem key="2" aria-label="Exams Assignment" subtitle="Assign invigilators to exams" title="Exams Assignment">
        <Card>
          <CardHeader className='flex justify-center items-center'>
            <Chip>Assign Invigilators manually below or click <p onClick={onOpen} className='inline-block cursor-pointer text-blue hover:underline'>here</p> to upload invigilators timetable</Chip>
          </CardHeader>
          <CardBody>
            <ExamsScheduleTable examNames={examsNames} role={id}/>
          </CardBody>
        </Card>
      </AccordionItem>
    </Accordion>

    <Modal size='xl' className='p-4' isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
            <UploadForm uploadType='invigilators' onClose={onClose}/>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}