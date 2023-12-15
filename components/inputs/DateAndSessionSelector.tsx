"use client";

import React, { useEffect, useState } from "react";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Card,
  Grid,
} from "@mui/material";
import { useStyles } from "@/lib/helpers/styles.helpers";
import { Button } from "@nextui-org/react";
import { fetchExamSessions } from "@/lib/actions/attendance.action";
import { Tooltip } from "@nextui-org/react";
import ReactHtmlParser from "react-html-parser";

export default function DateAndSessionSelector() {
  const classes = useStyles();
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [isRange, setIsRange] = useState(false);
  const [sessions, setSessions] = useState<any>([]);
  const [selectedDates, setSelectedDates] = useState<any>([]);
  const [selectedCodes, setSelectedCodes] = useState<any>([]);
  const [selectedTimes, setSelectedTimes] = useState<any>([]);
  const [dates, setDates] = useState<any>([]);
  const [codes, setCodes] = useState<any>([]);
  const [times, setTimes] = useState<any>([]);

  const handleFetchClick = async () => {
    if (startDate) {
      const start: any = new Date(
        startDate.toDate().setHours(0, 0, 0, 0)
      ).toISOString();
      const end: any = endDate
        ? new Date(endDate.toDate().setHours(0, 0, 0, 0)).toISOString()
        : null;
      try {
        const sessions = await fetchExamSessions(start, end);
        setSessions(sessions);
      } catch (error: any) {
        throw new Error(error);
      } finally {
        setSelectedDates([]);
        setSelectedCodes([]);
        setSelectedTimes([]);
      }
    }
  };

  useEffect(() => {
    if (!isRange) {
      setEndDate(null);
    }
  }, [isRange]);

  useEffect(() => {
    if (sessions.length > 0) {
      const filteredSessions = sessions.filter((session: any) => {
        const dateStr = new Date(session.date).toISOString().split("T")[0];
        const time = `${session.start_time} - ${session.end_time}`;
        return (
          (selectedDates.length === 0 ||
            (selectedCodes.length > 0 && selectedDates.includes(dateStr)) ||
            (selectedCodes.length === 0 && selectedDates.includes(dateStr))) &&
          (selectedCodes.length === 0 ||
            selectedCodes.includes(session.exam_code)) &&
          (selectedTimes.length === 0 || selectedTimes.includes(time))
        );
      });

      setDates(
        filteredSessions
          .sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .reduce((unique: any[], session: any) => {
            const dateStr = session.date.toISOString().split("T")[0];
            return unique.includes(dateStr) ? unique : [...unique, dateStr];
          }, [])
      );

      setCodes(
        filteredSessions.reduce(
          (unique: any, session: any) =>
            unique.includes(session.exam_code)
              ? unique
              : [...unique, session.exam_code],
          []
        )
      );

      setTimes(
        filteredSessions.reduce((unique: any, session: any) => {
          const time = `${session.start_time} - ${session.end_time}`;
          return unique.includes(time) ? unique : [...unique, time];
        }, [])
      );
    }
  }, [sessions, selectedDates, selectedCodes, selectedTimes]);

  const handleCheckboxChange = (
    value: any,
    selectedValues: any,
    setSelectedValues: any
  ) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v: any) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newSelectedValues);
  };

  const chunk = (arr: any[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  const chunkedCodes = chunk(codes, 5);

  useEffect(() => {
    if (
      selectedDates.length > 0 &&
      selectedCodes.length > 0 &&
      selectedTimes.length > 0
    ) {
      console.log(selectedDates, selectedCodes, selectedTimes);
    }
  }, [selectedDates, selectedCodes, selectedTimes]);

  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <div className="flex gap-5 items-center overflow-hidden py-2">
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
            label="Select Range"
          />
          <Button color="primary" onClick={handleFetchClick}>
            Fetch
          </Button>
        </div>
      </LocalizationProvider>

      <div className="flex flex-row justify-between">
        <List>
          <Card>
            {dates.map((date: Date, index: number) => (
              <ListItem key={index}>
                <Checkbox
                  checked={selectedDates.includes(date)}
                  onChange={() =>
                    handleCheckboxChange(date, selectedDates, setSelectedDates)
                  }
                />
                <ListItemText
                  primary={new Date(date).toLocaleDateString("en-GB")}
                />
              </ListItem>
            ))}
          </Card>
        </List>

        <Card>
          <div className="flex flex-wrap">
            {chunkedCodes.map((codeChunk: any[], index: number) => (
              <div key={index}>
                {codeChunk.map((code: any) => {
                  const codeList = code.split(",");
                  const hasComma = code.includes(",");
                  return (
                    <ListItem key={code}>
                      <Checkbox
                        checked={selectedCodes.includes(code)}
                        onChange={() =>
                          handleCheckboxChange(
                            code,
                            selectedCodes,
                            setSelectedCodes
                          )
                        }
                      />
                      {hasComma ? (
                        <Tooltip
                          content={ReactHtmlParser(codeList.join("<br />"))}
                          placement="bottom"
                        >
                          <span className="cursor-pointer underline">
                            <ListItemText primary={codeList[0]} />
                          </span>
                        </Tooltip>
                      ) : (
                        <ListItemText primary={codeList[0]} />
                      )}
                    </ListItem>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <List>
          <Card>
            {times.map((time: any) => (
              <ListItem key={time}>
                <Checkbox
                  checked={selectedTimes.includes(time)}
                  onChange={() =>
                    handleCheckboxChange(time, selectedTimes, setSelectedTimes)
                  }
                />
                <ListItemText primary={time} />
              </ListItem>
            ))}
          </Card>
        </List>
      </div>
    </div>
  );
}
