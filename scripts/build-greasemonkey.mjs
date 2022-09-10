#!/usr/bin/env node
import fs from 'fs';

const packageJSON = fs.readFileSync('./package.json', { encoding: 'utf-8' });
const pkg = JSON.parse(packageJSON);

fs.mkdirSync('./build/', { recursive: true });

console.log(`Building greasemonkey script v${pkg.version}...`);

const userscriptHeader = `
// ==UserScript==
// @name         OGLight Community
// @version      ${pkg.version}
// @description  OGLight script for OGame
// @author       Oz
// @license      MIT
// @copyright    2019, Oz, 2022 Kursion
// @match        https://*.ogame.gameforge.com/game/*
// @run-at       document-start
// ==/UserScript==
'use strict';
`;

const mainScript = fs.readFileSync('./build/main.js', { encoding: 'utf-8' });
const cssStyle = fs.readFileSync('./style.css', { encoding: 'utf-8' });

const packed =
  userscriptHeader +
  mainScript +
  `
const style = document.createElement("style");
style.innerHTML = \`${cssStyle}\`

const head = document.querySelector("head");
head.append(style);
`;

console.log(`Releasing greasemonkey script v${pkg.version}...`);
fs.writeFileSync(`./dist/v${pkg.version}-userscript.js`, packed);
console.log('Done ✓');
