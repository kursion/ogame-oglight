import Util from '../util.js';

class ColorManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.colors = [
      'red',
      'halfred',
      'yellow',
      'halfyellow',
      'green',
      'halfgreen',
      'blue',
      'halfblue',
      'violet',
      'halfviolet',
      'gray',
      'none',
    ];
  }

  addColorUI(sender, parent, planetIDs, clickEvent, callback) {
    let container = parent.appendChild(Util.createDom('div', { class: 'ogl_colors' }));
    this.colors.forEach((color) => {
      let button = container.appendChild(Util.createDom('div', { 'data-color': color }));
      button.addEventListener('click', () => {
        planetIDs.forEach((planetID) => {
          this.ogl.db.positions[planetID].colorID = this.ogl.db.positions[planetID].playerID;
          if (planetIDs.length == 1 && this.ogl.db.positions[planetID].color == color) color = false;
          this.ogl.db.positions[planetID].color = color;
          this.ogl.db.lastColorUsed = color;

          if (document.querySelector('.ogl_sideView.ogl_active') && this.ogl.db.sidebarView == 'targetList') {
            let target = document.querySelector(
              `.ogl_sideView [data-planetID="${this.ogl.db.positions[planetID].id}"]`
            );
            if (target) {
              target.setAttribute('data-color', color);
              if (color == 'none' || color == false) target.remove();
            } else if (!target && color != 'none' && color != false) {
              this.ogl.component.sidebar?.displayTargetList();
            }
          }
        });

        if (sender) {
          sender.setAttribute('data-color', color);
          if (sender.closest('.row')) sender.closest('.row').setAttribute('data-color', color);
          if (sender.closest('.galaxyRow')) sender.closest('.galaxyRow').setAttribute('data-color', color);
          if (sender.closest('.ogl_spyTable')) sender.closest('[data-coords]').setAttribute('data-color', color);
        }

        if (callback) callback(color);

        setTimeout(() => this.ogl.component.tooltip.close(true), 100);
        // this.ogl.saveAsync();

        if (document.querySelector('.ogl_sideView.ogl_active') && this.ogl.db.sidebarView == 'pinned')
          this.ogl.component.sidebar?.displayPinnedTarget();

        if (planetIDs.length > 1) submitForm();
      });

      if (color == 'none') color = false;

      if (clickEvent && clickEvent.shiftKey && color == this.ogl.db.lastColorUsed) {
        button.click();
      }
    });
  }
}

export default ColorManager;
