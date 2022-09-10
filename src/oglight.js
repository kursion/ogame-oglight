import Util from './util.js';
import CrawlerManager from './managers/crawler-manager.js';
import LangManager from './managers/lang-manager.js';
import GalaxyManager from './managers/galaxy-manager.js';
import HighscoreManager from './managers/highscore-manager.js';
import FleetManager from './managers/fleet-manager.js';
import KeyboardManager from './managers/keyboard-manager.js';
import SidebarManager from './managers/sidebar-manager.js';
import TooltipManager from './managers/tooltip-manager.js';
import ColorManager from './managers/color-manager.js';
import TimeManager from './managers/time-manager.js';
import MessageManager from './managers/message-manager.js';
import MenuManager from './managers/menu-manager.js';
import PopupManager from './managers/popup-manager.js';
import JumpgateManager from './managers/jumpgate-manager.js';
import EmpireManager from './managers/empire-manager.js';
import './others.js';

performance.ogl = {};

// ogl
// #region
class OGLight {
  constructor(data) {
    //if(!document.body) document.location.reload();
    //document.body.classList.add('ogl_noPointer');

    if (!document.querySelector('#metal_box')?.getAttribute('title')) getAjaxResourcebox();

    this.perf = performance.now();
    this.mode = new URLSearchParams(window.location.search).get('ogl_mode') || 0; // 1:collect 2:raid 3:locked 4:linked
    this.page =
      new URL(window.location.href).searchParams.get('component') ||
      new URL(window.location.href).searchParams.get('page');
    this.ptre = localStorage.getItem('ogl-ptreTK') || false;
    this.ptre = this.ptre && this.ptre.indexOf('false') > -1 ? false : this.ptre;
    this.updateQueue = [];
    this.observerQueue = {};
    this.mutationList = {};
    this.observerExcludedID = [
      'tempcounter',
      'resources_metal',
      'resources_crystal',
      'resources_deuterium',
      'resources_darkmatter',
      'resources_energy',
      'promotionCountdown',
    ];
    this.observerExcludedClass = [
      'OGameClock',
      'textBeefy',
      'ogl_endTime',
      'planetlink',
      'moonlink',
      'ogl_stock',
      'ogl_resourcesSum',
      'ogl_panel',
      'ogl_metal',
      ,
      'ogl_crystal',
      'ogl_deut',
      'ogl_stats',
      'ogl_menuOptions',
    ];
    this.maxPinnedTargets = 30;
    this.observerTimers = [];
    this.galaxyLoaded = false;
    this.observer = new MutationObserver((mutations) => {
      (() => {
        let now = performance.now();

        for (let i = 0, len = mutations.length; i < len; i++) {
          let mutation = mutations[i];

          if (this.observerExcludedID.indexOf(mutation.target.id) > -1) return;
          if (
            mutation.target.className
              .trim()
              .split(' ')
              .filter((e) => this.observerExcludedClass.includes(e)).length > 0
          )
            return;

          /*if(mutation.target.id && mutation.target.id != "") console.log('#'+mutation.target.id+': '+(performance.now()-this.perf));
                    else if(mutation.target.className && mutation.target.className != "") console.log('.'+mutation.target.className+': '+(performance.now()-this.perf));
                    else console.log(mutation.target.outerHTML+': '+(performance.now()-this.perf));*/

          if (
            this.page == 'galaxy' &&
            (mutation.target.classList.contains('microplanet') ||
              mutation.target.classList.contains('planetMoveIcons') ||
              mutation.target.id == 'amountColonized') &&
            !this.galaxyLoaded &&
            document.querySelector('#galaxyLoading').style.display.trim() != ''
          ) {
            //console.log('System loaded : ', galaxy, system, ' | from : ', mutation.target.id || mutation.target.className)
            this.galaxyLoaded = true;
            this.galaxyCoords = [galaxy, system];
            this.mutationList['crawler'] = now;
            this.mutationList['galaxy'] = now;
          } else if (mutation.target.id == 'stat_list_content') {
            this.mutationList['crawler'] = now;
            this.mutationList['highscore'] = now;
          } else if (mutation.target.classList.contains('ui-tabs-panel')) {
            this.mutationList['messagesdate'] = now;
            this.mutationList['tablereport'] = now;
          } else if (mutation.target.id == 'technologydetails_content') {
            this.mutationList['details'] = now;
          } else if (mutation.target.classList.contains('ui-dialog-content')) {
            let dialogType = mutation.target.getAttribute('data-page');
            if (dialogType == 'jumpgatelayer') this.mutationList['jumpgate'] = now;
            else if (dialogType == 'phalanx') this.mutationList['tooltip'] = now;
            else if (dialogType == 'messages') this.mutationList['simbutton'] = now;
          } else if (mutation.target.id == 'eventboxContent') {
            this.mutationList['eventbox'] = now;
          } else if (
            mutation.target.className.indexOf('tooltip') &&
            !mutation.target.classList.contains('ogl_tooltipReady')
          ) {
            this.mutationList['tooltip'] = now;
          }
          /*else if(this.observerQueue['tooltip'])
                    {
                        this.mutationList['tooltip'] = now;
                    }*/
        }
      })();

      if (Object.keys(this.mutationList).length > 0) tryUpdate();
    });

    let tryUpdate = () => {
      Object.keys(this.mutationList).forEach((k) => {
        if (typeof this.observerQueue[k] === 'function') this.observerQueue[k]();
        delete this.mutationList[k];
      });
    };

    this.loop();
    window.addEventListener('beforeunload', () => this.save());

    this.observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

    this.shipCost = {
      202: [2000, 2000, 0],
      203: [6000, 6000, 0],
      204: [3000, 1000, 0],
      205: [6000, 4000, 0],
      206: [20000, 7000, 2000],
      207: [45000, 15000, 0],
      215: [30000, 40000, 15000],
      211: [50000, 25000, 15000],
      213: [60000, 50000, 15000],
      214: [5000000, 4000000, 1000000],
      218: [85000, 55000, 20000],
      219: [8000, 15000, 8000],
      209: [10000, 6000, 2000],
      210: [0, 1000, 0],
      212: [0, 2000, 500],
      208: [10000, 20000, 10000],
      217: [2000, 2000, 1000],
      401: [2000, 0, 0],
      402: [1500, 500, 0],
      403: [6000, 2000, 0],
      404: [20000, 15000, 2000],
      405: [5000, 3000, 0],
      406: [50000, 50000, 30000],
      407: [10000, 10000, 0],
      408: [50000, 50000, 0],
    };

    // player data
    this.account = {};
    this.account.id = document.querySelector('head meta[name="ogame-player-id"]').getAttribute('content');
    this.account.name = document.querySelector('head meta[name="ogame-player-name"]').getAttribute('content');
    this.account.rank = document.querySelector('#bar a[href*="page=highscore"').parentNode.textContent.match(/\d+/g)[0];
    this.account.planetCount = document.querySelector('#countColonies span').textContent.match(/\d+/g)[0];
    this.account.planetMax = document.querySelector('#countColonies span').textContent.match(/\d+/g)[1];
    this.account.class = document.querySelector('#characterclass .sprite').classList.contains('miner')
      ? 1
      : document.querySelector('#characterclass .sprite').classList.contains('warrior')
      ? 2
      : 3;
    this.account.totalResources = [0, 0, 0];
    this.account.totalProd = [0, 0, 0];
    this.account.planetsCount = document.querySelector('#countColonies .textCenter span').textContent;

    // universe data
    this.universe = {};
    this.universe.ecoSpeed = document.querySelector('head meta[name="ogame-universe-speed"]').getAttribute('content');
    this.universe.fleetSpeed = (
      document.querySelector('head meta[name="ogame-universe-speed-fleet-holding"]') ||
      document.querySelector('head meta[name="ogame-universe-speed-fleet"]')
    ).getAttribute('content');
    this.universe.name = document.querySelector('head meta[name="ogame-universe-name"]').getAttribute('content');
    this.universe.number = window.location.host.replace(/\D/g, '');
    this.universe.lang = document.querySelector('head meta[name="ogame-language"]').getAttribute('content');

    // current planet data
    this.current = {};
    this.current.smallplanet =
      document.querySelector('.smallplanet.hightlightPlanet') ||
      document.querySelector('.smallplanet.hightlightMoon') ||
      document.querySelector('.smallplanet');
    this.current.type = document.querySelector('head meta[name="ogame-planet-type"]').getAttribute('content');
    this.current.coords = this.current.smallplanet
      .querySelector('.planetlink .planet-koords')
      .textContent.slice(1, -1)
      .split(':');
    this.current.id = document.querySelector('head meta[name="ogame-planet-id"]').getAttribute('content');
    this.current.metal = Math.floor(resourcesBar.resources.metal.amount);
    this.current.crystal = Math.floor(resourcesBar.resources.crystal.amount);
    this.current.deut = Math.floor(resourcesBar.resources.deuterium.amount);
    this.current.energy = Math.floor(resourcesBar.resources.energy.amount);

    this.next = {};
    this.next.smallplanet = this.current.smallplanet.nextElementSibling || document.querySelectorAll('.smallplanet')[0];

    this.prev = {};
    this.prev.smallplanet =
      this.current.smallplanet.previousElementSibling ||
      document.querySelectorAll('.smallplanet')[document.querySelectorAll('.smallplanet').length - 1];

    if (document.querySelector('.moonlink')) {
      if (document.querySelectorAll('.moonlink').length > 1) {
        this.next.smallplanetWithMoon = this.next.smallplanet;
        if (!this.next.smallplanetWithMoon.querySelector('.moonlink')) {
          do
            this.next.smallplanetWithMoon =
              this.next.smallplanetWithMoon.nextElementSibling || document.querySelectorAll('.moonlink')[0].parentNode;
          while (!this.next.smallplanetWithMoon.querySelector('.moonlink'));
        }

        this.prev.smallplanetWithMoon = this.prev.smallplanet;
        if (!this.prev.smallplanetWithMoon.querySelector('.moonlink')) {
          do
            this.prev.smallplanetWithMoon =
              this.prev.smallplanetWithMoon.previousElementSibling ||
              document.querySelectorAll('.moonlink')[document.querySelectorAll('.moonlink').length - 1].parentNode;
          while (!this.prev.smallplanetWithMoon.querySelector('.moonlink'));
        }
      } else {
        this.next.smallplanetWithMoon = this.current.smallplanet;
        this.prev.smallplanetWithMoon = this.current.smallplanet;
      }
    }

    document
      .querySelector('#pageContent')
      .appendChild(
        Util.createDom(
          'div',
          { class: 'ogl_universeName' },
          `${this.universe.name}.${this.universe.lang}<div>x${this.universe.ecoSpeed} x${this.universe.fleetSpeed}</div>`
        )
      );
    document
      .querySelector('#bar ul')
      .appendChild(
        Util.createDom(
          'li',
          { class: 'ogl_planetsCount' },
          `${this.account.planetsCount}<span class="material-icons">language</span>`
        )
      );

    // ogl database
    this.DBName = `ogl_test_${this.universe.number}-${this.universe.lang}_${this.account.id}`;
    //this.db = this.DBName == localStorage.getItem('ogl_lastKeyUsed') && ogldb ? ogldb : JSON.parse(GM_getValue(this.DBName) || '{}');

    this.db = data || JSON.parse(GM_getValue(this.DBName) || '{}');
    this.db.players = this.db.players || [];
    this.db.positions = this.db.positions || [];
    this.db.stats = this.db.stats || { total: {} };
    this.db.loca = this.db.loca || {};
    this.db.ships = this.db.ships || {};
    this.db.me = this.db.me || {};
    this.db.me.techs = this.db.me.techs || {};
    this.db.me.planets = this.db.me.planets || {};
    this.db.myActivities = this.db.myActivities || {};
    this.db.pinnedList = this.db.pinnedList || [];
    this.db.spyProbesCount = this.db.spyProbesCount || 6;
    this.db.topScore = this.db.topScore || [0, 0];
    this.db.checkedSystems = this.db.checkedSystems || [];

    localStorage.setItem('ogl_lastKeyUsed', this.DBName);

    if (!this.db.ships?.[202] && this.page != 'fleetdispatch') {
      window.location.href = `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch`;
      return;
    }

    this.db.options = this.db.options || {};
    this.db.options.rval = this.db.options.rval || 300000 * this.universe.ecoSpeed;
    this.db.options.defaultShip = this.db.options.defaultShip || 202;
    this.db.options.defaultMission = this.db.options.defaultMission || 3;
    this.db.options.resSaver = this.db.options.resSaver || [0, 0, 0];
    this.db.options.spyFilter = this.db.options.spyFilter || '$';
    this.db.options.togglesOff = this.db.options.togglesOff || ['autoclean', 'fleetDetailsName'];
    this.db.options.excludedColors = this.db.options.excludedColors || [];
    this.db.options.targetFilter = this.db.options.targetFilter || [];
    this.db.options.dateFilter = this.db.options.dateFilter || 7;

    this.current.techs = this.db.me.planets[this.current.coords.join(':')]?.techs || {};

    this.checkTopScore();
    this.betterInputs();

    if (!this.db.dataFormat || this.db.dataFormat < 4) {
      let oldDB = JSON.parse(localStorage.getItem('ogl_redata') || '{}');
      if (oldDB.stalkList) {
        if (confirm('Do you want to import your V3 targets ?')) {
          for (let v of Object.values(oldDB.stalkList)) {
            let newObj = {};
            newObj.id = v.id;
            newObj.playerID = v.player;
            newObj.coords = v.coords;
            newObj.rawCoords = v.coords
              .split(':')
              .map((x) => x.padStart(3, '0'))
              .join('');
            newObj.moonID = v.moonID || -1;
            newObj.color = v.color;

            if (v.color && v.id == -1) {
              newObj.id = -2;
              newObj.playerID = -2;
            }

            let entryID = this.find(this.db.positions, 'coords', v.coords)[0] ?? this.db.positions.length;
            this.db.positions[entryID] = { ...this.db.positions[entryID], ...newObj };
          }
        }

        this.db.dataFormat = 4;
      } else this.db.dataFormat = 4;

      //this.saveAsync();
    }

    if (this.db.dataFormat < 5) {
      let tmpDB = [];
      this.db.positions.forEach((e) => {
        if (e.id != '-1') tmpDB.push(e);
      });
      this.db.positions = tmpDB;
      this.db.dataFormat = 5;
    }

    // ogl components
    this.component = {};
    this.component.lang = new LangManager(this);
    this.component.crawler = new CrawlerManager(this);
    this.component.galaxy = new GalaxyManager(this);
    this.component.highscore = new HighscoreManager(this);
    this.component.fleet = new FleetManager(this);
    this.component.keyboard = new KeyboardManager(this);
    this.component.sidebar = new SidebarManager(this);
    this.component.tooltip = new TooltipManager(this);
    this.component.color = new ColorManager(this);
    this.component.time = new TimeManager(this);
    this.component.message = new MessageManager(this);
    this.component.menu = new MenuManager(this);
    this.component.popup = new PopupManager(this);
    this.component.jumpgate = new JumpgateManager(this);
    this.component.empire = new EmpireManager(this);

    if (this.page == 'galaxy' && !this.galaxyLoaded) {
      document.querySelector('#amountColonized').textContent = document.querySelector('#amountColonized').textContent;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  findRaw(table, key, value) {
    const result = [];
    const isValid = (e) =>
      typeof e[key] !== typeof undefined && e[key].toString().toLowerCase() === value.toString().toLowerCase();

    for (let i = 0; i < table.length; i++) {
      let item = table[i];
      if (isValid(item)) result.push(item);
    }

    result.sort((a, b) => a.rawCoords - b.rawCoords);

    return result;
  }

  find(table, key, value, multipleResult) {
    /*this.cache = this.cache || {};
        const cacheID = (table == this.db.players ? 'players' : 'positions')+key+value;*/
    const result = [];
    const tmp = [];
    const lowerValue = value.toString().toLowerCase();
    const typeUndefined = typeof undefined;

    let isValid;
    if (key == 'coords' || key == 'rawCoords') isValid = (e) => e[key] === value;
    else isValid = (e) => typeof e[key] !== typeUndefined && e[key].toString().toLowerCase() === lowerValue;
    //table.filter(isValid).sort((a, b) => a.rawCoords - b.rawCoords).forEach(entry => result.push(table.indexOf(entry).toString()));

    /*if(key == 'coords' && !multipleResult)
        {
            let dictionary = Object.assign({}, ...table.map((x) => ({[x.coords]: x})));
            let index = table.indexOf(dictionary[value]);
            if(index > -1) result.push(index);
        }*/
    if (multipleResult) {
      for (let i = 0, len = table.length; i < len; i++) {
        let item = table[i];
        if (isValid(item)) {
          tmp.push(item);
        }
      }

      tmp
        .sort((a, b) => a.rawCoords - b.rawCoords)
        .forEach((entry) => {
          let index = table.indexOf(entry).toString();
          result.push(index);
        });
    } else {
      let index = table.findIndex(isValid);
      if (!isNaN(index) && index > -1) result.push(index);
    }

    return result;
  }

  getPositionsByCoords(sliced) {
    let table = this.db.positions;
    let result = {};
    const isValid = (e) => e.color && e.color != 'none' && this.db.options.excludedColors.indexOf(e.color) == -1;

    for (let i = 0, len = table.length; i < len; i++) {
      let item = table[i];
      let id = sliced ? item.rawCoords.slice(0, -3) : item.rawCoords;
      if (isValid(item)) {
        if (!result[id]) result[id] = [];
        result[id].push(item);
      }
    }

    return result;
  }

  getPositionsByPlayerId(id) {
    let table = this.db.positions;
    let result = {};
    const isValid = (e) => typeof e.playerID !== typeof undefined && e.playerID == id;

    for (let i = 0, len = table.length; i < len; i++) {
      let item = table[i];
      let id = item.playerID;
      if (isValid(item)) {
        if (!result[id]) result[id] = [];
        result[id].push(item);
      }
    }

    return result;
  }

  getPlayersById() {
    let table = this.db.players;
    let result = {};

    for (let i = 0, len = table.length; i < len; i++) {
      result[table[i].id] = table[i];
    }

    return result;
  }

  findTargets(table, key, min, max) {
    const result = [];
    const tmp = [];
    let isValid;
    isValid = (e) =>
      e.color &&
      e.color != 'none' &&
      parseInt(e[key]) >= parseInt(min) &&
      parseInt(e[key]) <= parseInt(max) &&
      this.db.options.excludedColors.indexOf(e.color) == -1;
    //else isValid = e => e.color && e.color != 'none' && parseInt(e[key]) >= parseInt(min) && parseInt(e[key]) <= parseInt(max) && this.db.options.excludedColors.indexOf(e.color) == -1 && e.status.indexOf('vacation') == -1;
    //table.filter(isValid).sort((a, b) => a.rawCoords - b.rawCoords).forEach(entry => result.push(table.indexOf(entry).toString()));

    for (let i = 0, len = table.length; i < len; i++) {
      let item = table[i];
      if (isValid(item)) {
        tmp.push(item);
      }
    }

    tmp
      .sort((a, b) => a.rawCoords - b.rawCoords)
      .forEach((entry) => {
        let index = table.indexOf(entry).toString();
        result.push(index);
      });

    return result;
  }

  saveObj(table, entry, newEntry) {
    let index = table.indexOf(entry).toString() ?? table.length;
    table[index] = { ...table[index], ...newEntry };
  }

  observeMutation(callback, id) {
    this.observerQueue[id] = callback;
  }

  addToUpdateQueue(callback) {
    this.updateQueue.push(callback);
  }

  async loop() {
    //this.updateQueue.forEach(callback => callback());
    setInterval(() => this.updateQueue.forEach((callback) => callback()), 500);
  }

  /*sleep()
    {
        return new Promise(resolve => setTimeout(resolve, 180));
    }*/

  betterInputs() {
    setInterval(() => {
      document.querySelectorAll('.ogl_input:not(.ogl_inputReady)').forEach((input) => {
        input.classList.add('ogl_inputReady');

        input.addEventListener('input', () => {
          setTimeout(() => input.dispatchEvent(new Event('change')), 10);
        });
        input.addEventListener('change', () => {
          if (input.value) {
            let newValue = parseInt(
              input.value
                .toLowerCase()
                .replace(/[\,\. ]/g, '')
                .replace('g', '000000000')
                .replace('m', '000000')
                .replace('k', '000')
            );
            input.value = isNaN(newValue) || newValue <= 0 ? 0 : newValue.toLocaleString('de-DE');
          }
        });
      });
    }, 300);
  }

  save(data) {
    if (data) this.db = data;
    GM_setValue(this.DBName, JSON.stringify(this.db));
    unsafeWindow.ogl = null;
    //oglIndexedDB.save(data || this.db);
  }

  saveAsync(data) {
    setTimeout(() => this.save(data));
  }

  checkTopScore() {
    if (this.db.topScore[1] < serverTime.getTime() - 86400000 / 2) {
      // check every 12h max
      fetch('https://' + window.location.host + '/api/serverData.xml')
        .then((result) => result.text())
        .then((txt) => {
          let parser = new DOMParser();
          let xmlResult = parser.parseFromString(txt, 'text/xml');
          this.db.topScore = [parseInt(xmlResult.querySelector('topScore').innerHTML), serverTime.getTime()];
          //this.saveAsync();
        });
    }
  }
}

export default OGLight;
