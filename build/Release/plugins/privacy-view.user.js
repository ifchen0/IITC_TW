// ==UserScript==
// @id             iitc-plugin-privacy-view@Scrool
// @name           IITC plugin: Privacy view on Intel
// @version        1.0.1.20160716.174716
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    [Release-2016-07-16-174716] 在IITC畫面上隱藏玩家資訊.
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/privacy-view.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/privacy-view.user.js
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
plugin_info.dateTimeVersion = '20160716.174716';
plugin_info.pluginId = 'privacy-view';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.privacyView = function() {};

window.plugin.privacyView.chatExpanded = function() {
  return $('#chat, #chatcontrols').hasClass('expand');
};

window.plugin.privacyView.toggle = function() {
  if($('#chat').hasClass('expand')) window.plugin.privacyView.wrapChatToggle();

  var b = $('body');
  var t = $('#privacycontrols .toggle');
  if(b.hasClass('privacy_active')) {
    b.removeClass('privacy_active').addClass('privacy_inactive');
    t.text('隱私模式停用');
  } else {
    b.removeClass('privacy_inactive').addClass('privacy_active');
    t.text('隱私模式啟用');
    if(window.plugin.privacyView.chatExpanded()) {
      window.plugin.privacyView.wrapChatToggle();
    }
  }
};

window.plugin.privacyView.wrapChatToggle = function() {
  if($(document.body).hasClass('privacy_active')) return;

  window.chat.toggle();
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#privacycontrols').removeClass('shrinked').addClass('expanded');
  } else {
    $('#privacycontrols').removeClass('expanded').addClass('shrinked');
  }
};

window.plugin.privacyView.setup = function() {
  var privacy_button_width = 135;
  $('head').append('<style>' +
    '.privacy_active #playerstat,' +
    '.privacy_active #chatinput,' +
    '.privacy_active #chatcontrols,' +
    '.privacy_active #chat { display: none; }' +
    '#privacycontrols {' +
    '  color: #FFCE00;' +
    '  background: rgba(8, 48, 78, 0.9);' +
    '  position: absolute;' +
    '  left: 0;' +
    '  z-index: 3001;' +
    '  height: 26px;' +
    '  padding-left:1px;' +
    '  bottom: 82px;' +
    '}' +
    '#privacycontrols a {' +
    '  margin-left: -1px;' +
    '  display: inline-block;' +
    '  width: ' + privacy_button_width + 'px;' +
    '  text-align: center;' +
    '  height: 24px;' +
    '  line-height: 24px;' +
    '  border: 1px solid #20A8B1;' +
    '  vertical-align: top;' +
    '}' +
    '#privacycontrols a {' +
    '  text-decoration: none !important;' +
    '}' +
    '#privacycontrols .toggle {' +
    '  border-left: 10px solid transparent;' +
    '  border-right: 10px solid transparent;' +
    '  width: auto;' +
    '}' +
    '#chatcontrols {' +
    '  left: ' + (privacy_button_width + 1) + 'px;' +
    '}' +
    '#privacycontrols.expanded { top: 0; bottom: auto; }' +
    '#privacycontrols.shrinked { bottom: 82px; }' +
    '.privacy_active #privacycontrols { bottom: 0; }' +
    '</style>');

  $('body').addClass('privacy_inactive');

  //Wrap iitc chat toggle to update our elements
  $('#chatcontrols a:first').unbind('click');
  $('#chatcontrols a:first').click(window.plugin.privacyView.wrapChatToggle);

  $('#chatcontrols').before('<div id="privacycontrols" class="shrinked">' +
    '  <a accesskey="9" title="[9]"><span class="toggle"></span></a>' +
    '</div>');
  $('#privacycontrols a').click(window.plugin.privacyView.toggle);

  window.plugin.privacyView.toggle();
};

var setup = window.plugin.privacyView.setup;

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


