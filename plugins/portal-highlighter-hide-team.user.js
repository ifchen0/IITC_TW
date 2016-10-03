// ==UserScript==
// @id             iitc-plugin-highlight-hide-team@vita10gy
// @name           IITC plugin: Hide portal ownership
// @category       螢光筆
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] 將所有能量塔顯示為中立狀態.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterHideOwnership = function() {};

window.plugin.portalHighlighterHideOwnership.highlight = function(data) {
  var scale = window.portalMarkerScale();

  var params = getMarkerStyleOptions({team: TEAM_NONE, level: 0});
  data.portal.setStyle(params);
}

var setup =  function() {
  window.addPortalHighlighter('能量塔顯示為中立', window.plugin.portalHighlighterHideOwnership.highlight);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
