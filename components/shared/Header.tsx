"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenuToggle,
  Link,
  Image,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  DropdownSection,
} from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import { FaSignOutAlt, FaUser, FaUserShield } from "react-icons/fa";

const Header = () => {
  const { data: session }: any = useSession();
  return (
    <Navbar maxWidth="full" shouldHideOnScroll isBordered>
      <NavbarBrand className="flex items-center gap-2 max-w-full">
        <NavbarMenuToggle aria-label="Toggle menu" className="sm:hidden" />
        <Link href="/" className="max-sm:hidden">
          <Image
            src="/ksb.jpg"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
        <p className="font-bold text-inherit">
          <Link>KSB Exams Attendance</Link>
        </p>
      </NavbarBrand>

      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end" showArrow radius="sm">
          <DropdownTrigger>
            {session && session?.user?.image ? (
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                src={session?.user?.image}
                size="sm"
              />
            ) : (
              ""
            )}
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownSection aria-label="Email" showDivider>
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{session?.user?.email}</p>
              </DropdownItem>
            </DropdownSection>
            <DropdownSection aria-label="Details" showDivider>
              <DropdownItem
                key="name"
                className="gap-2"
                startContent={<FaUser />}
              >
                <p className="font-semibold">{session?.user?.name}</p>
              </DropdownItem>
              <DropdownItem
                key="name"
                className="gap-2"
                startContent={<FaUserShield />}
              >
                <p className="font-semibold capitalize">
                  {session?.user?.subRole} Admin
                </p>
              </DropdownItem>
            </DropdownSection>

            <DropdownSection aria-label="Logout">
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<FaSignOutAlt />}
                onClick={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
