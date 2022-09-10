import Util from '../util.js';

class FleetManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.spyReady = true;

    // add "shortcut" icons
    document.querySelectorAll('.smallplanet > a.planetlink, .smallplanet > a.moonlink').forEach((link) => {
      if (link.classList.contains('planetlink'))
        link.parentNode.setAttribute('data-coords', link.querySelector('.planet-koords').textContent.slice(1, -1));
      if (!link.querySelector('.ogl_shortcut'))
        link.appendChild(Util.createDom('div', { class: 'material-icons ogl_shortcut' }, 'flag'));
    });

    // replace default fleet movement (page movement)
    this.checkFleetMovement();

    this.shipsList = [202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 213, 214, 215, 217, 218, 219];
    this.defaultShipsList = [202, 203, 219, 210];

    if (this.ogl.page == 'fleetdispatch' || this.ogl.page == 'shipyard') this.updateShipsTooltip();
    if (this.ogl.page != 'fleetdispatch') return;

    this.ogl.db.loca.metal = loca.LOCA_ALL_METAL;
    this.ogl.db.loca.crystal = loca.LOCA_ALL_CRYSTAL;
    this.ogl.db.loca.deut = loca.LOCA_ALL_DEUTERIUM;
    this.ogl.db.loca.dm = LocalizationStrings.darkMatter;
    this.ogl.db.loca.item = 'Item';
    this.ogl.db.loca.conso = loca.LOCA_FLEET_FUEL_CONSUMPTION;
    this.ogl.db.loca.energy = resourcesBar.resources.energy.tooltip.split('|')[0];

    if (!fleetDispatcher) {
      setTimeout(() => (this.ogl.component.fleet = new FleetManager(this.ogl)), 20);
    } else this.init();
  }

  init() {
    fleetDispatcher.refreshDataAfterAjax = function (data) {
      this.setOrders(data.orders);

      if (!fleetDispatcher.isInitialized) {
        fleetDispatcher.isInitialized = true;
        return;
      }

      this.setTargetInhabited(data.targetInhabited);
      this.setTargetPlayerId(data.targetPlayerId);
      this.setTargetPlayerName(data.targetPlayerName);
      this.setTargetIsStrong(data.targetIsStrong);
      this.setTargetIsOutlaw(data.targetIsOutlaw);
      this.setTargetIsBuddyOrAllyMember(data.targetIsBuddyOrAllyMember);
      this.setTargetPlayerColorClass(data.targetPlayerColorClass);
      this.setTargetPlayerRankIcon(data.targetPlayerRankIcon);
      this.setPlayerIsOutlaw(data.playerIsOutlaw);
      this.setTargetPlanet(data.targetPlanet);
    };

    fleetDispatcher.apiTechData.forEach((tech) => (this.ogl.db.me.techs[tech[0]] = tech[1]));

    this.shipsList.forEach((shipID) => {
      this.ogl.db.ships[shipID] = {};
      this.ogl.db.ships[shipID].name = fleetDispatcher.fleetHelper.shipsData[shipID].name;
      this.ogl.db.ships[shipID].capacity = fleetDispatcher.fleetHelper.shipsData[shipID].cargoCapacity;
      this.ogl.db.ships[shipID].speed = fleetDispatcher.fleetHelper.shipsData[shipID].speed;
    });

    this.initialDeutOnPlanet = fleetDispatcher.deuteriumOnPlanet;

    fleetDispatcher.metalOnPlanet = Math.max(0, this.ogl.current.metal - this.ogl.db.options.resSaver[0]);
    fleetDispatcher.crystalOnPlanet = Math.max(0, this.ogl.current.crystal - this.ogl.db.options.resSaver[1]);
    fleetDispatcher.deuteriumOnPlanet = Math.max(0, this.ogl.current.deut - this.ogl.db.options.resSaver[2]);

    this.totalOnPlanet =
      fleetDispatcher.metalOnPlanet + fleetDispatcher.crystalOnPlanet + fleetDispatcher.deuteriumOnPlanet ||
      this.ogl.current.metal + this.ogl.current.crystal + this.ogl.current.deut ||
      0;

    this.updatePlanetList();
    this.updatePrevNextLink();

    if (fleetDispatcher.shipsOnPlanet.length == 0) return;

    document
      .querySelector('#fleet1 .allornonewrap .secondcol')
      .prepend(document.querySelector('#fleet1 .show_fleet_apikey'));
    document
      .querySelector('#fleetboxbriefingandresources form')
      .prepend(document.querySelector('#fleetboxmission #missions'));

    /*fleetDispatcher.fleetHelper.getShipData = shipID =>
        {
            return shipsData[shipID];
        }*/

    // this.ogl.saveAsync();

    this.addRequired();
    this.addReverse();
    this.addCapacity();
    this.overWriteEnterKey();
    this.replaceSpeedSelector();
    this.planetsAreDestinations();
    this.resourcesSaving();

    let unload = document
      .querySelector('#loadAllResources')
      .parentNode.appendChild(Util.createDom('div', { class: 'ogl_unloadAllResources' }, '0'));
    unload.addEventListener('click', () => {
      fleetDispatcher.cargoMetal = 0;
      fleetDispatcher.cargoCrystal = 0;
      fleetDispatcher.cargoDeuterium = 0;
      fleetDispatcher.refresh();
    });

    this.overWriteFleetDispatcher(
      'selectShip',
      (shipID, amount) => {
        document.querySelector(`[data-technology="${shipID}"]`).classList.remove('ogl_notEnoughShips');
        let available = fleetDispatcher.shipsOnPlanet.find((e) => e.id == this.ogl.db.options.defaultShip)?.number || 0;

        if (amount > available) {
          document.querySelector(`[data-technology="${shipID}"]`).classList.add('ogl_notEnoughShips');
          setTimeout(
            () => document.querySelector(`[data-technology="${shipID}"]`).classList.remove('ogl_notEnoughShips'),
            3000
          );
        }
        amount = Math.min(available, amount);

        this.cargoMax = fleetDispatcher.getCargoCapacity();
        this.cargoList = [fleetDispatcher.cargoMetal, fleetDispatcher.cargoCrystal, fleetDispatcher.cargoDeuterium];
      },
      (shipID) => {
        if (this.cargoMax <= fleetDispatcher.getCargoCapacity() && this.cargoList.reduce((a, b) => a + b) > 0) {
          fleetDispatcher.cargoMetal = this.cargoList[0];
          fleetDispatcher.cargoCrystal = this.cargoList[1];
          fleetDispatcher.cargoDeuterium = this.cargoList[2];
        }

        setTimeout(
          () => document.querySelector(`[data-technology="${shipID}"] input`)?.dispatchEvent(new Event('change')),
          10
        );
      }
    );

    if (this.ogl.mode == 1 || this.ogl.mode == 4) this.collectResources();

    if (this.ogl.mode == 3) {
      let cumul = [0, 0, 0];
      let destination = `${fleetDispatcher.targetPlanet.galaxy}:${fleetDispatcher.targetPlanet.system}:${fleetDispatcher.targetPlanet.position}`;

      this.ogl.db.lockedList.forEach((key) => {
        if (this.ogl.db.lock[destination][key]) {
          cumul[0] += this.ogl.db.lock[destination][key].metal;
          cumul[1] += this.ogl.db.lock[destination][key].crystal;
          cumul[2] += this.ogl.db.lock[destination][key].deut;
        }
      });

      let resToSend = [
        Math.min(cumul[0], fleetDispatcher.metalOnPlanet),
        Math.min(cumul[1], fleetDispatcher.crystalOnPlanet),
        Math.min(cumul[2], fleetDispatcher.deuteriumOnPlanet),
      ];

      let shipsAmount = this.calcRequiredShips(
        this.ogl.db.options.defaultShip,
        Math.min(resToSend[0] + resToSend[1] + resToSend[2])
      );
      fleetDispatcher.selectShip(this.ogl.db.options.defaultShip, shipsAmount);

      fleetDispatcher.cargoDeuterium = Math.min(
        resToSend[2],
        fleetDispatcher.getDeuteriumOnPlanetWithoutConsumption(),
        fleetDispatcher.getFreeCargoSpace()
      );
      fleetDispatcher.cargoCrystal = Math.min(
        resToSend[1],
        fleetDispatcher.crystalOnPlanet,
        fleetDispatcher.getFreeCargoSpace()
      );
      fleetDispatcher.cargoMetal = Math.min(
        resToSend[0],
        fleetDispatcher.metalOnPlanet,
        fleetDispatcher.getFreeCargoSpace()
      );

      fleetDispatcher.refresh();

      this.overWriteFleetDispatcher('submitFleet2', () => {
        this.ogl.db.lockedList.forEach((key) => {
          if (this.ogl.db.lock[destination][key]) {
            if (cumul[0] > 0) {
              let metalSent = Math.max(this.ogl.db.lock[destination][key].metal - fleetDispatcher.cargoMetal, 0);
              cumul[0] -= metalSent;
              this.ogl.db.lock[destination][key].metal = metalSent;
            }

            if (cumul[1] > 0) {
              let crystalSent = Math.max(this.ogl.db.lock[destination][key].crystal - fleetDispatcher.cargoCrystal, 0);
              cumul[1] -= crystalSent;
              this.ogl.db.lock[destination][key].crystal = crystalSent;
            }

            if (cumul[2] > 0) {
              let deutSent = Math.max(this.ogl.db.lock[destination][key].deut - fleetDispatcher.cargoDeuterium, 0);
              cumul[2] -= deutSent;
              this.ogl.db.lock[destination][key].deut = deutSent;
            }

            //if(this.ogl.db.lock[destination][key].metal == 0 && this.ogl.db.lock[destination][key].crystal == 0 && this.ogl.db.lock[destination][key].deut == 0) delete(this.ogl.db.lock[destination][key]);
          }
        });

        this.ogl.save();
      });
    }

    this.overWriteFleetDispatcher('setTargetPlanet', false, () => {
      // preselect default mission
      if (fleetDispatcher.union) {
        fleetDispatcher.mission = 2;
        fleetDispatcher.refresh();

        // update ACS data
        let acsArrivalTime =
          (Object.values(fleetDispatcher.unions).find((a) => a.id == fleetDispatcher.union)?.time || 0) * 1000;
        if (acsArrivalTime) {
          document.querySelector('.ogl_acsInfo') && document.querySelector('.ogl_acsInfo').remove();
          let li = Util.createDom('li', { class: 'ogl_acsInfo' }, 'acs:');
          document.querySelector('#fleetBriefingPart1').prepend(li);

          let span = li.appendChild(Util.createDom('span', { class: 'value' }));
          let spanOffset = span.appendChild(Util.createDom('span'));
          let count = span.appendChild(Util.createDom('span', { class: 'ogl_warning' }));

          this.acsInterval = setInterval(() => {
            if (!fleetDispatcher.getDuration()) return;
            let newTime = serverTime.getTime() + fleetDispatcher.getDuration() * 1000;
            let acsTime = acsArrivalTime;
            let tl = acsTime - serverTime.getTime();
            let tl3 = (tl * 30) / 100;
            let delta = newTime - acsTime;
            let offset = tl3 - delta;

            if (delta > 0) {
              spanOffset.textContent = `+${new Date(delta).toISOString().slice(11, 19)}`;
              spanOffset.classList.add('ogl_danger');
            } else {
              spanOffset.textContent = '+00:00:00';
              spanOffset.classList.remove('ogl_danger');
            }

            if (delta < tl3) count.textContent = `${new Date(offset).toISOString().slice(11, 19)}`;
            else count.textContent = 'too late';

            if (!fleetDispatcher.union) {
              clearInterval(this.acsInterval);
              document.querySelector('.ogl_acsInfo') && document.querySelector('.ogl_acsInfo').remove();
            }
          }, 333);
        }
      }

      if (!fleetDispatcher.mission) {
        fleetDispatcher.mission = this.ogl.db.options.defaultMission;
        fleetDispatcher.refresh();
      }
      this.updatePlanetList();
    });

    this.overWriteFleetDispatcher('trySubmitFleet1', false, () => {
      this.conso = fleetDispatcher.getConsumption();

      if (this.ogl.mode == 1 || this.ogl.mode == 4) {
        fleetDispatcher.resetCargo();
        fleetDispatcher.cargoDeuterium = Math.min(
          fleetDispatcher.getDeuteriumOnPlanetWithoutConsumption(),
          fleetDispatcher.getFreeCargoSpace()
        );
        fleetDispatcher.cargoCrystal = Math.min(fleetDispatcher.crystalOnPlanet, fleetDispatcher.getFreeCargoSpace());
        fleetDispatcher.cargoMetal = Math.min(fleetDispatcher.metalOnPlanet, fleetDispatcher.getFreeCargoSpace());
      }
    });

    this.overWriteFleetDispatcher(
      'switchToPage',
      () => {
        if (this.ogl.mode == 3) this.tmpCargo = [fleetDispatcher.metal, fleetDispatcher.crystal, fleetDispatcher.deut];
      },
      () => {
        // change right menu planets actions (links -> destinations shortcuts)
        if (fleetDispatcher.currentPage == 'fleet2') {
          (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).classList.add('ogl_shortcuts');

          if (this.ogl.mode == 3) {
            fleetDispatcher.metal = [this.tmpCargo[0], this.tmpCargo[1], this.tmpCargo[2]];
          }
        } else {
          (document.querySelector('#myPlanets') || document.querySelector('#myWorlds')).classList.remove(
            'ogl_shortcuts'
          );
        }
      }
    );

    this.overWriteFleetDispatcher(
      'trySubmitFleet2',
      () => {
        this.tmpDeutOnPlanet = fleetDispatcher.deuteriumOnPlanet;
        fleetDispatcher.deuteriumOnPlanet = this.initialDeutOnPlanet;
      },
      () => {
        fleetDispatcher.deuteriumOnPlanet = this.tmpDeutOnPlanet;
      }
    );

    this.overWriteFleetDispatcher('submitFleet2', () => {
      let coords = this.ogl.current.coords.join(':');
      if (this.ogl.current.type == 'moon') coords += ':M';

      // update blind target
      if (this.targetSelected) {
        if (this.ogl.db.options.nextTargets[0] && !this.ogl.db.options.nextTargets[1]) {
          this.ogl.db.options.nextTargets[0] = 0;
        } else {
          this.ogl.db.options.nextTargets[0] = this.ogl.db.options.nextTargets[1];
        }

        this.ogl.db.options.nextTargets[1] = 0;
      }

      let now = new Date(Date.now());
      let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();

      // update resources on planet
      this.ogl.db.me.planets[coords].resources.metal = Math.max(
        0,
        this.ogl.db.me.planets[coords].resources.metal - fleetDispatcher.cargoMetal
      );
      this.ogl.db.me.planets[coords].resources.crystal = Math.max(
        0,
        this.ogl.db.me.planets[coords].resources.crystal - fleetDispatcher.cargoCrystal
      );
      this.ogl.db.me.planets[coords].resources.deut = Math.max(
        0,
        this.ogl.db.me.planets[coords].resources.deut -
          fleetDispatcher.cargoDeuterium -
          fleetDispatcher.getConsumption()
      );

      // save sent fleet data
      this.ogl.db.lastFleet = {};
      this.ogl.db.lastFleet.shipsToSend = fleetDispatcher.shipsToSend;
      this.ogl.db.lastFleet.targetPlanet = fleetDispatcher.targetPlanet;
      this.ogl.db.lastFleet.speedPercent = fleetDispatcher.speedPercent;
      this.ogl.db.lastFleet.cargoMetal = fleetDispatcher.cargoMetal;
      this.ogl.db.lastFleet.cargoCrystal = fleetDispatcher.cargoCrystal;
      this.ogl.db.lastFleet.cargoDeuterium = fleetDispatcher.cargoDeuterium;
      this.ogl.db.lastFleet.mission = fleetDispatcher.mission;
      this.ogl.db.lastFleet.expeditionTime = fleetDispatcher.expeditionTime;

      // add consumption to stats
      this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] || {
        idList: [],
        expe: {},
        raid: {},
        expeOccurences: {},
        raidOccuences: 0,
        consumption: 0,
      };
      this.ogl.db.stats[midnight].consumption =
        (this.ogl.db.stats?.[midnight]?.consumption || 0) - fleetDispatcher.getConsumption();
      this.ogl.db.stats.total = this.ogl.db.stats.total || {};
      this.ogl.db.stats.total.consumption =
        (this.ogl.db.stats?.total?.consumption || 0) - fleetDispatcher.getConsumption();

      // redirect to messages page when using the spies table
      if (this.ogl.mode == 2) {
        localStorage.setItem('ogl-redirect', `https://${window.location.host}/game/index.php?page=messages`);
      }

      this.fleetSent = true;
      this.ogl.save();
    });

    // add mission's name as tooltip
    document.querySelectorAll('#fleet2 ul#missions a').forEach((e) => {
      e.classList.add('tooltip');
      e.setAttribute('title', e.querySelector('span').textContent);
    });
  }

  // add a callback before and/or after a fleetdispatcher function
  overWriteFleetDispatcher(functionName, beforeCallback, afterCallback) {
    let old = fleetDispatcher[functionName];

    fleetDispatcher[functionName] = function (param, param2) {
      beforeCallback && beforeCallback(param, param2);
      old.call(fleetDispatcher, param, param2);
      afterCallback && afterCallback(param, param2);
    };
  }

  // replace the default "enter" key action on fleetdispatch
  overWriteEnterKey() {
    let btn = document.querySelector('#continueToFleet2');
    let newBtn = Util.createDom('div', { class: 'ogl_fleetBtn' }, btn.innerHTML);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (event) => {
      this.nextPageAction(event, true);
    });

    this.fleet1Pressed = false;
    this.fleet2Pressed = false;

    document.querySelector('#fleetdispatchcomponent').addEventListener('keypress', (event) => {
      if ((event.keyCode || event.which) == 13) event.preventDefault();
      return false;
    });
    window.addEventListener('keyup', () => {
      this.fleet1Pressed = false;
      this.fleet2Pressed = false;
    });
    window.addEventListener('keydown', (event) => {
      let keycode = event.keyCode ? event.keyCode : event.which;

      if (keycode == 13) {
        event.preventDefault();

        if (
          (!document.querySelector('.ui-dialog') || document.querySelector('.ui-dialog').style.display == 'none') &&
          !document.querySelector('.chat_box_textarea:focus') &&
          !document.querySelector('.ogl_overlay.ogl_active')
        ) {
          this.nextPageAction(event);
        } else if (
          document.querySelector('.ui-dialog').style.display != 'none' &&
          document.querySelector('.ui-dialog a.ok')
        ) {
          document.querySelector('.ui-dialog a.ok').click();
        }
      }
    });
  }

  async nextPageAction(event, noKeyCheck) {
    if (navigator.userAgentData && navigator.userAgentData.mobile) noKeyCheck = true;

    if (!noKeyCheck && document.querySelector('.ogl_capacityContainer.ogl_highlight')) return;
    if (document.querySelector('.ajax_loading').style.display != 'none') return;
    if (this.fleetSent && fleetDispatcher.targetPlanet.position != 16) return;

    //if(fleetDispatcher.currentPage == 'fleet1' && !this.fleet1Pressed && !fleetDispatcher.fetchTargetPlayerDataTimeout)
    if (fleetDispatcher.currentPage == 'fleet1' && !this.fleet1Pressed) {
      if (!noKeyCheck && !event.shiftKey) this.fleet1Pressed = true;

      if (!this.ogl.db.options.nextTargets?.[1] && this.targetSelected) return;

      let differentPosition = false;

      ['galaxy', 'system', 'position', 'type'].forEach((key) => {
        if (fleetDispatcher.currentPlanet[key] != fleetDispatcher.targetPlanet[key]) differentPosition = true;
      });

      if (event.shiftKey) {
        if (!this.ogl.db.options.nextTargets[0] && !this.ogl.db.options.nextTargets[1]) return;
        document.querySelector('.ogl_keyList [data-trigger="T"]') &&
          document.querySelector('.ogl_keyList [data-trigger="T"]').click();
        this.updatePlanetList();
      } else {
        if (!differentPosition && (fleetDispatcher.shipsToSend.length == 0 || this.ogl.mode == 4)) {
          fleetDispatcher.targetPlanet.type = fleetDispatcher.targetPlanet.type == 3 ? 1 : 3;
          this.updatePlanetList();
        }
      }

      if (fleetDispatcher.shipsToSend.length == 0) {
        let required = this.calcRequiredShips(this.ogl.db.options.defaultShip);
        fleetDispatcher.selectShip(this.ogl.db.options.defaultShip, required);
        fleetDispatcher.refresh();
      } else {
        await new Promise((resolve, reject) => setTimeout(() => resolve(), 250));
        fleetDispatcher.trySubmitFleet1();
      }
    } else if (fleetDispatcher.currentPage == 'fleet2' && !this.fleet2Pressed) {
      if (!noKeyCheck) this.fleet2Pressed = true;

      let differentPosition = false;
      fleetDispatcher.speedPercent = this.sliderSpeed.querySelector('.ogl_active').getAttribute('data-step');

      ['galaxy', 'system', 'position', 'type'].forEach((key) => {
        if (fleetDispatcher.currentPlanet[key] != fleetDispatcher.targetPlanet[key]) differentPosition = true;
      });

      if (!differentPosition) {
        fleetDispatcher.targetPlanet.type = fleetDispatcher.targetPlanet.type == 3 ? 1 : 3;
        this.updatePlanetList();
        fleetDispatcher.updateTarget();
      } else {
        await new Promise((resolve, reject) =>
          setTimeout(() => {
            if (fleetDispatcher.targetPlanet.position == 16) {
              this.fleet2Pressed = false;
              this.fleetSent = false;
            }

            if (!this.fleetSent) {
              resolve();

              fleetDispatcher.trySubmitFleet2();
            }
          }, 250)
        );
      }
    }
  }

  updateShipsTooltip() {
    document.querySelectorAll('.technology').forEach((ship) => {
      let shipID = ship.getAttribute('data-technology');
      let shipData = this.ogl.db.ships[shipID];

      if (shipData) {
        let amount = parseInt(ship.querySelector('.amount').getAttribute('data-value'));

        ship.title = `
                    <div class="ogl_shipData">
                        <h3>${shipData.name}</h3>
                        <div class="splitLine"></div>
                        <div>Speed: <span>${Util.formatNumber(shipData.speed)}</span></div>
                        <div>Capacity: <span>${Util.formatNumber(shipData.capacity)}</span></div>
                        <div class="splitLine"></div>
                        <div>Quantity: <span>x${Util.formatNumber(amount)}</span></div>
                        <div>Total capacity: <span>${Util.formatNumber(amount * shipData.capacity)}</span></div>
                    </div>
                `;
      }
    });
  }

  updatePrevNextLink() {
    if (this.ogl.mode != 1 && this.ogl.mode != 4) return;

    let onMoon = this.ogl.db.collectSource[3] == 3 ? true : false;

    if (this.ogl.mode == 1) {
      let next = !onMoon ? this.ogl.next.smallplanet : this.ogl.next.smallplanetWithMoon;
      let nextCoords = `${next.querySelector('.planet-koords').textContent.slice(1, -1)}:${
        this.ogl.current.type == 'moon' ? 3 : 1
      }`;

      let prev = !onMoon ? this.ogl.prev.smallplanet : this.ogl.prev.smallplanetWithMoon;
      let prevCoords = `${prev.querySelector('.planet-koords').textContent.slice(1, -1)}:${
        this.ogl.current.type == 'moon' ? 3 : 1
      }`;

      let destinationCoords = this.ogl.db.collectDestination.join(':');

      if (nextCoords == destinationCoords) {
        // next
        if (!onMoon) {
          this.ogl.next.smallplanet =
            this.ogl.next.smallplanet.nextElementSibling || document.querySelectorAll('.smallplanet')[0];
        } else {
          if (document.querySelector('.moonlink') && document.querySelectorAll('.moonlink').length > 1) {
            do
              this.ogl.next.smallplanetWithMoon =
                this.ogl.next.smallplanetWithMoon.nextElementSibling ||
                document.querySelectorAll('.moonlink')[0].parentNode;
            while (!this.ogl.next.smallplanetWithMoon.querySelector('.moonlink'));
          }
        }
      } else if (prevCoords == destinationCoords) {
        // prev
        if (!onMoon) {
          this.ogl.prev.smallplanet =
            this.ogl.prev.smallplanet.previousElementSibling ||
            document.querySelectorAll('.smallplanet')[document.querySelectorAll('.smallplanet').length - 1];
        } else {
          if (document.querySelector('.moonlink') && document.querySelectorAll('.moonlink').length > 1) {
            do
              this.ogl.prev.smallplanetWithMoon =
                this.ogl.prev.smallplanetWithMoon.previousElementSibling ||
                document.querySelectorAll('.moonlink')[document.querySelectorAll('.moonlink').length - 1].parentNode;
            while (!this.ogl.prev.smallplanetWithMoon.querySelector('.moonlink'));
          }
        }
      }
    }

    if (this.ogl.mode == 1) {
      // chosen destination
      let next = !onMoon ? this.ogl.next.smallplanet : this.ogl.next.smallplanetWithMoon;
      if (next) {
        let nextCoords = next.querySelector('.planet-koords').textContent.slice(1, -1).split(':');
        let id = !onMoon
          ? new URL(next.querySelector('a.planetlink').href).searchParams.get('cp')
          : new URL(next.querySelector('a.moonlink').href).searchParams.get('cp');
        this.ogl.nextLink = `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=1&cp=${id}&galaxy=${this.ogl.db.collectDestination[0]}&system=${this.ogl.db.collectDestination[1]}&position=${this.ogl.db.collectDestination[2]}&type=${this.ogl.db.collectDestination[3]}&mission=${this.ogl.db.options.defaultMission}`;

        if (
          this.ogl.db.collectSource[0] == nextCoords[0] &&
          this.ogl.db.collectSource[1] == nextCoords[1] &&
          this.ogl.db.collectSource[2] == nextCoords[2]
        ) {
          this.ogl.nextLink = `https://${window.location.host}/game/index.php?page=ingame&component=overview`;
        }
      }

      let prev = !onMoon ? this.ogl.prev.smallplanet : this.ogl.prev.smallplanetWithMoon;
      if (prev) {
        let id = !onMoon
          ? new URL(prev.querySelector('a.planetlink').href).searchParams.get('cp')
          : new URL(prev.querySelector('a.moonlink').href).searchParams.get('cp');
        this.ogl.prevLink = `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=1&cp=${id}&galaxy=${this.ogl.db.collectDestination[0]}&system=${this.ogl.db.collectDestination[1]}&position=${this.ogl.db.collectDestination[2]}&type=${this.ogl.db.collectDestination[3]}&mission=${this.ogl.db.options.defaultMission}`;
      }
    } else if (this.ogl.mode == 4) {
      // linked planet/moon
      let nextCoords = this.ogl.next.smallplanetWithMoon
        .querySelector('.planet-koords')
        .textContent.slice(1, -1)
        .split(':');
      let nextCp =
        this.ogl.current.type == 'planet'
          ? new URL(this.ogl.next.smallplanetWithMoon.querySelector('a.planetlink').href).searchParams.get('cp')
          : new URL(this.ogl.next.smallplanetWithMoon.querySelector('a.moonlink').href).searchParams.get('cp');
      this.ogl.nextLink = `https://${
        window.location.host
      }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=4&cp=${nextCp}&type=${
        this.ogl.current.type == 'planet' ? '3' : '1'
      }&mission=${this.ogl.db.options.defaultMission}`;

      if (
        this.ogl.db.collectSource[0] == nextCoords[0] &&
        this.ogl.db.collectSource[1] == nextCoords[1] &&
        this.ogl.db.collectSource[2] == nextCoords[2]
      ) {
        this.ogl.nextLink = `https://${window.location.host}/game/index.php?page=ingame&component=overview`;
      }

      let prevCp =
        this.ogl.current.type == 'planet'
          ? new URL(this.ogl.prev.smallplanetWithMoon.querySelector('a.planetlink').href).searchParams.get('cp')
          : new URL(this.ogl.prev.smallplanetWithMoon.querySelector('a.moonlink').href).searchParams.get('cp');
      this.ogl.prevLink = `https://${
        window.location.host
      }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=4&cp=${prevCp}&type=${
        this.ogl.current.type == 'planet' ? '3' : '1'
      }&mission=${this.ogl.db.options.defaultMission}`;
    }

    this.linksUpdated = true;
  }

  // update rightmenu to display fleet's target
  updatePlanetList() {
    let targetCoords = `${fleetDispatcher.targetPlanet.galaxy}:${fleetDispatcher.targetPlanet.system}:${fleetDispatcher.targetPlanet.position}`;
    let type = fleetDispatcher.targetPlanet.type;

    document.querySelectorAll('.smallplanet a.ogl_active').forEach((e) => e.classList.remove('ogl_active'));
    let target = document.querySelector(`.smallplanet[data-coords="${targetCoords}"]`);

    if (target && type == 1) {
      document.querySelector(`.smallplanet[data-coords="${targetCoords}"] .planetlink`)?.classList.add('ogl_active');
    } else if (target && type == 3) {
      document.querySelector(`.smallplanet[data-coords="${targetCoords}"] .moonlink`)?.classList.add('ogl_active');
    }
  }

  // resources to keep on planet
  resourcesSaving() {
    let resourcesNames = [loca.LOCA_ALL_METAL, loca.LOCA_ALL_CRYSTAL, loca.LOCA_ALL_DEUTERIUM];
    let resourcesOnPlanet = [this.ogl.current.metal, this.ogl.current.crystal, this.ogl.current.deut];
    let resources = ['metal', 'crystal', 'deut'];
    let fleetDispatcherResources = ['metalOnPlanet', 'crystalOnPlanet', 'deuteriumOnPlanet'];

    document.querySelectorAll('#fleet2 #resources .res_wrap .resourceIcon:not(.food)').forEach((resource, index) => {
      resource = resource.parentNode;
      let cargoType = ['cargoMetal', 'cargoCrystal', 'cargoDeuterium'];

      let deltaResources = resource
        .querySelector('.res')
        .appendChild(Util.createDom('div', { class: 'ogl_delta material-icons' }, 'fiber_smart_record'));
      deltaResources.addEventListener('click', () => {
        let resourceValue = Util.formatFromUnits(resource.querySelector('input').value) || 0;
        let currentMax = fleetDispatcher[fleetDispatcherResources[index]];

        if (index == 2) currentMax -= fleetDispatcher.getConsumption();

        fleetDispatcher[cargoType[index]] = Math.min(currentMax, Math.max(0, currentMax - resourceValue));
        resource.querySelector('input').value = fleetDispatcher[cargoType[index]];

        setTimeout(() => document.querySelector('#sendFleet').focus(), 100);
      });

      let edit = resource.querySelector('.res').appendChild(
        Util.createDom(
          'div',
          {
            class: 'ogl_resourceSaver material-icons tooltip ogl_input',
            title: `${resourcesNames[index]} ${this.ogl.component.lang.getText('keepOnPlanet')}`,
          },
          'play_for_work'
        )
      );
      edit.addEventListener('click', () => {
        this.ogl.component.tooltip.close(true);
        edit.classList.add('tooltipClose');
        this.ogl.component.tooltip.lastSender = edit;

        let content = Util.createDom(
          'div',
          { class: 'ogl_preloadResources' },
          `<h2>${resourcesNames[index]} ${this.ogl.component.lang.getText('keepOnPlanet')}</h2>`
        );
        content.appendChild(Util.createDom('div', { class: `ogl_shipIcon ogl_${resources[index]}` }));

        let input = content.appendChild(Util.createDom('input', { type: 'text', class: 'ogl_input' }, '0'));
        input.addEventListener('keydown', (e) => {
          if (e.keyCode === 13) {
            this.fleet2Pressed = true;
            content.querySelector('button').click();
          }
        });

        setTimeout(() => input.focus(), 100);

        content
          .appendChild(Util.createDom('button', { class: 'ogl_button ogl_fullGrid' }, 'OK'))
          .addEventListener('click', () => {
            this.ogl.db.options.resSaver[index] = parseInt(input.value?.replace(/\D/g, '') || 0);
            fleetDispatcher[fleetDispatcherResources[index]] = Math.max(
              0,
              resourcesOnPlanet[index] - this.ogl.db.options.resSaver[index]
            );
            this.totalOnPlanet =
              fleetDispatcher?.metal + fleetDispatcher?.crystal + fleetDispatcher?.deuterium ||
              this.ogl.current.metal + this.ogl.current.crystal + this.ogl.current.deut ||
              0;
            fleetDispatcher.refresh();
            this.ogl.component.tooltip.close(true);

            if (this.ogl.db.options.resSaver[index]) {
              edit.classList.remove('material-icons');
              edit.classList.add('ogl_active');
              edit.textContent = '-' + Util.formatToUnits(this.ogl.db.options.resSaver[index], 0);
            } else {
              edit.classList.add('material-icons');
              edit.classList.remove('ogl_active');
              edit.textContent = 'play_for_work';
            }

            edit.classList.remove('tooltipClose');
            // this.ogl.saveAsync();
          });

        this.ogl.component.tooltip.update(edit, content);
      });

      edit.addEventListener('mouseover', () => edit.classList.remove('tooltipClose'));

      if (this.ogl.db.options.resSaver[index]) {
        edit.classList.remove('material-icons');
        edit.classList.add('ogl_active');
        edit.textContent = '-' + Util.formatToUnits(this.ogl.db.options.resSaver[index], 0);
      }

      resource.querySelector('input').classList.add('ogl_input');
    });
  }

  // right menu planets are destination shortcut on fleet2
  planetsAreDestinations() {
    document.querySelectorAll('.smallplanet > a.planetlink, .smallplanet > a.moonlink').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (fleetDispatcher.currentPage == 'fleet2') {
          event.preventDefault();

          document.querySelector('.smallplanet a.ogl_active') &&
            document.querySelector('.smallplanet a.ogl_active').classList.remove('ogl_active');

          let destination = link
            .closest('.smallplanet')
            .querySelector('.planet-koords')
            .textContent.slice(1, -1)
            .split(':');
          let type = link.classList.contains('planetlink') ? 1 : 3;
          fleetDispatcher.targetPlanet.galaxy = destination[0];
          fleetDispatcher.targetPlanet.system = destination[1];
          fleetDispatcher.targetPlanet.position = destination[2];
          fleetDispatcher.targetPlanet.type = type;
          fleetDispatcher.refresh();
          fleetDispatcher.updateTarget();

          link.classList.add('ogl_active');
        }
      });
    });
  }

  // replace the default speed selector
  replaceSpeedSelector() {
    this.sliderSpeed = Util.createDom('div', { class: 'ogl_fleetSpeed' });
    if (this.ogl.account.class == 2) this.sliderSpeed.classList.add('ogl_big');
    document
      .querySelector('#fleetboxbriefingandresources form')
      .insertBefore(this.sliderSpeed, document.querySelector('#fleet2 div#mission'));

    let steps = this.ogl.account.class == 2 ? 0.5 : 1;

    for (let i = steps; i <= 10; i += steps) {
      let step = this.sliderSpeed.appendChild(Util.createDom('div', { 'data-step': i }, i * 10));
      if (fleetDispatcher.speedPercent == i) step.classList.add('ogl_active');
    }

    this.sliderSpeed.addEventListener('click', (event) => {
      if (!event.target.getAttribute('data-step')) return;

      if (fleetDispatcher.cargoDeuterium + this.conso >= fleetDispatcher.deuteriumOnPlanet) {
        fleetDispatcher.speedPercent = event.target.getAttribute('data-step');
        fleetDispatcher.cargoDeuterium = 0;
        fleetDispatcher.selectMaxDeuterium();
      }

      this.sliderSpeed.querySelectorAll('div').forEach((e) => e.classList.remove('ogl_active'));
      event.target.classList.add('ogl_active');
      fleetDispatcher.speedPercent = event.target.getAttribute('data-step');

      fleetDispatcher.refresh();
      this.conso = fleetDispatcher.getConsumption();

      setTimeout(() => document.querySelector('#sendFleet').focus(), 100);
    });

    this.sliderSpeed.addEventListener('mouseover', (event) => {
      if (!event.target.getAttribute('data-step')) return;
      fleetDispatcher.speedPercent = event.target.getAttribute('data-step');
      fleetDispatcher.refresh();
    });

    this.sliderSpeed.addEventListener('mouseout', (event) => {
      fleetDispatcher.speedPercent = this.sliderSpeed.querySelector('.ogl_active').getAttribute('data-step');
      fleetDispatcher.refresh();
    });
  }

  updateSpeedPercent() {
    this.sliderSpeed.querySelectorAll('div').forEach((e) => e.classList.remove('ogl_active'));
    this.sliderSpeed.querySelector(`[data-step="${fleetDispatcher.speedPercent}"]`).classList.add('ogl_active');
  }

  // add required ship indicator to move all the resources
  addRequired() {
    this.defaultShipsList.forEach((shipID) => {
      let tech = document.querySelector(`#fleet1 .technology[data-technology="${shipID}"]`);
      let required = this.calcRequiredShips(shipID);
      tech
        .querySelector('.icon')
        .appendChild(Util.createDom('div', { class: 'ogl_required' }, Util.formatNumber(required)))
        .addEventListener('click', (e) => {
          e.stopPropagation();
          fleetDispatcher.selectShip(shipID, required);
          fleetDispatcher.refresh();
        });
    });
  }

  // reverse the ship selection
  addReverse() {
    fleetDispatcher.totalFret = 0;

    fleetDispatcher.shipsOnPlanet.forEach((ship) => {
      fleetDispatcher.totalFret += ship.baseCargoCapacity * ship.number;

      let tech = document.querySelector(`#fleet1 .technology[data-technology="${ship.id}"`);
      tech.querySelector('input').classList.add('ogl_input');
      tech
        .querySelector('.icon')
        .appendChild(Util.createDom('div', { class: 'ogl_delta material-icons' }, 'fiber_smart_record'))
        .addEventListener('click', (e) => {
          e.stopPropagation();
          let delta =
            fleetDispatcher.shipsOnPlanet.find((e) => e.id == ship.id)?.number -
            (fleetDispatcher.findShip(ship.id)?.number || 0);
          fleetDispatcher.selectShip(ship.id, delta);
          fleetDispatcher.refresh();
        });
    });
  }

  // cargo capacity indicator & preload resources
  addCapacity() {
    let container = document.querySelector('#fleet1 .allornonewrap').appendChild(
      Util.createDom('div', {
        class: 'ogl_capacityContainer tooltip',
        title: this.ogl.component.lang.getText('capacityPicker'),
      })
    );
    let dom = container.appendChild(Util.createDom('div', { class: 'ogl_capacityInfo' }));
    let required = dom.appendChild(
      Util.createDom(
        'div',
        { class: 'ogl_capacityRequired' },
        this.ogl.component.lang.getText('required') + ' ' + Util.formatNumber(this.totalOnPlanet)
      )
    );

    let capacityValues = dom.appendChild(Util.createDom('p'));
    let current = dom.appendChild(Util.createDom('div', { class: 'ogl_capacityCurrent' }));
    container.appendChild(Util.createDom('i', { class: 'material-icons' }, 'launch'));
    required.appendChild(Util.createDom('div'));
    required.style.width = Math.min((this.totalOnPlanet / fleetDispatcher.totalFret) * 100, 100) + '%';
    if (this.totalOnPlanet > fleetDispatcher.totalFret) bar.classList.add('ogl_active');

    this.overWriteFleetDispatcher('resetCargo', false, () => {
      let domWidth = (fleetDispatcher.getCargoCapacity() / fleetDispatcher.totalFret) * 100;
      current.style.width = domWidth + '%';
      capacityValues.innerHTML = `<span class="float_right"><b>${Util.formatNumber(
        fleetDispatcher.getCargoCapacity()
      )}</b> / <b>${Util.formatNumber(fleetDispatcher.totalFret)}</b></span>`;
    });

    container.addEventListener('mouseout', () => {
      container.classList.remove('tooltipClose');
    });

    container.addEventListener('click', () => {
      this.ogl.component.tooltip.close(true);
      container.classList.add('tooltipClose');
      this.ogl.component.tooltip.lastSender = container;

      let content = Util.createDom(
        'div',
        { class: 'ogl_preloadResources' },
        `<h2>${this.ogl.component.lang.getText('capacityPicker')}</h2>`
      );
      let inputList = {};
      ['metal', 'crystal', 'deut'].forEach((res) => {
        let icon = content.appendChild(
          Util.createDom('div', { class: `ogl_shipIcon ogl_${res} material-icons` }, 'double_arrow')
        );
        icon.addEventListener('click', () => {
          let attr = res == 'metal' ? 'metalOnPlanet' : res == 'crystal' ? 'crystalOnPlanet' : 'deuteriumOnPlanet';
          inputList[res].value = fleetDispatcher[attr];
        });

        inputList[res] = content.appendChild(Util.createDom('input', { type: 'text', class: 'ogl_input' }, '0'));
        inputList[res].addEventListener('keydown', (e) => {
          if (e.keyCode === 13) {
            this.fleet1Pressed = true;
            content.querySelectorAll('button')[1].click();
          }
        });
      });
      setTimeout(() => inputList.metal.focus(), 100);

      let actions = content.appendChild(Util.createDom('div'));

      actions.appendChild(Util.createDom('button', { class: 'ogl_button' }, 'Max.')).addEventListener('click', () => {
        inputList.metal.value = fleetDispatcher.metalOnPlanet;
        inputList.crystal.value = fleetDispatcher.crystalOnPlanet;
        inputList.deut.value = fleetDispatcher.deuteriumOnPlanet;

        fleetDispatcher.refresh();
      });

      actions.appendChild(Util.createDom('button', { class: 'ogl_button' }, 'OK')).addEventListener('click', () => {
        fleetDispatcher.cargoMetal = 0;
        fleetDispatcher.cargoCrystal = 0;
        fleetDispatcher.cargoDeuterium = 0;
        fleetDispatcher.refresh();

        let total =
          parseInt(inputList.metal.value?.replace(/\D/g, '') || 0) +
          parseInt(inputList.crystal.value?.replace(/\D/g, '') || 0) +
          parseInt(inputList.deut.value?.replace(/\D/g, '') || 0);
        let required = this.calcRequiredShips(this.ogl.db.options.defaultShip, total);

        (async () => {
          await fleetDispatcher.selectShip(this.ogl.db.options.defaultShip, required);
          fleetDispatcher.cargoMetal = Math.min(
            parseInt(inputList.metal.value?.replace(/\D/g, '') || 0),
            fleetDispatcher.metalOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.cargoCrystal = Math.min(
            parseInt(inputList.crystal.value?.replace(/\D/g, '') || 0),
            fleetDispatcher.crystalOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.cargoDeuterium = Math.min(
            parseInt(inputList.deut.value?.replace(/\D/g, '') || 0),
            fleetDispatcher.deuteriumOnPlanet,
            fleetDispatcher.getFreeCargoSpace()
          );
          fleetDispatcher.refresh();

          this.ogl.component.tooltip.close(true);

          container.classList.remove('tooltipClose');
        })();
      });

      this.ogl.component.tooltip.update(container, content);
    });
  }

  // collect resources when the harvest button has been clicked
  collectResources() {
    let required = this.calcRequiredShips(this.ogl.db.options.defaultShip);
    fleetDispatcher.selectShip(this.ogl.db.options.defaultShip, required);

    if (this.ogl.mode == 4) {
      fleetDispatcher.targetPlanet.type = fleetDispatcher.targetPlanet.type == 3 ? 1 : 3;
    }

    fleetDispatcher.refresh();

    this.overWriteFleetDispatcher('submitFleet2', () => localStorage.setItem('ogl-redirect', this.ogl.nextLink));
  }

  checkFleetMovement() {
    if (this.ogl.page == 'movement') {
      // update back timer
      /*let updateBackTimer = (parent, time, offset) =>
            {
                let newTime = new Date(`${time[4]}-${time[3]}-${time[2]}T${time[5]}:${time[6]}:${time[7]}`).getTime();
                newTime = new Date((newTime - Math.round(timeDiff / 100000) * 100000) + offset * 2);

                parent.setAttribute('data-servertime', newTime.getTime());
                parent.setAttribute('data-datezone', `${newTime.toLocaleDateString('fr-FR').replace(/\//g, '.')} `);
                parent.setAttribute('data-timezone', ` ${newTime.toLocaleTimeString('fr-FR')}`);
            }*/

      // add back timer
      document.querySelectorAll('.reversal a').forEach((button, index) => {
        setTimeout(() => {
          let time = button.getAttribute('data-tooltip') || button.getAttribute('title');
          time = time.replace('<br>', ' ');
          time = time.replace(/ \.$/, '');
          time = time.trim().replace(/[ \.]/g, ':');
          time = time.split(':');

          let initialTime = Date.now();
          time = new Date(`${time[4]}-${time[3]}-${time[2]}T${time[5]}:${time[6]}:${time[7]}`).getTime();

          let domElement = button
            .closest('.fleetDetails')
            .appendChild(Util.createDom('div', { class: 'ogl_fulldate ogl_hiddenContent ogl_timeZone ogl_backTimer' }));

          setInterval(() => {
            const deltaTime = Date.now() - initialTime;
            const newTime = new Date(time + timeDelta - Math.round(timeDiff / 100000) * 100000 + deltaTime * 2);

            domElement.setAttribute('data-servertime', newTime.getTime());
            domElement.setAttribute('data-datezone', `${newTime.toLocaleDateString('fr-FR').replace(/\//g, '.')} `);
            domElement.setAttribute('data-timezone', ` ${newTime.toLocaleTimeString('fr-FR')}`);
          }, 500);
        }, index * 5);
      });

      // replace default mouvement menu
      document.querySelectorAll('.starStreak .route').forEach((movement) => {
        let id = '#' + movement.querySelector('a').getAttribute('rel');
        let div = document.querySelector(id);
        let container = movement
          .closest('.fleetDetails')
          .appendChild(Util.createDom('div', { class: 'ogl_shipDetail' }));

        movement.querySelector('a').classList.add('ogl_inFlight');

        div.querySelectorAll('.fleetinfo tr').forEach((line, index) => {
          if (line.querySelector('td')) {
            let shipLine = Util.createDom('div', { class: 'ogl_movementItem' });
            let shipID =
              Util.findObjectByValue(this.ogl.db.loca, line.querySelector('td').textContent.replace(':', '')) ||
              (Object.entries(this.ogl.db.ships).find(
                (e) => e[1].name == line.querySelector('td').textContent.replace(':', '')
              ) || [false])[0] ||
              -1;

            if (shipID == 'metal') container.prepend(shipLine);
            else if (shipID == 'crystal')
              container.insertBefore(shipLine, container.querySelectorAll('.ogl_movementItem')[1]);
            else if (shipID == 'deut')
              container.insertBefore(shipLine, container.querySelectorAll('.ogl_movementItem')[2]);
            else if (shipID == -1) container.prepend(shipLine);
            else container.appendChild(shipLine);

            let shipNumber = line.querySelector('td.value') ? line.querySelector('td.value').textContent : '0';
            if (shipID && shipID != -1) {
              shipLine.appendChild(Util.createDom('div', { class: 'ogl_shipIcon ogl_' + shipID }));
              shipLine.appendChild(
                Util.createDom(
                  'span',
                  { class: 'ogl_' + shipID },
                  Util.formatToUnits(Util.formatNumber(shipNumber), 0).replace(' ', '')
                )
              );
            }
          }
        });
      });
    }
  }

  calcRequiredShips(shipID, resources) {
    resources = resources ?? this.totalOnPlanet;
    return Math.ceil(resources / this.ogl.db.ships[shipID].capacity);
  }

  sendSpyProbe(coords, count, sender, noPopup, callback) {
    this.spyQueue = this.spyQueue || [];
    this.spyQueue.push({ coords: coords, count: count, sender: sender, noPopup: noPopup, callback: callback });

    sender && sender.classList.add('ogl_loading');
    if (this.spyReady) this.trySendProbes();
  }

  trySendProbes() {
    if (this.spyQueue?.length) {
      let coords = this.spyQueue[0].coords;
      let count = this.spyQueue[0].count;
      let sender = this.spyQueue[0].sender;
      let noPopup = this.spyQueue[0].noPopup;
      let callback = this.spyQueue[0].callback;

      let params = {
        mission: 6,
        galaxy: coords[0],
        system: coords[1],
        position: coords[2],
        type: coords[3],
        shipCount: count,
        token: token,
      };

      let self = this;

      this.spyReady = false;

      $.ajax(miniFleetLink, {
        data: params,
        dataType: 'json',
        type: 'POST',
        success: function (data) {
          if (typeof data.newAjaxToken != 'undefined') {
            token = data.newAjaxToken;
          }

          console.log(data);

          if (sender) {
            sender.classList.remove('ogl_disabled');
            sender.classList.remove('ogl_danger');
          }

          if (!data.response.success && data.response.coordinates)
            fadeBox(
              data.response.message + ' ' + coords[0] + ':' + coords[1] + ':' + coords[2],
              !data.response.success
            );
          if (data.response.coordinates && !noPopup)
            fadeBox(
              data.response.message +
                ' ' +
                data.response.coordinates.galaxy +
                ':' +
                data.response.coordinates.system +
                ':' +
                data.response.coordinates.position,
              !data.response.success
            );

          if (sender && data.response.success) {
            sender.classList.remove('ogl_loading');
            sender.classList.add('ogl_disabled');

            let index = self.ogl.find(self.ogl.db.positions, 'coords', `${coords[0]}:${coords[1]}:${coords[2]}`)[0];
            if (index) {
              coords[3] == 3
                ? (self.ogl.db.positions[index].lastMoonSpy = serverTime.getTime())
                : (self.ogl.db.positions[index].lastSpy = serverTime.getTime());
              self.ogl.save();
            }

            /*if()
                        {
                            console.log(data.reponse.slots)
                        }*/
          } else if (sender && !data.response.success && data.response.coordinates) {
            sender.classList.remove('ogl_loading');
            sender.classList.add('ogl_danger');
          }

          if (callback) callback(data);

          self.spyReady = true;

          if (data.response.coordinates) {
            self.spyQueue.shift();
          }

          self.trySendProbes();
        },
        error: function (error) {
          fadeBox('Error');
          sender.classList.remove('ogl_loading');
          if (sender) sender.classList.add('ogl_danger');

          self.spyReady = true;
          self.trySendProbes();
        },
      });
    }
  }

  expedition(mainShipID) {
    fleetDispatcher.resetShips();
    fleetDispatcher.resetCargo();

    let coords = [
      fleetDispatcher.currentPlanet.galaxy,
      fleetDispatcher.currentPlanet.system,
      fleetDispatcher.currentPlanet.position,
    ];
    let fillerID = 0;
    let maxTotal = 0;
    let minShip = 0;
    let currentStep = 0;
    let minFactor202to203 = 3;
    let minFactor202to219 = 5.75;

    let steps = {
      10000: { 202: 10, max: 40000 },
      100000: { 202: 125, max: 500000 },
      1000000: { 202: 300, max: 1200000 },
      5000000: { 202: 450, max: 1800000 },
      25000000: { 202: 600, max: 2400000 },
      50000000: { 202: 750, max: 3000000 },
      75000000: { 202: 900, max: 3600000 },
      100000000: { 202: 1050, max: 4200000 },
      Infinity: { 202: 1250, max: 5000000 },
    };

    for (const [key, value] of Object.entries(steps)) {
      steps[key][203] = Math.ceil(steps[key][202] / minFactor202to203);
      steps[key][219] = Math.ceil(steps[key][202] / minFactor202to219);

      if (this.ogl.db.topScore[0] < key && !currentStep) currentStep = key;
    }

    maxTotal = steps[currentStep]['max'];
    minShip = steps[currentStep][mainShipID];
    maxTotal = this.ogl.account.class == 3 ? maxTotal * 3 * this.ogl.universe.ecoSpeed : maxTotal * 2;
    let mainAmount = Math.max(minShip, this.calcRequiredShips(mainShipID, maxTotal));

    [218, 213, 211, 215, 207].forEach((shipID) => {
      let count = document.querySelector(`.technology[data-technology="${shipID}"] .amount`).getAttribute('data-value');
      if (fillerID == 0 && count > 0) fillerID = shipID;
    });

    if (this.ogl.db.options.togglesOff.indexOf('bigShip') > -1) fillerID = 0;

    shipsOnPlanet.forEach((ship) => {
      if (ship.id == mainShipID) fleetDispatcher.selectShip(ship.id, mainAmount);
      else if (ship.id == fillerID && mainShipID != fillerID) fleetDispatcher.selectShip(ship.id, 1);
      else if (ship.id == 210) fleetDispatcher.selectShip(ship.id, 1);
      else if (ship.id == 219 && mainShipID != 219) fleetDispatcher.selectShip(ship.id, 1);
    });

    fleetDispatcher.targetPlanet.galaxy = coords[0];
    fleetDispatcher.targetPlanet.system = coords[1];
    fleetDispatcher.targetPlanet.position = 16;
    fleetDispatcher.targetPlanet.type = 1;
    fleetDispatcher.targetPlanet.name = 'Expedition';
    fleetDispatcher.mission = 15;
    fleetDispatcher.expeditionTime = 1;
    fleetDispatcher.refresh();

    //setTimeout(() => document.querySelector('#continueToFleet2').focus(), 100);
  }
}

export default FleetManager;
