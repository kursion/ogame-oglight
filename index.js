// Current head tag
const head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

// Let's inject the ./src/main.js script
const script = document.createElement('script');
script.setAttribute('type', 'module');
script.setAttribute('src', chrome.runtime.getURL('src/main.js'));
head.insertBefore(script, head.lastChild);

// Let's inject the style

const style = document.createElement('link');
style.setAttribute('rel', 'stylesheet');
style.setAttribute('type', 'text/css');
style.setAttribute('href', chrome.runtime.getURL('style.css'));
head.append(style);
