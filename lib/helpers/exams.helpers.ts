import prisma from "@/utils/prisma";
import { assignStaffToExamSession } from "../actions/exams.action";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

const fuzz = require("fuzzball");

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
export async function matchInvigilatorsWithAbbreviatedNames(
  invigilators: any,
  result: any
) {
  let matchedData: any = [];
  let unmatchedData: any = [];
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

  for (const unmatchedAbbreviatedName of unmatchedAbbreviatedNames) {
    const pythonInvigilator = result.find(
      (invigilator: any) => invigilator.Invigilator === unmatchedAbbreviatedName
    );

    unmatchedData.push({
      abbreviated_name: unmatchedAbbreviatedName,
      details: pythonInvigilator ? pythonInvigilator.Details : [],
    });
  }

  matchedData = correlation;

  return { matchedData, unmatchedData };
}

export async function correlateInvigilatorsWithExams(details: any) {
  const { user } = await getServerSession(authOptions);

  if (!user) return null;

  try {
    const unmatchedDetails = [];
    const staffGroups: { [key: string]: string[] } = {};

    for (const staff of details) {
      const matchedDetails = [];

      for (const detail of staff.details) {
        const dateParts = detail.Date.split("/");
        const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const date = new Date(isoDate);

        const exams = await prisma.exam.findMany({
          where: {
            AND: [
              { date: date },
              { start_time: detail["Start Time"] },
              { end_time: detail["End Time"] },
            ],
          },
        });

        const examCodes = detail["Course Code"].split(",");

        const exam = exams.find((e) => {
          const examCodesInDb = e.exam_code
            .split(",")
            .flatMap((code) => code.split("/").map((part) => part.trim()));
          return examCodes.some((code: any) =>
            code
              .split("/")
              .map((part: any) => part.trim())
              .some((part: any) => examCodesInDb.includes(part))
          );
        });

        if (exam) {
          const key = `${exam.exam_id}|${detail.Venue}`;
          if (!staffGroups[key]) {
            staffGroups[key] = [];
          }
          staffGroups[key].push(staff.staff_id);
        } else {
          unmatchedDetails.push({
            ...detail,
            staff_name: staff.full_name,
          });
        }
      }
    }

    // for (const key in staffGroups) {
    //   const [exam_id, venue] = key.split("|");
    //   const staff_ids = staffGroups[key];

    //   const result = await assignStaffToExamSession(
    //     exam_id,
    //     venue,
    //     staff_ids,
    //     "invigilators",
    //     true
    //   );

    //   if (
    //     result &&
    //     result?.message ===
    //       "An error occurred while uploading the invigilator's schedule."
    //   ) {
    //     throw new Error(result?.message);
    //   }
    // }

    const examGroups: any = {};

    for (const key in staffGroups) {
      const [exam_id, venue] = key.split("|");
      const staff_ids = staffGroups[key];

      if (!examGroups[exam_id]) {
        examGroups[exam_id] = [];
      }

      examGroups[exam_id].push({ venue, staff_ids });
    }

    for (const exam_id in examGroups) {
      for (const group of examGroups[exam_id]) {
        const result = await assignStaffToExamSession(
          exam_id,
          group.venue,
          group.staff_ids,
          "invigilators",
          true
        );

        if (
          result &&
          result?.message ===
            "An error occurred while uploading the invigilator's schedule."
        ) {
          throw new Error(result?.message);
        }
      }
    }

    return {
      unmatchedDetails,
      message: "success",
    };
  } catch (error: any) {
    throw new Error(error);
  }
}

// export async function correlateInvigilatorsWithExams(details: any) {
//   const user = await currentUser();

//   if (!user) return null;

//   try {
//     const unmatchedDetails = [];

//     for (const staff of details) {
//       const matchedDetails = [];

//       for (const detail of staff.details) {
//         const dateParts = detail.Date.split("/");
//         const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
//         const date = new Date(isoDate);

//         const exams = await prisma.exam.findMany({
//           where: {
//             AND: [
//               { date: date },
//               { start_time: detail["Start Time"] },
//               { end_time: detail["End Time"] },
//             ],
//           },
//         });

//         const examCodes = detail["Course Code"].split(",");

//         const exam = exams.find((e) => {
//           const examCodesInDb = e.exam_code
//             .split(",")
//             .flatMap((code) => code.split("/").map((part) => part.trim()));
//           return examCodes.some((code: any) =>
//             code
//               .split("/")
//               .map((part: any) => part.trim())
//               .some((part: any) => examCodesInDb.includes(part))
//           );
//         });

//         if (exam) {
//           matchedDetails.push(detail);

//           const result = await assignStaffToExamSession(
//             exam.exam_id,
//             detail.Venue,
//             [staff.staff_id],
//             "invigilators",
//             true
//           );

//           if (
//             result &&
//             result?.message ===
//               "An error occurred while uploading the invigilator's schedule."
//           ) {
//             throw new Error(result?.message);
//           }
//         } else {
//           unmatchedDetails.push({
//             ...detail,
//             staff_name: staff.full_name,
//           });
//         }
//       }
//     }

//     return {
//       unmatchedDetails,
//       message: "success",
//     };
//   } catch (error: any) {
//     throw new Error(error);
//   }
// }

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
