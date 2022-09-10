import Util from '../util.js';

class TooltipManager {
  constructor(ogl) {
    this.ogl = ogl;
    this.ogl.tooltipList = this.ogl.tooltipList || {};
    this.ogl.tmpTooltip = this.ogl.tmpTooltip || {};
    this.dom = document.body.appendChild(Util.createDom('div', { class: 'ogl_tooltip tpd-tooltip' }));
    this.cross = this.dom.appendChild(Util.createDom('div', { class: 'ogl_close material-icons' }, 'clear'));
    this.container = this.dom.appendChild(Util.createDom('div', {}));

    this.openDelay = 0;
    this.closeDelay = 100;
    this.updateDelay = 50;

    document.addEventListener('click', (e) => {
      if (!this.dom.classList.contains('ogl_active') && !this.dom.classList.contains('ogl_highlight')) return;
      if (e.target != this.dom && !e.target.closest('.ogl_tooltip')) {
        this.lastSender = false;
        this.close(true);
      }
    });

    this.dom.addEventListener('mouseout', (e) => {
      let target = e.toElement || e.relatedTarget || e.target;

      if (
        !this.dom.contains(target) &&
        target != this.lastSender &&
        this.cross.classList.contains('ogl_hidden') &&
        !target.classList.contains('ogl_highlight')
      ) {
        this.timer = setTimeout((e) => this.close(), this.tooltipDelay);
      }
    });

    this.cross.addEventListener('click', () => this.close());
    this.ogl.observeMutation(() => this.initTooltip(), 'tooltip');
  }

  initTooltip() {
    /*let senderList = document.querySelectorAll(`.tooltip:not(.ogl_tooltipReady), .tooltipRight:not(.ogl_tooltipReady), .tooltipLeft:not(.ogl_tooltipReady),
        .tooltipBottom:not(.ogl_tooltipReady), .tooltipClose:not(.ogl_tooltipReady), .tooltipHTML:not(.ogl_tooltipReady),
        .tooltipRel:not(.ogl_tooltipReady), .tooltipCustom:not(.ogl_tooltipReady)`);*/

    let senderList = document.querySelectorAll(`[class*="tooltip"]:not(.ogl_tooltipReady)`);

    senderList.forEach((sender, index) => {
      setTimeout(() => {
        if (
          sender.classList.contains('ogl_tooltipReady') ||
          !this.ogl.component.tooltip ||
          sender.closest('.ogl_tooltipReady')
        )
          return;
        if (
          !sender.classList.contains('tooltipRel') &&
          !sender.getAttribute('title') &&
          !sender.getAttribute('data-title')
        );

        sender.classList.add('ogl_tooltipReady');

        if (sender.parentNode && sender.parentNode.closest('.ogl_tooltipReady')) return;
        if (
          this.ogl.db.options.togglesOff.indexOf('rightMenuTooltips') == -1 &&
          (sender.classList.contains('planetlink') || sender.classList.contains('moonlink'))
        ) {
          sender.removeAttribute('title');
          return;
        }

        let tooltipID;

        if (sender.classList.contains('icon_apikey') || sender.classList.contains('show_fleet_apikey')) {
          sender.classList.add('tooltipClick');
        }

        if (sender.classList.contains('tooltipRel')) {
          let id = '#' + sender.getAttribute('rel');
          //if(document.querySelector(id) && !this.ogl.tooltipList[id]) this.ogl.tooltipList[id] = document.querySelector(id);
          tooltipID = id;

          /*if(id.indexOf('planet') == 1 || id.indexOf('moon') == 1 || id.indexOf('debris') == 1 || id.indexOf('demolition_costs_tooltip_oneTimeelement') == 1)
                    {
                        this.ogl.tmpTooltip[id] = this.ogl.tooltipList[id];
                        this.ogl.tooltipList[id] = false;
                    }*/
        }

        if (sender.classList.contains('tooltipClick')) {
          sender.addEventListener('click', (e) => {
            if (e.target != sender) this.close();
            this.lastSender = sender;
            this.open(sender, tooltipID);
          });
        } else {
          sender.addEventListener('mouseenter', (e) => {
            if (e.target != sender) this.close();
            if (this.ogl.component.tooltip.dom.contains(sender)) return;
            if (sender == this.lastSender) return;

            this.lastSender = sender;
            this.open(sender, tooltipID);
          });

          sender.addEventListener('mouseout', (e) => {
            if (sender.contains(e.toElement)) return;
            if (sender.classList.contains('tooltipClose')) this.closeTimer = setTimeout((e) => this.close(), 300);
            else this.closeTimer = setTimeout((e) => this.close(), this.closeDelay);
          });
        }

        //if(index == senderList.length-1) document.body.classList.remove('ogl_noPointer');
      }, index);
    });
  }

  rebuildTooltip(sender) {
    let rect = sender.getBoundingClientRect();
    let win = sender.ownerDocument.defaultView;

    this.position = {
      x: rect.left + win.pageXOffset,
      y: rect.top + win.pageYOffset,
    };

    this.dom.style.top = 0 + 'px';
    this.dom.style.left = 0 + 'px';
    this.dom.style.width = 'auto';

    let tooltipWidth = this.dom.offsetWidth + 3;

    if (
      sender.classList.contains('tooltipClose') ||
      sender.classList.contains('tooltipCustom') ||
      sender.classList.contains('tooltipRel')
    ) {
      this.cross.classList.remove('ogl_hidden');
      this.dom.classList.remove('ogl_noPointer');
    } else {
      this.cross.classList.add('ogl_hidden');
      this.dom.classList.add('ogl_noPointer');
    }

    if (sender.classList.contains('tooltipLeft')) {
      this.dom.classList.add('ogl_left');
      this.position.x -= this.dom.offsetWidth + 5;
      this.position.y -= this.dom.offsetHeight / 2;
      this.position.y += rect.height / 2;
    } else if (sender.classList.contains('tooltipRight')) {
      this.dom.classList.add('ogl_right');
      this.position.x += rect.width + 5;
      this.position.y -= this.dom.offsetHeight / 2;
      this.position.y += rect.height / 2;
    } else if (sender.classList.contains('tooltipRightTop')) {
      this.dom.classList.add('ogl_rightTop');
      this.position.x += rect.width;
      this.position.y -= this.dom.offsetHeight - 20;
      this.position.y += rect.height / 2;
    } else if (sender.classList.contains('tooltipBottom')) {
      this.dom.classList.add('ogl_bottom');
      this.position.x -= this.dom.offsetWidth / 2;
      this.position.x += rect.width / 2;
      this.position.y += rect.height;
    } else {
      this.position.x -= this.dom.offsetWidth / 2;
      this.position.x += rect.width / 2;
      this.position.y -= this.dom.offsetHeight;
      this.position.y -= 4;
    }

    this.position.x = Math.round(this.position.x);
    this.position.y = Math.round(this.position.y);

    this.position.x = this.position.x - (this.position.x % 2);
    this.position.y = this.position.y - (this.position.y % 2);

    this.dom.style.top = this.position.y + 'px';
    this.dom.style.left = this.position.x + 'px';
    this.dom.style.width = tooltipWidth + 'px';

    setTimeout(() => {
      if (this.container.textContent.trim() != '' || this.container.innerHTML != '')
        this.dom.classList.add('ogl_active');
    }, 10);
  }

  open(sender, tooltipID, data) {
    clearTimeout(this.closeTimer);
    if (sender != this.lastSender) this.close();

    let content;
    this.container.textContent = '';

    //if(tooltipID) content = this.ogl.tooltipList[tooltipID] || this.ogl.tmpTooltip[tooltipID];
    if (tooltipID) content = document.querySelector(`${tooltipID}`).outerHTML;
    else if (data) content = data;
    else {
      content = sender.getAttribute('title') || sender.getAttribute('data-title');
      if (content) sender.setAttribute('data-title', content);
    }

    if (!content) {
      this.close();
      return;
    }

    document.querySelectorAll('.ogl_highlight').forEach((e) => e.classList.remove('ogl_highlight'));
    sender.classList.add('ogl_highlight');

    if (typeof content == 'object' && content.style && content.style.display == 'none') content.style.display = 'block';
    typeof content == 'object' ? this.container.appendChild(content) : (this.container.innerHTML = content);

    if (this.container.textContent.indexOf('|') > -1)
      this.container.innerHTML = this.container.innerHTML.replace(/\|/g, '<div class="splitLine"></div>');

    // remove right menu tooltip on fleet 2
    if (
      sender.closest('.ogl_shortcuts') &&
      (sender.classList.contains('planetlink') || sender.classList.contains('moonlink'))
    )
      return;

    sender.removeAttribute('title');

    if (this.updateBeforeDisplay(sender)) return;
    this.dom.className = 'ogl_tooltip tpd-tooltip';
    this.dom.style.width = 'auto';

    this.rebuildTooltip(sender);
  }

  update(sender, newData) {
    clearTimeout(this.closeTimer);
    setTimeout(() => {
      if (sender != this.lastSender) return;

      this.container.textContent = '';

      if (!newData) {
        return;
      }

      typeof newData == 'object' ? this.container.appendChild(newData) : (this.container.innerHTML = newData);
      this.rebuildTooltip(sender);
    }, this.updateDelay);
  }

  close(forced) {
    clearTimeout(this.closeTimer);

    let ignore = false;

    document.querySelectorAll(':hover').forEach((element) => {
      if (element.classList.contains('ogl_tooltip')) ignore = true;
      if (element.classList.contains('ogl_highlight')) ignore = true;
      if (element.classList.contains('ogl_close')) ignore = false;
    });

    if (!ignore || forced) {
      document.querySelectorAll('.ogl_highlight').forEach((e) => e.classList.remove('ogl_highlight'));
      this.dom.classList.remove('ogl_active');
      this.lastSender = false;
    }
  }

  updateBeforeDisplay(sender) {
    if (this.container.querySelector('.fleetinfo')) {
      if (sender.closest('.allianceAttack')) {
        this.container.querySelector('.fleetinfo').classList.add('ogl_ignored');
        return;
      }

      this.container.querySelectorAll('.fleetinfo tr').forEach((line) => {
        if (line.textContent.trim() == '') line.classList.add('ogl_hidden');
        else if (!line.querySelector('td')) line.classList.add('ogl_full');
        else {
          let name = line.querySelector('td').textContent.replace(':', '');
          let id = (Object.entries(this.ogl.db.ships).find((e) => e[1].name == name) || [false])[0];
          if (!id)
            id = Util.findObjectByValue(this.ogl.db.loca, line.querySelector('td').textContent.replace(':', '')) || -1;
          if (id && line.querySelector('.value')) {
            line.classList.add('ogl_' + id);
            line.querySelector('td').textContent = '';
            line.querySelector('td').className = 'ogl_shipIcon ogl_' + id;

            line.title = line.querySelector('.value').textContent;
            line.querySelector('.value').textContent = Util.formatToUnits(line.querySelector('.value').textContent);

            if (this.ogl.db.options.togglesOff.indexOf('fleetDetailsName') == -1) {
              line.appendChild(Util.createDom('div', { class: 'fleetDetailsName' }, name));
              line.classList.add('ogl_activeNames');
            }
          }
        }
      });

      this.container.querySelector('h1').remove();
      this.container.querySelector('.splitLine').remove();
      this.container.querySelector('.ogl_full').remove();
    }

    if (sender.classList.contains('moonlink')) {
      sender.classList.add('tooltipRight');
      sender.classList.remove('tooltipLeft');

      if (this.ogl.db.options.togglesOff.indexOf('rightMenuTooltips') == -1) {
        return true;
      }
    } else if (sender.classList.contains('planetlink')) {
      sender.classList.remove('tooltipRight');
      sender.classList.add('tooltipLeft');
      //this.position.x += sender.closest('[data-panel="stock"]') ? 80 : 45;

      //this.container.querySelectorAll('a').forEach(e => e.remove());

      if (this.ogl.db.options.togglesOff.indexOf('rightMenuTooltips') == -1) {
        return true;
      }
    }

    if (sender.closest('#top') || sender.closest('#box')) {
      sender.classList.add('tooltipBottom');
      sender.classList.remove('tooltip');
    }
  }
}

export default TooltipManager;
