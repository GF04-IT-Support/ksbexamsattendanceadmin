"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Checkbox, FormControlLabel } from "@mui/material";
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
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CheckboxGroup,
  Checkbox as NextCheckbox,
  Chip,
} from "@nextui-org/react";
import { useStyles } from "@/lib/helpers/styles.helpers";
import { Button } from "@nextui-org/react";
import {
  fetchExamSessions,
  takeAttendance,
} from "@/lib/actions/attendance.action";
import ReactHtmlParser from "react-html-parser";
import SearchInput from "../inputs/SearchInput";
import { FaEllipsisV, FaFileAlt, FaRegChartBar } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";

const initialSelectedColumns = {
  date: true,
  start_time: true,
  staff_venue: true,
  staff_name: true,
  staff_role: true,
  attendance: true,
  weight: true,
};

const columnNames = {
  date: "Date",
  start_time: "Start Time",
  staff_venue: "Venue",
  staff_name: "Staff Name",
  staff_role: "Staff Role",
  attendance: "Attendance",
  weight: "Weight",
};

type ColumnKeys =
  | "date"
  | "start_time"
  | "staff_venue"
  | "staff_name"
  | "staff_role"
  | "attendance"
  | "weight";

export default function DateAndSessionSelector() {
  const classes = useStyles();
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [isRange, setIsRange] = useState(false);
  const [data, setData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState("staffName");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const attendanceOptions = ["N/A", "Present", "Absent"];
  const [attendanceFilter, setAttendanceFilter] = React.useState([
    "Present",
    "Absent",
    "N/A",
  ]);
  const [format, setFormat] = useState<any>("");
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedColumns, setSelectedColumns] = useState(
    initialSelectedColumns
  );

  const handleFetchClick = async () => {
    if (startDate) {
      setIsLoading(true);
      const start: any = new Date(
        startDate.toDate().setHours(0, 0, 0, 0)
      ).toISOString();
      const end: any = endDate
        ? new Date(endDate.toDate().setHours(0, 0, 0, 0)).toISOString()
        : null;
      try {
        const data: any = await fetchExamSessions(start, end);
        data.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setData(data);
      } catch (error: any) {
        throw new Error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      setFilteredData(data);
    }
  }, [data]);

  function getAttendanceStatus(attendanceStatus: any) {
    if (attendanceStatus[0]?.attendance_status === "Present") {
      return "Present";
    } else if (attendanceStatus[0]?.attendance_status === "Absent") {
      return "Absent";
    } else {
      return "N/A";
    }
  }

  function calculateWeight(date: Date, start_time: string) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 2;
    }

    let [hours, minutes] = start_time
      .replace(/AM|PM/i, "")
      .split(":")
      .map(Number);
    const period = start_time.toUpperCase().includes("PM") ? "PM" : "AM";

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const timeIn24HourFormat = hours + minutes / 60;

    if (timeIn24HourFormat >= 16) {
      return 1.5;
    }

    return 1;
  }

  const flattenedItems = useMemo(() => {
    const items = filteredData?.flatMap((item: any) =>
      item.sessions.flatMap((session: any) =>
        session.assignments.map((assignment: any) => ({
          ...item,
          index: Math.random(),
          staff_venue: session.venue.name,
          staff_name: assignment.staff.staff_name,
          staff_id: assignment.staff.staff_id,
          staff_role: assignment.staff.staff_role,
          attendance: getAttendanceStatus(assignment.staff.attendances),
          exam_session_id: session.exam_session_id,
          weight: calculateWeight(item.date, item.start_time),
        }))
      )
    );

    const uniqueItems = Array.from(new Set(items.map(JSON.stringify))).map(
      (item) => JSON.parse(item as string)
    );

    const filteredItems = uniqueItems.filter((item) =>
      attendanceFilter.includes(item.attendance)
    );

    filteredItems.sort((a: any, b: any) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      return a.staff_name.localeCompare(b.staff_name);
    });

    return filteredItems;
  }, [filteredData, attendanceFilter]);

  const pages = Math.ceil(
    (searchResults || flattenedItems)?.length / rowsPerPage
  );

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return (searchResults || flattenedItems)?.slice(start, end);
  }, [page, searchResults, flattenedItems]);

  const handleSearch = (query: string, type: string) => {
    let results = [];

    if (query === "") {
      setFilteredData(data);
      return;
    }

    if (type === "date") {
      const searchDate = new Date(query).toLocaleDateString("en-GB");

      results = flattenedItems.filter((item: any) => {
        const itemDate = new Date(item.date).toLocaleDateString("en-GB");

        return itemDate === searchDate;
      });
    } else if (type === "venue") {
      results = flattenedItems.filter((item: any) =>
        item.staff_venue.toLowerCase().includes(query.toLowerCase())
      );
    } else if (type === "staffName") {
      results = flattenedItems.filter((item: any) =>
        item.staff_name.toLowerCase().includes(query.toLowerCase())
      );
    }

    setSearchResults(results);
  };

  const handleMarkAttendance = async (action: string, item: any) => {
    try {
      const response = await takeAttendance(
        item.staff_id,
        item.exam_session_id,
        action
      );
      if (response.message === "Attendance taken successfully") {
        await handleFetchClick();
      }
    } catch (error: any) {
      throw new Error(error);
    }
  };

  const handleColumnSelect = (newSelectedColumns: string[]) => {
    setSelectedColumns((prevState) => {
      const newState = { ...prevState };
      for (const key in newState) {
        newState[key as ColumnKeys] = newSelectedColumns.includes(key);
      }
      return newState;
    });
  };

  const handleDownloadReport = (format: "pdf" | "excel") => {
    const selectedColumnKeys = (
      Object.keys(selectedColumns) as ColumnKeys[]
    ).filter((key) => selectedColumns[key]);

    const tableColumn = selectedColumnKeys.map((key) => columnNames[key]);
    const tableRows: any = [];
    const excelRows: any = [];

    flattenedItems.forEach((item: any) => {
      const itemData = selectedColumnKeys.map((column) => {
        if (column === "date") {
          return new Date(item[column]).toLocaleDateString("en-GB");
        }
        return item[column];
      });
      tableRows.push(itemData);

      const excelData: any = {};
      selectedColumnKeys.forEach((column, index) => {
        excelData[tableColumn[index]] = itemData[index];
      });
      excelRows.push(excelData);
    });

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
      });
      doc.save("report.pdf");
    } else if (format === "excel") {
      const worksheet = utils.json_to_sheet(excelRows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Report");
      writeFile(workbook, "report.xlsx");
    }

    setSelectedColumns(initialSelectedColumns);
    onClose();
  };

  const handleDownloadSummary = (format: "pdf" | "excel") => {
    const summaryData = flattenedItems.reduce((acc: any, item: any) => {
      const key = `${item.staff_name}-${item.staff_role}`;
      if (!acc[key]) {
        acc[key] = {
          staff_name: item.staff_name,
          staff_role: item.staff_role,
          weight_sum: 0,
        };
      }
      acc[key].weight_sum += item.weight;
      return acc;
    }, {});

    const summaryArray = Object.values(summaryData);

    const tableColumn = ["Staff Name", "Staff Role", "Weight Sum"];
    const tableRows = summaryArray.map((item: any) => [
      item.staff_name,
      item.staff_role,
      item.weight_sum,
    ]);

    const excelRows = summaryArray.map((item: any) => ({
      "Staff Name": item.staff_name,
      "Staff Role": item.staff_role,
      "Weight Sum": item.weight_sum,
    }));

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
      });
      doc.save("summary.pdf");
    } else if (format === "excel") {
      const worksheet = utils.json_to_sheet(excelRows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Summary");
      writeFile(workbook, "summary.xlsx");
    }
  };

  const loadingState = isLoading ? "loading" : "idle";
  const isDisabled = startDate === null;
  const isDownloadReportDisabled = flattenedItems.length === 0;
  const isEmpty = (searchResults || flattenedItems).length === 0 && !isLoading;

  return (
    <div className="pb-4">
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
              <ModalHeader>
                Select the Columns to be printed in Report
              </ModalHeader>
              <ModalBody>
                <CheckboxGroup
                  // orientation="horizontal"
                  aria-label="Select Columns"
                  value={Object.keys(selectedColumns).filter(
                    (key) => selectedColumns[key as ColumnKeys]
                  )}
                  onValueChange={handleColumnSelect}
                >
                  {Object.keys(selectedColumns).map((column: string) => (
                    <NextCheckbox key={column} value={column}>
                      {columnNames[column as ColumnKeys]}
                    </NextCheckbox>
                  ))}
                </CheckboxGroup>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onClose}>Close</Button>
                <Button
                  color="primary"
                  onClick={() => handleDownloadReport(format)}
                  disabled={isDownloadReportDisabled}
                >
                  Download
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="flex justify-between">
        <div className="flex gap-5 justify-center items-center overflow-hidden py-2 pb-4">
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label={isRange ? "From" : "Date"}
              value={startDate}
              onChange={(date) => setStartDate(date)}
              className={`${classes.datePicker} w-[200px]`}
            />
            {isRange && (
              <>
                <p> - </p>
                <DatePicker
                  label="To"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  className={`${classes.datePicker} w-[200px]`}
                />
              </>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRange}
                  onChange={() => setIsRange(!isRange)}
                  color="primary"
                />
              }
              label=""
            />
            <Button
              color={`${isDisabled ? "default" : "primary"}`}
              disabled={isDisabled}
              onClick={handleFetchClick}
            >
              {isLoading ? <Spinner size="sm" color="default" /> : "Fetch"}
            </Button>
          </LocalizationProvider>
        </div>

        <div className="flex gap-4 justify-end my-4">
          <Dropdown>
            <DropdownTrigger>
              <Button
                startContent={<FaFileAlt />}
                color={`${isDownloadReportDisabled ? "default" : "primary"}`}
                disabled={isDownloadReportDisabled}
              >
                Download Report
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Report Format">
              <DropdownItem
                key="pdf"
                onClick={() => {
                  setFormat("pdf");
                  onOpen();
                }}
              >
                PDF
              </DropdownItem>
              <DropdownItem
                key="excel"
                onClick={() => {
                  setFormat("excel");
                  onOpen();
                }}
              >
                Excel
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button
                startContent={
                  <FaRegChartBar
                    className={`${!isDownloadReportDisabled && "text-white"}`}
                  />
                }
                color={`${isDownloadReportDisabled ? "default" : "success"}`}
                disabled={isDownloadReportDisabled}
                className={`${!isDownloadReportDisabled && "text-white"}`}
              >
                Download Summary
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Summary Format">
              <DropdownItem
                key="pdf"
                onClick={() => handleDownloadSummary("pdf")}
              >
                PDF
              </DropdownItem>
              <DropdownItem
                key="excel"
                onClick={() => handleDownloadSummary("excel")}
              >
                Excel
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="flex justify-between">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          handleSearch={handleSearch}
          setSearchResults={setSearchResults}
          isStaffSearch
        />

        <div className="pt-5">
          <Select
            label="Attendance Status"
            selectionMode="multiple"
            placeholder="Select attendance status"
            selectedKeys={attendanceFilter}
            className="w-[220px]"
            onSelectionChange={(keys: any) =>
              setAttendanceFilter(Array.from(keys))
            }
            disallowEmptySelection
          >
            {attendanceOptions.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <Table
        // isStriped
        aria-label="Exams timetable"
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
          <TableColumn key="date">Date</TableColumn>
          <TableColumn key="start_time">Start Time</TableColumn>
          <TableColumn key="staff_venue">Venue</TableColumn>
          {/* <TableColumn key="exam_code">Exam Code(s)</TableColumn> */}
          <TableColumn key="staff_name">Staff Name</TableColumn>
          <TableColumn key="staff_role">Staff Role</TableColumn>
          <TableColumn key="attendance">Attendance</TableColumn>
          <TableColumn key="weight">Weight</TableColumn>
          <TableColumn key="action">Action</TableColumn>
        </TableHeader>

        {isEmpty ? (
          <TableBody emptyContent={"No Data."}>{[]}</TableBody>
        ) : (
          <TableBody
            loadingContent={<Spinner />}
            loadingState={loadingState}
            items={items}
            aria-colspan={3}
          >
            {(item: any) => (
              <TableRow key={item.index}>
                {(columnKey) => (
                  <TableCell>
                    {columnKey === "date" ? (
                      <>
                        <div>
                          {new Date(item.date).toLocaleDateString("en-GB")}
                        </div>
                        {/* <div className="text-[12px]  text-gray-500">{`${item.start_time} - ${item.end_time}`}</div> */}
                      </>
                    ) : columnKey === "exam_code" ? (
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
                    ) : columnKey === "attendance" ? (
                      <Chip
                        color={
                          item[columnKey] === "Present"
                            ? "success"
                            : item[columnKey] === "Absent"
                            ? "danger"
                            : "default"
                        }
                      >
                        {item[columnKey]}
                      </Chip>
                    ) : columnKey === "action" ? (
                      <Dropdown aria-label="Actions">
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <FaEllipsisV />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            onClick={() =>
                              handleMarkAttendance("Present", item)
                            }
                          >
                            Mark Present
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => handleMarkAttendance("Absent", item)}
                          >
                            Mark Absent
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
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
    </div>
  );
}
