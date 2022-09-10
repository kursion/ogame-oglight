import OGLight from './oglight.js';

// load json & init OGL
let gmKey = localStorage.getItem('ogl_lastKeyUsed');
let ogldata = gmKey ? JSON.parse(GM_getValue(gmKey)) : false;

if (new URL(window.location.href).searchParams.get('component') != 'empire') {
  if (document.readyState !== 'loading') {
    unsafeWindow.ogl = new OGLight(ogldata);
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      unsafeWindow.ogl = new OGLight(ogldata);
    });
  }
}
