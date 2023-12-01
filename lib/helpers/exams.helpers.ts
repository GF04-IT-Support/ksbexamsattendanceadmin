import prisma from '@/utils/prisma';
import { currentUser } from "@clerk/nextjs";

export async function addUnmatchedNamesToStaff(unmatchedAbbreviatedNames: any) {
  for (const name of unmatchedAbbreviatedNames) {
    await prisma.staff.create({
      data: {
        staff_name: name,
        staff_role: 'Other',
        department: 'Other',
      },
    });
  }
}

export async function matchInvigilatorsWithAbbreviatedNames(invigilators:any, result:any) {
  let correlation:any = [];
  let unmatchedAbbreviatedNames:any = [];

  for (const pythonInvigilator of result) {
    const originalAbbreviatedName = pythonInvigilator.Invigilator;
            let abbreviatedName = originalAbbreviatedName.toLowerCase();
            abbreviatedName = abbreviatedName.replace(/[^a-z0-9 .]/gi, ' '); 
            const surname = abbreviatedName.split(' ').pop().toLowerCase();

            let matchingFullNames = [];
            for (const dbInvigilator of invigilators) {
              const originalFullName = dbInvigilator.staff_name;
              let fullName = originalFullName.toLowerCase();
              fullName = fullName.replace(/[^a-z0-9 .]/gi, ' '); 
              if (fullName.split(' ').some((word:any) => word.includes(surname) || surname.includes(word))) {
                matchingFullNames.push({...dbInvigilator, staff_name: fullName, originalFullName: originalFullName});
              }
            }

            if (matchingFullNames.length) {
              let matchedDbInvigilator = null;
              for (const matchingFullName of matchingFullNames) {
                const firstNameInitials = matchingFullName.staff_name.split(' ').filter((word:any) => word).map((word:any) => word[0].toLowerCase());
                if (firstNameInitials.some((initial:any) => abbreviatedName.startsWith(initial))) {
                  matchedDbInvigilator = matchingFullName;
                  break;
                }
              }

              if (matchedDbInvigilator) {
                correlation.push({
                  staff_id: matchedDbInvigilator.staff_id,
                  full_name: matchedDbInvigilator.originalFullName, 
                  abbreviated_name: originalAbbreviatedName, 
                  details: originalAbbreviatedName ? pythonInvigilator.Details : [],
                });
              } else {
                unmatchedAbbreviatedNames.push(originalAbbreviatedName);
              }
            } else {
              unmatchedAbbreviatedNames.push(originalAbbreviatedName);
            }
  }

  return { correlation, unmatchedAbbreviatedNames };
}

export async function fetchInvigilators() {
  return await prisma.staff.findMany({
    where: {
      OR: [
        { staff_role: 'Lecturer' },
        { staff_role: 'Part-Time Lecturer' },
        { staff_role: 'PhD Student' },
        { staff_role: 'Other' },
      ],
    },
    select: {
      staff_id: true,
      staff_name: true,
    },
  });
}

export async function correlateInvigilatorsWithExams(invigilator:string, details:any, staff_id:string) {
  const user = await currentUser();

  if(!user) return null;
  
  for (const detail of details) {
      const dateParts = detail.Date.split('/');
      const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const date = new Date(isoDate);

    const exam = await prisma.exam.findFirst({
      where: {
        AND: [
          { date: date },
          { start_time: detail['Start Time'] },
          { end_time: detail['End Time'] },
        ],
      },
    });

    if (exam) {
      await prisma.examSession.upsert({
        where: {
          exam_id: exam.exam_id,
          staff_id: staff_id,
        },
        update: {
          createdAt: new Date(),
          createdBy: user.id,
          venue: detail.Venue,
        },
        create: {
          exam_id: exam.exam_id,
          staff_id: staff_id,
          createdAt: new Date(),
          createdBy: user.id,
          venue: detail.Venue,
        },
      });
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
