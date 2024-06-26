"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
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
import useSWR from "swr";
import {
  getExamsSchedule,
  lockOrUnlockExams,
} from "@/lib/actions/exams.action";
import TableDatePicker from "../pickers/TableDatePicker";
import {
  FiFilter,
  FiRefreshCw,
  FiLock,
  FiUnlock,
  FiUserPlus,
  FiUser,
} from "react-icons/fi";
import { useDateStore } from "@/zustand/store";
import SearchInput from "../inputs/SearchInput";
import toast, { Toaster } from "react-hot-toast";
import StaffAssignModal from "../modals/StaffAssignModal";
import { fetchStaffDetails } from "@/lib/actions/staff.action";
import UploadForm from "../forms/UploadForm";
import CollapsibleStaffList from "../shared/CollapsibleStaffList";
import { sortDataByStartTime } from "@/lib/helpers/date.helpers";
import { FaEllipsisV } from "react-icons/fa";

type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type ExamsTimetableProps = {
  examsNames: ExamName[];
  role: string;
  label: string;
};

export default function ExamsScheduleTable({
  examsNames,
  role,
  label,
}: ExamsTimetableProps) {
  const rowsPerPage = 10;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedId, setSelectedId] = useState(
    examsNames.length > 0
      ? examsNames.map((examName) => examName.exam_name_id).join(",")
      : ""
  );
  const [page, setPage] = useState(1);
  const startDate = useDateStore((state) => state.startDate);
  const endDate = useDateStore((state) => state.endDate);
  const resetDates = useDateStore((state) => state.resetDates);
  const [filteredExamsData, setFilteredExamsData] = useState<any>([]);
  const [searchType, setSearchType] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [selectedVenues, setSelectedVenues] = useState<{
    [key: string]: string;
  }>({});
  const selectedVenuesSet = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<{
    examId: string;
    venue: string;
    assignments: [];
    dateTime: any;
    allAssignedStaff: any;
  } | null>(null);
  const [assignments, setAssignments] = useState<{ [key: string]: [] }>({});
  const selectedVenuesRef = useRef(selectedVenues);
  const assignmentsRef = useRef(assignments);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (examsNames.length > 0) {
      setSelectedId(
        examsNames.map((examName) => examName.exam_name_id).join(",")
      );
    } else {
      setSelectedId("");
    }
  }, [examsNames]);

  const {
    data: examsData = [],
    mutate,
    isLoading,
  } = useSWR(`examsSchedule/${selectedId}/${role}`, async () => {
    const unsortedExamsData = await getExamsSchedule(selectedId, role);
    const sortedExamsData = sortDataByStartTime([...unsortedExamsData]);
    return sortedExamsData;
  });

  const { data: staffDetails = [] } = useSWR(`staffDetails/${role}`, () =>
    fetchStaffDetails(role)
  );

  useEffect(() => {
    if (examsData.length > 0 && !selectedVenuesSet.current && !initialized) {
      const initialSelectedVenues = examsData.reduce((acc: any, item: any) => {
        acc[item.exam_id] = item.venue.split(",")[0];
        return acc;
      }, {});

      setSelectedVenues(initialSelectedVenues);

      const initialAssignments = examsData.reduce((acc: any, exam: any) => {
        const firstVenue = exam.venue.split(",")[0];
        if (firstVenue) {
          if (!acc[exam.exam_id]) {
            acc[exam.exam_id] = {};
          }
          acc[exam.exam_id][firstVenue] = [];
          const filteredSessions = exam.sessions.filter(
            (session: any) => session.venue.name === firstVenue
          );
          filteredSessions.forEach((session: any) => {
            acc[exam.exam_id][firstVenue].push(
              ...session.assignments.map((assignment: any) => assignment.staff)
            );
          });
        }
        return acc;
      }, {});

      setAssignments(initialAssignments);
      setInitialized(true);
      selectedVenuesSet.current = false;
    } else if (initialized) {
      const newAssignments = examsData.reduce((acc: any, exam: any) => {
        const selectedVenue = selectedVenues[exam.exam_id];
        if (selectedVenue) {
          if (!acc[exam.exam_id]) {
            acc[exam.exam_id] = {};
          }
          acc[exam.exam_id][selectedVenue] = [];
          const filteredSessions = exam.sessions.filter(
            (session: any) => session.venue.name === selectedVenue
          );
          filteredSessions.forEach((session: any) => {
            acc[exam.exam_id][selectedVenue].push(
              ...session.assignments.map((assignment: any) => assignment.staff)
            );
          });
        }
        return acc;
      }, {});

      setAssignments(newAssignments);
    }
  }, [examsData]);

  useEffect(() => {
    setInitialized(false);
  }, [selectedId]);

  useEffect(() => {
    if (!isLoading && !startDate && !endDate) {
      setFilteredExamsData(examsData);
    }
  }, [examsData, isLoading, startDate, endDate]);

  useEffect(() => {
    selectedVenuesRef.current = selectedVenues;
    assignmentsRef.current = assignments;
  }, [selectedVenues, assignments]);

  const handleFilter = () => {
    if (startDate && endDate) {
      const filtered = examsData.filter((exam: any) => {
        const examDate = new Date(exam.date);

        return examDate >= startDate && examDate <= endDate;
      });

      setFilteredExamsData(filtered);
    } else {
      setFilteredExamsData(examsData);
    }
  };

  const pages = Math.ceil(
    (searchResults || filteredExamsData)?.length / rowsPerPage
  );

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return (searchResults || filteredExamsData)?.slice(start, end);
  }, [page, searchResults, filteredExamsData]);

  const onExamNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(event.target.value);
    setSearchResults(null);
    setSearchQuery("");
    resetDates();
    mutate();
    setPage(1);
  };

  const handleSearch = (query: string, type: string) => {
    let results = [];

    if (type === "date") {
      const searchDate = new Date(query).toLocaleDateString("en-GB");

      results = filteredExamsData.filter((exam: any) => {
        const examDate = new Date(exam.date).toLocaleDateString("en-GB");

        return examDate === searchDate;
      });
    } else if (type === "venue") {
      results = filteredExamsData.filter((exam: any) =>
        exam.venue.toLowerCase().includes(query.toLowerCase())
      );
    } else if (type === "staffName") {
      if (query === "") {
        results = filteredExamsData;
      } else {
        results = filteredExamsData.filter((exam: any) => {
          if (exam.sessions && exam.sessions.assignments) {
            return Object.values(exam.sessions.assignments)
              .flat()
              .some((assignment: any) =>
                assignment.staff.staff_name
                  .toLowerCase()
                  .includes(query.toLowerCase())
              );
          }
          return false;
        });
      }
    }
    setSearchResults(results);
  };

  const handleVenueChange = (event: any, examId: string) => {
    const selectedVenue = event.target.value.trim();
    setSelectedVenues((prev) => {
      const newSelectedVenues = { ...prev, [examId]: selectedVenue };
      return newSelectedVenues;
    });

    const newAssignments = examsData.reduce((acc: any, exam: any) => {
      if (exam.exam_id === examId) {
        if (!acc[exam.exam_id]) {
          acc[exam.exam_id] = {};
        }
        acc[exam.exam_id][selectedVenue] = [];
        const filteredSessions = exam.sessions.filter(
          (session: any) => session.venue.name === selectedVenue
        );
        filteredSessions.forEach((session: any) => {
          acc[exam.exam_id][selectedVenue].push(
            ...session.assignments.map((assignment: any) => assignment.staff)
          );
        });
      }
      return acc;
    }, {});

    setAssignments((prev) => {
      return { ...prev, ...newAssignments };
    });
  };

  const handleAssign = (item: any) => {
    const examId = item.exam_id;
    const venue = selectedVenuesRef.current[examId];
    const assignments: any = Object.values(assignmentsRef.current[examId]);
    const dateTime: any = {
      date: new Date(item.date).toLocaleDateString("en-GB"),
      startTime: item.start_time,
      endTime: item.end_time,
    };
    let allAssignedStaff = item.sessions.flatMap((session: any) => {
      const { venue } = session;
      return session.assignments.flatMap((assignment: any) => ({
        ...assignment.staff,
        venue: venue.name,
      }));
    });
    allAssignedStaff = allAssignedStaff.filter((staff: any) => {
      return !assignments[0].some(
        (assigned: any) => assigned.staff_id === staff.staff_id
      );
    });

    setSelectedExam({ examId, venue, assignments, dateTime, allAssignedStaff });
    setModalOpen(true);
  };

  const handleLockOrUnlock = async (examId: string, locked: boolean) => {
    try {
      await lockOrUnlockExams(examId, locked);
      toast.success(
        locked ? "Session has been locked" : "Session has been unlocked"
      );
      mutate();
    } catch (error: any) {
      throw new Error(error);
    }
  };

  return (
    <>
      {role === "invigilators" && (
        <div className="flex  break-words justify-center items-center">
          <div className="px-4 text-center py-1 w-max rounded-full bg-[#D4D4D8]">
            Assign Invigilators manually below or click{" "}
            <p
              onClick={onOpen}
              className="inline-block cursor-pointer text-blue hover:underline"
            >
              here
            </p>{" "}
            to upload invigilators timetable
          </div>
        </div>
      )}

      <div className="my-4 w-full">
        <div className="flex w-full justify-center items-center">
          <Toaster position="top-center" />
          <Select
            label={selectedId !== "" && "Exam Name"}
            items={examsNames}
            onChange={onExamNameChange}
            selectedKeys={
              (selectedId !== "" &&
                selectedId.split(",").filter((id) => id !== "")) ||
              []
            }
            placeholder={
              examsNames.length === 0 ? "No Exams Available" : "Select Exam"
            }
            className="my-2"
            disabled={examsNames.length === 0}
            disallowEmptySelection
            selectionMode="multiple"
            isMultiline
          >
            {(examName) => (
              <SelectItem
                key={examName.exam_name_id}
                value={examName.exam_name_id}
              >
                {examName.exam_name}
              </SelectItem>
            )}
          </Select>
        </div>

        <div className="flex my-4 justify-between max-md:flex-col gap-2">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchType={searchType}
            setSearchType={setSearchType}
            handleSearch={handleSearch}
            setSearchResults={setSearchResults}
          />

          <div className="flex gap-2 items-center justify-center">
            <TableDatePicker />
            <div className="gap-2 flex">
              <div
                className="flex p-2 border items-center justify-center h-[42px] w-[42px] mt-2  border-gray-500 rounded cursor-pointer hover:opacity-60"
                onClick={resetDates}
              >
                <FiRefreshCw size={20} color={`gray`} />
              </div>
              <div
                className="flex p-2 border items-center justify-center h-[42px] w-[42px] mt-2 border-gray-500 rounded cursor-pointer hover:opacity-60"
                onClick={handleFilter}
              >
                <FiFilter size={20} color={`gray`} />
              </div>
            </div>
          </div>
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
                >
                  Date/Time
                </TableCell>
                <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                  Venue
                </TableCell>
                <TableCell
                  style={{ color: "#71717A", fontWeight: 600 }}
                  className="capitalize"
                >
                  {label}
                </TableCell>
                <TableCell
                  style={{
                    borderTopRightRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                    color: "#71717A",
                    fontWeight: 600,
                  }}
                >
                  Action
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
                  {examsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="h-[400px] text-lg font-semibold flex items-center justify-center">
                          No Schedule Available
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: any) => (
                      <TableRow key={item.exam_id}>
                        <TableCell className="w-[140px]">
                          <div className="text-center">
                            {new Date(item.date).toLocaleDateString("en-GB")}
                          </div>
                          <div className="text-[12px] text-center text-gray-500">{`${item.start_time} - ${item.end_time}`}</div>
                        </TableCell>

                        <TableCell className="w-[170px]">
                          <Select
                            aria-label="Venue"
                            value={item.venue}
                            className="w-[150px]"
                            onChange={(event) =>
                              handleVenueChange(event, item.exam_id)
                            }
                            disallowEmptySelection
                            selectedKeys={[
                              selectedVenues[item.exam_id]?.trim(),
                            ]}
                          >
                            {item.venue.split(",").map((venue: string) => (
                              <SelectItem
                                key={venue.trim()}
                                value={venue.trim()}
                              >
                                {venue.trim()}
                              </SelectItem>
                            ))}
                          </Select>
                        </TableCell>

                        <TableCell>
                          <CollapsibleStaffList
                            staffNames={Object.values(
                              assignments[item.exam_id] || {}
                            )
                              .flatMap((staffs: any[]) => staffs)
                              .map((staff) => staff.staff_name)}
                          />
                        </TableCell>

                        <TableCell className="w-[40px]">
                          <>
                            <Dropdown aria-label="Actions">
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <FaEllipsisV size={16} />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  onClick={() => handleAssign(item)}
                                  startContent={<FiUserPlus size={20} />}
                                >
                                  Assign {label}
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() =>
                                    item.locked
                                      ? handleLockOrUnlock(item.exam_id, false)
                                      : handleLockOrUnlock(item.exam_id, true)
                                  }
                                  startContent={
                                    item.locked ? (
                                      <FiUnlock size={20} />
                                    ) : (
                                      <FiLock size={20} />
                                    )
                                  }
                                >
                                  {item.locked
                                    ? "Unlock Session"
                                    : "Lock Session"}
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </>
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

        {modalOpen && (
          <StaffAssignModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            role={role}
            selectedExam={selectedExam}
            label={label}
            staffDetails={staffDetails}
            mutate={mutate}
          />
        )}
      </div>

      <Modal
        size="xl"
        className="p-4"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <UploadForm
                uploadType="invigilators"
                onClose={onClose}
                mutate={mutate}
                staffDetails={staffDetails}
              />
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
