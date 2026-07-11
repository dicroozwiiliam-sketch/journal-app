const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
db.collection("test").get().then(() => console.log("Success")).catch(e => console.error(e));
