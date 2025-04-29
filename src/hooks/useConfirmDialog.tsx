import { ReactNode, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

type UseConfirmDialogParams = {
  title: ReactNode;
  content: ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => Promise<void>;
};

export const useConfirmDialog = ({ title, content, cancelText = '취소', confirmText = '확인', onConfirm }: UseConfirmDialogParams) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => setIsOpen(false);

  const handleConfirm = async () => {
    setIsOpen(false);

    await onConfirm();
  };

  const ConfirmDialog = (
    <Dialog container={document.getElementById('layers')} open={isOpen} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {cancelText}
        </Button>
        <Button onClick={handleConfirm} color="error">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return {
    isOpen,
    handleOpen,
    handleClose,
    handleConfirm,
    ConfirmDialog,
  };
};
