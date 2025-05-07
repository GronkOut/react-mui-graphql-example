import { ChangeEvent, FocusEvent, RefObject, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { Field, FieldErrors, FieldType, FieldValue } from '@/types/treeView';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';

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

interface FieldItemProps {
  field: Field;
  index: number;
  containerRef: RefObject<HTMLDivElement | null>;
  fieldError: string | undefined;
  handleChangeField: (index: number, key: keyof Field, value: FieldValue) => void;
  handleChangeFields: (index: number, dataArray: { key: keyof Field; value: FieldValue }[]) => void;
  handleDeleteField: (index: number) => void;
  handleChangeFieldToggle: (index: number, prop: 'required' | 'editable' | 'visible', checked: boolean) => void;
}

const FIELD_TYPES: FieldType[] = ['text', 'textList', 'number', 'checkbox', 'color', 'image', 'select', 'tag'];

const FieldItem = memo(function FieldItem({ field, index, containerRef, fieldError, handleChangeField, handleChangeFields, handleDeleteField, handleChangeFieldToggle }: FieldItemProps) {
  const [fieldUiType, setFieldUiType] = useState<FieldType>(field.type || 'text');
  const [fieldUiTypePending, setFieldUiTypePending] = useState<FieldType | null>(null);
  const [fieldKey, setFieldKey] = useState<string>(field.key || '');
  const [fieldValue, setFieldValue] = useState<FieldValue>(field.value ?? '');
  const [fieldRegEx, setFieldRegEx] = useState<string>(field.regex || '');

  // 타입 변경 확인 다이얼로그
  const typeChangeConfirm = useConfirmDialog({
    title: 'UI 타입 변경',
    content: '필드 타입을 변경하면 값과 정규식이 초기화됩니다. 계속하시겠습니까?',
    cancelText: '취소',
    confirmText: '확인',
    onConfirm: async () => {
      if (fieldUiTypePending !== null) {
        setFieldUiType(fieldUiTypePending);

        let value: FieldValue;

        switch (fieldUiTypePending) {
          case 'text':
            value = '';
            break;
          case 'textList':
            value = [''];
            break;
          case 'number':
            value = 0;
            break;
          case 'checkbox':
            value = true;
            break;
          case 'color':
            value = [''];
            break;
          case 'image':
            value = '';
            break;
          case 'select':
            value = [{ type: '', value: '' }];
            break;
          case 'tag':
            value = [''];
            break;
          default:
            value = '';
            break;
        }

        handleChangeFields(index, [
          { key: 'type', value: fieldUiTypePending },
          { key: 'value', value: value },
          { key: 'regex', value: '' },
        ]);

        setFieldUiTypePending(null);
      }
    },
  });

  // 필드 키 변경 핸들러 (로컬 상태만 업데이트)
  const handleChangeFieldKey = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldKey(event.target.value), []);

  // 필드 키 포커스 아웃 핸들러 (실제 값 변경 시 부모 핸들러 호출)
  const handleBlurFieldKey = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== (field.key || '')) handleChangeField(index, 'key', value);
    },
    [handleChangeField, index, field.key],
  );

  // 필드 값 변경 핸들러 (로컬 상태만 업데이트)
  const handleChangeFieldValue = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldValue(event.target.value), []);

  // 필드 값 포커스 아웃 핸들러 (실제 값 변경 시 부모 핸들러 호출)
  const handleBlurFieldValue = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== String(field.value ?? '')) handleChangeField(index, 'value', value);
    },
    [handleChangeField, index, field.value],
  );

  // 필드 값 (Switch) 변경 핸들러 (즉시 부모 핸들러 호출)
  const handleChangeSwitchValue = useCallback(
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setFieldValue(checked);

      handleChangeField(index, 'value', checked);
    },
    [handleChangeField, index],
  );

  // 필드 정규식 변경 핸들러 (로컬 상태만 업데이트)
  const handleChangeFieldRegEx = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldRegEx(event.target.value), []);

  // 필드 정규식 포커스 아웃 핸들러 (실제 값 변경 시 부모 핸들러 호출)
  const handleBlurFieldRegEx = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== (field.regex || '')) handleChangeField(index, 'regex', value);
    },
    [handleChangeField, index, field.regex],
  );

  // 필드 UI 타입 선택 핸들러
  const handleChangeFieldUiType = useCallback(
    (event: SelectChangeEvent<FieldType>) => {
      const type = event.target.value as FieldType;

      if (type !== fieldUiType) {
        setFieldUiTypePending(type);

        typeChangeConfirm.handleOpen();
      }
    },
    [typeChangeConfirm, fieldUiType],
  );

  // 필드 수정 가능(editable) 토글 핸들러
  const handleChangeFieldEditable = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => handleChangeFieldToggle(index, 'editable', checked), [handleChangeFieldToggle, index]);

  // 필드 필수 입력(required) 토글 핸들러
  const handleChangeFieldRequired = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => handleChangeFieldToggle(index, 'required', checked), [handleChangeFieldToggle, index]);

  // 필드 UI 노출(visible) 토글 핸들러
  const handleChangeFieldVisible = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => handleChangeFieldToggle(index, 'visible', checked), [handleChangeFieldToggle, index]);

  // 필드 삭제 핸들러
  const handleClickFieldDelete = useCallback(() => handleDeleteField(index), [handleDeleteField, index]);

  // 필드 타입에 따라 다른 값 입력 UI 렌더링
  const renderValueInput = useCallback(() => {
    switch (field.type) {
      case 'text':
        return <TextField label="Value" fullWidth size="small" value={String(fieldValue ?? '')} autoComplete="off" onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />;
      case 'number':
        return <TextField label="Value" type="number" fullWidth size="small" value={fieldValue ?? 0} autoComplete="off" onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />;
      case 'checkbox':
        return <FormControlLabel label="Value" control={<Switch checked={fieldValue === true || String(fieldValue).toLowerCase() === 'true'} onChange={handleChangeSwitchValue} />} sx={{ margin: 0, justifyContent: 'flex-start' }} />;
      case 'image':
        return <TextField label="Value" fullWidth size="small" value={fieldValue} autoComplete="off" onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />;
      default:
        return '';
    }
  }, [field.type, fieldValue, handleChangeFieldValue, handleBlurFieldValue, handleChangeSwitchValue]);

  useEffect(() => {
    setFieldUiType(field.type || 'text');
    setFieldKey(field.key || '');
    setFieldValue(field.value ?? '');
    setFieldRegEx(field.regex || '');
  }, [field]);

  return (
    <Box key={`${field.key}-${index}`} sx={{ marginBottom: '30px', padding: '20px', borderRadius: '5px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
      <Stack sx={{ gap: '20px' }}>
        {/* 헤더 */}
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2">필드 아이템 #{index + 1}</Typography>
          <Button size="small" color="error" sx={{ minWidth: '40px' }} onClick={handleClickFieldDelete}>
            삭제
          </Button>
        </Stack>

        {/* 옵션 */}
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <FormControl sx={{ minWidth: '200px' }}>
            <InputLabel id={`field-type-label-${index}`}>UI Type</InputLabel>
            <Select labelId={`field-type-label-${index}`} label="Type" value={fieldUiType} size="small" MenuProps={{ container: containerRef.current }} onChange={handleChangeFieldUiType}>
              {FIELD_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel label="UI 노출" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.visible ?? true} onChange={handleChangeFieldVisible} />} />
            <Tooltip title="사용자 어드민에서 해당 필드 UI를 노출할지 여부를 설정합니다.">
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel label="수정 가능" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.editable ?? true} onChange={handleChangeFieldEditable} />} />
            <Tooltip title="사용자 어드민에서 해당 필드의 값을 수정할 수 있도록 허용합니다.">
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel label="필수 입력" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.required ?? true} onChange={handleChangeFieldRequired} />} />
            <Tooltip title="사용자 어드민에서 해당 필드를 필수로 입력하도록 설정합니다.">
              <IconButton size="small">
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>

        {/* 키 */}
        <TextField label="Key" fullWidth size="small" value={fieldKey} autoComplete="off" error={!!fieldError} helperText={fieldError || ''} onChange={handleChangeFieldKey} onBlur={handleBlurFieldKey} />

        {/* 값 */}
        {renderValueInput()}

        {/* 정규식 */}
        {field.type !== 'checkbox' && <TextField label="RegEx" fullWidth size="small" value={fieldRegEx} autoComplete="off" onChange={handleChangeFieldRegEx} onBlur={handleBlurFieldRegEx} />}
      </Stack>

      {/* UI 타입 변경 확인 다이얼로그 */}
      {typeChangeConfirm.ConfirmDialog}
    </Box>
  );
});

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
