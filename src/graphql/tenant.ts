import { gql } from '@apollo/client';

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// 쿼리 응답 타입
export interface TenantData {
  tenant: Tenant;
}

export interface TenantsData {
  tenants: Tenant[];
}

// 변수 타입
export interface CreateTenantVariables {
  name: string;
}

export interface ReadTenantVariables {
  id: string;
}

export interface UpdateTenantVariables {
  id: string;
  name: string;
}

export interface DeleteTenantsVariables {
  ids: string[];
}

// 응답 타입
export interface CreateTenantResponse {
  createTenant: Tenant;
}

export interface UpdateTenantResponse {
  updateTenant: Tenant;
}

export interface DeleteTenantsResponse {
  deleteTenants: boolean;
}

// 쿼리/뮤테이션
export const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

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
  mutation UpdateTenant($id: ID!, $name: String!) {
    updateTenant(id: $id, name: $name) {
      id
      name
      updatedAt
    }
  }
`;

export const DELETE_TENANTS = gql`
  mutation DeleteTenants($ids: [ID!]!) {
    deleteTenants(ids: $ids)
  }
`;
