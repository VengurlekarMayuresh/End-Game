const fs = require('fs');
const path = require('path');

const layouts = ['PublicLayout', 'StudentLayout', 'RecruiterLayout', 'AdminLayout'];
const pages = ['Landing', 'Login', 'Register', 'StudentDashboard', 'RecruiterDashboard', 'AdminDashboard', 'Jobs', 'Company', 'Profile', 'Settings', 'NotFound', 'Unauthorized'];
const components = ['Navbar', 'Sidebar', 'Footer'];

const createComponent = (dir, name, isLayout = false) => {
  const fullPath = path.join(__dirname, 'src', dir, `${name}.jsx`);
  const content = `import React from 'react';\n${isLayout ? `import { Outlet } from 'react-router-dom';\n` : ''}\nconst ${name} = () => {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold">${name}</h1>\n      ${isLayout ? '<Outlet />' : ''}\n    </div>\n  );\n};\n\nexport default ${name};\n`;
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
};

layouts.forEach(l => createComponent('layouts', l, true));
pages.forEach(p => createComponent('pages', p));
components.forEach(c => createComponent('components/layout', c));

console.log('Placeholders created successfully.');
