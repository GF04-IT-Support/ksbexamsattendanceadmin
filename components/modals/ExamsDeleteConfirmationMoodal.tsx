// ConfirmationModal.jsx
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  ModalBody,
  Spinner,
} from "@nextui-org/react";
import React from "react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  confirmLabel: string;
  message: string;
};

const ExamsDeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  confirmLabel,
  message,
}: ConfirmationModalProps) => {
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
        },
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center justify-center">
          Confirmation
        </ModalHeader>
        <ModalBody>
          <p>{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} color="default">
            Cancel
          </Button>
          <Button onClick={onConfirm} color="danger">
            {isDeleting ? (
              <>
                <Spinner size="sm" color="default" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExamsDeleteConfirmationModal;
