const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const fallbackStr = `<React.Suspense fallback={<div className="w-full h-full flex flex-col justify-center items-center py-20"><Sparkles size={32} className="text-cozy-accent animate-spin mb-3" /><p className="text-cozy-text-dark font-black text-sm">Loading Tab...</p></div>}>`;

if (!code.includes("Loading Tab...")) {
    code = code.replace("{currentTab === 'home' && (", fallbackStr + "\n                {currentTab === 'home' && (");
    // Find the end of ProfilePage block
    // It looks like:
    //                    onUpdateProfile={async (updates) => { ... }}
    //                  />
    //                )}
    //              </motion.div>
    code = code.replace(/(<ProfilePage[\s\S]*?\/>\s*\n\s*\)\})/, match => match + "\n              </React.Suspense>");
    
    fs.writeFileSync('src/App.tsx', code);
}
