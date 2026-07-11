const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const replacement = `
  getJournalsByUserId: async (userId: string, limitCount: number = 100): Promise<any[]> => {
    try {
      // Create a query against the collection. 
      // Ordered by date descending. An index might be required on (user_id, date DESC).
      // If the index doesn't exist, this will throw an error with a link to create it.
      const { orderBy, limit } = require("firebase/firestore");
      const q = query(
        collection(firestore, "journals"), 
        where("user_id", "==", userId),
        orderBy("date", "desc"),
        limit(limitCount)
      );
      const querySnap = await getDocs(q);
      const list = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list;
    } catch (err) {
`;

code = code.replace(/getJournalsByUserId: async \(userId: string\): Promise<any\[\]> => \{\n\s*try \{\n\s*const q = query\(collection\(firestore, "journals"\), where\("user_id", "==", userId\)\);\n\s*const querySnap = await getDocs\(q\);\n\s*const list = querySnap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\);\n\s*list\.sort\(\(a: any, b: any\) => new Date\(b\.date\)\.getTime\(\) - new Date\(a\.date\)\.getTime\(\)\);\n\s*return list;\n\s*\} catch \(err\) \{/, replacement);

fs.writeFileSync('server/db.ts', code);
