import Util from '../util.js';

class GalaxyManager {
  constructor(ogl) {
    this.ogl = ogl;
    //if(this.ogl.page == 'galaxy') this.init();
    this.ogl.observeMutation(() => this.init(), 'galaxy');

    if (this.ogl.page == 'galaxy') {
      document.querySelector('#galaxyLoading').setAttribute('data-currentPosition', `${galaxy}:${system}`);

      let updateTargets = (g, s) => {
        document
          .querySelectorAll('.ogl_stalkPlanets.ogl_scrollable > div.ogl_currentSystem')
          .forEach((item) => item.classList.remove('ogl_currentSystem'));
        document
          .querySelectorAll(`.ogl_stalkPlanets.ogl_scrollable > div[data-minicoords="${g}:${s}"]`)
          .forEach((item) => item.classList.add('ogl_currentSystem'));
      };

      /*loadContent = (g, s) =>
            {
                mobile = true;
                isMobile = true;

                if(this.xhr) this.xhr.abort();
                $("#galaxyLoading").show();
                document.querySelector('#galaxyLoading').setAttribute('data-currentPosition', `${g}:${s}`);

                if(0 === galaxy.length || !$.isNumeric(+galaxy)) g = 1;
                if(0 === system.length || !$.isNumeric(+system)) s = 1;

                $("#galaxy_input").val(g);
                $("#system_input").val(s);

                let phalanxSystemLink = $('#galaxyHeader .phalanxlink.btn_system_action');

                if(phalanxSystemLink.length) phalanxSystemLink.attr('href', phalanxSystemLink.attr('href').replace(/(galaxy=)\d+/, "$1" + galaxy).replace(/(system=)\d+/, "$1" + system));

                this.xhr = $.post(contentLink, {
                    galaxy:g,
                    system:s
                }, displayContentGalaxy)
                .always(function()
                {
                    mobile = false;
                    isMobile = false;
                });

                updateTargets(g, s);
            }*/

      loadContentNew = (g, s) => {
        this.ogl.galaxyLoaded = false;

        if (!canSwitchGalaxy && notEnoughDeuteriumMessage) {
          fadeBox(notEnoughDeuteriumMessage, true);
          return;
        }

        if (this.xhr) this.xhr.abort();
        $('#galaxyLoading').show();
        document.querySelector('#galaxyLoading').setAttribute('data-currentPosition', `${g}:${s}`);

        if (0 === galaxy.length || !$.isNumeric(+galaxy)) g = 1;
        if (0 === system.length || !$.isNumeric(+system)) s = 1;

        $('#galaxy_input').val(g);
        $('#system_input').val(s);

        let phalanxSystemLink = $('#galaxyHeader .phalanxlink.btn_system_action');

        if (phalanxSystemLink.length)
          phalanxSystemLink.attr(
            'href',
            phalanxSystemLink
              .attr('href')
              .replace(/(galaxy=)\d+/, '$1' + galaxy)
              .replace(/(system=)\d+/, '$1' + system)
          );

        this.xhr = $.post(
          galaxyContentLink,
          {
            galaxy: g,
            system: s,
          },
          renderContentGalaxy
        );

        updateTargets(g, s);
      };
    }

    this.goToPosition = (g, s, p) => {
      if (this.ogl.page == 'galaxy') {
        this.ogl.component.tooltip.container.textContent = '';
        this.ogl.component.tooltip.close(true);

        galaxy = g;
        system = s;

        loadContentNew(g, s);
      } else {
        window.location.href = `https://${window.location.host}/game/index.php?page=ingame&component=galaxy&galaxy=${g}&system=${s}&position=${p}`;
      }
    };
  }

  init() {
    performance.ogl.galaxyInit = performance.now();
    document.querySelectorAll('.galaxyTable .ctContentRow').forEach((line) => {
      line.removeAttribute('data-color');
      line.querySelector('.cellPlayerName').classList.remove('tooltipRel');
      line.querySelector('.cellDebris').classList.remove('ogl_active');

      if (!line.querySelector('.cellPosition')) return; // ignore p16 & 17
      if (line.querySelector('.cellPlayerName.admin')) return; // ignore admins

      let id;
      if (line.querySelector('.ownPlayerRow')) id = this.ogl.account.id;
      else id = line.querySelector('.cellPlayerName [rel^="player"]')?.getAttribute('rel').replace('player', '');

      if (id) {
        let position = line.querySelector('.cellPosition').textContent;

        if (position >= 10)
          line.querySelector('.cellPlayerName > span[class*="status_"]').classList.add('tooltipRightTop');
        else line.querySelector('.cellPlayerName > span[class*="status_"]').classList.add('tooltipRight');

        line.querySelector('.cellPlayerName > span[class*="status_"]').classList.add('ogl_noPointer');
        line.querySelector('.cellPlayerName > span[class*="status_"]').classList.add('tooltipClose');
        line.querySelector('.cellPlayerName > span[class*="status_"]').classList.remove('tooltipRel');
        line.querySelector('.cellPlayerName > span[class*="status_"]').setAttribute('data-title', 'loading...');
        line.querySelector('.cellPlayerName > span[class*="status_"]').classList.remove('ogl_noPointer');

        let player = this.ogl.db.players[this.ogl.find(this.ogl.db.players, 'id', id)[0]];

        if (!player) return;
        let a = Util.createDom(
          'a',
          {
            class: 'float_right',
            href: `https://${window.location.host}/game/index.php?page=highscore&site=${Math.max(
              1,
              Math.ceil(player.rank / 100)
            )}&category=1&searchRelId=${player.id}`,
          },
          `${player.rank == -1 ? '(b)' : '#' + player.rank}`
        );
        line.querySelector('.cellPlayerName').appendChild(a);

        line.querySelector('.cellPlayerName > span[class*="status_"]').addEventListener('mouseenter', (e) => {
          if (e.target.classList.contains('ogl_highlight')) return;

          this.ogl.component.crawler.checkPlayerApi(id, () => {
            this.ogl.component.tooltip.update(e.target, this.ogl.component.crawler.buildStalkWindow(id));
          });
        });

        // pin target
        line.querySelector('.cellPlayerName > span[class*="status_"]').addEventListener('click', () => {
          this.ogl.db.pinnedList.forEach((e, index) => {
            if (e && e == player.id) this.ogl.db.pinnedList.splice(index, 1);
          });

          this.ogl.db.pinnedList.unshift(player.id);
          if (this.ogl.db.pinnedList.length > this.ogl.maxPinnedTargets)
            this.ogl.db.pinnedList.length = this.ogl.maxPinnedTargets;

          // this.ogl.saveAsync();

          new Promise((resolve) => {
            resolve(this.ogl.component.crawler.checkPlayerApi(this.ogl.db.pinnedList[0]));
          })
            .then(() => {
              this.ogl.component.sidebar.displayPinnedTarget();
            })
            .then(() => {
              document.querySelectorAll(`.ogl_pinnedContent [data-coords^="${galaxy}:${system}:"]`).forEach((e) => {
                if (!e.querySelector('.ogl_checked'))
                  e.appendChild(Util.createDom('div', { class: 'material-icons ogl_checked' }, 'check_circle'));
              });
            });
        });

        let planetID = line.querySelector('[data-planet-id]').getAttribute('data-planet-id');
        let index = this.ogl.find(this.ogl.db.positions, 'id', planetID, true);
        line.setAttribute('data-color', this.ogl.db.positions[index[0]]?.color);
        let button = line.querySelector('.cellPlanetName').appendChild(
          Util.createDom('div', {
            class: 'ogl_colorButton tooltipClose',
            'data-color': this.ogl.db.positions[index[0]]?.color,
          })
        );
        button.addEventListener('click', (event) => {
          let content = Util.createDom('div', { class: 'ogl_colorAll ogl_tooltipColor' });
          this.ogl.component.color.addColorUI(button, content, index, event);
          this.ogl.component.tooltip.open(button, false, content);
        });
      }

      if (line.querySelector('.microdebris')) {
        let element = line.querySelector('.microdebris');
        let id = '#' + element.getAttribute('rel');

        let total = 0;
        document
          .querySelector(id)
          .querySelectorAll('.debris-content')
          .forEach((resources) => {
            let value = Util.formatFromUnits(resources.innerText.replace(/(\D*)/, ''));
            element.innerHTML += Util.formatToUnits(parseInt(value), 1) + '<br>';
            total += parseInt(value);
          });

        if (total >= this.ogl.db.options.rval) element.closest('.cellDebris').classList.add('ogl_active');
      }

      document.querySelectorAll('.expeditionDebrisSlotBox:not(.ogl_debrisReady)').forEach((element) => {
        element.classList.add('ogl_debrisReady');

        let content = element.querySelectorAll('.ListLinks li');
        if (!content[0]) content = document.querySelectorAll('#debris16 .ListLinks li');

        let scouts = content[2];
        let action = content[3];
        let res = [content[0].textContent.replace(/(\D*)/, ''), content[1].textContent.replace(/(\D*)/, '')];

        element.innerHTML = `
                    <img src="https://gf1.geo.gfsrv.net/cdnc5/fa3e396b8af2ae31e28ef3b44eca91.gif">
                    <div>
                        <div class="ogl_metal">${res[0]}</div>
                        <div class="ogl_crystal">${res[1]}</div>
                    </div>
                    <div>
                        <div>${scouts.textContent}</div>
                        <div>${action.outerHTML}</div>
                    </div>
                `;
      });
    });

    if (system != 499) this.ogl.component.keyboard.sent = false;
    performance.ogl.galaxyInitEnd = performance.now();
    console.log(Math.round(performance.ogl.galaxyInitEnd - performance.ogl.galaxyInit) + 'ms');
  }
}

export default GalaxyManager;
