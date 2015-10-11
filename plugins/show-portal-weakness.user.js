// ==UserScript==
// @id             iitc-plugin-show-portal-weakness@vita10gy
// @name           IITC plugin: show portal weakness
// @category       Highlighter
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

    // Remove warning color for missing res.
    //var strength = (res_count/8) * (portal_health/100);
   
    if(portal_health < 100 || res_count < 8) {
      // Helth > 80%, reduce team color.
      if(portal_health > 80) {
        var fill_opacity = (portal_health-80)*0.025;
        var params = {fillOpacity: fill_opacity};
      }
      // Health <= 80%, increase warning color.
      else {
        var fill_opacity = (100-(portal_health-20))*0.00625;
        var params = {fillColor: 'red', fillOpacity: fill_opacity};
      }
	  
      // Hole per missing resonator
      if (res_count < 8) {
        var dash = new Array((8 - res_count) + 1).join("1,4,") + "100,0"
        params.dashArray = dash;
      }

      data.portal.setStyle(params);
    } 
  }

}

var setup =  function() {
  window.addPortalHighlighter('Portal強度', window.plugin.portalWeakness.highlightWeakness);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
