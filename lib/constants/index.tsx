import Administrative from "@/components/Staffs/Administrative";
import ITSupport from "@/components/Staffs/ITSupport";
import Invigilators from "@/components/Staffs/Invigilators";
import Nurses from "@/components/Staffs/Nurses";
import Security from "@/components/Staffs/Security";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaClipboardList,
  FaCog,
  FaUserCog,
} from "react-icons/fa";
import InvigilatorsIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import NursesIcon from "@mui/icons-material/LocalHospital";
import ITSupportIcon from "@mui/icons-material/Computer";
import AdministrativeIcon from "@mui/icons-material/Business";

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
  {
    icon: <FaUserCog />,
    route: "/user-management",
    label: "User Management",
  },
  // {
  //   icon: <FaCog />,
  //   route: "/settings",
  //   label: "Settings",
  // },
];

export const StaffTabsLinks = [
  {
    id: "invigilators",
    label: "Invigilators",
    icon: <InvigilatorsIcon />,
    content: (id: string, label: string, examsNames: any) => (
      <Invigilators id={id} label={label} examsNames={examsNames} />
    ),
  },
  {
    id: "security",
    label: "Security",
    icon: <SecurityIcon />,
    content: (id: string, label: string, examsNames: any) => (
      <Security id={id} label={label} examsNames={examsNames} />
    ),
  },
  {
    id: "nurses",
    label: "Nurses",
    icon: <NursesIcon />,
    content: (id: string, label: string, examsNames: any) => (
      <Nurses id={id} label={label} examsNames={examsNames} />
    ),
  },
  {
    id: "itSupport",
    label: "IT Support",
    icon: <ITSupportIcon />,
    content: (id: string, label: string, examsNames: any) => (
      <ITSupport id={id} label={label} examsNames={examsNames} />
    ),
  },
  {
    id: "administrative",
    label: "Administrative",
    icon: <AdministrativeIcon />,
    content: (id: string, label: string, examsNames: any) => (
      <Administrative id={id} label={label} examsNames={examsNames} />
    ),
  },
];

// export const UserTabsLinks = [
//   {
//     id: "checker",
//     label: "Checkers",
//     icon: <FaUsers />,
//   },
//   {
//     id: "admin",
//     label: "Admins",
//   },
// ];
