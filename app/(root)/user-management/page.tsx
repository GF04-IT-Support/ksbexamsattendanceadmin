import UserManagementTable from "@/components/tables/UserManagementTable";
import { fetchUsers } from "@/lib/actions/users.action";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

export const dynamic = "force-dynamic";

export default async function UserManagement() {
  const users: any = await fetchUsers();
  const { user }: any = await getServerSession(authOptions);

  return (
    <div>
      <UserManagementTable users={users} ID={user?.id} />
    </div>
  );
}
