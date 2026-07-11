const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// Add writeBatch to import
code = code.replace(/getDocs \} from "firebase\/firestore";/, 'getDocs, writeBatch } from "firebase/firestore";');

const replacement = `
  deleteSessionsByUserId: async (userId: string): Promise<void> => {
    try {
      const q = query(collection(firestore, "sessions"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const batch = writeBatch(firestore);
        for (const d of querySnap.docs) {
          batch.delete(doc(firestore, "sessions", d.id));
        }
        await batch.commit();
      }
    } catch (err) {
`;

code = code.replace(/deleteSessionsByUserId: async \(userId: string\): Promise<void> => \{\n\s*try \{\n\s*const q = query\(collection\(firestore, "sessions"\), where\("user_id", "==", userId\)\);\n\s*const querySnap = await getDocs\(q\);\n\s*for \(const d of querySnap\.docs\) \{\n\s*await deleteDoc\(doc\(firestore, "sessions", d\.id\)\);\n\s*\}\n\s*\} catch \(err\) \{/, replacement);

fs.writeFileSync('server/db.ts', code);
