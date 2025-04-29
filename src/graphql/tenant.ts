import { gql } from '@apollo/client';
import { Content } from './content';
import { Template } from './template';

export interface ContentTemplateMapping {
  contentId: string;
  templateId: string | null;
}

export interface TenantContentMapping {
  contentId: string;
  content: Content;
  assignedTemplate: Template | null;
  availableTemplates: Template[];
  isAssigned: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateMappings?: ContentTemplateMapping[];
}

export interface TenantData {
  tenant: Tenant | null;
}

export interface TenantsData {
  tenants: Tenant[];
}

export interface TenantContentMappingsData {
  tenantContentMappings: TenantContentMapping[];
}

export interface CreateTenantVariables {
  name: string;
}

export interface ReadTenantVariables {
  id: string;
}

export interface TenantContentMappingsVariables {
  tenantId: string;
}

export interface UpdateTenantVariables {
  id: string;
  name?: string;
  mappings?: {
    contentId: string;
    templateId?: string | null;
  }[];
}

export interface DeleteTenantsVariables {
  ids: string[];
}

export interface CreateTenantResponse {
  createTenant: Pick<Tenant, 'id' | 'name' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateTenantResponse {
  updateTenant: {
    id: string;
    name: string;
    updatedAt: string;
    templateMappings: {
      contentId: string;
      templateId: string | null;
    }[];
  };
}

export interface DeleteTenantsResponse {
  deleteTenants: boolean;
}

export const GET_TENANTS = gql`
  query GetTenants {
    tenants {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      name
      createdAt
      updatedAt
      templateMappings {
        contentId
        templateId
      }
    }
  }
`;

export const GET_TENANT_CONTENT_MAPPINGS = gql`
  query GetTenantContentMappings($tenantId: ID!) {
    tenantContentMappings(tenantId: $tenantId) {
      contentId
      content {
        id
        name
      }
      assignedTemplate {
        id
        name
      }
      availableTemplates {
        id
        name
      }
      isAssigned
    }
  }
`;

export const CREATE_TENANT = gql`
  mutation CreateTenant($name: String!) {
    createTenant(name: $name) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $name: String, $mappings: [ContentTemplateMappingInput!]) {
    updateTenant(id: $id, name: $name, mappings: $mappings) {
      id
      name
      updatedAt
      templateMappings {
        contentId
        templateId
      }
    }
  }
`;

export const DELETE_TENANTS = gql`
  mutation DeleteTenants($ids: [ID!]!) {
    deleteTenants(ids: $ids)
  }
`;
