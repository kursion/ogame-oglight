import Util from '../util.js';

class JumpgateManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.ogl.db.jumpGateTimers = this.ogl.db.jumpGateTimers || {};

    if (this.page == 'facilities' || this.ogl.current.type == 'moon') {
      let calcTimer = (level) => {
        return ((0.25 * Math.pow(level, 2) - 7.57 * level + 67.34) / this.ogl.universe.fleetSpeed) * 60000;
      };

      jumpgateDone = (a) => {
        var a = $.parseJSON(a);
        if (a.status) {
          planet = a.targetMoon;
          $('.overlayDiv').dialog('destroy');

          let originCoords = this.ogl.current.coords.join(':');
          let originLevel = this.ogl.current.smallplanet.querySelector('.moonlink').getAttribute('data-jumpgatelevel');

          let destinationCoords = document
            .querySelector(`.moonlink[href*="${jumpGateTargetId}"]`)
            .parentNode.querySelector('.planet-koords')
            .textContent.slice(1, -1);
          let destinationLevel = document
            .querySelector(`.moonlink[href*="${jumpGateTargetId}"]`)
            .getAttribute('data-jumpgatelevel');

          let now = serverTime.getTime();
          this.ogl.db.jumpGateTimers[originCoords] = now + calcTimer(originLevel);
          this.ogl.db.jumpGateTimers[destinationCoords] = now + calcTimer(destinationLevel);

          this.ogl.save();
        }
        errorBoxAsArray(a.errorbox);
        if (typeof a.newToken != 'undefined') setNewTokenData(a.newToken);
      };
    }

    this.ogl.observeMutation(() => {
      if (
        document.querySelector('#jumpgateForm') &&
        !document.querySelector('#jumpgateForm').classList.contains('ogl_ready')
      ) {
        document.querySelector('#jumpgateForm').classList.add('ogl_ready');
        document.querySelectorAll('#jumpgateForm .ship_txt_row:not(.tdInactive)').forEach((ship) => {
          ship.style.position = 'relative';
          let delta = ship.appendChild(
            Util.createDom('div', { class: 'ogl_delta' }, '<i class="material-icons">fiber_smart_record</i>')
          );

          delta.addEventListener('click', (event) => {
            let input = ship.nextElementSibling.querySelector('input');
            let selected = input.value.replace(/\./g, '') || 0;
            let amount = parseInt(input.getAttribute('rel'));

            input.value = amount - selected;
          });
        });
      }
    }, 'jumpgate');

    this.addTimer();
  }

  addTimer() {
    document.querySelectorAll('.smallplanet').forEach((planet) => {
      let coords = planet.querySelector('.planet-koords').textContent.slice(1, -1);
      if (this.ogl.db.jumpGateTimers[coords] && this.ogl.db.jumpGateTimers[coords] > serverTime.getTime()) {
        if (!planet.querySelector('.moonlink')) return;

        let updateTimer = () =>
          new Date(this.ogl.db.jumpGateTimers[coords] - (serverTime.getTime() + 3600000))
            .toLocaleTimeString('fr-FR')
            .substr(3);

        let timer = updateTimer();
        let div = planet
          .querySelector('.moonlink')
          .appendChild(Util.createDom('div', { class: 'ogl_jumpGateTimer' }, timer));
        let interval = setInterval(() => {
          if (this.ogl.db.jumpGateTimers[coords] <= serverTime.getTime()) clearInterval(interval);
          else div.textContent = updateTimer();
        }, 1000);
      }
    });
  }
}

export default JumpgateManager;
