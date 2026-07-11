const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const fallback = `<React.Suspense fallback={<div className="w-full min-h-screen flex flex-col justify-center items-center bg-cozy-bg"><Sparkles size={32} className="text-cozy-accent animate-spin mb-3" /><p className="text-cozy-text-dark font-black text-sm">Loading...</p></div>}>`;

code = code.replace(/<Onboarding[\s\S]*?\/>/, match => fallback + '\n        ' + match + '\n      </React.Suspense>');
code = code.replace(/<Auth[\s\S]*?\/>/, match => fallback + '\n        ' + match + '\n      </React.Suspense>');

fs.writeFileSync('src/App.tsx', code);
