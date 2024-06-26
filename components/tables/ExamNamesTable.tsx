"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Pagination,
  Input,
  Checkbox,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableFooter,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiCheck,
  FiEdit3,
  FiPlus,
  FiTrash2,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import ExamsDeleteConfirmationModal from "../modals/ExamsDeleteConfirmationModal";
import {
  deleteExamsSchedule,
  editExams,
  getAllExamsNames,
  lockOrUnlockAllExamsSessions,
} from "@/lib/actions/exams.action";
import CreateNewExamsModal from "../modals/CreateNewExamsModal";
import useSWR from "swr";
import { FaEllipsisV } from "react-icons/fa";

type ExamsNamesProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ExamNamesTable = ({ isOpen, onClose }: ExamsNamesProps) => {
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);
  const [examDetails, setExamDetails] = useState<any>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationModal1, setDeleteConfirmationModal1] =
    useState(false);
  const [deleteConfirmationModal2, setDeleteConfirmationModal2] =
    useState(false);
  const [examSessionId, setExamSessionId] = useState(null);
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [isCreateExamsModalOpen, setIsCreateExamsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    data: examData = [],
    mutate,
    isLoading,
  } = useSWR(`/examsNames`, () => getAllExamsNames());

  useEffect(() => {
    setExamDetails(examData);
  }, [examData]);

  useEffect(() => {
    if (!isLoading) {
      const editing = false;
      for (const exam of examData) {
        isEditing[exam.exam_name_id] = editing;
      }
    }
  }, [examData, isLoading]);

  const pages = Math.ceil(examDetails?.length / rowsPerPage);

  const items = useMemo(() => {
    const sortedExamDetails = examDetails?.sort(
      (a: any, b: any) => parseInt(b.order, 10) - parseInt(a.order, 10)
    );

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedExamDetails?.slice(start, end);
  }, [page, examDetails, rowsPerPage]);

  const handleDelete = () => {
    setDeleteConfirmationModal1(true);
  };

  const handleConfirmDelete1 = () => {
    setDeleteConfirmationModal1(false);
    setDeleteConfirmationModal2(true);
  };

  const handleConfirmDelete2 = async () => {
    if (!examSessionId) return;
    setIsDeleting(true);
    try {
      const response: any = await deleteExamsSchedule(examSessionId);
      if (response?.message === "Exam deleted successfully") {
        const updatedExamDetails = examDetails.filter(
          (exam: any) => exam.exam_name_id !== examSessionId
        );
        setExamDetails(updatedExamDetails);
        toast.success(response?.message);
      } else {
        toast.error(response?.message);
      }
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationModal2(false);
    }
  };

  const handleEdit = (exam_name_id: string) => {
    setIsEditing((prevState) => {
      return {
        ...prevState,
        [exam_name_id]: !prevState[exam_name_id],
      };
    });
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const newExamDetails = [...examDetails];
    const currentIndex = index;
    let newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0) {
      newIndex = 0;
    } else if (newIndex >= newExamDetails.length) {
      newIndex = newExamDetails.length - 1;
    }

    const tempOrder = newExamDetails[currentIndex].order;
    newExamDetails[currentIndex].order = newExamDetails[newIndex].order;
    newExamDetails[newIndex].order = tempOrder;

    setExamDetails(newExamDetails);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await editExams(examDetails);
      if (response?.message === "Exams edited successfully") {
        toast.success(response?.message);
        mutate();
        onClose();
      } else {
        toast.error(response?.message);
      }
    } catch (error) {
      toast.error("An error occurred while updating the exam details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockOrUnlock = async (examId: string, locked: boolean) => {
    try {
      const response: any = await lockOrUnlockAllExamsSessions(examId, locked);
      if (
        response?.message ===
        `All ${locked ? "locked" : "unlocked"} exam sessions have been ${
          locked ? "locked" : "unlocked"
        } successfully`
      ) {
        toast.success(response?.message);
        mutate();
      } else {
        toast.error(response?.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const isDisabled = () => {
    const isEditingFalseForAll = Object.values(isEditing).every(
      (value) => !value
    );
    const isExamDetailsSame =
      JSON.stringify(examDetails) !== JSON.stringify(examData);
    return isEditingFalseForAll && isExamDetailsSame;
  };

  return (
    <>
      <Toaster position="top-center" />
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onClose}
        isDismissable={false}
        size="5xl"
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
          <ModalHeader className=" justify-center">Exams Details</ModalHeader>
          <ModalBody>
            <div className="flex justify-end">
              <Button
                color="primary"
                startContent={<FiPlus size={20} />}
                onClick={() => setIsCreateExamsModalOpen(true)}
              >
                Add Exam
              </Button>
            </div>

            <TableContainer component={Paper} style={{ padding: "1rem" }}>
              <Table aria-label="Exams timetable">
                <TableHead
                  style={{
                    backgroundColor: "#F4F4F5",
                    borderBottom: 0,
                  }}
                >
                  <TableRow>
                    <TableCell
                      style={{
                        borderTopLeftRadius: "0.5rem",
                        borderBottomLeftRadius: "0.5rem",
                        color: "#71717A",
                        fontWeight: 600,
                      }}
                    ></TableCell>
                    <TableCell
                      style={{
                        borderTopLeftRadius: "0.5rem",
                        borderBottomLeftRadius: "0.5rem",
                        color: "#71717A",
                        fontWeight: 600,
                      }}
                    >
                      Name
                    </TableCell>
                    <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                {isLoading ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="h-[400px] flex items-center justify-center">
                          <Spinner />
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <>
                    <TableBody>
                      {examData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <div className="h-[400px] text-lg font-semibold flex items-center justify-center">
                              No Schedule Available
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item: any, index: number) => (
                          <TableRow key={item.exam_name_id}>
                            <TableCell>
                              <Checkbox
                                defaultSelected={item.selected === true}
                                onChange={(e) =>
                                  setExamDetails(
                                    examDetails.map((exam: any) =>
                                      exam.exam_name_id === item.exam_name_id
                                        ? {
                                            ...exam,
                                            selected: e.target.checked,
                                          }
                                        : exam
                                    )
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {Object.keys(isEditing).includes(
                                item.exam_name_id
                              ) && isEditing[item.exam_name_id] ? (
                                <Input
                                  value={item.exam_name}
                                  onChange={(e) =>
                                    setExamDetails(
                                      examDetails.map((d: any) =>
                                        d.exam_name_id === item.exam_name_id
                                          ? { ...d, exam_name: e.target.value }
                                          : d
                                      )
                                    )
                                  }
                                  variant="underlined"
                                />
                              ) : (
                                item.exam_name
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="flex gap-2 items-center">
                                {isEditing[item.exam_name_id] ? (
                                  <FiCheck
                                    className="cursor-pointer hover:opacity-50"
                                    size={20}
                                    onClick={() =>
                                      handleEdit(item.exam_name_id)
                                    }
                                  />
                                ) : (
                                  <FiEdit3
                                    className="cursor-pointer hover:opacity-50"
                                    size={20}
                                    onClick={() =>
                                      handleEdit(item.exam_name_id)
                                    }
                                  />
                                )}
                                <div className="flex flex-col">
                                  {index !== 0 && (
                                    <IoIosArrowUp
                                      size={20}
                                      className="cursor-pointer hover:opacity-50"
                                      onClick={() =>
                                        handleMoveItem(index, "up")
                                      }
                                    />
                                  )}
                                  {index !== items.length - 1 && (
                                    <IoIosArrowDown
                                      size={20}
                                      className="cursor-pointer hover:opacity-50"
                                      onClick={() =>
                                        handleMoveItem(index, "down")
                                      }
                                    />
                                  )}
                                </div>
                                <>
                                  <Dropdown aria-label="Actions">
                                    <DropdownTrigger>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                      >
                                        <FaEllipsisV size={16} />
                                      </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu>
                                      <DropdownItem
                                        startContent={<FiLock size={20} />}
                                        onClick={() =>
                                          handleLockOrUnlock(
                                            item.exam_name_id,
                                            true
                                          )
                                        }
                                      >
                                        Lock sessions
                                      </DropdownItem>
                                      <DropdownItem
                                        startContent={<FiUnlock size={20} />}
                                        onClick={() =>
                                          handleLockOrUnlock(
                                            item.exam_name_id,
                                            false
                                          )
                                        }
                                      >
                                        UnLock sessions
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                                </>
                                <FiTrash2
                                  size={20}
                                  color="red"
                                  onClick={() => {
                                    handleDelete();
                                    setExamSessionId(item.exam_name_id);
                                  }}
                                  className="cursor-pointer hover:opacity-50"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>

                    <TableFooter>
                      {pages > 1 && (
                        <TableRow>
                          <TableCell style={{ padding: "20px 0" }} colSpan={4}>
                            <div className="flex justify-center">
                              <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableFooter>
                  </>
                )}
              </Table>
            </TableContainer>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={onClose}>
              Close
            </Button>
            <Button
              color={!isDisabled() ? "default" : "primary"}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {deleteConfirmationModal1 && (
        <ExamsDeleteConfirmationModal
          isOpen={deleteConfirmationModal1}
          onClose={() => {
            setDeleteConfirmationModal1(false);
            setExamSessionId(null);
          }}
          onConfirm={handleConfirmDelete1}
          message="Are you sure you want to delete the Exam Schedule?"
          confirmLabel="Confirm"
        />
      )}

      {deleteConfirmationModal2 && (
        <ExamsDeleteConfirmationModal
          isOpen={deleteConfirmationModal2}
          onClose={() => {
            setDeleteConfirmationModal2(false);
            setExamSessionId(null);
          }}
          onConfirm={handleConfirmDelete2}
          message="This action is irreversible. Are you absolutely sure you want to proceed?"
          confirmLabel="Delete"
          isDeleting={isDeleting}
        />
      )}

      {isCreateExamsModalOpen && (
        <CreateNewExamsModal
          isOpen={isCreateExamsModalOpen}
          onClose={() => setIsCreateExamsModalOpen(false)}
          setExamsDetails={setExamDetails}
        />
      )}
    </>
  );
};

export default ExamNamesTable;
