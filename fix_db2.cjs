const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// Replace the imports and initialization
const newInit = `import * as admin from 'firebase-admin';
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase Admin App
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
export const firestore = admin.firestore();

// Shims for Firebase V9 API used below
const doc = (db, collectionName, docId) => db.collection(collectionName).doc(docId);
const collection = (db, collectionName) => db.collection(collectionName);
const getDoc = (docRef) => docRef.get();
const setDoc = (docRef, data, options) => docRef.set(data, options);
const updateDoc = (docRef, data) => docRef.update(data);
const deleteDoc = (docRef) => docRef.delete();
const query = (colRef, ...conditions) => {
  let q = colRef;
  for (const cond of conditions) {
    q = q.where(cond.field, cond.op, cond.val);
  }
  return q;
};
const where = (field, op, val) => ({ field, op, val });
const getDocs = (queryObj) => queryObj.get();
`;

code = code.replace(/import \{ initializeApp \}[\s\S]*?export const firestore = getFirestore\(app, firebaseConfig\.firestoreDatabaseId \|\| "\(\default\)"\);/, newInit);

fs.writeFileSync('server/db.ts', code);
