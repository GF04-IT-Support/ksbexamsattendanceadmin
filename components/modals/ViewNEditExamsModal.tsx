"use client"

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input } from "@nextui-org/react";
import { useState } from "react";

interface Exam {
  date: Date;
  end_time: string;
  exam_code: string;
  exam_id: string;
  exam_name_id: string;
  start_time: string;
  venue: string;
  year: string;
}

interface ViewNEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: Exam; 
}

const ViewNEditModal  = ({ isOpen, onClose, selectedExam }: ViewNEditModalProps) => {
     const { exam_id, exam_code, exam_name_id, date, start_time, end_time, venue, year } = selectedExam;

    return (
        <Modal 
            backdrop="opaque" 
            isOpen={isOpen} 
            onOpenChange={onClose}
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            duration: 0.3,
                            ease: "easeOut",
                        },
                    },
                    exit: {
                        y: -20,
                        opacity: 0,
                        transition: {
                            duration: 0.2,
                            ease: "easeIn",
                        },
                    },
                }
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Exams Details</ModalHeader>
                <ModalBody>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ViewNEditModal;