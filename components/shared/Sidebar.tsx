"use client";

import React from "react";
import { sidebarLinks } from "@/lib/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <section className="custom-scrollbar leftsidebar">
      <div className="flex w-full flex-1 flex-col gap-6 px-6">
        {sidebarLinks.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;

          return (
            <Link
              key={link.label}
              href={link.route}
              className={`relative flex justify-start gap-4 rounded-2xl p-4  ${
                isActive && "bg-[#ffffff]"
              } ${!isActive && "hover:opacity-50"} `}
            >
              <div className="flex items-center gap-4">
                {link.icon &&
                  React.cloneElement(link.icon, {
                    style: { color: !isActive ? "#ffffff" : "#0A0A0A" },
                  })}

                <p
                  className={`${
                    isActive ? "text-[#0A0A0A]" : "text-[#ffffff]"
                  }   max-lg:hidden`}
                >
                  {link.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Sidebar;
