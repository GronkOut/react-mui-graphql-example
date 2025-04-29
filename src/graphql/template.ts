import { gql } from '@apollo/client';

export interface Template {
  id: string;
  contentId: string;
  name: string;
  isDefault: boolean;
  data?: string | null;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateData {
  template: Template | null;
}

export interface TemplatesData {
  templates: Template[];
}

export interface TemplatesByContentIdData {
  templatesByContentId: Template[];
}

export interface CreateTemplateVariables {
  contentId: string;
  name: string;
  data?: string | null;
}

export interface ReadTemplateVariables {
  id: string;
}

export interface GetTemplatesByContentIdVariables {
  contentId: string;
}

export interface UpdateTemplateVariables {
  id: string;
  name?: string;
  data?: string | null;
}

export interface DeleteTemplatesVariables {
  ids: string[];
}

export interface CreateTemplateResponse {
  createTemplate: Template;
}

export interface UpdateTemplateResponse {
  updateTemplate: Template;
}

export interface DeleteTemplatesResponse {
  deleteTemplates: boolean;
}

export const GET_TEMPLATES = gql`
  query GetTemplates {
    templates {
      id
      contentId
      name
      isDefault
      tenantCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEMPLATE = gql`
  query GetTemplate($id: ID!) {
    template(id: $id) {
      id
      contentId
      name
      isDefault
      data
      tenantCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEMPLATES_BY_CONTENT_ID = gql`
  query GetTemplatesByContentId($contentId: ID!) {
    templatesByContentId(contentId: $contentId) {
      id
      contentId
      name
      isDefault
      data
      tenantCount
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($contentId: ID!, $name: String!, $data: String) {
    createTemplate(contentId: $contentId, name: $name, data: $data) {
      id
      contentId
      name
      isDefault
      data
      tenantCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TEMPLATE = gql`
  mutation UpdateTemplate($id: ID!, $name: String, $data: String) {
    updateTemplate(id: $id, name: $name, data: $data) {
      id
      contentId
      name
      isDefault
      data
      tenantCount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TEMPLATES = gql`
  mutation DeleteTemplates($ids: [ID!]!) {
    deleteTemplates(ids: $ids)
  }
`;
