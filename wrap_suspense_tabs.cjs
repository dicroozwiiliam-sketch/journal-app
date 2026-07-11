const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
              <React.Suspense fallback={<div className="w-full h-[60vh] flex flex-col justify-center items-center"><Sparkles size={32} className="text-cozy-accent animate-spin mb-3" /><p className="text-cozy-text-dark font-black text-sm">Loading Tab...</p></div>}>
                {currentTab === 'home' && (
`;

code = code.replace(/\{currentTab === 'home' && \(/, replacement);

const endReplacement = `
                  />
                )}
              </React.Suspense>
              </motion.div>
`;
// Wait, the end of the tabs is at line 1550ish:
code = code.replace(/<\/ProfilePage>\s*\n\s*\)\}\s*\n\s*<\/motion\.div>/, match => `</ProfilePage>\n                )}\n              </React.Suspense>\n              </motion.div>`);

// Let's do it safer:
