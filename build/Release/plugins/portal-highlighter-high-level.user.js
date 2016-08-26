// ==UserScript==
// @id             iitc-plugin-highlight-portals-high-level
// @name           IITC plugin: highlight high level portals
// @category       Highlighter
// @version        0.1.0.20160826.64659
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/portal-highlighter-high-level.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/portal-highlighter-high-level.user.js
// @description    [Release-2016-08-26-064659] 使用Portal填充顏色來表示高級別的Portal: L8紫色, L7紅色, L6橘色
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


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'Release';
plugin_info.dateTimeVersion = '20160826.64659';
plugin_info.pluginId = 'portal-highlighter-high-level';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHighlighterPortalsHighLevel = function() {};

window.plugin.portalHighlighterPortalsHighLevel.colorLevel = function(data) {
  var portal_level = data.portal.options.data.level;
  var opacity = 0.7;
  var color = undefined;

  switch (portal_level) {
    case 6: color='orange'; break;
    case 7: color='red'; break;
    case 8: color='magenta'; break;
  }

  if (color) {
    data.portal.setStyle({fillColor: color, fillOpacity: opacity});
  }
}

var setup =  function() {
  window.addPortalHighlighter('高等能量塔', window.plugin.portalHighlighterPortalsHighLevel.colorLevel);
}

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


