import { TreeViewBaseItem } from '@mui/x-tree-view/models';

/**
 * UI 유형
 * checkbox: switch // boolean
 * color: input, colorPicker, tag // string[]
 * image: input, image container // string
 * number: input // number
 * none: UI에 표현하지 않음 // string|number|boolean
 * select: select // single // Todo 현재 select가 single|multiple 선택하는 것에만 고정된 듯..
 * tag: input, tag // string[]
 * text: input // string
 * textList: textarea // string
 * locale: 사용되지 않은 것같아서 제거 했음
 */

export type FieldType = 'checkbox' | 'color' | 'image' | 'number' | 'none' | 'select' | 'tag' | 'text' | 'textList';

export interface Field {
  key: string;
  type: FieldType;
  editable: boolean;
  required: boolean;
  value: string;
}

export type FieldErrors = Record<number, string> | null;

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
