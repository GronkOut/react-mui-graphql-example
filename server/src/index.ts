import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

interface Tenant {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  tenants: Tenant[];
}

const DB_PATH = path.join(process.cwd(), 'db.json');

async function readDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    console.error(error);

    return { tenants: [] };
  }
}

async function writeDB(data: DB): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

const typeDefs = `#graphql
type Tenant {
  id: ID!
  name: String!
  createdAt: String!
  updatedAt: String!
}

type Query {
  tenant(id: ID!): Tenant
  tenants: [Tenant!]!
}

type Mutation {
  createTenant(name: String!): Tenant!
  updateTenant(id: ID!, name: String): Tenant!
  deleteTenants(ids: [ID!]!): Boolean!
}
`;

const resolvers = {
  Query: {
    tenant: async (_: unknown, { id }: { id: string }) => {
      const db = await readDB();

      return db.tenants.find((tenant) => tenant.id === parseInt(id));
    },
    tenants: async () => {
      const db = await readDB();

      return db.tenants;
    },
  },
  Mutation: {
    createTenant: async (_: unknown, { name }: { name: string }) => {
      const db = await readDB();
      const currentDate = new Date().toISOString();
      const newTenant: Tenant = {
        id: db.tenants.length > 0 ? Math.max(...db.tenants.map((t) => t.id)) + 1 : 1,
        name,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.tenants.push(newTenant);

      await writeDB(db);

      return newTenant;
    },
    updateTenant: async (_: unknown, { id, name }: { id: string; name?: string }) => {
      const db = await readDB();
      const idAsNumber = parseInt(id);
      const tenantIndex = db.tenants.findIndex((tenant) => tenant.id === idAsNumber);

      if (tenantIndex === -1) {
        throw new Error(`Tenant with ID ${id} not found`);
      }

      const updatedTenant: Tenant = {
        ...db.tenants[tenantIndex],
        name: name !== undefined ? name : db.tenants[tenantIndex].name,
        updatedAt: new Date().toISOString(),
      };

      db.tenants[tenantIndex] = updatedTenant;

      await writeDB(db);

      return updatedTenant;
    },
    deleteTenants: async (_: unknown, { ids }: { ids: string[] }) => {
      const db = await readDB();
      const idNumbers = ids.map((id) => parseInt(id));

      db.tenants = db.tenants.filter((tenant) => !idNumbers.includes(tenant.id));

      await writeDB(db);

      return true;
    },
  },
};

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
    console.log('http://localhost:4000/');
  });
}

startServer().catch(console.error);
