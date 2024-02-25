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
import React, { useEffect, useState } from "react";
import { FiPlusCircle } from "react-icons/fi";
import CreateNewStaffModal from "./CreateNewStaffModal";

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
        <ModalFooter>
          <Button color="danger" onPress={onClose}>
            Cancel
          </Button>
          <Button
            disabled={unmatchedInvigilatorsDetails.length === 0}
            color={
              unmatchedInvigilatorsDetails.length > 0 ? "default" : "primary"
            }
            onPress={handleSubmit}
          >
            Submit
          </Button>
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
    </Modal>
  );
}
