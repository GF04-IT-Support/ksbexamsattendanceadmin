import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import ReactHtmlParser from "react-html-parser";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mutate?: () => void;
  unMatchedDetails: any[];
};

export default function UnMatchedDetailsTable({
  isOpen,
  onClose,
  unMatchedDetails,
  mutate,
}: ModalProps) {
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);

  const unmatchedDetailsWithId = unMatchedDetails.map(
    (item: any, index: any) => ({
      ...item,
      id: index,
    })
  );
  const pages = Math.ceil(unmatchedDetailsWithId?.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return unmatchedDetailsWithId?.slice(start, end);
  }, [page, unmatchedDetailsWithId]);

  const handleClose = () => {
    mutate?.();
    onClose();
  };
  return (
    <Modal
      backdrop="opaque"
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="4xl"
      isDismissable={false}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center justify-center">
          These exam schedules were not uploaded successfully. Please add them
          manually:
        </ModalHeader>
        <ModalBody>
          <Table
            isStriped
            aria-label="Exams timetable"
            bottomContent={
              pages > 1 && (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={(page) => setPage(page)}
                  />
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn key="Date">Date</TableColumn>
              <TableColumn key="Course Code">Exam Code(s)</TableColumn>
              <TableColumn key="Start Time">Start Time</TableColumn>
              <TableColumn key="End Time">End Time</TableColumn>
              <TableColumn key="Venue">Venue(s)</TableColumn>
              <TableColumn key="staff_name">Invigilator</TableColumn>
            </TableHeader>

            <TableBody items={items} aria-colspan={3}>
              {(item: any) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>
                      {columnKey === "Date" ? (
                        item[columnKey]
                      ) : columnKey === "Course Code" ||
                        columnKey === "Start Time" ? (
                        item[columnKey].includes(",") ? (
                          <Tooltip
                            content={ReactHtmlParser(
                              item[columnKey].split(",").join("<br />")
                            )}
                            placement="bottom"
                          >
                            <span className="cursor-pointer underline">
                              {item[columnKey].split(",")[0]}
                            </span>
                          </Tooltip>
                        ) : (
                          item[columnKey]
                        )
                      ) : (
                        item[columnKey]
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleClose}>
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
