"use client"

import React, { useState, useMemo } from 'react';
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
} from '@nextui-org/react';
import useSWR from 'swr';
import { getExamsSchedule } from '@/lib/actions/exams.action';
import ReactHtmlParser from 'react-html-parser';


type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type ExamsTimetableProps = {
  examNames: ExamName[];
};

export default function ExamsTimetable({ examNames }: ExamsTimetableProps) {
  const [selectedId, setSelectedId] = useState(examNames.length > 0 ? examNames[0].exam_name_id : "");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const { data: examsData = [], mutate, isLoading } = useSWR(
    `examsSchedule/${selectedId}`,
    () => getExamsSchedule(selectedId)
  );

  const pages = Math.ceil(examsData?.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return examsData?.slice(start, end);
  }, [page, examsData]);

  const onExamNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(event.target.value);
    mutate();
    setPage(1);
  };

  const loadingState = isLoading ? 'loading' : 'idle';
  const isEmpty = examsData.length === 0 && !isLoading;

  return (
    <div className='my-4 w-full'>
      <div className='flex justify-center items-center'>
        <Select
          label='Exam Name'
          items={examNames}
          onChange={onExamNameChange}
          defaultSelectedKeys={examNames.length > 0 && [examNames[0].exam_name_id] || []}
          placeholder='Select Exam Name'
          className='my-2'
          disallowEmptySelection
        >
          {(examName) => (
            <SelectItem key={examName.exam_name_id} value={examName.exam_name_id}>
              {examName.exam_name}
            </SelectItem>
          )}
        </Select>
      </div>

      <Table
        isStriped
        aria-label='Exams timetable'
        bottomContent={
          pages > 0 ? (
            <div className='flex w-full justify-center'>
              <Pagination
                isCompact
                showControls
                showShadow
                color='primary'
                page={page}
                total={pages}
                onChange={(page) => setPage(page)}
              />
            </div>
          ) : null
        }
        fullWidth
    
      >
        <TableHeader>
          <TableColumn key='date'>Date</TableColumn>
          <TableColumn key='exam_code'>Exam Code</TableColumn>
          <TableColumn key='start_time'>Start Time</TableColumn>
          <TableColumn key='end_time'>End Time</TableColumn>
          <TableColumn key='venue'>Venue</TableColumn>
          <TableColumn key='year'>Year</TableColumn>
        </TableHeader>

        {isEmpty ? (
          <TableBody emptyContent={'No schedule for this exams.'}>{[]}</TableBody>
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
                    {columnKey === 'date'
                      ? new Date(item[columnKey]).toLocaleDateString('en-GB')
                      : columnKey === 'exam_code' || columnKey === 'venue'
                      ? item[columnKey].includes(',')
                        ? (
                       <Tooltip
  content={ReactHtmlParser(item[columnKey].split(',').join('<br />'))}
  placement='bottom'
>
  <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
    {item[columnKey].split(',')[0]}
  </span>
</Tooltip>
                        )
                        : item[columnKey]
                      : item[columnKey]}
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