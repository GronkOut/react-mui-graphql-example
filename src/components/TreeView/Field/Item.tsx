import { ChangeEvent, FocusEvent, RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Button, Chip, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { Field, FieldType, FieldValue, FieldValueSelect } from '@/types/treeView';
import { FIELD_TYPES, FIELD_TYPES_DEFAULT } from '@/types/treeView';

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

export default memo(function FieldItem({ field, index, containerRef, fieldError, handleChangeField, handleChangeFields, handleDeleteField, handleChangeFieldToggle }: FieldItemProps) {
  const [fieldUiType, setFieldUiType] = useState<FieldType>(field.type || 'text');
  const [fieldUiTypePending, setFieldUiTypePending] = useState<FieldType | null>(null);
  const [fieldKey, setFieldKey] = useState(field.key || '');
  const [fieldValue, setFieldValue] = useState<FieldValue>(field.value ?? FIELD_TYPES_DEFAULT[field.type || 'text']);
  const [fieldValueListValue, setFieldValueListValue] = useState('');
  const [fieldValueSelectKey, setFieldValueSelectKey] = useState('');
  const [fieldValueSelectKeyError, setFieldValueSelectKeyError] = useState('');
  const [fieldValueSelectValue, setFieldValueSelectValue] = useState('');
  const [fieldRegEx, setFieldRegEx] = useState(field.regex || '');
  const [fieldExtra, setFieldExtra] = useState(field.extra || '');

  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // 타입 변경 확인 다이얼로그
  const typeChangeConfirm = useConfirmDialog({
    title: 'UI 타입 변경',
    content: '필드 타입을 변경하면 값과 정규식이 초기화됩니다. 계속하시겠습니까?',
    cancelText: '취소',
    confirmText: '확인',
    onConfirm: useCallback(async () => {
      if (fieldUiTypePending !== null) {
        setFieldUiType(fieldUiTypePending);

        const defaultValue = FIELD_TYPES_DEFAULT[fieldUiTypePending];

        setFieldValue(defaultValue);

        if (typeof fieldValue === 'string' && fieldValue.startsWith('blob:')) {
          URL.revokeObjectURL(fieldValue);

          if (objectUrlRef.current === fieldValue) objectUrlRef.current = null;
        }

        if (fieldUiTypePending !== 'image' && objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);

          objectUrlRef.current = null;
        }

        handleChangeFields(index, [
          { key: 'type', value: fieldUiTypePending },
          { key: 'value', value: defaultValue },
          { key: 'regex', value: '' },
          { key: 'extra', value: '' },
        ]);

        setFieldUiTypePending(null);
      }
    }, [fieldUiTypePending, handleChangeFields, index, fieldValue]),
  });

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

  // 필드 삭제 핸들러
  const handleClickFieldDelete = useCallback(() => handleDeleteField(index), [handleDeleteField, index]);

  // 필드 UI 노출(visible) 토글 핸들러
  const handleChangeFieldVisible = useCallback(
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const updates: { key: keyof Field; value: FieldValue }[] = [{ key: 'visible', value: checked }];

      if (!checked) {
        updates.push({ key: 'editable', value: false });
        updates.push({ key: 'required', value: false });
      }

      handleChangeFields(index, updates);
    },
    [handleChangeFields, index],
  );

  // 필드 수정 가능(editable) 토글 핸들러
  const handleChangeFieldEditable = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => handleChangeFieldToggle(index, 'editable', checked), [handleChangeFieldToggle, index]);

  // 필드 필수 입력(required) 토글 핸들러
  const handleChangeFieldRequired = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => handleChangeFieldToggle(index, 'required', checked), [handleChangeFieldToggle, index]);

  // 필드 키 변경 핸들러
  const handleChangeFieldKey = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldKey(event.target.value), []);

  // 필드 키 포커스 아웃 핸들러
  const handleBlurFieldKey = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== (field.key || '')) handleChangeField(index, 'key', value);
    },
    [handleChangeField, index, field.key],
  );

  // 필드 값 변경 핸들러
  const handleChangeFieldValue = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      if (field.type === 'image' && objectUrlRef.current && !newValue.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrlRef.current);

        objectUrlRef.current = null;
      }

      setFieldValue(newValue);
    },
    [field.type],
  );

  // 필드 값 포커스 아웃 핸들러
  const handleBlurFieldValue = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      if (value !== String(field.value ?? FIELD_TYPES_DEFAULT[field.type || 'text'])) {
        handleChangeField(index, 'value', field.type === 'number' ? parseFloat(value) || 0 : value);
      }
    },
    [handleChangeField, index, field.value, field.type],
  );

  // 필드 값 (Switch) 변경 핸들러
  const handleChangeSwitchValue = useCallback(
    (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setFieldValue(checked);

      handleChangeField(index, 'value', checked);
    },
    [handleChangeField, index],
  );

  // 필드 정규식 변경 핸들러
  const handleChangeFieldRegEx = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldRegEx(event.target.value), []);

  // 필드 정규식 포커스 아웃 핸들러
  const handleBlurFieldRegEx = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== (field.regex || '')) handleChangeField(index, 'regex', value);
    },
    [handleChangeField, index, field.regex],
  );

  // 필드 Extra 변경 핸들러
  const handleChangeFieldExtra = useCallback((event: ChangeEvent<HTMLInputElement>) => setFieldExtra(event.target.value), []);

  // 필드 Extra 포커스 아웃 핸들러
  const handleBlurFieldExtra = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value !== (field.extra || '')) handleChangeField(index, 'extra', value);
    },
    [handleChangeField, index, field.extra],
  );

  // textList/color/tag 아이템 중복 체크
  const isDuplicateValue = useMemo(() => {
    if (!fieldValueListValue.trim() || !['textList', 'color', 'tag'].includes(field.type || '')) return false;

    const currentItems = (Array.isArray(fieldValue) ? fieldValue : []) as string[];

    return currentItems.some((item) => item === fieldValueListValue.trim());
  }, [fieldValueListValue, fieldValue, field.type]);

  // textList/color/tag 아이템 추가 핸들러
  const handleClickAddItem = useCallback(() => {
    if (fieldValueListValue.trim() === '') return;

    const currentItems = (Array.isArray(fieldValue) ? fieldValue : []) as string[];
    const updatedItems = [...currentItems, fieldValueListValue.trim()];

    setFieldValue(updatedItems);

    handleChangeField(index, 'value', updatedItems);

    setFieldValueListValue('');
  }, [fieldValueListValue, fieldValue, handleChangeField, index]);

  // textList/color/tag 아이템 삭제 핸들러
  const handleClickRemoveItem = useCallback(
    (itemIndex: number) => {
      const currentItems = (Array.isArray(fieldValue) ? fieldValue : []) as string[];
      const updatedItems = currentItems.filter((_, i) => i !== itemIndex);

      setFieldValue(updatedItems);

      handleChangeField(index, 'value', updatedItems);
    },
    [fieldValue, handleChangeField, index],
  );

  // select 아이템 추가 핸들러
  const handleAddSelectOption = useCallback(() => {
    const key = fieldValueSelectKey.trim();
    const value = fieldValueSelectValue.trim();

    if (!key || !value || !!fieldValueSelectKeyError) return;

    const currentOptions = (Array.isArray(fieldValue) ? fieldValue : []) as FieldValueSelect[];
    const newOption: FieldValueSelect = { key, value, selected: currentOptions.length === 0 };
    const updatedOptions = [...currentOptions, newOption];

    setFieldValue(updatedOptions);

    handleChangeField(index, 'value', updatedOptions);

    setFieldValueSelectKey('');
    setFieldValueSelectValue('');
  }, [fieldValueSelectKey, fieldValueSelectValue, fieldValue, handleChangeField, index, fieldValueSelectKeyError]);

  // select 아이템 삭제 핸들러
  const handleRemoveSelectOption = useCallback(
    (optionIndex: number) => {
      const currentOptions = (Array.isArray(fieldValue) ? fieldValue : []) as FieldValueSelect[];
      const removedOptionWasSelected = currentOptions[optionIndex]?.selected;

      let updatedOptions = currentOptions.filter((_, i) => i !== optionIndex);

      if (removedOptionWasSelected && updatedOptions.length > 0) {
        let alreadySelected = false;

        updatedOptions = updatedOptions.map((opt) => {
          if (opt.selected) alreadySelected = true;

          return opt;
        });

        if (!alreadySelected) {
          updatedOptions = updatedOptions.map((opt, idx) => ({ ...opt, selected: idx === 0 }));
        }
      }

      setFieldValue(updatedOptions);

      handleChangeField(index, 'value', updatedOptions);
    },
    [fieldValue, handleChangeField, index],
  );

  // select 아이템 선택 토글 핸들러
  const handleToggleSelectOption = useCallback(
    (optionIndexToSelect: number) => {
      const currentOptions = (Array.isArray(fieldValue) ? fieldValue : []) as FieldValueSelect[];
      const updatedOptions = currentOptions.map((option, idx) => ({ ...option, selected: idx === optionIndexToSelect }));

      setFieldValue(updatedOptions);

      handleChangeField(index, 'value', updatedOptions);
    },
    [fieldValue, handleChangeField, index],
  );

  // image 아이템 업로드 핸들러
  const handleClickImageUpload = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Image 아이템 파일 선택 핸들러
  const handleChangeImageFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

        const newObjectUrl = URL.createObjectURL(file);

        objectUrlRef.current = newObjectUrl;

        setFieldValue(newObjectUrl);

        handleChangeField(index, 'value', newObjectUrl);
      }

      if (event.target) event.target.value = '';
    },
    [handleChangeField, index],
  );

  // Image 아이템 미리보기 핸들러
  const handleClickImagePreview = useCallback(() => {
    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim() !== '') {
      window.open(fieldValue, '_blank');
    }
  }, [fieldValue]);

  useEffect(() => {
    const currentObjectUrl = objectUrlRef.current;

    return () => {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, []);

  useEffect(() => {
    const propType = field.type || 'text';
    const propValue = field.value ?? FIELD_TYPES_DEFAULT[propType];

    if (objectUrlRef.current) {
      if (objectUrlRef.current !== propValue || propType !== 'image') {
        URL.revokeObjectURL(objectUrlRef.current);

        objectUrlRef.current = null;
      }
    }

    setFieldUiType(propType);
    setFieldKey(field.key || '');
    setFieldValue(propValue);
    setFieldRegEx(field.regex || '');
    setFieldExtra(field.extra || '');

    if (propType === 'image' && typeof propValue === 'string' && propValue.startsWith('blob:')) {
      if (objectUrlRef.current !== propValue) objectUrlRef.current = propValue;
    }
  }, [field]);

  useEffect(() => {
    if (field.type !== 'select') {
      setFieldValueSelectKeyError('');
      return;
    }

    const keyToValidate = fieldValueSelectKey.trim();

    if (!keyToValidate) {
      setFieldValueSelectKeyError('');
      return;
    }

    const currentOptions = (Array.isArray(fieldValue) ? fieldValue : []) as FieldValueSelect[];

    if (currentOptions.some((option) => option.key === keyToValidate)) {
      setFieldValueSelectKeyError('이미 사용 중인 옵션 키입니다.');
      return;
    }

    setFieldValueSelectKeyError('');
  }, [fieldValueSelectKey, fieldValue, field.type]);

  // 필드 타입에 따라 다른 값 입력 UI 렌더링
  const renderValueInput = useMemo(() => {
    switch (field.type) {
      case 'text':
        return <TextField label="Value" fullWidth size="small" autoComplete="off" value={String(fieldValue ?? '')} onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />;
      case 'number':
        return <TextField label="Value" type="number" fullWidth size="small" autoComplete="off" value={fieldValue ?? 0} onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />;
      case 'checkbox':
        return <FormControlLabel label="Value" control={<Switch checked={fieldValue === true || String(fieldValue).toLowerCase() === 'true'} onChange={handleChangeSwitchValue} />} sx={{ margin: 0, justifyContent: 'flex-start' }} />;
      case 'image':
        return (
          <Stack sx={{ flexDirection: 'row', flexGrow: 1, gap: '0 10px' }}>
            <TextField label="Image URL or Path" fullWidth size="small" autoComplete="off" value={String(fieldValue ?? '')} onChange={handleChangeFieldValue} onBlur={handleBlurFieldValue} />
            <input type="file" accept="image/*" ref={inputRef} onChange={handleChangeImageFile} style={{ display: 'none' }} />
            <Button variant="outlined" size="small" onClick={handleClickImageUpload} sx={{ height: '40px' }}>
              업로드
            </Button>
            <Button variant="outlined" size="small" disabled={!fieldValue || String(fieldValue).trim() === ''} onClick={handleClickImagePreview} sx={{ width: '90px', height: '40px' }}>
              미리보기
            </Button>
          </Stack>
        );
      case 'textList':
      case 'color':
      case 'tag': {
        const currentItems = (Array.isArray(fieldValue) ? fieldValue : []) as string[];

        return (
          <Box>
            <Stack sx={{ marginBottom: '20px', flexDirection: 'row', gap: '0 10px' }}>
              <TextField
                label={field.type === 'color' ? 'New Color Code' : field.type === 'tag' ? 'New Tag' : 'New TextList Item'}
                size="small"
                autoComplete="off"
                value={field.type === 'color' && !fieldValueListValue ? '#000000' : fieldValueListValue}
                onChange={(event) => setFieldValueListValue(event.target.value)}
                sx={{ flexGrow: 1 }}
                type={field.type === 'color' ? 'color' : 'text'}
                error={isDuplicateValue}
              />
              <Button variant="outlined" size="small" disabled={!fieldValueListValue.trim() || isDuplicateValue} onClick={handleClickAddItem}>
                추가
              </Button>
            </Stack>
            <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
              {currentItems.map((item, itemIndex) => (
                <Chip key={itemIndex} label={item} onDelete={() => handleClickRemoveItem(itemIndex)} size="small" sx={field.type === 'color' ? { backgroundColor: item, color: '#fff', textShadow: '0 0 2px black' } : {}} />
              ))}
            </Stack>
            {currentItems.length === 0 && (
              <Typography variant="body2" color="textSecondary">
                리스트의 아이템(값)이 없습니다. 추가해주세요.
              </Typography>
            )}
          </Box>
        );
      }
      case 'select': {
        const currentOptions = (Array.isArray(fieldValue) ? fieldValue : []) as FieldValueSelect[];
        const isAddButtonDisabled = !fieldValueSelectKey.trim() || !fieldValueSelectValue.trim() || !!fieldValueSelectKeyError;

        return (
          <Box>
            <Stack sx={{ marginBottom: '20px', flexDirection: 'row', gap: '0 10px' }}>
              <TextField
                label="New Option Key"
                size="small"
                autoComplete="off"
                value={fieldValueSelectKey}
                error={!!fieldValueSelectKeyError && !!fieldValueSelectKey.trim()}
                helperText={fieldValueSelectKey.trim() ? fieldValueSelectKeyError : ''}
                onChange={(event) => setFieldValueSelectKey(event.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <TextField label="New Option Value" size="small" autoComplete="off" value={fieldValueSelectValue} onChange={(event) => setFieldValueSelectValue(event.target.value)} sx={{ flexGrow: 1 }} />
              <Button variant="outlined" size="small" disabled={isAddButtonDisabled} onClick={handleAddSelectOption} sx={{ height: '40px' }}>
                추가
              </Button>
            </Stack>
            <Stack sx={{ gap: '20px' }}>
              {currentOptions.map((option, optionIndex) => (
                <Stack key={optionIndex} direction="row" spacing={1} alignItems="center">
                  <IconButton size="small" onClick={() => handleRemoveSelectOption(optionIndex)} color="error">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <TextField label={`Option ${optionIndex + 1} Key`} size="small" autoComplete="off" value={option.key} disabled sx={{ flexGrow: 1 }} />
                  <TextField label={`Option ${optionIndex + 1} Value`} size="small" autoComplete="off" value={option.value} disabled sx={{ flexGrow: 1 }} />
                  <Switch checked={option.selected} onChange={() => handleToggleSelectOption(optionIndex)} />
                </Stack>
              ))}
            </Stack>
            {currentOptions.length === 0 && (
              <Typography variant="body2" color="textSecondary">
                값이 없습니다.
              </Typography>
            )}
          </Box>
        );
      }
      default:
        return null;
    }
  }, [
    field.type,
    fieldValue,
    isDuplicateValue,
    handleChangeFieldValue,
    handleBlurFieldValue,
    handleChangeSwitchValue,
    fieldValueListValue,
    handleClickAddItem,
    handleClickRemoveItem,
    fieldValueSelectKey,
    fieldValueSelectValue,
    handleAddSelectOption,
    handleRemoveSelectOption,
    fieldValueSelectKeyError,
    handleClickImageUpload,
    handleChangeImageFile,
    handleClickImagePreview,
    handleToggleSelectOption,
  ]);

  return (
    <Box sx={{ marginBottom: '30px', padding: '20px', borderRadius: '5px', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <Stack sx={{ gap: '20px' }}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2">필드 #{index + 1}</Typography>
          <Button size="small" color="error" sx={{ minWidth: '40px' }} onClick={handleClickFieldDelete}>
            삭제
          </Button>
        </Stack>
        <Stack sx={{ flexDirection: { xs: 'column', lg: 'row' }, alignItems: { xs: 'flex-start', lg: 'center' }, gap: '10px' }}>
          <FormControl sx={{ minWidth: '200px' }}>
            <InputLabel id={`field-type-label-${index}`}>UI Type</InputLabel>
            <Select labelId={`field-type-label-${index}`} label="UI Type" value={fieldUiType} size="small" MenuProps={{ container: containerRef.current }} onChange={handleChangeFieldUiType}>
              {FIELD_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ flex: 1 }} />
          <Stack sx={{ flexDirection: 'row' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel label="UI 노출" sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }} control={<Switch size="small" checked={field.visible ?? true} onChange={handleChangeFieldVisible} />} />
              <Tooltip title="사용자 어드민에서 해당 필드 UI를 노출할지 여부를 설정합니다.">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                label="수정 가능"
                sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }}
                control={<Switch size="small" checked={field.editable ?? true} disabled={!(field.visible ?? true)} onChange={handleChangeFieldEditable} />}
              />
              <Tooltip title="사용자 어드민에서 해당 필드의 값을 수정할 수 있도록 허용합니다.">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                label="필수 입력"
                sx={{ margin: '0', gap: '5px', '& .MuiTypography-root': { fontSize: '14px' } }}
                control={<Switch size="small" checked={field.required ?? true} disabled={!(field.visible ?? true)} onChange={handleChangeFieldRequired} />}
              />
              <Tooltip title="사용자 어드민에서 해당 필드를 필수로 입력하도록 설정합니다.">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </Stack>
        <TextField label="Key" fullWidth size="small" autoComplete="off" value={fieldKey} error={!!fieldError} helperText={fieldError || ''} onChange={handleChangeFieldKey} onBlur={handleBlurFieldKey} />
        {renderValueInput}
        {field.type !== 'checkbox' && <TextField label="RegEx" fullWidth size="small" autoComplete="off" value={fieldRegEx} onChange={handleChangeFieldRegEx} onBlur={handleBlurFieldRegEx} />}
        {<TextField label="Extra" fullWidth size="small" autoComplete="off" value={fieldExtra} onChange={handleChangeFieldExtra} onBlur={handleBlurFieldExtra} />}
      </Stack>
      {typeChangeConfirm.ConfirmDialog}
    </Box>
  );
});
