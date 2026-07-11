const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("import compression from 'compression'")) {
    code = code.replace(/import express from "express";/, 'import express, { Request, Response, NextFunction } from "express";\nimport compression from "compression";');
    code = code.replace(/const app = express\(\);/, 'const app = express();\n\n// Add compression to reduce bandwidth\napp.use(compression());');
    fs.writeFileSync('server.ts', code);
}
