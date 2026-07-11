const fs = require('fs');
let code = fs.readFileSync('src/components/MoodAnalytics.tsx', 'utf8');

code = code.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';");
fs.writeFileSync('src/components/MoodAnalytics.tsx', code);
