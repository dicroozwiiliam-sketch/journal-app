const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We want to initialize states to empty arrays instead of SEED data for a logged-in user, but wait, SEED data is used for preview?
// Let's remove the loadingData blocking UI.
code = code.replace(/if \(loadingData\) \{[\s\S]*?Synchronizing your Daynest\.\.\.<\/p>[\s\S]*?<\/div>[\s\S]*?<\/React.Suspense>[\s\S]*?\}/, '');

fs.writeFileSync('src/App.tsx', code);
