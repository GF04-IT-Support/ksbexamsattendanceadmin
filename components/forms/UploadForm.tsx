"use client";

import { extractExamsSchedule } from "@/lib/actions/staff.action";
import { useForm, FieldValues } from "react-hook-form";

export default function UploadForm() {
    const { register, handleSubmit } = useForm();

    const onSubmit = async (data: FieldValues) => {
        const file = data.file[0];
        const reader = new FileReader();
        const fileName = file.name.split('.').slice(0, -1).join('.');

        reader.onload = function(event:any) {
            const base64String = event.target.result.split(',')[1];
            extractExamsSchedule(base64String, fileName);
            
        };

        reader.readAsDataURL(file); 
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input type="file" accept="application/pdf" {...register('file')} required />
            <button type="submit">Submit</button>
        </form>
    );
}