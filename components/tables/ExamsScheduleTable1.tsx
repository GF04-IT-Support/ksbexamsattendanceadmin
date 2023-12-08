"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
  Chip,
  Modal,
  ModalContent,
  useDisclosure,
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
import { getExamsSchedule } from "@/lib/actions/exams.action";
import TableDatePicker from "../pickers/TableDatePicker";
import { FiFilter, FiRefreshCw, FiEye, FiUserPlus } from "react-icons/fi";
import { useDateStore } from "@/zustand/store";
import SearchInput from "../inputs/SearchInput";
import { Toaster } from "react-hot-toast";
import StaffAssignModal from "../modals/StaffAssignModal";
import { fetchStaffDetails } from "@/lib/actions/staff.action";
import UploadForm from "../forms/UploadForm";
import { produce } from "immer";

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
    examsNames.length > 0 ? examsNames[0].exam_name_id : ""
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
  } | null>(null);
  const [assignments, setAssignments] = useState<{ [key: string]: [] }>({});
  const selectedVenuesRef = useRef(selectedVenues);
  const assignmentsRef = useRef(assignments);

  const {
    data: examsData = [],
    mutate,
    isLoading,
  } = useSWR(`examsSchedule/${selectedId}/${role}`, () =>
    getExamsSchedule(selectedId, role)
  );

  const { data: staffDetails = [] } = useSWR(`staffDetails`, () =>
    fetchStaffDetails(role)
  );

  useEffect(() => {
    if (examsData.length > 0 && !selectedVenuesSet.current) {
      const initialSelectedVenues = examsData.reduce((acc: any, item: any) => {
        acc[item.exam_id] = item.venue.split(",")[0];
        return acc;
      }, {});

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

      setSelectedVenues(initialSelectedVenues);
      setAssignments(initialAssignments);
      selectedVenuesSet.current = false;
    }
  }, [examsData]);

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
    const selectedVenue = event.target.value;
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

  const handleAssign = (examId: string) => {
    const venue = selectedVenuesRef.current[examId];
    const assignments: any = Object.values(assignmentsRef.current[examId]);

    setSelectedExam({ examId, venue, assignments });
    setModalOpen(true);
  };

  const loadingState = isLoading ? "loading" : "idle";
  const isEmpty =
    (searchResults || filteredExamsData).length === 0 && !isLoading;

  return (
    <>
      {role === "invigilators" && (
        <div className="flex justify-center items-center">
          <Chip>
            Assign Invigilators manually below or click{" "}
            <p
              onClick={onOpen}
              className="inline-block cursor-pointer text-blue hover:underline"
            >
              here
            </p>{" "}
            to upload invigilators timetable
          </Chip>
        </div>
      )}

      <div className="my-4 w-full">
        <div className="flex justify-center items-center">
          <Toaster position="top-center" />
          <Select
            label="Exam Name"
            items={examsNames}
            onChange={onExamNameChange}
            defaultSelectedKeys={
              (examsNames.length > 0 && [examsNames[0].exam_name_id]) || []
            }
            placeholder="Select Exam Name"
            className="my-2"
            disallowEmptySelection
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

        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          handleSearch={handleSearch}
          setSearchResults={setSearchResults}
          isStaffSearch
        />

        <div className="flex gap-2 items-center justify-start my-6">
          <TableDatePicker />
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

        <TableContainer component={Paper}>
          <Table aria-label="Exams timetable">
            <TableHead style={{ backgroundColor: "#4D4DFF33" }}>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell className="capitalize">{role}</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            {isLoading ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className=" h-[400px]"
                    style={{
                      verticalAlign: "middle",
                      justifyContent: "center",
                      flexDirection: "row",
                      flex: 1,
                    }}
                  >
                    <Spinner />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <>
                <TableBody>
                  {items.map((item: any) => (
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
                          defaultSelectedKeys={
                            (item.venue.length > 0 && [
                              item.venue.split(",")[0],
                            ]) ||
                            []
                          }
                        >
                          {item.venue.split(",").map((venue: string) => (
                            <SelectItem key={venue} value={venue}>
                              {venue}
                            </SelectItem>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell>
                        {Object.values(assignments[item.exam_id] || {}).flatMap(
                          (staffs: any[]) => staffs
                        ).length > 0
                          ? Object.values(assignments[item.exam_id] || {})
                              .flatMap((staffs: any[]) => staffs)
                              .map(
                                (staff, index, arr) =>
                                  `${staff.staff_name}${
                                    index < arr.length - 1 ? ", " : ""
                                  }`
                              )
                              .join("")
                          : "No staff assigned"}
                      </TableCell>

                      <TableCell className="w-[40px]">
                        {/* <Tooltip title="Assign"> */}
                        <FiUserPlus
                          size={20}
                          className="cursor-pointer hover:opacity-60"
                          onClick={() => handleAssign(item.exam_id)}
                        />
                        {/* </Tooltip> */}
                      </TableCell>
                    </TableRow>
                  ))}
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
