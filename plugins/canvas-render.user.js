// ==UserScript==
// @id             iitc-plugin-canvas-render@jonatkins
// @name           IITC plugin: Use Canvas rendering
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] 實驗: 使用基於canvas的渲染效果. 可以更快的檢視密集區域. 到目前為止還是限量測試中.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          unsafeWindow
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
      title:'Canvas Render 警告',
      text:'Canvas Rendering plugin 畫布喧染啟用失敗. 若太晚初始化則會發生這個現象.\n'
          +'請試著把Canvas Render的userscripts移動到比IITC主script前面.'
    });
  }

};

var setup =  window.plugin.canvasRendering.setup;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
