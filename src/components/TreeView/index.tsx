import { ChangeEvent, FocusEvent, KeyboardEvent as ReactKeyboardEvent, Ref, SyntheticEvent, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
import { useTreeView } from '@/hooks/useTreeView';
import type { Field, FieldErrors, FieldValue, Node, TreeViewHandle } from '@/types/treeView';
import { RegExKeyName, findNode, findParentNode, isDuplicatedKey, updateNode } from '@/utils/treeView';
import FieldList from './Field/List';
import Item from './Node';

interface Props {
  data: Node[];
  onDataChange: (updatedData: Node[]) => void;
  onErrorsChange?: (hasErrors: boolean) => void;
}

export default memo(function TreeView({ data, onDataChange, onErrorsChange, ref }: Props & { ref?: Ref<TreeViewHandle> }) {
  const [localFields, setLocalFields] = useState<Field[] | undefined>(undefined);
  const [localNodeKeyValue, setLocalNodeKeyValue] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevSelectedNodeIdRef = useRef<string | null>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const fieldAndKeyRefs = useRef<{ fields: Field[] | undefined; nodeKeyValue: string }>({ fields: undefined, nodeKeyValue: '' });

  const updateLocalFields = useCallback((fields: Field[] | undefined) => {
    fieldAndKeyRefs.current.fields = fields;

    setLocalFields(fields);
  }, []);

  const updateLocalNodeKeyValue = useCallback((value: string) => {
    fieldAndKeyRefs.current.nodeKeyValue = value;

    setLocalNodeKeyValue(value);
  }, []);

  const {
    selectedNodeId,
    setSelectedNodeId,
    expandedNodesIds,
    selectedNode,
    handleClickNode,
    handleClickNodeAdd,
    handleClickNodeDelete,
    handleClickNodeCopy,
    handleClickNodeCut,
    handleClickNodePaste,
    handleClickNodeUp,
    handleClickNodeDown,
    handleChangeNodeExpansionToggle,
    handleChangeNodePropToggle,
    handleKeyDown,
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

  // 필드 변경 디바운스 처리
  const changeFieldDebounceRef = useRef(
    debounce((id: string, updatedFields: Field[], currentData: Node[]) => {
      const keyMap = new Map<string, number[]>();
      const newLocalErrors: FieldErrors = {};

      let hasLocalErrors = false;

      updatedFields.forEach((field, index) => {
        const key = field.key?.trim();

        if (!key) {
          newLocalErrors[index] = '키명은 반드시 입력해야 합니다.';
          hasLocalErrors = true;
        } else if (!RegExKeyName.test(key)) {
          newLocalErrors[index] = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
          hasLocalErrors = true;
        } else {
          if (!keyMap.has(key)) keyMap.set(key, []);

          const indices = keyMap.get(key);

          if (indices) indices.push(index);
        }
      });

      keyMap.forEach((indices) => {
        if (indices.length > 1) {
          indices.forEach((index) => {
            newLocalErrors[index] = '중복된 필드명이 있습니다';
            hasLocalErrors = true;
          });
        }
      });

      setFieldErrors(hasLocalErrors ? newLocalErrors : null);

      onDataChange(updateNode(currentData, id, { fields: updatedFields }));
    }, 100),
  );

  // 노드 키 변경 검증 및 적용
  const applyPendingNodeKeyChange = useCallback(
    (currentData: Node[]): Node[] => {
      if (!selectedNodeId || !selectedNode) return currentData;

      const currentValue = fieldAndKeyRefs.current.nodeKeyValue;
      const trimmedKey = currentValue.trim();
      const parentId = findParentNode(currentData, selectedNodeId);

      let currentKeyError: string | null = null;

      if (trimmedKey === '') {
        currentKeyError = '키명은 반드시 입력해야 합니다.';
      } else if (!RegExKeyName.test(trimmedKey)) {
        currentKeyError = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
      } else if (isDuplicatedKey(currentData, trimmedKey, selectedNodeId, parentId)) {
        currentKeyError = '동일한 뎁스에 같은 키명이 존재합니다.';
      }

      setKeyError(currentKeyError);

      if (currentKeyError === null && selectedNode.key !== currentValue) {
        return updateNode(currentData, selectedNodeId, { key: currentValue });
      }

      return currentData;
    },
    [selectedNodeId, selectedNode, setKeyError],
  );

  // 외부에서 TreeView 컴포넌트의 변경사항을 적용할 수 있도록 핸들 제공
  useImperativeHandle(
    ref,
    () => ({
      flushChanges: (): Node[] => {
        let processedData = applyPendingNodeKeyChange([...data]);

        if (selectedNode && fieldAndKeyRefs.current.fields) {
          changeFieldDebounceRef.current.flush();

          if (JSON.stringify(findNode(processedData, selectedNode.id)?.fields) !== JSON.stringify(fieldAndKeyRefs.current.fields)) {
            processedData = updateNode(processedData, selectedNode.id, { fields: fieldAndKeyRefs.current.fields });
          }
        }

        if (JSON.stringify(data) !== JSON.stringify(processedData)) {
          onDataChange(processedData);
        }

        return processedData;
      },
    }),
    [applyPendingNodeKeyChange, data, onDataChange, selectedNode],
  );

  // 노드 키 변경 핸들러
  const handleChangeNodeKey = useCallback((event: ChangeEvent<HTMLInputElement>) => updateLocalNodeKeyValue(event.target.value), [updateLocalNodeKeyValue]);

  // 노드 키 포커스 아웃 핸들러
  const handleBlurNodeKey = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      const updatedData = applyPendingNodeKeyChange(data);

      if (updatedData !== data) onDataChange(updatedData);
    },
    [applyPendingNodeKeyChange, data, onDataChange],
  );

  // 필드 값 변경 핸들러
  const handleChangeField = useCallback(
    (index: number, key: keyof Field, value: FieldValue) => {
      if (!selectedNode || !fieldAndKeyRefs.current.fields) return;

      const updatedLocalFields = [...fieldAndKeyRefs.current.fields];
      const updatedField = { ...updatedLocalFields[index] } as Field;

      updatedField[key] = value as never;

      if (key === 'key' && typeof value === 'string') {
        updatedField.key = value;
      } else if (!updatedField.key) {
        updatedField.key = '';
      }

      updatedLocalFields[index] = updatedField;

      updateLocalFields(updatedLocalFields);

      let newLocalErrors: FieldErrors = fieldErrors ? { ...fieldErrors } : {};
      let hasLocalErrors = false;

      if (key === 'key') {
        const keyString = String(value ?? '').trim();

        if (keyString === '') {
          newLocalErrors[index] = '키명은 반드시 입력해야 합니다.';
          hasLocalErrors = true;
        } else if (!RegExKeyName.test(keyString)) {
          newLocalErrors[index] = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
          hasLocalErrors = true;
        } else {
          delete newLocalErrors[index];

          for (let i = 0; i < updatedLocalFields.length; i++) {
            const field = updatedLocalFields[i];

            if (i !== index && field && field.key?.trim() === keyString) {
              newLocalErrors[index] = '중복된 필드명이 있습니다';

              if (field) newLocalErrors[i] = '중복된 필드명이 있습니다';

              hasLocalErrors = true;
              break;
            }
          }
        }
      }

      if (!hasLocalErrors && newLocalErrors && Object.keys(newLocalErrors).length === 0) newLocalErrors = null;

      setFieldErrors(newLocalErrors);

      if ((key === 'value' && typeof value === 'boolean') || key === 'editable' || key === 'required' || key === 'visible' || key === 'type') {
        // 즉시 업데이트 대상 (스위치)
        changeFieldDebounceRef.current.cancel();

        onDataChange(updateNode(data, selectedNode.id, { fields: updatedLocalFields }));
      } else {
        // 디바운스 처리 대상
        changeFieldDebounceRef.current(selectedNode.id, updatedLocalFields, data);
      }
    },
    [selectedNode, fieldErrors, setFieldErrors, data, onDataChange, updateLocalFields],
  );

  // 필드 추가 핸들러
  const handleAddField = useCallback(() => {
    if (!selectedNode) return;

    const newField: Field = { key: '', type: 'text', editable: true, required: true, visible: true, value: '', regex: '', extra: '' };
    const currentFields = fieldAndKeyRefs.current.fields ?? [];
    const newFields = [...currentFields, newField];
    const newFieldErrorIndex = newFields.length - 1;

    updateLocalFields(newFields);

    setFieldErrors((prevErrors) => ({ ...(prevErrors || {}), [newFieldErrorIndex]: '키명은 반드시 입력해야 합니다.' }));

    changeFieldDebounceRef.current(selectedNode.id, newFields, data);
  }, [selectedNode, setFieldErrors, data, updateLocalFields]);

  // 필드 삭제 핸들러
  const handleDeleteField = useCallback(
    (index: number) => {
      if (!selectedNode || !fieldAndKeyRefs.current.fields) return;

      const updatedFields = fieldAndKeyRefs.current.fields.filter((_, i) => i !== index);

      updateLocalFields(updatedFields);

      setFieldErrors((prevErrors) => {
        if (!prevErrors) return null;

        const newLocalErrors: FieldErrors = {};

        let hasAnyError = false;

        Object.entries(prevErrors).forEach(([keyStr, value]) => {
          const keyNum = Number(keyStr);

          if (keyNum !== index) {
            const newIndex = keyNum > index ? keyNum - 1 : keyNum;
            newLocalErrors[newIndex] = value;
            hasAnyError = true;
          }
        });

        return hasAnyError ? newLocalErrors : null;
      });

      changeFieldDebounceRef.current(selectedNode.id, updatedFields, data);
    },
    [selectedNode, setFieldErrors, data, updateLocalFields],
  );

  // 여러 필드 값 동시 변경 핸들러
  const handleChangeFields = useCallback(
    (index: number, dataArr: { key: keyof Field; value: FieldValue }[]) => {
      if (!selectedNode || !fieldAndKeyRefs.current.fields) return;

      const updatedLocalFields = [...fieldAndKeyRefs.current.fields];
      const updatedField = { ...updatedLocalFields[index] } as Field;

      dataArr.forEach(({ key: fieldKey, value }) => {
        (updatedField[fieldKey] as FieldValue) = value;
      });

      updatedLocalFields[index] = updatedField;

      updateLocalFields(updatedLocalFields);

      changeFieldDebounceRef.current.cancel();

      onDataChange(updateNode(data, selectedNode.id, { fields: updatedLocalFields }));
    },
    [selectedNode, onDataChange, data, updateLocalFields],
  );

  // 필드 토글 핸들러
  const handleChangeFieldToggle = useCallback((index: number, prop: 'required' | 'editable' | 'visible', checked: boolean) => handleChangeField(index, prop, checked), [handleChangeField]);

  // 필드 탐색 핸들러
  const handleTreeViewKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (keyInputRef.current === event.target) {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        } else {
          return;
        }
      }

      handleKeyDown(event);
    },
    [handleKeyDown, keyInputRef],
  );

  useEffect(() => {
    const currentSelectedId = selectedNodeId;

    if (selectedNode) {
      updateLocalNodeKeyValue(selectedNode.key || '');
      updateLocalFields(selectedNode.fields ? [...selectedNode.fields] : undefined);

      if (keyInputRef.current && currentSelectedId && prevSelectedNodeIdRef.current !== currentSelectedId && (selectedNode.key === '' || typeof selectedNode.key === 'undefined') && !hasErrors) {
        setTimeout(() => {
          keyInputRef.current?.focus();
        }, 0);
      }
    } else {
      updateLocalNodeKeyValue('');
      updateLocalFields(undefined);
    }
    prevSelectedNodeIdRef.current = currentSelectedId;
  }, [selectedNode, selectedNodeId, updateLocalFields, updateLocalNodeKeyValue, hasErrors]);

  // 컴포넌트 언마운트 시 디바운스 취소
  useEffect(() => {
    const debouncedFunc = changeFieldDebounceRef.current;

    return () => {
      debouncedFunc.cancel();
    };
  }, []);

  // 에러 상태 변경 시 콜백 호출
  useEffect(() => {
    if (onErrorsChange) onErrorsChange(hasErrors);
  }, [hasErrors, onErrorsChange]);

  // 최초 루트 노드 선택 및 확장
  useEffect(() => {
    if (!data?.length) return;

    const rootNode = data[0];

    if (!rootNode) return;
    if (!selectedNodeId) setSelectedNodeId(rootNode.id);

    const hasChildren = rootNode.children && rootNode.children.length > 0;
    const isExpanded = expandedNodesIds.includes(rootNode.id);

    if (hasChildren && !isExpanded && !hasErrors) {
      handleChangeNodeExpansionToggle(null as unknown as SyntheticEvent, rootNode.id, true);
    }
  }, [data, expandedNodesIds, handleChangeNodeExpansionToggle, selectedNodeId, setSelectedNodeId, hasErrors]);

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, flex: 1, outline: 'none' }} tabIndex={0} onKeyDown={handleTreeViewKeyDown}>
      <Paper sx={{ overflow: 'auto', width: { xs: '100%', lg: '400px' }, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '10px 16px', marginBottom: '20px', flexWrap: 'wrap', borderRadius: '5px', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <Tooltip title="추가하기">
            <span>
              <IconButton size="small" color="primary" disabled={(!selectedNodeId && data.length > 0) || hasErrors} onClick={handleClickNodeAdd}>
                <NoteAddIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="삭제하기">
            <span>
              <IconButton size="small" color="error" disabled={!selectedNodeId} onClick={handleClickNodeDelete}>
                <DeleteIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <div style={{ margin: '0 16px', width: '1px', height: '30px', backgroundColor: '#fff', mixBlendMode: 'overlay' }} />
          <Tooltip title="복사하기">
            <span>
              <IconButton size="small" color="secondary" disabled={!selectedNodeId || hasErrors} onClick={handleClickNodeCopy}>
                <ContentCopyIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="잘라내기">
            <span>
              <IconButton size="small" color="secondary" disabled={!selectedNodeId || hasErrors} onClick={handleClickNodeCut}>
                <ContentCutIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="붙여넣기">
            <span>
              <IconButton size="small" color="success" disabled={!canPaste() || hasErrors} onClick={handleClickNodePaste}>
                <ContentPasteIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <div style={{ margin: '0 16px', width: '1px', height: '30px', backgroundColor: '#fff', mixBlendMode: 'overlay' }} />
          <Tooltip title="순서 위로">
            <span>
              <IconButton size="small" color="primary" disabled={!canMoveUp()} onClick={handleClickNodeUp}>
                <UploadIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="순서 아래로">
            <span>
              <IconButton size="small" color="primary" disabled={!canMoveDown()} onClick={handleClickNodeDown}>
                <DownloadIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <RichTreeView
          items={data}
          slots={{ item: Item }}
          expansionTrigger="iconContainer"
          selectedItems={selectedNodeId}
          expandedItems={expandedNodesIds}
          onItemClick={handleClickNode as (event: SyntheticEvent, id: string) => void}
          onItemExpansionToggle={handleChangeNodeExpansionToggle as (event: SyntheticEvent, id: string, isExpanded: boolean) => void}
          getItemLabel={(node) => node.key || ''}
          sx={{ '& .MuiCollapse-root': { paddingLeft: '25px' } }}
        />
      </Paper>
      <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
      <Divider sx={{ display: { xs: 'block', lg: 'none' } }} />
      {selectedNode && (
        <Paper sx={{ overflowY: 'auto', flex: 1, padding: '20px', boxShadow: 'none', borderRadius: '0' }}>
          <Typography sx={{ marginBottom: '20px', fontSize: '20px' }}>기본 정보</Typography>
          <Stack>
            <TextField label="ID" autoComplete="off" value={selectedNode.id} fullWidth disabled sx={{ marginBottom: '20px' }} />
            <TextField inputRef={keyInputRef} label="Key" autoComplete="off" value={localNodeKeyValue} fullWidth error={!!keyError} helperText={keyError} sx={{ marginBottom: '20px' }} onChange={handleChangeNodeKey} onBlur={handleBlurNodeKey} />
            <FormControlLabel
              label="사용자 어드민에서 현재 노드를 삭제할 수 있도록 허용합니다."
              labelPlacement="start"
              control={<Switch checked={selectedNode.editable ?? true} onChange={handleChangeNodePropToggle('editable')} />}
              sx={{ marginBottom: '5px', width: '100%', display: 'flex', justifyContent: 'space-between', marginLeft: 0, marginRight: 0 }}
            />
            <FormControlLabel
              label="사용자 어드민에서 하위 노드의 순서를 바꿀 수 있도록 허용 합니다."
              labelPlacement="start"
              control={<Switch checked={selectedNode.orderable ?? true} onChange={handleChangeNodePropToggle('orderable')} />}
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
      {deleteConfirm.ConfirmDialog}
      {cutConfirm.ConfirmDialog}
    </Box>
  );
});
