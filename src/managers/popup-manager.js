import Util from '../util.js';

class PopupManager {
  constructor(ogl) {
    this.ogl = ogl;

    this.overlay = document.body.appendChild(Util.createDom('div', { class: 'ogl_overlay' }));
    this.dom = this.overlay.appendChild(Util.createDom('div', { class: 'ogl_popup' }));
    this.cross = this.dom.appendChild(Util.createDom('div', { class: 'ogl_close material-icons' }, 'clear'));
    this.content = this.dom.appendChild(Util.createDom('div'));

    this.cross.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.close();
    });
  }

  load() {
    this.content.innerHTML = '';
    this.content.appendChild(Util.createDom('div', { class: 'ogl_loader' }));
    document.body.classList.add('ogl_active');
    this.dom.classList.add('ogl_active');
    this.overlay.classList.add('ogl_active');
  }

  open(html) {
    setTimeout(() => {
      this.content.innerHTML = '';
      this.content.appendChild(html);
      document.body.classList.add('ogl_active');
      this.dom.classList.add('ogl_active');
      this.overlay.classList.add('ogl_active');
    }, Math.random() * (400 - 100 + 1) + 100);
  }

  close() {
    document.body.classList.remove('ogl_active');
    this.dom.classList.remove('ogl_active');
    this.overlay.classList.remove('ogl_active');
  }
}

export default PopupManager;
