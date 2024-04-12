export function getStaffRoles(id: string) {
  let staffRoles;

  switch (id) {
    case "invigilators":
      staffRoles = [
        "Lecturer",
        "Part-Time Lecturer",
        "PhD Student",
        "Librarian",
      ];
      break;
    case "security":
      staffRoles = ["Security"];
      break;
    case "nurses":
      staffRoles = ["Nurse", "Ambulance"];
      break;
    case "itSupport":
      staffRoles = ["IT Support"];
      break;
    case "administrative":
      staffRoles = ["Administrative", "Technician", "Other"];
      break;
    case "feeCollectors":
      staffRoles = ["Fee Collector"];
      break;
    default:
      throw new Error(`Invalid id: ${id}`);
  }

  return staffRoles;
}
