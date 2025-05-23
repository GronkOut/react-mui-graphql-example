import { TreeViewBaseItem } from '@mui/x-tree-view/models';

export interface TreeViewHandle {
  flushChanges: () => Node[];
}

export type Node = TreeViewBaseItem<{
  id: string;
  key: string;
  editable: boolean;
  orderable: boolean;
  fields: Field[];
  children?: Node[];
}>;

export interface FlatNode {
  id: string;
  data: Omit<Node, 'children'>;
  parent: string | null;
  children: string[];
}

export interface ClipboardNode {
  node: Node;
  operation: 'copy' | 'cut';
  sourceId: string;
}

export const FIELD_TYPES = ['text', 'textList', 'number', 'checkbox', 'color', 'image', 'select', 'tag'] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldValueSelect {
  key: string;
  value: string;
  selected: boolean;
}

type FieldValueMap = {
  text: string;
  textList: string[];
  number: number;
  checkbox: boolean;
  color: string[];
  image: string;
  select: FieldValueSelect[];
  tag: string[];
};

export type FieldValue = FieldValueMap[FieldType];

export const FIELD_TYPES_DEFAULT: FieldValueMap = {
  text: '',
  textList: [],
  number: 0,
  checkbox: true,
  color: [],
  image: 'https://',
  select: [],
  tag: [],
};

export interface Field {
  key: string;
  type: FieldType;
  editable: boolean;
  required: boolean;
  visible: boolean;
  value: FieldValue;
  regex: string;
  extra: string;
}

export type FieldErrors = Record<number, string> | null;
