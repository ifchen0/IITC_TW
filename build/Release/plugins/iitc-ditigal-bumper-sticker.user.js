// ==UserScript==
// @id             iitc-digital-bumper-sticker
// @name           IITC Digital Bumper Sticker
// @category       Stock
// @version        0.1.1.20160901.52323
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/iitc-ditigal-bumper-sticker.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/iitc-ditigal-bumper-sticker.user.js
// @description    [Release-2016-09-01-052323] Adds a "I'd rather be using IITC" logo to the standard intel map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

var targetContainer = document.getElementById('dashboard_container');
if (targetContainer) {

  var logoDiv = document.createElement('div');
  logoDiv.setAttribute('style', "position: fixed; left: 20px; top: 130px; z-index: auto; pointer-events: none;");

  var img = document.createElement('img');
  img.setAttribute('src', 'http://iitc.me/assets/img/prefer-iitc-200.png');

  logoDiv.appendChild(img);

  targetContainer.appendChild(logoDiv);
}
