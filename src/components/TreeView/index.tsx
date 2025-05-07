import { ChangeEvent, FocusEvent, SyntheticEvent, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTreeView } from '@/hooks/useTreeView';
import type { Field, FieldErrors, FieldValue, TreeViewHandle, TreeViewItem } from '@/types/treeView';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UploadIcon from '@mui/icons-material/Upload';
import { Box, Divider, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { debounce } from 'lodash-es';
import { RegExKeyName, findItemById, findParentId, isDuplicatedKey, updateItemById } from '@/utils/treeView';
import CustomTreeItem from './CustomTreeItem';
import FieldList from './FieldList';

interface Props {
  data: TreeViewItem[];
  onDataChange: (updatedData: TreeViewItem[]) => void;
  onErrorsChange?: (hasErrors: boolean) => void;
}

export default memo(function TreeView({ data, onDataChange, onErrorsChange, ref }: Props & { ref?: React.Ref<TreeViewHandle> }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const localFieldsRef = useRef<Field[] | undefined>(undefined);
  const localNodeKeyValueRef = useRef<string>('');

  const [localFields, setLocalFields] = useState<Field[] | undefined>(undefined);
  const [localNodeKeyValue, setLocalNodeKeyValue] = useState<string>('');

  const setLocalFieldsStateAndRef = useCallback((fields: Field[] | undefined) => {
    localFieldsRef.current = fields;

    setLocalFields(fields);
  }, []);

  const setLocalNodeKeyValueStateAndRef = useCallback((value: string) => {
    localNodeKeyValueRef.current = value;

    setLocalNodeKeyValue(value);
  }, []);

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
    hasErrors: viewHasErrors,
    setFieldErrors,
  } = useTreeView(data, onDataChange);

  const changeFieldDebounceRef = useRef(
    debounce((itemId: string, updatedFields: Field[], currentData: TreeViewItem[]) => {
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

      onDataChange(updateItemById(currentData, itemId, { fields: updatedFields }));
    }, 100),
  );

  const handleChangeField = useCallback(
    (index: number, key: keyof Field, value: FieldValue) => {
      if (!selectedItem || !localFieldsRef.current) return;

      const updatedLocalFields = [...localFieldsRef.current];
      const updatedField: Field = { ...updatedLocalFields[index] } as Field;

      updatedField[key] = value as never;

      if (key === 'key' && typeof value === 'string') updatedField.key = value;
      else if (!updatedField.key) updatedField.key = '';

      updatedLocalFields[index] = updatedField;

      setLocalFieldsStateAndRef(updatedLocalFields);

      let newErrors: FieldErrors = fieldErrors ? { ...fieldErrors } : {};
      let hasValidationError = false;

      if (key === 'key') {
        const keyString = String(value ?? '').trim();

        if (keyString === '') {
          newErrors[index] = '키명은 반드시 입력해야 합니다.';
          hasValidationError = true;
        } else if (!RegExKeyName.test(keyString)) {
          newErrors[index] = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
          hasValidationError = true;
        } else {
          delete newErrors[index];

          for (let i = 0; i < updatedLocalFields.length; i++) {
            const field = updatedLocalFields[i];

            if (i !== index && field && field.key?.trim() === keyString) {
              newErrors[index] = '중복된 필드명이 있습니다';
              hasValidationError = true;

              if (updatedLocalFields[i]) newErrors[i] = '중복된 필드명이 있습니다';
            }
          }
        }
      }

      if (!hasValidationError && newErrors && newErrors[index]) delete newErrors[index];
      if (newErrors && Object.keys(newErrors).length === 0) newErrors = null;

      setFieldErrors(newErrors);

      changeFieldDebounceRef.current(selectedItem.id, updatedLocalFields, data);
    },
    [selectedItem, fieldErrors, setFieldErrors, data, setLocalFieldsStateAndRef],
  );

  const _applyPendingNodeKeyChange = useCallback(
    (currentData: TreeViewItem[]): TreeViewItem[] => {
      if (!selectedItemId || !selectedItem) return currentData;

      const currentValue = localNodeKeyValueRef.current;
      const trimmedKey = currentValue.trim();
      const parentId = findParentId(currentData, selectedItemId);

      let currentKeyError: string | null = null;

      if (trimmedKey === '') {
        currentKeyError = '키명은 반드시 입력해야 합니다.';
      } else if (!RegExKeyName.test(trimmedKey)) {
        currentKeyError = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
      } else if (isDuplicatedKey(currentData, trimmedKey, selectedItemId, parentId)) {
        currentKeyError = '동일한 뎁스에 같은 키명이 존재합니다.';
      }

      setKeyError(currentKeyError);

      if (currentKeyError === null && selectedItem.key !== currentValue) {
        return updateItemById(currentData, selectedItemId, { key: currentValue });
      }

      return currentData;
    },
    [selectedItemId, selectedItem, setKeyError],
  );

  const handleNodeKeyBlur = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      const updatedData = _applyPendingNodeKeyChange(data);

      if (updatedData !== data) onDataChange(updatedData);
    },
    [_applyPendingNodeKeyChange, data, onDataChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      flushChanges: (): TreeViewItem[] => {
        let processedData = _applyPendingNodeKeyChange([...data]);

        if (selectedItem && localFieldsRef.current) {
          changeFieldDebounceRef.current.flush();

          const currentFieldsFromSelectedItem = findItemById(processedData, selectedItem.id)?.fields;

          if (JSON.stringify(currentFieldsFromSelectedItem) !== JSON.stringify(localFieldsRef.current)) {
            processedData = updateItemById(processedData, selectedItem.id, { fields: localFieldsRef.current });
          }
        }

        if (JSON.stringify(data) !== JSON.stringify(processedData)) {
          onDataChange(processedData);
        }

        return processedData;
      },
    }),
    [_applyPendingNodeKeyChange, data, onDataChange, selectedItem],
  );

  useEffect(() => {
    if (selectedItem) {
      setLocalNodeKeyValueStateAndRef(selectedItem.key || '');
      setLocalFieldsStateAndRef(selectedItem.fields ? [...selectedItem.fields] : undefined);
    } else {
      setLocalNodeKeyValueStateAndRef('');
      setLocalFieldsStateAndRef(undefined);
    }
  }, [selectedItem, setLocalFieldsStateAndRef, setLocalNodeKeyValueStateAndRef]);

  useEffect(() => {
    const debouncedFunc = changeFieldDebounceRef.current;

    return () => {
      debouncedFunc.cancel();
    };
  }, []);

  useEffect(() => {
    if (onErrorsChange) onErrorsChange(viewHasErrors);
  }, [viewHasErrors, onErrorsChange]);

  const handleChangeNodeKey = useCallback((event: ChangeEvent<HTMLInputElement>) => setLocalNodeKeyValueStateAndRef(event.target.value), [setLocalNodeKeyValueStateAndRef]);

  const handleAddField = useCallback(() => {
    if (!selectedItem) return;

    const newField: Field = { key: '', type: 'text', editable: true, required: true, visible: true, value: '', regex: '' };
    const currentFields = localFieldsRef.current ?? [];
    const newFields = [...currentFields, newField];
    const newFieldErrorIndex = newFields.length - 1;

    setLocalFieldsStateAndRef(newFields);

    setFieldErrors((prevErrors) => ({ ...(prevErrors || {}), [newFieldErrorIndex]: '키명은 반드시 입력해야 합니다.' }));

    changeFieldDebounceRef.current(selectedItem.id, newFields, data);
  }, [selectedItem, setFieldErrors, data, setLocalFieldsStateAndRef]);

  const handleDeleteField = useCallback(
    (index: number) => {
      if (!selectedItem || !localFieldsRef.current) return;

      const updatedFields = localFieldsRef.current.filter((_, i) => i !== index);

      setLocalFieldsStateAndRef(updatedFields);

      setFieldErrors((prevErrors) => {
        if (!prevErrors) return null;

        const newErrors: FieldErrors = {};

        let hasAnyError = false;

        Object.entries(prevErrors).forEach(([keyStr, value]) => {
          const keyNum = Number(keyStr);

          if (keyNum !== index) {
            const newIndex = keyNum > index ? keyNum - 1 : keyNum;
            newErrors[newIndex] = value;
            hasAnyError = true;
          }
        });

        return hasAnyError ? newErrors : null;
      });

      changeFieldDebounceRef.current(selectedItem.id, updatedFields, data);
    },
    [selectedItem, setFieldErrors, data, setLocalFieldsStateAndRef],
  );

  const handleChangeFields = useCallback(
    (index: number, dataArr: { key: keyof Field; value: FieldValue }[]) => {
      if (!selectedItem || !localFieldsRef.current) return;

      const updatedLocalFields = [...localFieldsRef.current];
      const updatedField: Field = { ...updatedLocalFields[index] } as Field;

      dataArr.forEach(({ key: fieldKey, value }) => Object.assign(updatedField, { [fieldKey]: value }));

      updatedLocalFields[index] = updatedField;

      setLocalFieldsStateAndRef(updatedLocalFields);

      onDataChange(updateItemById(data, selectedItem.id, { fields: updatedLocalFields }));

      changeFieldDebounceRef.current.cancel();
    },
    [selectedItem, onDataChange, data, setLocalFieldsStateAndRef],
  );

  const handleChangeFieldToggle = useCallback((index: number, prop: 'required' | 'editable' | 'visible', checked: boolean) => handleChangeField(index, prop, checked), [handleChangeField]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const firstItem = data[0];

    if (!firstItem) return;
    if (!selectedItemId) setSelectedItemId(firstItem.id);

    const hasChildren = firstItem.children && firstItem.children.length > 0;
    const isExpanded = expandedItems.includes(firstItem.id);

    if (hasChildren && !isExpanded) handleItemExpansionToggle(null, firstItem.id, true);
  }, [data, expandedItems, handleItemExpansionToggle, selectedItemId, setSelectedItemId]);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1 }}>
      <Paper sx={{ overflow: 'auto', width: { xs: '100%', lg: '400px' }, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
        <Box sx={{ display: 'flex', gap: '5px', padding: '10px 18px', marginBottom: '20px', flexWrap: 'wrap', borderRadius: '5px', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <Tooltip title="추가하기">
            <span>
              <IconButton size="small" color="primary" disabled={!selectedItemId || viewHasErrors} onClick={handleClickItemAdd}>
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
              <IconButton size="small" color="secondary" disabled={!selectedItemId || viewHasErrors} onClick={handleClickItemCopy}>
                <ContentCopyIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="잘라내기">
            <span>
              <IconButton size="small" color="secondary" disabled={!selectedItemId || viewHasErrors} onClick={handleClickItemCut}>
                <ContentCutIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="붙여넣기">
            <span>
              <IconButton size="small" color="success" disabled={!canPaste() || viewHasErrors} onClick={handleClickItemPaste}>
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

        <RichTreeView
          items={data}
          slots={{ item: CustomTreeItem }}
          expansionTrigger="iconContainer"
          selectedItems={selectedItemId}
          expandedItems={expandedItems}
          onItemClick={handleClickItem as (event: SyntheticEvent, itemId: string) => void}
          onItemExpansionToggle={handleItemExpansionToggle as (event: SyntheticEvent, itemId: string, isExpanded: boolean) => void}
          getItemLabel={(item) => item.key || ''}
          sx={{ '& .MuiCollapse-root': { paddingLeft: '25px' } }}
        />
      </Paper>

      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
      <Divider sx={{ display: { xs: 'block', lg: 'none' } }} />

      {selectedItem && (
        <Paper sx={{ overflowY: 'auto', flex: 1, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
          <Typography sx={{ marginBottom: '20px', fontSize: '20px' }}>기본 정보</Typography>
          <Stack>
            <TextField label="ID" value={selectedItem.id} autoComplete="off" fullWidth disabled sx={{ marginBottom: '20px' }} />
            <TextField inputRef={keyInputRef} label="Key" value={localNodeKeyValue} autoComplete="off" fullWidth error={!!keyError} helperText={keyError} sx={{ marginBottom: '20px' }} onChange={handleChangeNodeKey} onBlur={handleNodeKeyBlur} />
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

          <FieldList
            localFields={localFields}
            containerRef={containerRef}
            fieldErrors={fieldErrors}
            handleAddField={handleAddField}
            handleDeleteField={handleDeleteField}
            handleChangeField={handleChangeField}
            handleChangeFields={handleChangeFields}
            handleChangeFieldToggle={handleChangeFieldToggle}
          />
        </Paper>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm.ConfirmDialog}

      {/* 잘라내기 확인 다이얼로그 */}
      {cutConfirm.ConfirmDialog}
    </Box>
  );
});
