"use client";

import React, { useEffect } from "react";
import { Chip, Modal, ModalContent, useDisclosure } from "@nextui-org/react";
import UploadForm from "../forms/UploadForm";

export default function ExamsUploadModal({ details, setDetails }: any) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const openModal = details?.openModal;

  useEffect(() => {
    if (openModal) {
      onOpen();
    }
  }, [openModal]);

  const handleCancel = () => {
    setDetails({});
    onClose();
  };
  return (
    <div>
      <div className="flex justify-center items-center mb-6">
        <Chip>
          Click{" "}
          <p
            onClick={onOpen}
            className="inline-block cursor-pointer text-blue hover:underline"
          >
            here
          </p>{" "}
          to upload exams schedule
        </Chip>
      </div>

      <Modal
        size="xl"
        className="p-4"
        isOpen={isOpen}
        onClose={handleCancel}
        isDismissable={false}
      >
        <ModalContent>
          {() => (
            <>
              <UploadForm
                uploadType="exams"
                onClose={handleCancel}
                selectedExams={details?.selectedExams}
              />
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
