import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaClipboardList,
  FaCog,
} from "react-icons/fa";

export const sidebarLinks = [
  {
    icon: <FaHome />,
    route: "/",
    label: "Dashboard",
  },
  {
    icon: <FaCalendarAlt />,
    route: "/exam-schedule",
    label: "Exam Schedule",
  },
  {
    icon: <FaUsers />,
    route: "/staff-management",
    label: "Staff Management",
  },
  {
    icon: <FaClipboardList />,
    route: "/attendance-tracking",
    label: "Attendance Tracking",
  },
  // {
  //   icon: <FaCog />,
  //   route: "/user-management",
  //   label: "User Management",
  // },
  {
    icon: <FaCog />,
    route: "/settings",
    label: "Settings",
  },
];

// export const sidebarLinks = [
//   {
//     icon: '/svgIcons/dashboard.svg',
//     route: "/",
//     label: "Dashboard",
//   },
//   {
//     icon: "/svgIcons/schedule.svg",
//     route: "/exam-schedule",
//     label: "Exam Schedule",
//   },
//   {
//     icon: "/svgIcons/staffman.svg",
//     route: "/staff-management",
//     label: "Staff Management",
//   },
//   {
//     icon: "/svgIcons/attendance.svg",
//     route: "/attendance-tracking",
//     label: "Attendance Tracking",
//   },
//   // {
//   //   icon: <FaCog />,
//   //   route: "/user-management",
//   //   label: "User Management",
//   // },
//   {
//     icon: "svgIcons/settings.svg",
//     route: "/settings",
//     label: "Settings",
//   },
  
// ];