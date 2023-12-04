"use client"

import React from 'react'
import { Chip, Modal, ModalContent, useDisclosure } from '@nextui-org/react';
import UploadForm from '../forms/UploadForm';

export default function ExamsUploadModal() {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
  return (
    <div>
        <div className='flex justify-center items-center mb-6'>
      <Chip>Click <p onClick={onOpen} className='inline-block cursor-pointer text-blue hover:underline'>here</p> to upload exams schedule</Chip>
      </div>

       <Modal size='xl' className='p-4' isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
            <UploadForm uploadType='exams' onClose={onClose}/>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
