import { TreeViewBaseItem } from '@mui/x-tree-view/models';

/**
 * UI 유형
 * checkbox: switch // boolean
 * color: input, colorPicker, tag // string[]
 * image: input, image container // string
 * number: input // number
 * none: UI에 표현하지 않음 // string|number|boolean // 제거함
 * select: select // single // Todo 현재 select가 single|multiple 선택하는 것에만 고정된 듯..
 * tag: input, tag // string[]
 * text: input // string
 * textList: textarea // string
 * locale: 사용되지 않은 것같아서 제거 했음
 */

export interface TreeViewHandle {
  flushChanges: () => TreeViewItem[];
}

export type TreeViewItem = TreeViewBaseItem<{
  id: string;
  key: string;
  editable: boolean;
  orderable: boolean;
  fields: Field[];
  children?: TreeViewItem[];
}>;

export interface ClipboardItem {
  item: TreeViewItem;
  operation: 'copy' | 'cut';
  sourceId: string;
}

export type FieldType = 'text' | 'textList' | 'number' | 'checkbox' | 'color' | 'image' | 'select' | 'tag';

export type FieldValue = string | number | boolean | string[] | { type: string; value: string }[];

export interface Field {
  key: string;
  type: FieldType;
  editable: boolean;
  required: boolean;
  visible: boolean;
  value: FieldValue;
  regex: string;
}

export type FieldErrors = Record<number, string> | null;
