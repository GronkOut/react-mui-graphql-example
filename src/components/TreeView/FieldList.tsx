import { ChangeEvent, FocusEvent, RefObject, memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { Field, FieldErrors, FieldType } from '@/types/treeView';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Divider, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';

interface FieldListProps {
  localFields: Field[] | undefined;
  containerRef: RefObject<HTMLDivElement | null>;
  fieldErrors: FieldErrors | null;
  handleChangeField: (index: number, key: keyof Field, value: string) => void;
  handleAddField: () => void;
  handleDeleteField: (index: number) => void;
  handleChangeFieldType: (index: number, type: FieldType) => void;
  handleChangeFieldToggle: (index: number, prop: 'required' | 'editable', checked: boolean) => void;
}

interface FieldItemProps {
  field: Field;
  index: number;
  containerRef: RefObject<HTMLDivElement | null>;
  fieldError: string | undefined;
  handleChangeField: (index: number, key: keyof Field, value: string) => void;
  handleDeleteField: (index: number) => void;
  handleChangeFieldType: (index: number, type: FieldType) => void;
  handleChangeFieldToggle: (index: number, prop: 'required' | 'editable', checked: boolean) => void;
}

const FIELD_TYPES: FieldType[] = ['none', 'checkbox', 'color', 'image', 'number', 'select', 'tag', 'text', 'textList'];

const FieldItem = memo(function FieldItem({ field, index, containerRef, fieldError, handleChangeField, handleDeleteField, handleChangeFieldType, handleChangeFieldToggle }: FieldItemProps) {
  const [fieldKey, setFieldKey] = useState(field.key || '');
  const [fieldValue, setFieldValue] = useState(JSON.stringify(field.value) ?? '');

  useEffect(() => {
    setFieldKey(field.key || '');
    setFieldValue(JSON.stringify(field.value) ?? '');
  }, [field.key, field.value]);

  // 필드 키 변경 핸들러
  const handleChangeFieldKey = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFieldKey(event.target.value);
  }, []);

  // 필드 키 블러 핸들러
  const handleBlurFieldKey = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (event.target.value !== (field.key || '')) handleChangeField(index, 'key', event.target.value);
    },
    [handleChangeField, index, field.key],
  );

  // 필드 값 변경 핸들러
  const handleChangeFieldValue = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(event.target.value);
  }, []);

  // 필드 값 블러 핸들러
  const handleBlurFieldValue = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const originalValueString = JSON.stringify(field.value) ?? '';

      if (event.target.value !== originalValueString) handleChangeField(index, 'value', event.target.value);
    },
    [handleChangeField, index, field.value],
  );

  // 필드 UI 타입 선택 핸들러
  const handleChangeFieldUiType = useCallback(
    (event: SelectChangeEvent<FieldType>) => {
      handleChangeFieldType(index, event.target.value as FieldType);
    },
    [handleChangeFieldType, index],
  );

  // 필드 수정 상태 변경 핸들러
  const handleChangeFieldEditable = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleChangeFieldToggle(index, 'editable', event.target.checked);
    },
    [handleChangeFieldToggle, index],
  );

  // 필드 필수 상태 변경 핸들러
  const handleChangeFieldRequired = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleChangeFieldToggle(index, 'required', event.target.checked);
    },
    [handleChangeFieldToggle, index],
  );

  // 필드 삭제 핸들러
  const handleClickFieldDelete = useCallback(() => {
    handleDeleteField(index);
  }, [handleDeleteField, index]);

  return (
    <Box key={`field-item-${index}`} sx={{ marginBottom: '30px' }}>
      <Stack direction="row" alignItems="center" sx={{ marginBottom: '20px', gap: '10px' }}>
        <Typography variant="body2">필드 아이템</Typography>
        <Button size="small" color="error" sx={{ minWidth: '40px' }} onClick={handleClickFieldDelete}>
          삭제
        </Button>
        <div style={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel label="수정" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.editable ?? true} onChange={handleChangeFieldEditable} />} />
          <Tooltip title="사용자 어드민에서 이 필드의 값을 수정할 수 있도록 허용합니다.">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel label="필수" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.required ?? true} onChange={handleChangeFieldRequired} />} />
          <Tooltip title="사용자 어드민에서 이 필드를 입력하지 않으면 저장할 수 없도록 설정합니다.">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      <Stack sx={{ flexDirection: { xs: 'column', lg: 'row' }, marginBottom: '20px', gap: '20px 10px', alignItems: 'flex-start' }}>
        <TextField label="Key" fullWidth size="small" value={fieldKey} autoComplete="off" error={!!fieldError} helperText={fieldError || ''} onChange={handleChangeFieldKey} onBlur={handleBlurFieldKey} />
        <TextField label="Value" fullWidth size="small" value={fieldValue} autoComplete="off" onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />
        <FormControl sx={{ minWidth: '200px' }}>
          <InputLabel id={`field-type-label-${index}`}>UI Type</InputLabel>
          <Select labelId={`field-type-label-${index}`} label="Type" value={field.type} size="small" MenuProps={{ container: containerRef.current }} onChange={handleChangeFieldUiType}>
            {FIELD_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type === 'none' ? 'UI 감춤' : type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Divider />
    </Box>
  );
});

export default memo(function FieldList({ localFields, containerRef, fieldErrors, handleChangeField, handleAddField, handleDeleteField, handleChangeFieldType, handleChangeFieldToggle }: FieldListProps) {
  const fieldsToRender = useMemo(() => localFields ?? [], [localFields]);

  return (
    <>
      <Typography sx={{ margin: '70px 0 20px', fontSize: '20px' }}>필드 목록</Typography>
      {fieldsToRender.map((field, index) => (
        <FieldItem
          key={index}
          field={field}
          index={index}
          containerRef={containerRef}
          fieldError={fieldErrors?.[index]}
          handleChangeField={handleChangeField}
          handleDeleteField={handleDeleteField}
          handleChangeFieldType={handleChangeFieldType}
          handleChangeFieldToggle={handleChangeFieldToggle}
        />
      ))}
      <Button variant="outlined" fullWidth sx={{ marginTop: '20px' }} onClick={handleAddField}>
        필드 추가
      </Button>
    </>
  );
});
