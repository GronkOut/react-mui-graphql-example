import { ChangeEvent, KeyboardEvent, MouseEvent, SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '@toolpad/core/useNotifications';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ClipboardNode, FieldErrors, Node } from '@/types/treeView';
import { RegExKeyName, cloneNode, deleteNode, findNode, findParentNode, getVisibleNodes, isDescendant, isDuplicatedKey, updateNode } from '@/utils/treeView';

export const useTreeView = (data: Node[], onDataChange: (updatedData: Node[]) => void) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [clippedNodeId, setClippedNodeId] = useState<string | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardNode | null>(null);
  const [expandedNodesIds, setExpandedNodesIds] = useState<string[]>([]);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(null);

  const prevSelectedNodeIdRef = useRef<string | null>(null);
  const notifications = useNotifications();

  const selectedNode = useMemo(() => (selectedNodeId ? findNode(data, selectedNodeId) : null), [selectedNodeId, data]);
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
        if (!deleteNodeId) return;

        onDataChange(deleteNode(data, deleteNodeId));

        setDeleteNodeId(null);
        setSelectedNodeId(null);
        setKeyError(null);
        setFieldErrors(null);

        notifications.show('선택된 노드를 삭제했습니다.', { severity: 'success', autoHideDuration: 1000 });
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '선택된 노드 삭제에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [data, deleteNodeId, onDataChange, notifications]),
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
        if (!clippedNodeId) return;

        const clippedNode = findNode(data, clippedNodeId);

        if (!clippedNode) {
          notifications.show('잘라낼 노드를 찾을 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });
          return;
        }

        setClipboard({ node: JSON.parse(JSON.stringify(clippedNode)), operation: 'cut', sourceId: clippedNodeId });

        onDataChange(deleteNode(data, clippedNodeId));

        setClippedNodeId(null);
        setSelectedNodeId(null);
        setKeyError(null);
        setFieldErrors(null);

        notifications.show('선택된 노드를 잘라냈습니다.', { severity: 'success', autoHideDuration: 1000 });
      } catch (error) {
        notifications.show(error instanceof Error ? error.message : '선택된 노드 잘라내기에 실패했습니다.', { severity: 'error', autoHideDuration: 2000 });
      }
    }, [data, clippedNodeId, onDataChange, notifications]),
  });

  // 선택된 노드 변경 시 오류 체크
  useEffect(() => {
    const currentSelectedNodeId = selectedNodeId;

    if (selectedNode) {
      const trimmedKey = selectedNode.key?.trim() ?? '';
      const parentId = findParentNode(data, selectedNode.id);

      let currentKeyError: string | null = null;

      if (trimmedKey === '') {
        currentKeyError = '키명은 반드시 입력해야 합니다.';
      } else if (!RegExKeyName.test(trimmedKey)) {
        currentKeyError = '영문 대소문자로 시작해야하고, 이후에 영문, 숫자, 언더바만 입력 가능합니다.';
      } else if (isDuplicatedKey(data, trimmedKey, selectedNode.id, parentId)) {
        currentKeyError = '동일한 뎁스에 같은 키명이 존재합니다.';
      }

      setKeyError(currentKeyError);

      if (currentSelectedNodeId !== prevSelectedNodeIdRef.current) {
        setFieldErrors(null);
      }
    } else {
      setKeyError(null);
      setFieldErrors(null);
    }

    prevSelectedNodeIdRef.current = currentSelectedNodeId;
  }, [selectedNode, selectedNodeId, data, setFieldErrors]);

  // 붙여넣기 가능 여부 확인
  const canPaste = useCallback(() => {
    if (!selectedNodeId || !clipboard) return false;
    if (selectedNodeId === clipboard.sourceId && clipboard.operation === 'cut') return false;

    if (clipboard.operation === 'cut') {
      const originalId = clipboard.node.id;

      if (isDescendant(data, selectedNodeId, originalId) || selectedNodeId === originalId) {
        return false;
      }
    }

    return true;
  }, [selectedNodeId, clipboard, data]);

  // 붙여넣기
  const pasteNode = useCallback(
    (nodes: Node[], parentId: string, clipboardNode: Node): Node[] => {
      const clonedNode = cloneNode(clipboardNode);

      let pasted = false;

      const pasteRecursive = (nodes: Node[]): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            pasted = true;

            const newChildren = [...(node.children || []), clonedNode];

            setExpandedNodesIds((prev) => (!prev.includes(parentId) ? [...prev, parentId] : prev));
            setSelectedNodeId(clonedNode.id);

            return { ...node, children: newChildren };
          }

          if (node.children?.length) return { ...node, children: pasteRecursive(node.children) };

          return node;
        });
      };

      const result = pasteRecursive(nodes);

      if (!pasted) {
        console.error('붙여넣기 대상 부모 노드를 찾지 못했습니다:', parentId);

        return nodes;
      }

      return result;
    },
    [setExpandedNodesIds, setSelectedNodeId],
  );

  // 위로 이동 가능 여부 확인
  const canMoveUp = useCallback(() => {
    if (!selectedNodeId) return false;

    const parentId = findParentNode(data, selectedNodeId);

    if (parentId) {
      const parent = findNode(data, parentId);

      if (!parent?.children) return false;

      const index = parent.children.findIndex((child) => child.id === selectedNodeId);

      return index > 0;
    }

    const index = data.findIndex((node) => node.id === selectedNodeId);

    return index > 0;
  }, [selectedNodeId, data]);

  // 아래로 이동 가능 여부 확인
  const canMoveDown = useCallback(() => {
    if (!selectedNodeId) return false;

    const parentId = findParentNode(data, selectedNodeId);

    if (parentId) {
      const parent = findNode(data, parentId);

      if (!parent?.children) return false;

      const index = parent.children.findIndex((child) => child.id === selectedNodeId);

      return index >= 0 && index < parent.children.length - 1;
    }

    const index = data.findIndex((node) => node.id === selectedNodeId);

    return index >= 0 && index < data.length - 1;
  }, [selectedNodeId, data]);

  // 위로 이동
  const moveUpNode = useCallback(
    (id: string): Node[] => {
      const moveRecursive = (nodes: Node[], targetId: string): Node[] => {
        const currentNodes = [...nodes];
        const indexInCurrentLevel = currentNodes.findIndex((node) => node.id === targetId);

        if (indexInCurrentLevel > 0) {
          // 현재 레벨에서 찾았고, 위로 이동 가능
          const nodeToMove = currentNodes[indexInCurrentLevel]!;
          const nodeToSwapWith = currentNodes[indexInCurrentLevel - 1]!;

          currentNodes[indexInCurrentLevel - 1] = nodeToMove;
          currentNodes[indexInCurrentLevel] = nodeToSwapWith;

          return currentNodes;
        }

        // 현재 레벨 최상단, 이동 불가
        if (indexInCurrentLevel === 0) return currentNodes;

        // 하위 레벨 탐색
        for (let i = 0; i < currentNodes.length; i++) {
          const node = currentNodes[i]!;

          if (node.children && node.children.length > 0) {
            const updatedChildren = moveRecursive(node.children, targetId);

            if (updatedChildren !== node.children) {
              currentNodes[i] = { ...node, children: updatedChildren };

              return currentNodes;
            }
          }
        }

        return currentNodes;
      };

      return moveRecursive(data, id);
    },
    [data],
  );

  // 아래로 이동
  const moveDownNode = useCallback(
    (id: string): Node[] => {
      const moveRecursive = (nodes: Node[], targetId: string): Node[] => {
        const currentNodes = [...nodes]; // 복사본으로 작업
        const indexInCurrentLevel = currentNodes.findIndex((node) => node.id === targetId);

        if (indexInCurrentLevel >= 0 && indexInCurrentLevel < currentNodes.length - 1) {
          // 현재 레벨에서 찾았고, 아래로 이동 가능
          const nodeToMove = currentNodes[indexInCurrentLevel]!;
          const nodeToSwapWith = currentNodes[indexInCurrentLevel + 1]!;

          currentNodes[indexInCurrentLevel + 1] = nodeToMove;
          currentNodes[indexInCurrentLevel] = nodeToSwapWith;

          return currentNodes;
        }

        // 현재 레벨 최하단, 이동 불가
        if (indexInCurrentLevel === currentNodes.length - 1) return currentNodes;

        // 하위 레벨 탐색
        for (let i = 0; i < currentNodes.length; i++) {
          const node = currentNodes[i]!;

          if (node.children && node.children.length > 0) {
            const updatedChildren = moveRecursive(node.children, targetId);

            if (updatedChildren !== node.children) {
              currentNodes[i] = { ...node, children: updatedChildren };

              return currentNodes;
            }
          }
        }

        return currentNodes;
      };

      return moveRecursive(data, id);
    },
    [data],
  );

  // 노드 확장/축소 상태 변경
  const setNodeExpansion = useCallback(
    (nodeId: string, expand: boolean) => {
      if (hasErrors && selectedNodeId === nodeId) {
        notifications.show('현재 노드의 오류를 먼저 수정해야 합니다.', { severity: 'error', autoHideDuration: 2000 });
        return;
      }

      setExpandedNodesIds((prev) => {
        const isCurrentlyExpanded = prev.includes(nodeId);

        if (expand && !isCurrentlyExpanded) return [...prev, nodeId];
        if (!expand && isCurrentlyExpanded) return prev.filter((id) => id !== nodeId);

        return prev;
      });
    },
    [hasErrors, selectedNodeId, notifications],
  );

  // 노드 확장/축소 상태 변경 핸들러
  const handleChangeNodeExpansionToggle = useCallback((_event: SyntheticEvent | null, nodeId: string, isExpanded: boolean) => setNodeExpansion(nodeId, isExpanded), [setNodeExpansion]);

  // 노드 클릭 핸들러
  const handleClickNode = useCallback(
    (_event: MouseEvent | null, nodeId: string) => {
      if (hasErrors && nodeId !== selectedNodeId) {
        notifications.show('현재 노드의 오류를 먼저 수정해야 합니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }

      setSelectedNodeId(nodeId);
    },
    [hasErrors, selectedNodeId, notifications],
  );

  // 노드 추가 핸들러
  const handleClickNodeAdd = useCallback(() => {
    if (hasErrors && selectedNodeId) {
      notifications.show('현재 노드의 오류를 먼저 수정해야 합니다. 이후에 자식 노드를 추가할 수 있습니다.', { severity: 'error', autoHideDuration: 2000 });

      return;
    }

    const newId = crypto.randomUUID();
    const newNode: Node = { id: newId, key: '', editable: true, orderable: true, fields: [], children: [] };

    let updatedData: Node[];

    if (!selectedNodeId) {
      updatedData = [...data, newNode];

      notifications.show('최상위에 새 노드를 추가했습니다.', { severity: 'success', autoHideDuration: 1000 });
    } else {
      const addChildRecursive = (nodes: Node[], parentId: string): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            setExpandedNodesIds((prev) => (!prev.includes(parentId) ? [...prev, parentId] : prev));

            return { ...node, children: [...(node.children || []), newNode] };
          }

          if (node.children?.length) return { ...node, children: addChildRecursive(node.children, parentId) };

          return node;
        });
      };

      updatedData = addChildRecursive([...data], selectedNodeId);

      notifications.show('선택된 노드 하위로 노드를 추가했습니다.', { severity: 'success', autoHideDuration: 1000 });
    }

    onDataChange(updatedData);

    setSelectedNodeId(newId);
  }, [selectedNodeId, data, onDataChange, notifications, hasErrors, setExpandedNodesIds, setSelectedNodeId]);

  // 노드 삭제 핸들러
  const handleClickNodeDelete = useCallback(() => {
    if (!selectedNodeId) return;

    setDeleteNodeId(selectedNodeId);

    deleteConfirm.handleOpen();
  }, [selectedNodeId, deleteConfirm]);

  // 노드 복사 핸들러
  const handleClickNodeCopy = useCallback(() => {
    if (!selectedNodeId) return;

    if (hasErrors) {
      notifications.show('오류가 있는 노드는 복사할 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });

      return;
    }

    setClipboard({ node: JSON.parse(JSON.stringify(findNode(data, selectedNodeId))), operation: 'copy', sourceId: selectedNodeId });

    notifications.show('선택된 노드를 복사했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedNodeId, data, notifications, hasErrors]);

  // 노드 잘라내기 핸들러
  const handleClickNodeCut = useCallback(() => {
    if (!selectedNodeId) return;

    if (hasErrors) {
      notifications.show('오류가 있는 노드는 잘라낼 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });

      return;
    }

    setClippedNodeId(selectedNodeId);

    cutConfirm.handleOpen();
  }, [selectedNodeId, cutConfirm, hasErrors, notifications]);

  // 노드 붙여넣기 핸들러
  const handleClickNodePaste = useCallback(() => {
    if (!selectedNodeId || !clipboard) return;

    if (!canPaste()) {
      notifications.show('선택된 위치에 붙여넣을 수 없습니다. (자기 자신 또는 하위 노드로 이동 불가)', { severity: 'warning', autoHideDuration: 2000 });

      return;
    }

    const updatedData = pasteNode(data, selectedNodeId, clipboard.node);

    onDataChange(updatedData);

    if (clipboard.operation === 'cut') setClipboard(null);

    notifications.show('클립보드의 노드를 붙여넣기 했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedNodeId, clipboard, data, pasteNode, onDataChange, notifications, canPaste, setClipboard]);

  // 노드 위로 이동 핸들러
  const handleClickNodeUp = useCallback(() => {
    if (!selectedNodeId || !canMoveUp()) return;

    const updatedData = moveUpNode(selectedNodeId);

    onDataChange(updatedData);

    notifications.show('선택된 노드를 위로 이동했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedNodeId, canMoveUp, moveUpNode, onDataChange, notifications]);

  // 노드 아래로 이동 핸들러
  const handleClickNodeDown = useCallback(() => {
    if (!selectedNodeId || !canMoveDown()) return;

    const updatedData = moveDownNode(selectedNodeId);

    onDataChange(updatedData);

    notifications.show('선택된 노드를 아래로 이동했습니다.', { severity: 'success', autoHideDuration: 1000 });
  }, [selectedNodeId, canMoveDown, moveDownNode, onDataChange, notifications]);

  // 노드 속성 토글 핸들러
  const handleChangeNodePropToggle = useCallback(
    (field: 'editable' | 'orderable') => (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (!selectedNodeId) return;

      if (hasErrors) {
        notifications.show('오류가 있는 노드는 속성을 변경할 수 없습니다.', { severity: 'error', autoHideDuration: 2000 });

        return;
      }

      const updatedData = updateNode(data, selectedNodeId, { [field]: checked });

      onDataChange(updatedData);
    },
    [selectedNodeId, data, onDataChange, hasErrors, notifications],
  );

  // 키보드 탐색 핸들러
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!selectedNodeId) {
        if (data.length > 0 && data[0]) setSelectedNodeId(data[0].id);

        return;
      }

      const currentNode = findNode(data, selectedNodeId);

      if (!currentNode) return;
      if (hasErrors) return;

      const visibleNodes = getVisibleNodes(data, expandedNodesIds, data);
      const currentIndex = visibleNodes.findIndex((node) => node.id === selectedNodeId);

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) setSelectedNodeId(visibleNodes[currentIndex - 1]!.id);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < visibleNodes.length - 1) setSelectedNodeId(visibleNodes[currentIndex + 1]!.id);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (expandedNodesIds.includes(selectedNodeId) && currentNode.children && currentNode.children.length > 0) {
            setNodeExpansion(selectedNodeId, false);
          } else {
            const parentId = findParentNode(data, selectedNodeId);

            if (parentId) setSelectedNodeId(parentId);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentNode.children && currentNode.children.length > 0) {
            if (!expandedNodesIds.includes(selectedNodeId)) {
              setNodeExpansion(selectedNodeId, true);
            } else {
              const firstChild = currentNode.children[0];

              if (firstChild) setSelectedNodeId(firstChild.id);
            }
          }
          break;
        default:
          break;
      }
    },
    [selectedNodeId, data, expandedNodesIds, hasErrors, notifications, setNodeExpansion, setSelectedNodeId],
  );

  return {
    // 상태
    selectedNodeId,
    setSelectedNodeId,
    clipboard,
    expandedNodesIds,
    selectedNode,
    keyError,
    setKeyError,
    fieldErrors,
    setFieldErrors,

    // 상태 체크
    canPaste,
    canMoveUp,
    canMoveDown,
    hasErrors,

    // 이벤트 핸들러
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

    // 다이얼로그
    deleteConfirm,
    cutConfirm,
  };
};
