"use client";

import { Button, Input } from "@nextui-org/react";
import { set, useForm } from "react-hook-form";
import { FaFileUpload } from "react-icons/fa";
import {
  addConfirmedInvigilatorsToExams,
  extractExamsSchedule,
  extractInvigilatorsSchedule,
} from "@/lib/actions/exams.action";
import { toast, Toaster } from "react-hot-toast";
import { Spinner } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IoIosDocument } from "react-icons/io";
import UploadConfirmationModal from "../modals/UploadConfirmationModal";
import ScheduleConfirmationModal from "../modals/ScheduleConfirmationModal";
import UnMatchedDetailsTable from "../tables/UnMatchedDetailsTable";
import axios from "@/utils/axios";

type UploadFormProps = {
  uploadType: "exams" | "invigilators";
  onClose: () => void;
  mutate?: () => void;
  selectedExams?: any;
  staffDetails?: any[];
};

const UploadForm = ({
  uploadType,
  onClose,
  mutate,
  selectedExams,
  staffDetails,
}: UploadFormProps) => {
  const { handleSubmit } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [scheduleData, setScheduleData] = useState<any>([]);
  const [confirmedData, setConfirmedData] = useState<any>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [unmatchedDetails, setUnmatchedDetails] = useState([]);
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (acceptedFiles) => {
      setAcceptedFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
    onFileDialogCancel: () => {
      setAcceptedFiles([]);
    },
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
          const base64String = event.target.result.split(",")[1];
          resolve(base64String);
        };
        reader.onerror = (event: any) => {
          reject(event.target.error);
        };
        reader.readAsDataURL(file);
      });

      try {
        if (uploadType === "exams") {
          const response = await axios.post("/exams-schedule/extract", {
            base64_pdf_data: base64String,
          });

          if (response.error) {
            toast.error("An error occurred while uploading the exam schedule");
            return;
          }

          await extractExamsSchedule(
            response.data,
            selectedExams?.selectedId
          ).then((response: any) => {
            setAcceptedFiles([]);
            if (
              response?.message ===
              "The exam schedule has been uploaded successfully"
            ) {
              toast.success(response?.message);
              return;
            } else {
              toast.error(response?.message || "An error occurred");
              return;
            }
          });
          onClose();
        } else {
          try {
            const response = await axios.post("/invigilators/extract", {
              base64_pdf_data: base64String,
            });

            if (response.error) {
              toast.error(
                "An error occurred while uploading the invigilator's schedule"
              );
              return;
            }

            const result: any = await extractInvigilatorsSchedule(
              response.data
            );

            if (result.data) {
              const { matchedData, unmatchedData } = result.data;
              setScheduleData({ matchedData, unmatchedData });
              setShowConfirmationModal(true);
            } else {
              toast.error(result?.message || "An error occurred");
            }
          } catch (error: any) {
            toast.error(error?.message || "An error occurred");
          }
        }
      } catch (error: any) {
        toast.error(error?.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }

      reader.readAsDataURL(file);
    }
  };

  const acceptedFileItems = acceptedFiles.map((file) => (
    <p key={file.name}>{file.name}</p>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
      <ul>
        {errors.map((e) => (
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

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const response: any = await addConfirmedInvigilatorsToExams(
        confirmedData
      );

      if (
        response.unmatchedDetails.length === 0 &&
        response.message ===
          "The invigilators schedule has been uploaded successfully"
      ) {
        toast.success(response.message);
        onClose();
        mutate?.();
      } else if (response.unmatchedDetails.length > 0) {
        setUnmatchedDetails(response.unmatchedDetails);
        setShowUnmatchedModal(true);
      }
    } catch (error: any) {
      throw new Error(error);
    } finally {
      setIsLoading(false);
      setAcceptedFiles([]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mb-12">
      <Toaster position="top-center" />
      <UploadConfirmationModal
        isOpen={showModal}
        onConfirm={handleUpload}
        onClose={() => setShowModal(false)}
      />

      <div className="p-4 w-[550px] bg-white shadow-md rounded-md">
        <div className="flex flex-col">
          <div className="flex items-center justify-center">
            <FaFileUpload className="w-8 h-8 text-gray-500" />
            <h2 className="pl-2 text-2xl font-semibold text-gray-700">
              {selectedExams && "Re"}Upload{" "}
              {uploadType === "invigilators" ? "Invigilators" : "Exams"}{" "}
              Schedule
            </h2>
          </div>
          {selectedExams && (
            <div className="py-4 text-center font-semibold text-gray-700">{`${selectedExams?.examName}`}</div>
          )}
        </div>
        <form
          className="flex flex-col items-center p-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div
            {...getRootProps({ className: "dropzone" })}
            className={`flex flex-col items-center w-full p-4 py-14 cursor-pointer border-2 border-dashed border-gray-600 hover:border-blue ${
              isLoading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <IoIosDocument className="w-10 h-10 text-gray-500 mb-4" />
            <input {...getInputProps()} />
            {isDisabled ? (
              <>
                <p>Drag and drop a PDF file here, or click to select a file</p>
                <em className="text-sm text-gray-600">
                  (Only *.pdf files will be accepted)
                </em>
              </>
            ) : (
              <p className="text-gray-500 font-semibold py-2 text-sm">
                {acceptedFileItems}
              </p>
            )}
          </div>

          {showError && (
            <p className="text-red-500 text-sm py-1">
              You can only select PDF files.
            </p>
          )}

          <Button
            className={`mt-4 w-[200px]`}
            color={isDisabled ? "default" : "primary"}
            type="submit"
            disabled={isLoading || isDisabled}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="default" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </form>
      </div>
      {showConfirmationModal && (
        <ScheduleConfirmationModal
          onClose={() => setShowConfirmationModal(false)}
          isOpen={showConfirmationModal}
          onConfirm={handleConfirm}
          scheduleData={scheduleData}
          confirmedData={confirmedData}
          setConfirmedData={setConfirmedData}
          defaultStaffDetails={staffDetails}
        />
      )}

      {showUnmatchedModal && (
        <UnMatchedDetailsTable
          unMatchedDetails={unmatchedDetails}
          isOpen={showUnmatchedModal}
          onClose={onClose}
          mutate={mutate}
        />
      )}
    </div>
  );
};

export default UploadForm;
