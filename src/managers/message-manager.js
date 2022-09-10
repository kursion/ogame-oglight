import Util from '../util.js';

class MessageManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.spyTable;
    this.dataList = [];
    this.tableReady = false;
    this.reportList = [];
    this.trashQueue = [];

    if (this.ogl.page == 'messages') {
      // check reports tab
      this.ogl.observeMutation(() => this.checkCurrentTab(), 'tablereport');

      // check opened message
      this.ogl.observeMutation(() => {
        let detail = document.querySelector('.detail_msg');

        if (detail && detail.getAttribute('data-message-type') == 10 && !detail.classList.contains('ogl_detailReady')) {
          detail.classList.add('ogl_detailReady');

          let apiKey = Util.createDom('div', {});
          //apiKey.innerHTML = detail.querySelector('.icon_apikey').getAttribute('data-tooltip') || detail.querySelector('.icon_apikey').getAttribute('title');
          apiKey.innerHTML = detail.querySelector('.icon_apikey').getAttribute('title');
          apiKey = apiKey.querySelector('input').value;

          let simButton = detail
            .querySelector('.msg_actions')
            .appendChild(Util.createDom('div', { class: 'icon_nf ogl_sim' }, 'S'));
          simButton.addEventListener('click', () => window.open(Util.genTrashsimLink(apiKey, this.ogl), '_blank'));

          if (this.ogl.ptre) {
            let ptreButton = detail
              .querySelector('.msg_actions')
              .appendChild(Util.createDom('div', { class: 'icon_nf ogl_sim tooltip', title: 'import to PTRE' }, 'P'));
            ptreButton.addEventListener('click', () => Util.importToPTRE(apiKey, this.ogl));
          }
        }
      }, 'simbutton');

      /*for(let i=0; i<10; i++)
            {
                $.post('?page=messages', {
                    tabid: 20,
                    pagination: i,
                    ajax: 1
                }, function (data) {
                    let parser = new DOMParser();
                    let xmlResult = parser.parseFromString(data, 'text/html');
                    console.log(xmlResult.querySelectorAll('.msg'))
                });
            }*/
    }
  }

  checkCurrentTab() {
    this.trashQueueProcessing = false;
    this.trashQueue = [];
    if (document.querySelectorAll('.msg').length < 1) return;

    let tokenInterval = setInterval(() => {
      this.tokenInput = document.querySelectorAll('[name="token"]')[0];
      if (!this.tokenInput) return;

      clearInterval(tokenInterval);

      let self = this;

      const { get, set } = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

      try {
        Object.defineProperty(this.tokenInput, 'value', {
          get() {
            return get.call(this);
          },
          set(newVal) {
            setTimeout(() => {
              /*console.log(newVal)
                            self.tokenReady = true;*/

              if (self.trashQueue.length > 0 && !self.trashQueueProcessing) {
                self.trashQueueProcessing = true;

                let id = self.trashQueue[0];
                let buttonSelector = document.querySelector(`[data-msg-id="${id}"] .js_actionKill`);

                if (buttonSelector && !buttonSelector.classList.contains('ogl_noPointer')) {
                  buttonSelector.click();

                  let line = self.spyTable?.querySelector(`[data-spy-id="${id}"]`);
                  if (line) {
                    if (line.nextSibling?.tagName == 'ASIDE') line.nextSibling.remove();

                    self.sum = self.sum || 0;
                    self.sum -= parseInt(line.getAttribute('data-renta'));

                    self.sumDetail = self.sumDetail || [0, 0, 0];
                    self.sumDetail[0] -= parseInt(line.getAttribute('data-metal'));
                    self.sumDetail[1] -= parseInt(line.getAttribute('data-crystal'));
                    self.sumDetail[2] -= parseInt(line.getAttribute('data-deut'));

                    self.calcTotal(self.sum, self.sumDetail, self.sumDetail[0] + self.sumDetail[1] + self.sumDetail[2]);
                    line.remove();

                    const isValid = (e) => e.id == id;

                    for (let i = 0, len = self.dataList.length; i < len; i++) {
                      let item = self.dataList[i];
                      if (isValid(item)) {
                        self.dataList.splice(i, 1);
                        break;
                      }
                    }
                  }
                } else this.value = newVal;

                self.tokenReady = true;
                self.trashQueue.shift();
              } else self.trashQueueProcessing = false;
            }, 50);

            return set.call(this, newVal);
          },
        });

        if (this.trashQueue.length > 0) this.tokenInput.value = this.tokenInput.value;
      } catch (e) {}
    }, 100);

    let tabID = ogame.messages.getCurrentMessageTab();

    if (tabID == 21) this.checkRaid();
    else if (tabID == 22) this.checkExpeditions();
    else if (tabID == 23) this.checkTransports();
    else if (tabID == 24) this.checkDebris();
    else if (tabID == 25) this.checkTrash();
    else if (tabID == 20) this.checkReports();

    if (this.spyTable) {
      if (tabID == 20) {
        this.spyTable.classList.remove('ogl_hidden');
        document.querySelector('#subtabs-nfFleetTrash .ogl_trash') &&
          document.querySelector('#subtabs-nfFleetTrash .ogl_trash').classList.remove('ogl_hidden');
      } else {
        this.spyTable.classList.add('ogl_hidden');
        document.querySelector('#subtabs-nfFleetTrash .ogl_trash') &&
          document.querySelector('#subtabs-nfFleetTrash .ogl_trash').classList.add('ogl_hidden');
      }
    }
  }

  checkTrash() {
    this.reviveReady = true;

    // ogame bug fix
    document.querySelectorAll('.msg .js_actionRevive').forEach((button) => {
      button.classList.remove('js_actionRevive');
      button.addEventListener('click', () => {
        if (!this.reviveReady) {
          setTimeout(() => button.click(), 150);
          return;
        }

        let msg = button.closest('.msg');
        let id = msg.getAttribute('data-msg-id');
        let tokenMsg = document.querySelectorAll('[name="token"]')[0].getAttribute('value');

        this.reviveReady = false;

        $.ajax({
          type: 'POST',
          url: '?page=messages',
          dataType: 'json',
          data: {
            ajax: 1,
            token: tokenMsg,
            messageId: id,
            action: 104,
          },
        })
          .done((result) => {
            if (result[id] == true && result.newAjaxToken) {
              msg.remove();
              document.querySelectorAll('[name="token"]').forEach((e) => e.setAttribute('value', result.newAjaxToken));
              ogame.messages.token = result.newAjaxToken;

              this.reviveReady = true;
            }
          })
          .fail((result) => {
            console.log('bug, please refresh');
            this.reviveReady = true;
          });
      });
    });
  }

  checkRaid() {
    let messages = document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_raidDone)');

    if (
      messages.length > 0 &&
      messages.length !=
        document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_raidDone) .msg_date.ogl_timeZone')
          .length
    ) {
      setTimeout(() => this.checkRaid(), 100);
      return;
    }

    let urls = [];

    messages.forEach((message) => {
      let content = message.querySelector('.msg_content');

      if (!message.querySelector('.ogl_timeZone')) return;
      message.classList.add('ogl_raidDone');
      if (!content.querySelector('.msg_ctn2')) return;

      if (document.querySelector('#subtabs-nfFleetTrash.ui-state-active')) return;

      let id = message.getAttribute('data-msg-id');

      urls.push(`https://${window.location.host}/game/index.php?page=messages&messageId=${id}&tabid=21&ajax=1`);
    });

    Promise.all(urls.map((url) => fetch(url).then((response) => response.text())))
      .then((texts) => {
        texts.forEach((data) => {
          let report = {};
          let result = new DOMParser().parseFromString(data, 'text/html');
          let id = result.querySelector('.detail_msg').getAttribute('data-msg-id');
          let message = document.querySelector(`.msg[data-msg-id="${id}"]`);

          let date = new Date(parseInt(message.querySelector('.msg_date').getAttribute('data-servertime')));
          let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();

          let htmlReport = result.getElementsByClassName('detail_msg')[0].innerHTML;
          let json = JSON.parse(
            htmlReport.substring(htmlReport.search('var combatData') + 35, htmlReport.search('var attackerJson') - 12)
          );

          let loot = [json.loot.metal, json.loot.crystal, json.loot.deuterium];
          let renta = [0, 0, 0];
          let loss = [0, 0, 0];

          let fleetID = [];
          let leftSide = false;

          Object.values(json.attackerJSON.member).forEach((v) => {
            if (v && v.ownerID == this.ogl.account.id) fleetID.push(v.fleetID);
          });
          if (fleetID.length > 0) leftSide = true;

          Object.values(json.defenderJSON.member).forEach((v) => {
            if (v && v.ownerID == this.ogl.account.id) fleetID.push(v.fleetID);
          });

          let atkRounds = json.attackerJSON.combatRounds;
          let defRounds = json.defenderJSON.combatRounds;

          fleetID.forEach((fleet) => {
            if (defRounds[defRounds.length - 1].losses && defRounds[defRounds.length - 1].losses[fleet]) {
              for (let [k, v] of Object.entries(defRounds[defRounds.length - 1].losses[fleet])) {
                let lossValue = this.ogl.shipCost[k].map((x) => x * v);
                loss = loss.map((x, i) => parseInt(x) + parseInt(lossValue[i]));
              }
            }

            if (atkRounds[atkRounds.length - 1].losses && atkRounds[atkRounds.length - 1].losses[fleet]) {
              for (let [k, v] of Object.entries(atkRounds[atkRounds.length - 1].losses[fleet])) {
                let lossValue = this.ogl.shipCost[k].map((x) => x * v);
                loss = loss.map((x, i) => parseInt(x) + parseInt(lossValue[i]));
              }
            }
          });

          if (json.defender[0] && json.defender[0].ownerID == this.ogl.account.id) {
            for (let [k, v] of Object.entries(json.repairedDefense)) {
              let repairedValue = this.ogl.shipCost[k].map((x) => x * v);
              loss = loss.map((x, i) => parseInt(x) - parseInt(repairedValue[i]));
            }
          }

          if (leftSide) renta = renta.map((x, i) => parseInt(x) - loss[i] + loot[i]);
          else renta = renta.map((x, i) => parseInt(x) - loss[i] - loot[i]);

          let line = Util.createDom('div', { class: 'ogl_expeResult' });
          ['metal', 'crystal', 'deut'].forEach((r, index) => {
            report[r] = renta[index];
            line.appendChild(Util.createDom('div', { class: `ogl_${r}` }, Util.formatToUnits(renta[index] || '0')));
          });

          message.prepend(line);

          let target = json.coordinates.position == 16 ? 'expe' : 'raid';

          this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] || {
            idList: [],
            expe: {},
            raid: {},
            expeOccurences: {},
            raidOccuences: 0,
            consumption: 0,
          };
          this.ogl.db.stats.ignored = this.ogl.db.stats.ignored || {};
          this.ogl.db.stats.total = this.ogl.db.stats.total || {};

          let saveReport = () => {
            this.ogl.db.stats.total[target] = this.ogl.db.stats.total[target] || {};

            if (this.ogl.db.stats[midnight].idList.indexOf(id) == -1 && !this.ogl.db.stats.ignored[id]) {
              this.ogl.db.stats[midnight].idList.push(id);

              for (let [k, v] of Object.entries(report)) {
                this.ogl.db.stats[midnight][target][k] = (this.ogl.db.stats[midnight][target][k] || 0) + v;
                this.ogl.db.stats.total[target][k] = (this.ogl.db.stats.total[target][k] || 0) + v;
              }

              if (target == 'expe') {
                this.ogl.db.stats[midnight].expeOccurences['fight'] =
                  (this.ogl.db.stats[midnight].expeOccurences['fight'] || 0) + 1;
                this.ogl.db.stats.total.expeOccurences['fight'] =
                  (this.ogl.db.stats.total.expeOccurences['fight'] || 0) + 1;

                this.ogl.db.stats[midnight].expeOccurences['none'] =
                  (this.ogl.db.stats[midnight].expeOccurences['none'] || 0) - 1;
                this.ogl.db.stats.total.expeOccurences['none'] =
                  (this.ogl.db.stats.total.expeOccurences['none'] || 0) - 1;
              } else {
                this.ogl.db.stats[midnight].raidOccuences = (this.ogl.db.stats[midnight].raidOccuences || 0) + 1;
                this.ogl.db.stats.total.raidOccuences = (this.ogl.db.stats.total.raidOccuences || 0) + 1;
              }
            }
          };

          saveReport();

          // ignore button
          if (target == 'raid') {
            let ignore = line.appendChild(
              Util.createDom('div', {
                class: 'ogl_button ogl_ignoreRaid material-icons tooltip',
                title: this.ogl.component.lang.getText('ignoreRaid'),
              })
            );
            if (this.ogl.db.stats.ignored[id]) ignore.classList.add('ogl_active');
            ignore.addEventListener('click', () => {
              if (this.ogl.db.stats.ignored[id]) {
                delete this.ogl.db.stats.ignored[id];
                ignore.classList.remove('ogl_active');
              } else {
                ignore.classList.add('ogl_active');
                let index = this.ogl.db.stats[midnight].idList.indexOf(id);
                this.ogl.db.stats[midnight].idList.splice(index, 1);
                this.ogl.db.stats.ignored[id] = serverTime.getTime();

                for (let [k, v] of Object.entries(report)) {
                  this.ogl.db.stats[midnight][target][k] = (this.ogl.db.stats[midnight][target][k] || 0) - v;
                  this.ogl.db.stats.total[target][k] = (this.ogl.db.stats.total[target][k] || 0) - v;
                }
              }

              saveReport();
              // this.ogl.saveAsync();
              this.ogl.component.empire.addStats();
            });
          }
        });

        // this.ogl.saveAsync();
        this.ogl.component.empire.addStats();
      })
      .catch((error) => console.log(`Failed to fetch combat report : ${error}`));
  }

  checkExpeditions() {
    let messages = document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_expeditionDone)');

    if (
      messages.length > 0 &&
      messages.length !=
        document.querySelectorAll(
          '#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_expeditionDone) .msg_date.ogl_timeZone'
        ).length
    ) {
      setTimeout(() => this.checkExpeditions(), 100);
      return;
    }

    this.messagePending = [];

    messages.forEach((message, messageIndex) => {
      if (!message.querySelector('.ogl_timeZone')) return;
      message.classList.add('ogl_expeditionDone');

      if (document.querySelector('#subtabs-nfFleetTrash.ui-state-active')) return;

      setTimeout(() => {
        let id = message.getAttribute('data-msg-id');
        let date = new Date(parseInt(message.querySelector('.msg_date').getAttribute('data-servertime')));
        let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
        let type = 'none';
        let typeList = [
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
          217,
          218,
          219,
        ];

        this.messagePending.push(id);

        let result = {};

        typeList.forEach((typeID) => {
          if (message.textContent.indexOf(this.ogl.component.lang.getText(typeID)) > -1) {
            if (!isNaN(typeID)) type = 'ships';
            else if (typeID == 'metal' || typeID == 'crystal' || typeID == 'deut') type = 'resources';
            else if (typeID == 'dm') type = 'dm';
            result[typeID] = this.getExpeValue(this.ogl.component.lang.getText(typeID), message);
          }

          if (result[typeID] == -1) {
            type = 'none';
            delete result[typeID];
          }
        });

        if (message.querySelector('a.itemLink')) {
          type = 'item';
          result.item = 1;
        }

        message
          .querySelector('.msg_content')
          .prepend(Util.createDom('div', { class: 'ogl_expeResult' }, type.replace('none', '-')));

        this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] || {
          idList: [],
          expe: {},
          raid: {},
          expeOccurences: {},
          raidOccuences: 0,
          consumption: 0,
        };

        if (this.ogl.db.stats[midnight].idList.indexOf(id) == -1) {
          this.ogl.db.stats[midnight].idList.push(id);
          this.ogl.db.stats.total.expe = this.ogl.db.stats.total.expe || {};
          this.ogl.db.stats.total.expeOccurences = this.ogl.db.stats.total.expeOccurences || {};

          for (let [k, v] of Object.entries(result)) {
            this.ogl.db.stats[midnight].expe[k] = (this.ogl.db.stats[midnight].expe[k] || 0) + v;
            this.ogl.db.stats.total.expe[k] = (this.ogl.db.stats.total?.expe?.[k] || 0) + v;
          }

          this.ogl.db.stats[midnight].expeOccurences[type] =
            (this.ogl.db.stats[midnight].expeOccurences[type] || 0) + 1;
          this.ogl.db.stats.total.expeOccurences[type] = (this.ogl.db.stats.total.expeOccurences[type] || 0) + 1;
        }

        if (this.messagePending.length == messages.length) {
          // this.ogl.saveAsync();
          this.ogl.component.empire.addStats();
        }
      }, messageIndex * 5);
    });
  }

  checkDebris() {
    let messages = document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_debrisDone)');

    if (
      messages.length > 0 &&
      messages.length !=
        document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_debrisDone) .msg_date.ogl_timeZone')
          .length
    ) {
      setTimeout(() => this.checkDebris(), 100);
      return;
    }

    messages.forEach((message) => {
      if (!message.querySelector('.ogl_timeZone')) return;
      message.classList.add('ogl_debrisDone');

      if (!message.querySelector('.icon_apikey') && message.querySelector('.msg_head').textContent.indexOf(':17]') < 0)
        return;

      let content = message.querySelector('.msg_content');
      let regex = new RegExp('\\' + LocalizationStrings.thousandSeperator, 'g');

      let id = message.getAttribute('data-msg-id');
      let date = new Date(parseInt(message.querySelector('.msg_date').getAttribute('data-servertime')));
      let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();

      let report = {};

      let numList = content.textContent.replace(regex, '').match(/\d+/g);
      let target = parseInt(numList[numList.length - 3]) == 16 ? 'expe' : 'raid';

      if (!message.querySelector('.icon_apikey')) {
        report.dm = parseInt(numList[numList.length - 2]);
        message.prepend(
          Util.createDom(
            'div',
            { class: 'ogl_expeResult' },
            `Renta: ${report.DM} ${this.ogl.component.lang.getText('DM')}`
          )
        );
      } else {
        report.metal = parseInt(numList[numList.length - 2]);
        report.crystal = parseInt(numList[numList.length - 1]);
        report.deut = 0;
        message.prepend(
          Util.createDom(
            'div',
            { class: 'ogl_expeResult' },
            `Renta: ${Util.formatToUnits(report.metal)} | ${Util.formatToUnits(report.crystal)} | ${Util.formatToUnits(
              report.deut
            )}`
          )
        );
      }

      this.ogl.db.stats[midnight] = this.ogl.db.stats[midnight] || {
        idList: [],
        expe: {},
        raid: {},
        expeOccurences: {},
        raidOccuences: 0,
        consumption: 0,
      };
      this.ogl.db.stats.total = this.ogl.db.stats.total || {};

      if (this.ogl.db.stats[midnight].idList.indexOf(id) == -1) {
        this.ogl.db.stats[midnight].idList.push(id);
        this.ogl.db.stats.total.expe = this.ogl.db.stats.total.expe || {};
        this.ogl.db.stats.total.expeOccurences = this.ogl.db.stats.total.expeOccurences || {};

        for (let [k, v] of Object.entries(report)) {
          this.ogl.db.stats[midnight][target][k] = (this.ogl.db.stats[midnight][target][k] || 0) + v;
          this.ogl.db.stats.total[target][k] = (this.ogl.db.stats.total[target][k] || 0) + v;
        }

        /*if(target == 'expe')
                {
                    this.ogl.db.stats[midnight].expeOccurences['resources'] = (this.ogl.db.stats[midnight].expeOccurences['resources'] || 0) + 1;
                    this.ogl.db.stats.total.expeOccurences['resources'] = (this.ogl.db.stats.total.expeOccurences['resources'] || 0) + 1;
                }*/
      }
    });

    // this.ogl.saveAsync();
    this.ogl.component.empire.addStats();
  }

  checkReports() {
    if (document.querySelector('#subtabs-nfFleetTrash.ui-state-active')) return;
    if (this.ogl.db.options.togglesOff.indexOf('spytable') > -1) return;

    this.dataList = [];
    this.reportList = [];
    if (this.spyTable) this.spyTable.remove();

    if (!document.querySelector('#subtabs-nfFleetTrash .ogl_trash')) {
      let deleteSpyDef = document.querySelector('#subtabs-nfFleetTrash').appendChild(
        Util.createDom(
          'div',
          {
            class: 'material-icons ogl_button ogl_trash tooltip',
            title: this.ogl.component.lang.getText('deleteSpyDef'),
          },
          'visibility_off'
        )
      );
      deleteSpyDef.addEventListener('click', () => {
        document.querySelectorAll('.msg').forEach((e) => {
          let id = e.getAttribute('data-msg-id');
          if (e.querySelector('.espionageDefText') && this.trashQueue.indexOf(id) == -1) this.trashQueue.push(id);
          if (this.trashQueue.length == 1) this.tokenInput.value = this.tokenInput.value;
        });
      });
    }

    let messages = document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_ready)');
    if (
      messages.length > 0 &&
      messages.length !=
        document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_ready) .msg_date.ogl_timeZone')
          .length
    ) {
      setTimeout(() => this.checkReports(), 100);
      return;
    }

    let positionsList = this.ogl.getPositionsByCoords();

    if (this.ogl.ptre) {
      let ptreJSON = {};

      messages.forEach((report) => {
        if (report.querySelector('.espionageDefText')) {
          let id = report.getAttribute('data-msg-id');
          let tmpHTML = Util.createDom(
            'div',
            {},
            report.querySelector('span.player').getAttribute('title') ||
              report.querySelector('span.player').getAttribute('data-title')
          );
          let playerID = tmpHTML.querySelector('[data-playerId]').getAttribute('data-playerId');
          let a = report.querySelector('.espionageDefText a');
          let params = new URLSearchParams(a.getAttribute('href'));
          let coords = [params.get('galaxy') || '0', params.get('system') || '0', params.get('position') || '0'];
          let type = a.querySelector('figure.moon') ? 3 : 1;
          let timestamp = report.querySelector('.msg_date.ogl_timeZone').getAttribute('data-servertime');

          ptreJSON[id] = {};
          ptreJSON[id].player_id = playerID;
          ptreJSON[id].teamkey = this.ogl.ptre;
          ptreJSON[id].galaxy = coords[0];
          ptreJSON[id].system = coords[1];
          ptreJSON[id].position = coords[2];
          ptreJSON[id].spy_message_ts = timestamp;
          ptreJSON[id].moon = {};

          if (type == 1) {
            ptreJSON[id].activity = '*';
            ptreJSON[id].moon.activity = '60';
          } else {
            ptreJSON[id].activity = '60';
            ptreJSON[id].moon.activity = '*';
          }
        }
      });

      if (Object.keys(ptreJSON).length > 0) {
        fetch('https://ptre.chez.gg/scripts/oglight_import_player_activity.php', {
          method: 'POST',
          body: JSON.stringify(ptreJSON),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.code != 1) {
              console.log('error', data);
            }
          });
      }
    }

    // prevent the user to spam click on the same delete button
    document
      .querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_ready) .js_actionKill')
      .forEach((button) => {
        button.addEventListener('click', () => button.classList.add('ogl_noPointer'));
      });

    /*document.querySelectorAll('.msg .js_actionKill').forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                document.querySelectorAll('.msg .js_actionKill').forEach(e => e.classList.add('ogl_noPointer'));
                //button.classList.add('ogl_noPointer')
                let interval = setInterval(() =>
                {
                    let token = document.querySelectorAll('[name="token"]')[0].getAttribute('value');
                    if(token != this.oldToken)
                    {
                        this.oldToken = token;
                        clearInterval(interval);
                        document.querySelectorAll('.msg .js_actionKill').forEach(e => e.classList.remove('ogl_noPointer'));
                    }
                }, 300);
            });
        });*/

    // ogame bug fix
    //this.killReady = true;

    /*document.querySelectorAll('.msg .js_actionKill').forEach(button =>
        {
            button.classList.remove('js_actionKill');
            button.addEventListener('click', () =>
            {
                if(!this.killReady)
                {
                    setTimeout(() => button.click(), 150);
                    return;
                }

                let msg = button.closest('.msg');
                let id = msg.getAttribute('data-msg-id');
                let token = document.querySelectorAll('[name="token"]')[0].getAttribute('value');

                this.killReady = false;

                $.ajax(
                {
                    type:'POST',
                    url:'?page=messages',
                    dataType:'json',
                    data:
                    {
                        ajax:1,
                        token:token,
                        tabid:ogame.messages.getCurrentMessageTab(),
                        messageId:id,
                        action:103
                    }
                }).done(result =>
                {
                    if(result[id] == true && result.newAjaxToken)
                    {
                        msg.remove();
                        document.querySelectorAll('[name="token"]').forEach(e => e.setAttribute('value', result.newAjaxToken));
                        //ogame.messages.token = result.newAjaxToken;
                        this.killReady = true;

                        let line = this.spyTable?.querySelector(`[data-spy-id="${id}"]`);

                        if(line)
                        {
                            if(line.nextSibling?.tagName == 'ASIDE')
                            {
                                line.nextSibling.remove();
                            }

                            this.sum = this.sum || 0;
                            this.sum -= parseInt(line.getAttribute('data-renta'));

                            this.sumDetail = this.sumDetail || [0, 0, 0];
                            this.sumDetail[0] -= parseInt(line.getAttribute('data-metal'));
                            this.sumDetail[1] -= parseInt(line.getAttribute('data-crystal'));
                            this.sumDetail[2] -= parseInt(line.getAttribute('data-deut'));

                            this.calcTotal(this.sum, this.sumDetail, this.sumDetail[0] + this.sumDetail[1] + this.sumDetail[2]);
                            line.remove();
                        }

                        const isValid = e => e.id == id;

                        for(let i=0, len=this.dataList.length; i<len; i++)
                        {
                            let item = this.dataList[i];
                            if(isValid(item))
                            {
                                this.dataList.splice(i, 1);
                                break;
                            }
                        }
                    }
                }).fail(result =>
                {
                    console.log('bug, please refresh');
                    this.killReady = true;
                });
            });
        });*/

    messages.forEach((report, index) => {
      let id = report.getAttribute('data-msg-id');
      report.classList.add('ogl_ready');
      if (this.reportList.indexOf(id) > -1) return;
      if (report.closest('#fleettrashmessagespage')) return;

      let params = new URLSearchParams(report.querySelector('.msg_head a')?.href);
      let compacting = report.querySelectorAll('.compacting');

      if (
        (compacting.length > 0 && !compacting[3].querySelector('.resspan')) ||
        !report.querySelector('.msg_title a')
      ) {
        if (this.trashQueue.indexOf(id) == -1) this.trashQueue.push(id);
      } else if (compacting.length > 0 && compacting[3].querySelector('.resspan')) {
        this.reportList.push(id);

        let typeList = ['metal', 'crystal', 'deut', 'dm'];

        typeList.forEach((typeID) => {
          let regex = new RegExp(`<span class="resspan">${this.ogl.component.lang.getText(typeID)}:`, 'g');
          report.querySelector('.msg_content').innerHTML = report
            .querySelector('.msg_content')
            .innerHTML.replace(
              regex,
              `<span class="resspan" data-type="${typeID}"><span>${this.ogl.component.lang.getText(typeID)}:</span>`
            );
        });

        /*let time = report.querySelector('.msg_date').textContent.replace(/ \.$/, '');
                time = time.trim().replace(/[ \.]/g, ':').split(':');
                time.forEach((t, index) => time[index] = t.padStart(2, '0'));*/

        /*let newTime = new Date(`${time[2]}-${time[1]}-${time[0]}T${time[3]}:${time[4]}:${time[5]}`).getTime();
                newTime = new Date(newTime - Math.round(timeDiff / 100000) * 100000);*/

        /*let date = report.querySelector('.msg_date').textContent.replace(/ \.$/, ' ').replace(/\./g, ':').replace(/ /g, ':').split(':');
                let formated = Date.parse(`${date[1]}/${date[0]}/${date[2]} ${date[3]}:${date[4]}:${date[5]}`);*/

        let data = {};
        data.id = report.getAttribute('data-msg-id');
        data.date = report.querySelector('.msg_date').getAttribute('data-servertime');
        data.clientDate = report.querySelector('.msg_date').getAttribute('data-clienttime');
        data.status = compacting[0].querySelectorAll('span[class^="status"]')[0].className;
        data.name = compacting[0]
          .querySelectorAll('span[class^="status"]')[0]
          .textContent.replace(/&nbsp;/g, '')
          .trim();
        data.coords = [params.get('galaxy') || '0', params.get('system') || '0', params.get('position') || '0'];
        data.tmpCoords = data.coords.map((x) => x.padStart(3, '0')).join('');
        data.type = report.querySelector('.msg_head figure.moon') ? 3 : 1;
        //data.color = (this.ogl.db.positions[this.ogl.find(this.ogl.db.positions, 'coords', data.coords.join(':'))] || {}).color;
        data.color = positionsList[data.tmpCoords]?.[0]?.color;
        data.activityColor =
          compacting[0].querySelectorAll('span.fright')[0].querySelector('font') &&
          compacting[0].querySelectorAll('span.fright')[0].querySelector('font').getAttribute('color');
        data.activity = compacting[0].querySelectorAll('span.fright')[0].textContent
          ? parseInt(compacting[0].querySelectorAll('span.fright')[0].textContent.match(/\d+/)[0])
          : -1;
        data.resources = [
          Util.formatFromUnits(compacting[3].querySelectorAll('.resspan')[0].textContent.replace(/(\D*)/, '')),
          Util.formatFromUnits(compacting[3].querySelectorAll('.resspan')[1].textContent.replace(/(\D*)/, '')),
          Util.formatFromUnits(compacting[3].querySelectorAll('.resspan')[2].textContent.replace(/(\D*)/, '')),
        ];
        data.total = data.resources.reduce((sum, x) => sum + x);
        data.loot =
          parseInt(compacting[4].querySelector('.ctn').textContent.replace(/(\D*)/, '').replace(/%/, '')) / 100;
        data.renta = Math.ceil(data.total * data.loot);
        data.fleet =
          compacting[5].querySelectorAll('span').length > 0
            ? Util.formatFromUnits(
                compacting[5].querySelectorAll('span.ctn')[0].textContent.replace(/(\D*)/, '').split(' ')[0]
              )
            : -1;
        data.defense =
          compacting[5].querySelectorAll('span').length > 1
            ? Util.formatFromUnits(
                compacting[5].querySelectorAll('span.ctn')[1].textContent.replace(/(\D*)/, '').split(' ')[0]
              )
            : -1;
        data.attacked = report.querySelector('.msg_actions .icon_attack img') ? true : false;
        data.trash = report.querySelector('.msg_head .fright a .icon_refuse');
        data.detail = report.querySelector('.msg_actions a.fright').href;
        data.spy = report.querySelector('a[onclick*="sendShipsWithPopup"]').getAttribute('onclick');
        data.attack = report.querySelector('.icon_attack').closest('a').href;
        data.api = report.querySelector('.icon_apikey');
        data.dom = report;

        if (
          data.renta < this.ogl.db.options.rval &&
          data.fleet == 0 &&
          this.ogl.db.options.togglesOff.indexOf('autoclean') == -1
        ) {
          if (this.trashQueue.indexOf(data.id) == -1) this.trashQueue.push(data.id);
        } else {
          this.dataList.push(data);
        }
      }
    });

    if (this.dataList.length > 0) {
      setTimeout(() => this.buildSpyTable());
    }
  }

  checkTransports() {
    let messages = document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_transpoDone)');

    if (
      messages.length > 0 &&
      messages.length !=
        document.querySelectorAll('#ui-id-2 div[aria-hidden="false"] .msg:not(.ogl_transpoDone) .msg_date.ogl_timeZone')
          .length
    ) {
      setTimeout(() => this.checkTransports(), 100);
      return;
    }

    messages.forEach((message) => {
      if (!message.querySelector('.ogl_timeZone')) return;
      message.classList.add('ogl_transpoDone');

      let typeList = ['metal', 'crystal', 'deut', 'dm'];
      let regex = new RegExp(
        `${this.ogl.component.lang.getText(typeList[0])}[ ]?:[ ]?(.*?) ${this.ogl.component.lang.getText(typeList[1])}`,
        'g'
      );
      message.innerHTML = message.innerHTML
        .replace(/&nbsp;/g, ' ')
        .trim()
        .replace(
          regex,
          `${this.ogl.component.lang.getText(
            typeList[0]
          )}: <span class="ogl_metal">$1</span> ${this.ogl.component.lang.getText(typeList[1])}`
        );

      regex = new RegExp(
        `${this.ogl.component.lang.getText(typeList[1])}[ ]?:[ ]?(.*?) ${this.ogl.component.lang.getText(typeList[2])}`,
        'g'
      );
      message.innerHTML = message.innerHTML
        .replace(/&nbsp;/g, ' ')
        .trim()
        .replace(
          regex,
          `${this.ogl.component.lang.getText(
            typeList[1]
          )}: <span class="ogl_crystal">$1</span> ${this.ogl.component.lang.getText(typeList[2])}`
        );

      regex = new RegExp(`${this.ogl.component.lang.getText(typeList[2])}[ ]?:[ ]?([^a-zA-Z<]+)`, 'g');
      message.innerHTML = message.innerHTML
        .replace(/&nbsp;/g, ' ')
        .trim()
        .replace(regex, `${this.ogl.component.lang.getText(typeList[2])}: <span class="ogl_deut">$1</span>`);
    });
  }

  cleanString(str) {
    ['.', '(', ')', ':', ','].forEach((car) => (str = str.replace(new RegExp('\\' + car, 'g'), ''))); // remove caracter(s)
    [' de '].forEach((car) => (str = str.replace(new RegExp('\\' + car, 'g'), ' '))); // replace caracter(s) with a space
    return str;
  }

  getExpeValue(locaAttr, message) {
    let regex;
    let isResource;
    ['metal', 'crystal', 'deut'].forEach((res) => {
      if (this.ogl.component.lang.getText(res) == locaAttr) isResource = true;
    });

    if (isResource && message.querySelector('.msg_content').textContent.indexOf(locaAttr + '.') > -1)
      regex = new RegExp('(\\d+) ' + this.cleanString(locaAttr), 'g');
    else regex = new RegExp(this.cleanString(locaAttr) + ' (\\d+)', 'g');

    let stringResult = regex.exec(this.cleanString(message.innerHTML))?.[1] || -1;

    return parseInt(stringResult);
  }

  buildSpyTable() {
    let highlightIndex;

    this.dataList.sort((a, b) => {
      if (this.ogl.db.options.spyFilter == '$') return b.renta - a.renta;
      else if (this.ogl.db.options.spyFilter == 'COORDS') return a.tmpCoords - b.tmpCoords;
      else if (this.ogl.db.options.spyFilter == 'FLEET') return b.fleet - a.fleet;
      else if (this.ogl.db.options.spyFilter == 'DEF') return b.defense - a.defense;
      else if (this.ogl.db.options.spyFilter == 'DATE') return b.date - a.date;
      else if (this.ogl.db.options.spyFilter == 'R_$') return a.renta - b.renta;
      else if (this.ogl.db.options.spyFilter == 'R_COORDS') return b.tmpCoords - a.tmpCoords;
      else if (this.ogl.db.options.spyFilter == 'R_FLEET') return a.fleet - b.fleet;
      else if (this.ogl.db.options.spyFilter == 'R_DEF') return a.defense - b.defense;
      else if (this.ogl.db.options.spyFilter == 'R_DATE') return a.date - b.date;
    });

    if (this.spyTable) this.spyTable.remove();

    let tmpTable = Util.createDom('div', { class: 'ogl_spyTable' });
    let thead = tmpTable.appendChild(Util.createDom('div'));
    let tbody = tmpTable.appendChild(Util.createDom('div'));

    let header = thead.appendChild(Util.createDom('div'));
    //header.appendChild(Util.createDom('th', {}, ''));
    header.appendChild(Util.createDom('th', { 'data-filter': 'DATE' }, 'age'));
    header.appendChild(Util.createDom('th', { 'data-filter': 'COORDS' }, 'coords'));
    header.appendChild(Util.createDom('th', {}, 'name'));
    header.appendChild(Util.createDom('th', { 'data-filter': '$' }, 'renta'));
    header.appendChild(Util.createDom('th', { 'data-filter': 'FLEET' }, 'fleet'));
    header.appendChild(Util.createDom('th', { 'data-filter': 'DEF' }, 'def'));
    //header.appendChild(Util.createDom('th', {'class':'ogl_shipIcon ogl_'+this.ogl.db.options.defaultShip}));
    let headerActions = header.appendChild(Util.createDom('th', { class: 'ogl_headerActions' }));

    let clean = headerActions.appendChild(
      Util.createDom(
        'div',
        { class: 'material-icons ogl_button tooltip', title: this.ogl.component.lang.getText('cleanReport') },
        'cleaning_services'
      )
    );
    clean.addEventListener('click', () => {
      this.spyTable.querySelectorAll('div[data-coords]').forEach((line) => {
        if (!line.querySelector('.ogl_renta.ogl_important') && !line.querySelector('.ogl_refleet.ogl_important')) {
          (
            line.querySelector('.ogl_reportOptions div[data-title="delete"]') ||
            line.querySelector('.ogl_reportOptions div[title="delete"]')
          ).click();
        }
      });
    });

    header.querySelectorAll('th[data-filter]').forEach((filter) => {
      if (this.ogl.db.options.spyFilter.indexOf(filter.getAttribute('data-filter')) > -1) {
        filter.classList.add('ogl_active');
        highlightIndex = [].indexOf.call(filter.parentNode.children, filter);
      }

      filter.addEventListener('click', () => {
        highlightIndex = [].indexOf.call(filter.parentNode.children, filter);
        this.ogl.db.options.spyFilter =
          this.ogl.db.options.spyFilter.indexOf('R_') > -1
            ? filter.getAttribute('data-filter')
            : 'R_' + filter.getAttribute('data-filter');
        // this.ogl.saveAsync();

        this.spyTable.remove();
        this.spyTable = false;
        document.querySelectorAll('.msg.ogl_ready').forEach((e) => e.classList.remove('ogl_ready'));
        this.checkReports();
      });
    });

    let sum = 0;
    let sumTotal = 0;
    let sumDetail = [0, 0, 0];

    for (let r = 0, len = this.dataList.length; r < len; r++) {
      let report = this.dataList[r];

      if (report.coords.join(':') == '0:0:0') return;
      let content = tbody.appendChild(
        Util.createDom('div', {
          'data-coords': report.coords.join(':'),
          'data-color': report.color,
          'data-spy-id': report.id,
          'data-renta': report.renta,
          'data-metal': report.resources[0],
          'data-crystal': report.resources[1],
          'data-deut': report.resources[2],
        })
      );
      let expanded = tbody.appendChild(Util.createDom('aside'));
      if (report.attacked) content.classList.add('ogl_attacked');

      // index
      //let indexContent = content.appendChild(Util.createDom('td'));

      // date
      let deltaDate = serverTime.getTime() - report.date;
      let dateObj = new Date(parseInt(report.clientDate));
      let formatedDate = `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR')}`;
      let dateContent = content.appendChild(
        Util.createDom('td', { class: 'ogl_reportDate tooltip', title: formatedDate })
      );
      let date = dateContent.appendChild(Util.createDom('div'));

      if (deltaDate < 3600000)
        date.textContent =
          Math.max(0, Math.floor(deltaDate / 60000) || 0).toString() + LocalizationStrings.timeunits.short.minute;
      else if (deltaDate < 86400000)
        date.textContent =
          Math.max(0, Math.floor(deltaDate / 3600000) || 0).toString() + LocalizationStrings.timeunits.short.hour;
      else
        date.textContent =
          Math.max(0, Math.floor(deltaDate / 86400000) || 0).toString() + LocalizationStrings.timeunits.short.day;

      if (report.activity > 0 && report.activity < 16 && report.activityColor != '#FFFF00')
        date.classList.add('ogl_danger');
      else if (report.activity > 0 && report.activity < 60) date.classList.add('ogl_warning');

      // coords
      let coords = content.appendChild(Util.createDom('td', { class: 'ogl_coords' }));
      let coordsA = Util.createDom(
        'a',
        {
          href: `https://${window.location.host}/game/index.php?page=ingame&component=galaxy&galaxy=${report.coords[0]}&system=${report.coords[1]}&position=${report.coords[2]}`,
        },
        `<span>${report.coords.join(':')}</span>`
      );
      coords.appendChild(coordsA);

      // type
      coordsA.appendChild(
        Util.createDom('div', { class: 'material-icons ogl_type' }, report.type == 1 ? 'language' : 'brightness_2')
      );
      if (report.attacked) coords.appendChild(Util.createDom('div', { class: 'ogl_inFlight' }));

      // player
      let detail = content.appendChild(Util.createDom('td', { class: 'ogl_name ' + report.status }));
      detail.appendChild(Util.createDom('a', { class: 'msg_action_link overlay', href: report.detail }, report.name));

      // ships
      let shipsA;
      //shipList = [this.ogl.db.options.defaultShip, this.ogl.db.options.secondShip];

      [this.ogl.db.options.defaultShip].forEach((shipID) => {
        let shipsCount = this.ogl.component.fleet.calcRequiredShips(shipID, Math.round(report.renta * 1.07)); // 7% more resources
        shipsA = Util.createDom(
          'a',
          {
            href: `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch&galaxy=${
              report.coords[0]
            }&system=${report.coords[1]}&position=${report.coords[2]}&type=${
              report.type == 3 ? 3 : 1
            }&mission=1&am${shipID}=${shipsCount}&ogl_mode=2&oglLazy=true`,
          },
          '<span>' +
            Util.formatToUnits(shipsCount, 1) +
            ' ' +
            this.ogl.component.lang.getText('abbr' + this.ogl.db.options.defaultShip) +
            '</span>'
        );
        if (
          !this.ogl.current.techs[this.ogl.db.options.defaultShip] ||
          this.ogl.current.techs[this.ogl.db.options.defaultShip] < shipsCount
        )
          shipsA.classList.add('ogl_danger');
      });

      // renta
      let renta = content.appendChild(Util.createDom('td', { class: 'tooltip ogl_renta' }));
      shipsA.innerHTML += `<div>${Util.formatNumber(report.renta) || '0'}</div>`;
      renta.appendChild(shipsA);

      if (report.renta >= this.ogl.db.options.rval) renta.classList.add('ogl_important');
      let resources = ['metal', 'crystal', 'deut'];
      let resourcesName = [
        this.ogl.component.lang.getText('metal'),
        this.ogl.component.lang.getText('crystal'),
        this.ogl.component.lang.getText('deut'),
      ];
      resources.forEach((res, index) => {
        renta.title += `<div>${resourcesName[index]}:&nbsp;<span class="ogl_${
          resources[index]
        } float_right">${Util.formatToUnits(report.resources[index])}</span></div>`;
      });
      renta.title += `<hr><div>Total:&nbsp;<span class="float_right">${Util.formatToUnits(report.total)}</span></div>`;

      let currentRes = report.total;
      let currentRenta = report.renta;
      let shipList = [202, 203, 219, 210];

      expanded.appendChild(Util.createDom('ul'));
      shipList.forEach((ship) =>
        expanded.appendChild(
          Util.createDom('ul', { 'data-ship': ship }, `<div class="ogl_shipIcon ogl_${ship}"></div>`)
        )
      );

      for (let i = 0; i < 6; i++) {
        currentRenta = Math.ceil(currentRes * report.loot);
        currentRes = currentRes - currentRenta;

        expanded.querySelector('ul').appendChild(Util.createDom('li', {}, Util.formatToUnits(currentRenta)));

        shipList.forEach((ship) => {
          let shipsCount = this.ogl.component.fleet.calcRequiredShips(ship, Math.round(currentRenta * 1.07));

          let a = Util.createDom(
            'a',
            {
              class: 'ogl_added',
              href: `https://${window.location.host}/game/index.php?page=ingame&component=fleetdispatch&galaxy=${
                report.coords[0]
              }&system=${report.coords[1]}&position=${report.coords[2]}&type=${
                report.type == 3 ? 3 : 1
              }&mission=1&am${ship}=${shipsCount}&ogl_mode=2&oglLazy=true`,
            },
            shipsCount.toLocaleString('de-DE') || '0'
          );

          expanded.querySelector(`[data-ship="${ship}"]`).appendChild(a);
          if (shipsCount === Infinity) a.classList.add('ogl_disabled');
        });
      }

      // fleet
      let fleet = content.appendChild(
        Util.createDom('td', { class: 'ogl_refleet' }, (Util.formatToUnits(report.fleet, 1) || '0').replace('-1', '?'))
      );
      if (report.fleet >= this.ogl.db.options.rval || report.fleet == -1) {
        fleet.classList.add('ogl_important');
        content.classList.add('ogl_caution');
      }

      // def
      let def = content.appendChild(
        Util.createDom('td', { class: 'ogl_redef' }, (Util.formatToUnits(report.defense, 1) || '0').replace('-1', '?'))
      );
      if (report.defense > 0 || report.defense == -1) {
        def.classList.add('ogl_important');
        content.classList.add('ogl_caution');
      }

      // color
      let colorContent = coords.appendChild(Util.createDom('div', { class: 'ogl_colorButton tooltipClose' }));
      colorContent.addEventListener('click', (event) => {
        if (report.coords[2] <= 15) {
          let colors = Util.createDom('div', { class: 'ogl_colorAll ogl_tooltipColor' });

          let planetIndexes = this.ogl.find(this.ogl.db.positions, 'coords', report.coords.join(':'));
          let playerIndex = this.ogl.find(this.ogl.db.players, 'name', report.name)[0];

          if (planetIndexes.length == 0 && !playerIndex) {
            console.log(`This player doesn't exist in OGL database, please check the galaxy`);
          } else if (planetIndexes.length == 0 && playerIndex) {
            this.ogl.component.crawler.checkPlayerApi(this.ogl.db.players[playerIndex].id, () => {
              planetIndexes = this.ogl.find(this.ogl.db.positions, 'coords', report.coords.join(':'));

              this.ogl.component.color.addColorUI(
                colorContent,
                colors,
                planetIndexes,
                event,
                (color) => (report.color = color)
              );
              this.ogl.component.tooltip.open(colorContent, false, colors);
            });
          } else {
            this.ogl.component.color.addColorUI(
              colorContent,
              colors,
              planetIndexes,
              event,
              (color) => (report.color = color)
            );
            this.ogl.component.tooltip.open(colorContent, false, colors);
          }
        }
      });

      //actions
      let actions = content.appendChild(Util.createDom('td', { class: 'ogl_reportOptions' }));
      actions.appendChild(
        Util.createDom(
          'div',
          { class: 'material-icons tooltip', onclick: report.spy, title: 'spy this planet' },
          'visibility'
        )
      );

      let more = actions.appendChild(
        Util.createDom('div', { class: 'material-icons tooltip ogl_expand', title: 'expand' })
      );
      more.addEventListener('click', () => {
        expanded.classList.toggle('ogl_active');
      });

      // attack
      let attack = actions.appendChild(
        Util.createDom(
          'a',
          { class: 'material-icons tooltip', href: report.attack, title: 'attack this planet' },
          'adjust'
        )
      );

      let apiKey = Util.createDom('div', {});
      apiKey.innerHTML = report.api.getAttribute('title');

      if (!apiKey.querySelector('input')) console.log(error, report);
      apiKey = apiKey.querySelector('input').value;

      if (report.api && report.coords[2] <= 15) {
        let simButton = actions.appendChild(Util.createDom('div', { class: 'tooltip', title: 'trashsim' }, 'S'));
        simButton.addEventListener('click', () => window.open(Util.genTrashsimLink(apiKey, this.ogl), '_blank'));

        if (this.ogl.ptre) {
          let ptreButton = actions.appendChild(
            Util.createDom('div', { class: 'ogl_smallPTRE tooltip', title: 'import to PTRE' }, 'P')
          );
          ptreButton.addEventListener('click', () => Util.importToPTRE(apiKey, this.ogl));
        }
      }

      let trash = actions.appendChild(
        Util.createDom('div', { class: 'material-icons tooltip', title: 'delete' }, 'clear')
      );
      trash.addEventListener('click', () => {
        if (this.trashQueue.indexOf(report.id) == -1) this.trashQueue.push(report.id);
        if (this.trashQueue.length == 1 && !this.trashQueueProcessing) {
          this.tokenInput.value = this.tokenInput.value;
        }
        /*let token = document.querySelectorAll('[name="token"]')[0].getAttribute('value');
                if(token == this.oldToken) return;
                this.oldToken = token;*/

        /*this.sum = this.sum || 0;
                this.sum -= report.renta;
                this.sumDetail = this.sumDetail || [0, 0, 0];
                this.sumDetail[0] -= report.metal;
                this.sumDetail[1] -= report.crystal;
                this.sumDetail[2] -= report.deut;
                this.calcTotal(this.sum, this.sumDetail, this.sumDetail[0] + this.sumDetail[1] + this.sumDetail[2]);

                const isValid = e => e.id == report.id;

                for(let i=0, len=this.dataList.length; i<len; i++)
                {
                    let item = this.dataList[i];
                    if(isValid(item))
                    {
                        this.dataList.splice(i, 1);
                        break;
                    }
                }

                content.remove();
                expanded.remove();
                report.trash?.click();*/
      });

      if (report.api && !report.dom.querySelector('.ogl_sim')) {
        let otherSimbutton = report.dom
          .querySelector('.msg_actions')
          .appendChild(Util.createDom('div', { class: 'icon_nf ogl_sim' }, 'S'));
        otherSimbutton.addEventListener('click', () => window.open(Util.genTrashsimLink(apiKey, this.ogl), '_blank'));

        if (this.ogl.ptre) {
          let otherPtreButton = report.dom
            .querySelector('.msg_actions')
            .appendChild(Util.createDom('div', { class: 'icon_nf ogl_sim tooltip', title: 'import to PTRE' }, 'P'));
          otherPtreButton.addEventListener('click', () => Util.importToPTRE(apiKey, this.ogl));
        }
      }

      if (highlightIndex) content.querySelectorAll(`td`)[highlightIndex].classList.add('highlighted');

      sumTotal += report.total;
      sum += report.renta;
      for (let i = 0; i < 3; i++) sumDetail[i] += report.resources[i];

      if (r == this.dataList.length - 1) {
        this.spyTable = tmpTable;
        document.querySelector('ul.subtabs').after(this.spyTable);

        this.sum = sum;
        this.sumDetail = sumDetail;
        this.calcTotal(sum, sumDetail, sumTotal);
      }
    }

    //document.querySelector('.ogl_key.material-icons') && document.querySelector('.ogl_key.material-icons').classList.remove('ogl_hidden');
  }

  calcTotal(sumValue, sumDetail, sumTotal) {
    document.querySelector('.ogl_spyTable .ogl_totalSum') &&
      document.querySelector('.ogl_spyTable .ogl_totalSum').remove();
    let total = this.spyTable.appendChild(Util.createDom('div', { class: 'ogl_totalSum' }));

    total.appendChild(Util.createDom('th', {}, ''));
    total.appendChild(Util.createDom('th', {}, ''));
    total.appendChild(Util.createDom('th', {}, ''));
    let cell = total.appendChild(Util.createDom('th', { class: 'tooltip' }, Util.formatToUnits(sumValue)));
    total.appendChild(Util.createDom('th', {}, ''));
    total.appendChild(Util.createDom('th', {}, ''));
    total.appendChild(Util.createDom('th', {}, ''));

    let resources = ['metal', 'crystal', 'deut'];
    let resourcesName = [
      this.ogl.component.lang.getText('metal'),
      this.ogl.component.lang.getText('crystal'),
      this.ogl.component.lang.getText('deut'),
    ];
    sumDetail.forEach((res, index) => {
      cell.title += `<div>${resourcesName[index]}:&nbsp;<span class="ogl_${
        resources[index]
      } float_right">${Util.formatToUnits(sumDetail[index])}</span></div>`;
    });
    cell.title += `<hr><div>Total:&nbsp;<span class="float_right">${Util.formatToUnits(sumTotal)}</span></div>`;
  }
}

export default MessageManager;
