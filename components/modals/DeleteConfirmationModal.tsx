// ConfirmationModal.tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@nextui-org/react";

type ConfirmationModalProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting: boolean;
};

export default function DeleteConfirmationModal({ isOpen, onConfirm, onClose, isDeleting }: ConfirmationModalProps) {
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
                <ModalHeader className="flex flex-col gap-1 items-center justify-center">Confirm Delete</ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to delete this staff details?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="default" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="danger" onPress={onConfirm}>
                        {isDeleting ? (
                            <>
                            <Spinner size="sm" color='default'/>
                            Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}