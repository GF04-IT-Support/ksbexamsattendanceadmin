"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import useSWR from "swr";
import {
  deleteExamsSchedule,
  deleteExamsSession,
  getExamsSchedule,
} from "@/lib/actions/exams.action";
import ReactHtmlParser from "react-html-parser";
import TableDatePicker from "../pickers/TableDatePicker";
import { FiFilter, FiRefreshCw, FiTrash2, FiEdit } from "react-icons/fi";
import { useDateStore } from "@/zustand/store";
import SearchInput from "../inputs/SearchInput";
import toast, { Toaster } from "react-hot-toast";
import { FaEllipsisV, FaPlus, FaUpload } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import ExamsDeleteConfirmationModal from "../modals/ExamsDeleteConfirmationModal";
import ExamsUploadModal from "../modals/ExamsUploadModal";
import CreateNEditExamsModal from "../modals/CreateNEditExamsModal";
import { sortDataByStartTime } from "@/lib/helpers/date.helpers";
import ExamNamesTable from "./ExamNamesTable";

type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type ExamsTimetableProps = {
  examNames: ExamName[];
};

interface Exam {
  date: Date;
  end_time: string;
  exam_code: string;
  exam_id: string;
  exam_name_id: string;
  start_time: string;
  venue: string;
  year: string;
}

export default function ExamsTimetable({ examNames }: ExamsTimetableProps) {
  const rowsPerPage = 10;
  const [selectedId, setSelectedId] = useState(
    examNames.length > 0 ? examNames[0].exam_name_id : ""
  );
  const [page, setPage] = useState(1);
  const startDate = useDateStore((state) => state.startDate);
  const endDate = useDateStore((state) => state.endDate);
  const resetDates = useDateStore((state) => state.resetDates);
  const [filteredExamsData, setFilteredExamsData] = useState<any>([]);
  const [searchType, setSearchType] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [examsModalOpen, setExamsModalOpen] = useState(false);
  const [deleteConfirmationModal1, setDeleteConfirmationModal1] =
    useState(false);
  const [deleteConfirmationModal2, setDeleteConfirmationModal2] =
    useState(false);
  const [reUploadConfirmationModal, setReUploadConfirmationModal] =
    useState(false);
  const [details, setDetails] = useState<any>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [examSessionId, setExamSessionId] = useState(null);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "year",
    direction: "asc",
  });
  const [selectedExam, setSelectedExam] = useState<Exam>({
    date: new Date(),
    end_time: "",
    exam_code: "",
    exam_id: "",
    exam_name_id: "",
    start_time: "",
    venue: "",
    year: "",
  });

  useEffect(() => {
    if (examNames.length > 0) {
      setSelectedId(examNames[0].exam_name_id);
    } else {
      setSelectedId("");
    }
  }, [examNames]);

  const {
    data: examsData = [],
    mutate,
    isLoading,
  } = useSWR(`examsSchedule/${selectedId}`, () => getExamsSchedule(selectedId));

  useEffect(() => {
    if (!isLoading && !startDate && !endDate) {
      setFilteredExamsData(examsData);
    }
  }, [isLoading, examsData, startDate, endDate]);

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
    } else if (type === "examCode") {
      results = filteredExamsData.filter((exam: any) =>
        exam.exam_code.toLowerCase().includes(query.toLowerCase())
      );
    }

    setSearchResults(results);
  };

  const handleView = (items: any) => {
    setModalOpen(true);
    setSelectedExam(items);
  };

  const handleSortChange = (descriptor: any) => {
    const direction =
      sortDescriptor.column === descriptor.column &&
      sortDescriptor.direction === "asc"
        ? "desc"
        : "asc";

    if (descriptor.column === "date" || descriptor.column === "year") {
      let sortedData;
      if (descriptor.column === "date") {
        sortedData = sortDataByStartTime(filteredExamsData.slice());
        if (direction === "desc") {
          sortedData.reverse();
        }
      } else {
        sortedData = filteredExamsData.slice().sort((a: any, b: any) => {
          const aValue = Number(a.year);
          const bValue = Number(b.year);
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        });
      }

      setFilteredExamsData(sortedData);
    }

    setSortDescriptor({ column: descriptor.column, direction });
  };

  const handleDelete = () => {
    setDeleteConfirmationModal1(true);
  };

  const handleConfirmDelete1 = () => {
    setDeleteConfirmationModal1(false);
    setDeleteConfirmationModal2(true);
  };

  const handleConfirmDelete2 = async () => {
    setIsDeleting(true);
    try {
      if (examSessionId) {
        const response: any = await deleteExamsSession(examSessionId);
        if (response?.message === "Exam session deleted successfully") {
          toast.success(response?.message);
          mutate();
        } else {
          toast.error(response?.message);
        }
      } else {
        const response: any = await deleteExamsSchedule(selectedId);
        if (response?.message === "Exam deleted successfully") {
          toast.success(response?.message);
        } else {
          toast.error(response?.message);
        }
      }
    } catch (error) {
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationModal2(false);
      setExamSessionId(null);
    }
  };

  const handleReupload = async () => {
    setReUploadConfirmationModal(false);
    setDetails({
      openModal: true,
      selectedExams: {
        selectedId: selectedId,
        examName: examNames.filter(
          (exam: any) => exam.exam_name_id === selectedId
        )[0].exam_name,
      },
    });
  };

  const loadingState = isLoading ? "loading" : "idle";
  const isEmpty =
    (searchResults || filteredExamsData).length === 0 && !isLoading;

  const createNewExamsSchedule = () => {
    setModalOpen(true);
    setSelectedExam({
      date: new Date(),
      end_time: "",
      exam_code: "",
      exam_id: "",
      exam_name_id: selectedId,
      start_time: "",
      venue: "",
      year: "",
    });
  };

  return (
    <>
      <ExamsUploadModal details={details} setDetails={setDetails} />
      <div className="my-4 w-full">
        <Toaster position="top-center" />
        <div className="flex w-full items-center ">
          <div className="w-[95%]">
            <Select
              label={selectedId !== "" && "Exam Name"}
              items={examNames}
              onChange={onExamNameChange}
              selectedKeys={(selectedId !== "" && [selectedId]) || []}
              placeholder={
                examNames.length === 0 ? "No Exams Available" : "Select Exam"
              }
              className="w-full"
              disabled={examNames.length === 0}
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

          <div className="w-[5%]">
            <Dropdown aria-label="Actions">
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <FaEllipsisV size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  onClick={createNewExamsSchedule}
                  color="primary"
                  className="text-primary"
                  startContent={<FaPlus size={20} />}
                >
                  Add Exams Schedule
                </DropdownItem>
                <DropdownItem
                  showDivider
                  className="text-default-800"
                  startContent={<FaUpload size={20} />}
                  onClick={() => setReUploadConfirmationModal(true)}
                >
                  Reupload Exams
                </DropdownItem>
                <DropdownItem
                  onClick={() => setExamsModalOpen(true)}
                  startContent={<MdAssignment size={20} />}
                >
                  Manage Exams
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
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

        <Table
          aria-label="Exams timetable"
          onSortChange={handleSortChange}
          bottomContent={
            pages > 1 && (
              <div className="flex w-full justify-center">
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
            )
          }
          classNames={{
            table: isLoading || isEmpty ? "min-h-[400px]" : "",
          }}
        >
          <TableHeader>
            <TableColumn key="date" allowsSorting>
              Date
            </TableColumn>
            <TableColumn key="exam_code">Exam Code(s)</TableColumn>
            <TableColumn key="start_time">Start Time</TableColumn>
            <TableColumn key="end_time">End Time</TableColumn>
            <TableColumn key="venue">Venue(s)</TableColumn>
            <TableColumn key="year" allowsSorting>
              Year
            </TableColumn>
            <TableColumn key="action">Action</TableColumn>
          </TableHeader>

          {isEmpty ? (
            <TableBody emptyContent={"No schedule for this exams."}>
              {[]}
            </TableBody>
          ) : (
            <TableBody
              loadingContent={<Spinner />}
              loadingState={loadingState}
              items={items}
              aria-colspan={3}
            >
              {(item: any) => (
                <TableRow key={item.exam_id}>
                  {(columnKey) => (
                    <TableCell>
                      {columnKey === "date" ? (
                        new Date(item[columnKey]).toLocaleDateString("en-GB")
                      ) : columnKey === "exam_code" || columnKey === "venue" ? (
                        item[columnKey].includes(",") ? (
                          <Tooltip
                            content={ReactHtmlParser(
                              item[columnKey].split(",").join("<br />")
                            )}
                            placement="bottom"
                          >
                            <span className="cursor-pointer underline">
                              {item[columnKey].split(",")[0]}
                            </span>
                          </Tooltip>
                        ) : (
                          item[columnKey]
                        )
                      ) : columnKey === "action" ? (
                        <>
                          <Dropdown aria-label="Actions">
                            <DropdownTrigger>
                              <Button isIconOnly size="sm" variant="light">
                                <FaEllipsisV size={16} />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                onClick={() => handleView(item)}
                                className="text-primary"
                                startContent={<FiEdit size={20} />}
                              >
                                Edit Schedule
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => {
                                  handleDelete();
                                  setExamSessionId(item.exam_id);
                                }}
                                color="danger"
                                className="text-danger"
                                startContent={<FiTrash2 size={20} />}
                              >
                                Delete Schedule
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </>
                      ) : (
                        item[columnKey]
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>

        {modalOpen && (
          <CreateNEditExamsModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            selectedExam={selectedExam}
            mutate={mutate}
          />
        )}

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

        {reUploadConfirmationModal && (
          <ExamsDeleteConfirmationModal
            isOpen={reUploadConfirmationModal}
            onClose={() => setReUploadConfirmationModal(false)}
            onConfirm={handleReupload}
            message="This action will delete existing exam schedule and allow for reupload. Are you absolutely sure you want to proceed?"
            confirmLabel="Confirm"
            isDeleting={isDeleting}
          />
        )}

        {examsModalOpen && (
          <ExamNamesTable
            isOpen={examsModalOpen}
            onClose={() => setExamsModalOpen(false)}
          />
        )}
      </div>
    </>
  );
}
