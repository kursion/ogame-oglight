import Util from '../util.js';

class EmpireManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.addTimers();

    this.resSum = Util.createDom('div', { class: 'ogl_resourcesSum' });
    this.resSum.appendChild(Util.createDom('div', { class: 'ogl_loader' }));
    (document.querySelector('#cutty') || document.querySelector('#norm'))
      .querySelector('#myPlanets, #myWorlds')
      .after(this.resSum);

    if (!this.ogl.prevLink)
      this.ogl.prevLink =
        this.ogl.current.type == 'moon'
          ? this.ogl.prev.smallplanetWithMoon.querySelector('.moonlink')?.getAttribute('href') ||
            this.ogl.prev.smallplanet.querySelector('.planetlink')?.getAttribute('href')
          : this.ogl.prev.smallplanet.querySelector('.planetlink')?.getAttribute('href');
    if (!this.ogl.nextLink)
      this.ogl.nextLink =
        this.ogl.current.type == 'moon'
          ? this.ogl.next.smallplanetWithMoon.querySelector('.moonlink')?.getAttribute('href') ||
            this.ogl.next.smallplanet.querySelector('.planetlink')?.getAttribute('href')
          : this.ogl.next.smallplanet.querySelector('.planetlink')?.getAttribute('href');

    this.myPlanets = {};
    this.total = [0, 0, 0];
    this.onPlanet = [0, 0, 0];
    this.prod = [0, 0, 0];
    this.locked = [0, 0, 0];

    let isGroup = false;
    let lastCoords,
      countGroup = 0;

    document.querySelectorAll('.smallplanet').forEach((p) => {
      let coords = p.querySelector('.planetlink .planet-koords').textContent.slice(1, -1).split(':');

      if (lastCoords == coords[0] + ':' + coords[1]) {
        p.setAttribute('data-multi', countGroup);
        isGroup = true;
      } else {
        if (isGroup) countGroup++;
        isGroup = false;
      }

      lastCoords = coords[0] + ':' + coords[1];
    });

    this.ogl.observeMutation(() => this.reloadEventbox(), 'eventbox');

    new Promise((resolve) => {
      resolve(this.checkPlanetResources());
    }).then(() => {
      this.checkLockedTechs();
      this.checkStorage();
      this.checkMovement();
      this.addStats();
      this.checkCrawlers();
    });

    //this.checkPlanetResources();
    //this.checkLockedTechs();
    //this.checkStorage();
    //this.checkMovement();
    //this.addStats();
    //this.checkCrawlers();

    setTimeout(() => this.getEmpireData(), 200);
  }

  // add planet "last refresh" timer
  addTimers() {
    if (this.ogl.db.options.togglesOff.indexOf('timers') > -1) return;

    let now = serverTime.getTime();
    let currentCoords = this.ogl.current.coords.join(':');

    if (!this.ogl.db.myActivities[currentCoords]) this.ogl.db.myActivities[currentCoords] = [0, 0];

    let planetActivity = this.ogl.db.myActivities[currentCoords][0];
    let moonActivity = this.ogl.db.myActivities[currentCoords][1];

    if (this.ogl.current.type == 'moon') moonActivity = now;
    else planetActivity = now;

    this.ogl.db.myActivities[currentCoords] = [planetActivity, moonActivity];

    document.querySelectorAll('.smallplanet').forEach((planet) => {
      let coords = planet.querySelector('.planet-koords').textContent.slice(1, -1);
      let timers = this.ogl.db.myActivities[coords] || [0, 0];

      let pt = Math.min(Math.round((now - timers[0]) / 60000), 60);
      let pTimer = planet.querySelector('.planetlink').appendChild(
        Util.createDom('div', {
          class: 'ogl_timer ogl_medium ogl_short',
          title: this.ogl.component.lang.getText('timerInfo'),
          'data-timer': pt,
        })
      );

      this.updateTimer(pTimer, timers[0]);
      setInterval(() => this.updateTimer(pTimer, timers[0]), 20000);

      if (planet.querySelector('.moonlink')) {
        let mt = Math.min(Math.round((now - timers[1]) / 60000), 60);
        let mTimer = planet.querySelector('.moonlink').appendChild(
          Util.createDom('div', {
            class: 'ogl_timer ogl_medium ogl_short',
            title: this.ogl.component.lang.getText('timerInfo'),
            'data-timer': mt,
          })
        );

        this.updateTimer(mTimer, timers[1]);
        setInterval(() => this.updateTimer(mTimer, timers[1]), 20000);
      }
    });
  }

  updateTimer(element, timer) {
    let time = Math.min(Math.round((serverTime.getTime() - timer) / 60000), 60);

    if (time >= 15) element.classList.remove('ogl_short');
    if (time >= 30) element.classList.remove('ogl_medium');
    if (time >= 60) return;

    element.setAttribute('data-timer', time);
    element.title = time;
  }

  checkPlanetResources() {
    let coords = this.ogl.current.coords.join(':');
    if (this.ogl.current.type == 'moon') coords += ':M';

    this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || {};
    this.ogl.db.me.planets[coords].resources = this.ogl.db.me.planets[coords].resources || {};
    this.ogl.db.me.planets[coords].resources.metal = this.ogl.current.metal;
    this.ogl.db.me.planets[coords].resources.crystal = this.ogl.current.crystal;
    this.ogl.db.me.planets[coords].resources.deut = this.ogl.current.deut;

    // this.ogl.saveAsync();
  }

  checkMovement() {
    Util.getXML(
      `https://${window.location.host}/game/index.php?page=componentOnly&component=eventList&ajax=1`,
      (result) => {
        let idList = [];
        let resName = ['metal', 'crystal', 'deut'];

        result.querySelectorAll('.eventFleet').forEach((line) => {
          let id = line.getAttribute('id').replace('eventRow-', '');
          let mission = line.getAttribute('data-mission-type');
          let back = line.getAttribute('data-return-flight') == 'false' ? false : true;

          if ((mission == '1' || mission == '6') && !back) {
            // ennemy attacks and spies
            let target = line.querySelector('.destCoords').textContent.trim().slice(1, -1);
            if (document.querySelector(`.smallplanet[data-coords="${target}"]`)) {
              if (line.querySelector('.destFleet figure.moon')) target += ':M';

              this.myPlanets[target] = this.myPlanets[target] || {};
              this.myPlanets[target].resFlight = this.myPlanets[target].resFlight || [0, 0, 0];
              this.myPlanets[target].ships = this.myPlanets[target].ships || {};

              if (mission == '1') this.myPlanets[target].isAttacked = true;
              else if (mission == '6') this.myPlanets[target].isSpied = true;

              let tempElem = Util.createDom(
                'div',
                {},
                (
                  line.querySelector('.icon_movement .tooltip') || line.querySelector('.icon_movement_reserve .tooltip')
                ).getAttribute('title')
              );
              tempElem.querySelectorAll('.fleetinfo tr').forEach((subline) => {
                if (subline.textContent.trim() == '') subline.classList.add('ogl_hidden');
                else if (!subline.querySelector('td')) subline.classList.add('ogl_full');
                else {
                  let name = subline.querySelector('td').textContent.replace(':', '');
                  let id = (Object.entries(this.ogl.db.ships).find((e) => e[1].name == name) || [false])[0];
                  if (id && id > -1 && subline.querySelector('.value')) {
                    this.myPlanets[target].ships[id] =
                      (this.myPlanets[target].ships[id] || 0) +
                      Util.formatFromUnits(subline.querySelector('.value').textContent);
                  }
                }
              });
            }
          }

          if (
            (mission == '1' && back) || // attack
            mission == '3' || // transpo
            mission == '4' || // deploy
            (mission == '7' && back) || // colo
            (mission == '8' && back) || // harvest
            (mission == '15' && back)
          ) {
            // expedition
            let target;
            if (idList.indexOf(parseInt(id)) > -1) return;
            if (mission == '3' && !back) idList.push(parseInt(id) + 1);

            if (!back) target = line.querySelector('.destCoords').textContent.trim().slice(1, -1);
            else target = line.querySelector('.coordsOrigin').textContent.trim().slice(1, -1);

            if (document.querySelector(`.smallplanet[data-coords="${target}"]`)) {
              if (
                (!back && line.querySelector('.destFleet figure.moon')) ||
                (back && line.querySelector('.originFleet figure.moon'))
              ) {
                target += ':M';
              }

              this.myPlanets[target] = this.myPlanets[target] || {};
              this.myPlanets[target].resFlight = this.myPlanets[target].resFlight || [0, 0, 0];
              this.myPlanets[target].ships = this.myPlanets[target].ships || {};

              let tempElem = Util.createDom(
                'div',
                {},
                (
                  line.querySelector('.icon_movement .tooltip') || line.querySelector('.icon_movement_reserve .tooltip')
                ).getAttribute('title')
              );
              if (tempElem.querySelectorAll('th').length > 1) {
                let trLen = tempElem.querySelectorAll('tr').length;

                for (let i = 0; i < 3; i++) {
                  let res = parseInt(
                    tempElem
                      .querySelectorAll('tr')
                      [trLen - 3 + i].querySelector('.value')
                      .textContent.replace(/\./g, '')
                  );
                  this.myPlanets[target].resFlight[i] += res;
                  this.ogl.account.totalResources[i] += parseInt(res);
                  this.total[i] += res;
                }
              }

              tempElem.querySelectorAll('.fleetinfo tr').forEach((subline) => {
                if (subline.textContent.trim() == '') subline.classList.add('ogl_hidden');
                else if (!subline.querySelector('td')) subline.classList.add('ogl_full');
                else {
                  let name = subline.querySelector('td').textContent.replace(':', '');
                  let id = (Object.entries(this.ogl.db.ships).find((e) => e[1].name == name) || [false])[0];
                  if (id && id > -1 && subline.querySelector('.value')) {
                    this.myPlanets[target].ships[id] =
                      (this.myPlanets[target].ships[id] || 0) +
                      Util.formatFromUnits(subline.querySelector('.value').textContent);
                  }
                }
              });
            }
          }
        });

        Object.entries(this.myPlanets).forEach((entry) => {
          let content = Util.createDom('table', { class: 'ogl_inFlightTable' });
          Object.entries(entry[1].ships).forEach((ship) => {
            let tr = content.appendChild(Util.createDom('tr'));
            tr.appendChild(Util.createDom('td', { class: `ogl_shipIcon ogl_${ship[0]}` }));
            tr.appendChild(Util.createDom('td', { class: 'value' }, Util.formatToUnits(ship[1])));
          });

          content.appendChild(Util.createDom('tr', { class: 'ogl_full' }));

          Object.entries(entry[1].resFlight).forEach((res) => {
            let tr = content.appendChild(Util.createDom('tr', { class: `ogl_${resName[res[0]]}` }));
            tr.appendChild(Util.createDom('td', { class: `ogl_shipIcon ogl_${resName[res[0]]}` }));
            tr.appendChild(Util.createDom('td', { class: `value` }, Util.formatToUnits(res[1] || '0')));
          });

          let link = entry[0].indexOf(':M') > -1 ? 'moonlink' : 'planetlink';

          let icon = document.querySelector(`.smallplanet[data-coords="${entry[0].replace(':M', '')}"]`).appendChild(
            Util.createDom('div', {
              class: `tooltipLeft ogl_inFlight ${entry[0].indexOf(':M') > 1 ? 'ogl_moonFleet' : 'ogl_planetFleet'}`,
              title: 'loading...',
            })
          );
          if (entry[1].resFlight.reduce((previousValue, currentValue) => previousValue + currentValue) > 0)
            icon.classList.add('ogl_active');

          if (entry[1].isAttacked) icon.classList.add('ogl_danger');
          else if (entry[1].isSpied) icon.classList.add('ogl_warning');

          if (
            document.querySelector(`.smallplanet[data-coords="${entry[0].replace(':M', '')}"] .alert`) &&
            (entry[1].isAttacked || entry[1].isSpied)
          ) {
            document.querySelector(`.smallplanet[data-coords="${entry[0].replace(':M', '')}"] .alert`).remove();
          }

          icon.addEventListener('mouseenter', () => {
            this.ogl.component.tooltip.update(icon, content);
          });
        });

        document.querySelectorAll('.smallplanet').forEach((planet) => {
          let resName = ['metal', 'crystal', 'deut'];
          let coords = planet.querySelector('.planet-koords').textContent.slice(1, -1);

          for (let i = 0; i < 3; i++) {
            this.total[i] +=
              parseInt(planet.querySelector(`.ogl_stock .ogl_${resName[i]}`).getAttribute('data-value')) || 0;
            this.total[i] += this.ogl.db.me.planets[coords + ':M']?.resources[resName[i]] || 0;

            this.onPlanet[i] +=
              parseInt(planet.querySelector(`.ogl_stock .ogl_${resName[i]}`).getAttribute('data-value')) || 0;
            this.onPlanet[i] += this.ogl.db.me.planets[coords + ':M']?.resources[resName[i]] || 0;

            this.prod[i] += parseFloat(this.ogl.db.me.planets[coords]?.production?.[i]) || 0;

            Object.values(this.ogl.db.lock?.[coords] || {}).forEach((lock) => {
              this.locked[i] += parseFloat(lock?.[resName?.[i]]) || 0;
            });
          }
        });

        this.ogl.account.totalProd = this.prod;

        let displayIndex = 0;

        this.resSum.addEventListener('click', () => {
          displayIndex = displayIndex == 3 ? 0 : displayIndex + 1;
          this.resSum.classList.add('ogl_active');
          selectDisplay();
        });

        let selectDisplay = (index) => {
          let target, icon;

          if (displayIndex == 0) {
            icon = 'functions';
            target = this.total;
          } else if (displayIndex == 1) {
            icon = 'send';
            target = this.ogl.account.totalResources;
          } else if (displayIndex == 2) {
            icon = 'public';
            target = this.onPlanet;
          } else if (displayIndex == 3) {
            icon = 'lock';
            target = this.locked;
          }

          this.resSum.textContent = '';
          this.resSum.appendChild(Util.createDom('i', { class: 'material-icons' }, icon));
          this.resSum.appendChild(Util.createDom('div', { class: 'ogl_metal' }, Util.formatToUnits(target[0]) || '0'));
          this.resSum.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_sub ogl_metal' },
              '+' + Util.formatToUnits(Math.round(this.prod[0] * 24 * 3600), 0) || '+0'
            )
          );
          this.resSum.appendChild(
            Util.createDom('div', { class: 'ogl_crystal' }, Util.formatToUnits(target[1]) || '0')
          );
          this.resSum.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_sub ogl_crystal' },
              '+' + Util.formatToUnits(Math.round(this.prod[1] * 24 * 3600), 0) || '+0'
            )
          );
          this.resSum.appendChild(Util.createDom('div', { class: 'ogl_deut' }, Util.formatToUnits(target[2]) || '0'));
          this.resSum.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_sub ogl_deut' },
              '+' + Util.formatToUnits(Math.round(this.prod[2] * 24 * 3600), 0) || '+0'
            )
          );

          setTimeout(() => this.resSum.classList.remove('ogl_active'), 50);
        };

        selectDisplay();

        // todo
        //console.log(this.ogl.db.me.planets) // res on planet
        //console.log(this.ogl.account.totalResources) // res in flight
        //console.log(this.total) // res total
      }
    );
  }

  addStats(startDate, endDate) {
    if (this.ogl.db.options.togglesOff.indexOf('renta') > -1) return;

    if (this.ogl.db.stats.NaN) delete this.ogl.db.stats.NaN;

    document.querySelector('.ogl_stats')?.remove();

    if (!this.ogl.db.stats.firstEntry) {
      let entry = Object.keys(this.ogl.db.stats).sort()[0];
      if (!isNaN(entry)) this.ogl.db.stats.firstEntry = entry;
    }

    for (const [key, value] of Object.entries(this.ogl.db.stats)) {
      if (Date.now() - key > 31 * 24 * 60 * 60 * 1000) {
        delete this.ogl.db.stats[key];
      }
    }

    // this.ogl.saveAsync();

    startDate = startDate || Date.now() - this.ogl.db.options.dateFilter * 24 * 60 * 60 * 1000;
    endDate = endDate || Date.now();

    let days = Math.round((endDate - startDate) / 24 / 60 / 60 / 1000);

    let rangeDate = days;

    this.dailiesStats = [];
    let raidOccuences = 0;
    let expeOccurences = 0;

    if (startDate >= 0) {
      for (let i = 0; i < days; i++) {
        let date = new Date(endDate - i * 24 * 60 * 60 * 1000);
        let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
        this.dailiesStats.push(this.ogl.db.stats[midnight] || false);

        raidOccuences += this.ogl.db.stats?.[midnight]?.raidOccuences || 0;
        expeOccurences +=
          this.ogl.db.stats?.[midnight]?.expeOccurences &&
          Object.values(this.ogl.db.stats?.[midnight]?.expeOccurences).length
            ? Object.values(this.ogl.db.stats?.[midnight]?.expeOccurences).reduce((a, b) => a + b)
            : 0;
      }
    } else {
      this.dailiesStats.push(this.ogl.db.stats.total || false);
      raidOccuences += this.ogl.db.stats?.total?.raidOccuences || 0;
      expeOccurences +=
        this.ogl.db.stats?.total?.expeOccurences && Object.values(this.ogl.db.stats?.total?.expeOccurences).length
          ? Object.values(this.ogl.db.stats?.total?.expeOccurences).reduce((a, b) => a + b)
          : 0;

      let now = new Date();
      let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
      rangeDate =
        (midnight - this.ogl.db.stats.firstEntry) / (24 * 60 * 60 * 1000) ||
        Math.ceil((Date.now() - Object.keys(this.ogl.db.stats).sort()[0]) / 24 / 60 / 60 / 1000) + 1 ||
        1;
    }

    let cumul = {};
    let cumulExpe = {};
    let cumulRaid = {};
    let cumulConso = 0;
    let cumulExpeOccurences = {};

    Object.values(this.dailiesStats).map((daily) => {
      [
        'metal',
        'crystal',
        'deut',
        'dm',
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        210,
        211,
        213,
        214,
        215,
        218,
        219,
      ].forEach((id) => {
        cumul[id] = (cumul[id] || 0) + (daily?.raid?.[id] || 0);
        cumul[id] = (cumul[id] || 0) + (daily?.expe?.[id] || 0);

        if (isNaN(id)) cumulRaid[id] = (cumulRaid[id] || 0) + (daily?.raid?.[id] || 0);
        cumulExpe[id] = (cumulExpe[id] || 0) + (daily?.expe?.[id] || 0);

        if (!isNaN(id)) {
          cumul.metal = (cumul.metal || 0) + this.ogl.shipCost[id][0] * (daily.expe?.[id] || 0);
          cumul.crystal = (cumul.crystal || 0) + this.ogl.shipCost[id][1] * (daily.expe?.[id] || 0);
          cumul.deut = (cumul.deut || 0) + this.ogl.shipCost[id][2] * (daily.expe?.[id] || 0);

          cumulExpe.metal = (cumulExpe.metal || 0) + this.ogl.shipCost[id][0] * (daily.expe?.[id] || 0);
          cumulExpe.crystal = (cumulExpe.crystal || 0) + this.ogl.shipCost[id][1] * (daily.expe?.[id] || 0);
          cumulExpe.deut = (cumulExpe.deut || 0) + this.ogl.shipCost[id][2] * (daily.expe?.[id] || 0);
        }
      });

      cumulConso += daily.consumption || 0;

      if (daily.expeOccurences) {
        for (let k of Object.keys(daily.expeOccurences)) {
          cumulExpeOccurences[k] = (cumulExpeOccurences[k] || 0) + (daily?.expeOccurences?.[k] || 0);
        }
      }
    });

    if (this.ogl.db.options.togglesOff.indexOf('ignoreConsumption') == -1) cumulConso = 0;

    let dom = document.querySelector('#links').appendChild(Util.createDom('div', { class: 'ogl_stats' }));
    ['metal', 'crystal', 'deut', 'dm'].forEach((res) => {
      let line = dom.appendChild(Util.createDom('div'));
      line.appendChild(Util.createDom('div', { class: `ogl_shipIcon ogl_${res}` }));
      line.appendChild(
        Util.createDom(
          'div',
          { class: `number ogl_${res}` },
          Util.formatToUnits((res == 'deut' ? cumul[res] + cumulConso : cumul[res]) || '0')
        )
      );
    });

    dom.appendChild(
      Util.createDom('div', { class: 'ogl_labelLimit' }, rangeDate + LocalizationStrings.timeunits.short.day)
    );

    let more = dom.appendChild(
      Util.createDom(
        'button',
        {
          class: 'ogl_button material-icons tooltip ogl_moreStats',
          title: this.ogl.component.lang.getText('moreStats'),
        },
        'launch'
      )
    );
    more.addEventListener('click', () => {
      this.ogl.component.popup.load();

      let container = Util.createDom('div', { class: 'ogl_statsDetails' });
      let dateArea = container.appendChild(Util.createDom('div', { class: 'ogl_dateArea' }));
      let mainArea = container.appendChild(Util.createDom('div', { class: 'ogl_mainArea' }));

      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      let currentDay = today.getDate();
      let prevMonthLength = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
      let monthLength = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      let total = 0;

      let filterDiv = dateArea.appendChild(Util.createDom('div'));
      [1, 7, 14, 30, 40000].forEach((filter) => {
        let button = filterDiv.appendChild(
          Util.createDom(
            'div',
            { class: 'ogl_button' },
            filter
              .toString()
              .replace(/^1$/, 'today')
              .replace(/^7$/, '7d')
              .replace(/^14$/, '14d')
              .replace(/^30$/, '30d')
              .replace('40000', 'all')
          )
        );
        if (this.ogl.db.options.dateFilter == filter) button.classList.add('ogl_active');
        button.addEventListener('click', () => {
          this.ogl.db.options.dateFilter = filter;
          this.addStats(Date.now() - filter * 24 * 60 * 60 * 1000, Date.now());
          document.querySelector('.ogl_stats .ogl_moreStats').click();
          // this.ogl.saveAsync();
        });
      });

      let dayDiv = dateArea.appendChild(Util.createDom('div', { class: 'ogl_hidden' }));
      for (let i = currentDay; i > currentDay - 31; i--) {
        let timestamp = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i, 0, 0, 0).getTime();
        let dateDiff = today.getDate() - i;
        let btn = Util.createDom('div', { class: 'ogl_button' }, i > 0 ? i : prevMonthLength + i);
        dayDiv.prepend(btn);

        if (timestamp === today.getTime()) btn.classList.add('ogl_today');
        if (timestamp >= startDate && timestamp < endDate) btn.classList.add('ogl_active');

        if (this.ogl.db.stats[timestamp]) {
          let raids = Object.keys(this.ogl.db.stats?.[timestamp]?.raid || {}).length
            ? Object.values(this.ogl.db.stats?.[timestamp]?.raid || { a: 0 }).reduce((a, b) => a + b)
            : 0;
          let expes = Object.keys(this.ogl.db.stats?.[timestamp]?.expe || {}).length
            ? Object.values(this.ogl.db.stats?.[timestamp]?.expe || { a: 0 }).reduce((a, b) => a + b)
            : 0;
          total = raids + expes;
        }

        if (total == 0) btn.classList.add('ogl_disabled');

        btn.addEventListener('click', () => {
          this.addStats(Date.now() - (dateDiff + 1) * 24 * 60 * 60 * 1000, Date.now() - dateDiff * 24 * 60 * 60 * 1000);
          document.querySelector('.ogl_stats .ogl_moreStats').click();
        });
      }

      if (this.daysOpen) dayDiv.classList.remove('ogl_hidden');

      let plusBtn = filterDiv.appendChild(Util.createDom('div', { class: 'ogl_button' }, '+'));
      plusBtn.addEventListener('click', () => {
        dayDiv.classList.toggle('ogl_hidden');
        this.daysOpen = !dayDiv.classList.contains('ogl_hidden');
      });

      let recap = mainArea.appendChild(
        Util.createDom('div', {
          class: 'ogl_statsRecap tooltip',
          title: Util.formatToUnits(cumul.metal + cumul.crystal + cumul.deut),
        })
      );
      ['metal', 'crystal', 'deut', 'dm'].forEach((res) => {
        let div = recap.appendChild(Util.createDom('div', {}, Util.formatToUnits(cumul[res])));
        if (res == 'deut' && cumulConso) div.appendChild(Util.createDom('div', {}, Util.formatToUnits(cumulConso)));
      });

      let tables = mainArea.appendChild(Util.createDom('div', { class: 'ogl_statsTables' }));
      let firstCol = tables.appendChild(Util.createDom('span', { class: 'ogl_statsColumn' }));

      let chartArea = firstCol.appendChild(Util.createDom('span', { class: 'ogl_chartArea' }));
      let chart = chartArea.appendChild(Util.createDom('span', { class: 'ogl_pie' }));
      let labels = chartArea.appendChild(Util.createDom('span', { class: 'ogl_pieLabel' }));
      let dataSum = Object.values(cumulExpeOccurences).reduce((a, b) => (b > 0 ? a + b : a + 0), 0);
      let pieStats = Object.entries(cumulExpeOccurences)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map((x) => (1 / (dataSum / x[1])) * 100);
      let gradient = '';
      let sum = 0;
      //let colors = ['var(--yellow)', 'var(--dm)', '#577af9', 'var(--red)', 'var(--green)', '#926042', 'gray'];
      let colors = ['#e64a19', '#19bd9b', '#f9a825', '#64648b', '#c52b51', '#05abc3', '#c5ced3'];

      pieStats.forEach((v, index) => {
        gradient += `${colors[index]} ${Math.max(sum, 0) || 0}%, ${colors[index]} ${Math.max(sum + v, 0) || 0}%, `;
        sum += v;

        if (index == pieStats.length - 1 && (isNaN(sum) || sum < 0)) gradient = '';
      });

      chart.style.background = `conic-gradient(${gradient}#000)`;

      Object.entries(cumulExpeOccurences)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach((e, index) => {
          if (e[0] == 'none') e[0] = 'other';

          let label = labels.appendChild(
            Util.createDom(
              'span',
              {},
              `<span>${this.ogl.component.lang.getText(e[0])}</span><span>${Util.formatToUnits(
                Math.max(0, e[1])
              )}</span><b>${Math.max(0, pieStats[index].toFixed(2)) || 0}%</b>`
            )
          );
          label.prepend(Util.createDom('span', { style: 'background:' + colors[index] }));
        });

      let expeArea = firstCol.appendChild(Util.createDom('div'));
      for (const [key, value] of Object.entries(cumulExpe)) {
        if (!isNaN(key)) {
          let entry = expeArea.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_statsItem' },
              `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(value)}</div>`
            )
          );
          if (value < 0) entry.classList.add('ogl_danger');
        }
      }

      expeArea.appendChild(
        Util.createDom(
          'h3',
          {},
          `Expe (<u class="tooltip" title="ø ${Util.formatToUnits(
            Math.round((cumulExpe.metal + cumulExpe.crystal + cumulExpe.deut) / expeOccurences)
          )} | Σ ${Util.formatToUnits(
            Math.round(cumulExpe.metal + cumulExpe.crystal + cumulExpe.deut)
          )}">${Util.formatNumber(expeOccurences)}</u>) (+ ships)`
        )
      );
      for (const [key, value] of Object.entries(cumulExpe)) {
        if (isNaN(key)) {
          let entry = expeArea.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_statsItem' },
              `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(value)}</div>`
            )
          );
          if (value < 0) entry.classList.add('ogl_danger');
        }
      }

      let raidArea = firstCol.appendChild(Util.createDom('div'));
      raidArea.appendChild(
        Util.createDom(
          'h3',
          {},
          `Raid (<u class="tooltip" title="ø ${Util.formatToUnits(
            Math.round((cumulRaid.metal + cumulRaid.crystal + cumulRaid.deut) / raidOccuences)
          )} | Σ ${Util.formatToUnits(
            Math.round(cumulRaid.metal + cumulRaid.crystal + cumulRaid.deut)
          )}">${Util.formatNumber(raidOccuences)}</u>)`
        )
      );
      for (const [key, value] of Object.entries(cumulRaid)) {
        raidArea.appendChild(
          Util.createDom(
            'div',
            { class: 'ogl_statsItem' },
            `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(value)}</div>`
          )
        );
      }

      raidArea.appendChild(Util.createDom('h3', {}, 'ø / day'));
      for (const [key, value] of Object.entries(cumul)) {
        if (isNaN(key))
          raidArea.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_statsItem' },
              `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(
                Math.round(value / rangeDate)
              )}</div>`
            )
          );
      }

      raidArea.appendChild(Util.createDom('h3', {}, 'ø + prod  / day'));
      for (const [key, value] of Object.entries(cumul)) {
        let resIndex = key == 'metal' ? '0' : key == 'crystal' ? '1' : '2';
        let totalRes = parseInt(this.ogl.account.totalProd[resIndex]);

        if (key == 'dm')
          raidArea.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_statsItem' },
              `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(
                Math.round(value / rangeDate)
              )}</div>`
            )
          );
        else if (isNaN(key))
          raidArea.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_statsItem' },
              `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(
                Math.round(parseFloat(value) / rangeDate) + totalRes * 24 * 3600
              )}</div>`
            )
          );
      }

      /*
            let dateArea = container.appendChild(Util.createDom('div', {'class':'ogl_dateArea'}));
            let statsContainer = container.appendChild(Util.createDom('div'));
            let lastColContainer = container.appendChild(Util.createDom('div'));

            statsContainer.appendChild(Util.createDom('h3', {}, `Expeditions (${expeOccurences})`));
            let expeArea = statsContainer.appendChild(Util.createDom('div', {'class':'ogl_statsArea'}, ''));

            let raidDiv = lastColContainer.appendChild(Util.createDom('div'));
            raidDiv.appendChild(Util.createDom('h3', {}, `Raids (${raidOccuences})`));
            let raidArea = raidDiv.appendChild(Util.createDom('div', {'class':'ogl_statsArea'}, '<div></div>'));

            let totalDiv = lastColContainer.appendChild(Util.createDom('div'));
            totalDiv.appendChild(Util.createDom('h3', {}, `Total`));
            let totalArea = totalDiv.appendChild(Util.createDom('div', {'class':'ogl_statsArea'}, '<div></div>'));

            let ratioDiv = lastColContainer.appendChild(Util.createDom('div'));
            ratioDiv.appendChild(Util.createDom('h3', {}, `ø ${rangeDate} days`));
            let totalRatioArea = ratioDiv.appendChild(Util.createDom('div', {'class':'ogl_statsArea'}, '<div></div>'));

            let prodDiv = lastColContainer.appendChild(Util.createDom('div'));
            prodDiv.appendChild(Util.createDom('h3', {}, `ø ${rangeDate} days + prod`));
            let totalRatioProdArea = prodDiv.appendChild(Util.createDom('div', {'class':'ogl_statsArea'}, '<div></div>'));

            let calendar = this.addCalendar(startDate, endDate);
            dateArea.appendChild(calendar);
            let filterArea = dateArea.appendChild(Util.createDom('div', {'class':'ogl_dateFilters'}));
            filterArea.appendChild(Util.createDom('div', {'class':'material-icons'}, 'filter_alt'));

            [1, 7, 14, 30, 40000].forEach(filter =>
            {
                let button = filterArea.appendChild(Util.createDom('div', {}, filter.toString().replace(/^1$/, 'today').replace(/^7$/, '7d').replace(/^14$/, '14d').replace(/^30$/, '30d').replace('40000', 'all')));
                if(this.ogl.db.options.dateFilter == filter) button.classList.add('ogl_active');
                button.addEventListener('click', () =>
                {
                    this.ogl.db.options.dateFilter = filter;
                    this.addStats(Date.now() - filter * 24 * 60 * 60 * 1000, Date.now());
                    document.querySelector('.ogl_stats .ogl_moreStats').click();
                    this.ogl.save();
                });
            });

            if(expeOccurences)
            {
                // chart
                let chartArea = expeArea.appendChild(Util.createDom('span', {'class':'ogl_chartArea'}));
                let chart = chartArea.appendChild(Util.createDom('span', {'class':'ogl_pie'}));
                let labels = chartArea.appendChild(Util.createDom('span', {'class':'ogl_pieLabel'}))
                let dataSum = Object.values(cumulExpeOccurences).reduce((a,b) => b>0 ? a+b : a+0, 0);
                let pieStats = Object.values(cumulExpeOccurences).map(x => (1 / (dataSum / x) * 100));
                let gradient = '';
                let sum = 0;
                let colors = ['var(--yellow)', 'var(--dm)', '#577af9', 'var(--red)', 'var(--green)', '#926042', 'gray'];

                pieStats.forEach((v, index) =>
                {
                    gradient += `${colors[index]} ${Math.max(sum, 0)||0}%, ${colors[index]} ${Math.max(sum + v/2, 0)||0}%, `;
                    sum += v/2;

                    if(index == pieStats.length-1 && (isNaN(sum) || sum < 0)) gradient = '';
                });

                chart.style.background = `conic-gradient(${gradient}#000)`;

                Object.entries(cumulExpeOccurences).forEach((e, index) =>
                {
                    if(e[0] == 'none') e[0] = 'other';

                    let label = labels.appendChild(Util.createDom('span', {}, `<span>${this.ogl.component.lang.getText(e[0])}</span><span>${Util.formatToUnits(Math.max(0, e[1]))}</span><b>${Math.max(0, pieStats[index].toFixed(2)) || 0}%</b>`));
                    label.prepend(Util.createDom('span', {'style':'background:'+colors[index]}));
                });
            }

            expeArea.appendChild(Util.createDom('div'));

            // result table
            for (const [key, value] of Object.entries(cumulExpe))
            {
                let entry = expeArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(value)}</div>`));
                if(isNaN(key)) entry.classList.add('ogl_newLine');
                if(value < 0) entry.classList.add('ogl_danger');
            }

            for (const [key, value] of Object.entries(cumulRaid))
            {
                raidArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(value)}</div>`));
            }

            if(this.ogl.db.options.togglesOff.indexOf('ignoreConsumption') > -1)
            {
                for (const [key, value] of Object.entries(cumul))
                {
                    if(key == 'deut') totalArea.querySelector('div').appendChild(Util.createDom('div', {'class':'tooltip', 'title':this.ogl.component.lang.getText('conso')}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(cumulConso, 0)}</div>`));
                    else if(isNaN(key)) totalArea.querySelector('div').appendChild(Util.createDom('div', {'class':'ogl_invisible'}, `<div class="ogl_${key}"></div><div class="ogl_${key}"></div>`));
                }
            }

            for (const [key, value] of Object.entries(cumul))
            {
                if(isNaN(key))
                {
                    totalArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${Util.formatToUnits(key == 'deut' ? value+cumulConso : value)}<div>`));
                }
            }

            for (const [key, value] of Object.entries(cumul))
            {
                if(isNaN(key)) totalRatioArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${key == 'deut' ? Util.formatToUnits(Math.round((value+cumulConso)/rangeDate), 0) : Util.formatToUnits(Math.round(value/rangeDate), 0)} /d</div>`));
            }

            for (const [key, value] of Object.entries(cumul))
            {
                let resIndex =  key == 'metal' ? '0' : key == 'crystal' ? '1' : '2';
                let totalRes = parseInt(this.ogl.account.totalProd[resIndex]);

                if(key == 'dm') totalRatioProdArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${key == 'deut' ? Util.formatToUnits(Math.round((value+cumulConso)/rangeDate), 0) : Util.formatToUnits(Math.round(value/rangeDate), 0)} /d</div>`));
                else if(isNaN(key)) totalRatioProdArea.querySelector('div').appendChild(Util.createDom('div', {}, `<div class="ogl_shipIcon ogl_${key}"></div><div class="ogl_${key}">${key == 'deut' ? Util.formatToUnits(Math.round(parseFloat(value+cumulConso)/rangeDate) + totalRes*24*3600, 0) : Util.formatToUnits(Math.round(parseFloat(value)/rangeDate) + totalRes*24*3600)} /d</div>`));
            }
            */

      this.ogl.component.popup.open(container);
    });

    let blackholeButton = dom.appendChild(
      Util.createDom(
        'button',
        { class: 'ogl_button material-icons tooltip', title: this.ogl.component.lang.getText('signalBlackhole') },
        'sentiment_very_dissatisfied'
      )
    );
    blackholeButton.addEventListener('click', () => {
      this.ogl.component.popup.load();

      let date = new Date();
      let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();

      let container = Util.createDom('div', { class: 'ogl_blackHole' });
      [202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 213, 214, 215, 218, 219].forEach((shipID) => {
        let content = container.appendChild(Util.createDom('div'));
        content.appendChild(Util.createDom('div', { class: 'ogl_shipIcon ogl_' + shipID }));
        content.appendChild(Util.createDom('input', { type: 'text', class: 'ogl_checkInput', 'data-ship': shipID }));
      });

      let confirmButton = container.appendChild(Util.createDom('button', { class: 'ogl_button' }, 'OK'));
      confirmButton.addEventListener('click', () => {
        if (confirm('Do you really want to add this black hole ?')) {
          let result = {};
          container.querySelectorAll('input').forEach((input) => {
            let shipID = parseInt(input.getAttribute('data-ship'));
            let amount = parseInt(input.value.replace(/[\,\. ]/g, ''));
            if (!isNaN(shipID) && !isNaN(amount)) result[shipID] = amount;
          });

          this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] || {
            idList: [],
            expe: {},
            raid: {},
            expeOccurences: {},
            raidOccuences: 0,
            consumption: 0,
          };
          this.ogl.db.stats[midnight].expe = this.ogl.db.stats[midnight].expe || {};
          this.ogl.db.stats.total.expe = this.ogl.db.stats.total.expe || {};
          this.ogl.db.stats[midnight].expeOccurences = this.ogl.db.stats[midnight].expeOccurences || {};
          this.ogl.db.stats.total.expeOccurences = this.ogl.db.stats.total.expeOccurences || {};

          for (let [k, v] of Object.entries(result)) {
            this.ogl.db.stats[midnight].expe[k] = (this.ogl.db.stats[midnight].expe?.[k] || 0) - v;
            this.ogl.db.stats.total.expe[k] = (this.ogl.db.stats.total.expe?.[k] || 0) - v;
          }

          this.ogl.db.stats[midnight].expeOccurences.blackhole =
            (this.ogl.db.stats[midnight].expeOccurences?.blackhole || 0) + 1;
          this.ogl.db.stats.total.expeOccurences.blackhole =
            (this.ogl.db.stats.total.expeOccurences?.blackhole || 0) + 1;

          this.addStats();
          this.ogl.component.popup.close();
        }
      });

      this.ogl.component.popup.open(container);
    });
    /*
        let resetButton = dom.appendChild(Util.createDom('button', {'class':'ogl_button material-icons tooltip', 'title':this.ogl.component.lang.getText('eraseData')}, 'delete_forever'));
        resetButton.addEventListener('click', () =>
        {
            if(confirm('Do you want to erase stats data ?'))
            {
                delete this.ogl.db.stats;
                this.ogl.save();
                document.location.reload();
            }
        });
    */
  }

  addCalendar(startDate, endDate) {
    let domElement = Util.createDom('div', { class: 'ogl_calendar' });

    // Liste des jours de la semaine
    let dayList = [];
    for (let i = 0; i < 7; i++) {
      dayList.push(new Date(24 * 60 * 60 * 1000 * (4 + i)).toLocaleString('en-EN', { weekday: 'long' }));
    }

    // Date actuelle
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mois actuel
    let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // On créé le div qui contiendra les jours de notre calendrier
    let content = document.createElement('div');
    domElement.appendChild(content);

    // Création des cellules contenant le jour de la semaine
    for (let i = 0; i < dayList.length; i++) {
      content.appendChild(Util.createDom('span', { class: 'cell day' }, dayList[i].substring(0, 3).toUpperCase()));
    }

    // Création des cellules vides si nécessaire
    for (let i = 1; i < currentMonth.getDay(); i++) {
      content.appendChild(Util.createDom('div', { class: 'cell empty' }));
    }

    // Nombre de jour dans le mois affiché
    let monthLength = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    // Création des cellules contenant les jours du mois affiché
    for (let i = 1; i <= monthLength; i++) {
      let cell = content.appendChild(Util.createDom('span', { class: 'cell' }, i));

      // Timestamp de la cellule
      let timestamp = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i, 0, 0, 0).getTime();

      // Ajoute une classe spéciale pour aujourd'hui
      if (timestamp === today.getTime()) cell.classList.add('ogl_today');
      else if (timestamp > today.getTime()) cell.classList.add('ogl_disabled');

      if (timestamp >= startDate && timestamp < endDate) {
        cell.classList.add('ogl_active');
      }

      if (
        timestamp - 24 * 60 * 60 * 1000 <= startDate &&
        timestamp >= startDate &&
        !content.querySelector('.ogl_firstDate')
      )
        cell.classList.add('ogl_firstDate');
      if (timestamp + 24 * 60 * 60 * 1000 >= endDate && !content.querySelector('.ogl_lastDate'))
        cell.classList.add('ogl_lastDate');

      let dateDiff = today.getDate() - i;
      let total = 0;

      if (this.ogl.db.stats[timestamp]) {
        let raids = Object.keys(this.ogl.db.stats?.[timestamp]?.raid || {}).length
          ? Object.values(this.ogl.db.stats?.[timestamp]?.raid || { a: 0 }).reduce((a, b) => a + b)
          : 0;
        let expes = Object.keys(this.ogl.db.stats?.[timestamp]?.expe || {}).length
          ? Object.values(this.ogl.db.stats?.[timestamp]?.expe || { a: 0 }).reduce((a, b) => a + b)
          : 0;
        total = raids + expes;
      }

      if (total == 0) cell.classList.add('ogl_disabled');

      cell.addEventListener('click', () => {
        this.addStats(Date.now() - (dateDiff + 1) * 24 * 60 * 60 * 1000, Date.now() - dateDiff * 24 * 60 * 60 * 1000);
        document.querySelector('.ogl_stats .ogl_moreStats').click();
      });
    }

    if (!content.querySelector('.ogl_firstDate') && content.querySelector('.cell.empty')) {
      content.querySelector('.cell.empty:last-of-type').classList.add('ogl_disabled');
      content.querySelector('.cell.empty:last-of-type').classList.add('ogl_beforeDate');
    }

    return domElement;
  }

  lockTech(tech) {
    let coords = this.ogl.current.coords.join(':');
    tech.onMoon = this.ogl.current.type == 'moon';

    this.ogl.db.lock = this.ogl.db.lock || {};
    this.ogl.db.lock[coords] = this.ogl.db.lock[coords] || {};
    this.ogl.db.lock[coords][`${tech.id}_${tech.level}_${this.ogl.current.type}`] = tech;
    // this.ogl.saveAsync();

    this.checkLockedTechs();
  }

  checkLockedTechs(refresh, noSub) {
    let coords = this.ogl.current.coords.join(':');
    let pageList = ['supplies', 'facilities', 'research', 'shipyard', 'defenses'];

    if (pageList.indexOf(this.ogl.page) > -1 && this.ogl.db.lock?.[coords]) {
      Object.keys(this.ogl.db.lock[coords]).forEach((key) => {
        if (this.ogl.db.lock[coords][key] && key.indexOf(this.ogl.current.type) > -1) {
          if (
            this.ogl.db.lock[coords][key].level <=
            parseInt(
              document
                .querySelector(`[data-technology="${this.ogl.db.lock[coords][key].id}"] .targetlevel`)
                ?.getAttribute('data-value') ||
                document
                  .querySelector(`[data-technology="${this.ogl.db.lock[coords][key].id}"] .level`)
                  ?.getAttribute('data-value') ||
                0
            )
          ) {
            delete this.ogl.db.lock[coords][key];
          }
        }
      });
    }

    document.querySelectorAll('.smallplanet').forEach((planet) => {
      planet.querySelector('.ogl_lockedIcon') && planet.querySelector('.ogl_lockedIcon').remove();

      let coords = planet.querySelector('.planet-koords').textContent.slice(1, -1);

      if (this.ogl.db.lock?.[coords] && Object.entries(this.ogl.db.lock[coords]).length > 0) {
        let button = planet.appendChild(
          Util.createDom('div', { class: 'ogl_lockedIcon material-icons tooltipLeft' }, 'lock')
        );

        let tooltipCumul = [0, 0, 0];
        let isReady = false;

        for (let tech of Object.values(this.ogl.db.lock[coords])) {
          tooltipCumul[0] += tech.metal;
          tooltipCumul[1] += tech.crystal;
          tooltipCumul[2] += tech.deut;

          if (tech.metal == 0 && tech.crystal == 0 && tech.deut == 0) isReady = true;
        }

        if (isReady) button.classList.add('ogl_ok');

        button.title = 'Locked' + '<div class="splitLine"></div>';
        ['metal', 'crystal', 'deut'].forEach((res, index) => {
          let resName = this.ogl.component.lang.getText(res);
          button.title += `<div>${resName}:&nbsp;<span class="ogl_${res} float_right">${Util.formatToUnits(
            tooltipCumul[index]
          )}</span></div>`;
        });

        button.addEventListener('click', () => {
          this.ogl.component.popup.load();

          if (!noSub) {
            this.availableResources = [
              this.ogl.db.me?.planets?.[coords]?.resources?.metal || 0,
              this.ogl.db.me?.planets?.[coords]?.resources?.crystal || 0,
              this.ogl.db.me?.planets?.[coords]?.resources?.deut || 0,
            ];
          }

          let container = Util.createDom('div');
          let planetContainer = container.appendChild(Util.createDom('div', { class: 'ogl_lockedContainer' }));
          let moonContainer = container.appendChild(Util.createDom('div', { class: 'ogl_lockedContainer' }));

          let cumul = [0, 0, 0, 0, 0, 0];

          for (let tech of Object.values(this.ogl.db.lock[coords])) {
            let targetContainer = tech.onMoon ? moonContainer : planetContainer;
            targetContainer.appendChild(Util.createDom('span', {}, tech.name));
            targetContainer.appendChild(Util.createDom('i', {}, tech.amount > 1 ? tech.amount : tech.level));
            targetContainer.appendChild(Util.createDom('b', { class: 'ogl_metal' }, Util.formatNumber(tech.metal)));
            targetContainer.appendChild(Util.createDom('b', { class: 'ogl_crystal' }, Util.formatNumber(tech.crystal)));
            targetContainer.appendChild(Util.createDom('b', { class: 'ogl_deut' }, Util.formatNumber(tech.deut)));

            let substract = targetContainer.appendChild(
              Util.createDom('b', { class: 'ogl_button material-icons' }, 'remove')
            );

            if (this.availableResources[0] <= 0 && this.availableResources[1] <= 0 && this.availableResources[2] <= 0) {
              substract.classList.add('ogl_disabled');
            }

            substract.addEventListener('click', () => {
              let key = `${tech.id}_${tech.level}_${tech.onMoon ? 'moon' : 'planet'}`;

              if (this.availableResources[0] > 0)
                this.ogl.db.lock[coords][key].metal = Math.max(
                  tech.metal - (this.ogl.db.me?.planets?.[coords]?.resources?.metal || 0),
                  0
                );
              if (this.availableResources[1] > 0)
                this.ogl.db.lock[coords][key].crystal = Math.max(
                  tech.crystal - (this.ogl.db.me?.planets?.[coords]?.resources?.crystal || 0),
                  0
                );
              if (this.availableResources[2] > 0)
                this.ogl.db.lock[coords][key].deut = Math.max(
                  tech.deut - (this.ogl.db.me?.planets?.[coords]?.resources?.deut || 0),
                  0
                );

              this.availableResources[0] -= tech.metal;
              this.availableResources[1] -= tech.crystal;
              this.availableResources[2] -= tech.deut;

              // this.ogl.saveAsync();
              this.ogl.component.popup.close();
              this.checkLockedTechs(coords, true);
            });

            let send = targetContainer.appendChild(
              Util.createDom('b', { class: 'ogl_button material-icons' }, 'local_shipping')
            );
            send.addEventListener('click', () => {
              this.ogl.db.lockedList = [];
              this.ogl.db.lockedList.push(`${tech.id}_${tech.level}_${tech.onMoon ? 'moon' : 'planet'}`);
              this.ogl.save();

              let splitted = coords.split(':');
              window.location.href = `https://${
                window.location.host
              }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=3&galaxy=${splitted[0]}&system=${
                splitted[1]
              }&position=${splitted[2]}&mission=${this.ogl.db.options.defaultMission}&type=${tech.onMoon ? 3 : 1}`;
            });

            let remove = targetContainer.appendChild(
              Util.createDom('b', { class: 'ogl_button material-icons' }, 'close')
            );
            remove.addEventListener('click', () => {
              delete this.ogl.db.lock[coords][`${tech.id}_${tech.level}_${!tech.onMoon ? 'planet' : 'moon'}`];
              // this.ogl.saveAsync();
              this.ogl.component.popup.close();
              this.checkLockedTechs(coords, noSub);
            });

            let offset = tech.onMoon ? 3 : 0;
            cumul[0 + offset] += tech.metal;
            cumul[1 + offset] += tech.crystal;
            cumul[2 + offset] += tech.deut;
          }

          ['planet', 'moon'].forEach((e) => {
            let headerContainer = e == 'planet' ? planetContainer : moonContainer;
            let offset = e == 'planet' ? 0 : 3;

            headerContainer.appendChild(Util.createDom('span', { class: 'ogl_header' }, e));
            headerContainer.appendChild(Util.createDom('i', { class: 'ogl_header' }, '&nbsp;'));
            headerContainer.appendChild(
              Util.createDom('b', { class: 'ogl_header ogl_metal' }, Util.formatToUnits(cumul[0 + offset]))
            );
            headerContainer.appendChild(
              Util.createDom('b', { class: 'ogl_header ogl_crystal' }, Util.formatToUnits(cumul[1 + offset]))
            );
            headerContainer.appendChild(
              Util.createDom('b', { class: 'ogl_header ogl_deut' }, Util.formatToUnits(cumul[2 + offset]))
            );
            headerContainer.appendChild(Util.createDom('i', { class: 'ogl_header' }, '&nbsp;'));

            let send = headerContainer.appendChild(
              Util.createDom('b', { class: 'ogl_button ogl_header material-icons' }, 'local_shipping')
            );
            send.addEventListener('click', () => {
              this.ogl.db.lockedList = [];

              for (let tech of Object.values(this.ogl.db.lock[coords])) {
                if (this.ogl.db.lock[coords][`${tech.id}_${tech.level}_${e}`]) {
                  this.ogl.db.lockedList.push(`${tech.id}_${tech.level}_${e}`);
                  this.ogl.save();

                  let splitted = coords.split(':');
                  window.location.href = `https://${
                    window.location.host
                  }/game/index.php?page=ingame&component=fleetdispatch&ogl_mode=3&galaxy=${splitted[0]}&system=${
                    splitted[1]
                  }&position=${splitted[2]}&mission=${this.ogl.db.options.defaultMission}&type=${tech.onMoon ? 3 : 1}`;
                }
              }
            });

            let remove = headerContainer.appendChild(
              Util.createDom('b', { class: 'ogl_button ogl_header material-icons' }, 'close')
            );
            remove.addEventListener('click', () => {
              for (let tech of Object.values(this.ogl.db.lock[coords])) {
                if (this.ogl.db.lock[coords][`${tech.id}_${tech.level}_${e}`])
                  delete this.ogl.db.lock[coords][`${tech.id}_${tech.level}_${e}`];
              }

              // this.ogl.saveAsync();
              this.ogl.component.popup.close();
              this.checkLockedTechs(coords);
            });
          });

          this.ogl.component.popup.open(container);
        });

        if (refresh && refresh == coords) button.click();
      }
    });
  }

  checkStorage() {
    if (this.ogl.current.type == 'moon') return;

    let storage = {
      metal: resourcesBar.resources.metal.storage,
      crystal: resourcesBar.resources.crystal.storage,
      deut: resourcesBar.resources.deuterium.storage,
    };

    ['metal', 'crystal', 'deut'].forEach((res) => {
      let data = resourcesBar.resources[res.replace('deut', 'deuterium')].tooltip;
      let prod = data.replace(/\./g, '').match(/\d+/g)[2];
      let timeLeft = prod > 0 ? Math.floor((storage[res] - this.ogl.current[res]) / prod) || 0 : 0;
      let day = Math.floor(timeLeft / 24);
      let hour = Math.floor(timeLeft % 24);

      let box = document.querySelector(`#${res.replace('deut', 'deuterium')}_box`);
      box
        .querySelector('.resourceIcon')
        .appendChild(
          Util.createDom(
            'div',
            { class: 'ogl_storage' },
            `${day}${LocalizationStrings.timeunits.short.day} ${hour}${LocalizationStrings.timeunits.short.hour}`
          )
        );
    });
  }

  checkCrawlers() {
    if (this.ogl.current.type == 'planet' && (this.ogl.page == 'supplies' || this.ogl.page == 'shipyard')) {
      let currentCoords = this.ogl.current.coords.join(':');

      let maxCrawler =
        ((this.ogl.db.me.planets?.[currentCoords]?.techs?.[1] || 0) +
          (this.ogl.db.me.planets?.[currentCoords]?.techs?.[2] || 0) +
          (this.ogl.db.me.planets?.[currentCoords]?.techs?.[3] || 0)) *
        8;
      if (document.querySelector('#officers .geologist.on') && this.ogl.account.class == 1)
        maxCrawler += maxCrawler * 0.1;
      document
        .querySelector('.technology[data-technology="217"] .amount span')
        .appendChild(
          Util.createDom('span', { class: 'ogl_maxCrawler' }, ` / ${Util.formatNumber(Math.floor(maxCrawler))}`)
        );
    }
  }

  getEmpireData() {
    if (document.querySelector('.commander.on')) {
      let getEmpireResources = (i) => {
        $.ajax({
          url: `https://${window.location.host}/game/index.php?page=ajax&component=empire&ajax=1&asJson=1&planetType=${i}`,
          type: 'GET',
          dataType: 'json',
          success: (result) => {
            let data = JSON.parse(result.mergedArray).planets;
            if (!data) return;
            Object.values(data).forEach((p) => {
              let coords = p.coordinates.slice(1, -1);
              if (p.type != 1) coords += ':M';

              let stockDiv = Util.createDom('div', { class: 'ogl_stock' });

              Object.keys(p).forEach((k) => {
                if (!isNaN(k)) {
                  this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || { techs: {} };
                  this.ogl.db.me.planets[coords].techs = this.ogl.db.me.planets[coords].techs || {};
                  this.ogl.db.me.planets[coords].techs[k] = p[k];
                } else {
                  this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || {};

                  this.ogl.db.me.planets[coords].resources = this.ogl.db.me.planets[coords].resources || {};
                  this.ogl.db.me.planets[coords].production = this.ogl.db.me.planets[coords].production || [];

                  if (k == 'metal') this.ogl.db.me.planets[coords].resources.metal = p[k];
                  else if (k == 'crystal') this.ogl.db.me.planets[coords].resources.crystal = p[k];
                  else if (k == 'deuterium') this.ogl.db.me.planets[coords].resources.deut = p[k];
                  else if (k == 'production') {
                    this.ogl.db.me.planets[coords].production[0] = (p[k].hourly[0] / 3600).toFixed(2);
                    this.ogl.db.me.planets[coords].production[1] = (p[k].hourly[1] / 3600).toFixed(2);
                    this.ogl.db.me.planets[coords].production[2] = (p[k].hourly[2] / 3600).toFixed(2);
                    this.ogl.db.me.planets[coords].production[3] = serverTime.getTime();
                  }
                }
              });

              let targetType = i != 1 ? 'planetlink' : 'moonlink';
              let targetID = i != 1 ? p.id : p.planetID;
              let target = document.querySelector(`.smallplanet[id="planet-${targetID}"] .${targetType}`);

              ['metal', 'crystal', 'deut'].forEach((res, index) => {
                let storage = this.ogl.db.me.planets?.[coords]?.storage?.[index];
                let amount = this.ogl.db.me.planets[coords].resources[res];
                let line = stockDiv.appendChild(
                  Util.createDom('div', { class: `ogl_${res}` }, Util.formatToUnits(amount))
                );

                if (storage && amount >= storage) line.classList.add('ogl_full');
              });

              target.querySelector('.ogl_stock').innerHTML = stockDiv.innerHTML;
            });

            if (i == 0) getEmpireResources(1);
            // else this.ogl.saveAsync();
          },
        });
      };

      getEmpireResources(0);
    }
  }

  reloadEventbox() {
    if (document.querySelector('#eventboxContent h2 .ogl_button') || !document.querySelector('#eventboxContent h2'))
      return;

    let button = document
      .querySelector('#eventboxContent h2')
      .appendChild(Util.createDom('div', { class: 'ogl_button material-icons' }, 'refresh'));
    button.addEventListener('click', () => {
      if (document.querySelector('#eventboxContent #eventContent').querySelector('.ogl_loader')) return;

      document.querySelector('#eventboxContent #eventContent').textContent = '';
      document
        .querySelector('#eventboxContent #eventContent')
        .appendChild(Util.createDom('div', { class: 'ogl_loader' }));

      Util.getRaw(eventlistLink, (result) => {
        $('#eventboxContent').html(result);
        toggleEvents.loaded = true;
      });
    });
  }
}

export default EmpireManager;
