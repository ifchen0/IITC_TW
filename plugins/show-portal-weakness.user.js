// ==UserScript==
// @id             iitc-plugin-show-portal-weakness@vita10gy
// @name           IITC plugin: show portal weakness
// @category       螢光筆
// @version        0.7.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] 使用Portal的填充顏色來顯示，如果Portal能量低下則會漸漸變成紅色, Portal圓的空洞代表缺少的震盪器數目.
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

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalWeakness = function() {};

window.plugin.portalWeakness.highlightWeakness = function(data) {

  if(data.portal.options.data.resCount !== undefined && data.portal.options.data.health !== undefined && data.portal.options.team != TEAM_NONE) {
    var res_count = data.portal.options.data.resCount;
    var portal_health = data.portal.options.data.health;
    if(portal_health < 100 || res_count < 8) {
      var params;
      if(portal_health > 90) {params = {fillOpacity: 0.4}; } else
      if(portal_health > 80) {params = {fillOpacity: 0.2}; } else
      if(portal_health > 70) {params = {fillColor: 'red', fillOpacity: 0.1}; } else
      if(portal_health > 60) {params = {fillColor: 'red', fillOpacity: 0.2}; } else
      if(portal_health > 50) {params = {fillColor: 'red', fillOpacity: 0.3}; } else
      if(portal_health > 40) {params = {fillColor: 'red', fillOpacity: 0.4}; } else
      if(portal_health > 30) {params = {fillColor: 'red', fillOpacity: 0.5}; } else
      if(portal_health > 20) {params = {fillColor: 'red', fillOpacity: 0.6}; } else
      if(portal_health > 10) {params = {fillColor: 'red', fillOpacity: 0.7}; } else
                             {params = {fillColor: 'red', fillOpacity: 0.8}; }
      // Hole per missing resonator
      if (res_count < 8) {
        var dash = new Array((8 - res_count) + 1).join("1,4,") + "100,0";
        params.dashArray = dash;
      }
      data.portal.setStyle(params);
    }
  }
};

var setup =  function() {
  window.addPortalHighlighter('能量塔強度', window.plugin.portalWeakness.highlightWeakness);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
