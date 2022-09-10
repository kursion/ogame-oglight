class Util {
  static importToPTRE(apiKey, ogl) {
    Util.getJSON(`https://ptre.chez.gg/scripts/oglight_import.php?team_key=${ogl.ptre}&sr_id=${apiKey}`, (result) => {
      fadeBox(result.message_verbose, result.code != 1);
    });
  }

  static genTrashsimLink(apiKey, ogl) {
    let coords = ogl.current.coords;

    let jsonTechs = {
      0: [
        {
          planet: {
            galaxy: coords[0],
            system: coords[1],
            position: coords[2],
          },
          class: ogl.account.class,
          characterClassesEnabled: true,
          research: {},
        },
      ],
    };

    for (let [key, value] of Object.entries(ogl.db.me.techs)) {
      jsonTechs[0][0].research[key] = { level: value };
    }

    jsonTechs = btoa(JSON.stringify(jsonTechs));
    let lang = ogl.universe.lang == 'us' ? 'en' : ogl.universe.lang;

    return 'https://trashsim.universeview.be/' + lang + '?SR_KEY=' + apiKey + '#prefill=' + jsonTechs;
  }

  static getXML(url, callback) {
    let cancelController = new AbortController();
    let signal = cancelController.signal;

    fetch(url, { signal: signal })
      .then((response) => response.text())
      .then((data) => {
        let xml = new DOMParser().parseFromString(data, 'text/html');
        callback(xml);
      })
      .catch((error) => console.log(`Failed to fetch ${url} : ${error}`));

    window.addEventListener('beforeunload', () => cancelController.abort());
  }

  static getJSON(url, callback) {
    let cancelController = new AbortController();
    let signal = cancelController.signal;

    fetch(url, { signal: signal })
      .then((response) => response.json())
      .then((data) => callback(data))
      .catch((error) => console.log(`Failed to fetch ${url} : ${error}`));

    window.addEventListener('beforeunload', () => cancelController.abort());
  }

  static getRaw(url, callback) {
    let cancelController = new AbortController();
    let signal = cancelController.signal;

    fetch(url, { method: 'get', signal: signal, headers: { Accept: 'application/json' } })
      .then((response) => response.text())
      .then((data) => callback(data))
      .catch((error) => console.log(`Failed to fetch ${url} : ${error}`));

    window.addEventListener('beforeunload', () => cancelController.abort());
  }

  static createDom(element, params, content) {
    params = params || {};
    content = content ?? '';

    let dom = document.createElement(element);
    Object.entries(params).forEach((p) => dom.setAttribute(p[0], p[1]));
    dom.innerHTML = content;

    return dom;
  }

  static updateCheckIntInput(callback) {
    let old = checkIntInput;

    checkIntInput = function (id, minVal, maxVal) {
      old.call(window, id, minVal, maxVal);
      callback();
    };
  }

  static formatToUnits(value, forced, offset) {
    if (!value) return 0;

    value = value.toString().replace(/[\,\. ]/g, '');

    if (isNaN(value)) return value;

    let precision = 0;

    value = parseInt(value);

    if (value == 0 || forced == 0 || value < 1000) precision = 0;
    else if (value < 1000000 || forced == 1) precision = 1;
    else precision = 2;

    // const abbrev = ['', LocalizationStrings.unitKilo, LocalizationStrings.unitMega, LocalizationStrings.unitMilliard];
    const abbrev = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
    const unrangifiedOrder = Math.floor(Math.log10(Math.abs(value)) / 3);
    const order = Math.max(0, Math.min(unrangifiedOrder, abbrev.length - 1));
    const suffix = abbrev[order];

    let result = (value / Math.pow(10, order * 3)).toFixed(precision);

    /*if(offset)
        {
            result = `<span style="font-size:${Math.max(10 + Math.floor((order-1) * 1.5), 10)}px;">${result} ${suffix}</span>`;
        }
        else
        {
            result = suffix ? result + ' ' + suffix : result;
        }*/

    return suffix ? result + ' ' + suffix : result;
  }

  static formatFromUnits(value) {
    if (!value) return 0;
    let offset = (value.split(LocalizationStrings.thousandSeperator).length - 1) * 3;

    if (LocalizationStrings.thousandSeperator == LocalizationStrings.decimalPoint) offset = 0;

    let splitted = value.match(/\d+/g)[0].length;
    //let splitted = value.split(/[\,\.]/g)[0].length;
    //if(value.match(/\d+/g) && value.match(/\d+/g).map(Number).length == 1) splitted -= 1;

    if (value.indexOf(LocalizationStrings.unitMilliard) > -1) {
      //let padEnd = value.indexOf(LocalizationStrings.thousandSeperator) > -1 ? 12 : 9;
      value = value.replace(LocalizationStrings.unitMilliard, '');
      value = value.replace(/[\,\. ]/g, '');
      value = value.padEnd(9 + offset + splitted, '0');
    } else if (value.indexOf(LocalizationStrings.unitMega) > -1) {
      value = value.replace(LocalizationStrings.unitMega, '');
      value = value.replace(/[\,\. ]/g, '');
      value = value.padEnd(6 + offset + splitted, '0');
    } else if (value.indexOf(LocalizationStrings.unitKilo) > -1) {
      value = value.replace(LocalizationStrings.unitKilo, '');
      value = value.replace(/[\,\. ]/g, '');
      value = value.padEnd(3 + offset + splitted, '0');
    } else {
      value = value.replace(/[\,\. ]/g, '');
    }

    return parseInt(value);
  }

  static formatNumber(number) {
    return (number || '0').toLocaleString('de-DE');
  }

  static findObjectByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }
}

export default Util;
