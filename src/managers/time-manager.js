import Util from '../util.js';

class TimeManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.currentDetail;

    let li = Util.createDom('li', { class: 'ogl_ping' }, `${Math.abs(timeDelta / 1000)} s`);
    document.querySelector('#bar ul').appendChild(li);
    if (timeDelta < -2000) li.classList.add('ogl_danger');
    else if (timeDelta < -1000) li.classList.add('ogl_warning');

    if (this.ogl.page == 'messages') {
      this.ogl.observeMutation(() => {
        document.querySelectorAll('.msg_date:not(.ogl_timeZone)').forEach((element) => {
          this.updateTime(element);
        });
      }, 'messagesdate');
    }

    this.checkCurrentBuilding();

    this.ogl.addToUpdateQueue(() => {
      document
        .querySelectorAll(
          '#bar ul li.OGameClock:not(.ogl_ready), #arrivalTime:not(.ogl_ready), #returnTime:not(.ogl_ready)'
        )
        .forEach((element, index) => {
          element.classList.add('ogl_ready');
          if (element.closest('#rocketattack')) return;
          this.updateTime(element);
          this.observe(element);
        });

      document
        .querySelectorAll(
          '.allianceAttack .arrivalTime:not(.ogl_ready), .eventFleet .arrivalTime:not(.ogl_ready), .fleetDetails .absTime:not(.ogl_ready), .fleetDetails .nextabsTime:not(.ogl_ready)'
        )
        .forEach((element, index) => {
          element.classList.add('ogl_ready');
          if (element.closest('#rocketattack')) return;
          this.updateTime(element);
        });
    });

    let pages = ['supplies', 'facilities', 'shipyard', 'defenses', 'research'];
    if (pages.indexOf(this.ogl.page) > -1) {
      Util.updateCheckIntInput(() => this.checkDetail());
      this.ogl.observeMutation(() => this.checkDetail(), 'details');
    }
  }

  observe(target) {
    let observer = new MutationObserver(() => this.updateTime(target));
    observer.observe(target, { childList: true });
  }

  updateTime(domElement) {
    domElement.classList.add('ogl_hiddenContent');
    domElement.classList.add('ogl_timeZone');

    let serverRawTime = domElement.textContent;
    if (!serverRawTime || serverRawTime.trim() == '') return;

    let timeMode = false;
    let splitted = serverRawTime.replace(/ \.$/, '').trim().replace(/[ \.]/g, ':').split(':');

    if (splitted.length <= 5) {
      timeMode = true;
      splitted = ['01', '01', '2000'].concat(splitted);
    }

    splitted = splitted.map((e) => e.padStart(2, '0'));
    if (splitted[2].length == 2) splitted[2] = '20' + splitted[2]; // ex: 10.05.22 => 10.05.2022

    let serverDate = new Date(
      `${splitted[2]}-${splitted[1]}-${splitted[0]}T${splitted[3]}:${splitted[4]}:${splitted[5]}`
    );
    let serverTimestamp = serverDate.getTime();
    let clientTimestamp = serverDate.getTime() - timeDiff - timeDelta;
    let clientDate = new Date(clientTimestamp);
    domElement.setAttribute('data-servertime', serverTimestamp);
    domElement.setAttribute('data-clienttime', clientTimestamp);

    if (timeMode) {
      domElement.setAttribute('data-timezone', clientDate.toLocaleTimeString('fr-FR'));
    } else {
      domElement.classList.add('ogl_fulldate');
      domElement.setAttribute('data-datezone', `${clientDate.toLocaleDateString('fr-FR').replace(/\//g, '.')} `);
      domElement.setAttribute('data-timezone', ` ${clientDate.toLocaleTimeString('fr-FR')}`);
    }

    /*
        let time = domElement.textContent;
        let newTime;
        let timeMode = false;

        if(!time) return;

        time = time.replace(/ \.$/, '');
        time = time.trim().replace(/[ \.]/g, ':');
        time = time.split(':');

        if(time.length <= 5)
        {
            timeMode = true;
            time = ["01","01","2000"].concat(time);
        }

        time.forEach((t, index) => time[index] = t.padStart(2, '0'));
        if(time[2].length == 2) time[2] = '20' + time[2];

        newTime = new Date(`${time[2]}-${time[1]}-${time[0]}T${time[3]}:${time[4]}:${time[5]}`).getTime();
        domElement.setAttribute('data-servertime', newTime);

        //newTime = new Date(newTime - Math.round(timeDiff / 100000) * 100000);
        //domElement.setAttribute('data-timestamp', newTime.getTime());

        if(timeMode)
        {
            domElement.setAttribute('data-timezone', newTime.toLocaleTimeString('fr-FR'));
        }
        else
        {
            domElement.classList.add('ogl_fulldate');
            domElement.setAttribute('data-datezone', `${newTime.toLocaleDateString('fr-FR').replace(/\//g, '.')} `);
            domElement.setAttribute('data-timezone', ` ${newTime.toLocaleTimeString('fr-FR')}`);
        }*/
  }

  checkCurrentBuilding() {
    let countDownID = ['buildingCountdown', 'researchCountdown', 'shipyardCountdown2'];
    ['restTimebuilding', 'restTimeresearch', 'restTimeship2'].forEach((building, index) => {
      try {
        let time = new Date(serverTime - Math.round(timeDiff / 100000) * 100000 + eval(building) * 1000);
        let parent = document.querySelector(`span#${countDownID[index]}`).closest('.content');
        let div = parent.appendChild(Util.createDom('div', { class: 'ogl_endTime' }));
        div.innerHTML = `${time.toLocaleDateString('fr-FR').replace(/\//g, '.')} <span>${time.toLocaleTimeString(
          'fr-FR'
        )}</span>`;
      } catch (e) {}
    });
  }

  checkDetail() {
    // fix an ogame bug when an user spam click
    if (document.querySelectorAll('#technologydetails').length > 1) {
      document.querySelectorAll('#technologydetails').forEach((e, index) => {
        if (index > 0) e.remove();
      });
    }

    this.currentDetail = document.querySelector('#technologydetails_content');
    if (
      this.currentDetail &&
      this.currentDetail.querySelector('.og-loading') &&
      this.currentDetail.querySelector('.og-loading').style.display == 'none'
    ) {
      let amount = parseInt(this.currentDetail.querySelector('#build_amount')?.value || 1) || 1;
      let domTime = this.currentDetail.querySelector('.build_duration time');

      // prev / next / lock buttons actions
      if (!this.currentDetail.querySelector('.ogl_detailActions')) {
        let tech = {};
        tech.id = parseInt(this.currentDetail.querySelector('#technologydetails').getAttribute('data-technology-id'));
        tech.name = this.currentDetail.querySelector('#technologydetails h3').textContent;

        tech.initial = {};
        tech.initial.time = domTime.getAttribute('datetime');
        tech.initial.level = parseInt(
          this.currentDetail.querySelector('.information .level')
            ? this.currentDetail.querySelector('.information .level').getAttribute('data-value')
            : 0
        );
        tech.initial.metal = parseInt(
          !this.currentDetail.querySelector('.costs .metal')
            ? 0
            : this.currentDetail.querySelector('.costs .metal').getAttribute('data-value')
        );
        tech.initial.crystal = parseInt(
          !this.currentDetail.querySelector('.costs .crystal')
            ? 0
            : this.currentDetail.querySelector('.costs .crystal').getAttribute('data-value')
        );
        tech.initial.deut = parseInt(
          !this.currentDetail.querySelector('.costs .deuterium')
            ? 0
            : this.currentDetail.querySelector('.costs .deuterium').getAttribute('data-value')
        );
        tech.initial.energy = parseInt(
          !this.currentDetail.querySelector('.costs .energy')
            ? 0
            : this.currentDetail.querySelector('.costs .energy').getAttribute('data-value')
        );

        tech.current = {};
        tech.current.level = tech.initial.level;
        tech.current.metal = tech.initial.metal;
        tech.current.crystal = tech.initial.crystal;
        tech.current.deut = tech.initial.deut;
        tech.current.energy = tech.initial.energy;

        // building price increase
        if (tech.id == 1 || tech.id == 3 || tech.id == 4) tech.ratio = 1.5;
        else if (tech.id == 2) tech.ratio = 1.6;
        else if (tech.id == 12) tech.ratio = 1.8;
        else if (tech.id == 36) tech.ratio = 5;
        else if (tech.id == 124) tech.ratio = 1.75;
        else if (tech.id == 199) tech.ratio = 3;
        else if (tech.id > 199 && tech.id <= 299) tech.ratio = 1; // fleet
        else if (tech.id > 399 && tech.id <= 499) tech.ratio = 1; // def
        else tech.ratio = 2;

        let self = this;

        let updateFullDate = () => {
          let li =
            this.currentDetail.querySelector('.ogl_timeZone.ogl_fulldate') ||
            this.currentDetail
              .querySelector('.build_duration')
              .appendChild(Util.createDom('div', { class: 'ogl_timeZone ogl_fulldate' }));
          let totalTime = 0;

          let indexArr = domTime.getAttribute('datetime').replace('PT', '').replace('P', '').match(/\D+/g).map(String);
          let valueArr = domTime.getAttribute('datetime').replace('PT', '').replace('P', '').match(/\d+/g).map(Number);

          valueArr.forEach((value, index) => {
            if (indexArr[index] == 'DT') totalTime += value * 86400;
            if (indexArr[index] == 'H') totalTime += value * 3600;
            if (indexArr[index] == 'M') totalTime += value * 60;
            if (indexArr[index] == 'S') totalTime += value;
          });

          let seconds = totalTime;
          let newTime = new Date(serverTime.getTime() + seconds * 1000);
          li.setAttribute('data-datezone', `${newTime.toLocaleDateString('fr-FR').replace(/\//g, '.')} `);
          li.setAttribute('data-timezone', ` ${newTime.toLocaleTimeString('fr-FR')}`);
        };

        let updateDomTime = () => {
          let totalTime = 0;

          let indexArr = tech.initial.time.replace('PT', '').replace('P', '').match(/\D+/g).map(String);
          let valueArr = tech.initial.time.replace('PT', '').replace('P', '').match(/\d+/g).map(Number);

          valueArr.forEach((value, index) => {
            if (indexArr[index] == 'DT') totalTime += value * 86400;
            if (indexArr[index] == 'H') totalTime += value * 3600;
            if (indexArr[index] == 'M') totalTime += value * 60;
            if (indexArr[index] == 'S') totalTime += value;
          });

          if (this.currentDetail.querySelector('#build_amount'))
            totalTime = totalTime * parseInt(this.currentDetail.querySelector('#build_amount')?.value || 1) || 1;
          else totalTime = totalTime * Math.pow(tech.ratio, tech.current.level - tech.initial.level);

          let seconds = Math.ceil(totalTime || 1);
          let w = Math.floor(seconds / (3600 * 24 * 7));
          let d = Math.floor((seconds % (3600 * 24 * 7)) / (3600 * 24));
          let h = Math.floor((seconds % (3600 * 24)) / 3600);
          let m = Math.floor((seconds % 3600) / 60);
          let s = Math.floor(seconds % 60);

          let wd = Math.floor(seconds / (3600 * 24));

          domTime.setAttribute('datetime', `${wd}DT${h}H${m}M${s}S`);

          domTime.textContent = '';
          if (w > 0) domTime.textContent += `${w}${LocalizationStrings.timeunits.short.week} `;
          if (d > 0) domTime.textContent += `${d}${LocalizationStrings.timeunits.short.day} `;
          if (h > 0) domTime.textContent += `${h}${LocalizationStrings.timeunits.short.hour} `;
          if (m > 0 && w <= 0) domTime.textContent += `${m}${LocalizationStrings.timeunits.short.minute} `;
          if (s > 0 && w <= 0 && d <= 0) domTime.textContent += `${s}${LocalizationStrings.timeunits.short.second}`;

          updateFullDate();
        };

        let updateLevel = function (newLevel, updateDom) {
          tech.current.level = newLevel > 0 ? newLevel : 1;
          if (self.currentDetail.querySelector('.information .level'))
            self.currentDetail
              .querySelector('.information .level')
              .setAttribute('data-step', tech.current.level - tech.initial.level);

          ['metal', 'crystal', 'deut', 'energy'].forEach((res) => {
            if (tech.initial[res]) {
              let ratio;

              if (tech.id == 36 && res == 'energy') ratio = 2.5;
              else ratio = tech.ratio;

              tech.current[res] = Math.ceil(
                tech.initial[res] * Math.pow(ratio, tech.current.level - tech.initial.level)
              );

              if (updateDom) {
                let target = self.currentDetail.querySelector('.costs .' + res.replace('deut', 'deuterium'));
                target.textContent = Util.formatToUnits(tech.current[res]);
                target.setAttribute('data-total', tech.current[res]);
                target.setAttribute(
                  'title',
                  `${Util.formatNumber(tech.current[res])} ${self.ogl.component.lang.getText(res)}`
                );
                self.currentDetail.querySelector('.information .level').innerHTML = `Level ${
                  tech.current.level - 1
                } <i class="material-icons">arrow_forward</i> <span>${tech.current.level}</span>`;

                if (self.ogl.current[res] < tech.current[res]) target.classList.add('insufficient');
                else target.classList.remove('insufficient');
              }
            }
          });

          if (tech.id == 1)
            self.currentDetail.querySelector('.additional_energy_consumption .value').textContent = Util.formatNumber(
              Math.floor(10 * tech.current.level * Math.pow(1.1, tech.current.level)) -
                Math.floor(10 * (tech.initial.level - 1) * Math.pow(1.1, tech.initial.level - 1))
            );
          else if (tech.id == 2)
            self.currentDetail.querySelector('.additional_energy_consumption .value').textContent = Util.formatNumber(
              Math.floor(10 * tech.current.level * Math.pow(1.1, tech.current.level)) -
                Math.floor(10 * (tech.initial.level - 1) * Math.pow(1.1, tech.initial.level - 1))
            );
          else if (tech.id == 3)
            self.currentDetail.querySelector('.additional_energy_consumption .value').textContent = Util.formatNumber(
              Math.floor(20 * tech.current.level * Math.pow(1.1, tech.current.level)) -
                Math.floor(20 * (tech.initial.level - 1) * Math.pow(1.1, tech.initial.level - 1))
            );

          updateDomTime();

          return tech;
        };

        let container = this.currentDetail
          .querySelector('.sprite_large')
          .appendChild(Util.createDom('div', { class: 'ogl_detailActions' }));

        if (this.currentDetail.querySelector('.information .level')) {
          this.currentDetail.querySelector('.information .level').setAttribute('data-ratio', tech.ratio);

          let prevButton = container.appendChild(
            Util.createDom('div', { class: 'ogl_button material-icons' }, 'chevron_left')
          );
          let initButton = container.appendChild(
            Util.createDom('div', { class: 'ogl_button  material-icons' }, 'cancel')
          );
          let nextButton = container.appendChild(
            Util.createDom('div', { class: 'ogl_button material-icons' }, 'chevron_right')
          );

          prevButton.addEventListener('click', () => updateLevel(tech.current.level - 1, true));
          initButton.addEventListener('click', () => updateLevel(tech.initial.level, true));
          nextButton.addEventListener('click', () => updateLevel(tech.current.level + 1, true));

          initButton.click();
        }

        let lockButton = container.appendChild(Util.createDom('div', { class: 'ogl_button material-icons' }, 'lock'));
        lockButton.addEventListener('click', () => {
          let amount = 1;
          let levelDiff = tech.current.level - tech.initial.level;
          if (levelDiff < 0) return;

          if (this.currentDetail.querySelector('#build_amount')) {
            amount = parseInt(this.currentDetail.querySelector('#build_amount').value || 1);
          }

          for (let i = 0; i <= levelDiff; i++) {
            let tmpTech = updateLevel(tech.initial.level + i);
            let lockedTech = {};
            lockedTech.id = tmpTech.id;
            lockedTech.name = tmpTech.name;
            lockedTech.amount = amount;
            lockedTech.level = tmpTech.current.level;
            lockedTech.metal = tmpTech.current.metal * amount;
            lockedTech.crystal = tmpTech.current.crystal * amount;
            lockedTech.deut = tmpTech.current.deut * amount;

            this.ogl.component.empire.lockTech(lockedTech);
          }
        });

        let checkInput = () => {
          let currentAmount = parseInt(this.currentDetail.querySelector('#build_amount')?.value || 1) || 1;
          let energyProd =
            parseInt(this.currentDetail.querySelector('.energy_production .bonus')?.getAttribute('data-value') || 0) *
            currentAmount;
          let energyConso =
            parseInt(
              this.currentDetail.querySelector('.additional_energy_consumption .value')?.getAttribute('data-value') || 0
            ) * currentAmount;

          if (energyProd)
            this.currentDetail.querySelector('.energy_production .value .bonus').textContent = `(+${Util.formatNumber(
              energyProd
            )})`;
          if (energyConso)
            this.currentDetail.querySelector('.additional_energy_consumption .value').textContent =
              Util.formatNumber(energyConso);

          ['metal', 'crystal', 'deut', 'energy'].forEach((res) => {
            let target = self.currentDetail.querySelector('.costs .' + res.replace('deut', 'deuterium'));
            if (target) {
              let newValue = tech.initial[res] * currentAmount;
              target.textContent = Util.formatToUnits(newValue);
              target.setAttribute('data-total', newValue);
              target.setAttribute('title', `${Util.formatNumber(newValue)} ${self.ogl.component.lang.getText(res)}`);

              if (this.ogl.current[res] < newValue) target.classList.add('insufficient');
              else target.classList.remove('insufficient');
            }
          });

          updateDomTime();
        };

        updateDomTime();
        Util.updateCheckIntInput(() => checkInput());

        if (this.currentDetail.querySelector('.information .level'))
          this.currentDetail.querySelector('.information .level').innerHTML = `Level ${
            tech.current.level - 1
          } <i class="material-icons">arrow_forward</i> <span>${tech.current.level}</span>`;

        if (this.currentDetail.querySelector('#build_amount')) {
          // ships or def
          this.currentDetail
            .querySelector('#build_amount')
            .setAttribute('onkeyup', 'checkIntInput(this, 1, 999999);event.stopPropagation();');
          this.currentDetail.querySelector('#build_amount').addEventListener('click', () => checkInput());
          this.currentDetail.querySelector('.maximum') &&
            this.currentDetail.querySelector('.maximum').addEventListener('click', () => setTimeout(checkInput, 20));
        }

        this.ogl.addToUpdateQueue(() => updateFullDate());
      }
    }
  }
}

export default TimeManager;
