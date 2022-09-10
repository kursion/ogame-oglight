import Util from '../util.js';

class CrawlerManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.ogl.db.stats.total = this.ogl.db.stats.total || {};
    if (this.ogl.page == 'highscore' || this.ogl.page == 'supplies') this.init();

    this.ogl.observeMutation(() => {
      this.init();
    }, 'crawler');

    Util.getJSON(`https://${window.location.host}/game/index.php?page=fetchTechs`, (result) => {
      this.ogl.current.techs = result;
      let coords = this.ogl.current.coords.join(':');
      if (this.ogl.current.type == 'moon') coords += ':M';

      this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || {};
      this.ogl.db.me.planets[coords].techs = this.ogl.current.techs;

      // this.ogl.saveAsync();
    });

    if (this.ogl.current.type == 'planet') this.getPlanetProduction();
  }

  init() {
    if (this.ogl.page == 'supplies') {
      let coords = this.ogl.current.coords.join(':');
      let upgrade = document.querySelector('.targetlevel')?.getAttribute('data-value');

      if (upgrade && this.ogl.current.type == 'planet') {
        let techID = document.querySelector('.targetlevel').closest('.technology').getAttribute('data-technology');

        this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || {};
        this.ogl.db.me.planets[coords].upgrade = [techID, parseInt(upgrade)];
      } else {
        this.ogl.db.me.planets[coords] = this.ogl.db.me.planets[coords] || {};
        this.ogl.db.me.planets[coords].upgrade = [];
      }
      // this.ogl.saveAsync();
    } else if (this.ogl.page == 'highscore') {
      performance.ogl.highscoreCrawl = performance.now();

      if (
        document.querySelector('#stat_list_content .ajaxLoad') ||
        !document.querySelector('#row #player').classList.contains('active')
      )
        return;

      this.ogl.db.lastRankUpdate =
        !this.ogl.db.lastRankUpdate || !isNaN(this.ogl.db.lastRankUpdate) ? {} : this.ogl.db.lastRankUpdate;
      this.ogl.db.lastStatusUpdate =
        !this.ogl.db.lastStatusUpdate || !isNaN(this.ogl.db.lastStatusUpdate) ? {} : this.ogl.db.lastStatusUpdate;

      let rankPoint = document.querySelector('a#points').classList.contains('active');
      let rankFleet = document.querySelector('a#fleet').classList.contains('active');
      let rankPage = document.querySelector('.pagebar .activePager')?.textContent || 1;
      let updateRank = serverTime.getTime() - (this.ogl.db.lastRankUpdate?.[rankPage] || 0) > 12 * 60 * 60 * 1000;
      let updateStatus = serverTime.getTime() - (this.ogl.db.lastStatusUpdate?.[rankPage] || 0) > 12 * 60 * 60 * 1000;

      if (updateStatus) {
        Util.getXML(`https://${window.location.host}/api/players.xml`, (result) => {
          let xmlTimestamp = parseInt(result.querySelector('players').getAttribute('timestamp')) * 1000;

          document.querySelectorAll('#ranks tbody > tr').forEach((line, index) => {
            setTimeout(() => {
              let id = line.getAttribute('id').replace('position', '');
              let playerStatus =
                result.querySelector(`player[id="${id}"]`)?.getAttribute('status') || 'status_abbr_active';

              if (playerStatus.indexOf('v') > -1 && playerStatus != 'status_abbr_active')
                playerStatus = 'status_abbr_vacation';
              else if (playerStatus === 'I') playerStatus = 'status_abbr_longinactive';
              else if (playerStatus === 'i') playerStatus = 'status_abbr_inactive';

              let entryID = this.ogl.find(this.ogl.db.players, 'id', id)[0] ?? this.ogl.db.players.length;
              let player = this.ogl.db.players[entryID];

              if (player && (player.lastStatusUpdate ?? 0) < xmlTimestamp) {
                line
                  .querySelector('.playername')
                  .classList.remove(
                    Array.from(line.querySelector('.playername').classList).filter((e) => e.startsWith('status_'))[0]
                  );

                this.ogl.db.players[entryID].status = playerStatus;

                line.querySelector('.playername').classList.add(playerStatus);
              }
            }, index);
          });

          this.ogl.db.lastStatusUpdate[rankPage] = xmlTimestamp;
          // this.ogl.saveAsync();
        });
      }

      // add status / names
      document.querySelectorAll('#ranks tbody > tr').forEach((line, index) => {
        let id = line.getAttribute('id').replace('position', '');
        let playerIndex = this.ogl.find(this.ogl.db.players, 'id', id)[0] ?? this.ogl.db.players.length;

        let player = {};
        player.id = id;
        player.name = line.querySelector('.playername').textContent.trim();
        player.ally = line.querySelector('.ally-tag')?.textContent.trim().slice(1, -1);

        if (
          player.name.indexOf('...') > -1 &&
          this.ogl.db.players[playerIndex]?.name &&
          this.ogl.db.players[playerIndex].name.indexOf(player.name.replace(/\./g, '')) > -1
        ) {
          player.name = this.ogl.db.players[playerIndex].name;
          line.querySelector('.playername').textContent = player.name;
        }

        if (rankPoint) {
          player.rank = line.querySelector('.position').textContent.trim();
          player.total = parseInt(line.querySelector('.score').textContent.replace(/\D/g, ''));
        } else if (rankFleet) {
          player.power = parseInt(line.querySelector('.score').textContent.replace(/\D/g, ''));
        }

        if (!player.id) return;
        this.ogl.db.players[playerIndex] = { ...this.ogl.db.players[playerIndex], ...player };

        if (this.ogl.db.players?.[playerIndex]?.status) {
          let status = Array.from(this.ogl.db.players[playerIndex].status.split(' ')).filter((e) =>
            e.startsWith('status_')
          )[0];
          line.querySelector('.playername').classList.add(status);
        }

        line.querySelector('.playername').classList.remove('status_abbr_honorableTarget');

        // check rank et score
        if (rankPoint && updateRank) {
          this.ogl.db.players[playerIndex].veryOldRank =
            this.ogl.db.players[playerIndex].oldRank || this.ogl.db.players[playerIndex].rank;
          this.ogl.db.players[playerIndex].oldRank = this.ogl.db.players[playerIndex].rank || player.rank;

          this.ogl.db.players[playerIndex].veryOldTotal =
            this.ogl.db.players[playerIndex].oldTotal || this.ogl.db.players[playerIndex].total || player.total;
          this.ogl.db.players[playerIndex].oldTotal = this.ogl.db.players[playerIndex].total || player.total;
        }

        player = this.ogl.db.players[playerIndex];

        // display rank & score movements
        if (rankPoint) {
          let rankMovement = (player.veryOldRank || 0) - player.rank;
          if (!player.veryOldRank) {
            line.querySelector('.movement').textContent = 'NEW';
            line.querySelector('.movement').classList.add('ogl_warning');
          } else {
            if (player.veryOldRank != player.rank) {
              let sign = rankMovement > 0 ? '+' : '';

              line.querySelector('.movement').textContent = `(${sign + parseInt(rankMovement)})`;

              if (rankMovement > 0) line.querySelector('.movement').classList.add('ogl_ok');
              else if (rankMovement < 0) line.querySelector('.movement').classList.add('ogl_danger');
            } else line.querySelector('.movement').textContent = '-';
          }

          let diff = player.total - player.veryOldTotal || 0;
          let diffSign = diff > 0 ? '+' : '';
          line.querySelector('.ogl_scoreDiff') && line.querySelector('.ogl_scoreDiff').remove();
          let scoreDiff = line
            .querySelector('.score')
            .appendChild(Util.createDom('div', { class: 'ogl_scoreDiff' }, diffSign + Util.formatNumber(diff)));
          if (diff > 0) scoreDiff.classList.add('ogl_ok');
          else if (diff < 0) scoreDiff.classList.add('ogl_danger');
          else scoreDiff.classList.add('ogl_none');
        }
      });

      if (rankPoint && updateRank) this.ogl.db.lastRankUpdate[rankPage] = serverTime.getTime();

      // this.ogl.saveAsync();

      performance.ogl.highscoreCrawlEnd = performance.now();
    } else if (this.ogl.page == 'galaxy') {
      performance.ogl.galaxyCrawl = performance.now();

      // store spy probes to send
      if (!this.spyProbeCountDone && document.querySelector('a[onclick*="sendShips"]')) {
        let ships = document.querySelector('a[onclick*="sendShips"]').getAttribute('onclick').match(/\d+/g).map(Number);
        if (ships[0] == 6 && ships[5] != this.ogl.db.spyProbesCount) {
          this.ogl.db.spyProbesCount = ships[5];
          this.spyProbeCountDone = true;
          // this.ogl.saveAsync();
        }
      }

      // antispam galaxy security
      if (
        this.ogl.galaxyCoords[0] != document.querySelector('#galaxy_input').value ||
        this.ogl.galaxyCoords[1] != document.querySelector('#system_input').value
      )
        return;

      this.ogl.component.tooltip.close(true);

      let ptrePosition = {};
      let ptreActivities = {};
      let selector = document.querySelectorAll('.galaxyTable .ctContentRow');
      let refreshPinnedTarget = false;
      let currentSystemRaw = parseInt(galaxy) * 1000 + parseInt(system);

      selector.forEach((line) => {
        if (!line.querySelector('.position') && !line.querySelector('.cellPosition')) return; // ignore p16 & 17
        if (line.querySelector('.playername.admin') || line.querySelector('.cellPlayerName.admin')) return; // ignore admins

        let isOld = false; // old OGL data format
        let info = this.getCurrentInfo(line);
        let player = info[0];
        let planet = info[1];

        let planetIndex = this.ogl.find(this.ogl.db.positions, 'coords', planet.coords)[0];

        if (this.ogl.ptre) {
          let oldPositionEntry = this.ogl.db.positions[planetIndex];

          if (oldPositionEntry || this.ogl.db.checkedSystems.indexOf(currentSystemRaw) > -1) {
            let oldPlayerEntry;

            if (oldPositionEntry && oldPositionEntry.playerID && oldPositionEntry.playerID > -1) {
              let oldPlayerIndex = this.ogl.find(this.ogl.db.players, 'id', oldPositionEntry.playerID)[0];
              oldPlayerEntry = this.ogl.db.players[oldPlayerIndex];

              if (
                oldPlayerEntry &&
                document.querySelector('.ogl_sideView.ogl_active') &&
                this.ogl.db.sidebarView == 'pinned' &&
                this.ogl.db.pinnedList[0] == oldPlayerEntry
              ) {
                refreshPinnedTarget = true;
              }
            } else if (this.ogl.db.checkedSystems.indexOf(currentSystemRaw) > -1) oldPlayerEntry = {};

            // prepare PTRE positions
            if (
              oldPositionEntry &&
              (planet.id != oldPositionEntry.id ||
                player.id != oldPositionEntry.playerID ||
                planet.moonID != oldPositionEntry.moonID)
            ) {
              if ((!oldPositionEntry?.playerID || oldPositionEntry?.playerID == -1) && player.id == -1) return;

              ptrePosition[planet.coords] = {};
              ptrePosition[planet.coords].id = planet.id;
              ptrePosition[planet.coords].teamkey = this.ogl.ptre;
              ptrePosition[planet.coords].galaxy = planet.coords.split(':')[0];
              ptrePosition[planet.coords].system = planet.coords.split(':')[1];
              ptrePosition[planet.coords].position = planet.coords.split(':')[2];
              ptrePosition[planet.coords].timestamp_ig = serverTime.getTime();

              ptrePosition[planet.coords].player_id = player.id;
              ptrePosition[planet.coords].name = player.name || false;
              ptrePosition[planet.coords].rank = player.rank || -1;
              ptrePosition[planet.coords].score = player.total || -1;
              ptrePosition[planet.coords].fleet = player.fleet || -1;
              ptrePosition[planet.coords].status = player.statusTags;

              ptrePosition[planet.coords].old_player_id = oldPositionEntry?.playerID || -1;
              ptrePosition[planet.coords].timestamp_api = oldPlayerEntry?.lastAPIUpdate || -1;
              ptrePosition[planet.coords].old_name = oldPlayerEntry?.name || false;
              ptrePosition[planet.coords].old_rank = oldPlayerEntry?.rank || -1;
              ptrePosition[planet.coords].old_score = oldPlayerEntry?.total || -1;
              ptrePosition[planet.coords].old_fleet = oldPlayerEntry?.fleet || -1;

              if (planet.moonID > -1) {
                ptrePosition[planet.coords].moon = {};
                ptrePosition[planet.coords].moon.id = planet.moonID;
              }
            }
          }
        }

        // save new player data
        if (player.id) {
          let playerEntryID = this.ogl.find(this.ogl.db.players, 'id', player.id)[0] ?? this.ogl.db.players.length;
          if (this.ogl.db.players[playerEntryID]?.id == -2) isOld = true;
          this.ogl.db.players[playerEntryID] = { ...this.ogl.db.players[playerEntryID], ...player };
        }

        planetIndex = planetIndex ?? this.ogl.db.positions.length;

        // unmark empty positions if needed
        if (this.ogl.db.positions[planetIndex]?.color) {
          if ((this.ogl.db.positions[planetIndex]?.id != planet.id && !isOld) || planet.id == -1) {
            planet.color = false;
          }
        }

        // save (or remove) new position data
        this.ogl.db.positions[planetIndex] = { ...this.ogl.db.positions[planetIndex], ...planet };
        if (planet.id == -1 || player.id == -1) {
          delete this.ogl.db.positions[planetIndex];
          this.ogl.db.positions.splice(planetIndex, 1);
        }

        // update targets list if needed
        if (document.querySelector('.ogl_sideView.ogl_active') && this.ogl.db.sidebarView == 'targetList') {
          document.querySelectorAll(`.ogl_sideView [data-playerID="${planet.playerID}"]`).forEach((e) => {
            if (player.id != -1) {
              e.querySelectorAll('div')[1].textContent = player.name;
              e.querySelectorAll('div')[1].className = '';
              e.querySelectorAll('div')[1].classList.add(player.status);
            } else e.remove();
          });
        }

        // prepare PTRE activities
        if (this.ogl.ptre && planet.id > -1 && player.id > -1 && this.ogl.db.pinnedList.indexOf(player.id) > -1) {
          ptreActivities[planet.coords] = {};
          ptreActivities[planet.coords].id = planet.id;
          ptreActivities[planet.coords].player_id = player.id;
          ptreActivities[planet.coords].teamkey = this.ogl.ptre;
          ptreActivities[planet.coords].mv = line.querySelector('span[class*="vacation"]') ? true : false;
          ptreActivities[planet.coords].activity = planet.activity;
          ptreActivities[planet.coords].galaxy = planet.coords.split(':')[0];
          ptreActivities[planet.coords].system = planet.coords.split(':')[1];
          ptreActivities[planet.coords].position = planet.coords.split(':')[2];
          ptreActivities[planet.coords].main = this.ogl.db.positions[planetIndex].main || false;

          if (planet.moonID > -1) {
            ptreActivities[planet.coords].moon = {};
            ptreActivities[planet.coords].moon.id = planet.moonID;
            ptreActivities[planet.coords].moon.activity = planet.moonActivity;
          }
        }
      });

      this.ogl.db.checkedSystems.push(currentSystemRaw);

      // this.ogl.saveAsync();

      // refresh pinned menu
      if (document.querySelector('.ogl_sideView.ogl_active') && this.ogl.db.sidebarView == 'pinned')
        refreshPinnedTarget = true;

      // send activities to PTRE
      if (Object.keys(ptreActivities).length > 0) {
        let tmpCoords = [galaxy, system];

        fetch('https://ptre.chez.gg/scripts/oglight_import_player_activity.php', {
          method: 'POST',
          body: JSON.stringify(ptreActivities),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.code == 1) {
              if (refreshPinnedTarget && this.ogl.component.sidebar) {
                new Promise((resolve) => {
                  resolve(this.ogl.component.sidebar.displayPinnedTarget());
                }).then(() => {
                  document
                    .querySelectorAll(`.ogl_pinnedContent [data-coords^="${tmpCoords[0]}:${tmpCoords[1]}:"]`)
                    .forEach((e) => {
                      if (!e.querySelector('.ogl_checked'))
                        e.appendChild(
                          Util.createDom(
                            'div',
                            { class: 'material-icons ogl_checked tooltipLeft', title: data.message },
                            'check_circle'
                          )
                        );
                    });
                });
              }
            }
          });
      } else if (refreshPinnedTarget) this.ogl.component.sidebar?.displayPinnedTarget(); // update position

      // send positions to PTRE
      if (Object.keys(ptrePosition).length > 0) {
        fetch('https://ptre.chez.gg/scripts/api_galaxy_import_infos.php?tool=oglight', {
          method: 'POST',
          body: JSON.stringify(ptrePosition),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.code != 1) console.log("Can't send data to PTRE");
            else {
              console.log('PTRE : ', currentSystemRaw, ptrePosition);
              if (
                document.querySelector('.ogl_sideView.ogl_active') &&
                this.ogl.db.sidebarView == 'pinned' &&
                this.ogl.db.pinnedList[0] == player.id
              )
                this.ogl.component.sidebar?.displayPinnedTarget();
            }
          });
      }
      performance.ogl.galaxyCrawlEnd = performance.now();
    }
  }

  getCurrentInfo(line) {
    let player = {};
    let planet = {};

    // update player data
    player.id =
      line.querySelector('.cellPlayerName').textContent.trim().length == 0
        ? -1
        : line.querySelector('.cellPlayerName [rel^="player"]')?.getAttribute('rel').replace('player', '') ||
          this.ogl.account.id;
    player.name =
      line.querySelector('.cellPlayerName [rel^="player"]')?.childNodes[0].textContent.trim() ||
      line.querySelector('.cellPlayerName .ownPlayerRow')?.textContent.trim();
    player.status = Array.from(line.querySelector('.cellPlayerName span[class*="status_"]')?.classList || []).filter(
      (e) => e.startsWith('status_')
    )[0];
    player.lastUpdate = serverTime.getTime();
    player.lastStatusUpdate = serverTime.getTime();

    if (player.status == 'status_abbr_honorableTarget') player.status = 'status_abbr_active';

    let status =
      line
        .querySelector('.cellPlayerName pre')
        ?.textContent.trim()
        .replace('(', '')
        .replace(')', '')
        .replace(/ /g, '')
        .replace('ph', '')
        .replace('A', '')
        .replace('o', '')
        .replace('f', '')
        .replace('d', '')
        .replace(',', '') || '';
    if (player.id == -1) status = -1;

    player.statusTags = status;

    let tooltip = document.querySelector('#player' + player.id);
    if (tooltip) {
      player.name = tooltip.querySelector('h1 span').textContent;
      player.rank = tooltip.querySelector('.rank a')?.textContent || -1;
    } else if (player.id > -1) {
      player.rank = this.ogl.account.rank;
    }

    let position = parseInt(line.querySelector('.cellPosition').textContent);
    let coords = `${document.querySelector('#galaxy_input').value}:${
      document.querySelector('#system_input').value
    }:${position}`;

    // update position
    planet.id = line.querySelector('[data-planet-id]')?.getAttribute('data-planet-id') || -1;
    planet.playerID =
      line.querySelector('.cellPlayerName').textContent.trim().length == 0
        ? -1
        : line.querySelector(`.cellPlayerName [rel^="player"]`)?.getAttribute('rel').replace('player', '') ||
          this.ogl.account.id;
    planet.coords = coords;
    planet.rawCoords = coords
      .split(':')
      .map((x) => x.padStart(3, '0'))
      .join('');
    planet.moonID = line.querySelector('[data-moon-id]')?.getAttribute('data-moon-id') || -1;
    planet.lastUpdate = serverTime.getTime();
    planet.activity = line.querySelector('[data-planet-id] .activity.minute15')
      ? '*'
      : line.querySelector('[data-planet-id] .activity')?.textContent.trim() || 60;
    planet.moonActivity = line.querySelector('[data-moon-id] .activity.minute15')
      ? '*'
      : line.querySelector('[data-moon-id] .activity')?.textContent.trim() || 60;

    return [player, planet];
  }

  buildStalkWindow(playerID) {
    let playerIndex = this.ogl.find(this.ogl.db.players, 'id', playerID)[0];
    let player = this.ogl.db.players[playerIndex];

    let content = Util.createDom('div', { class: 'galaxyTooltip' });
    content.innerHTML = `<h1><span>${player.name}</span><a href="https://${
      window.location.host
    }/game/index.php?page=highscore&site=${Math.max(1, Math.ceil(player.rank / 100))}&category=1&searchRelId=${
      player.id
    }" data-rank="${player.rank == -1 ? '(b)' : player.rank}" class="ogl_ranking">${
      player.rank == -1 ? '(b)' : '#' + player.rank
    }</a></h1>
        <div class="ogl_actions"></div>
        <div class="ogl_stalkActions"></div>
        <div class="ogl_colorAll"></div>
        <div class="ogl_stalkInfo">
            <div class="ogl_stalkPlanets"></div>
            <div class="ogl_stalkPoints">
                <div title="${Util.formatNumber(player.total)}"><i class="material-icons">star</i>${Util.formatToUnits(
      player.total
    )}</div>
                <div title="${Util.formatNumber(
                  player.eco
                )}"><i class="material-icons">attach_money</i>${Util.formatToUnits(player.eco)}</div>
                <div title="${Util.formatNumber(
                  player.tech
                )}"><i class="material-icons">science</i>${Util.formatToUnits(player.tech)}</div>
                <div title="${Util.formatNumber(
                  player.fleet
                )}"><i class="material-icons">military_tech</i>${Util.formatToUnits(player.fleet)}</div>
                <div title="${Util.formatNumber(
                  player.def
                )}"><i class="material-icons">security</i>${Util.formatToUnits(player.def)}</div>
            </div>
        </div>`;

    let actions = content.querySelector('.ogl_stalkActions');

    let write = actions.appendChild(
      Util.createDom('div', { class: 'ogl_button material-icons', 'data-playerid': player.id }, 'edit')
    );
    if (document.querySelector('#chatBar')) {
      write.classList.add('sendMail');
      write.classList.add('js_openChat');
    } else
      write.addEventListener(
        'click',
        () => (window.location.href = `https://${window.location.host}/game/index.php?page=chat&playerId=${player.id}`)
      );

    let buddy = actions.appendChild(Util.createDom('adiv', { class: 'ogl_button material-icons' }, 'person_add_alt_1'));
    buddy.addEventListener('click', () => {
      window.location.href = `https://${window.location.host}/game/index.php?page=ingame&component=buddies&action=7&id=${player.id}&ajax=1`;
    });

    let mmorpgstats = actions.appendChild(
      Util.createDom('adiv', { class: 'ogl_button material-icons' }, 'leaderboard')
    );
    mmorpgstats.addEventListener('click', () => {
      let lang = [
        'fr',
        'de',
        'en',
        'es',
        'pl',
        'it',
        'ru',
        'ar',
        'mx',
        'tr',
        'fi',
        'tw',
        'gr',
        'br',
        'nl',
        'hr',
        'sk',
        'cz',
        'ro',
        'us',
        'pt',
        'dk',
        'no',
        'se',
        'si',
        'hu',
        'jp',
        'ba',
      ].indexOf(this.ogl.universe.lang);

      let link = `https://www.mmorpg-stat.eu/0_fiche_joueur.php?pays=${lang}&ftr=${player.id.replace(
        /\D/g,
        ''
      )}.dat&univers=_${this.ogl.universe.number}`;
      window.open(link, '_blank');
    });

    let pin = actions.appendChild(Util.createDom('div', { class: 'ogl_button material-icons' }, 'push_pin'));
    pin.addEventListener('click', () => {
      this.ogl.db.pinnedList.forEach((e, index) => {
        if (e && e == player.id) this.ogl.db.pinnedList.splice(index, 1);
      });

      this.ogl.db.pinnedList.unshift(player.id);
      if (this.ogl.db.pinnedList.length > this.ogl.maxPinnedTargets)
        this.ogl.db.pinnedList.length = this.ogl.maxPinnedTargets;

      // this.ogl.saveAsync();

      this.ogl.component.sidebar?.displayPinnedTarget();
      this.ogl.component.crawler.checkPlayerApi(this.ogl.db.pinnedList[0]);
    });

    this.ogl.component.color.addColorUI(
      false,
      content.querySelector('.ogl_colorAll'),
      this.ogl.find(this.ogl.db.positions, 'playerID', player.id, true)
    );

    let planetCount = 0;
    let rawStart = '000000';
    let multi = 1;
    let isMulti = false;

    this.ogl.find(this.ogl.db.positions, 'playerID', player.id, true).forEach((planetIndex) => {
      let planet = this.ogl.db.positions[planetIndex];
      let splitted = planet.coords.split(':');

      let item = Util.createDom('div', { 'data-coords': planet.coords });
      let coordsDiv = item.appendChild(Util.createDom('span', {}, planet.coords));

      coordsDiv.addEventListener('click', () => {
        this.ogl.component.tooltip.close(true);
        this.ogl.component.galaxy.goToPosition(splitted[0], splitted[1], splitted[2]);
      });

      if (
        this.ogl.page == 'galaxy' &&
        document.querySelector('#galaxy_input').value == splitted[0] &&
        document.querySelector('#system_input').value == splitted[1]
      ) {
        coordsDiv.classList.add('ogl_currentSystem');
      }

      if (planet.main) item.appendChild(Util.createDom('div', { class: 'material-icons ogl_mainPlanet' }, 'star'));

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

      if (planet.moonID > 0) mSpy.classList.add('ogl_active');
      planet.color ? item.setAttribute('data-color', planet.color) : item.removeAttribute('data-color');

      content.querySelector('.ogl_stalkPlanets').appendChild(item);

      if (rawStart == planet.rawCoords.slice(0, -3)) {
        item.setAttribute('data-multi', multi);
        isMulti = true;
      } else if (isMulti) {
        multi++;
        isMulti = false;
      }

      rawStart = planet.rawCoords.slice(0, -3);

      planetCount++;
    });

    content
      .querySelector('.ogl_stalkPoints')
      .appendChild(Util.createDom('div', {}, `<i class="material-icons">language</i>${planetCount}`));

    return content;
  }

  getPlanetProduction() {
    let currentCoords = this.ogl.current.coords.join(':');

    ['metal', 'crystal', 'deut'].forEach((res, index) => {
      let data = resourcesBar.resources[res.replace('deut', 'deuterium')].tooltip;
      //let currentRes = Math.floor(resourcesBar.resources[res.replace('deut', 'deuterium')].amount);
      let prod = data.replace(/\./g, '').match(/\d+/g)[2];

      this.ogl.db.me.planets[currentCoords] = this.ogl.db.me.planets[currentCoords] || {};
      this.ogl.db.me.planets[currentCoords].production = this.ogl.db.me.planets[currentCoords].production || [];
      this.ogl.db.me.planets[currentCoords].storage = this.ogl.db.me.planets[currentCoords].storage || [];

      if (data.indexOf('overmark') == -1) {
        this.ogl.db.me.planets[currentCoords].production[index] = (prod / 3600).toFixed(2);
      }

      this.ogl.db.me.planets[currentCoords].storage[index] =
        resourcesBar.resources[res.replace('deut', 'deuterium')].storage;

      this.ogl.db.me.planets[currentCoords].production[3] = serverTime.getTime();
    });

    // this.ogl.saveAsync();
  }

  checkPlayerPtre(playerID, callback) {
    if (this.ogl.ptre) {
      Util.getJSON(
        `https://ptre.chez.gg/scripts/api_galaxy_get_infos.php?tool=oglight&team_key=${this.ogl.ptre}&player_id=${playerID}`,
        (ptreData) => {
          if (ptreData.code == 1) {
            let playerEntryID = this.ogl.find(this.ogl.db.players, 'id', playerID)[0] ?? this.ogl.db.players.length;
            this.ogl.db.players[playerEntryID] = this.ogl.db.players[playerEntryID] || {};
            this.ogl.db.players[playerEntryID].lastPTRECheck = serverTime.getTime();

            ptreData.galaxy_array.forEach((entry) => {
              let planet = {};
              planet.id = entry.id;
              planet.playerID = entry.player_id;
              planet.coords = entry.coords;
              planet.rawCoords = entry.coords
                .split(':')
                .map((x) => x.padStart(3, '0'))
                .join('');
              planet.moonID = entry.moon?.id ?? -1;
              planet.lastUpdate = entry.timestamp_ig;
              planet.activity = false;
              planet.moonActivity = false;

              let planetEntryID =
                this.ogl.find(this.ogl.db.positions, 'coords', planet.coords)[0] ?? this.ogl.db.positions.length;

              this.ogl.db.positions[planetEntryID] = this.ogl.db.positions[planetEntryID] || {};

              if (
                !this.ogl.db.positions[planetEntryID].lastUpdate ||
                this.ogl.db.positions[planetEntryID].lastUpdate < planet.lastUpdate
              ) {
                this.ogl.db.positions[planetEntryID] = { ...this.ogl.db.positions[planetEntryID], ...planet };
              }
            });

            // this.ogl.saveAsync();
          }

          if (callback) callback(playerID);
          if (
            document.querySelector('.ogl_sideView.ogl_active') &&
            this.ogl.db.sidebarView == 'pinned' &&
            this.ogl.db.pinnedList[0] == playerID
          )
            this.ogl.component.sidebar?.displayPinnedTarget();
        }
      );
    }
  }

  checkPlayerApi(playerID, callback, forced) {
    if (!playerID || playerID <= 0) return;

    let lastAPICheck = this.ogl.db.players[this.ogl.find(this.ogl.db.players, 'id', playerID)[0]]?.lastAPICheck || 0;
    let lastPTRECheck = this.ogl.db.players[this.ogl.find(this.ogl.db.players, 'id', playerID)[0]]?.lastPTRECheck || 0;

    if (serverTime.getTime() - lastAPICheck > 3 * 60 * 60 * 1000) {
      Util.getXML(`https://${window.location.host}/api/playerData.xml?id=${playerID}`, (result) => {
        let playerEntryID = this.ogl.find(this.ogl.db.players, 'id', playerID)[0] ?? this.ogl.db.players.length;

        let player = {};
        player.id = playerID;
        player.total = parseInt(result.querySelector('position[type="0"]').getAttribute('score'));
        player.eco = parseInt(result.querySelector('position[type="1"]').getAttribute('score'));
        player.tech = parseInt(result.querySelector('position[type="2"]').getAttribute('score'));
        player.power = parseInt(result.querySelector('position[type="3"]').getAttribute('score'));
        player.def = Math.max(player.power - (player.total - player.eco - player.tech), 0);
        player.fleet = player.power - player.def;
        player.ally = result.querySelector('alliance tag')?.textContent || false;
        player.lastAPICheck = serverTime.getTime();
        player.lastPTRECheck = serverTime.getTime();
        player.lastAPIUpdate = parseInt(result.querySelector('playerData').getAttribute('timestamp')) * 1000;
        player.name = result.querySelector('playerData').getAttribute('name');

        if (this.ogl.page == 'highscore')
          player.rank = document.querySelector(`#position${playerID} .position`)?.textContent.trim();

        if (this.ogl.db.players[playerEntryID]?.name && this.ogl.db.players[playerEntryID].name.indexOf('...') == -1) {
          player.name = this.ogl.db.players[playerEntryID].name;
        }

        this.ogl.db.players[playerEntryID] = { ...this.ogl.db.players[playerEntryID], ...player };

        // update player positions
        result.querySelectorAll('planet').forEach((apiPlanet, index) => {
          let planet = {};
          planet.id = apiPlanet.getAttribute('id');
          planet.playerID = playerID;
          planet.coords = apiPlanet.getAttribute('coords');
          planet.rawCoords = apiPlanet
            .getAttribute('coords')
            .split(':')
            .map((x) => x.padStart(3, '0'))
            .join('');
          planet.moonID = apiPlanet.querySelector('moon')?.getAttribute('id') ?? -1;
          planet.main = !index;
          planet.lastUpdate = parseInt(result.querySelector('playerData').getAttribute('timestamp')) * 1000;
          planet.lastAPIUpdate = parseInt(result.querySelector('playerData').getAttribute('timestamp')) * 1000;
          planet.activity = false;
          planet.moonActivity = false;

          let planetEntryID =
            this.ogl.find(this.ogl.db.positions, 'coords', planet.coords)[0] ?? this.ogl.db.positions.length;

          this.ogl.db.positions[planetEntryID] = this.ogl.db.positions[planetEntryID] || {};

          if (
            !this.ogl.db.positions[planetEntryID].lastUpdate ||
            this.ogl.db.positions[planetEntryID].lastUpdate < planet.lastUpdate
          ) {
            this.ogl.db.positions[planetEntryID] = { ...this.ogl.db.positions[planetEntryID], ...planet };
          }

          if (planet.main) this.ogl.db.positions[planetEntryID].main = true;
          else this.ogl.db.positions[planetEntryID].main = false;
        });

        // this.ogl.saveAsync();

        if (this.ogl.ptre) this.checkPlayerPtre(playerID, callback);
        else if (callback) callback(playerID, callback);
      });
    } else if (this.ogl.ptre && (forced || serverTime.getTime() - lastPTRECheck > 10 * 60 * 1000)) {
      this.checkPlayerPtre(playerID, callback);
    } else {
      if (callback) callback(playerID, callback);
    }
  }
}

export default CrawlerManager;
