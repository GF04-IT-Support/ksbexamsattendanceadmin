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
            content: (id:string, label:string) => <Invigilators id={id} label={label} />
        },
        {
            id: "security",
            label: "Security",
            content: (id:string, label:string) => <Security id={id} label={label} />
        },
        {
            id: "nurses",
            label: "Nurses",
            content: (id:string, label:string) => <Nurses id={id} label={label} />
        },
        {
            id: "itSupport",
            label: "IT Support",
            content: (id:string, label:string) => <ITSupport id={id} label={label} />
        },
        {
            id: "administrative",
            label: "Administrative",
            content: (id:string, label:string) => <Administrative id={id} label={label} />
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