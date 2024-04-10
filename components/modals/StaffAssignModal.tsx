import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  select,
  Spinner,
} from "@nextui-org/react";
import { Card, CardContent } from "@material-ui/core";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { assignStaffToExamSession } from "@/lib/actions/exams.action";

interface StaffDetailProps {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  department: string;
}

type StaffAssignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  label: string;
  selectedExam: any;
  staffDetails: StaffDetailProps[];
  mutate: () => void;
};

export default function StaffAssignModal({
  isOpen,
  onClose,
  role,
  label,
  selectedExam,
  staffDetails,
  mutate,
}: StaffAssignModalProps) {
  const { examId, venue, assignments, dateTime, allAssignedStaff } =
    selectedExam;
  const sortedStaffDetails = [...staffDetails].sort((a, b) =>
    a.staff_role.localeCompare(b.staff_role)
  );
  const [isSaving, setIsSaving] = useState(false);
  const assignmentStaffIds = assignments.flatMap((assignment: any[]) =>
    assignment.map((staff: any) => staff.staff_id)
  );

  const defaultSelectedStaff = sortedStaffDetails.filter((staff: any) =>
    assignmentStaffIds.includes(staff.staff_id)
  );
  const [selectedStaff, setSelectedStaff] =
    useState<StaffDetailProps[]>(defaultSelectedStaff);

  const hasChanges = () => {
    if (selectedStaff.length !== defaultSelectedStaff.length) {
      return true;
    }

    for (let i = 0; i < selectedStaff.length; i++) {
      if (selectedStaff[i].staff_id !== defaultSelectedStaff[i].staff_id) {
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const staff_ids = selectedStaff.map((staff) => staff.staff_id);
    try {
      const result: any = await assignStaffToExamSession(
        examId,
        venue,
        staff_ids,
        role
      );
      if (
        result?.message ===
        "Staff member(s) have been assigned to the exam session successfully"
      ) {
        toast.success(result?.message);
        mutate();
        onClose();
      } else {
        toast.error(result?.message);
      }
    } catch (error: any) {
      throw new Error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <Modal
        backdrop="blur"
        isDismissable={false}
        size="3xl"
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
        <ModalContent className="m-4">
          <ModalHeader className="flex flex-col gap-1">
            {label} Assignment
          </ModalHeader>
          <ModalHeader className="flex flex-row gap-1">
            <div className="flex flex-col">
              <div className="text-center text-gray-700">{dateTime.date}</div>
              <div className="text-[12px] text-center text-gray-500">{`${dateTime.startTime} - ${dateTime.endTime}`}</div>
            </div>
            - {venue}
          </ModalHeader>
          <ModalBody>
            <Card className="sm:p-4 sm:m-4 min-h-[250px]">
              <CardContent className="flex items-center justify-start">
                <Autocomplete
                  multiple
                  fullWidth
                  size="medium"
                  id="tags-outlined"
                  options={sortedStaffDetails}
                  getOptionLabel={(option) => option.staff_name}
                  groupBy={(option) => option.staff_role}
                  filterSelectedOptions
                  value={selectedStaff}
                  onChange={(event, newValue) => {
                    const lastSelectedStaff = newValue[newValue.length - 1];
                    if (
                      lastSelectedStaff &&
                      allAssignedStaff.some(
                        (staff: any) =>
                          staff.staff_id === lastSelectedStaff.staff_id
                      )
                    ) {
                      const assignedStaff = allAssignedStaff.find(
                        (staff: any) =>
                          staff.staff_id === lastSelectedStaff.staff_id
                      );
                      toast.error(
                        `${lastSelectedStaff.staff_name} is already assigned to ${assignedStaff.venue}`
                      );
                      return;
                    }
                    setSelectedStaff(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Select ${label}`}
                      placeholder="Select"
                    />
                  )}
                />
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
}
