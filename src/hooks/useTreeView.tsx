import { ChangeEvent, MouseEvent, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ClipboardItem, FieldErrors, TreeViewItem } from '@/types/treeView';
import { useNotifications } from '@toolpad/core/useNotifications';
import { RegExKeyName, cloneItemWithNewIds, deleteItemById, findItemById, findParentId, isDescendantOf, isDuplicatedKey, updateItemById } from '@/utils/treeView';

export const useTreeView = (data: TreeViewItem[], onDataChange: (updatedData: TreeViewItem[]) => void) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemToCutId, setItemToCutId] = useState<string | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(null);

  const prevSelectedItemIdRef = useRef<string | null>(null);
  const notifications = useNotifications();

  const selectedItem = useMemo(() => (selectedItemId ? findItemById(data, selectedItemId) : null), [selectedItemId, data]);
  const hasErrors = useMemo(() => !!keyError || (!!fieldErrors && Object.keys(fieldErrors).length > 0), [keyError, fieldErrors]);

  // 삭제 확인 다이얼로그
  const deleteConfirm = useConfirmDialog({
    title: '노드 삭제',
    content: (
      <>
        선택한 노드(하위 노드 포함)가 삭제됩니다.
        <br />
        계속하시겠습니까?
      </>
    ),
    cancelText: '취소',
    confirmText: '삭제',
    onConfirm: useCallback(async () => {
      try {
        if (!itemToDeleteId) return;

        const updatedData = deleteItemById(data, itemToDeleteId);

        onDataChange(updatedData);

        setItemToDeleteId(null);
        setSelectedItemId(null);
        setKeyError(null);
        setFieldErrors(null);

        notifications.show('선택된 노드를 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '선택된 노드 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [data, itemToDeleteId, onDataChange, notifications]),
  });

  // 잘라내기 확인 다이얼로그
  const cutConfirm = useConfirmDialog({
    title: '노드 잘라내기',
    content: (
      <>
        선택한 노드(하위 노드 포함)를 잘라내어 클립보드에 저장합니다.
        <br />
        계속하시겠습니까?
      </>
    ),
    cancelText: '취소',
    confirmText: '잘라내기',
    onConfirm: useCallback(async () => {
      try {
        if (!itemToCutId) return;

        const itemToCut = findItemById(data, itemToCutId);

        if (!itemToCut) {
          notifications.show('잘라낼 노드를 찾을 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });
          return;
        }

        setClipboard({ item: JSON.parse(JSON.stringify(itemToCut)), operation: 'cut', sourceId: itemToCutId });

        const updatedData = deleteItemById(data, itemToCutId);

        onDataChange(updatedData);

        setItemToCutId(null);
        setSelectedItemId(null);
        setKeyError(null);
        setFieldErrors(null);

        notifications.show('선택된 노드를 잘라냈습니다.', { severity: 'success', autoHideDuration: 1000 });
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '선택된 노드 잘라내기에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [data, itemToCutId, onDataChange, notifications]),
  });

  // 선택된 아이템 변경 시 오류 체크
  useEffect(() => {
    const currentSelectedItemId = selectedItemId;

    if (selectedItem) {
      const trimmedKey = selectedItem.key?.trim() ?? '';
      const parentId = findParentId(data, selectedItem.id);

      let currentKeyError: string | null = null;

      if (trimmedKey === '') {
        currentKeyError = '키명은 반드시 입력해야 합니다.';
      } else if (!RegExKeyName.test(trimmedKey)) {
        currentKeyError = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
      } else if (isDuplicatedKey(data, trimmedKey, selectedItem.id, parentId)) {
        currentKeyError = '동일한 뎁스에 같은 키명이 존재합니다.';
      }

      setKeyError(currentKeyError);

      if (currentSelectedItemId !== prevSelectedItemIdRef.current) {
        setFieldErrors(null);
      }
    } else {
      setKeyError(null);
      setFieldErrors(null);
    }

    prevSelectedItemIdRef.current = currentSelectedItemId;
  }, [selectedItem, selectedItemId, data]);

  // 붙여넣기 가능 여부 확인 함수
  const canPaste = useCallback(() => {
    if (!selectedItemId || !clipboard) return false;
    if (selectedItemId === clipboard.sourceId && clipboard.operation === 'cut') return false;

    const sourceExists = findItemById(data, clipboard.sourceId);

    if (sourceExists && clipboard.operation === 'cut') {
      return !isDescendantOf(data, clipboard.sourceId, selectedItemId);
    }

    return true;
  }, [selectedItemId, clipboard, data]);

  // 붙여넣기 함수
  const pasteToItem = useCallback((items: TreeViewItem[], parentId: string, clipboardItem: TreeViewItem): TreeViewItem[] => {
    const itemToPaste = cloneItemWithNewIds(clipboardItem);

    let pasted = false;

    const pasteRecursive = (currentItems: TreeViewItem[]): TreeViewItem[] => {
      return currentItems.map((item) => {
        if (item.id === parentId) {
          pasted = true;

          const newChildren = [...(item.children || []), itemToPaste];

          setExpandedItems((prev) => (!prev.includes(parentId) ? [...prev, parentId] : prev));
          setSelectedItemId(itemToPaste.id);

          return { ...item, children: newChildren };
        }

        if (item.children?.length) return { ...item, children: pasteRecursive(item.children) };

        return item;
      });
    };

    const result = pasteRecursive(items);

    if (!pasted) {
      console.error('붙여넣기 대상 부모 노드를 찾지 못했습니다:', parentId);

      return items;
    }

    return result;
  }, []);

  // 위로 이동 가능 여부 확인 함수
  const canMoveUp = useCallback(() => {
    if (!selectedItemId) return false;

    const parentId = findParentId(data, selectedItemId);

    if (parentId) {
      const parent = findItemById(data, parentId);

      if (!parent?.children) return false;

      const index = parent.children.findIndex((child) => child.id === selectedItemId);

      return index > 0;
    } else {
      const index = data.findIndex((item) => item.id === selectedItemId);

      return index > 0;
    }
  }, [selectedItemId, data]);

  // 아래로 이동 가능 여부 확인 함수
  const canMoveDown = useCallback(() => {
    if (!selectedItemId) return false;

    const parentId = findParentId(data, selectedItemId);

    if (parentId) {
      const parent = findItemById(data, parentId);

      if (!parent?.children) return false;

      const index = parent.children.findIndex((child) => child.id === selectedItemId);

      return index >= 0 && index < parent.children.length - 1;
    } else {
      const index = data.findIndex((item) => item.id === selectedItemId);

      return index >= 0 && index < data.length - 1;
    }
  }, [selectedItemId, data]);

  // 위로 이동 함수
  const moveItemUp = useCallback(
    (id: string): TreeViewItem[] => {
      const moveRecursive = (items: TreeViewItem[]): TreeViewItem[] => {
        const rootIndex = items.findIndex((item) => item.id === id);

        if (rootIndex > 0) {
          const newItems = [...items];
          const itemToMove = newItems[rootIndex];
          const itemToSwapWith = newItems[rootIndex - 1];

          if (itemToMove && itemToSwapWith) [newItems[rootIndex - 1], newItems[rootIndex]] = [itemToMove, itemToSwapWith];

          return newItems;
        } else if (rootIndex === 0) {
          return items;
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item && item.children && item.children.length > 0) {
            const childIndex = item.children.findIndex((child) => child.id === id);

            if (childIndex > 0) {
              const newChildren = [...item.children];
              const childToMove = newChildren[childIndex];
              const childToSwapWith = newChildren[childIndex - 1];

              if (childToMove && childToSwapWith) [newChildren[childIndex - 1], newChildren[childIndex]] = [childToMove, childToSwapWith];

              const newItems = [...items];
              const currentItem = newItems[i];

              if (currentItem) newItems[i] = { ...currentItem, children: newChildren };

              return newItems;
            } else if (childIndex === 0) {
              return items;
            } else {
              const updatedChildren = moveRecursive(item.children);

              if (updatedChildren !== item.children) {
                const newItems = [...items];
                const currentItem = newItems[i];

                if (currentItem) newItems[i] = { ...currentItem, children: updatedChildren };

                return newItems;
              }
            }
          }
        }

        return items;
      };

      return moveRecursive([...data]);
    },
    [data],
  );

  // 아래로 이동 함수
  const moveItemDown = useCallback(
    (id: string): TreeViewItem[] => {
      const moveRecursive = (items: TreeViewItem[]): TreeViewItem[] => {
        const rootIndex = items.findIndex((item) => item.id === id);

        if (rootIndex >= 0 && rootIndex < items.length - 1) {
          const newItems = [...items];
          const itemToMove = newItems[rootIndex];
          const itemToSwapWith = newItems[rootIndex + 1];

          if (itemToMove && itemToSwapWith) [newItems[rootIndex], newItems[rootIndex + 1]] = [itemToSwapWith, itemToMove];

          return newItems;
        } else if (rootIndex === items.length - 1) {
          return items;
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item && item.children && item.children.length > 0) {
            const childIndex = item.children.findIndex((child) => child.id === id);

            if (childIndex >= 0 && childIndex < item.children.length - 1) {
              const newChildren = [...item.children];
              const childToMove = newChildren[childIndex];
              const childToSwapWith = newChildren[childIndex + 1];

              if (childToMove && childToSwapWith) [newChildren[childIndex], newChildren[childIndex + 1]] = [childToSwapWith, childToMove];

              const newItems = [...items];
              const currentItem = newItems[i];

              if (currentItem) newItems[i] = { ...currentItem, children: newChildren };

              return newItems;
            } else if (childIndex === item.children.length - 1) {
              return items;
            } else {
              const updatedChildren = moveRecursive(item.children);

              if (updatedChildren !== item.children) {
                const newItems = [...items];
                const currentItem = newItems[i];

                if (currentItem) newItems[i] = { ...currentItem, children: updatedChildren };

                return newItems;
              }
            }
          }
        }

        return items;
      };

      return moveRecursive([...data]);
    },
    [data],
  );

  // 노드 확장 상태 변경 핸들러
  const handleItemExpansionToggle = useCallback(
    (event: SyntheticEvent | null, itemId: string, isExpanded: boolean) => {
      if (hasErrors) return;
      if (event) event.stopPropagation();

      setExpandedItems((prev) => {
        if (isExpanded) {
          return prev.includes(itemId) ? prev : [...prev, itemId];
        } else {
          return prev.filter((id) => id !== itemId);
        }
      });
    },
    [hasErrors],
  );

  // 노드 클릭 핸들러
  const handleClickItem = useCallback(
    (_event: MouseEvent | null, itemId: string) => {
      if (hasErrors && itemId !== selectedItemId) {
        notifications.show('현재 노드의 오류를 먼저 수정해야 합니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }

      setSelectedItemId(itemId);
    },
    [hasErrors, selectedItemId, notifications],
  );

  // 노드 추가 핸들러
  const handleClickItemAdd = useCallback(() => {
    const newId = crypto.randomUUID();

    let updatedData: TreeViewItem[];

    if (!selectedItemId) {
      const newItem: TreeViewItem = { id: newId, key: '', editable: true, orderable: true, fields: [], children: [] };

      updatedData = [...data, newItem];

      notifications.show('최상위에 새 노드를 추가했습니다.', { severity: 'success', autoHideDuration: 1000 });
    } else {
      let foundParent = false;

      const addChildRecursive = (items: TreeViewItem[], pId: string): TreeViewItem[] => {
        return items.map((item) => {
          if (item.id === pId) {
            foundParent = true;

            const newChild: TreeViewItem = { id: newId, key: '', editable: true, orderable: true, fields: [], children: [] };

            setExpandedItems((prev) => (!prev.includes(pId) ? [...prev, pId] : prev));

            return { ...item, children: [...(item.children || []), newChild] };
          }

          if (item.children?.length) return { ...item, children: addChildRecursive(item.children, pId) };

          return item;
        });
      };

      updatedData = addChildRecursive([...data], selectedItemId);

      if (foundParent) {
        notifications.show('선택된 노드 하위로 노드를 추가했습니다.', { severity: 'success', autoHideDuration: 1000 });
      } else {
        notifications.show('노드 추가에 실패했습니다. 부모 노드를 찾을 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }
    }

    onDataChange(updatedData);

    setSelectedItemId(newId);
  }, [selectedItemId, data, onDataChange, notifications]);

  // 노드 삭제 핸들러
  const handleClickItemDelete = useCallback(() => {
    if (!selectedItemId) return;

    setItemToDeleteId(selectedItemId);

    deleteConfirm.handleOpen();
  }, [selectedItemId, deleteConfirm]);

  // 노드 복사 핸들러
  const handleClickItemCopy = useCallback(() => {
    if (!selectedItemId) return;

    const itemToCopy = findItemById(data, selectedItemId);

    if (!itemToCopy) return;

    setClipboard({ item: JSON.parse(JSON.stringify(itemToCopy)), operation: 'copy', sourceId: selectedItemId });

    notifications.show('선택된 노드를 복사했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedItemId, data, notifications]);

  // 노드 잘라내기 핸들러
  const handleClickItemCut = useCallback(() => {
    if (!selectedItemId) return;

    setItemToCutId(selectedItemId);

    cutConfirm.handleOpen();
  }, [selectedItemId, cutConfirm]);

  // 노드 붙여넣기 핸들러
  const handleClickItemPaste = useCallback(() => {
    if (!selectedItemId || !clipboard) return;

    if (!canPaste()) {
      notifications.show('선택된 위치에 붙여넣을 수 없습니다.', { severity: 'warning', autoHideDuration: 2000 });

      return;
    }

    const updatedData = pasteToItem(data, selectedItemId, clipboard.item);

    onDataChange(updatedData);

    if (clipboard.operation === 'cut') setClipboard(null);

    notifications.show('클립보드의 노드를 붙여넣기 했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedItemId, clipboard, data, pasteToItem, onDataChange, notifications, canPaste]);

  // 노드 위로 이동 핸들러
  const handleClickItemUp = useCallback(() => {
    if (!selectedItemId || !canMoveUp()) return;

    const updatedData = moveItemUp(selectedItemId);

    onDataChange(updatedData);

    notifications.show('선택된 노드를 위로 이동했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedItemId, canMoveUp, moveItemUp, onDataChange, notifications]);

  // 노드 아래로 이동 핸들러
  const handleClickItemDown = useCallback(() => {
    if (!selectedItemId || !canMoveDown()) return;

    const updatedData = moveItemDown(selectedItemId);

    onDataChange(updatedData);

    notifications.show('선택된 노드를 아래로 이동했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedItemId, canMoveDown, moveItemDown, onDataChange, notifications]);

  // 노드 속성 토글 핸들러
  const handleChangeItemPropToggle = useCallback(
    (field: 'editable' | 'orderable') => (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (!selectedItemId) return;

      if (hasErrors) {
        notifications.show('오류가 있는 노드는 속성을 변경할 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }

      const updatedData = updateItemById(data, selectedItemId, { [field]: checked });

      onDataChange(updatedData);
    },
    [selectedItemId, data, onDataChange, hasErrors, notifications],
  );

  return {
    // 상태
    selectedItemId,
    setSelectedItemId,
    clipboard,
    expandedItems,
    selectedItem,
    keyError,
    setKeyError,
    fieldErrors,
    setFieldErrors,

    // 상태 체크 함수
    canPaste,
    canMoveUp,
    canMoveDown,
    hasErrors,

    // 이벤트 핸들러
    handleClickItem,
    handleClickItemAdd,
    handleClickItemDelete,
    handleClickItemCopy,
    handleClickItemCut,
    handleClickItemPaste,
    handleClickItemUp,
    handleClickItemDown,
    handleItemExpansionToggle,
    handleChangeItemPropToggle,

    // 다이얼로그
    deleteConfirm,
    cutConfirm,
  };
};
