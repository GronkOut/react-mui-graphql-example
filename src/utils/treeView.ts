import { ReactNode } from 'react';
import { FlatNode, Node } from '@/types/treeView';

// 키명 유효성
export const RegExKeyName = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/**
 * ReactNode 타입의 자식 요소가 실제로 렌더링될 내용(존재 여부)을 가지고 있는지 확인하여 노드의 확장 가능 여부를 판단합니다.
 * 배열인 경우, 배열 내 하나라도 확장 가능한 요소가 있는지 확인합니다.
 * @param children 확인할 React 노드 또는 노드 배열
 * @returns 노드가 확장 가능하면 true, 그렇지 않으면 false
 */
export const isExpandable = (children: ReactNode): boolean => {
  if (Array.isArray(children)) return children.length > 0 && children.some(isExpandable);

  return Boolean(children);
};

/**
 * 특정 노드(`nodeId`)가 다른 노드(`ancestorId`)의 자손(직계 또는 그 이하)인지 재귀적으로 확인합니다.
 * @param nodes 검색을 시작할 트리 노드의 배열
 * @param ancestorId 조상으로 의심되는 노드의 ID
 * @param nodeId 자손인지 확인할 노드의 ID
 * @returns `nodeId`가 `ancestorId`의 자손이면 true, 그렇지 않으면 false
 */
export const isDescendant = (nodes: Node[], ancestorId: string, nodeId: string): boolean => {
  const ancestor = findNode(nodes, ancestorId);

  if (!ancestor?.children?.length) return false;

  const stack: Node[] = [...ancestor.children];

  while (stack.length) {
    const node = stack.pop()!;

    if (node.id === nodeId) return true;
    if (node.children?.length) stack.push(...node.children);
  }

  return false;
};

/**
 * 특정 부모 아래 또는 최상위 레벨에서 주어진 `key` 값을 가진 다른 노드가 있는지 확인합니다. (ID가 다른 경우에만 중복으로 간주)
 * @param nodes 전체 트리 노드의 배열
 * @param key 중복 여부를 확인할 `key` 값
 * @param id 현재 검사 중인 노드의 ID (자기 자신과의 비교를 피하기 위함)
 * @param parentId 부모 노드의 ID. null인 경우 최상위 레벨에서 검사합니다.
 * @returns 같은 레벨에 동일한 `key`를 가진 다른 노드가 있으면 true, 그렇지 않으면 false
 */
export const isDuplicatedKey = (nodes: Node[], key: string, id: string, parentId: string | null = null): boolean => {
  let siblings: Node[];

  if (!parentId) {
    siblings = nodes;
  } else {
    const parent = findNode(nodes, parentId);

    siblings = parent?.children ?? [];
  }

  return siblings.some((node) => node.key === key && node.id !== id);
};

/**
 * 주어진 ID와 일치하는 트리 노드를 재귀적으로 검색합니다.
 * @param nodes 검색을 시작할 트리 노드의 배열
 * @param id 찾고자 하는 노드의 고유 ID
 * @returns ID와 일치하는 첫 번째 Node 객체. 찾지 못한 경우 null을 반환합니다.
 */
export const findNode = (nodes: Node[], id: string): Node | null => {
  const stack: Node[] = [...nodes];

  while (stack.length) {
    const node = stack.pop()!;

    if (node.id === id) return node;
    if (node.children?.length) stack.push(...node.children);
  }

  return null;
};

/**
 * 주어진 ID를 가진 노드의 부모 노드 ID를 재귀적으로 검색합니다.
 * @param nodes 검색을 시작할 트리 노드의 배열
 * @param id 부모를 찾고자 하는 자식 노드의 고유 ID
 * @returns 찾은 부모 노드의 ID. 부모를 찾지 못하거나 최상위 레벨 노드인 경우 null을 반환합니다.
 */
export const findParentNode = (nodes: Node[], id: string): string | null => {
  const stack: { parentId: string | null; node: Node }[] = nodes.map((node) => ({ parentId: null, node: node }));

  while (stack.length) {
    const { parentId, node } = stack.pop()!;

    if (node.id === id) return parentId;

    if (node.children?.length) {
      for (const child of node.children) {
        stack.push({ parentId: node.id, node: child });
      }
    }
  }

  return null;
};

/**
 * 주어진 ID를 가진 노드의 속성을 업데이트합니다. 원본 배열은 변경하지 않고, 새로운 배열을 반환합니다.
 * @param nodes 업데이트할 트리 노드의 배열
 * @param id 업데이트 대상 노드의 고유 ID
 * @param updates 적용할 변경사항을 담은 Partial<Node> 객체
 * @returns 지정된 노드가 업데이트된 새로운 트리 노드 배열
 */
export const updateNode = (nodes: Node[], id: string, updates: Partial<Node>): Node[] => {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...updates };

    if (node.children?.length) return { ...node, children: updateNode(node.children, id, updates) };

    return node;
  });
};

/**
 * 주어진 ID를 가진 노드 및 그 하위 노드들을 트리에서 재귀적으로 삭제합니다. 원본 배열은 변경하지 않고, 새로운 배열을 반환합니다.
 * @param nodes 노드를 삭제할 트리 노드의 배열
 * @param id 삭제 대상 노드의 고유 ID
 * @returns 지정된 노드가 삭제된 새로운 트리 노드 배열
 */
export const deleteNode = (nodes: Node[], id: string): Node[] => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children?.length) return { ...node, children: deleteNode(node.children, id) };

      return node;
    });
};

/**
 * 주어진 노드와 그 모든 자손 노드들을 복제하며, 각 노드에 새로운 고유 ID (UUID)를 할당합니다.
 * @param node 복제할 원본 Node 객체
 * @returns 새로운 ID가 할당된, 깊은 복제된 Node 객체
 */
export const cloneNode = (node: Node): Node => {
  const clonedNode: Node = { ...node, id: crypto.randomUUID() };

  if (node.children?.length) clonedNode.children = node.children.map((child) => cloneNode(child));

  return clonedNode;
};

/**
 * 현재 표시 가능한 트리 노드들의 목록을 계산합니다.
 * @param nodes 트리 노드의 배열
 * @param expandedNodesIds 확장된 노드의 ID 배열
 * @param rootNodes 루트 트리 노드의 배열
 * @returns 표시 가능한 노드들의 배열 (ID, 부모 ID, 레벨 정보 포함)
 */
export const getVisibleNodes = (nodes: Node[], expandedNodesIds: string[], rootNodes: Node[]): Array<{ id: string; parentId: string | null; level: number }> => {
  const visibleNodes: Array<{ id: string; parentId: string | null; level: number }> = [];

  function findNodeLevel(allNodes: Node[], nodeId: string, currentLevel: number = 0, parentNodeId: string | null = null): { level: number; parentId: string | null } | null {
    for (const node of allNodes) {
      if (node.id === nodeId) return { level: currentLevel, parentId: parentNodeId };

      if (node.children) {
        const foundInChildren = findNodeLevel(node.children, nodeId, currentLevel + 1, node.id);

        if (foundInChildren) return foundInChildren;
      }
    }

    return null;
  }

  function traverse(currentNodes: Node[], currentLevel: number, parentId: string | null) {
    for (const node of currentNodes) {
      const nodeInfo = findNodeLevel(rootNodes, node.id) || { level: currentLevel, parentId: parentId };

      visibleNodes.push({ id: node.id, parentId: nodeInfo.parentId, level: nodeInfo.level });

      if (expandedNodesIds.includes(node.id) && node.children && node.children.length > 0) {
        traverse(node.children, currentLevel + 1, node.id);
      }
    }
  }

  traverse(nodes, 0, 'SCRIPT_TYPE_ROOT_ID');

  return visibleNodes;
};

/**
 * 트리 노드 배열을 평탄화하여 각 노드와 자식 노드를 포함한 목록을 반환합니다.
 * @param nodes 처리할 Node 배열
 * @param parent 현재 노드의 부모 ID (기본값: null)
 * @returns FlatNode 형태의 평탄화된 노드 배열
 */
export const flattenNodes = (nodes: Node[], parent: string | null = null): FlatNode[] => {
  return nodes.flatMap((node) => {
    const { children = [], ...data } = node;
    const flat: FlatNode = { id: node.id, data, parent, children: children.map((c) => c.id) };

    return [flat, ...flattenNodes(children, node.id)];
  });
};
