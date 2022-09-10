import Util from '../util.js';

class SidebarManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.dom = document.body.appendChild(Util.createDom('div', { class: 'ogl_sideView' }));
    this.cross = this.dom.appendChild(Util.createDom('div', { class: 'ogl_close material-icons' }, 'clear'));
    this.content = this.dom.appendChild(Util.createDom('div'));
    this.ogl.db.sidebarView = this.ogl.db.sidebarView || false;

    this.cross.addEventListener('click', () => this.close());
    this.init();
  }

  init() {
    if (this.ogl.db.sidebarView == 'pinned') this.displayPinnedTarget();
    if (this.ogl.db.sidebarView == 'targetList') this.displayTargetList();
  }

  displayPinnedTarget() {
    if (this.ogl.db.sidebarView != 'pinned') {
      this.ogl.db.sidebarView = 'pinned';
      // this.ogl.saveAsync();
    }

    this.oldContent = Util.createDom('div', {}, this.content.innerHTML);
    this.content.textContent = '';

    if (this.ogl.db.pinnedList.length > 0) {
      let player = this.ogl.db.players[this.ogl.find(this.ogl.db.players, 'id', this.ogl.db.pinnedList[0])[0]];

      let container = Util.createDom('div');
      container.innerHTML = `
                <h1><span>${player.name}</span></h1>
                <div class="splitLine"></div>
                <div class="ogl_scrollable">
                    <div class="ogl_stalkPoints">
                        <div title="${player.total}"><i class="material-icons">star</i>${Util.formatToUnits(
        player.total
      )}</div>
                        <div title="${player.eco}"><i class="material-icons">attach_money</i>${Util.formatToUnits(
        player.eco
      )}</div>
                        <div title="${player.tech}"><i class="material-icons">science</i>${Util.formatToUnits(
        player.tech
      )}</div>
                        <div title="${player.fleet}"><i class="material-icons">military_tech</i>${Util.formatToUnits(
        player.fleet
      )}</div>
                        <div title="${player.def}"><i class="material-icons">security</i>${Util.formatToUnits(
        player.def
      )}</div>
                    </div>
                    <div class="ogl_actionsContainer"></div>
                    <div class="splitLine"></div>
                    <div class="ogl_stalkInfo">
                        <div class="ogl_stalkPlanets ogl_pinnedContent"></div>
                    </div>
                </div>
            `;

      let rawStart = '000000';
      let multi = 1;
      let isMulti = false;

      let positionsList = this.ogl.getPositionsByPlayerId(this.ogl.db.pinnedList[0]);

      positionsList[this.ogl.db.pinnedList[0]]
        .sort((a, b) => a.rawCoords - b.rawCoords)
        .forEach((planetIndex) => {
          let planet = planetIndex;
          let splitted = planet.coords.split(':');

          let item = Util.createDom('div', { 'data-coords': planet.coords });
          let coordsDiv = item.appendChild(Util.createDom('span', {}, planet.coords));
          coordsDiv.addEventListener('click', () => {
            this.scroll = document.querySelector('.ogl_pinnedContent').scrollTop;
            this.ogl.component.tooltip.close();
            this.ogl.component.galaxy.goToPosition(splitted[0], splitted[1], splitted[2]);
          });

          if (
            this.ogl.page == 'galaxy' &&
            document.querySelector('#galaxy_input').value == splitted[0] &&
            document.querySelector('#system_input').value == splitted[1]
          ) {
            coordsDiv.classList.add('ogl_currentSystem');
          }

          if (this.oldContent.querySelector(`[data-coords="${planet.coords}"] .ogl_checked`)) {
            item.appendChild(Util.createDom('div', { class: 'material-icons ogl_checked' }, 'check_circle'));
          }

          if (
            this.oldContent.textContent.trim() &&
            !this.oldContent.querySelector(`[data-coords="${planet.coords}"]`)
          ) {
            item.classList.add('ogl_new');
          }

          if (planet.main)
            coordsDiv.appendChild(Util.createDom('div', { class: 'material-icons ogl_mainPlanet' }, 'star'));

          let mSpy = item.appendChild(
            Util.createDom('div', { class: 'ogl_moonIcon material-icons', 'data-type': 3 }, 'brightness_2')
          );
          mSpy.addEventListener('click', () =>
            this.ogl.component.fleet.sendSpyProbe(
              [splitted[0], splitted[1], splitted[2], 3],
              this.ogl.db.spyProbesCount,
              mSpy,
              true
            )
          );
          if (serverTime.getTime() - planet.lastMoonSpy < 60 * 60 * 1000) mSpy.classList.add('ogl_done');

          let pSpy = item.appendChild(
            Util.createDom('div', { class: 'ogl_planetIcon material-icons', 'data-type': 1 }, 'language')
          );
          pSpy.addEventListener('click', () =>
            this.ogl.component.fleet.sendSpyProbe(
              [splitted[0], splitted[1], splitted[2], 1],
              this.ogl.db.spyProbesCount,
              pSpy,
              true
            )
          );
          if (serverTime.getTime() - planet.lastSpy < 60 * 60 * 1000) pSpy.classList.add('ogl_done');

          if (planet.moonID == -1) mSpy.classList.add('ogl_noPointer');
          planet.color ? item.setAttribute('data-color', planet.color) : item.removeAttribute('data-color');

          // refresh old activities after 3h
          if (planet.activity && serverTime.getTime() - planet.lastUpdate > 3 * 60 * 60 * 1000) planet.activity = false;
          if (planet.moonActivity && serverTime.getTime() - planet.lastUpdate > 3 * 60 * 60 * 1000)
            planet.moonActivity = false;

          let pActivityDom = item.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_planetActivity', 'data-activity': planet.activity },
              planet.activity || '?'
            )
          );
          let mActivityDom = item.appendChild(
            Util.createDom(
              'div',
              { class: 'ogl_moonActivity', 'data-activity': planet.moonActivity },
              planet.moonActivity || '?'
            )
          );

          if (planet.activity) {
            pActivityDom.textContent = planet.activity;
            if (planet.activity == '*') pActivityDom.classList.add('ogl_short');
          }

          if (planet.moonID > -1 && planet.moonActivity) {
            mActivityDom.textContent = planet.moonActivity;
            if (planet.moonActivity == '*') mActivityDom.classList.add('ogl_short');
          }

          if (planet.moonID == -1) mActivityDom.classList.add('ogl_hidden');

          if (rawStart == planet.rawCoords.slice(0, -3)) {
            item.setAttribute('data-multi', multi);
            isMulti = true;
          } else if (isMulti) {
            multi++;
            isMulti = false;
          }

          rawStart = planet.rawCoords.slice(0, -3);

          container.querySelector('.ogl_stalkPlanets').appendChild(item);
        });

      let buttonsContainer = container.querySelector('.ogl_actionsContainer');

      let ptreAction = (frame) => {
        frame = frame || 'week';

        this.ogl.component.popup.load();
        let container = Util.createDom('div', { class: 'ptreContent' });

        if (!this.ogl.ptre) {
          container.innerHTML = `Error: no teamkey registered`;
          this.ogl.component.popup.open(container);
          return;
        }

        Util.getJSON(
          `https://ptre.chez.gg/scripts/oglight_get_player_infos.php?team_key=${this.ogl.ptre}&pseudo=${player.name}&player_id=${player.id}&input_frame=${frame}`,
          (result) => {
            if (result.code == 1 && result.activity_array.activity_array && result.activity_array.check_array) {
              let arrData = JSON.parse(result.activity_array.activity_array);
              let checkData = JSON.parse(result.activity_array.check_array);

              container.innerHTML = `
                            <h3>${this.ogl.component.lang.getText('reportFound')} :</h3>
                            <div class="ptreBestReport">
                                <div>
                                    <div><b class="ogl_fleet"><i class="material-icons">military_tech</i>${Util.formatToUnits(
                                      result.top_sr_fleet_points
                                    )} pts</b></div>
                                    <div><b>${new Date(result.top_sr_timestamp * 1000).toLocaleDateString(
                                      'fr-FR'
                                    )}</b></div>
                                </div>
                                <div>
                                    <a class="ogl_button" target="_blank" href="${
                                      result.top_sr_link
                                    }">${this.ogl.component.lang.getText('topReportDetails')}</a>
                                    <a class="ogl_button" target="_blank" href="https://ptre.chez.gg/?country=${
                                      this.ogl.universe.lang
                                    }&univers=${this.ogl.universe.number}&player_id=${
                player.id
              }">${this.ogl.component.lang.getText('playerProfile')}</a>
                                </div>
                            </div>
                            <div class="splitLine"></div>
                            <h3>${result.activity_array.title}</h3>
                            <div class="ptreActivities"><span></span><div></div></div>
                            <div class="splitLine"></div>
                            <div class="ptreFrames"></div>
                            <!--<ul class="ptreLegend">
                                <li><u>Green circle</u>: no activity detected & fully checked</li>
                                <li><u>Green dot</u>: no activity detected</li>
                                <li><u>Red dot</u>: multiple activities detected</li>
                                <li><u>Transparent dot</u>: not enough planet checked</li>
                            </ul>-->
                        `;

              ['last24h', '2days', '3days', 'week', '2weeks', 'month'].forEach((f) => {
                let btn = container
                  .querySelector('.ptreFrames')
                  .appendChild(Util.createDom('div', { class: 'ogl_button' }, f));
                btn.addEventListener('click', () => ptreAction(f));
              });

              if (result.activity_array.succes == 1) {
                arrData.forEach((line, index) => {
                  if (!isNaN(line[1])) {
                    let div = Util.createDom('div', { class: 'tooltip' }, `<div>${line[0]}</div>`);
                    let span = div.appendChild(Util.createDom('span', { class: 'ptreDotStats' }));
                    let dot = span.appendChild(
                      Util.createDom('div', { 'data-acti': line[1], 'data-check': checkData[index][1] })
                    );

                    let dotValue = (line[1] / result.activity_array.max_acti_per_slot) * 100 * 7;
                    dotValue = Math.ceil(dotValue / 30) * 30;

                    dot.style.color = `hsl(${Math.max(0, 100 - dotValue)}deg 75% 40%)`;
                    dot.style.opacity = checkData[index][1] + '%';
                    dot.style.padding = '7px';

                    let title;
                    let checkValue = Math.max(0, 100 - dotValue);

                    if (checkValue === 100) title = '- No activity detected';
                    else if (checkValue >= 60) title = '- A few activities detected';
                    else if (checkValue >= 40) title = '- Some activities detected';
                    else title = '- A lot of activities detected';

                    if (checkData[index][1] == 100) title += '<br>- Perfectly checked';
                    else if (checkData[index][1] >= 75) title += '<br>- Nicely checked';
                    else if (checkData[index][1] >= 50) title += '<br>- Decently checked';
                    else if (checkData[index][1] > 0) title = 'Poorly checked';
                    else title = 'Not checked';

                    div.setAttribute('title', title);

                    if (checkData[index][1] === 100 && line[1] == 0) dot.classList.add('ogl_active');

                    container.querySelector('.ptreActivities > div').appendChild(div);
                  }
                });
              } else {
                container.querySelector('.ptreActivities > span').textContent = result.activity_array.message;
              }
            } else if (result.code == 1) {
              container.textContent = result.activity_array.message;
            } else container.textContent = result.message;
            this.ogl.component.popup.open(container, true);
          }
        );
      };

      let ptreBtn = buttonsContainer.appendChild(
        Util.createDom('div', { class: 'ogl_button ptrePinned tooltip', title: 'Display PTRE data' }, 'PTRE')
      );
      ptreBtn.addEventListener('click', () => ptreAction());

      let ptreSyncBtn = buttonsContainer.appendChild(
        Util.createDom(
          'div',
          { class: 'material-icons ogl_button tooltip', title: 'Sync data with OGame API and PTRE' },
          'sync'
        )
      );
      ptreSyncBtn.addEventListener('click', () => {
        this.ogl.component.crawler.checkPlayerApi(
          this.ogl.db.pinnedList[0],
          () => {
            fadeBox('Data synced successfully');
          },
          true
        );
      });

      let historyBtn = buttonsContainer.appendChild(
        Util.createDom('div', { class: 'material-icons ogl_button tooltip', title: 'History list' }, 'history')
      );
      historyBtn.addEventListener('click', () => this.displayPinnedList());

      let deleteBtn = buttonsContainer.appendChild(
        Util.createDom('div', { class: 'material-icons ogl_button tooltip', title: 'Remove' }, 'delete')
      );
      deleteBtn.addEventListener('click', () => {
        this.ogl.db.pinnedList.forEach((e, index) => {
          if (e && e == player.id) {
            this.ogl.db.pinnedList.splice(index, 1);
            this.ogl.db.pinnedList.length > 0 ? historyBtn.click() : this.ogl.component.sidebar.close();
          }
        });
      });

      this.open(container, true);
    }

    if (this.scroll) document.querySelector('.ogl_pinnedContent').scrollTo(0, this.scroll);
  }

  displayPinnedList() {
    let content = Util.createDom('div', { class: 'ogl_historyList' });
    this.ogl.db.pinnedList.forEach((playerID) => {
      let historyPlayer = this.ogl.db.players[this.ogl.find(this.ogl.db.players, 'id', playerID)[0]];
      let btn = content.appendChild(Util.createDom('div', { class: `ogl_button ${historyPlayer.status}` }));
      btn.appendChild(Util.createDom('b', {}, historyPlayer.name));
      btn.appendChild(Util.createDom('span', {}, '#' + (historyPlayer.rank?.toString().replace('-1', '(b)') || '?')));
      btn.appendChild(
        Util.createDom(
          'i',
          { class: 'float_right' },
          `<i class="material-icons">military_tech</i>${Util.formatToUnits(historyPlayer.fleet)}`
        )
      );

      this.open(content);

      btn.addEventListener('click', () => {
        this.ogl.db.pinnedList.forEach((e, index) => {
          if (e && e == playerID) this.ogl.db.pinnedList.splice(index, 1);
        });

        this.ogl.db.pinnedList.unshift(playerID);
        if (this.ogl.db.pinnedList.length > this.ogl.maxPinnedTargets)
          this.ogl.db.pinnedList.length = this.ogl.maxPinnedTargets;

        // this.ogl.saveAsync();
        this.ogl.component.sidebar.displayPinnedTarget();
        this.ogl.component.crawler.checkPlayerApi(this.ogl.db.pinnedList[0]);
      });
    });
  }

  displayTargetList(silencedMode) {
    if (!silencedMode && this.ogl.db.sidebarView != 'targetList') {
      this.ogl.db.sidebarView = 'targetList';
      // this.ogl.saveAsync();
    }
    if (!silencedMode) this.load();

    let ignoreVacation = this.ogl.db.options.togglesOff.indexOf('ignoreVacation') == -1;
    let playersList = this.ogl.getPlayersById();
    let positionsList = this.ogl.getPositionsByCoords(true);

    let container = Util.createDom('div');
    let currentGalaxy = this.ogl.db.options?.targetFilter?.[0] || 1;
    let currentSystem = this.ogl.db.options?.targetFilter?.[1] || 0;

    let systemSteps = 50;
    //let currentRaw = parseInt(`${currentGalaxy}:${currentSystem}:1`.split(':').map(x => x.padStart(3, '0')).join(''));

    let targetCoords;
    let nextTargetCoords;
    this.ogl.db.options.nextTargets = this.ogl.db.options.nextTargets || [0, 0];

    let colors = container.appendChild(Util.createDom('div', { class: 'ogl_toggleColors' }));
    let gMenu = container.appendChild(Util.createDom('div', { class: 'ogl_toggleGalaxies' }));
    let sMenu = container.appendChild(Util.createDom('div', { class: 'ogl_toggleSystems' }));
    let content = container.appendChild(Util.createDom('div', { class: 'ogl_stalkPlanets ogl_scrollable' }));

    [
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
    ].forEach((color) => {
      let toggle = colors.appendChild(Util.createDom('div', { class: 'ogl_toggle', 'data-toggle': color }));
      if (this.ogl.db.options.excludedColors.indexOf(color) == -1) toggle.classList.add('ogl_active');

      toggle.addEventListener('click', () => {
        let colorIndex = this.ogl.db.options.excludedColors.indexOf(color);
        if (colorIndex > -1) this.ogl.db.options.excludedColors.splice(colorIndex, 1);
        else this.ogl.db.options.excludedColors.push(color);

        // this.ogl.saveAsync();
        this.displayTargetList();
      });
    });

    for (let g = 1; g <= 12; g++) {
      let gDiv = gMenu.appendChild(Util.createDom('div', { class: 'ogl_disabled', 'data-galaxy': g }, g));
      if (currentGalaxy == g) gDiv.classList.add('ogl_active');
      gDiv.addEventListener('click', () => {
        this.ogl.db.options.targetFilter[0] = g;
        // this.ogl.saveAsync();
        this.displayTargetList();
      });

      for (let s = 0; s < 500; s += systemSteps) {
        let planetsList = [];

        if (g == 1) {
          let sDiv = sMenu.appendChild(
            Util.createDom('div', { class: 'ogl_disabled', 'data-system': s }, s.toString())
          );
          sDiv.addEventListener('click', () => {
            this.ogl.db.options.targetFilter[1] = s;
            // this.ogl.saveAsync();
            this.displayTargetList();
          });
        }

        /*let loopRawStart = parseInt(`${g}:${s}:1`.split(':').map(x => x.padStart(3, '0')).join(''));
                let loopRawEnd = loopRawStart + systemSteps * 1000;*/

        for (let sr = s; sr < s + systemSteps; sr++) {
          let loopRawPosition = `${g}:${sr}:1`
            .split(':')
            .map((x) => x.padStart(3, '0'))
            .join('')
            .slice(0, -3);
          if (positionsList[loopRawPosition]) planetsList.push(positionsList[loopRawPosition]);
        }

        let indexList = planetsList.flat();

        //let indexList = this.ogl.findTargets(this.ogl.db.positions, 'rawCoords', loopRawStart, loopRawEnd);
        if (indexList.length > 0) {
          gDiv.classList.remove('ogl_disabled');
          if (g == currentGalaxy) sMenu.querySelector(`[data-system="${s}"]`).classList.remove('ogl_disabled');
        }

        indexList.forEach((entry) => {
          //let entry = this.ogl.db.positions[index];
          let player = playersList[entry.playerID];

          if (ignoreVacation && player?.status?.indexOf('vacation') > -1) return;

          if (targetCoords && !nextTargetCoords) {
            nextTargetCoords = entry.coords;
            this.ogl.db.options.nextTargets[1] = entry.coords;
          }

          if (this.ogl.db.options.nextTargets[0] == entry.coords) {
            targetCoords = entry.coords;
            nextTargetCoords = false;
          }

          if (currentGalaxy == g && currentSystem == s) {
            gDiv.classList.add('ogl_active');
            sMenu.querySelector(`[data-system="${s}"]`).classList.add('ogl_active');

            let splitted = entry.coords.split(':');
            let div = content.appendChild(
              Util.createDom('div', {
                'data-color': entry.color,
                'data-playerID': entry.playerID,
                'data-planetID': entry.id,
                'data-minicoords': `${splitted[0]}:${splitted[1]}`,
              })
            );

            // coords
            let coordsDiv = div.appendChild(Util.createDom('div', {}, entry.coords));
            coordsDiv.addEventListener('click', () => {
              this.ogl.component.tooltip.close();
              this.ogl.component.galaxy.goToPosition(splitted[0], splitted[1], splitted[2]);
            });

            // player name
            div.appendChild(Util.createDom('div', { class: player?.status }, player?.name || '?'));

            let pSpy = div.appendChild(
              Util.createDom('div', { class: 'ogl_planetIcon material-icons', 'data-type': 1 }, 'language')
            );
            pSpy.addEventListener('click', () =>
              this.ogl.component.fleet.sendSpyProbe(
                [splitted[0], splitted[1], splitted[2], 1],
                this.ogl.db.spyProbesCount,
                pSpy,
                true
              )
            );
            if (serverTime.getTime() - entry.lastSpy < 60 * 60 * 1000) pSpy.classList.add('ogl_done');

            let mSpy = div.appendChild(
              Util.createDom(
                'div',
                { class: 'ogl_moonIcon material-icons ogl_noPointer', 'data-type': 3 },
                'brightness_2'
              )
            );
            if (entry.moonID && entry.moonID > -1) mSpy.classList.remove('ogl_noPointer');
            mSpy.addEventListener('click', () =>
              this.ogl.component.fleet.sendSpyProbe(
                [splitted[0], splitted[1], splitted[2], 3],
                this.ogl.db.spyProbesCount,
                mSpy,
                true
              )
            );
            if (serverTime.getTime() - entry.lastMoonSpy < 60 * 60 * 1000) mSpy.classList.add('ogl_done');

            let flag = div.appendChild(Util.createDom('div', { class: 'ogl_flagIcon material-icons' }, 'flag'));
            if (targetCoords == entry.coords) flag.classList.add('ogl_active');
            flag.addEventListener('click', () => {
              this.ogl.db.options.nextTargets = [entry.coords, 0];
              this.displayTargetList();
            });
          }
        });
      }
    }

    if (!silencedMode) this.open(container);
  }

  open(html, noLoad) {
    let update = () => {
      this.content.textContent = '';
      this.content.appendChild(html);
      this.dom.classList.add('ogl_active');

      if (this.ogl.page == 'galaxy') {
        document
          .querySelectorAll('.ogl_stalkPlanets.ogl_scrollable > div.ogl_currentSystem')
          .forEach((item) => item.classList.remove('ogl_currentSystem'));
        document
          .querySelectorAll(`.ogl_stalkPlanets.ogl_scrollable > div[data-minicoords="${galaxy}:${system}"]`)
          .forEach((item) => item.classList.add('ogl_currentSystem'));
      }
    };

    if (noLoad) update();
    else setTimeout(() => update(), 100);
  }

  load() {
    this.content.innerHTML = '<div class="ogl_loader"></div>';
    this.dom.classList.add('ogl_active');
  }

  close() {
    this.ogl.db.sidebarView = false;
    this.dom.classList.remove('ogl_active');
    // this.ogl.saveAsync();
  }
}

export default SidebarManager;
