// ==UserScript==
// @id             iitc-plugin-canvas-render@jonatkins
// @name           IITC plugin: Use Canvas rendering
// @category       調整
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] 實驗性質: 捨棄SVG並使用CANVAS繪圖來大幅增加密集能量塔的顯示速度
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


@@PLUGINSTART@@

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

@@PLUGINEND@@
