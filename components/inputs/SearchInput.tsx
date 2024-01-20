"use client";

import { useEffect, useState } from "react";
import { Input, Select, SelectItem } from "@nextui-org/react";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import { FiSearch } from "react-icons/fi";
import { useStyles } from "@/lib/helpers/styles.helpers";

type SearchInputProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  setSearchResults: (results: any) => void;
  handleSearch: (query: string, type: string) => void;
  isStaffSearch?: boolean;
};

export default function SearchInput({
  isStaffSearch,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  setSearchResults,
}: SearchInputProps) {
  const [typingTimeout, setTypingTimeout] = useState(0);
  const classes = useStyles();

  const searchTypes = [
    {
      id: "date",
      label: "Date",
    },
    {
      id: isStaffSearch ? "staffName" : "examCode",
      label: isStaffSearch ? "Staff Name" : "Exam Code",
    },
    {
      id: "venue",
      label: "Venue",
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;

    setSearchQuery(newQuery);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      window.setTimeout(() => handleSearch(newQuery, searchType), 300)
    );
  };

  const handleDateChange = (date: moment.Moment | Date | null) => {
    if (date) {
      const newQuery = date.toISOString().split("T")[0];
      setSearchQuery(newQuery);
      handleSearch(newQuery, searchType);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  useEffect(() => {
    setSearchResults(null);
    setSearchQuery("");
  }, [searchType]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults(null);
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col max-sm:flex-row gap-2 items-center justify-start min-[525px]:my-6 md:flex-row md:items-end">
      {searchType === "date" ? (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DemoContainer components={["DatePicker"]}>
            <div className="overflow-hidden py-2">
              <DatePicker
                value={
                  searchQuery.length > 0 ? moment(new Date(searchQuery)) : null
                }
                label="Search"
                onChange={handleDateChange}
                className={`${classes.datePicker} w-full md:w-[200px]`}
              />
            </div>
          </DemoContainer>
        </LocalizationProvider>
      ) : (
        <Input
          id="searchInput"
          isClearable
          startContent={
            <FiSearch
              size={26}
              className="pr-2 pt-1 text-default-400 pointer-events-none flex-shrink-0"
            />
          }
          value={searchQuery}
          onChange={handleInputChange}
          onClear={clearSearch}
          placeholder="Search..."
          className="w-[200px]"
        />
      )}

      <Select
        label="Search By"
        items={searchTypes}
        placeholder="Select Search Type"
        defaultSelectedKeys={[searchType]}
        disallowEmptySelection
        value={searchType}
        onChange={(e: any) => setSearchType(e.target.value)}
        className="w-[200px]"
      >
        {searchTypes.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
