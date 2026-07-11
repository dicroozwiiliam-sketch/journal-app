const fs = require('fs');

let authCode = fs.readFileSync('src/components/Auth.tsx', 'utf8');

authCode = authCode.replace(/body: JSON\.stringify\(\{[\s\S]*?googleUid: user\.uid[\s\S]*?\}\),/, 
`body: JSON.stringify({
          idToken: await user.getIdToken(),
          name: user.displayName,
          email: user.email
        }),`);

fs.writeFileSync('src/components/Auth.tsx', authCode);
