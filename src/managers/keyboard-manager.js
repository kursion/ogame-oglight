import Util from '../util.js';

class KeyboardManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.dom = (document.querySelector('#cutty') || document.querySelector('#norm')).appendChild(
      Util.createDom('div', { class: 'ogl_keyList' })
    );

    this.sent = false;

    document.addEventListener('keypress', (event) => {
      if (
        !this.sent &&
        (!document.querySelector('.ui-dialog') || document.querySelector('.ui-dialog').style.display == 'none') &&
        !document.querySelector('.chat_box_textarea:focus') &&
        document.activeElement.tagName != 'INPUT' &&
        document.activeElement.tagName != 'TEXTAREA'
      ) {
        this.sent = true;

        let keycode = event.keyCode ? event.keyCode : event.which;
        let keyNumber = parseInt(String.fromCharCode(keycode));
        let charList = Object.keys(this.ogl.keyboardActionsList).map((x) => x.split('|'));

        if (keycode == 91 || keycode == 17) return; // windows key

        charList.forEach((c) => {
          if (c.indexOf(String.fromCharCode(keycode).toLowerCase()) > -1) {
            this.ogl.keyboardActionsList[c.join('|')]();
          } else if (keyNumber > 1 && keyNumber <= 9 && keycode) {
            this.ogl.keyboardActionsList['2-9'] && this.ogl.keyboardActionsList['2-9'](keyNumber);
          } else if (keycode == 13 && this.ogl.keyboardActionsList['enter']) {
            this.ogl.keyboardActionsList['enter']();
          }
        });
      }
    });

    document.addEventListener('keyup', () => (this.sent = false));

    this.addKey('i', this.ogl.component.lang.getText('prevPlanet'), () => {
      if ((this.ogl.mode != 1 && this.ogl.mode != 4) || this.ogl.component.fleet.linksUpdated)
        window.location.href = this.ogl.prevLink;
    });

    this.addKey('o', this.ogl.component.lang.getText('nextPlanet'), () => {
      if ((this.ogl.mode != 1 && this.ogl.mode != 4) || this.ogl.component.fleet.linksUpdated)
        window.location.href = this.ogl.nextLink;
    });

    if (this.ogl.page == 'fleetdispatch') {
      this.addKey('r', this.ogl.component.lang.getText('reverseAllShipsRes'), () => {
        if (fleetDispatcher.currentPage == 'fleet1')
          document.querySelectorAll('#fleet1 li[data-status="on"] .ogl_delta').forEach((e) => e.click());
        if (fleetDispatcher.currentPage == 'fleet2')
          document.querySelectorAll('#fleet2 .res .ogl_delta').forEach((e) => e.click());
      });

      this.addKey('s', this.ogl.component.lang.getText('scExpe'), () => {
        if (fleetDispatcher.currentPage == 'fleet1') this.ogl.component.fleet.expedition(202);
      });

      this.addKey('l', this.ogl.component.lang.getText('lcExpe'), () => {
        if (fleetDispatcher.currentPage == 'fleet1') this.ogl.component.fleet.expedition(203);
      });

      this.addKey('f', this.ogl.component.lang.getText('pfExpe'), () => {
        if (fleetDispatcher.currentPage == 'fleet1') this.ogl.component.fleet.expedition(219);
      });

      this.addKey('a', this.ogl.component.lang.getText('allShipsRes'), () => {
        if (fleetDispatcher.currentPage == 'fleet1') fleetDispatcher.selectAllShips();
        if (fleetDispatcher.currentPage == 'fleet2') fleetDispatcher.selectMaxAll();
        fleetDispatcher.refresh();
      });

      this.addKey('2-9', this.ogl.component.lang.getText('splitShipsRes'), (keyNumber) => {
        if (!keyNumber) keyNumber = 2;

        if (fleetDispatcher.currentPage == 'fleet1') {
          fleetDispatcher.shipsOnPlanet.forEach((ship) =>
            fleetDispatcher.selectShip(ship.id, Math.ceil(ship.number / keyNumber))
          );
          //fleetDispatcher.focusSubmitFleet1();
        } else if (fleetDispatcher.currentPage == 'fleet2') {
          let fleetDispatcherResources = ['metalOnPlanet', 'crystalOnPlanet', 'deuteriumOnPlanet'];

          document.querySelectorAll('#fleet2 #resources .res_wrap').forEach((resource, index) => {
            let cargoType = ['cargoMetal', 'cargoCrystal', 'cargoDeuterium'];

            let currentMax = fleetDispatcher[fleetDispatcherResources[index]];
            if (index == 2) currentMax -= fleetDispatcher.getConsumption();

            fleetDispatcher[cargoType[index]] = Math.max(Math.ceil(currentMax / keyNumber), 0);
            resource.querySelector('input').value = fleetDispatcher[cargoType[index]];

            //fleetDispatcher.focusSendFleet();
          });
        }
        fleetDispatcher.refresh();
      });

      this.addKey('p', this.ogl.component.lang.getText('prevFleet'), () => {
        if (fleetDispatcher.currentPage != 'fleet1' || !this.ogl.component.fleet.sliderSpeed || !fleetDispatcher)
          return;
        if (!this.ogl.db.lastFleet) return;

        fleetDispatcher.resetShips();
        if (this.ogl.db.lastFleet.shipsToSend)
          Object.values(this.ogl.db.lastFleet.shipsToSend).forEach((ship) =>
            fleetDispatcher.selectShip(ship.id, ship.number)
          );

        if (this.ogl.db.lastFleet.targetPlanet) {
          document.querySelector('#galaxy').value = this.ogl.db.lastFleet.targetPlanet.galaxy;
          document.querySelector('#system').value = this.ogl.db.lastFleet.targetPlanet.system;
          document.querySelector('#position').value = this.ogl.db.lastFleet.targetPlanet.position;
          document.querySelector('#position').value = this.ogl.db.lastFleet.targetPlanet.position;

          fleetDispatcher.targetPlanet = this.ogl.db.lastFleet.targetPlanet;
          fleetDispatcher.mission = this.ogl.db.lastFleet.mission;
          fleetDispatcher.cargoMetal = Math.min(
            this.ogl.db.lastFleet.cargoMetal,
            fleetDispatcher.metalOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.cargoCrystal = Math.min(
            this.ogl.db.lastFleet.cargoCrystal,
            fleetDispatcher.crystalOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.cargoDeuterium = Math.min(
            this.ogl.db.lastFleet.cargoDeuterium,
            fleetDispatcher.deuteriumOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.speedPercent = this.ogl.db.lastFleet.speedPercent;

          if (fleetDispatcher.mission == 15) {
            fleetDispatcher.expeditionTime = this.ogl.db.lastFleet.expeditionTime;
            fleetDispatcher.updateExpeditionTime();
          }

          this.ogl.component.fleet.updateSpeedPercent();
        }

        fleetDispatcher.refresh();
        this.ogl.component.fleet.updatePlanetList();
      });

      this.addKey('t', this.ogl.component.lang.getText('attackCurrentTarget'), () => {
        if (!fleetDispatcher) return;

        new Promise((resolve) => resolve(this.ogl.component.sidebar.displayTargetList(true))).then(() => {
          if (this.ogl.db.options.nextTargets[0]) {
            fleetDispatcher.resetShips();

            let shipID = this.ogl.db.options.defaultShip;
            let shipCount = this.ogl.component.fleet.calcRequiredShips(shipID, this.ogl.db.options.rval);
            fleetDispatcher.selectShip(shipID, shipCount);

            let coords = this.ogl.db.options.nextTargets[0].split(':');
            fleetDispatcher.targetPlanet.galaxy = coords[0];
            fleetDispatcher.targetPlanet.system = coords[1];
            fleetDispatcher.targetPlanet.position = coords[2];
            fleetDispatcher.targetPlanet.type = 1;
            fleetDispatcher.targetPlanet.name = '-';
            fleetDispatcher.mission = 1;
            fleetDispatcher.refresh();
            if (fleetDispatcher.currentPage == 'fleet2') fleetDispatcher.updateTarget();

            this.ogl.component.fleet.targetSelected = true;

            if (!this.ogl.db.options.nextTargets[0] && !this.ogl.db.options.nextTargets[1]) {
              fadeBox(this.ogl.component.lang.getText('targetListEnd'), true);
              fleetDispatcher.resetShips();
              fleetDispatcher.refresh();
              return;
            }
          } else {
            fadeBox(this.ogl.component.lang.getText('noTargetSelected'), true);
          }
        });
      });
    }

    if (this.ogl.page == 'galaxy') {
      this.addKey('s', 'Previous galaxy', () => submitOnKey('ArrowDown'));
      this.addKey('z|w', 'Next galaxy', () => submitOnKey('ArrowUp'));
      this.addKey('q|a', 'Previous system', () => submitOnKey('ArrowLeft'));
      this.addKey('d', 'Next system', () => submitOnKey('ArrowRight'));
    }

    if (this.ogl.page == 'messages') {
      this.addKey('enter', 'Send fleet on next spies table line', () => {
        if (
          document.querySelector('.ogl_spyTable') &&
          document.querySelectorAll('.ogl_spyTable div[data-coords]:not(.ogl_attacked):not(.ogl_notGray)')[0]
        ) {
          document
            .querySelectorAll('.ogl_spyTable div[data-coords]:not(.ogl_attacked):not(.ogl_caution)')[0]
            .querySelector('.ogl_renta a')
            .click();
        }
      });
    }
  }

  addKey(key, text, callback) {
    this.ogl.keyboardActionsList = this.ogl.keyboardActionsList || {};
    this.ogl.keyboardActionsList[key] = callback;

    let tip = this.dom.appendChild(
      Util.createDom(
        'div',
        { class: 'ogl_button tooltipLeft', title: text, 'data-trigger': key.toUpperCase() },
        key.toUpperCase()
      )
    );
    if (key == 'enter') {
      tip.classList.add('material-icons');
      tip.textContent = 'subdirectory_arrow_left';
    }
    tip.addEventListener('click', () => callback());
  }
}

export default KeyboardManager;
