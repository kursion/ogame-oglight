import Util from '../util.js';

class MenuManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.init();
  }

  init() {
    document.querySelector('#countColonies .ogl_menuOptions')?.remove();
    document.querySelector('#countColonies .ogl_panel')?.remove();

    this.mainDom = document
      .querySelector('#countColonies')
      .appendChild(Util.createDom('div', { class: 'ogl_menuOptions' }));
    this.subDom = document.querySelector('#countColonies').appendChild(Util.createDom('div', { class: 'ogl_panel' }));

    // main buttons
    this.addOptions();
    this.addShips();
    this.addMissions();
    this.addHarvest();

    // sub buttons
    this.addSubEco();
    this.addSubProd();
    this.addSubPins();
    this.addSubTargets();
  }

  addOptions() {
    let button = this.mainDom.appendChild(
      Util.createDom('div', { class: 'material-icons ogl_manageData ogl_button tooltip' }, 'settings')
    );
    button.addEventListener('click', () => {
      this.ogl.component.popup.load();

      let globalContainer = Util.createDom('div', { class: 'ogl_globalConfig' });
      let sideContainer = globalContainer.appendChild(Util.createDom('div'));
      let container = globalContainer.appendChild(Util.createDom('div', { class: 'ogl_config' }));

      sideContainer.appendChild(
        Util.createDom(
          'h1',
          { class: 'ogl_scriptTitle' },
          `OGLight <span>(v${GM_info.script.version.indexOf('b') > -1 ? '4-b' + hash : GM_info.script.version})</span>`
        )
      );
      sideContainer.appendChild(Util.createDom('hr'));
      sideContainer.appendChild(Util.createDom('p', {}, this.ogl.component.lang.getText('kofi')));
      sideContainer.appendChild(
        Util.createDom(
          'div',
          {},
          "<a class='ogl_kofi' href='https://ko-fi.com/O4O22XV69' target='_blank'>Buy me a coffee</a>"
        )
      );

      let rval = container.appendChild(Util.createDom('div', {}, '<span>Resources Value (RVal)</span>'));
      let rvalInput = rval.appendChild(Util.createDom('input', { type: 'text', class: 'ogl_input' }));
      rvalInput.value = this.ogl.db.options.rval;

      let ptre = container.appendChild(
        Util.createDom('div', {}, '<span><a href="https://ptre.chez.gg/" target="_blank">PTRE</a> Teamkey</span>')
      );
      let ptreInput = ptre.appendChild(
        Util.createDom('input', { type: 'password', placeholder: 'TM-XXXX-XXXX-XXXX-XXXX' })
      );
      if (this.ogl.ptre) ptreInput.value = this.ogl.ptre;

      ptreInput.addEventListener('focus', () => ptreInput.setAttribute('type', 'text'));
      ptreInput.addEventListener('blur', () => ptreInput.setAttribute('type', 'password'));

      this.ogl.component.popup.open(globalContainer);
      setTimeout(() => rvalInput.dispatchEvent(new Event('change')), 500);

      container.appendChild(Util.createDom('h2', {}, 'Interface'));

      let minifyPictures = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('minifyPictures')}</span>`)
      );
      let minifyToggle = minifyPictures.appendChild(Util.createDom('div', { class: 'ogl_confToggle' }));
      if (localStorage.getItem('ogl-minipics')) minifyToggle.classList.add('ogl_active');

      minifyToggle.addEventListener('click', () => {
        if (localStorage.getItem('ogl-minipics')) {
          localStorage.removeItem('ogl-minipics');
          minifyToggle.classList.remove('ogl_active');
        } else {
          localStorage.setItem('ogl-minipics', true);
          minifyToggle.classList.add('ogl_active');
        }
      });

      let timers = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('displayTimers')}</span>`)
      );
      timers.appendChild(Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'timers' }));

      let fleetDetailsName = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('fleetDetailsName')}</span>`)
      );
      fleetDetailsName.appendChild(
        Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'fleetDetailsName' })
      );

      let rightMenuTooltips = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('rightMenuTooltips')}</span>`)
      );
      rightMenuTooltips.appendChild(
        Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'rightMenuTooltips' })
      );

      container.appendChild(Util.createDom('h2', {}, 'Attacks & stats'));

      let stats = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('rentaStats')}</span>`)
      );
      stats.appendChild(Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'renta' }));

      let ignoreConsumption = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('excludeConso')}</span>`)
      );
      ignoreConsumption.appendChild(
        Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'ignoreConsumption' })
      );

      let spytable = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('spiesTable')}</span>`)
      );
      spytable.appendChild(Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'spytable' }));

      let autoclean = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('autoClean')}</span>`)
      );
      autoclean.appendChild(Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'autoclean' }));

      let bigShip = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('bigShip')}</span>`)
      );
      bigShip.appendChild(Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'bigShip' }));

      let ignoreVacation = container.appendChild(
        Util.createDom('div', {}, `<span>${this.ogl.component.lang.getText('ignoreVacation')}</span>`)
      );
      ignoreVacation.appendChild(
        Util.createDom('div', { class: 'ogl_confToggle ogl_active', 'data-conf': 'ignoreVacation' })
      );

      container.appendChild(Util.createDom('h2', {}, 'Data'));

      let data;

      let dataDiv = container.appendChild(Util.createDom('div', { class: 'ogl_manageData' }));

      let resetButton = dataDiv.appendChild(
        Util.createDom('a', { class: 'ogl_button tooltip', title: 'Reset all your data' }, 'RESET ALL')
      );
      resetButton.addEventListener('click', () => {
        if (confirm('Do you really want to reset your data ?')) {
          this.ogl.save({});
          document.location.reload();
        }
      });

      dataDiv
        .appendChild(
          Util.createDom('a', { class: 'ogl_button tooltip', 'data-title': 'Reset only your stats' }, 'RESET STATS')
        )
        .addEventListener('click', () => {
          if (confirm('Do you really want to reset your stats ?')) {
            this.ogl.db.stats = {};
            this.ogl.save();
            document.location.reload();
          }
        });

      dataDiv
        .appendChild(
          Util.createDom('a', { class: 'ogl_button tooltip', title: 'Reset only your targets' }, 'RESET TARGETS')
        )
        .addEventListener('click', () => {
          if (confirm('Do you really want to reset your targets list ?')) {
            this.ogl.db.players = [];
            this.ogl.db.positions = [];
            this.ogl.db.pinnedList = [];
            this.ogl.db.dataFormat = 0;
            this.ogl.save();
            document.location.reload();
          }
        });

      dataDiv.appendChild(
        Util.createDom('label', { class: 'ogl_button tooltip', for: 'ogl_import', title: 'Import data' }, 'IMPORT')
      );
      let importButton = dataDiv.appendChild(
        Util.createDom('input', { id: 'ogl_import', class: 'ogl_hidden', type: 'file' })
      );
      importButton.addEventListener('change', () => {
        let file = importButton.files[0];

        let reader = new FileReader();
        reader.onload = () => {
          try {
            JSON.parse(reader.result);
          } catch (e) {
            return false;
          }
          data = reader.result;

          let parsed = JSON.parse(reader.result);

          if (parsed.dataFormat >= 4) {
            this.ogl.save(parsed);
            document.location.reload();
          } else alert(`Wrong data format`);
        };
        reader.readAsText(file);
      });

      let exportButton = dataDiv.appendChild(
        Util.createDom(
          'a',
          {
            class: 'ogl_button',
            download: `ogl_${this.ogl.universe.name}_${this.ogl.universe.lang}_${serverTime.getTime()}`,
          },
          'EXPORT'
        )
      );
      exportButton.href = URL.createObjectURL(new Blob([JSON.stringify(this.ogl.db)], { type: 'application/json' }));

      let saveButton = dataDiv.appendChild(Util.createDom('a', { class: 'ogl_button' }, 'SAVE'));
      saveButton.addEventListener('click', () => {
        this.ogl.db.options.rval = Util.formatFromUnits(rvalInput.value || '0');
        this.ogl.save();

        if (ptreInput.value && ptreInput.value.replace(/-/g, '').length == 18 && ptreInput.value.indexOf('TM') == 0) {
          localStorage.setItem('ogl-ptreTK', ptreInput.value);
          document.location.reload();
        } else {
          localStorage.removeItem('ogl-ptreTK');

          if (ptreInput.value) fadeBox('Error, wrong PTRE teamkey format', true);
          else document.location.reload();
        }
      });

      container.querySelectorAll('.ogl_confToggle[data-conf]').forEach((button) => {
        let id = button.getAttribute('data-conf');

        if (this.ogl.db.options.togglesOff.indexOf(id) > -1) button.classList.remove('ogl_active');

        button.addEventListener('click', () => {
          let index = this.ogl.db.options.togglesOff.indexOf(id);
          index > -1 ? this.ogl.db.options.togglesOff.splice(index, 1) : this.ogl.db.options.togglesOff.push(id);
          button.classList.toggle('ogl_active');
        });
      });
    });
  }

  addShips() {
    let button = this.mainDom.appendChild(
      Util.createDom(
        'div',
        { class: 'ogl_shipPicker ogl_button tooltipLeft tooltipClose' },
        this.ogl.component.lang.getText('abbr' + this.ogl.db.options.defaultShip)
      )
    );
    button.addEventListener('click', () => {
      let cargoChoice = Util.createDom('div', { id: 'ogl_defaultShipPicker', class: 'ogl_shipList' });
      this.ogl.component.fleet.defaultShipsList.forEach((shipID) => {
        let cargoType = cargoChoice.appendChild(Util.createDom('div', { class: 'ogl_shipIcon ogl_' + shipID }));
        cargoType.addEventListener('click', () => {
          this.ogl.db.options.defaultShip = shipID;
          this.ogl.save();
          document.location.reload();
        });
      });

      this.ogl.component.tooltip.open(button, false, cargoChoice);
    });
  }

  addMissions() {
    let mission = this.ogl.db.options.defaultMission;
    this.mainDom
      .appendChild(
        Util.createDom(
          'div',
          { class: `material-icons ogl_missionPicker${this.ogl.db.options.defaultMission} ogl_button tooltip` },
          this.ogl.db.options.defaultMission == 4 ? 'keyboard_tab' : 'swap_horiz'
        )
      )
      .addEventListener('click', () => {
        this.ogl.db.options.defaultMission = this.ogl.db.options.defaultMission == 4 ? 3 : 4;
        this.ogl.save();
        window.location.href = window.location.href.replace(
          `&mission=${mission}`,
          `&mission=${this.ogl.db.options.defaultMission}`
        );
        this.init();
      });
  }

  addHarvest() {
    let button = this.mainDom.appendChild(
      Util.createDom('div', { class: 'material-icons ogl_harvest ogl_button tooltip' }, 'all_inclusive')
    );
    let linkedButton = Util.createDom(
      'div',
      { class: 'ogl_linkedHarvest ogl_button' },
      this.ogl.current.type == 'moon'
        ? this.ogl.component.lang.getText('linkedPlanets')
        : this.ogl.component.lang.getText('linkedMoons')
    );

    button.addEventListener('click', () => {
      if (this.ogl.page == 'fleetdispatch' && (this.ogl.mode == 1 || this.ogl.mode == 4)) {
        window.location.href = redirectOverviewLink;
      } else {
        (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).classList.toggle('ogl_shortcuts');
        button.classList.toggle('ogl_active');

        document.querySelectorAll('.smallplanet > a').forEach((planet) => {
          if (planet.closest('.ogl_shortcuts')) {
            planet.addEventListener('click', (event) => {
              event.preventDefault();
              this.ogl.db.collectSource = [
                ...this.ogl.current.coords,
                ...[this.ogl.current.type == 'planet' ? '1' : '3'],
              ];
              this.ogl.db.collectDestination = planet
                .closest('.smallplanet')
                .querySelector('.planet-koords')
                .textContent.slice(1, -1)
                .split(':');
              planet.classList.contains('moonlink')
                ? this.ogl.db.collectDestination.push('3')
                : this.ogl.db.collectDestination.push('1');
              this.ogl.save();
              window.location.href = `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=1&galaxy=${this.ogl.db.collectDestination[0]}&system=${this.ogl.db.collectDestination[1]}&position=${this.ogl.db.collectDestination[2]}&type=${this.ogl.db.collectDestination[3]}&mission=${this.ogl.db.options.defaultMission}`;
            });
          }
        });

        linkedButton.classList.toggle('ogl_active');
      }
    });

    if (this.ogl.page == 'fleetdispatch' && (this.ogl.mode == 1 || this.ogl.mode == 4)) {
      button.classList.add('ogl_active');
    }

    document
      .querySelector('#countColonies')
      .parentNode.insertBefore(linkedButton, document.querySelector('#planetList'));
    linkedButton.addEventListener('click', () => {
      if (this.ogl.current.smallplanet.querySelector('.moonlink')) {
        this.ogl.db.collectSource = [...this.ogl.current.coords, ...[this.ogl.current.type == 'planet' ? '1' : '3']];
        this.ogl.save();
        window.location.href = `https://${
          window.location.host
        }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=4&type=${
          this.ogl.current.type == 'planet' ? '3' : '1'
        }&mission=${this.ogl.db.options.defaultMission}`;
      } else {
        this.ogl.db.collectSource = [
          ...this.ogl.next.smallplanetWithMoon.querySelector('.planet-koords').textContent.slice(1, -1).split(':'),
          ...[this.ogl.current.type == 'planet' ? '3' : '1'],
        ];
        this.ogl.save();
        let cp =
          this.ogl.current.type == 'planet'
            ? new URL(this.ogl.next.smallplanetWithMoon.querySelector('a.planetlink').href).searchParams.get('cp')
            : new URL(this.ogl.next.smallplanetWithMoon.querySelector('a.moonlink').href).searchParams.get('cp');
        window.location.href = `https://${
          window.location.host
        }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=4&cp=${cp}&type=${
          this.ogl.current.type == 'planet' ? '1' : '3'
        }&mission=${this.ogl.db.options.defaultMission}`;
      }
    });
  }

  addSubEco() {
    let button = this.subDom.appendChild(
      Util.createDom(
        'div',
        { class: 'material-icons tooltip ogl_button', title: this.ogl.component.lang.getText('economyView') },
        'account_balance'
      )
    );

    document.querySelectorAll('.planetlink, .moonlink').forEach((element) => {
      let coords = element.parentNode.querySelector('.planet-koords').textContent.slice(1, -1);
      if (element.classList.contains('moonlink')) coords += ':M';

      let container = element.appendChild(Util.createDom('div', { class: 'ogl_stock' }));

      let deltaTime = Math.floor((serverTime.getTime() - this.ogl.db.me.planets[coords]?.production?.[3] || 0) / 1000);

      ['metal', 'crystal', 'deut'].forEach((res, index) => {
        let oldValue = this.ogl.db.me.planets[coords]?.resources?.[res] || 0;
        let storage = this.ogl.db.me.planets?.[coords]?.storage?.[index];

        let prodSinceLastUpdate = (this.ogl.db.me.planets[coords]?.production?.[index] || 0) * deltaTime;
        let newValue = Math.floor(oldValue + prodSinceLastUpdate);
        let item = container.appendChild(Util.createDom('div', { class: `ogl_${res}` }));

        if (!element.classList.contains('moonlink') && storage) {
          if (oldValue < storage && newValue >= storage) newValue = storage;
          if (newValue >= storage) item.classList.add('ogl_full');
        }

        item.textContent = Util.formatToUnits(newValue);
        item.setAttribute('data-value', newValue);
      });
    });

    button.addEventListener('click', () => {
      if ((document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).getAttribute('data-panel')) {
        (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).removeAttribute('data-panel');
        this.ogl.db.menuView = false;
        // this.ogl.saveAsync();
      } else {
        (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).setAttribute(
          'data-panel',
          'resources'
        );
        this.ogl.db.menuView = 'resources';
        // this.ogl.saveAsync();
      }
    });

    if (this.ogl.db.menuView == 'resources')
      (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).setAttribute(
        'data-panel',
        'resources'
      );
  }

  addSubProd() {
    let button = this.subDom.appendChild(
      Util.createDom(
        'div',
        { class: 'tooltip ogl_button', title: this.ogl.component.lang.getText('productionView') },
        'ø'
      )
    );
    button.addEventListener('click', () => {
      this.ogl.component.popup.load();

      let container = Util.createDom('div', { class: 'ogl_mineContainer' });
      let sum = [0, 0, 0];
      let sumProd = [0, 0, 0];
      let count = 0;

      container.appendChild(Util.createDom('span', { class: 'ogl_header' }, '&nbsp;'));
      container.appendChild(Util.createDom('i', { class: 'ogl_centered ogl_header' }, '&nbsp;'));

      let headerMetal = container.appendChild(Util.createDom('b', { class: 'ogl_metal ogl_header' }));
      let headerCrystal = container.appendChild(Util.createDom('b', { class: 'ogl_crystal ogl_header' }));
      let headerDeut = container.appendChild(Util.createDom('b', { class: 'ogl_deut ogl_header' }));

      document.querySelectorAll('.smallplanet').forEach((planet) => {
        let name = planet.querySelector('.planet-name').textContent;
        let coords = planet.querySelector('.planet-koords').textContent.slice(1, -1);
        let upgrading = planet.querySelector('.constructionIcon');

        if (this.ogl.db.me.planets[coords]) {
          let newLine = container.appendChild(Util.createDom('span', {}, `[${coords}]`));
          if (planet.getAttribute('data-multi')) newLine.setAttribute('data-multi', planet.getAttribute('data-multi'));
          container.appendChild(Util.createDom('i', {}, name));

          let metalLevel =
            upgrading && this.ogl.db.me.planets[coords].upgrade?.[0] == 1
              ? `(${this.ogl.db.me.planets[coords].upgrade?.[1]})`
              : this.ogl.db.me.planets[coords]?.techs?.[1] || '?';
          let crystalLevel =
            upgrading && this.ogl.db.me.planets[coords].upgrade?.[0] == 2
              ? `(${this.ogl.db.me.planets[coords].upgrade?.[1]})`
              : this.ogl.db.me.planets[coords]?.techs?.[2] || '?';
          let deutLevel =
            upgrading && this.ogl.db.me.planets[coords].upgrade?.[0] == 3
              ? `(${this.ogl.db.me.planets[coords].upgrade?.[1]})`
              : this.ogl.db.me.planets[coords]?.techs?.[3] || '?';

          container.appendChild(
            Util.createDom(
              'b',
              { class: 'ogl_metal' },
              metalLevel +
                `<div>+${Util.formatToUnits(
                  Math.round((this.ogl.db.me.planets[coords]?.production[0] || 0) * 60 * 60 * 24)
                )}</div>`
            )
          );
          container.appendChild(
            Util.createDom(
              'b',
              { class: 'ogl_crystal' },
              crystalLevel +
                `<div>+${Util.formatToUnits(
                  Math.round((this.ogl.db.me.planets[coords]?.production[1] || 0) * 60 * 60 * 24)
                )}</div>`
            )
          );
          container.appendChild(
            Util.createDom(
              'b',
              { class: 'ogl_deut' },
              deutLevel +
                `<div>+${Util.formatToUnits(
                  Math.round((this.ogl.db.me.planets[coords]?.production[2] || 0) * 60 * 60 * 24)
                )}</div>`
            )
          );

          sum = [
            sum[0] + parseInt(this.ogl.db.me.planets[coords]?.techs?.[1] || 0),
            sum[1] + parseInt(this.ogl.db.me.planets[coords]?.techs?.[2] || 0),
            sum[2] + parseInt(this.ogl.db.me.planets[coords]?.techs?.[3] || 0),
          ];
          sumProd = [
            sumProd[0] + (this.ogl.db.me.planets[coords]?.production?.[0] || 0) * 60 * 60 * 24,
            sumProd[1] + (this.ogl.db.me.planets[coords]?.production?.[1] || 0) * 60 * 60 * 24,
            sumProd[2] + (this.ogl.db.me.planets[coords]?.production?.[2] || 0) * 60 * 60 * 24,
          ];
          count++;
        }
      });

      headerMetal.innerHTML =
        'ø ' + (sum[0] / count).toFixed(1) + `<div>+${Util.formatToUnits(Math.round(sumProd[0]))}</div>`;
      headerCrystal.innerHTML =
        'ø ' + (sum[1] / count).toFixed(1) + `<div>+${Util.formatToUnits(Math.round(sumProd[1]))}</div>`;
      headerDeut.innerHTML =
        'ø ' + (sum[2] / count).toFixed(1) + `<div>+${Util.formatToUnits(Math.round(sumProd[2]))}</div>`;

      this.ogl.component.popup.open(container);
    });
  }

  addSubPins() {
    let button = this.subDom.appendChild(
      Util.createDom(
        'div',
        { class: 'material-icons tooltip ogl_button', title: this.ogl.component.lang.getText('pinnedView') },
        'push_pin'
      )
    );
    button.addEventListener('click', () => this.ogl.component.sidebar?.displayPinnedList());
  }

  addSubTargets() {
    let button = this.subDom.appendChild(
      Util.createDom(
        'div',
        { class: 'material-icons tooltip ogl_button', title: this.ogl.component.lang.getText('targetView') },
        'gps_fixed'
      )
    );
    button.addEventListener('click', () => this.ogl.component.sidebar?.displayTargetList());
  }
}

export default MenuManager;
