"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Tabs,
  Tab,
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
  Chip,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
} from "@nextui-org/react";
import {
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiUnlock,
  FiTrash2,
} from "react-icons/fi";
import CreateNewUserModal from "../modals/CreateNewUserModal";
import { FaEllipsisV } from "react-icons/fa";
import { blockUnblockUser, deleteUser } from "@/lib/actions/users.action";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";

type Users = {
  id: number;
  name: string;
  email: string;
  role: string;
  subRole: string;
  googleId: string;
};

interface UserManagementTableProps {
  users: Users[];
}

function UserManagementTable({ users }: UserManagementTableProps) {
  const admins = users.filter((user) => user.role === "admin");
  const checkers = users.filter((user) => user.role === "checker");
  const { data: session }: any = useSession();

  const [selectedTab, setSelectedTab] = useState<any>("admin");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDetails, setselectedDetails] = useState<any>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rowsPerPage = 10;

  const selectedUsers = useMemo(
    () => (selectedTab === "admin" ? admins : checkers),
    [selectedTab, admins, checkers]
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

  const filteredselectedUsers = useMemo(() => {
    if (!searchQuery) return selectedUsers;

    return selectedUsers.filter((user: any) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, selectedUsers]);

  const pages = Math.ceil(filteredselectedUsers.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredselectedUsers.slice(start, end);
  }, [page, filteredselectedUsers]);

  const isEmpty = filteredselectedUsers.length === 0;

  const onDelete = (id: string) => {
    setselectedDetails(id);
    setShowDeleteModal(true);
  };

  const handleBlockUnblock = async (id: string, status: boolean) => {
    if (id === session?.user.id) return;

    try {
      await blockUnblockUser(id, status);
    } catch (error: any) {
      throw new Error(error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteUser(selectedDetails);

      if (response?.message === "Staff deleted successfully") {
        toast.success(response?.message);
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

  const columns = [
    <TableColumn key="name">Name</TableColumn>,
    <TableColumn key="email">Email</TableColumn>,
  ];

  const hasSubRole = selectedUsers.some((user) => user.subRole !== null);
  if (hasSubRole) {
    columns.push(<TableColumn key="subRole">Role</TableColumn>);
  }
  columns.push(<TableColumn key="emailVerified">Email Verified</TableColumn>);
  columns.push(<TableColumn key="actions">Actions</TableColumn>);

  return (
    <div>
      <Toaster position="top-center" />
      <Tabs
        color="primary"
        aria-label="Users tab"
        fullWidth
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
      >
        <Tab key="admin" title="Admins"></Tab>
        <Tab key="checker" title="Checkers"></Tab>
      </Tabs>

      <div className="py-6">
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
            className="w-[400px]"
          />
          <Button
            color="primary"
            className="flex gap-2 justify-center mt-4"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus size={22} />
            Add New {selectedTab === "admin" ? "Admin" : "Checker"}
          </Button>
        </div>

        <Table
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
        >
          <TableHeader>{columns}</TableHeader>

          {isEmpty ? (
            <TableBody emptyContent={"No Users."}>{[]}</TableBody>
          ) : (
            <TableBody items={items} aria-colspan={3}>
              {(item: any) => {
                const cells = [
                  <TableCell key="name">{item.name}</TableCell>,
                  <TableCell key="email">{item.email}</TableCell>,
                ];
                if (item.subRole !== null) {
                  cells.push(
                    <TableCell key="subRole" className="capitalize">
                      {item.subRole}
                    </TableCell>
                  );
                }
                cells.push(
                  <TableCell key="emailVerified">
                    {item.googleId ? (
                      <Chip
                        color="success"
                        aria-label="verified"
                        startContent={<FiCheckCircle />}
                      >
                        Verified
                      </Chip>
                    ) : (
                      <Chip
                        color="danger"
                        aria-label="unverified"
                        startContent={<FiXCircle />}
                      >
                        Unverified
                      </Chip>
                    )}
                  </TableCell>
                );

                cells.push(
                  <TableCell key="actions">
                    <Dropdown aria-label="Actions">
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <FaEllipsisV />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        {item.googleId ? (
                          <DropdownItem
                            startContent={
                              item.blocked ? <FiUnlock /> : <FiLock />
                            }
                            onClick={() =>
                              item.blocked
                                ? handleBlockUnblock(item.id, false)
                                : handleBlockUnblock(item.id, true)
                            }
                          >
                            {item.blocked ? "Unblock" : "Block"}
                          </DropdownItem>
                        ) : (
                          <DropdownItem
                            color="danger"
                            startContent={<FiTrash2 />}
                            onClick={() => onDelete(item.id)}
                          >
                            Delete
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                );
                return <TableRow key={item.id}>{cells}</TableRow>;
              }}
            </TableBody>
          )}
        </Table>
      </div>
      {isModalOpen && (
        <CreateNewUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tab={selectedTab}
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default UserManagementTable;
