import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

interface Content {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  contents: Content[];
}

const DB_PATH = path.join(process.cwd(), 'db.json');

async function readDB(): Promise<DB> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    console.error(error);

    return { contents: [] };
  }
}

async function writeDB(data: DB): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

const typeDefs = `#graphql
type Content {
  id: ID!
  name: String!
  createdAt: String!
  updatedAt: String!
}

type Query {
  content(id: ID!): Content
  contents: [Content!]!
}

type Mutation {
  createContent(name: String!): Content!
  updateContent(id: ID!, name: String): Content!
  deleteContents(ids: [ID!]!): Boolean!
}
`;

const resolvers = {
  Query: {
    content: async (_: unknown, { id }: { id: string }) => {
      const db = await readDB();

      return db.contents.find((content) => content.id === parseInt(id));
    },
    contents: async () => {
      const db = await readDB();

      return db.contents;
    },
  },
  Mutation: {
    createContent: async (_: unknown, { name }: { name: string }) => {
      const db = await readDB();
      const currentDate = new Date().toISOString();
      const newContent: Content = {
        id: db.contents.length > 0 ? Math.max(...db.contents.map((t) => t.id)) + 1 : 1,
        name,
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      db.contents.push(newContent);

      await writeDB(db);

      return newContent;
    },
    updateContent: async (_: unknown, { id, name }: { id: string; name?: string }) => {
      const db = await readDB();
      const idAsNumber = parseInt(id);
      const contentIndex = db.contents.findIndex((content) => content.id === idAsNumber);

      if (contentIndex === -1) {
        throw new Error(`Content with ID ${id} not found`);
      }

      const updatedContent: Content = {
        ...db.contents[contentIndex],
        name: name !== undefined ? name : db.contents[contentIndex].name,
        updatedAt: new Date().toISOString(),
      };

      db.contents[contentIndex] = updatedContent;

      await writeDB(db);

      return updatedContent;
    },
    deleteContents: async (_: unknown, { ids }: { ids: string[] }) => {
      const db = await readDB();
      const idNumbers = ids.map((id) => parseInt(id));

      db.contents = db.contents.filter((content) => !idNumbers.includes(content.id));

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
      contents: [
        {
          id: 1,
          name: '데이터 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: '데이터 2',
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
    // console.log('http://localhost:4000/');
  });
}

startServer().catch(console.error);
