import prisma from "@/utils/prisma";
import { currentUser } from "@clerk/nextjs";

const fuzz = require("fuzzball");

export async function addUnmatchedNamesToStaff(unmatchedAbbreviatedNames: any) {
  for (const name of unmatchedAbbreviatedNames) {
    await prisma.staff.create({
      data: {
        staff_name: name,
        staff_role: "Other",
        department: "Other",
      },
    });
  }
}

// export async function matchInvigilatorsWithAbbreviatedNames(
//   invigilators: any,
//   result: any
// ) {
//   let correlation: any = [];
//   let unmatchedAbbreviatedNames: any = [];

//   for (const pythonInvigilator of result) {
//     const originalAbbreviatedName = pythonInvigilator.Invigilator;
//     let abbreviatedName = originalAbbreviatedName
//       .toLowerCase()
//       .replace(/[^a-z0-9 .]/gi, " ")
//       .trim();
//     let words = abbreviatedName.split(" ");
//     let surname = words.pop();

//     while (surname.length === 1 && words.length > 0) {
//       surname = words.pop();
//     }

//     let matchingFullNames = [];
//     for (const dbInvigilator of invigilators) {
//       const originalFullName = dbInvigilator.staff_name;
//       let fullName = originalFullName
//         .toLowerCase()
//         .replace(/[^a-z0-9 .]/gi, " ")
//         .trim();
//       let fullNameWords = fullName.split(" ");
//       let fullNameSurname = fullNameWords.pop();

//       if (
//         fullNameSurname.includes(surname) ||
//         surname.includes(fullNameSurname)
//       ) {
//         matchingFullNames.push({
//           ...dbInvigilator,
//           staff_name: fullName,
//           originalFullName: originalFullName,
//         });
//       }
//     }

//     if (matchingFullNames.length) {
//       let bestMatch: any = null;
//       let maxInitialsMatched = 0;

//       for (const matchingFullName of matchingFullNames) {
//         let fullNameWords = matchingFullName.staff_name.split(" ");
//         fullNameWords.pop(); // Remove the surname

//         const fullNameInitials = fullNameWords.map(
//           (namePart: string) => namePart[0]
//         );
//         const abbreviatedNameInitials = abbreviatedName
//           .split(".")
//           .filter((initial: string) => initial !== "");

//         const matchedInitials = abbreviatedNameInitials.filter(
//           (initial: string) => fullNameInitials.includes(initial)
//         );

//         if (matchedInitials.length > maxInitialsMatched) {
//           maxInitialsMatched = matchedInitials.length;
//           bestMatch = matchingFullName;
//         }
//       }

//       if (bestMatch) {
//         correlation.push({
//           staff_id: bestMatch.staff_id,
//           full_name: bestMatch.originalFullName,
//           abbreviated_name: originalAbbreviatedName,
//           details: originalAbbreviatedName ? pythonInvigilator.Details : [],
//         });

//         // Remove the bestMatch from the invigilators array
//         invigilators = invigilators.filter(
//           (invigilator: any) => invigilator.staff_id !== bestMatch.staff_id
//         );
//       } else {
//         unmatchedAbbreviatedNames.push(originalAbbreviatedName);
//       }
//     } else {
//       unmatchedAbbreviatedNames.push(originalAbbreviatedName);
//     }
//   }

//   const unmatchedInvigilators = invigilators.filter((invigilator: any) => {
//     return !correlation.some(
//       (match: any) => match.staff_id === invigilator.staff_id
//     );
//   });

//   // console.log(unmatchedInvigilators);

//   for (const unmatchedAbbreviatedName of unmatchedAbbreviatedNames) {
//     for (const dbInvigilator of unmatchedInvigilators) {
//       const originalFullName = dbInvigilator.staff_name;

//       const ratio = fuzz.token_set_ratio(
//         originalFullName,
//         unmatchedAbbreviatedName
//       );

//       if (ratio > 70) {
//         const pythonInvigilator = result.find(
//           (invigilator: any) =>
//             invigilator.Invigilator === unmatchedAbbreviatedName
//         );

//         correlation.push({
//           staff_id: dbInvigilator.staff_id,
//           full_name: originalFullName,
//           abbreviated_name: unmatchedAbbreviatedName,
//           details: pythonInvigilator ? pythonInvigilator.Details : [],
//         });

//         unmatchedAbbreviatedNames = unmatchedAbbreviatedNames.filter(
//           (name: string) => name !== unmatchedAbbreviatedName
//         );
//         break;
//       }
//     }
//   }

//   return { correlation, unmatchedAbbreviatedNames };
// }
// export async function matchInvigilatorsWithAbbreviatedNames(
//   invigilators: any,
//   result: any
// ) {
//   let correlation: any = [];
//   let unmatchedAbbreviatedNames: any = [];

//   for (const pythonInvigilator of result) {
//     const originalAbbreviatedName = pythonInvigilator.Invigilator;
//     let abbreviatedName = originalAbbreviatedName
//       .toLowerCase()
//       .replace(/[^a-z0-9 .]/gi, " ")
//       .trim();

//     // Only run the matching logic when the abbreviatedName contains "Osei"
//     if (abbreviatedName.includes("osei")) {
//       let words = abbreviatedName.split(" ");
//       let surname = words.pop();

//       while (surname.length === 1 && words.length > 0) {
//         surname = words.pop();
//       }

//       let matchingFullNames = [];
//       for (const dbInvigilator of invigilators) {
//         const originalFullName = dbInvigilator.staff_name;
//         let fullName = originalFullName
//           .toLowerCase()
//           .replace(/[^a-z0-9 .]/gi, " ")
//           .trim();
//         let fullNameWords = fullName.split(" ");
//         let fullNameSurname = fullNameWords.pop();

//         if (
//           fullNameSurname.includes(surname) ||
//           surname.includes(fullNameSurname)
//         ) {
//           matchingFullNames.push({
//             ...dbInvigilator,
//             staff_name: fullName,
//             originalFullName: originalFullName,
//           });
//         }
//       }

//       if (matchingFullNames.length) {
//         console.log("abbreviatedName:", abbreviatedName); // Log the abbreviatedName
//         console.log("matchingFullNames:", matchingFullNames); // Log the matchingFullNames

//         let bestMatch: any = null;
//         let maxInitialsMatched = 0;

//         for (const matchingFullName of matchingFullNames) {
//           let fullNameWords = matchingFullName.originalFullName
//             .replace(".", "")
//             .split(" ");
//           fullNameWords.pop(); // Remove the surname

//           const fullNameInitials = fullNameWords.map((namePart: string) =>
//             namePart[0].toLowerCase()
//           );

//           let abbreviatedNameInitials = originalAbbreviatedName
//             .replace(/\./g, " ") // Replace periods with spaces
//             .split(" ")
//             .filter((initial: string) => initial !== "")
//             .map((initial: string) => initial.toLowerCase());
//           abbreviatedNameInitials.pop(); // Remove the surname

//           let matchedInitialsCount = 0;
//           for (const initial of abbreviatedNameInitials) {
//             // console.log(matchingFullName, initial, fullNameInitials);

//             if (fullNameInitials.includes(initial.toLowerCase())) {
//               matchedInitialsCount++;
//             }
//           }

//           if (matchedInitialsCount > maxInitialsMatched) {
//             maxInitialsMatched = matchedInitialsCount;
//             bestMatch = matchingFullName;
//           }
//         }

//         console.log("bestMatch:", bestMatch);

//         if (bestMatch) {
//           correlation.push({
//             staff_id: bestMatch.staff_id,
//             full_name: bestMatch.originalFullName,
//             abbreviated_name: originalAbbreviatedName,
//             details: originalAbbreviatedName ? pythonInvigilator.Details : [],
//           });

//           // Remove the bestMatch from the invigilators array
//           invigilators = invigilators.filter(
//             (invigilator: any) => invigilator.staff_id !== bestMatch.staff_id
//           );
//         } else {
//           unmatchedAbbreviatedNames.push(originalAbbreviatedName);
//         }
//       } else {
//         unmatchedAbbreviatedNames.push(originalAbbreviatedName);
//       }
//     }
//   }

//   return { correlation, unmatchedAbbreviatedNames };
// }

export async function matchInvigilatorsWithAbbreviatedNames(
  invigilators: any,
  result: any
) {
  let correlation: any = [];
  let unmatchedAbbreviatedNames: any = [];

  for (const pythonInvigilator of result) {
    const originalAbbreviatedName = pythonInvigilator.Invigilator;
    let abbreviatedName = originalAbbreviatedName
      .toLowerCase()
      .replace(/[^a-z0-9 .]/gi, " ")
      .trim();
    let words = abbreviatedName.split(" ");
    let surname = words.pop();

    while (surname.length === 1 && words.length > 0) {
      surname = words.pop();
    }

    let matchingFullNames = [];
    for (const dbInvigilator of invigilators) {
      const originalFullName = dbInvigilator.staff_name;
      let fullName = originalFullName
        .toLowerCase()
        .replace(/[^a-z0-9 .]/gi, " ")
        .trim();
      let fullNameWords = fullName.split(" ");
      let fullNameSurname = fullNameWords.pop();

      if (
        fullNameSurname.includes(surname) ||
        surname.includes(fullNameSurname)
      ) {
        matchingFullNames.push({
          ...dbInvigilator,
          staff_name: fullName,
          originalFullName: originalFullName,
        });
      }
    }

    if (matchingFullNames.length) {
      let bestMatch: any = null;
      let maxInitialsMatched = 0;

      for (const matchingFullName of matchingFullNames) {
        let fullNameWords = matchingFullName.originalFullName
          .replace(".", "")
          .split(" ")
          .filter((word: any) => word);
        fullNameWords.pop();

        const fullNameInitials = fullNameWords.map((namePart: string) =>
          namePart[0].toLowerCase()
        );

        let abbreviatedNameInitials = originalAbbreviatedName
          .replace(/\./g, " ")
          .split(" ")
          .filter((initial: string) => initial !== "")
          .map((initial: string) => initial.toLowerCase());
        abbreviatedNameInitials.pop();

        let matchedInitialsCount = 0;
        for (const initial of abbreviatedNameInitials) {
          if (fullNameInitials.includes(initial.toLowerCase())) {
            matchedInitialsCount++;
          }
        }

        if (matchedInitialsCount > maxInitialsMatched) {
          maxInitialsMatched = matchedInitialsCount;
          bestMatch = matchingFullName;
        }
      }

      if (bestMatch) {
        correlation.push({
          staff_id: bestMatch.staff_id,
          full_name: bestMatch.originalFullName,
          abbreviated_name: originalAbbreviatedName,
          details: originalAbbreviatedName ? pythonInvigilator.Details : [],
        });

        invigilators = invigilators.filter(
          (invigilator: any) => invigilator.staff_id !== bestMatch.staff_id
        );
      } else {
        unmatchedAbbreviatedNames.push(originalAbbreviatedName);
      }
    } else {
      unmatchedAbbreviatedNames.push(originalAbbreviatedName);
    }
  }

  const unmatchedInvigilators = invigilators.filter((invigilator: any) => {
    return !correlation.some(
      (match: any) => match.staff_id === invigilator.staff_id
    );
  });

  for (const unmatchedAbbreviatedName of unmatchedAbbreviatedNames) {
    for (const dbInvigilator of unmatchedInvigilators) {
      const originalFullName = dbInvigilator.staff_name;

      const ratio = fuzz.token_set_ratio(
        originalFullName,
        unmatchedAbbreviatedName
      );

      if (ratio > 70) {
        const pythonInvigilator = result.find(
          (invigilator: any) =>
            invigilator.Invigilator === unmatchedAbbreviatedName
        );

        correlation.push({
          staff_id: dbInvigilator.staff_id,
          full_name: originalFullName,
          abbreviated_name: unmatchedAbbreviatedName,
          details: pythonInvigilator ? pythonInvigilator.Details : [],
        });

        unmatchedAbbreviatedNames = unmatchedAbbreviatedNames.filter(
          (name: string) => name !== unmatchedAbbreviatedName
        );
        break;
      }
    }
  }

  return { correlation, unmatchedAbbreviatedNames };
}

export async function fetchInvigilators() {
  return await prisma.staff.findMany({
    where: {
      OR: [
        { staff_role: "Lecturer" },
        { staff_role: "Part-Time Lecturer" },
        { staff_role: "PhD Student" },
        { staff_role: "Other" },
      ],
    },
    select: {
      staff_id: true,
      staff_name: true,
    },
  });
}

export async function correlateInvigilatorsWithExams(
  invigilator: string,
  details: any,
  staff_id: string
) {
  const user = await currentUser();

  if (!user) return null;

  for (const detail of details) {
    const dateParts = detail.Date.split("/");
    const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    const date = new Date(isoDate);

    const exam = await prisma.exam.findFirst({
      where: {
        AND: [
          { date: date },
          { start_time: detail["Start Time"] },
          { end_time: detail["End Time"] },
        ],
      },
    });

    if (exam) {
      let venue = await prisma.venue.findFirst({
        where: { name: detail.Venue },
      });

      if (!venue) {
        venue = await prisma.venue.create({
          data: { name: detail.Venue },
        });
      }

      let examSession = await prisma.examSession.upsert({
        where: {
          exam_id: exam.exam_id,
          venue_id: venue.venue_id,
        },
        update: {},
        create: {
          exam_id: exam.exam_id,
          venue_id: venue.venue_id,
          createdBy: user.id,
        },
      });

      const existingAssignment = await prisma.staffAssignment.findFirst({
        where: {
          staff_id: staff_id,
          exam_session_id: examSession.exam_session_id,
        },
      });

      if (!existingAssignment) {
        await prisma.staffAssignment.create({
          data: {
            staff_id: staff_id,
            exam_session_id: examSession.exam_session_id,
            role: "invigilators",
          },
        });
      }
    }
  }
}

// invigilators = invigilators.map((invigilator) => {
//             let cleanedName = invigilator.staff_name
//               .toLowerCase()
//               .replace(/[^a-z0-9-. ]/gi, '')
//               .replace(/\(.*?\)/g, '')
//               .replace(/(mr|ms|mrs|dr|miss|phd|prof)\.?/gi, '')
//               .trim()
//               .split(' ')
//               .map((word) => {
//                 if (word.includes('-')) {
//                   return word.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('-');
//                 } else {
//                   return word.charAt(0).toUpperCase() + word.slice(1);
//                 }
//               })
//               .join(' ');

//             return {
//               ...invigilator,
//               staff_name: cleanedName,
//             };
//           });
