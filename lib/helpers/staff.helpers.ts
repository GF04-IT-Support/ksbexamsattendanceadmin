export function getStaffRoles(id: string) {
  const allStaffRoles = [
    "Lecturer",
    "Part-Time Lecturer",
    "PhD Student",
    "Librarian",
    "Security",
    "Nurse",
    "Ambulance",
    "IT Support",
    "Administrative",
    "Other",
  ];

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
      staffRoles = allStaffRoles.filter(
        (role) =>
          ![
            "Lecturer",
            "Part-Time Lecturer",
            "PhD Student",
            "Librarian",
            "Security",
            "Nurse",
            "Ambulance",
            "IT Support",
          ].includes(role)
      );
      break;
    default:
      throw new Error(`Invalid id: ${id}`);
  }

  return staffRoles;
}
