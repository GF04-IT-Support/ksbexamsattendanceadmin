import UserManagementTable from "@/components/tables/UserManagementTable";
import { fetchUsers } from "@/lib/actions/users.action";
import React from "react";

export default async function UserManagement() {
  const users: any = await fetchUsers();
  return (
    <div>
      <UserManagementTable users={users} />
    </div>
  );
}
