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
import { useEffect, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { AiOutlineClose, AiOutlineCheck } from "react-icons/ai";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import { editExamsSchedule } from "@/lib/actions/exams.action";
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

const ViewNEditModal = ({
  isOpen,
  onClose,
  selectedExam,
  mutate,
}: ViewNEditModalProps) => {
  const [editingFields, setEditingFields] = useState({
    date: false,
    exam_code: false,
    start_time: false,
    end_time: false,
    venue: false,
    year: false,
  });
  const [editedExams, setEditedExams] = useState(selectedExam);
  const [tempValues, setTempValues] = useState(selectedExam);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = () => {
    return JSON.stringify(editedExams) !== JSON.stringify(selectedExam);
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
    const changes = getChangedValues();
    setIsSaving(true);
    try {
      const response = await editExamsSchedule(selectedExam.exam_id, changes);
      if (
        response?.message === "The exam schedule has been updated successfully!"
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
    if (isMultiple) {
      return (
        <Grid item xs={6} className="flex gap-4">
          <div className="flex flex-col gap-3">
            {isEditing
              ? value.split(",").map((val, index) => (
                  <TextField
                    key={index}
                    value={val.trim()}
                    onChange={(e) => {
                      const newValues = [...value.split(",")];
                      newValues[index] = e.target.value;
                      onEdit(newValues.join(","));
                    }}
                    variant="standard"
                  />
                ))
              : value.split(",").map((val, index) => (
                  <Typography key={index} color="textPrimary">
                    {val.trim()}
                  </Typography>
                ))}
          </div>

          {isEditing ? (
            <div className="flex gap-5 items-center">
              <AiOutlineClose
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
              <AiOutlineCheck
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
            </div>
          ) : (
            <FiEdit2
              className="cursor-pointer hover:opacity-60"
              onClick={onToggleEdit}
            />
          )}
        </Grid>
      );
    } else if (isDate) {
      return (
        <Grid item xs={6} className="flex gap-4">
          {isEditing ? (
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  value={value && moment(new Date(value))}
                  onChange={(date) => {
                    if (date) {
                      const newDate = date.toISOString().split("T")[0];
                      onEdit(newDate);
                    }
                  }}
                  className="w-[120px]"
                />
              </DemoContainer>
            </LocalizationProvider>
          ) : (
            <Typography color="textPrimary">
              {new Date(value).toLocaleDateString()}
            </Typography>
          )}

          {isEditing ? (
            <div className="flex gap-5 mt-4 items-center">
              <AiOutlineClose
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
              <AiOutlineCheck
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
            </div>
          ) : (
            <FiEdit2
              className="cursor-pointer hover:opacity-60"
              onClick={onToggleEdit}
            />
          )}
        </Grid>
      );
    } else {
      return (
        <Grid item xs={6} className="flex gap-4">
          {isEditing ? (
            <TextField
              value={value}
              onChange={(e) => {
                onEdit(e.target.value);
              }}
              className="w-[100px]"
              variant="standard"
            />
          ) : (
            <Typography color="textPrimary">{value}</Typography>
          )}

          {isEditing ? (
            <div className="flex gap-5 items-center">
              <AiOutlineClose
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
              <AiOutlineCheck
                className="cursor-pointer hover:opacity-60"
                onClick={onToggleEdit}
              />
            </div>
          ) : (
            <FiEdit2
              className="cursor-pointer hover:opacity-60"
              onClick={onToggleEdit}
            />
          )}
        </Grid>
      );
    }
  };
  const handleEdit = (field: EditableFields) => {
    setEditingFields({ ...editingFields, [field]: !editingFields[field] });
    if (editingFields[field]) {
      setEditedExams({ ...editedExams, [field]: tempValues[field] });
    } else {
      setTempValues({ ...tempValues, [field]: editedExams[field] });
    }
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        size="5xl"
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
            Exams Details
          </ModalHeader>
          <ModalBody>
            <Card style={{ margin: "1rem", padding: "1rem" }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary">Exam Code(s):</Typography>
                  </Grid>
                  <EditableField
                    isEditing={editingFields.exam_code}
                    value={tempValues.exam_code}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, exam_code: newValue })
                    }
                    onToggleEdit={() => handleEdit("exam_code")}
                    isMultiple
                  />

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Date:</Typography>
                  </Grid>

                  <EditableField
                    isEditing={editingFields.date}
                    value={tempValues.date}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, date: newValue })
                    }
                    onToggleEdit={() => handleEdit("date")}
                    isDate
                  />

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Start Time:</Typography>
                  </Grid>

                  <EditableField
                    isEditing={editingFields.start_time}
                    value={tempValues.start_time}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, start_time: newValue })
                    }
                    onToggleEdit={() => handleEdit("start_time")}
                  />

                  <Grid item xs={6}>
                    <Typography color="textSecondary">End Time:</Typography>
                  </Grid>

                  <EditableField
                    isEditing={editingFields.end_time}
                    value={tempValues.end_time}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, end_time: newValue })
                    }
                    onToggleEdit={() => handleEdit("end_time")}
                  />

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Venue(s):</Typography>
                  </Grid>

                  <EditableField
                    isEditing={editingFields.venue}
                    value={tempValues.venue}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, venue: newValue })
                    }
                    onToggleEdit={() => handleEdit("venue")}
                    isMultiple
                  />

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Year:</Typography>
                  </Grid>

                  <EditableField
                    isEditing={editingFields.year}
                    value={tempValues.year}
                    onEdit={(newValue) =>
                      setTempValues({ ...tempValues, year: newValue })
                    }
                    onToggleEdit={() => handleEdit("year")}
                  />
                </Grid>
              </CardContent>
            </Card>
          </ModalBody>

          <ModalFooter>
            <Button color="danger" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color={!hasChanges() ? "default" : "primary"}
              disabled={!hasChanges() || isSaving}
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

export default ViewNEditModal;
