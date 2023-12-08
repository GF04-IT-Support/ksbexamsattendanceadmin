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
            content: (id:string, label:string, examsNames:any) => <Invigilators id={id} label={label} examsNames={examsNames}/>
        },
        {
            id: "security",
            label: "Security",
            content: (id:string, label:string, examsNames:any) => <Security id={id} label={label} examsNames={examsNames}/>
        },
        {
            id: "nurses",
            label: "Nurses",
            content: (id:string, label:string, examsNames:any) => <Nurses id={id} label={label} examsNames={examsNames}/>
        },
        {
            id: "itSupport",
            label: "IT Support",
            content: (id:string, label:string, examsNames:any) => <ITSupport id={id} label={label} examsNames={examsNames}/>
        },
        {
            id: "administrative",
            label: "Administrative",
            content: (id:string, label:string, examsNames:any) => <Administrative id={id} label={label} examsNames={examsNames}/>
        }
    ];

