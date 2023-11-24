"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Image,
} from "@nextui-org/react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const Header = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", link: "/" },
    { name: "Invigilators", link: "/invigilators" },
    { name: "Sessions", link: "/" },
    { name: "Timetable", link: "/timetable" },
    // Add more links as needed
  ];

  const isLinkActive = (linkUrl: string) =>
    pathname.toLowerCase() === linkUrl.toLowerCase();

  return (
    <Navbar
      maxWidth="full"
      shouldHideOnScroll
      isBordered
      classNames={{
        item: [
          "flex",
          "relative",
          "h-full",
          "items-center",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-3",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
      }}
    >
      <NavbarBrand className="flex items-center gap-2 max-w-full">
        <NavbarMenuToggle aria-label="Toggle menu" className="sm:hidden" />
        <Link href={menuItems[0].link} className="max-sm:hidden">
          <Image
            src="/ksb.jpg"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
        <p className="font-bold text-inherit">
          <Link href={menuItems[0].link}>KSB Exams Attendance</Link>
        </p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4 " justify="center">
        {menuItems.slice(1).map((menuItem, index) => (
          <NavbarItem key={index} isActive={isLinkActive(menuItem.link)}>
            <Link
              href={menuItem.link}
              color={`${
                isLinkActive(menuItem.link) ? "primary" : "foreground"
              }`}
              className="hover:text-blue-600"
            >
              {menuItem.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <UserButton afterSignOutUrl="/sign-in" />
      </NavbarContent>

      <NavbarMenu>
        {menuItems.slice(1).map((menuItem, index) => (
          <NavbarMenuItem key={index}>
            <Link
              color={isLinkActive(menuItem.link) ? "primary" : "foreground"}
              href={menuItem.link}
              className="hover:text-blue-600"
            >
              {menuItem.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
};

export default Header;
