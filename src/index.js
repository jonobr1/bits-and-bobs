import App from './app.js';

const seo = document.querySelector('#seo');
const domElement = document.createElement('div');

domElement.id = 'app';
document.body.insertBefore(domElement, seo);

App(domElement);
