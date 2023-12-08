"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
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

  const rowsPerPage = 10;

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

      <TableContainer component={Paper}>
        <Table
          aria-label="Exams timetable"
          style={{ fontFamily: "Roboto", fontSize: "16px" }}
        >
          <TableHead style={{ backgroundColor: "#4D4DFF33" }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Exam Code(s)</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Venue(s)</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item: any) => (
              <TableRow key={item.exam_id}>
                <TableCell>
                  {new Date(item.date).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  {item.exam_code.split(",").length > 1 ? (
                    <Tooltip
                      content={ReactHtmlParser(
                        item.exam_code.split(",").join("<br />")
                      )}
                      placement="bottom"
                    >
                      <span className="cursor-pointer underline">
                        {item.exam_code.split(",")[0]}
                      </span>
                    </Tooltip>
                  ) : (
                    item.exam_code.split(",")[0]
                  )}
                </TableCell>
                <TableCell>{item.start_time}</TableCell>
                <TableCell>{item.end_time}</TableCell>
                <TableCell>
                  {item.venue.split(",").length > 1 ? (
                    <Tooltip
                      content={ReactHtmlParser(
                        item.venue.split(",").join("<br />")
                      )}
                      placement="bottom"
                    >
                      <span className="cursor-pointer underline">
                        {item.venue.split(",")[0]}
                      </span>
                    </Tooltip>
                  ) : (
                    item.venue.split(",")[0]
                  )}
                </TableCell>
                <TableCell>{item.year}</TableCell>
                <TableCell>
                  <Tooltip content="View">
                    <FiEye
                      size={20}
                      className="cursor-pointer hover:opacity-60"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleView(item)}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            {pages > 1 && (
              <TableRow>
                <TableCell style={{ padding: "20px 0" }} colSpan={7}>
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
        </Table>
      </TableContainer>

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
