const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const loadingFallback = `<div className="w-full min-h-screen flex flex-col justify-center items-center bg-cozy-bg"><div className="animate-spin mb-3 text-cozy-accent">⌛</div><p className="text-cozy-text-dark font-black text-sm">Loading...</p></div>`;

code = code.replace(/<Onboarding/g, '<React.Suspense fallback={' + loadingFallback + '}>\n      <Onboarding');
// wait, the closing tag replacement might be tricky if it's dynamic.
