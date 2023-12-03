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
import { FiEdit, FiPlus, FiTrash2  } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import { fetchStaffDetails } from '@/lib/actions/staff.action';

const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

type StaffProps = {
  id: string;
  label: string;
};

export default function StaffDetailsTable({id, label}: StaffProps) {
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const { data: staffDetails = [], mutate, isLoading } = useSWR(
    `examsSchedule/${id}`,
    () => fetchStaffDetails(id),
    // { revalidateOnMount: false, revalidateOnFocus: false }
  );

    const pages = Math.ceil(staffDetails.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return staffDetails.slice(start, end);
  }, [page, staffDetails]);

  const loadingState = isLoading ? 'loading' : 'idle';
  const isEmpty = staffDetails.length === 0 && !isLoading;

  

  return (
    <div className='my-2 pb-6 w-full'>
      <div className='flex justify-end mb-2'>
        <Button color='primary' className='flex gap-2'>
          <FiPlus size={22}/>
          Add New {label.endsWith('s') ? label.slice(0, -1) : label}
        </Button>
      </div>
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
              <TableRow key={item.staff_id}>
                {(columnKey) => (
                  <TableCell>
                    {columnKey === 'actions' ? (
                          <div className="relative flex items-center gap-2">
                            <Tooltip content="Edit">
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                                <FiEdit />
                            </span>
                            </Tooltip>
                            <Tooltip color="danger" content="Delete">
                            <span className="text-lg text-danger cursor-pointer active:opacity-50">
                                <FiTrash2 />
                            </span>
                            </Tooltip>
                        </div>
                        ) : item[columnKey]}
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
