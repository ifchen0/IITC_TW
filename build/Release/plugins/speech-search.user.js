// ==UserScript==
// @id             iitc-plugin-speech-search
// @name           IITC Plugin: Speech Search
// @version        0.0.1.20161014.111523
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/speech-search.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/speech-search.user.js
// @description    [Release-2016-10-14-111523] Allow speech input for location search (webkit only for now - NOT Firefox).
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
plugin_info.dateTimeVersion = '20161014.111523';
plugin_info.pluginId = 'speech-search';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.speechSearch = function() {};

window.plugin.speechSearch.setup = function() {
    // Give the search input the speech attribute
    $("#search").attr("x-webkit-speech", "");
    // Immediately search without further input
    $("#search").bind("webkitspeechchange", function() {
        $("#search").trigger($.Event("keypress", {keyCode: 13}));
    });
};

var setup = window.plugin.speechSearch.setup;

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


