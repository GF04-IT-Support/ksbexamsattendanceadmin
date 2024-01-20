"use client";

import React from "react";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import { useDateStore } from "@/zustand/store";
import { useStyles } from "@/lib/helpers/styles.helpers";

export default function TableDatePicker() {
  const setStartDate = useDateStore((state) => state.setStartDate);
  const setEndDate = useDateStore((state) => state.setEndDate);
  const startDate = useDateStore((state) => state.startDate);
  const endDate = useDateStore((state) => state.endDate);
  const classes = useStyles();

  const handleStartDateChange = (date: moment.Moment | null) => {
    const newDate = date ? date.toDate() : null;
    setStartDate(newDate);
  };

  const handleEndDateChange = (date: moment.Moment | null) => {
    const newDate = date ? date.toDate() : null;
    setEndDate(newDate);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DemoContainer components={["DatePicker"]}>
        <div className="max-[525px]:flex-row max-md:flex-col flex gap-5 items-center overflow-hidden py-2">
          <DatePicker
            label="From"
            value={startDate && moment(startDate)}
            onChange={handleStartDateChange}
            className={`${classes.datePicker} max-w-[200px]`}
          />
          <p> - </p>
          <DatePicker
            label="To"
            value={endDate && moment(endDate)}
            onChange={handleEndDateChange}
            className={`${classes.datePicker} max-w-[200px]`}
          />
        </div>
      </DemoContainer>
    </LocalizationProvider>
  );
}
