"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Card, CardContent, Typography, Grid } from "@material-ui/core";
import TextField from "@mui/material/TextField";
import { createNewExamsSchedule } from "@/lib/actions/exams.action";

type CreateNewExamsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  setExamsDetails: (value: any) => void;
};

const CreateNewExamsModal = ({
  isOpen,
  onClose,
  setExamsDetails,
}: CreateNewExamsModalProps) => {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateExams = async () => {
    try {
      setIsCreating(true);
      const response = await createNewExamsSchedule(name);
      if (
        response?.message === "The exam schedule has been created successfully"
      ) {
        toast.success(response.message);
        setExamsDetails((prev: any) => [response.newExams, ...prev]);
      } else {
        toast.error(response.message);
      }
      setIsCreating(false);
      onClose();
    } catch (error) {
      setIsCreating(false);
    } finally {
      setIsCreating(false);
    }
  };

  const isDisabled = () => {
    if (name === "") return true;
    return false;
  };

  return (
    <>
      <Toaster position="top-center" />
      <Modal
        backdrop="blur"
        isDismissable={false}
        size="2xl"
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
          <ModalHeader className="flex flex-col gap-1">
            Create New Exams
          </ModalHeader>
          <ModalBody>
            <Card className="sm:p-4 sm:m-4">
              <CardContent>
                <Grid container alignItems="center" spacing={4}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary">Exam Name</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      label="Enter Exam Name"
                      variant="standard"
                      type="email"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="danger" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color={isDisabled() ? "default" : "primary"}
              disabled={isDisabled() || isCreating}
              onClick={handleCreateExams}
            >
              {isCreating ? (
                <>
                  <Spinner size="sm" color="default" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateNewExamsModal;
