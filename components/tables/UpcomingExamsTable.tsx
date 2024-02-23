"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pagination, Select, SelectItem, Tooltip } from "@nextui-org/react";
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
import ReactHtmlParser from "react-html-parser";
import SearchInput from "../inputs/SearchInput";
import CollapsibleStaffList from "../shared/CollapsibleStaffList";

const STAFF_TYPES = [
  { label: "Invigilators", value: "invigilators" },
  { label: "Security", value: "security" },
  { label: "Nurses", value: "nurses" },
  { label: "IT Support", value: "itSupport" },
  { label: "Administrative", value: "administrative" },
];

function UpcomingExamsTable({ upcomingExams }: any) {
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);
  const [filteredExamsData, setFilteredExamsData] =
    useState<any>(upcomingExams);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchType, setSearchType] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  // const [selections, setSelections] = useState<any>({});

  const getInitialSelections = () => {
    const initialSelections: any = {};
    upcomingExams.forEach((exam: any) => {
      const venues = exam.venue.split(","); // Split the venue string into an array
      const initialVenue = venues.length > 0 ? venues[0].trim() : null; // Use the first venue as the initial venue
      const initialStaffType =
        STAFF_TYPES.length > 0 ? STAFF_TYPES[0].value : null; // Use the first staff type as the initial staff type
      initialSelections[exam.exam_id] = {
        selectedVenue: initialVenue,
        selectedStaffType: initialStaffType,
      };
    });
    return initialSelections;
  };

  const [selections, setSelections] = useState<any>(getInitialSelections());

  useEffect(() => {
    setSelections(getInitialSelections());
  }, [upcomingExams]);

  const pages = Math.ceil(
    (searchResults || filteredExamsData)?.length / rowsPerPage
  );

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return (searchResults || filteredExamsData)?.slice(start, end);
  }, [page, searchResults, filteredExamsData]);

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

  const handleVenueChange = (examId: any, selectedVenue: any) => {
    setSelections((prev: any) => ({
      ...prev,
      [examId]: { ...prev[examId], selectedVenue, selectedStaffType: null },
    }));
  };

  const handleStaffTypeChange = (examId: any, selectedStaffType: any) => {
    setSelections((prev: any) => ({
      ...prev,
      [examId]: { ...prev[examId], selectedStaffType },
    }));
  };

  const getUniqueVenues = (venueString: string) => {
    const venuesArray = venueString.split(",").map((venue) => venue.trim());
    const uniqueVenues = Array.from(new Set(venuesArray));
    return uniqueVenues;
  };

  const getFilteredStaff = (
    sessions: any,
    selectedVenue: any,
    selectedStaffType: any
  ) => {
    for (const session of sessions) {
      if (session.venue.name === selectedVenue) {
        return session.assignments
          .filter((assignment: any) => assignment.role === selectedStaffType)
          .map((assignment: any) => assignment.staff.staff_name);
      }
    }
    return [];
  };

  const isEmpty = (searchResults || filteredExamsData).length === 0;

  return (
    <div className="pb-4">
      <div className="border-b-2 border-gray-200 py-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Upcoming Exams</h2>
      </div>

      <SearchInput
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchType={searchType}
        setSearchType={setSearchType}
        handleSearch={handleSearch}
        setSearchResults={setSearchResults}
      />

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
                Date
              </TableCell>
              <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                Exam Code(s)
              </TableCell>
              <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                Start Time
              </TableCell>
              <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                Venue(s)
              </TableCell>
              <TableCell style={{ color: "#71717A", fontWeight: 600 }}>
                Staff Type
              </TableCell>
              <TableCell
                style={{
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                  color: "#71717A",
                  fontWeight: 600,
                }}
              >
                Staff Names
              </TableCell>
            </TableRow>
          </TableHead>

          {isEmpty ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="font-[500] text-lg">No Upcoming Exams</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.exam_id}>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell>
                    {item.exam_code.includes(",") ? (
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
                      item.exam_code
                    )}
                  </TableCell>
                  <TableCell>{item.start_time}</TableCell>
                  <TableCell>
                    <Select
                      aria-label="Venue"
                      disallowEmptySelection
                      defaultSelectedKeys={[
                        selections[item.exam_id]?.selectedVenue,
                      ]}
                      onChange={(e) =>
                        handleVenueChange(item.exam_id, e.target.value)
                      }
                    >
                      {item.venue.split(",").map((venue: string) => (
                        <SelectItem key={venue} value={venue.trim()}>
                          {venue.trim()}
                        </SelectItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    {selections[item.exam_id]?.selectedVenue && (
                      <Select
                        aria-label="Staff Type"
                        disallowEmptySelection
                        defaultSelectedKeys={[
                          selections[item.exam_id]?.selectedStaffType,
                        ]}
                        onChange={(e) =>
                          handleStaffTypeChange(item.exam_id, e.target.value)
                        }
                      >
                        {STAFF_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <CollapsibleStaffList
                      staffNames={getFilteredStaff(
                        item.sessions,
                        selections[item.exam_id]?.selectedVenue,
                        selections[item.exam_id]?.selectedStaffType
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}

          <TableFooter>
            {pages > 1 && (
              <TableRow>
                <TableCell style={{ padding: "20px 0" }} colSpan={6}>
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
    </div>
  );
}

export default UpcomingExamsTable;
