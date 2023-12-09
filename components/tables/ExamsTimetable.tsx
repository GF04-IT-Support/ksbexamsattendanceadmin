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
} from "@nextui-org/react";
import useSWR from "swr";
import { getExamsSchedule } from "@/lib/actions/exams.action";
import ReactHtmlParser from "react-html-parser";
import TableDatePicker from "../pickers/TableDatePicker";
import { FiFilter, FiRefreshCw, FiEye } from "react-icons/fi";
import { useDateStore } from "@/zustand/store";
import SearchInput from "../inputs/SearchInput";
import ViewNEditModal from "../modals/ViewNEditExamsModal";
import { Toaster } from "react-hot-toast";

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

  // useEffect(() => {
  //   const sortedData = [...filteredExamsData].sort((a, b) => {
  //     const aValue = Number(a.year);
  //     const bValue = Number(b.year);
  //     return sortDescriptor.direction === "asc"
  //       ? aValue - bValue
  //       : bValue - aValue;
  //   });
  //   setFilteredExamsData(sortedData);
  // }, []);

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
      const sortedData = [...filteredExamsData].sort((a, b) => {
        const aValue =
          descriptor.column === "date"
            ? new Date(a.date).getTime()
            : Number(a.year);
        const bValue =
          descriptor.column === "date"
            ? new Date(b.date).getTime()
            : Number(b.year);
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      });
      setFilteredExamsData(sortedData);
    }

    setSortDescriptor({ column: descriptor.column, direction });
  };

  const loadingState = isLoading ? "loading" : "idle";
  const isEmpty =
    (searchResults || filteredExamsData).length === 0 && !isLoading;

  return (
    <div className="my-4 w-full">
      <div className="flex justify-center items-center">
        <Toaster position="top-center" />
        <Select
          label="Exam Name"
          items={examNames}
          onChange={onExamNameChange}
          defaultSelectedKeys={
            (examNames.length > 0 && [examNames[0].exam_name_id]) || []
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

      <Table
        // isStriped
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
          table: isLoading ? "min-h-[400px]" : "",
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
                      <Tooltip content="View">
                        <FiEye
                          size={20}
                          className="cursor-pointer hover:opacity-60"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleView(item)}
                        />
                      </Tooltip>
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
        <ViewNEditModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedExam={selectedExam}
          mutate={mutate}
        />
      )}
    </div>
  );
}
