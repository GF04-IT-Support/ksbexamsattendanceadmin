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
import { updateStaffDetails } from "@/lib/actions/staff.action";
import toast, { Toaster } from "react-hot-toast";

type StaffDetails = {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  department: string;
};

type EditStaffDetailsModalProps = {
  staffDetails: StaffDetails;
  isOpen: boolean;
  onClose: () => void;
  mutate: () => void;
  uniqueRoles: string[];
};

export default function EditStaffDetailsModal({
  staffDetails,
  isOpen,
  onClose,
  mutate,
  uniqueRoles,
}: EditStaffDetailsModalProps) {
  const [editedDetails, setEditedDetails] = useState(staffDetails);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = () => {
    return JSON.stringify(editedDetails) !== JSON.stringify(staffDetails);
  };

  const getChangedValues = () => {
    const changes: Partial<StaffDetails> = {};

    for (const key in editedDetails) {
      if (
        key !== "exam_id" &&
        editedDetails[key as keyof StaffDetails] !==
          staffDetails[key as keyof StaffDetails]
      ) {
        changes[key as keyof StaffDetails] =
          editedDetails[key as keyof StaffDetails];
      }
    }

    return changes;
  };

  const handleSubmit = async () => {
    const changes = getChangedValues();
    setIsSaving(true);

    try {
      const response = await updateStaffDetails(staffDetails.staff_id, changes);

      if (response.message === "Staff details updated successfully") {
        toast.success("Staff details updated successfully");
        mutate();
        onClose();
      } else if (
        response.message ===
        "An error occurred while updating the staff details."
      ) {
        toast.error(response.message);
        onClose();
      }
    } catch (error: any) {
      throw new Error(error.message);
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
            Edit Staff Details
          </ModalHeader>
          <ModalBody>
            <Card style={{ margin: "1rem", padding: "1rem" }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary">Name:</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      label="Edit Name"
                      value={editedDetails.staff_name}
                      onChange={(e) =>
                        setEditedDetails({
                          ...editedDetails,
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
                      className="w-[223px]"
                      value={editedDetails.staff_role}
                      onChange={(e) =>
                        setEditedDetails({
                          ...editedDetails,
                          staff_role: e.target.value as string,
                        })
                      }
                    >
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
                      label="Edit Department"
                      value={editedDetails.department}
                      onChange={(e) =>
                        setEditedDetails({
                          ...editedDetails,
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

      <Toaster position="top-center" />
    </>
  );
}
