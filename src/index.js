import App from './app.js';

const seo = document.querySelector('#seo');
const scrollContainer = document.createElement('div');
const domElement = document.createElement('div');

scrollContainer.id = 'scroll-container';
domElement.id = 'app';

// Wrap the SEO content in the scroll container
scrollContainer.appendChild(seo);
document.body.appendChild(scrollContainer);
document.body.insertBefore(domElement, scrollContainer);

App(domElement, scrollContainer);
