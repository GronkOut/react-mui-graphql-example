import { gql } from '@apollo/client';

export interface Content {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentData {
  content: Content | null;
}

export interface ContentsData {
  contents: Pick<Content, 'id' | 'name' | 'createdAt' | 'updatedAt'>[];
}

export interface CreateContentVariables {
  name: string;
}

export interface ReadContentVariables {
  id: string;
}

export interface UpdateContentVariables {
  id: string;
  name?: string;
}

export interface DeleteContentsVariables {
  ids: string[];
}

export interface CreateContentResponse {
  createContent: Pick<Content, 'id' | 'name' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateContentResponse {
  updateContent: Pick<Content, 'id' | 'name' | 'updatedAt'>;
}

export interface DeleteContentsResponse {
  deleteContents: boolean;
}

export const GET_CONTENTS = gql`
  query GetContents {
    contents {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONTENT = gql`
  query GetContent($id: ID!) {
    content(id: $id) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CONTENT = gql`
  mutation CreateContent($name: String!) {
    createContent(name: $name) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CONTENT = gql`
  mutation UpdateContent($id: ID!, $name: String) {
    updateContent(id: $id, name: $name) {
      id
      name
      updatedAt
    }
  }
`;

export const DELETE_CONTENTS = gql`
  mutation DeleteContents($ids: [ID!]!) {
    deleteContents(ids: $ids)
  }
`;
