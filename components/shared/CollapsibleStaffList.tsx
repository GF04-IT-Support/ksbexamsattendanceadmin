"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function CollapsibleStaffList({
  staffNames,
}: {
  staffNames: string[];
}) {
  if (staffNames.length === 0) {
    return <p className="text-gray-500 text-center">No staff assigned</p>;
  }

  return (
    <Accordion style={{ border: "none", boxShadow: "none" }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel-staff-content"
        id="panel-staff-header"
      >
        <p>
          {staffNames[0]}{" "}
          <span className="text-gray-500">({staffNames.length})</span>
        </p>
      </AccordionSummary>
      <AccordionDetails>
        {staffNames.slice(1).map((name, index) => (
          <p key={index}>{name}</p>
        ))}{" "}
      </AccordionDetails>
    </Accordion>
  );
}
