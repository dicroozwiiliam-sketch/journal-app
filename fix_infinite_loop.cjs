const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const newInterceptor = `
const originalFetch = window.fetch;
let isFetchingAppCheck = false;

window.fetch = async (...args) => {
  let appCheckToken = "";
  try {
    if (appCheck && !isFetchingAppCheck) {
      isFetchingAppCheck = true;
      const tokenPromise = getToken(appCheck, false);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("App Check timeout")), 1000));
      const tokenResult = await Promise.race([tokenPromise, timeoutPromise]);
      appCheckToken = (tokenResult as any).token;
      isFetchingAppCheck = false;
    }
  } catch (e) {
    isFetchingAppCheck = false;
    console.warn("Could not get App Check token:", e);
  }

  if (appCheckToken) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
    if (url.startsWith('/api/')) {
      const init = args[1] || {};
      init.headers = {
        ...init.headers,
        'X-Firebase-AppCheck': appCheckToken
      };
      args[1] = init;
    }
  }
  return originalFetch(...args);
};
`;

code = code.replace(/const originalFetch = window\.fetch;[\s\S]*?return originalFetch\(\.\.\.args\);\n\};/, newInterceptor);

fs.writeFileSync('src/main.tsx', code);
