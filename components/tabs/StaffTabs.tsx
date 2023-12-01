"use client"

import React from "react";
import { Tabs, Tab} from "@nextui-org/react";
import { StaffTabsLinks } from "@/lib/constants";

export default function StaffTabs() {
    return (
        <div className="flex w-full flex-col">
            <Tabs aria-label="Dynamic tabs" items={StaffTabsLinks} fullWidth >
                {(item) => (
                    <Tab key={item.id} title={item.label} >
                        {item.content}
                    </Tab>
                )}
            </Tabs>
        </div>  
    );
}