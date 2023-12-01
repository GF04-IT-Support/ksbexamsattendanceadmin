import UploadForm from "@/components/forms/UploadForm";
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

export const StaffTabsLinks = [
        {
            id: "invigilators",
            label: "Invigilators",
            content: <UploadForm uploadType="invigilators"/>
        },
        {
            id: "security",
            label: "Security",
            content: "Content for Security"
        },
        {
            id: "nurses",
            label: "Nurses",
            content: "Content for Nurses"
        },
        {
            id: "itSupport",
            label: "IT Support",
            content: "Content for IT Support"
        },
        {
            id: "administrative",
            label: "Administrative",
            content: "Content for Administrative"
        }
    ];

export const searchTypes = [
  {
    id: "date",
    label: "Date",
  },
  {
    id: "examCode",
    label: "Exam Code",
  },
  {
    id: "venue",
    label: "Venue",
  }
]