import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import colorPalette from './colorPalette.json';
import modelList from './modelList.json';
import tabMenu from './tabMenu.json';
import textWizard from './textWizard.json';

// 데이터 모델 인터페이스 정의
interface Tenant {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Content {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: number;
  name: string;
  isDefault: boolean;
  contentId: number;
  data?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantContent {
  tenantId: number;
  contentId: number;
  templateId: number;
}

interface DB {
  tenants: Tenant[];
  contents: Content[];
  templates: Template[];
  tenantContents: TenantContent[];
}

// GraphQL 스키마 정의
const typeDefs = `#graphql
type Tenant {
  id: ID!
  name: String!
  createdAt: String!
  updatedAt: String!
  templateMappings: [ContentTemplateMapping!]!
}

type Content {
  id: ID!
  name: String!
  createdAt: String!
  updatedAt: String!
}

type Template {
  id: ID!
  name: String!
  isDefault: Boolean!
  contentId: ID!
  data: String
  tenantCount: Int!
  createdAt: String!
  updatedAt: String!
}

type ContentTemplateMapping {
  contentId: ID!
  templateId: ID
}

type TenantContentMapping {
  contentId: ID!
  content: Content!
  assignedTemplate: Template
  availableTemplates: [Template!]!
  isAssigned: Boolean!
}

type Query {
  tenant(id: ID!): Tenant
  tenants: [Tenant!]!
  content(id: ID!): Content
  contents: [Content!]!
  template(id: ID!): Template
  templates: [Template!]!
  templatesByContentId(contentId: ID!): [Template!]!
  tenantContentMappings(tenantId: ID!): [TenantContentMapping!]!
}

type Mutation {
  createTenant(name: String!): Tenant!
  updateTenant(id: ID!, name: String, mappings: [ContentTemplateMappingInput!]): Tenant!
  deleteTenants(ids: [ID!]!): Boolean!

  createContent(name: String!): Content!
  updateContent(id: ID!, name: String): Content!
  deleteContents(ids: [ID!]!): Boolean!

  createTemplate(contentId: ID!, name: String!, data: String): Template!
  updateTemplate(id: ID!, name: String, data: String): Template!
  deleteTemplates(ids: [ID!]!): Boolean!
}

input ContentTemplateMappingInput {
  contentId: ID!
  templateId: ID
}
`;

// 리졸버
const resolvers = {
  Tenant: {
    // 테넌트에 연결된 템플릿 매핑 정보를 조회
    templateMappings: async (parent: Tenant) => {
      const db = await readDB();

      return db.tenantContents
        .filter((tc) => tc.tenantId === parent.id)
        .map((tc) => ({
          contentId: tc.contentId,
          templateId: tc.templateId,
        }));
    },
  },
  TenantContentMapping: {
    // 매핑된 콘텐츠 정보 조회
    content: async (parent: { contentId: number }) => {
      const db = await readDB();

      return db.contents.find((c) => c.id === parent.contentId);
    },
    // 할당된 템플릿 정보 조회 (없을 경우 null 리턴)
    assignedTemplate: async (parent: { assignedTemplate?: Template }) => {
      return parent.assignedTemplate || null;
    },
  },
  Template: {
    // 템플릿을 사용 중인 테넌트 수 계산
    tenantCount: async (parent: Template) => {
      const db = await readDB();

      return db.tenantContents.filter((tc) => tc.templateId === parent.id).length;
    },
  },
  Query: {
    // ID로 단일 테넌트 조회
    tenant: async (_: unknown, { id }: { id: string }) => {
      const db = await readDB();

      return db.tenants.find((tenant) => tenant.id === parseInt(id));
    },
    // 모든 테넌트 목록 조회
    tenants: async () => {
      const db = await readDB();

      return db.tenants;
    },
    // 테넌트별 콘텐츠 매핑 정보 조회
    tenantContentMappings: async (_: unknown, { tenantId }: { tenantId: string }) => {
      const db = await readDB();
      const tenantIdNum = parseInt(tenantId);

      return db.contents.map((content) => {
        // 해당 콘텐츠에 사용 가능한 모든 템플릿 조회
        const availableTemplates = db.templates.filter((t) => t.contentId === content.id);
        // 테넌트에 할당된 템플릿 매핑 정보 조회
        const tenantContentAssignment = db.tenantContents.find((tc) => tc.tenantId === tenantIdNum && tc.contentId === content.id);
        // 할당된 템플릿 정보 조회
        const assignedTemplate = tenantContentAssignment ? db.templates.find((t) => t.id === tenantContentAssignment.templateId) : null;

        return {
          contentId: content.id,
          content,
          assignedTemplate,
          availableTemplates,
          isAssigned: !!tenantContentAssignment,
        };
      });
    },
    // ID로 단일 콘텐츠 조회
    content: async (_: unknown, { id }: { id: string }) => {
      const db = await readDB();

      return db.contents.find((content) => content.id === parseInt(id));
    },
    // 모든 콘텐츠 목록 조회
    contents: async () => {
      const db = await readDB();

      return db.contents;
    },
    // ID로 단일 템플릿 조회
    template: async (_: unknown, { id }: { id: string }) => {
      const db = await readDB();

      return db.templates.find((template) => template.id === parseInt(id));
    },
    // 모든 템플릿 목록 조회
    templates: async () => {
      const db = await readDB();

      return db.templates;
    },
    // 콘텐츠 ID로 템플릿 목록 조회
    templatesByContentId: async (_: unknown, { contentId }: { contentId: string }) => {
      const db = await readDB();

      return db.templates.filter((template) => template.contentId === parseInt(contentId));
    },
  },
  Mutation: {
    // 테넌트 생성
    createTenant: async (_: unknown, { name }: { name: string }) => {
      const db = await readDB();
      const currentDate = new Date().toISOString();

      if (db.tenants.some((tenant) => tenant.name === name)) throw new Error('이미 사용중인 테넌트 이름입니다.');

      const newTenant: Tenant = {
        id: db.tenants.length > 0 ? Math.max(...db.tenants.map((t) => t.id)) + 1 : 1,
        name,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.tenants.push(newTenant);

      for (const content of db.contents) {
        const defaultTemplate = db.templates.find((t) => t.contentId === content.id && t.isDefault);

        if (defaultTemplate) {
          db.tenantContents.push({
            tenantId: newTenant.id,
            contentId: content.id,
            templateId: defaultTemplate.id,
          });
        }
      }

      await writeDB(db);

      return newTenant;
    },
    // 테넌트 수정
    updateTenant: async (_: unknown, { id, name, mappings }: { id: string; name?: string; mappings?: { contentId: string; templateId?: string }[] }) => {
      const db = await readDB();
      const tenantIdNum = parseInt(id);
      const currentDate = new Date().toISOString();
      const tenantIndex = db.tenants.findIndex((tenant) => tenant.id === tenantIdNum);

      if (tenantIndex === -1) throw new Error(`ID가 ${id}인 테넌트를 찾을 수 없습니다.`);

      const originalTenant = db.tenants[tenantIndex];

      let updatedName = originalTenant.name;

      if (name && name !== originalTenant.name) {
        if (db.tenants.some((tenant) => tenant.id !== tenantIdNum && tenant.name === name)) throw new Error('이미 사용중인 테넌트 이름입니다.');

        updatedName = name;
      }

      if (mappings) {
        for (const mapping of mappings) {
          const contentIdNum = parseInt(mapping.contentId);
          const contentExists = db.contents.some((c) => c.id === contentIdNum);

          if (!contentExists) throw new Error(`ID가 ${mapping.contentId}인 콘텐츠를 찾을 수 없습니다.`);

          if (mapping.templateId) {
            const templateIdNum = parseInt(mapping.templateId);
            const template = db.templates.find((t) => t.id === templateIdNum);

            if (!template) throw new Error(`ID가 ${mapping.templateId}인 템플릿을 찾을 수 없습니다.`);
            if (template.contentId !== contentIdNum) throw new Error(`템플릿 ID ${mapping.templateId}는 콘텐츠 ID ${mapping.contentId}에 속하지 않습니다.`);

            const existingIndex = db.tenantContents.findIndex((tc) => tc.tenantId === tenantIdNum && tc.contentId === contentIdNum);

            if (existingIndex >= 0) {
              db.tenantContents[existingIndex].templateId = templateIdNum;
            } else {
              db.tenantContents.push({
                tenantId: tenantIdNum,
                contentId: contentIdNum,
                templateId: templateIdNum,
              });
            }
          } else {
            db.tenantContents = db.tenantContents.filter((tc) => !(tc.tenantId === tenantIdNum && tc.contentId === contentIdNum));
          }
        }
      }

      const updatedTenant: Tenant = {
        ...originalTenant,
        name: updatedName,
        updatedAt: currentDate,
      };

      db.tenants[tenantIndex] = updatedTenant;

      await writeDB(db);

      return updatedTenant;
    },
    // 테넌트 삭제
    deleteTenants: async (_: unknown, { ids }: { ids: string[] }) => {
      const db = await readDB();
      const idNumbers = ids.map((id) => parseInt(id));

      db.tenants = db.tenants.filter((tenant) => !idNumbers.includes(tenant.id));
      db.tenantContents = db.tenantContents.filter((tc) => !idNumbers.includes(tc.tenantId));

      await writeDB(db);

      return true;
    },

    // 콘텐츠 생성
    createContent: async (_: unknown, { name }: { name: string }) => {
      const db = await readDB();
      const currentDate = new Date().toISOString();

      if (db.contents.some((content) => content.name === name)) throw new Error('이미 사용중인 콘텐츠 이름입니다.');

      const newContent: Content = {
        id: db.contents.length > 0 ? Math.max(...db.contents.map((t) => t.id)) + 1 : 1,
        name,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.contents.push(newContent);

      const defaultTemplate: Template = {
        id: db.templates.length > 0 ? Math.max(...db.templates.map((t) => t.id)) + 1 : 1,
        contentId: newContent.id,
        name: `${name} (기본값)`,
        data: JSON.stringify([
          {
            id: crypto.randomUUID(),
            key: 'newTemplate',
            orderable: true,
            editable: true,
            fields: [],
            children: [],
          },
        ]),
        isDefault: true,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.templates.push(defaultTemplate);

      db.tenants.forEach((tenant) => {
        db.tenantContents.push({
          tenantId: tenant.id,
          contentId: newContent.id,
          templateId: defaultTemplate.id,
        });
      });

      await writeDB(db);

      return newContent;
    },
    // 콘텐츠 수정
    updateContent: async (_: unknown, { id, name }: { id: string; name?: string }) => {
      const db = await readDB();
      const idAsNumber = parseInt(id);
      const contentIndex = db.contents.findIndex((content) => content.id === idAsNumber);

      if (contentIndex === -1) throw new Error(`ID가 ${id}인 콘텐츠를 찾을 수 없습니다.`);

      const originalContent = db.contents[contentIndex];
      let updatedName = originalContent.name;

      if (name && name !== originalContent.name) {
        if (db.contents.some((content) => content.id !== idAsNumber && content.name === name)) throw new Error('이미 사용중인 콘텐츠 이름입니다.');

        updatedName = name;
      }

      const updatedContent: Content = {
        ...originalContent,
        name: updatedName,
        updatedAt: new Date().toISOString(),
      };

      db.contents[contentIndex] = updatedContent;

      await writeDB(db);

      return updatedContent;
    },
    // 콘텐츠 삭제
    deleteContents: async (_: unknown, { ids }: { ids: string[] }) => {
      const db = await readDB();
      const idNumbers = ids.map((id) => parseInt(id));

      db.contents = db.contents.filter((content) => !idNumbers.includes(content.id));
      db.templates = db.templates.filter((template) => !idNumbers.includes(template.contentId));
      db.tenantContents = db.tenantContents.filter((tc) => !idNumbers.includes(tc.contentId));

      await writeDB(db);

      return true;
    },
    // 템플릿 생성
    createTemplate: async (_: unknown, { contentId, name, data }: { contentId: string; name: string; data?: string }) => {
      const db = await readDB();
      const contentIdNumber = parseInt(contentId);
      const contentExists = db.contents.some((content) => content.id === contentIdNumber);

      if (!contentExists) throw new Error(`ID가 ${contentId}인 콘텐츠를 찾을 수 없습니다.`);
      if (db.templates.some((t) => t.contentId === contentIdNumber && t.name === name)) throw new Error('이미 사용중인 템플릿 이름입니다.');

      const currentDate = new Date().toISOString();
      const newTemplate: Template = {
        id: db.templates.length > 0 ? Math.max(...db.templates.map((t) => t.id)) + 1 : 1,
        contentId: contentIdNumber,
        name,
        data,
        isDefault: false,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.templates.push(newTemplate);

      await writeDB(db);

      return newTemplate;
    },
    // 템플릿 수정
    updateTemplate: async (_: unknown, { id, name, data }: { id: string; name?: string; data?: string }) => {
      const db = await readDB();
      const idAsNumber = parseInt(id);
      const templateIndex = db.templates.findIndex((template) => template.id === idAsNumber);

      if (templateIndex === -1) throw new Error(`ID가 ${id}인 템플릿을 찾을 수 없습니다.`);

      const originalTemplate = db.templates[templateIndex];

      let updatedName = originalTemplate.name;

      if (name && name !== originalTemplate.name) {
        if (db.templates.some((t) => t.id !== idAsNumber && t.contentId === originalTemplate.contentId && t.name === name)) throw new Error('이미 사용중인 템플릿 이름입니다.');

        updatedName = name;
      }

      const updatedTemplate: Template = {
        ...originalTemplate,
        name: updatedName,
        data: data ?? originalTemplate.data,
        updatedAt: new Date().toISOString(),
      };

      db.templates[templateIndex] = updatedTemplate;

      await writeDB(db);

      return updatedTemplate;
    },
    // 템플릿 삭제
    deleteTemplates: async (_: unknown, { ids }: { ids: string[] }) => {
      const db = await readDB();
      const idNumbers = ids.map((id) => parseInt(id));
      const defaultTemplate = db.templates.find((template) => idNumbers.includes(template.id) && template.isDefault);

      if (defaultTemplate) throw new Error(`기본 템플릿(${defaultTemplate.name})은 삭제할 수 없습니다.`);

      const usedTemplateIds = idNumbers.filter((id) => db.tenantContents.some((tc) => tc.templateId === id));

      if (usedTemplateIds.length > 0) {
        const usedTemplates = db.templates.filter((t) => usedTemplateIds.includes(t.id));
        const templateNames = usedTemplates.map((t) => t.name).join(', ');

        throw new Error(`템플릿(${templateNames})은(는) 현재 테넌트에서 사용 중이므로 삭제할 수 없습니다.`);
      }

      db.templates = db.templates.filter((template) => !idNumbers.includes(template.id));

      await writeDB(db);

      return true;
    },
  },
};

// DB 파일 경로 설정
const DB_PATH = path.join(process.cwd(), '/server/db.json');

// DB 읽기 함수
async function readDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    console.error(error);

    return { tenants: [], contents: [], templates: [], tenantContents: [] };
  }
}

// DB 쓰기 함수
async function writeDB(data: DB): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터베이스 파일 쓰기 에러:', error);

    throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
  }
}

// 서버 시작 함수
async function startServer() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData: DB = {
      tenants: [
        {
          id: 1,
          name: '엔씨소프트',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'F&F',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      contents: [
        {
          id: 1,
          name: '탭 메뉴',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: '모델',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          name: '텍스트 위저드',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 4,
          name: '컬러 팔레트',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      templates: [
        {
          id: 1,
          contentId: 1,
          name: '탭 메뉴 (기본값)',
          isDefault: true,
          data: JSON.stringify(tabMenu),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          contentId: 2,
          name: '모델 (기본값)',
          isDefault: true,
          data: JSON.stringify(modelList),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          contentId: 3,
          name: '텍스트 위저드 (기본값)',
          isDefault: true,
          data: JSON.stringify(textWizard),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 4,
          contentId: 4,
          name: '컬러 팔레트 (기본값)',
          isDefault: true,
          data: JSON.stringify(colorPalette),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 5,
          contentId: 1,
          name: '탭 메뉴 - F&F',
          isDefault: false,
          data: JSON.stringify([
            {
              id: crypto.randomUUID(),
              key: 'tabMenu_FnF',
              orderable: true,
              editable: true,
              fields: [],
              children: [],
            },
          ]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 6,
          contentId: 2,
          name: '모델 - F&F',
          isDefault: false,
          data: JSON.stringify([
            {
              id: crypto.randomUUID(),
              key: 'model_FnF',
              orderable: true,
              editable: true,
              fields: [],
              children: [],
            },
          ]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tenantContents: [
        {
          tenantId: 1,
          contentId: 1,
          templateId: 1,
        },
        {
          tenantId: 1,
          contentId: 2,
          templateId: 2,
        },
        {
          tenantId: 1,
          contentId: 3,
          templateId: 3,
        },
        {
          tenantId: 1,
          contentId: 4,
          templateId: 4,
        },
        {
          tenantId: 2,
          contentId: 1,
          templateId: 5,
        },
        {
          tenantId: 2,
          contentId: 2,
          templateId: 6,
        },
        {
          tenantId: 2,
          contentId: 3,
          templateId: 3,
        },
        {
          tenantId: 2,
          contentId: 4,
          templateId: 4,
        },
      ],
    };

    await writeDB(initialData);
  }

  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();

  app.use(cors());
  app.use(express.json());
  app.use('/', cors(), express.json(), expressMiddleware(server) as unknown as express.RequestHandler);

  app.listen(4000, () => {
    // console.log('http://localhost:4000/');
  });
}

startServer().catch(console.error);
