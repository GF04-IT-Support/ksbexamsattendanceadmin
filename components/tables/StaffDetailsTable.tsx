"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Tooltip,
  Button,
  Input,
} from "@nextui-org/react";
import useSWR from "swr";
import { FiEdit, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import {
  deleteStaffDetails,
  fetchStaffDetails,
} from "@/lib/actions/staff.action";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import EditStaffDetailsModal from "../modals/EditStaffDetailsModal";
import CreateNewStaffModal from "../modals/CreateNewStaffModal";
import { getStaffRoles } from "@/lib/helpers/staff.helpers";

type StaffProps = {
  id: string;
  label: string;
};

export default function StaffDetailsTable({ id, label }: StaffProps) {
  const rowsPerPage = 10;
  const [selectedDetails, setselectedDetails] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: staffDetails = [],
    mutate,
    isLoading,
  } = useSWR(
    `examsSchedule/${id}`,
    () => fetchStaffDetails(id)
    // { revalidateOnMount: false, revalidateOnFocus: false }
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;

    setSearchQuery(newQuery);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setSearchQuery(newQuery);
    }, 300);
  };

  const filteredStaffDetails = useMemo(() => {
    if (!searchQuery) return staffDetails;

    return staffDetails.filter((staff: any) =>
      staff.staff_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, staffDetails]);

  const pages = Math.ceil(filteredStaffDetails.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredStaffDetails.slice(start, end);
  }, [page, filteredStaffDetails]);

  const loadingState = isLoading ? "loading" : "idle";
  const isEmpty = filteredStaffDetails.length === 0 && !isLoading;

  const onDelete = (id: string) => {
    setselectedDetails(id);
    setShowDeleteModal(true);
  };

  const onEdit = (details: any) => {
    setselectedDetails(details);
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteStaffDetails(selectedDetails);

      if (response?.message === "Staff deleted successfully") {
        toast.success(response?.message);
        mutate();
      } else if (
        response?.message === "An error occurred while deleting the staff."
      ) {
        toast.error(response?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowDeleteModal(false);
      setIsDeleting(false);
    }
  };

  const uniqueRoles = getStaffRoles(id);

  return (
    <div className="my-2 pb-6 w-full">
      <Toaster position="top-center" />
      <div className="flex justify-between mb-4">
        <Input
          id="searchInput"
          label="Search name"
          isClearable
          startContent={
            <FiSearch
              size={26}
              className="pr-2 pt-1 text-default-400 pointer-events-none flex-shrink-0"
            />
          }
          value={searchQuery}
          onChange={handleSearch}
          onClear={() => setSearchQuery("")}
          placeholder="Search..."
          className="w-[400px] max-sm:mr-2"
        />
        <Button
          color="primary"
          className="flex w-auto gap-2 justify-center mt-4"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus size={22} />
          <p className="max-sm:hidden">
            Add New {label.endsWith("s") ? label.slice(0, -1) : label}
          </p>
        </Button>
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
          <TableColumn key="staff_name">Name</TableColumn>
          <TableColumn key="staff_role">Role</TableColumn>
          <TableColumn key="department">Department</TableColumn>
          <TableColumn key="actions">Actions</TableColumn>
        </TableHeader>

        {isEmpty ? (
          <TableBody emptyContent={"No staff data."}>{[]}</TableBody>
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
                    {columnKey === "actions" ? (
                      <div className="relative flex items-center gap-2">
                        <Tooltip content="Edit">
                          <span
                            className="text-lg text-default-400 cursor-pointer active:opacity-50"
                            onClick={() => onEdit(item)}
                          >
                            <FiEdit />
                          </span>
                        </Tooltip>
                        <Tooltip color="danger" content="Delete">
                          <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => onDelete(item.staff_id)}
                          >
                            <FiTrash2 />
                          </span>
                        </Tooltip>
                      </div>
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />

      {showEditModal && (
        <EditStaffDetailsModal
          isOpen={showEditModal}
          staffDetails={selectedDetails}
          onClose={() => setShowEditModal(false)}
          mutate={mutate}
          uniqueRoles={uniqueRoles}
        />
      )}

      {showCreateModal && (
        <CreateNewStaffModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mutate={mutate}
          uniqueRoles={uniqueRoles}
        />
      )}
    </div>
  );
}
