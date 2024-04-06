import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.js';

const seo = document.querySelector('#seo');
const domElement = document.createElement('div');
const root = createRoot(domElement);

domElement.id = 'react';
document.body.insertBefore(domElement, seo);

root.render(<App />);
