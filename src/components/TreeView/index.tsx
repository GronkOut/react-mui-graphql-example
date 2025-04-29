import { ChangeEvent, FocusEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useTreeView } from '@/hooks/useTreeView';
import type { Field, FieldErrors, FieldType, TreeViewItem } from '@/types/treeView';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UploadIcon from '@mui/icons-material/Upload';
import { Box, Divider, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { RegExKeyName, findParentId, isDuplicatedKey, updateItemById } from '@/utils/treeView';
import CustomTreeItem from './CustomTreeItem';
import FieldList from './FieldList';

interface Props {
  data: TreeViewItem[];
  onDataChange: (updatedData: TreeViewItem[]) => void;
  onErrorsChange?: (hasErrors: boolean) => void;
}

const DEBOUNCE_DELAY = 300;

export default memo(function TreeView({ data, onDataChange, onErrorsChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const [localFields, setLocalFields] = useState<Field[] | undefined>(undefined);
  const [localNodeKeyValue, setLocalNodeKeyValue] = useState<string>('');

  const {
    selectedItemId,
    setSelectedItemId,
    expandedItems,
    selectedItem,
    handleClickItem,
    handleChangeItemPropToggle,
    handleClickItemAdd,
    handleClickItemDelete,
    handleClickItemCopy,
    handleClickItemCut,
    handleClickItemPaste,
    handleClickItemUp,
    handleClickItemDown,
    handleItemExpansionToggle,
    canPaste,
    canMoveUp,
    canMoveDown,
    deleteConfirm,
    cutConfirm,
    keyError,
    setKeyError,
    fieldErrors,
    hasErrors,
    setFieldErrors,
  } = useTreeView(data, onDataChange);

  // 필드 변경 로직을 디바운스 처리하여 불필요한 상태 업데이트 방지
  const changeFieldDebounce = useDebouncedCallback((itemId: string, updatedFields: Field[]) => {
    const keyMap = new Map<string, number[]>();
    const newErrors: FieldErrors = {};

    let hasFieldErrors = false;

    updatedFields.forEach((field, index) => {
      const key = field.key?.trim();

      if (!key) {
        newErrors[index] = '키명은 반드시 입력해야 합니다.';

        hasFieldErrors = true;
      } else if (!RegExKeyName.test(key)) {
        newErrors[index] = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';

        hasFieldErrors = true;
      } else {
        if (!keyMap.has(key)) keyMap.set(key, []);

        keyMap.get(key)?.push(index);
      }
    });

    keyMap.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((index) => {
          newErrors[index] = '중복된 필드명이 있습니다';

          hasFieldErrors = true;
        });
      }
    });

    setFieldErrors(hasFieldErrors ? newErrors : null);

    onDataChange(updateItemById(data, itemId, { fields: updatedFields }));
  }, DEBOUNCE_DELAY);

  // 필드 업데이트
  const updateField = useCallback(
    (index: number, key: keyof Field, value: string | boolean | FieldType) => {
      if (!selectedItem || !localFields) return;

      const updatedLocalFields = [...localFields];
      const updatedField = { ...updatedLocalFields[index] };

      updatedField[key] = value as never;

      if (key === 'key' && typeof value === 'string') {
        updatedField.key = value;
      } else if (!updatedField.key) {
        updatedField.key = '';
      }

      updatedLocalFields[index] = updatedField as Field;

      setLocalFields(updatedLocalFields);

      let newErrors: FieldErrors = fieldErrors ? { ...fieldErrors } : {};
      let hasValidationError = false;

      if (key === 'key') {
        const keyString = (value as string)?.trim() ?? '';

        if (keyString === '') {
          newErrors = newErrors || {};
          newErrors[index] = '키명은 반드시 입력해야 합니다.';

          hasValidationError = true;
        } else if (!RegExKeyName.test(keyString)) {
          newErrors = newErrors || {};
          newErrors[index] = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';

          hasValidationError = true;
        } else {
          if (newErrors) delete newErrors[index];

          for (let i = 0; i < updatedLocalFields.length; i++) {
            const field = updatedLocalFields[i];

            if (i !== index && field && field.key?.trim() === keyString) {
              newErrors = newErrors || {};
              newErrors[index] = '중복된 필드명이 있습니다';
              newErrors[i] = '중복된 필드명이 있습니다';

              hasValidationError = true;
            }
          }
        }
      }

      if (!hasValidationError && newErrors && newErrors[index]) delete newErrors[index];

      if (newErrors && Object.keys(newErrors).length === 0) newErrors = null;

      setFieldErrors(newErrors);

      changeFieldDebounce(selectedItem.id, updatedLocalFields);
    },
    [selectedItem, localFields, fieldErrors, setFieldErrors, changeFieldDebounce],
  );

  // 노드 키 변경 핸들러
  const handleChangeNodeKey = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setLocalNodeKeyValue(event.target.value);
  }, []);

  // 노드 키 포커스 아웃 핸들러
  const handleNodeKeyBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (!selectedItemId || !selectedItem) return;

      const value = event.target.value;
      const trimmedKey = value.trim();
      const parentId = findParentId(data, selectedItemId);

      let currentKeyError: string | null = null;

      if (trimmedKey === '') {
        currentKeyError = '키명은 반드시 입력해야 합니다.';
      } else if (!RegExKeyName.test(trimmedKey)) {
        currentKeyError = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
      } else if (isDuplicatedKey(data, trimmedKey, selectedItemId, parentId)) {
        currentKeyError = '동일한 뎁스에 같은 키명이 존재합니다.';
      }

      setKeyError(currentKeyError);

      if (currentKeyError === null && selectedItem.key !== value) {
        onDataChange(updateItemById(data, selectedItemId, { key: value }));
      }
    },
    [selectedItemId, selectedItem, data, onDataChange, setKeyError],
  );

  // 필드 추가 핸들러
  const handleAddField = useCallback(() => {
    if (!selectedItem) return;

    const newField: Field = { key: '', type: 'text', editable: true, required: true, value: '' };
    const currentFields = localFields ?? [];
    const newFields = [...currentFields, newField];
    const newFieldErrorIndex = newFields.length - 1;

    setLocalFields(newFields);

    setFieldErrors((prevErrors) => ({ ...(prevErrors || {}), [newFieldErrorIndex]: '키명은 반드시 입력해야 합니다.' }));

    changeFieldDebounce(selectedItem.id, newFields);
  }, [selectedItem, localFields, setFieldErrors, changeFieldDebounce]);

  // 필드 삭제 핸들러
  const handleDeleteField = useCallback(
    (index: number) => {
      if (!selectedItem || !localFields) return;

      const updatedFields = localFields.filter((_, i) => i !== index);

      setLocalFields(updatedFields);

      setFieldErrors((prevErrors) => {
        if (!prevErrors) return null;

        const newErrors: FieldErrors = {};

        let hasAnyError = false;

        Object.entries(prevErrors).forEach(([key, value]) => {
          const keyNum = Number(key);

          if (keyNum !== index) {
            const newIndex = keyNum > index ? keyNum - 1 : keyNum;

            newErrors[newIndex] = value;

            hasAnyError = true;
          }
        });

        return hasAnyError ? newErrors : null;
      });

      changeFieldDebounce(selectedItem.id, updatedFields);
    },
    [selectedItem, localFields, setFieldErrors, changeFieldDebounce],
  );

  // 필드 값 변경 핸들러
  const handleChangeField = useCallback(
    (index: number, key: keyof Field, value: string) => {
      updateField(index, key, value);
    },
    [updateField],
  );

  // 필드 타입 변경 핸들러
  const handleChangeFieldType = useCallback(
    (index: number, type: FieldType) => {
      updateField(index, 'type', type);
    },
    [updateField],
  );

  // 필드 토글 변경 핸들러
  const handleChangeFieldToggle = useCallback(
    (index: number, prop: 'required' | 'editable', checked: boolean) => {
      updateField(index, prop, checked);
    },
    [updateField],
  );

  useEffect(() => {
    if (!data[0]) return;

    setSelectedItemId(data[0].id);
  }, [data, setSelectedItemId]);

  useEffect(() => {
    if (selectedItem) {
      setLocalNodeKeyValue(selectedItem.key || '');

      setLocalFields(selectedItem.fields ? [...selectedItem.fields] : undefined);
    } else {
      setLocalNodeKeyValue('');

      setLocalFields(undefined);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (onErrorsChange) onErrorsChange(hasErrors);
  }, [hasErrors, onErrorsChange]);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1 }}>
      {/* 트리뷰 영역 */}
      <Paper sx={{ overflow: 'auto', width: { xs: '100%', lg: '400px' }, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
        {/* 컨트롤 버튼 */}
        <Box sx={{ display: 'flex', gap: '5px', padding: '10px 18px', marginBottom: '20px', flexWrap: 'wrap', borderRadius: '5px', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <Tooltip title="추가하기">
            <span>
              <IconButton size="small" color="primary" disabled={!selectedItemId || hasErrors} onClick={handleClickItemAdd}>
                <NoteAddIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="삭제하기">
            <span>
              <IconButton size="small" color="error" disabled={!selectedItemId} onClick={handleClickItemDelete}>
                <DeleteIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <div style={{ margin: '0 18px', width: '1px', height: '30px', backgroundColor: '#fff', mixBlendMode: 'overlay' }} />
          <Tooltip title="복사하기">
            <span>
              <IconButton size="small" color="secondary" disabled={!selectedItemId || hasErrors} onClick={handleClickItemCopy}>
                <ContentCopyIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="잘라내기">
            <span>
              <IconButton size="small" color="secondary" disabled={!selectedItemId || hasErrors} onClick={handleClickItemCut}>
                <ContentCutIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="붙여넣기">
            <span>
              <IconButton size="small" color="success" disabled={!canPaste() || hasErrors} onClick={handleClickItemPaste}>
                <ContentPasteIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <div style={{ margin: '0 18px', width: '1px', height: '30px', backgroundColor: '#fff', mixBlendMode: 'overlay' }} />
          <Tooltip title="순서 위로">
            <span>
              <IconButton size="small" color="primary" disabled={!canMoveUp()} onClick={handleClickItemUp}>
                <UploadIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="순서 아래로">
            <span>
              <IconButton size="small" color="primary" disabled={!canMoveDown()} onClick={handleClickItemDown}>
                <DownloadIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* RichTreeView 컴포넌트 */}
        <RichTreeView
          items={data}
          slots={{ item: CustomTreeItem }}
          expansionTrigger="iconContainer"
          expandedItems={expandedItems}
          getItemLabel={(item) => item.key || ''}
          selectedItems={selectedItemId}
          onItemClick={handleClickItem}
          onItemExpansionToggle={handleItemExpansionToggle}
          sx={{ '& .MuiCollapse-root': { paddingLeft: '25px' } }}
          disableSelection={false}
        />
      </Paper>

      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
      <Divider sx={{ display: { xs: 'block', lg: 'none' } }} />

      {/* 노드 상세 정보 영역 */}
      <Paper sx={{ overflowY: 'auto', flex: 1, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
        {!selectedItem ? (
          <Typography>왼쪽 트리에서 노드를 선택하세요.</Typography>
        ) : (
          <>
            <Typography sx={{ marginBottom: '20px', fontSize: '20px' }}>기본 정보</Typography>
            <Stack>
              <TextField label="ID" value={selectedItem.id} autoComplete="off" disabled sx={{ marginBottom: '20px' }} />
              <TextField inputRef={keyInputRef} label="Key" value={localNodeKeyValue} autoComplete="off" error={!!keyError} helperText={keyError} sx={{ marginBottom: '20px' }} onChange={handleChangeNodeKey} onBlur={handleNodeKeyBlur} />
              <FormControlLabel
                label="사용자 어드민에서 현재 노드를 삭제할 수 있도록 허용합니다."
                labelPlacement="start"
                control={<Switch checked={selectedItem.editable ?? true} onChange={handleChangeItemPropToggle('editable')} />}
                sx={{ marginBottom: '5px', width: '100%', display: 'flex', justifyContent: 'space-between', marginLeft: 0, marginRight: 0 }}
              />
              <FormControlLabel
                label="사용자 어드민에서 하위 노드의 순서를 바꿀 수 있도록 허용 합니다."
                labelPlacement="start"
                control={<Switch checked={selectedItem.orderable ?? true} onChange={handleChangeItemPropToggle('orderable')} />}
                sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginLeft: 0, marginRight: 0 }}
              />
            </Stack>

            {/* 필드 목록 */}
            <FieldList
              localFields={localFields}
              containerRef={containerRef}
              fieldErrors={fieldErrors}
              handleAddField={handleAddField}
              handleDeleteField={handleDeleteField}
              handleChangeField={handleChangeField}
              handleChangeFieldType={handleChangeFieldType}
              handleChangeFieldToggle={handleChangeFieldToggle}
            />
          </>
        )}
      </Paper>

      {/* 노드 삭제 다이얼로그 */}
      {deleteConfirm.ConfirmDialog}

      {/* 노드 잘라내기 다이얼로그 */}
      {cutConfirm.ConfirmDialog}
    </Box>
  );
});
