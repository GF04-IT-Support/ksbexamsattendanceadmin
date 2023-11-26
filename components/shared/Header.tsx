"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenuToggle,
  Link,
  Image,
} from "@nextui-org/react";
import { UserButton } from "@clerk/nextjs";

const Header = () => {
  return (
    <Navbar
      maxWidth="full"
      shouldHideOnScroll
      isBordered
    >
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
        <UserButton afterSignOutUrl="/sign-in" />
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
