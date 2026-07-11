const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(/where\("email", "==", email\)\)/g, 'where("email", "==", email), limit(1))');
code = code.replace(/where\("verification_token", "==", token\)\)/g, 'where("verification_token", "==", token), limit(1))');
code = code.replace(/where\("reset_token", "==", token\)\)/g, 'where("reset_token", "==", token), limit(1))');
code = code.replace(/where\("stripe_customer_id", "==", customerId\)\)/g, 'where("stripe_customer_id", "==", customerId), limit(1))');

fs.writeFileSync('server/db.ts', code);
