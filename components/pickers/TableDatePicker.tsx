"use client"

import React, { useState } from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import { useDateStore } from '@/zustand/store';

export default function TableDatePicker() {
  const setStartDate = useDateStore((state) => state.setStartDate);
  const setEndDate = useDateStore((state) => state.setEndDate);
  const startDate = useDateStore((state) => state.startDate);
  const endDate = useDateStore((state) => state.endDate);

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
      <DemoContainer components={['DatePicker']} >
        <div className='flex gap-5 items-center'>
        <DatePicker  value={startDate && moment(startDate)} onChange={handleStartDateChange}/>
        <p> - </p>
        <DatePicker value={endDate && moment(endDate)} onChange={handleEndDateChange} />
        </div>
      </DemoContainer>
    </LocalizationProvider>
  );
}