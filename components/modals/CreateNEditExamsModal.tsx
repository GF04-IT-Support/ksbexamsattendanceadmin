"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  TimeInput,
} from "@nextui-org/react";
import { Card, CardContent, Typography, Grid } from "@material-ui/core";
import { useState } from "react";
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

const CreateNEditExamsModal = ({
  isOpen,
  onClose,
  selectedExam,
  mutate,
}: ViewNEditModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [tempValues, setTempValues] = useState(selectedExam);

  const isDisabled = () => {
    if (selectedExam.exam_id !== "") {
      return JSON.stringify(tempValues) !== JSON.stringify(selectedExam);
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

    for (const key in tempValues) {
      if (
        key !== "exam_id" &&
        tempValues[key as keyof Exam] !== selectedExam[key as keyof Exam]
      ) {
        changes[key as keyof Exam] = tempValues[key as keyof Exam];
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

  const editableFields = [
    { label: "Exam Code(s):", field: "exam_code", isMultiple: true },
    { label: "Date:", field: "date", isDate: true },
    { label: "Start Time:", field: "start_time", isTime: true },
    { label: "End Time:", field: "end_time", isTime: true },
    { label: "Venue(s):", field: "venue", isMultiple: true },
    { label: "Year:", field: "year" },
  ];

  function transformTime(time: any) {
    const { hour, minute } = time;

    const period = hour >= 12 ? "PM" : "AM";

    const hour12 = hour > 12 ? hour - 12 : hour;

    const hourString = hour12.toString().padStart(2, "0");
    const minuteString = minute.toString().padStart(2, "0");

    return `${hourString}:${minuteString} ${period}`;
  }

  function reverseTransformTime(timeString: any) {
    const regex = /(\d+:\d+)(am|pm)/i;
    const match = regex.exec(timeString);

    if (match) {
      const [time, period] = [match[1], match[2]];
      const [hour12, minute] = time.split(":");

      let hour = parseInt(hour12, 10);
      if (period === "pm" && hour < 12) {
        hour += 12;
      } else if (period === "am" && hour === 12) {
        hour = 0;
      }

      return {
        hour,
        minute: parseInt(minute, 10),
        second: 0,
        millisecond: 0,
      };
    }

    // Handle the case when the timeString doesn't match the expected format
    return null;
  }

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
            <Card
              style={{
                margin: "1rem",
                padding: "1rem",
                maxHeight: "500px",
                overflow: "auto",
              }}
              className="custom-scrollbar sm:p-4 sm:m-4"
            >
              <CardContent>
                <Grid container spacing={3}>
                  {editableFields.map(
                    ({ label, field, isMultiple, isDate, isTime }: any) => (
                      <>
                        <Grid item xs={6}>
                          <Typography color="textSecondary">{label}</Typography>
                        </Grid>

                        <Grid item xs={6} className="flex gap-4">
                          <div className="flex flex-col gap-3">
                            {isMultiple ? (
                              tempValues[field as keyof typeof tempValues]
                                .split(",")
                                .map((val: string, index: number) => (
                                  <TextField
                                    key={index}
                                    value={val}
                                    onChange={(e) => {
                                      const target =
                                        e.target as HTMLInputElement;
                                      const newValues = [
                                        ...tempValues[
                                          field as keyof typeof tempValues
                                        ].split(","),
                                      ];
                                      newValues[index] = target.value;
                                      setTempValues({
                                        ...tempValues,
                                        [field]: newValues.join(","),
                                      });
                                    }}
                                    onKeyDown={(e) => {
                                      const target =
                                        e.target as HTMLInputElement;
                                      if (
                                        e.key === "Backspace" &&
                                        target.value === "" &&
                                        index > 0
                                      ) {
                                        const newValues = [
                                          ...tempValues[
                                            field as keyof typeof tempValues
                                          ].split(","),
                                        ];
                                        newValues.splice(index, 1);
                                        setTempValues({
                                          ...tempValues,
                                          [field]: newValues.join(","),
                                        });
                                      }
                                    }}
                                    variant="standard"
                                  />
                                ))
                            ) : isDate ? (
                              <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DemoContainer components={["DatePicker"]}>
                                  <DatePicker
                                    value={
                                      tempValues[
                                        field as keyof typeof tempValues
                                      ] &&
                                      moment(
                                        new Date(
                                          tempValues[
                                            field as keyof typeof tempValues
                                          ]
                                        )
                                      )
                                    }
                                    onChange={(date) => {
                                      if (date) {
                                        const newDate = date
                                          .toISOString()
                                          .split("T")[0];
                                        setTempValues({
                                          ...tempValues,
                                          [field]: newDate,
                                        });
                                      }
                                    }}
                                    className="w-[120px]"
                                  />
                                </DemoContainer>
                              </LocalizationProvider>
                            ) : isTime ? (
                              <TimeInput
                                // @ts-ignore
                                value={
                                  reverseTransformTime(
                                    tempValues[field as keyof typeof tempValues]
                                  ) || { hour: 0, minute: 0 }
                                }
                                variant="underlined"
                                onChange={(e) =>
                                  setTempValues({
                                    ...tempValues,
                                    [field]: transformTime(e)
                                      .replace(" ", "")
                                      .toLowerCase(),
                                  })
                                }
                                aria-label="Time"
                              />
                            ) : (
                              <TextField
                                aria-label="Text"
                                value={
                                  tempValues[field as keyof typeof tempValues]
                                }
                                onChange={(e) =>
                                  setTempValues({
                                    ...tempValues,
                                    [field]: e.target.value,
                                  })
                                }
                                className="w-[100px]"
                                variant="standard"
                              />
                            )}
                          </div>
                        </Grid>
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
