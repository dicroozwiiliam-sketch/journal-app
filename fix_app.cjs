const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexToRemove = /\s*{\/\* App Notifications \/ Dopamine Hub \*\/\}(.|\n)*?{\/\* Divider \*\//;
if(regexToRemove.test(code)) {
    code = code.replace(regexToRemove, '\n                    {/* Divider */');
    fs.writeFileSync('src/App.tsx', code);
    console.log('Removed successfully.');
} else {
    console.log('Could not find the target code.');
}
