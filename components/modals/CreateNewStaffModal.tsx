"use client";

import React, { useState } from "react";
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
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { createNewStaff } from "@/lib/actions/staff.action";
import toast, { Toaster } from "react-hot-toast";

type StaffDetails = {
  staff_name: string;
  staff_role: string;
  department: string;
};

type CreateNewStaffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mutate?: () => void;
  uniqueRoles: string[];
  staff_name?: string;
  handleUnmatchedChange?: (event: any, index: number) => void;
  setStaffDetails?: React.Dispatch<React.SetStateAction<any>>;
  selectedUnmatchedIndex?: any;
};

export default function CreateNewStaffModal({
  isOpen,
  onClose,
  mutate,
  uniqueRoles,
  handleUnmatchedChange,
  staff_name,
  setStaffDetails,
  selectedUnmatchedIndex,
}: CreateNewStaffModalProps) {
  const [newStaffDetails, setNewStaffDetails] = useState<StaffDetails>({
    staff_name: staff_name || "",
    staff_role: "0",
    department: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const response: any = await createNewStaff(newStaffDetails);

      if (response.message === "Staff created successfully") {
        if (
          typeof staff_name === "string" &&
          typeof setStaffDetails === "function" &&
          typeof handleUnmatchedChange === "function" &&
          selectedUnmatchedIndex !== undefined
        ) {
          setStaffDetails((prev: any) => {
            const sortedData = [...prev, response?.data].sort((a, b) => {
              const aName = a.abbreviated_name || a.staff_name.toLowerCase();
              const bName = b.abbreviated_name || b.staff_name.toLowerCase();
              return aName.localeCompare(bName, undefined, {
                numeric: true,
                sensitivity: "base",
              });
            });
            return sortedData;
          });
          handleUnmatchedChange(
            response?.data.staff_id,
            selectedUnmatchedIndex
          );
          onClose();
        } else {
          toast.success("Staff created successfully");
          if (typeof mutate === "function") {
            mutate();
          }
          onClose();
        }
      } else if (
        response.message === "An error occurred while creating the staff."
      ) {
        toast.error(response.message);
        onClose();
      }
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      Object.values(newStaffDetails).every((value) => value !== "") &&
      newStaffDetails.staff_role !== "0"
    );
  };

  return (
    <>
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
            Create New Staff
          </ModalHeader>
          <ModalBody>
            <Card className="sm:p-4 sm:m-4">
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary">Name:</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      label="Enter Name"
                      value={newStaffDetails.staff_name}
                      onChange={(e) =>
                        setNewStaffDetails({
                          ...newStaffDetails,
                          staff_name: e.target.value,
                        })
                      }
                      variant="standard"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Role:</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Select
                      variant="standard"
                      label="Select Role"
                      className={`w-[200px] ${
                        newStaffDetails.staff_role === "0"
                          ? "text-gray-500"
                          : ""
                      }`}
                      value={newStaffDetails.staff_role}
                      defaultValue="0"
                      onChange={(e) =>
                        setNewStaffDetails({
                          ...newStaffDetails,
                          staff_role: e.target.value as string,
                        })
                      }
                    >
                      <MenuItem value={0} disabled>
                        Select Role
                      </MenuItem>
                      {uniqueRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography color="textSecondary">Department:</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      variant="standard"
                      label="Enter Department"
                      value={newStaffDetails.department}
                      onChange={(e) =>
                        setNewStaffDetails({
                          ...newStaffDetails,
                          department: e.target.value,
                        })
                      }
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
              color={!isFormValid() ? "default" : "primary"}
              disabled={!isFormValid() || isSaving}
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

      <Toaster position="top-center" />
    </>
  );
}
