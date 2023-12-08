"use client"

import React from "react";
import { Tabs, Tab} from "@nextui-org/react";
import { StaffTabsLinks } from "@/lib/constants";

type ExamName = {
  exam_name_id: string;
  exam_name: string;
};

type ExamsTimetableProps = {
  examsNames: ExamName[];
};

export default function StaffTabs({examsNames}: ExamsTimetableProps) {
    return (
        <div className="flex w-full flex-col">
            <Tabs aria-label="Dynamic tabs" items={StaffTabsLinks} fullWidth >
                {(item) => (
                    <Tab key={item.id} title={item.label} >
                        {item.content(item.id, item.label, examsNames)}
                    </Tab>
                )}
            </Tabs>
        </div>  
    );
}