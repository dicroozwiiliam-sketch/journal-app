const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove selectedEntry from App.tsx
code = code.replace(/const \[selectedEntry, setSelectedEntry\] = useState<JournalEntry \| null>\(null\);\n/g, '');

// Fix usages of setSelectedEntry(matched) to setAutoSelectEntryId(matched.id)
code = code.replace(/setSelectedEntry\(matched\);/g, 'setAutoSelectEntryId(matched.id);');

// Fix setSelectedEntry(newPage) to setAutoSelectEntryId(newPage.id)
code = code.replace(/setSelectedEntry\(newPage\);/g, 'setAutoSelectEntryId(newPage.id);');

// Fix setSelectedEntry(null) to setAutoSelectEntryId(null)
// Wait, is setSelectedEntry(null) used anywhere else?
code = code.replace(/setSelectedEntry\(null\);/g, 'setAutoSelectEntryId(null);');

// Remove propSelectedEntry and propOnSelectEntry from JournalTimeline props
code = code.replace(/selectedEntry=\{selectedEntry\}\n/g, '');
code = code.replace(/onSelectEntry=\{setSelectedEntry\}\n/g, '');

fs.writeFileSync('src/App.tsx', code);
