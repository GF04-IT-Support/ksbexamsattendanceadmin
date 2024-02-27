"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { Card, CardContent, Typography, Grid } from "@material-ui/core";
import { Select, MenuItem } from "@mui/material/";
import React, { useEffect, useRef, useState } from "react";
import { FiDownload, FiPlusCircle } from "react-icons/fi";
import CreateNewStaffModal from "./CreateNewStaffModal";
import * as XLSX from "xlsx";
import { FaFileAlt, FaFileUpload } from "react-icons/fa";
import ConfirmInvigilatorsModal from "./ConfirmInvigilatorsModal";
import toast, { Toaster } from "react-hot-toast";

type ConfirmationModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  scheduleData: any;
  setConfirmedData: React.Dispatch<React.SetStateAction<any>>;
  defaultStaffDetails: any;
};

export default function ScheduleConfirmationModal({
  isOpen,
  onConfirm,
  onClose,
  scheduleData,
  setConfirmedData,
  defaultStaffDetails,
}: ConfirmationModalProps) {
  const { matchedData, unmatchedData } = scheduleData;
  const [invigilatorsDetails, setInvigilatorsDetails] = useState(matchedData);
  const [duplicates, setDuplicates] = useState<Array<boolean>>([]);
  const [unmatchedInvigilatorsDetails, setUnmatchedInvigilatorsDetails] =
    useState(unmatchedData);
  const [selectedStaff, setSelectedStaff] = useState<Array<any>>(
    new Array(unmatchedData?.length).fill(null)
  );
  const [selectedUnmatchedIndex, setSelectedUnmatchedIndex] =
    useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffDetails, setStaffDetails] = useState(defaultStaffDetails);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tempValues, setTempValues] = useState([]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = event.target.value;
    let newInvigilatorsDetails = [...invigilatorsDetails];
    let staff = staffDetails.find((staff: any) => staff.staff_id === value);
    if (staff) {
      newInvigilatorsDetails[index].full_name = staff.staff_name;
      newInvigilatorsDetails[index].staff_id = staff.staff_id;
    }
    setInvigilatorsDetails(newInvigilatorsDetails);
  };

  useEffect(() => {
    const staffCounts = invigilatorsDetails.reduce((counts: any, data: any) => {
      counts[data.staff_id] = (counts[data.staff_id] || 0) + 1;
      return counts;
    }, {});

    const newDuplicates = invigilatorsDetails.map(
      (data: any) => staffCounts[data.staff_id] > 1
    );
    setDuplicates(newDuplicates);
  }, [invigilatorsDetails]);

  const handleUnmatchedChange = (
    eventOrStaffId: React.ChangeEvent<{ value: unknown }> | string,
    index: number
  ) => {
    let value: any;
    if (typeof eventOrStaffId === "string") {
      value = eventOrStaffId;
    } else {
      value = eventOrStaffId.target.value as string;
    }

    let staff = staffDetails.find((staff: any) => staff.staff_id === value);
    if (staff) {
      let newSelectedStaff = [...selectedStaff];
      newSelectedStaff[index] = {
        staff_id: staff.staff_id,
        full_name: staff.full_name || staff.staff_name,
        abbreviated_name: unmatchedInvigilatorsDetails[index].abbreviated_name,
        details: unmatchedInvigilatorsDetails[index].details,
      };
      setSelectedStaff(newSelectedStaff);
    }
  };

  const handleConfirmSelection = () => {
    let newInvigilatorsDetails = [...invigilatorsDetails, ...selectedStaff];
    setInvigilatorsDetails(newInvigilatorsDetails);
    setUnmatchedInvigilatorsDetails([]);
  };

  const isConfirmSelectionDisabled = () => {
    const nonNullSelectedStaff = selectedStaff.filter(
      (staff) => staff !== null
    );
    return nonNullSelectedStaff.length !== unmatchedInvigilatorsDetails.length;
  };

  const uniqueRoles: any = Array.from(
    new Set(staffDetails.map((staff: any) => staff.staff_role))
  );

  const handleCreateNewStaff = (index: number) => {
    setShowCreateModal(true);
    setSelectedUnmatchedIndex(index);
  };

  const handleSubmit = async () => {
    setConfirmedData(invigilatorsDetails);
    onClose();
    onConfirm();
  };

  const generateExcel = () => {
    if (unmatchedInvigilatorsDetails.length !== 0) {
      return;
    }
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        "Staff ID",
        "Abbreviated Name",
        "Full Name",
        "Date",
        "Start Time",
        "End Time",
        "Course Code",
        "Venue",
      ],
    ]);

    invigilatorsDetails.forEach((invigilator: any) => {
      const { staff_id, abbreviated_name, full_name, details } = invigilator;
      details.forEach((detail: any, index: any) => {
        const {
          Date,
          "Start Time": startTime,
          "End Time": endTime,
          "Course Code": courseCodes,
          Venue,
        } = detail;

        const courseCode = Array.isArray(courseCodes)
          ? courseCodes.join(", ")
          : courseCodes;
        const row =
          index === 0
            ? [
                staff_id,
                abbreviated_name,
                full_name,
                Date,
                startTime,
                endTime,
                courseCode,
                Venue,
              ]
            : ["", "", "", Date, startTime, endTime, courseCode, Venue];
        XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: -1 });
      });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Invigilator Schedule");
    XLSX.writeFile(workbook, "invigilator_schedule.xlsx");
  };

  const handleFileUpload = (event: any) => {
    const uploadedFile = event.target.files[0];

    if (uploadedFile) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const data = event.target?.result;
        processUploadedFile(data);
      };

      reader.readAsBinaryString(uploadedFile);
    }
  };

  const processUploadedFile = (data: any) => {
    const workbook = XLSX.read(data, { type: "binary" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const extractedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const processedData = changeExcelData(extractedData);
    if (processedData.error || processedData.length === 0) {
      toast.error("Wrong excel file uploaded");
    } else {
      setShowConfirmModal(true);
      setTempValues(processedData);
    }
  };

  const changeExcelData = (extractedData: any) => {
    try {
      if (!extractedData || extractedData.length === 0) {
        return { error: "No data found in the uploaded Excel file." };
      }

      extractedData.shift();

      const processedData: any = [];

      extractedData.forEach((row: any, index: number) => {
        const staff_id = row[0];
        const abbreviated_name = row[1];
        const full_name = row[2];
        const date = row[3];
        const start_time = row[4];
        const end_time = row[5];
        const course_code = row[6];
        const venue = row[7];

        if (
          !staff_id ||
          !full_name ||
          !date ||
          !start_time ||
          !end_time ||
          !course_code ||
          !venue
        ) {
          return {
            error: `Row ${index + 1}: One or more required fields are missing.`,
          };
        }

        if (staff_id === "" && full_name === "" && processedData.length > 0) {
          const lastIndex = processedData.length - 1;
          const lastRecord = processedData[lastIndex];

          lastRecord.details.push({
            Date: date,
            "Start Time": start_time,
            "End Time": end_time,
            Venue: venue,
          });
        } else {
          processedData.push({
            staff_id: staff_id,
            full_name: full_name,
            abbreviated_name: abbreviated_name,
            details: [
              {
                "Course Code": course_code,
                Date: date,
                "Start Time": start_time,
                "End Time": end_time,
                Venue: venue,
              },
            ],
          });
        }
      });

      return processedData;
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const handleConfirmSchedule = () => {
    setInvigilatorsDetails(tempValues);
    toast.success("New schedule created successfully");
    setTempValues([]);
    setShowConfirmModal(false);
  };

  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      onOpenChange={onClose}
      isDismissable={false}
      size="3xl"
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
      <Toaster position="top-center" />
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center justify-center">
          Confirm Invigilators Name
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
              <div className="text-xl font-bold mb-3 flex justify-center items-center">
                Matched Invigilators
              </div>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <div className="text-lg font-semibold">Abbreviated Name</div>
                </Grid>
                <Grid item xs={6}>
                  <div className="text-lg font-semibold flex items-center justify-center">
                    Invigilator
                  </div>
                </Grid>
                {invigilatorsDetails.map((data: any, index: number) => {
                  return (
                    <>
                      <Grid item xs={6}>
                        <Typography color="textSecondary">
                          {data.abbreviated_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          color="textSecondary"
                          className="flex items-center justify-center"
                        >
                          <Select
                            aria-label="Confirm Staff"
                            variant="standard"
                            value={data.staff_id}
                            fullWidth
                            onChange={(e: any) => handleChange(e, index)}
                          >
                            {staffDetails.map((staff: any) => (
                              <MenuItem
                                key={staff.staff_id}
                                value={staff.staff_id}
                              >
                                {staff.staff_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </Typography>
                        {duplicates[index] && (
                          <p className="text-xs text-red-500 mt-1">
                            Duplicated Invigilator
                          </p>
                        )}
                      </Grid>
                    </>
                  );
                })}
              </Grid>

              {unmatchedInvigilatorsDetails.length > 0 && (
                <div className="py-3 pt-5">
                  <div className="text-xl font-bold mb-3 flex justify-center items-center">
                    Unmatched Invigilators
                  </div>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <div
                        className="text-lg font-semibold"
                        color="textPrimary"
                      >
                        Abbreviated Name
                      </div>
                    </Grid>
                    <Grid item xs={6}>
                      <div className="flex items-center justify-center text-lg font-semibold">
                        Invigilator
                      </div>
                    </Grid>
                    {unmatchedInvigilatorsDetails.map(
                      (data: any, index: number) => (
                        <>
                          <Grid item xs={6}>
                            <Typography color="textSecondary">
                              {data.abbreviated_name}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              color="textSecondary"
                              className="flex items-center gap-2 justify-center"
                            >
                              <Select
                                aria-label="Confirm Staff"
                                variant="standard"
                                value={
                                  selectedStaff[index]?.staff_id || "default"
                                }
                                fullWidth
                                onChange={(e: any) =>
                                  handleUnmatchedChange(e, index)
                                }
                              >
                                <MenuItem value="default" disabled>
                                  Select Invigilator
                                </MenuItem>
                                {staffDetails.map((staff: any) => (
                                  <MenuItem
                                    key={staff.staff_id}
                                    value={staff.staff_id}
                                  >
                                    {staff.staff_name}
                                  </MenuItem>
                                ))}
                              </Select>

                              <Tooltip content="Add Invigilator">
                                <FiPlusCircle
                                  size={24}
                                  className="cursor-pointer hover:opacity-60"
                                  onClick={() => handleCreateNewStaff(index)}
                                />
                              </Tooltip>
                            </Typography>
                          </Grid>
                        </>
                      )
                    )}
                  </Grid>
                  <div className="flex justify-center items-center my-4">
                    <Button
                      color={
                        isConfirmSelectionDisabled() ? "default" : "primary"
                      }
                      disabled={isConfirmSelectionDisabled()}
                      onClick={handleConfirmSelection}
                    >
                      Match Invigilators
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              startContent={<FiDownload />}
              disabled={unmatchedInvigilatorsDetails.length === 0}
              color={
                unmatchedInvigilatorsDetails.length > 0 ? "default" : "success"
              }
              onPress={generateExcel}
            >
              <p className="max-sm:hidden">Download Schedule</p>
            </Button>
            <Button
              disabled={unmatchedInvigilatorsDetails.length === 0}
              color={
                unmatchedInvigilatorsDetails.length > 0
                  ? "default"
                  : "secondary"
              }
              startContent={<FaFileUpload />}
            >
              <label style={{ cursor: "pointer" }}>
                <p className="max-sm:hidden">Upload Schedule</p>
                <input
                  type="file"
                  style={{ display: "none" }}
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={unmatchedInvigilatorsDetails.length > 0}
                />
              </label>
            </Button>
          </div>

          <div className="flex gap-2">
            <Button color="danger" onPress={onClose}>
              Cancel
            </Button>
            <Button
              disabled={unmatchedInvigilatorsDetails.length > 0}
              color={
                unmatchedInvigilatorsDetails.length > 0 ? "default" : "primary"
              }
              onPress={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
      {showCreateModal && (
        <CreateNewStaffModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          uniqueRoles={uniqueRoles}
          handleUnmatchedChange={handleUnmatchedChange}
          staff_name={
            unmatchedInvigilatorsDetails[selectedUnmatchedIndex]
              ?.abbreviated_name
          }
          setStaffDetails={setStaffDetails}
          selectedUnmatchedIndex={selectedUnmatchedIndex}
        />
      )}

      {showConfirmModal && (
        <ConfirmInvigilatorsModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setTempValues([]);
          }}
          message="Are you sure you want to set this as the new invigilators schedule?"
          onConfirm={handleConfirmSchedule}
          confirmLabel="Confirm"
        />
      )}
    </Modal>
  );
}
