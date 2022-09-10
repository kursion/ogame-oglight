/** Greasemonkey polyfills */
if (window.GM_getValue === undefined) {
  window.GM_getValue = (key) => {
    return localStorage.getItem(key);
  };
}
if (!window.GM_setValue) {
  window.GM_setValue = (key, data) => {
    localStorage.setItem(key, data);
  };
}
if (!window.GM_info) {
  window.GM_info = { script: { version: '4.5.0' } };
}
if (!window.unsafeWindow) {
  window.unsafeWindow = window;
}
if (localStorage.getItem('ogl-minipics')) {
  const style = document.createElement('style');
  style.innerHTML = `
        #supplies > header, #facilities > header, #research > header,
        #shipyard > header, #defense > header, #fleet1 .planet-header,
        #fleet2 .planet-header, #fleet3 .planet-header
        {
            height:34px !important;
        }

        #overviewcomponent #planet,
        #overviewcomponent #detailWrapper
        {
            height:auto !important;
            min-height:208px !important;
            position:relative !important;
        }

        #technologydetails_wrapper
        {
            position:relative !important;
        }

        #detail.detail_screen
        {
            height:300px !important;
            position:relative !important;
        }
    `;
  document.querySelector('head').append(style);
}

let hash = Math.abs(Array.from('abdcefghijklmnop(){}').reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0));

// cleanup old data
localStorage.removeItem('ogl-css');
localStorage.removeItem('ogl-data');

if (GM_info.script.version.indexOf('b') > -1) {
  //return;
  window.addEventListener('load', () => {
    let perf = (key, value) => {
      console.log((key + ' ').padEnd(25, '.') + ' ' + (value || 0) + ' ms');
    };

    console.log(new String(' OGL ').padStart(18, '=').padEnd(32, '='));

    Object.keys(performance.ogl)
      .sort()
      .forEach((k) => {
        if (k.indexOf('End') == -1) {
          perf(k, Math.round(performance.ogl[k + 'End'] - performance.ogl[k]));
        }
      });

    console.log(new String(' Page ').padStart(18, '=').padEnd(32, '='));
    perf('Total load', Math.round(performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart));
  });
}

// Lazy load if needed.
if (new URL(window.location.href).searchParams.get('oglLazy') == 'true' && !document.hasFocus()) {
  window.onfocus = () =>
    (window.location.href =
      'https://' +
      window.location.host +
      window.location.pathname +
      window.location.search.replace('&oglLazy=true', ''));
  localStorage.setItem('ogl-redirect', false);
  window.stop();
}

// Redirect user if some url is stored in the localStorage in key 'ogl-redirect'.
let redirect = localStorage.getItem('ogl-redirect');
if (redirect && redirect.indexOf('https') > -1) {
  localStorage.setItem('ogl-redirect', false);
  window.location.replace(redirect);
}

// Let's manually force disable the default tooltip (Tipped) library.
function goodbyeTipped() {
  if (typeof Tipped !== 'undefined') {
    for (let [key] of Object.entries(Tipped)) {
      Tipped[key] = function () {
        return false;
      };
    }
  } else requestAnimationFrame(() => goodbyeTipped());
}
goodbyeTipped();
