import { ReactNode, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface Params {
  container?: HTMLElement;
  title: ReactNode;
  content: ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => Promise<void>;
}

export const useConfirmDialog = ({ container = document.getElementById('layers') as HTMLElement, title, content, cancelText = '취소', confirmText = '확인', onConfirm }: Params) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => setIsOpen(false);

  const handleConfirm = async () => {
    await onConfirm();

    setIsOpen(false);
  };

  const ConfirmDialog = (
    <Dialog container={container} open={isOpen} onClose={handleClose}>
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
