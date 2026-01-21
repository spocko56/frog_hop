import Dexie from 'dexie';

export const db = new Dexie('FrogHopDB');

db.version(1).stores({
  tasks: '++id, description, day, isCompleted'
});