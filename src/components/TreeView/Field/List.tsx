import { RefObject, memo, useMemo } from 'react';
import { Button, Typography } from '@mui/material';
import type { Field, FieldErrors, FieldValue } from '@/types/treeView';
import FieldItem from './Item';

interface FieldListProps {
  localFields: Field[] | undefined;
  containerRef: RefObject<HTMLDivElement | null>;
  fieldErrors: FieldErrors | null;
  handleChangeField: (index: number, key: keyof Field, value: FieldValue) => void;
  handleChangeFields: (index: number, dataArray: { key: keyof Field; value: FieldValue }[]) => void;
  handleAddField: () => void;
  handleDeleteField: (index: number) => void;
  handleChangeFieldToggle: (index: number, prop: 'required' | 'editable' | 'visible', checked: boolean) => void;
}

export default memo(function FieldList({ localFields, containerRef, fieldErrors, handleChangeField, handleChangeFields, handleAddField, handleDeleteField, handleChangeFieldToggle }: FieldListProps) {
  const fieldsToRender = useMemo(() => localFields ?? [], [localFields]);

  return (
    <>
      <Typography sx={{ margin: '70px 0 20px', fontSize: '20px' }}>필드 목록</Typography>
      {fieldsToRender.map((field, index) => (
        <FieldItem
          key={`${field.key}-${index}`}
          field={field}
          index={index}
          containerRef={containerRef}
          fieldError={fieldErrors?.[index]}
          handleChangeField={handleChangeField}
          handleChangeFields={handleChangeFields}
          handleDeleteField={handleDeleteField}
          handleChangeFieldToggle={handleChangeFieldToggle}
        />
      ))}
      <Button variant="outlined" fullWidth sx={{ marginTop: '20px' }} onClick={handleAddField}>
        필드 추가
      </Button>
    </>
  );
});
