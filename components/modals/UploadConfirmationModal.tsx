// ConfirmationModal.tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";

type ConfirmationModalProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export default function UploadConfirmationModal({ isOpen, onConfirm, onClose }: ConfirmationModalProps) {
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
                <ModalHeader className="flex flex-col gap-1">Confirm Upload</ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to upload this schedule?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={onConfirm}>
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}