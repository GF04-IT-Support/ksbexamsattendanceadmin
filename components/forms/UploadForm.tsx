"use client";

import { Button, Input } from '@nextui-org/react';
import {  set, useForm } from 'react-hook-form';
import { FaFileUpload } from 'react-icons/fa';
import { extractExamsSchedule, extractInvigilatorsSchedule } from '@/lib/actions/exams.action';
import { toast, Toaster } from 'react-hot-toast';
import { Spinner } from '@nextui-org/react';
import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IoIosDocument } from 'react-icons/io';
import UploadConfirmationModal from '../modals/UploadConfirmationModal';

type UploadFormProps = {
  uploadType: 'exams' | 'invigilators';
}

const UploadForm = ({uploadType}: UploadFormProps) => {
    const { handleSubmit } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
    const { getRootProps, getInputProps, fileRejections } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        onDrop: (acceptedFiles) => {
        setAcceptedFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })));
        },
        onFileDialogCancel: () => {
          setAcceptedFiles([]);
        }
    });

    const onSubmit = async () => {
        if (!acceptedFiles[0] || isLoading) return;
        setShowModal(true);
      };

    const handleUpload = async () => {
      setShowModal(false);
      setIsLoading(true);
      if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
    
    const base64String = await new Promise<string>((resolve, reject) => {
        reader.onload = (event: any) => {
            const base64String = event.target.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (event: any) => {
            reject(event.target.error);
        };
        reader.readAsDataURL(file);
    });
    
      try {
        if(uploadType === 'exams'){
            await extractExamsSchedule(base64String)
            .then((response: any) => {
                setIsLoading(false);
                setAcceptedFiles([]);
                if(response?.message === 'Your file has been uploaded successfully!') {
                    toast.success(response?.message);
                    return;
                } else if(response?.message === 'The exam schedule has already been uploaded.' || response?.message === 'An error occurred while uploading the exam schedule.') {
                    toast.error(response?.message);
                    return;
                }
            });
        }else{
          await extractInvigilatorsSchedule(base64String)
          .then((response: any) => {
              setAcceptedFiles([]);
              setIsLoading(false);
                if(response?.message === 'The invigilator\'s schedule has been uploaded successfully') {
                    toast.success(response?.message);
                    return;
                } else if(response?.message === 'An error occurred while uploading the invigilator\'s schedule.') {
                    toast.error(response?.message);
                    return;
                }
            });
        }
      } catch (error) {
        console.error(error);
      }
    
      reader.readAsDataURL(file);
    }
    };
  
    const acceptedFileItems = acceptedFiles.map(file => (
        <p key={file.name}>
            {file.name}
        </p>
    ));

    const fileRejectionItems = fileRejections.map(({ file, errors }) => (
        <li key={file.name}>
            {file.name} - {file.size} bytes
            <ul>
                {errors.map(e => (
                    <li key={e.code}>{e.message}</li>
                ))}
            </ul>
        </li>
    ));

    const isDisabled = acceptedFiles.length === 0;

    useEffect(() => {
        if (fileRejections.length > 0) {
            setShowError(true);
            const timer = setTimeout(() => {
                setShowError(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [fileRejections]);

    return (
  <div className="flex flex-col items-center justify-center mb-12">
    <Toaster position="top-center" />
    <UploadConfirmationModal isOpen={showModal} onConfirm={handleUpload} onClose={() => setShowModal(false)} />
    <div className="p-4 w-[550px] bg-white shadow-md rounded-md">
      <div className="flex items-center justify-center">
        <FaFileUpload className="w-8 h-8 text-gray-500" />
        <h2 className="pl-2 text-2xl font-semibold text-gray-700">Upload {uploadType === "invigilators" ? "Invigilators": "Exams"} Schedule</h2>
      </div>
      <form className="flex flex-col items-center p-4" onSubmit={handleSubmit(onSubmit)}>
        <div {...getRootProps({ className: 'dropzone' })} className='flex flex-col items-center w-full p-4 py-14 cursor-pointer border-2 border-dashed border-gray-600 hover:border-blue'>
            <IoIosDocument className="w-10 h-10 text-gray-500 mb-4"/>
          <input {...getInputProps()} />
          {isDisabled ? (
                  <><p>Drag and drop a PDF file here, or click to select a file</p><em className='text-sm text-gray-600'>(Only *.pdf files will be accepted)</em></>
          ): (
              <p className='text-gray-500 font-semibold py-2 text-sm'>{acceptedFileItems}</p>
          )}
    
        </div>
      
          

          {showError && <p className="text-red-500 text-sm py-1">You can only select PDF files.</p>}
        
        <Button className={`mt-4 w-[200px]`} color={isDisabled ? 'default' : 'primary'} type="submit" disabled={isLoading || isDisabled}>
          {isLoading ? (
            <>
              <Spinner size="sm" color='default'/>
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
      </form>
    </div>
  </div>
);
};

export default UploadForm;

