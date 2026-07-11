const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const interceptor = `
import { getToken } from "firebase/app-check";
import { appCheck } from "./lib/googleAuth";

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let appCheckToken = "";
  try {
    if (appCheck) {
      const tokenResult = await getToken(appCheck, false);
      appCheckToken = tokenResult.token;
    }
  } catch (e) {
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

if (!code.includes('originalFetch = window.fetch')) {
    // Insert after imports
    code = code.replace(/(import .*;\n)+/, (match) => match + '\n' + interceptor + '\n');
    fs.writeFileSync('src/main.tsx', code);
}
