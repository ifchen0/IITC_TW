// ==UserScript==
// @id             iitc-plugin-show-address@vita10gy
// @name           IITC plugin: show portal address in sidebar
// @category       能量塔資訊
// @version        0.3.0.20161006.121049
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/show-address.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/show-address.user.js
// @description    [Release-2016-10-06-121049] 顯示能量塔的實際地址
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


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'Release';
plugin_info.dateTimeVersion = '20161006.121049';
plugin_info.pluginId = 'show-address';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

//Reverse geocoding in portal details #810

// use own namespace for plugin
window.plugin.portalAddress = function() {};

window.plugin.portalAddress.portalDetail = function(data) {
  // If there's 4 sets of comma delimited info the last one is the
  // country, so get rid of it. If the country is in the [2] then it
  // doesn't matter because address is usually short enough to fit.
  var d = data.portalDetails;
  $.ajax({url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+(d.latE6/1e6)+","+(d.lngE6/1e6)+"&sensor=false"})
  .done(function( data ) {
      var address = data.results[0].formatted_address;
      if (address) {
        address = address.split(',').splice(0,3).join(',');
        $('.imgpreview').append('<div id="address">'+address+'</div>');
      }
    });

}

var setup =  function() {
  window.addHook('portalDetailsUpdated', window.plugin.portalAddress.portalDetail);
  $('head').append('<style>' +
    '.res #address { border: 1px solid #0076b6; }' +
    '.enl #address { border: 1px solid #017f01; }' +
    '#address { position: absolute; bottom: 0; left: 5px; right: 8px; padding: 3px; font-size: 11px; background-color: rgba(0, 0, 0, 0.7); text-align: center; overflow: hidden; }' +
    '</style>');
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

