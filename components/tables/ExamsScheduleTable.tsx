"use client"

import React, { useState, useMemo, useEffect } from 'react';
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
  Button,
} from '@nextui-org/react';
import useSWR from 'swr';
import { Toaster } from 'react-hot-toast';

export default function ExamsScheduleTable() {
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const scheduleDetails:any = []
    const isLoading = false
   

    const pages = Math.ceil(scheduleDetails.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return scheduleDetails.slice(start, end);
  }, [page, scheduleDetails]);

  const loadingState = isLoading ? 'loading' : 'idle';
  const isEmpty = scheduleDetails.length === 0 && !isLoading;

  return (
     <div className='my-2 pb-6 w-full'>
      <Table
        isStriped
        aria-label='Exams timetable'
        bottomContent={
          pages > 1 && (
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
          ) 
        }
        classNames={{
            table: isLoading ? "min-h-[400px]" : "",
        }}
      >
        <TableHeader>
          <TableColumn key='staff_name'>Name</TableColumn>
          <TableColumn key='staff_role'>Role</TableColumn>
          <TableColumn key='department'>Department</TableColumn>
          <TableColumn key='actions'>Actions</TableColumn>
        </TableHeader>

        {isEmpty ? (
          <TableBody emptyContent={'No staff data.'}>{[]}</TableBody>
        ) : (
          <TableBody
            loadingContent={<Spinner />}
            loadingState={loadingState}
            items={items}
            aria-colspan={3}
          >
            {(item: any) => (
              <TableRow key={item?.staff_id}>
                {(columnKey) => (
                  <TableCell>
                    
                  </TableCell>
                )}
              </TableRow>
          )}
        </TableBody>
            )}
          </Table>
    </div>
  )
}
