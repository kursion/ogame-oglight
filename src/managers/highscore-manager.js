class HighscoreManager {
  constructor(ogl) {
    this.ogl = ogl;
    if (this.ogl.page == 'highscore') this.init();
    this.ogl.observeMutation(() => this.init(), 'highscore');
  }

  init() {
    if (!document.querySelector('.playername')) return;

    document.querySelectorAll('#ranks tbody tr').forEach((line) => {
      line.querySelector('.playername').classList.add('tooltipRight');
      line.querySelector('.playername').classList.add('tooltipClose');
      line.querySelector('.playername').setAttribute('data-title', 'loading...');

      line.querySelector('.playername').addEventListener('mouseenter', (e) => {
        let id = line.getAttribute('id').replace('position', '');
        if (e.target?.classList.contains('ogl_highlight')) return;

        this.ogl.component.crawler.checkPlayerApi(id, () => {
          this.ogl.component.tooltip.update(e.target, this.ogl.component.crawler.buildStalkWindow(id));
        });
      });
    });
  }
}

export default HighscoreManager;
