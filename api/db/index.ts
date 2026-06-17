import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

interface Database {
  users: any[];
  pets: any[];
  petPhotos: any[];
  posts: any[];
  postImages: any[];
  postTags: any[];
  postPets: any[];
  likes: any[];
  comments: any[];
  follows: any[];
  questions: any[];
  answers: any[];
  weightRecords: any[];
  vaccineRecords: any[];
  dewormingRecords: any[];
  places: any[];
  placeImages: any[];
  reviews: any[];
  reviewImages: any[];
}

const defaultDatabase: Database = {
  users: [],
  pets: [],
  petPhotos: [],
  posts: [],
  postImages: [],
  postTags: [],
  postPets: [],
  likes: [],
  comments: [],
  follows: [],
  questions: [],
  answers: [],
  weightRecords: [],
  vaccineRecords: [],
  dewormingRecords: [],
  places: [],
  placeImages: [],
  reviews: [],
  reviewImages: [],
};

let db: Database = { ...defaultDatabase };
let nextIds: Record<string, number> = {};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(data);
      
      for (const table of Object.keys(db) as (keyof Database)[]) {
        const records = db[table];
        if (records.length > 0) {
          nextIds[table] = Math.max(...records.map((r: any) => r.id)) + 1;
        } else {
          nextIds[table] = 1;
        }
      }
    } catch (e) {
      console.error('Failed to load database, using defaults:', e);
      db = { ...defaultDatabase };
      initNextIds();
    }
  } else {
    initNextIds();
    saveDatabase();
  }
}

function initNextIds() {
  for (const table of Object.keys(db) as (keyof Database)[]) {
    nextIds[table] = 1;
  }
}

function saveDatabase() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function getNextId(table: keyof Database): number {
  const id = nextIds[table] || 1;
  nextIds[table] = id + 1;
  return id;
}

export function getAll<T extends keyof Database>(table: T): Database[T] {
  return [...db[table]] as Database[T];
}

export function getById<T extends keyof Database>(table: T, id: number): any | undefined {
  return db[table].find((record: any) => record.id === id);
}

export function findOne<T extends keyof Database>(
  table: T,
  predicate: (record: any) => boolean
): any | undefined {
  return db[table].find(predicate);
}

export function findMany<T extends keyof Database>(
  table: T,
  predicate: (record: any) => boolean
): any[] {
  return db[table].filter(predicate);
}

export function insert<T extends keyof Database>(table: T, record: any): any {
  const newRecord = {
    ...record,
    id: getNextId(table),
    createdAt: record.createdAt || new Date().toISOString(),
  };
  (db[table] as any[]).push(newRecord);
  saveDatabase();
  return newRecord;
}

export function update<T extends keyof Database>(
  table: T,
  id: number,
  updates: any
): any | undefined {
  const index = db[table].findIndex((record: any) => record.id === id);
  if (index === -1) return undefined;
  
  db[table][index] = {
    ...db[table][index],
    ...updates,
  };
  saveDatabase();
  return db[table][index];
}

export function remove<T extends keyof Database>(table: T, id: number): boolean {
  const index = db[table].findIndex((record: any) => record.id === id);
  if (index === -1) return false;
  
  (db[table] as any[]).splice(index, 1);
  saveDatabase();
  return true;
}

export function removeMany<T extends keyof Database>(
  table: T,
  predicate: (record: any) => boolean
): number {
  const initialLength = db[table].length;
  db[table] = (db[table] as any[]).filter((record) => !predicate(record)) as Database[T];
  const removed = initialLength - db[table].length;
  if (removed > 0) saveDatabase();
  return removed;
}

loadDatabase();

export default {
  getAll,
  getById,
  findOne,
  findMany,
  insert,
  update,
  remove,
  removeMany,
  getNextId,
};
