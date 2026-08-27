const fs = require('fs');
const path = require('path');
const srcDir = '/Users/ujjwal/.gemini/antigravity/scratch/disaster-risk-platform/frontend/src/pages';
const content = fs.readFileSync(path.join(srcDir, 'LandingPage.tsx'), 'utf-8');
const newContent = content.replace(/FileText, /g, '').replace(/Users, /g, '');
fs.writeFileSync(path.join(srcDir, 'LandingPage.tsx'), newContent);
