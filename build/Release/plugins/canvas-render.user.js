// ==UserScript==
// @id             iitc-plugin-canvas-render@jonatkins
// @name           IITC plugin: Use Canvas rendering
// @category       調整
// @version        0.1.0.20161006.121049
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/canvas-render.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/canvas-render.user.js
// @description    [Release-2016-10-06-121049] 實驗性質: 捨棄SVG並使用CANVAS繪圖來大幅增加密集能量塔的顯示速度
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          unsafeWindow
// @run-at         document-start
// ==/UserScript==

// NON-STANDARD plugin - try and set the variable early, as
// we need this global variable set before leaflet initialises
window.L_PREFER_CANVAS = true;
if (typeof unsafeWindow !== 'undefined') unsafeWindow.L_PREFER_CANVAS = true;  //doesn't actually work... :/



function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'Release';
plugin_info.dateTimeVersion = '20161006.121049';
plugin_info.pluginId = 'canvas-render';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// we need this global variable set before leaflet initialises
window.L_PREFER_CANVAS = true;

// use own namespace for plugin
window.plugin.canvasRendering = function() {};

window.plugin.canvasRendering.setup  = function() {

  // nothing we can do here - other than check that canvas rendering was enabled
  if (!L.Path.CANVAS) {
    dialog({
      title:'畫布渲染警告',
    text:'畫布渲染外掛未能啟用單張畫布渲染. 可能是因為腳本太晚初始化.\n'
        +'試著把腳本移動到IITC主要腳本之前.'
    });
  }

};

var setup =  window.plugin.canvasRendering.setup;

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


