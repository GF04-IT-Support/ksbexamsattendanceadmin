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
import { Button, Checkbox as AttendanceCheckbox } from "@nextui-org/react";
import {
  fetchExamSessions,
  takeAttendance,
} from "@/lib/actions/attendance.action";
import ReactHtmlParser from "react-html-parser";
import SearchInput from "../inputs/SearchInput";
import { FaFileAlt, FaRegChartBar } from "react-icons/fa";
import { utils, writeFile } from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { sortDataByStartTime } from "@/lib/helpers/date.helpers";
import { getStaffRoles } from "@/lib/helpers/staff.helpers";
import toast, { Toaster } from "react-hot-toast";
import moment from "moment";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

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

const attendanceOptions = ["N/A", "Present"];

const staffTypeOptions = [
  "invigilators",
  "security",
  "nurses",
  "itSupport",
  "administrative",
];

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
  const [attendanceFilter, setAttendanceFilter] = useState(["Present"]);
  const [staffTypeFilter, setStaffTypeFilter] = useState(staffTypeOptions);
  const [format, setFormat] = useState<any>("");
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedColumns, setSelectedColumns] = useState(
    initialSelectedColumns
  );

  useEffect(() => {
    setStartDate(moment(new Date()));
  }, []);

  const handleFetchClick = async () => {
    if (startDate) {
      setFilteredData([]);
      setIsLoading(true);
      const start: any = new Date(
        startDate.toDate().setHours(0, 0, 0, 0)
      ).toISOString();
      const end: any = endDate
        ? new Date(endDate.toDate().setHours(0, 0, 0, 0)).toISOString()
        : null;
      try {
        const data: any = await fetchExamSessions(start, end);
        if (data.length > 0) {
          const sortedData = sortDataByStartTime([...data]);
          setData(sortedData);
        } else {
          setData([]);
        }
      } catch (error: any) {
        throw new Error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isRange) {
      if (startDate && endDate) {
        handleFetchClick();
      }
    } else {
      if (startDate) {
        setEndDate(null);
        handleFetchClick();
      }
    }
  }, [startDate, endDate, isRange]);

  const examNames = useMemo(() => {
    const examNames = data.map((session: any) => session.exam_name.exam_name);

    const uniqueExamNames = Array.from(new Set(examNames));

    return uniqueExamNames;
  }, [data]);

  useEffect(() => {
    setFilteredData(data);
    setSearchResults(null);
    setSearchQuery("");
  }, [data]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch(searchQuery, searchType);
    }
  }, [filteredData, attendanceFilter, staffTypeFilter]);

  function getAttendanceStatus(attendanceStatus: any) {
    if (attendanceStatus[0]?.attendance_status === "Present") {
      return "Present";
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

    if (timeIn24HourFormat >= 17) {
      return 2;
    }

    if (timeIn24HourFormat >= 16 && timeIn24HourFormat < 17) {
      return 2;
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

    const combinedStaffRoles = staffTypeFilter.flatMap((role) =>
      getStaffRoles(role)
    );

    const filteredItems = uniqueItems.filter(
      (item) =>
        attendanceFilter.includes(item.attendance) &&
        combinedStaffRoles.includes(item.staff_role)
    );
    filteredItems.sort((a: any, b: any) => {
      const nameComparison = a.staff_name.localeCompare(b.staff_name);
      if (nameComparison !== 0) return nameComparison;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      return 0;
    });

    return filteredItems;
  }, [filteredData, attendanceFilter, staffTypeFilter]);

  const summarizedData = useMemo(() => {
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

    const combinedStaffRoles = staffTypeFilter.flatMap((role) =>
      getStaffRoles(role)
    );

    const filteredItems = uniqueItems.filter(
      (item) =>
        ["Present", "N/A"].includes(item.attendance) &&
        combinedStaffRoles.includes(item.staff_role)
    );
    filteredItems.sort((a: any, b: any) => {
      const nameComparison = a.staff_name.localeCompare(b.staff_name);
      if (nameComparison !== 0) return nameComparison;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;

      return 0;
    });

    return filteredItems;
  }, [filteredData, staffTypeFilter]);

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

  const handleMarkAttendance = async (checked: boolean, item: any) => {
    try {
      const status = checked ? "Present" : null;

      const response = await takeAttendance(
        item.staff_id,
        item.exam_session_id,
        status
      );
      if (response.message === "Attendance taken successfully" && checked) {
        toast.success("Attendance Taken Successfully");
      }
      const start: any = new Date(
        startDate.toDate().setHours(0, 0, 0, 0)
      ).toISOString();
      const end: any = endDate
        ? new Date(endDate.toDate().setHours(0, 0, 0, 0)).toISOString()
        : null;
      try {
        const data: any = await fetchExamSessions(start, end);
        if (data.length > 0) {
          const sortedData = sortDataByStartTime([...data]);
          setFilteredData(sortedData);
        }
      } catch (error: any) {
        throw new Error(error);
      }
    } catch (error: any) {
      console.error("Error in handleMarkAttendance:", error);
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
    const cleanedExamNames = examNames.map((name: any) =>
      name.replace(/\s*\(.*?\)\s*/g, "").replace(/academic year.*$/i, "")
    );
    const headerExamName =
      cleanedExamNames.length > 0 ? cleanedExamNames[0] : "";

    const selectedColumnKeys = (
      Object.keys(selectedColumns) as ColumnKeys[]
    ).filter((key) => selectedColumns[key]);

    const tableColumn = [
      "SN",
      ...selectedColumnKeys.map((key) => columnNames[key]),
    ];
    const tableRows: any = [];
    const excelRows: any = [];

    flattenedItems.forEach((item: any, index: number) => {
      const itemData = [
        index + 1,
        ...selectedColumnKeys.map((column) => {
          if (column === "date") {
            return new Date(item[column]).toLocaleDateString("en-GB");
          }
          return item[column];
        }),
      ];
      tableRows.push(itemData);

      const excelData: any = { SN: index + 1 };
      selectedColumnKeys.forEach((column, columnIndex) => {
        excelData[tableColumn[columnIndex + 1]] = itemData[columnIndex + 1];
      });
      excelRows.push(excelData);
    });

    const columnWidths = tableColumn.map((columnName) =>
      columnName === "Staff Name" ? "*" : "auto"
    );

    if (format === "pdf") {
      const docDefinition = {
        content: [
          {
            text: [
              {
                text: "KNUST SCHOOL OF BUSINESS",
                style: {
                  fontSize: 18,
                  bold: true,
                  color: "blue",
                },
              },
              "\n",
              {
                text: `${headerExamName}`,
                style: {
                  fontSize: 14,
                  bold: true,
                },
              },
              "\n",
              {
                text: "EXAMINATION STAFF ATTENDANCE REPORT",
                style: { color: "red", fontSize: 14, bold: true },
              },
              "\n",
              `(${staffTypeFilter.join(", ").toUpperCase()})\n\n`,
            ],
            alignment: "center",
          },
          {
            table: {
              widths: columnWidths,
              headerRows: 1,
              body: [
                tableColumn.map((column) => ({
                  text: column,
                  style: { bold: true },
                })),
                ...tableRows,
              ],
            },
          },
        ],
      };

      pdfMake
        .createPdf(docDefinition as any)
        .download(
          `${headerExamName} ATTENDANCE REPORT(${startDate
            .toDate()
            .toLocaleDateString("en-GB")}${
            endDate ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}` : ""
          }).pdf`
        );
    } else if (format === "excel") {
      const workbook = utils.book_new();
      const worksheet = utils.aoa_to_sheet([]);

      worksheet["D1"] = {
        v: "KNUST SCHOOL OF BUSINESS",
      };
      worksheet["C2"] = { v: headerExamName };
      worksheet["D3"] = { v: "EXAMINATION STAFF ATTENDANCE REPORT" };
      worksheet["C4"] = { v: `(${staffTypeFilter.join(", ").toUpperCase()})` };

      utils.sheet_add_aoa(worksheet, [tableColumn], { origin: "A6" });

      utils.sheet_add_json(worksheet, excelRows, {
        origin: "A7",
        skipHeader: true,
      });

      const maxLengths = tableColumn.map((column) => {
        return Math.max(
          ...excelRows.map((row: any) => row[column]?.toString().length || 0),
          column.length
        );
      });

      worksheet["!cols"] = maxLengths.map((maxLen) => ({
        wch: maxLen + 2,
      }));

      utils.book_append_sheet(workbook, worksheet, "Report");
      writeFile(
        workbook,
        `${headerExamName} ATTENDANCE REPORT (${startDate
          .toDate()
          .toLocaleDateString("en-GB")}${
          endDate ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}` : ""
        }).xlsx`
      );
    }

    setSelectedColumns(initialSelectedColumns);
    onClose();
  };

  const handleDownloadSummary = (format: "pdf" | "excel") => {
    const cleanedExamNames = examNames.map((name: any) =>
      name.replace(/\s*\(.*?\)\s*/g, "").replace(/academic year.*$/i, "")
    );
    const headerExamName =
      cleanedExamNames.length > 0 ? cleanedExamNames[0] : "";

    const summaryData = summarizedData.reduce((acc: any, item: any) => {
      const key = `${item.staff_name}-${item.staff_role}`;
      if (!acc[key]) {
        acc[key] = {
          sn: 0,
          staff_name: item.staff_name,
          staff_role: item.staff_role,
          weight_sum: 0,
          attendance_count: 0,
          sessions_assigned: 0,
        };
      }
      if (item.attendance === "Present") {
        acc[key].weight_sum += item.weight;
      }
      acc[key].attendance_count += item.attendance === "Present" ? 1 : 0;
      acc[key].sessions_assigned += 1;
      return acc;
    }, {});

    const summaryArray = Object.values(summaryData);

    summaryArray.forEach((item: any, index: number) => {
      item.sn = index + 1;
    });

    const tableColumn = [
      "SN",
      "Staff Name",
      "Staff Role",
      "Weight Sum",
      "Attendance Count",
      "Sessions Assigned",
    ];
    const tableRows = summaryArray.map((item: any) => [
      item.sn,
      item.staff_name,
      item.staff_role,
      item.weight_sum,
      item.attendance_count,
      item.sessions_assigned,
    ]);

    const excelRows = summaryArray.map((item: any) => ({
      SN: item.sn,
      "Staff Name": item.staff_name,
      "Staff Role": item.staff_role,
      "Weight Sum": item.weight_sum,
      "Attendance Count": item.attendance_count,
      "Sessions Assigned": item.sessions_assigned,
    }));

    if (format === "pdf") {
      const docDefinition = {
        content: [
          {
            text: [
              {
                text: "KNUST SCHOOL OF BUSINESS",
                style: {
                  fontSize: 18,
                  bold: true,
                  color: "blue",
                },
              },
              "\n",
              {
                text: `${headerExamName}`,
                style: {
                  fontSize: 14,
                  bold: true,
                },
              },
              "\n",
              {
                text: "EXAMINATION STAFF SUMMARY REPORT",
                style: { color: "red", fontSize: 14, bold: true },
              },
              "\n",
              `(${staffTypeFilter.join(", ").toUpperCase()})\n`,
              `${startDate.toDate().toLocaleDateString("en-GB")}${
                endDate
                  ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}`
                  : ""
              }\n\n`,
            ],
            alignment: "center",
          },
          {
            table: {
              widths: ["auto", "*", "*", "auto", "auto", "auto"],
              headerRows: 1,
              body: [
                tableColumn.map((column) => ({
                  text: column,
                  style: { bold: true },
                })),
                ...tableRows,
              ],
            },
          },
          {
            text: [
              "\n",
              {
                text: "Total number of sessions: " + data.length,
                style: "footer",
              },
            ],
            alignment: "right",
          },
        ],
      };

      pdfMake
        .createPdf(docDefinition as any)
        .download(
          `${headerExamName} SUMMARY REPORT (${startDate
            .toDate()
            .toLocaleDateString("en-GB")}${
            endDate ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}` : ""
          }).pdf`
        );
    } else if (format === "excel") {
      const workbook = utils.book_new();
      const worksheet = utils.aoa_to_sheet([]);

      worksheet["C1"] = {
        v: "KNUST SCHOOL OF BUSINESS",
      };
      worksheet["B2"] = {
        v: headerExamName,
        s: { font: { sz: 18, bold: true } },
      };
      worksheet["C3"] = { v: "EXAMINATION STAFF SUMMARY REPORT" };
      worksheet["B4"] = { v: `(${staffTypeFilter.join(", ").toUpperCase()})` };
      worksheet["C5"] = {
        v: `${startDate.toDate().toLocaleDateString("en-GB")}${
          endDate ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}` : ""
        }`,
      };
      worksheet[`D6`] = {
        v: `Total number of sessions: ${data.length}`,
      };

      utils.sheet_add_aoa(worksheet, [tableColumn], { origin: "A8" });

      utils.sheet_add_json(worksheet, excelRows, {
        origin: "A8",
      });

      const maxLengths = tableColumn.map((column) => {
        return Math.max(
          ...excelRows.map((row: any) => row[column]?.toString().length || 0),
          column.length
        );
      });

      worksheet["!cols"] = maxLengths.map((maxLen) => ({
        wch: maxLen + 2,
      }));

      utils.book_append_sheet(workbook, worksheet, "Report");
      writeFile(
        workbook,
        `${headerExamName} SUMMARY REPORT (${startDate
          .toDate()
          .toLocaleDateString("en-GB")}${
          endDate ? ` - ${endDate.toDate().toLocaleDateString("en-GB")}` : ""
        }).xlsx`
      );
    }
  };

  const loadingState = isLoading ? "loading" : "idle";
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

      <div className="flex max-[812px]:flex-col flex-row justify-between">
        <div className="flex gap-2 justify-center items-center overflow-hidden py-2 pb-4">
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <div className="flex gap-3  max-[1200px]:flex-col">
              <DatePicker
                label={isRange ? "From" : "Date"}
                value={startDate}
                onChange={(date) => setStartDate(date)}
                className={`${classes.datePicker} max-[525px]:w-auto w-[200px]`}
              />
              {isRange && (
                <>
                  <DatePicker
                    label="To"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    className={`${classes.datePicker} max-[525px]:w-auto w-[200px]`}
                  />
                </>
              )}
            </div>
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
          </LocalizationProvider>
        </div>

        <div className="flex px-4 max-[525px]:flex-col gap-4 my-4 mt-2 justify-center items-center">
          <Toaster position="top-center" />
          <Dropdown>
            <DropdownTrigger>
              <Button
                startContent={<FaFileAlt />}
                color={`${isDownloadReportDisabled ? "default" : "primary"}`}
                disabled={isDownloadReportDisabled}
                className="max-[525px]:w-full"
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
                className={`${
                  !isDownloadReportDisabled && "text-white"
                } max-[525px]:w-full`}
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

      <div className="flex max-[1200px]:flex-col md:justify-between max-md:flex-col  gap-2 pb-4">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          handleSearch={handleSearch}
          setSearchResults={setSearchResults}
          isStaffSearch
        />

        <div className="flex gap-1 justify-center">
          <Select
            label="Attendance Status"
            selectionMode="multiple"
            placeholder="Select attendance status"
            selectedKeys={attendanceFilter}
            className="w-[180px]"
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

          <Select
            label="Staff Type"
            selectionMode="multiple"
            placeholder="Select Staff Type"
            selectedKeys={staffTypeFilter}
            onSelectionChange={(keys: any) =>
              setStaffTypeFilter(Array.from(keys))
            }
            className="w-[220px]"
            disallowEmptySelection
          >
            {staffTypeOptions.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
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
                      <AttendanceCheckbox
                        defaultSelected={item.attendance === "Present"}
                        color="success"
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleMarkAttendance(checked, item);
                        }}
                      ></AttendanceCheckbox>
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
