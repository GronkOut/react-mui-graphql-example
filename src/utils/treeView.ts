import { ReactNode } from 'react';
import type { TreeViewItem } from '@/types/treeView';

// 키명 유효성
export const RegExKeyName = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/**
 * 주어진 ID와 일치하는 트리 아이템을 재귀적으로 검색합니다.
 * @param items 검색을 시작할 트리뷰 아이템의 배열
 * @param id 찾고자 하는 아이템의 고유 ID
 * @returns ID와 일치하는 첫 번째 TreeViewItem 객체. 찾지 못한 경우 null을 반환합니다.
 */
export const findItemById = (items: TreeViewItem[], id: string): TreeViewItem | null => {
  const stack: TreeViewItem[] = [...items];

  while (stack.length) {
    const item = stack.pop()!;

    if (item.id === id) return item;
    if (item.children?.length) stack.push(...item.children);
  }

  return null;
};

/**
 * 주어진 ID를 가진 아이템의 부모 아이템 ID를 재귀적으로 검색합니다.
 * @param items 검색을 시작할 트리뷰 아이템의 배열
 * @param id 부모를 찾고자 하는 자식 아이템의 고유 ID
 * @returns 찾은 부모 아이템의 ID. 부모를 찾지 못하거나 최상위 레벨 아이템인 경우 null을 반환합니다.
 */
export const findParentId = (items: TreeViewItem[], id: string): string | null => {
  const stack: { parentId: string | null; node: TreeViewItem }[] = items.map((item) => ({ parentId: null, node: item }));

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
 * 주어진 ID를 가진 아이템의 속성을 업데이트합니다. 원본 배열은 변경하지 않고, 새로운 배열을 반환합니다.
 * @param items 업데이트할 트리뷰 아이템의 배열
 * @param id 업데이트 대상 아이템의 고유 ID
 * @param updates 적용할 변경사항을 담은 Partial<TreeViewItem> 객체
 * @returns 지정된 아이템이 업데이트된 새로운 트리뷰 아이템 배열
 */
export const updateItemById = (items: TreeViewItem[], id: string, updates: Partial<TreeViewItem>): TreeViewItem[] => {
  return items.map((item) => {
    if (item.id === id) return { ...item, ...updates };

    if (item.children?.length) return { ...item, children: updateItemById(item.children, id, updates) };

    return item;
  });
};

/**
 * 주어진 ID를 가진 아이템 및 그 하위 아이템들을 트리에서 재귀적으로 삭제합니다. 원본 배열은 변경하지 않고, 새로운 배열을 반환합니다.
 * @param items 아이템을 삭제할 트리뷰 아이템의 배열
 * @param id 삭제 대상 아이템의 고유 ID
 * @returns 지정된 아이템이 삭제된 새로운 트리뷰 아이템 배열
 */
export const deleteItemById = (items: TreeViewItem[], id: string): TreeViewItem[] => {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.children?.length) return { ...item, children: deleteItemById(item.children, id) };

      return item;
    });
};

/**
 * 주어진 아이템과 그 모든 자손 아이템들을 복제하며, 각 아이템에 새로운 고유 ID (UUID)를 할당합니다.
 * @param item 복제할 원본 TreeViewItem 객체
 * @returns 새로운 ID가 할당된, 깊은 복제된 TreeViewItem 객체
 */
export const cloneItemWithNewIds = (item: TreeViewItem): TreeViewItem => {
  const clonedItem: TreeViewItem = { ...item, id: crypto.randomUUID() };

  if (item.children?.length) clonedItem.children = item.children.map((child) => cloneItemWithNewIds(child));

  return clonedItem;
};

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
 * 특정 아이템(`itemId`)이 다른 아이템(`ancestorId`)의 자손(직계 또는 그 이하)인지 재귀적으로 확인합니다.
 * @param items 검색을 시작할 트리뷰 아이템의 배열
 * @param ancestorId 조상으로 의심되는 아이템의 ID
 * @param itemId 자손인지 확인할 아이템의 ID
 * @returns `itemId`가 `ancestorId`의 자손이면 true, 그렇지 않으면 false
 */
export const isDescendantOf = (items: TreeViewItem[], ancestorId: string, itemId: string): boolean => {
  const ancestor = findItemById(items, ancestorId);

  if (!ancestor?.children?.length) return false;

  const stack: TreeViewItem[] = [...ancestor.children];

  while (stack.length) {
    const node = stack.pop()!;

    if (node.id === itemId) return true;
    if (node.children?.length) stack.push(...node.children);
  }

  return false;
};

/**
 * 특정 부모 아래 또는 최상위 레벨에서 주어진 `key` 값을 가진 다른 아이템이 있는지 확인합니다. (ID가 다른 경우에만 중복으로 간주)
 * @param items 전체 트리뷰 아이템의 배열
 * @param key 중복 여부를 확인할 `key` 값
 * @param id 현재 검사 중인 아이템의 ID (자기 자신과의 비교를 피하기 위함)
 * @param parentId 부모 아이템의 ID. null인 경우 최상위 레벨에서 검사합니다.
 * @returns 같은 레벨에 동일한 `key`를 가진 다른 아이템이 있으면 true, 그렇지 않으면 false
 */
export const isDuplicatedKey = (items: TreeViewItem[], key: string, id: string, parentId: string | null = null): boolean => {
  let siblings: TreeViewItem[];

  if (!parentId) {
    siblings = items;
  } else {
    const parent = findItemById(items, parentId);

    siblings = parent?.children ?? [];
  }

  return siblings.some((item) => item.key === key && item.id !== id);
};
