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
import { Card, CardContent, Typography, Grid } from "@material-ui/core";
import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { AiOutlineClose, AiOutlineCheck } from "react-icons/ai";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import {
  createExamsSchedule,
  editExamsSchedule,
} from "@/lib/actions/exams.action";
import { toast } from "react-hot-toast";
import TextField from "@mui/material/TextField";

interface Exam {
  date: any;
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
  mutate: () => void;
}

interface EditableFieldProps {
  isEditing: boolean;
  value: string;
  onEdit: (newValue: string) => void;
  onToggleEdit: () => void;
  isMultiple?: boolean;
  isDate?: boolean;
}

type EditableFields =
  | "date"
  | "exam_code"
  | "start_time"
  | "end_time"
  | "venue"
  | "year";

const CreateNEditExamsModal = ({
  isOpen,
  onClose,
  selectedExam,
  mutate,
}: ViewNEditModalProps) => {
  const [editingFields, setEditingFields] = useState({
    date: selectedExam.exam_id === "" ? true : false,
    exam_code: selectedExam.exam_id === "" ? true : false,
    start_time: selectedExam.exam_id === "" ? true : false,
    end_time: selectedExam.exam_id === "" ? true : false,
    venue: selectedExam.exam_id === "" ? true : false,
    year: selectedExam.exam_id === "" ? true : false,
  });
  const [editedExams, setEditedExams] = useState(selectedExam);
  const [tempValues, setTempValues] = useState(selectedExam);
  const [isSaving, setIsSaving] = useState(false);

  const isDisabled = () => {
    if (selectedExam.exam_id !== "") {
      return JSON.stringify(editedExams) !== JSON.stringify(selectedExam);
    } else {
      for (const key in tempValues) {
        if (key !== "exam_id" && tempValues[key as keyof Exam] === "") {
          return false;
        }
      }
      return true;
    }
  };

  const getChangedValues = () => {
    const changes: Partial<Exam> = {};

    for (const key in editedExams) {
      if (
        key !== "exam_id" &&
        editedExams[key as keyof Exam] !== selectedExam[key as keyof Exam]
      ) {
        changes[key as keyof Exam] = editedExams[key as keyof Exam];
      }
    }

    return changes;
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (selectedExam.exam_id !== "") {
        const changes = getChangedValues();
        const response = await editExamsSchedule(selectedExam.exam_id, changes);
        if (
          response?.message ===
          "The exam schedule has been updated successfully"
        ) {
          toast.success(response.message);
          mutate();
          onClose();
        } else if (
          response?.message ===
          "An error occurred while updating the exam schedule."
        ) {
          toast.error(response.message);
        }
      } else {
        const response = await createExamsSchedule(
          selectedExam.exam_name_id,
          tempValues
        );
        if (
          response?.message ===
          "The exam schedule has been created successfully"
        ) {
          toast.success(response.message);
          mutate();
          onClose();
        } else if (
          response?.message ===
          "An error occurred while creating the exam schedule."
        ) {
          toast.error(response.message);
        }
      }
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const EditableField = ({
    isEditing,
    value,
    onEdit,
    onToggleEdit,
    isMultiple,
    isDate,
  }: EditableFieldProps) => {
    return (
      <Grid item xs={6} className="flex gap-4">
        <div className="flex flex-col gap-3">
          {isMultiple ? (
            value
              .split(",")
              .map((val, index) => (
                <TextField
                  key={val.trim() + index}
                  value={val.trim()}
                  variant="standard"
                />
              ))
          ) : isDate ? (
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  value={value && moment(new Date(value))}
                  className="w-[120px]"
                />
              </DemoContainer>
            </LocalizationProvider>
          ) : (
            <TextField
              key={value}
              value={value}
              className="w-[100px]"
              variant="standard"
            />
          )}
        </div>
      </Grid>
    );
  };

  const handleEdit = (field: EditableFields) => {
    setEditingFields({ ...editingFields, [field]: !editingFields[field] });
    if (editingFields[field]) {
      setEditedExams({ ...editedExams, [field]: tempValues[field] });
    } else {
      setTempValues({ ...tempValues, [field]: editedExams[field] });
    }
  };

  const editableFields = [
    { label: "Exam Code(s):", field: "exam_code", isMultiple: true },
    { label: "Date:", field: "date", isDate: true },
    { label: "Start Time:", field: "start_time" },
    { label: "End Time:", field: "end_time" },
    { label: "Venue(s):", field: "venue", isMultiple: true },
    { label: "Year:", field: "year" },
  ];

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        size="5xl"
        hideCloseButton={true}
        isOpen={isOpen}
        onOpenChange={onClose}
        // scrollBehavior="inside"
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
            Exams Details
          </ModalHeader>
          <ModalBody>
            <Card
              style={{
                margin: "1rem",
                padding: "1rem",
                maxHeight: "500px",
                overflow: "auto",
              }}
              className="custom-scrollbar"
            >
              <CardContent>
                <Grid container spacing={3}>
                  {editableFields.map(
                    ({ label, field, isMultiple, isDate }: any) => (
                      <>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">{label}</Typography>
                        </Grid>

                        <EditableField
                          key={field}
                          isEditing={
                            editingFields[field as keyof typeof editingFields]
                          }
                          value={tempValues[field as keyof typeof tempValues]}
                          onEdit={(newValue) =>
                            setTempValues({ ...tempValues, [field]: newValue })
                          }
                          onToggleEdit={() =>
                            handleEdit(field as keyof typeof editingFields)
                          }
                          isMultiple={isMultiple}
                          isDate={isDate}
                        />
                      </>
                    )
                  )}
                </Grid>
              </CardContent>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="danger" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color={!isDisabled() ? "default" : "primary"}
              disabled={!isDisabled() || isSaving}
              onClick={handleSubmit}
            >
              {isSaving ? (
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

export default CreateNEditExamsModal;
