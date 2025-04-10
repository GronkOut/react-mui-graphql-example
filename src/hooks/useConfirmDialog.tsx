import { useState } from 'react';

type UseConfirmDialogParams = {
  onConfirm: () => Promise<void>;
};

export const useConfirmDialog = ({ onConfirm }: UseConfirmDialogParams) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => setIsOpen(false);

  const handleConfirm = async () => {
    setIsOpen(false);

    await onConfirm();
  };

  return {
    isOpen,
    handleOpen,
    handleClose,
    handleConfirm,
  };
};
