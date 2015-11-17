// ==UserScript==
// @id             ingress-intel-total-conversion@jonatkins
// @name           IITC: Ingress intel map total conversion
// @version        0.25.2.20151117.4022
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/mobile/total-conversion-build.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/mobile/total-conversion-build.user.js
// @description    [mobile-2015-11-17-004022] Total conversion for the ingress intel map.
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


// REPLACE ORIG SITE ///////////////////////////////////////////////////
if(document.getElementsByTagName('html')[0].getAttribute('itemscope') != null)
  throw('Ingress Intel 網站關閉了, 不是 IITC userscript 的問題.');
window.iitcBuildDate = '2015-11-17-004022';

// disable vanilla JS
window.onload = function() {};
document.body.onload = function() {};


//originally code here parsed the <Script> tags from the page to find the one that defined the PLAYER object
//however, that's already been executed, so we can just access PLAYER - no messing around needed!

if (typeof(window.PLAYER)!="object" || typeof(window.PLAYER.nickname) != "string") {
  // page doesn’t have a script tag with player information.
  if(document.getElementById('header_email')) {
    // however, we are logged in.
    // it used to be regularly common to get temporary 'account not enabled' messages from the intel site.
    // however, this is no longer common. more common is users getting account suspended/banned - and this
    // currently shows the 'not enabled' message. so it's safer to not repeatedly reload in this case
//    setTimeout('location.reload();', 3*1000);
    throw("您已經登入, 但頁面找不到玩家資料.");
  }
  // FIXME: handle nia takedown in progress
  throw("無法接收玩家資料. 您有登入了嗎?");
}


// player information is now available in a hash like this:
// window.PLAYER = {"ap": "123", "energy": 123, "available_invites": 123, "nickname": "somenick", "team": "ENLIGHTENED||RESISTANCE"};

// remove complete page. We only wanted the user-data and the page’s
// security context so we can access the API easily. Setup as much as
// possible without requiring scripts.
document.getElementsByTagName('head')[0].innerHTML = ''
  + '<title>Ingress Intel 地圖</title>'
  + '<style>/* general rules ******************************************************/\n\n/* for printing directly from the browser, hide all UI components\n * NOTE: @media needs to be first?\n */\n@media print {\n  .leaflet-control-container { display: none !important; }\n  #chatcontrols, #chat, #chatinput { display: none !important; }\n  #sidebartoggle, #sidebar { display: none !important; }\n  #updatestatus { display: none !important; }\n  #portal_highlight_select { display: none !important; }\n}\n\n\nhtml, body, #map {\n  height: 100%;\n  width: 100%;\n  overflow: hidden; /* workaround for #373 */\n  background: #000000;\n}\n\n\nbody {\n  font-size: 14px;\n  font-family: "Roboto", "Helvetica Neue", Helvetica, sans-serif;\n  margin: 0;\n}\n\n#scrollwrapper {\n  overflow-x: hidden;\n  overflow-y: auto;\n  position: fixed;\n  right: -38px;\n  top: 0;\n  width: 340px;\n  bottom: 45px;\n  z-index: 1001;\n  pointer-events: none;\n}\n\n#sidebar {\n  background-color: rgba(8, 48, 78, 0.9);\n  border-left: 1px solid #20A8B1;\n  color: #888;\n  position: relative;\n  left: 0;\n  top: 0;\n  max-height: 100%;\n  overflow-y:scroll;\n  overflow-x:hidden;\n  z-index: 3000;\n  pointer-events: auto;\n}\n\n#sidebartoggle {\n  display: block;\n  padding: 20px 5px;\n  margin-top: -31px; /* -(toggle height / 2) */\n  line-height: 10px;\n  position: absolute;\n  top: 108px;\n  z-index: 3001;\n  background-color: rgba(8, 48, 78, 0.9);\n  color: #FFCE00;\n  border: 1px solid #20A8B1;\n  border-right: none;\n  border-radius: 5px 0 0 5px;\n  text-decoration: none;\n  right: -50px; /* overwritten later by the script with SIDEBAR_WIDTH */\n}\n\n.enl {\n  color: #03fe03 !important;\n}\n\n.res {\n  color: #00c5ff !important;\n}\n\n.none {\n  color: #fff;\n}\n\n.nickname {\n  cursor: pointer !important;\n}\n\na {\n  color: #ffce00;\n  cursor: pointer;\n  text-decoration: none;\n}\n\na:hover {\n  text-decoration: underline;\n}\n\n/* map display, required because GMaps uses a high z-index which is\n * normally above Leaflet’s vector pane */\n.leaflet-map-pane {\n  z-index: 1000;\n}\n\n/* leaflet layer chooser, when opened, is above other panels */\n/* doesn\'t actually work :( - left commented out for reference\n.leaflet-control-layers-expanded {\n  z-index: 9999 !important;\n}\n*/\n\n\n.leaflet-control-layers-overlays label.disabled {\n  text-decoration: line-through;\n  cursor: help;\n}\n\n\n\n/* base layer selection - first column */\n.leaflet-control-layers-base {\n  float: left;\n  overflow-y: auto;\n  max-height: 600px;\n}\n\n/* overlays layer selection - 2nd column */\n.leaflet-control-layers-overlays {\n  float: left;\n  margin-left: 8px;\n  border-left: 1px solid #DDDDDD;\n  padding-left: 8px;\n  overflow-y: auto;\n  max-height: 600px;\n}\n\n/* hide the usual separator */\n.leaflet-control-layers-separator {\n  display: none;\n}\n\n\n\n.help {\n  cursor: help;\n}\n\n.toggle {\n  display: block;\n  height: 0;\n  width: 0;\n}\n\n/* field mu count */\n.fieldmu {\n  color: #FFCE00;\n  font-size: 13px;\n  font-family: Roboto, "Helvetica Neue", Helvetica, sans-serif; /*override leaflet-container */\n  text-align: center;\n  text-shadow: 0 0 0.2em black, 0 0 0.2em black, 0 0 0.2em black;\n  pointer-events: none;\n}\n\n\n/* chat ***************************************************************/\n\n#chatcontrols {\n  color: #FFCE00;\n  background: rgba(8, 48, 78, 0.9);\n  position: absolute;\n  left: 0;\n  z-index: 3000;\n  height: 26px;\n  padding-left:1px;\n}\n\n#chatcontrols.expand {\n  top: 0;\n  bottom: auto;\n}\n\n#chatcontrols a {\n  margin-left: -1px;\n  display: inline-block;\n  width: 94px;\n  text-align: center;\n  height: 24px;\n  line-height: 24px;\n  border: 1px solid #20A8B1;\n  vertical-align: top;\n}\n\n#chatcontrols a:first-child {\n  letter-spacing:-1px;\n  text-decoration: none !important;\n}\n\n#chatcontrols a.active {\n  border-color: #FFCE00;\n  border-bottom-width:0px;\n  font-weight:bold;\n  background: rgb(8, 48, 78);\n}\n\n#chatcontrols a.active + a {\n  border-left-color: #FFCE00\n}\n\n\n#chatcontrols .toggle {\n  border-left: 10px solid transparent;\n  border-right: 10px solid transparent;\n  margin: 6px auto auto;\n}\n\n#chatcontrols .expand {\n  border-bottom: 10px solid #FFCE00;\n}\n\n#chatcontrols .shrink {\n  border-top: 10px solid #FFCE00;\n}\n\n#chatcontrols .loading {\n  background-color: rgba(255,0,0,0.3);\n  -webkit-animation: chatloading 1.2s infinite linear;\n  -moz-animation: chatloading 1.2s infinite linear;\n  animation: chatloading 1.2s infinite linear;\n}\n\n@-webkit-keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n@-moz-keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n@keyframes chatloading {\n    0% { background-color: rgba(255,0,0,0.4) }\n   50% { background-color: rgba(255,0,0,0.1) }\n  100% { background-color: rgba(255,0,0,0.4) }\n}\n\n\n\n#chat {\n  position: absolute;\n  width: 708px;\n  bottom: 23px;\n  left: 0;\n  z-index: 3000;\n  background: rgba(8, 48, 78, 0.9);\n  line-height: 15px;\n  color: #eee;\n  border: 1px solid #20A8B1;\n  border-bottom: 0;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\nem {\n  color: red;\n  font-style: normal;\n}\n\n#chat.expand {\n  height:auto;\n  top: 25px;\n}\n\n\n#chat > div {\n  overflow-x:hidden;\n  overflow-y:scroll;\n  height: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  padding: 2px;\n  position:relative;\n}\n\n#chat table, #chatinput table {\n  width: 100%;\n  table-layout: fixed;\n  border-spacing: 0;\n  border-collapse: collapse;\n}\n\n#chatinput table {\n  height: 100%;\n}\n\n#chat td, #chatinput td {\n  font-size: 13px;\n  vertical-align: top;\n  padding-bottom: 3px;\n}\n\n/* time */\n#chat td:first-child, #chatinput td:first-child {\n  width: 44px;\n  overflow: hidden;\n  padding-left: 2px;\n  color: #bbb;\n  white-space: nowrap;\n}\n\n#chat time {\n  cursor: help;\n}\n\n/* nick */\n#chat td:nth-child(2), #chatinput td:nth-child(2) {\n  width: 91px;\n  overflow: hidden;\n  padding-left: 2px;\n  white-space: nowrap;\n}\n\n#chat td .system_narrowcast {\n  color: #f66 !important;\n}\n\nmark {\n  background: transparent;\n}\n\n.invisep {\n  display: inline-block;\n  width: 1px;\n  height: 1px;\n  overflow:hidden;\n  color: transparent;\n}\n\n/* divider */\nsummary {\n  color: #bbb;\n  display: inline-block;\n  height: 16px;\n  overflow: hidden;\n  padding: 0 2px;\n  white-space: nowrap;\n  width: 100%;\n}\n\n#chatinput {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  padding: 0 2px;\n  background: rgba(8, 48, 78, 0.9);\n  width: 708px;\n  height: 23px;\n  border: 1px solid #20A8B1;\n  z-index: 3001;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#chatinput td {\n  padding-bottom: 1px;\n  vertical-align: middle;\n}\n\n\n#chatinput input {\n  background: transparent;\n  color: #EEEEEE;\n  width: 100%;\n  height: 100%;\n  padding:3px 4px 1px 4px;\n}\n\n\n\n/* sidebar ************************************************************/\n\n#sidebar > * {\n  border-bottom: 1px solid #20A8B1;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n\n\n#sidebartoggle .toggle {\n  border-bottom: 10px solid transparent;\n  border-top: 10px solid transparent;\n}\n\n#sidebartoggle .open {\n  border-right: 10px solid #FFCE00;\n}\n\n#sidebartoggle .close {\n  border-left: 10px solid #FFCE00;\n}\n\n/* player stats */\n#playerstat {\n  height: 30px;\n}\n\nh2 {\n  color: #ffce00;\n  font-size: 21px;\n  padding: 0 4px;\n  margin: 0;\n  cursor:help;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  width: 100%;\n}\n\nh2 #name {\n  font-weight: 300;\n  display: inline-block;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  vertical-align: top;\n  white-space: nowrap;\n  width: 205px;\n  position: relative;\n}\n\nh2 #stats {\n  float: right;\n  height: 100%;\n  overflow: hidden;\n}\n\n#signout {\n  font-size: 12px;\n  font-weight: normal;\n  line-height: 29px;\n  padding: 0 4px;\n  position: absolute;\n  top: 0;\n  right: 0;\n  background-color: rgba(8, 48, 78, 0.5);\n  display: none; /* starts hidden */\n}\n#name:hover #signout {\n  display: block;\n}\n\nh2 sup, h2 sub {\n  display: block;\n  font-size: 11px;\n  margin-bottom: -2px;\n}\n\n\n/* gamestats */\n#gamestat {\n  height: 22px;\n}\n\n#gamestat span {\n  display: block;\n  float: left;\n  font-weight: bold;\n  cursor:help;\n  height: 21px;\n  line-height: 22px;\n}\n\n#gamestat .res {\n  background: #005684;\n  text-align: right;\n}\n\n#gamestat .enl {\n  background: #017f01;\n}\n\n\n/* search input, and others */\ninput:not([type]), .input,\ninput[type="text"], input[type="password"],\ninput[type="number"], input[type="email"],\ninput[type="search"], input[type="url"] {\n  background-color: rgba(0, 0, 0, 0.3);\n  color: #ffce00;\n  height: 24px;\n  padding:0px 4px 0px 4px;\n  font-size: 12px;\n  border:0;\n  font-family:inherit;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#searchwrapper {\n  position: relative;\n}\n#search {\n  width: 100%;\n  padding-right: 24px;\n}\n#buttongeolocation {\n  position: absolute;\n  top: 2px;\n  right: 2px;\n  cursor: pointer;\n}\n#searchwrapper h3 {\n  font-size: 1em;\n  height: auto;\n  cursor: pointer;\n}\n.searchquery {\n  max-height: 25em;\n  overflow-y: auto;\n}\n#searchwrapper .ui-accordion-header::before {\n  font-size: 18px;\n  margin-right: 2px;\n  font-weight: normal;\n  line-height: 1em;\n  content: "⊞";\n}\n#searchwrapper .ui-accordion-header-active::before {\n  content: "⊟";\n}\n#searchwrapper .ui-accordion-content {\n  margin: 0;\n  overflow: hidden;\n}\n#searchwrapper ul {\n  padding-left: 14px;\n}\n#searchwrapper li {\n  cursor: pointer;\n}\n#searchwrapper li a {\n  margin-left: -14px;\n  padding-left: 14px;\n  background-position: 1px center;\n  background-repeat: no-repeat;\n  background-size: 12px 12px;\n}\n#searchwrapper li:focus a, #searchwrapper li:hover a {\n  text-decoration: underline;\n}\n#searchwrapper li em {\n  color: #ccc;\n  font-size: 0.9em;\n}\n\n::-webkit-input-placeholder {\n  font-style: italic;\n}\n\n:-moz-placeholder {\n  font-style: italic;\n}\n\n::-moz-placeholder {\n  font-style: italic;\n}\n\n.leaflet-control-layers input {\n  height: auto;\n  padding: 0;\n}\n\n\n/* portal title and image */\nh3 {\n  font-size: 16px;\n  padding: 0 4px;\n  margin:0;\n  height: 23px;\n  width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.imgpreview {\n  height: 190px;\n  background: no-repeat center center;\n  background-size: contain;\n  cursor: help;\n  overflow: hidden;\n  position: relative;\n}\n\n.imgpreview img.hide {\n  display: none;\n}\n\n.imgpreview .portalDetails {\n  display: none;\n}\n\n#level {\n  font-size: 40px;\n  text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000, 0 0 5px #fff;\n  display: block;\n  margin-right: 15px;\n  text-align:right;\n  float: right;\n}\n\n/* portal mods */\n.mods {\n  margin: 3px auto 1px auto;\n  width: 296px;\n  height: 67px;\n  text-align: center;\n}\n\n.mods span {\n  background-color: rgba(0, 0, 0, 0.3);\n  /* can’t use inline-block because Webkit\'s implementation is buggy and\n   * introduces additional margins in random cases. No clear necessary,\n   * as that’s solved by setting height on .mods. */\n  display: block;\n  float:left;\n  height: 63px;\n  margin: 0 2px;\n  overflow: hidden;\n  padding: 2px;\n  text-align: center;\n  width: 63px;\n  cursor:help;\n  border: 1px solid #666;\n}\n\n.mods span:not([title]) {\n  cursor: auto;\n}\n\n.res .mods span, .res .meter {\n  border: 1px solid #0076b6;\n}\n.enl .mods span, .enl .meter {\n  border: 1px solid #017f01;\n}\n\n/* random details, resonator details */\n#randdetails, #resodetails {\n  width: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  padding: 0 4px;\n  table-layout: fixed;\n  border-spacing: 0m;\n  border-collapse: collapse;\n}\n\n#randdetails td, #resodetails td {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  vertical-align: top;\n  white-space: nowrap;\n  width: 50%;\n}\n\n#randdetails th, #resodetails th {\n  font-weight: normal;\n  text-align: right;\n  width: 62px;\n  padding:0px;\n  padding-right:4px;\n  padding-left:4px;\n}\n\n#randdetails th + th, #resodetails th + th {\n  text-align: left;\n  padding-right: 4px;\n  padding-left: 4px;\n}\n\n#randdetails td:first-child, #resodetails td:first-child {\n  text-align: right;\n  padding-left: 2px;\n}\n\n#randdetails td:last-child, #resodetails td:last-child {\n  text-align: left;\n  padding-right: 2px;\n}\n\n\n#randdetails {\n  margin-top: 4px;\n  margin-bottom: 5px;\n}\n\n\n#randdetails tt {\n  font-family: inherit;\n  cursor: help;\n}\n\n#artifact_target, #artifact_fragments {\n  margin-top: 4px;\n  margin-bottom: 4px;\n\n  margin-left: 8px;\n  margin-right: 8px;\n}\n\n\n/* resonators */\n#resodetails {\n  margin-bottom: 0px;\n}\n\n.meter {\n  background: #000;\n  cursor: help;\n  display: inline-block;\n  height: 18px;\n  padding: 1px;\n  width: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  position: relative;\n  left: 0;\n  top: 0;\n}\n\n.meter.north {\n  overflow: hidden;\n}\n.meter.north:before {\n  content: "";\n  background-color: red;\n  border: 1px solid #000000;\n  border-radius: 100%;\n  display: block;\n  height: 6px;\n  width: 6px;\n  left: 50%;\n  top: -3px;\n  margin-left: -4px;\n  position: absolute;\n}\n\n.meter span {\n  display: block;\n  height: 14px;\n}\n\n.meter-level {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: -2px;\n  text-shadow: 0.0em 0.0em 0.3em #808080;\n  text-align: center;\n  word-spacing: 4px; /* to leave some space for the north indicator */\n}\n\n/* links below resos */\n\n.linkdetails {\n  margin-bottom: 0px;\n  text-align: center;\n}\n\n.linkdetails aside {\n  display: inline-block;\n  white-space: nowrap;\n  margin-left: 5px;\n  margin-right: 5px;\n}\n\n#toolbox {\n  text-align: left;    /* centre didn\'t look as nice here as it did above in .linkdetails */\n}\n\n#toolbox > a {\n  margin-left: 5px;\n  margin-right: 5px;\n  white-space: nowrap;\n  display: inline-block;\n}\n\n/* a common portal display takes this much space (prevents moving\n * content when first selecting a portal) */\n\n#portaldetails {\n  min-height: 63px;\n  position: relative; /* so the below \'#portaldetails .close\' is relative to this */\n}\n\n#portaldetails .close {\n  position: absolute;\n  top: -2px;\n  right: 2px;\n  cursor: pointer;\n  color: #FFCE00;\n  font-size: 16px;\n}\n\n/* update status */\n#updatestatus {\n  background-color: rgba(8, 48, 78, 0.9);\n  border-bottom: 0;\n  border-top: 1px solid #20A8B1;\n  border-left: 1px solid #20A8B1;\n  bottom: 0;\n  color: #ffce00;\n  font-size:13px;\n  padding: 4px;\n  position: fixed;\n  right: 0;\n  z-index: 3002;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#updatestatus .map {\n  margin-left: 8px;\n}\n\n#loadlevel {\n  background: #FFF;\n  color: #000000;\n  display: inline-block;\n  min-width: 1.8em;\n  border: 1px solid #20A8B1;\n  border-width: 0 1px;\n  margin: -4px 0;\n  padding: 4px 0.2em;\n}\n\n/* Dialogs\n */\n.ui-tooltip, .ui-dialog {\n  position: absolute;\n  z-index: 9999;\n  background-color: rgba(8, 48, 78, 0.9);\n  border: 1px solid #20A8B1;\n  color: #eee;\n  font-size: 13px;\n  line-height: 15px;\n  padding: 2px 4px;\n}\n\n.ui-tooltip {\n  max-width: 300px;\n}\n\n.ui-widget-overlay {\n  height: 100%;\n  left: 0;\n  position: fixed;\n  top: 0;\n  width: 100%;\n  z-index: 10000;\n  background:  #444;\n  opacity: 0.6;\n}\n\n.ui-modal {\n  z-index: 10001 !important;\n}\n\n.ui-tooltip {\n  z-index: 10002 !important;\n}\n\n.ui-tooltip, .ui-dialog a {\n  color: #FFCE00;\n}\n\n.ui-dialog {\n  padding: 0;\n  border-radius: 2px;\n}\n\n.ui-dialog-modal .ui-dialog-titlebar-close {\n  display: none;\n}\n\n.ui-dialog-titlebar {\n  font-size: 13px;\n  line-height: 15px;\n  text-align: center;\n  padding: 4px;\n  background-color: rgba(8, 60, 78, 0.9);\n  min-width: 250px;\n}\n\n.ui-dialog-title {\n  padding: 2px;\n  font-weight: bold;\n}\n\n.ui-dialog-title-active {\n  color: #ffce00;\n}\n\n.ui-dialog-title-inactive {\n  color: #ffffff;\n}\n\n.ui-dialog-titlebar-button {\n  position: absolute;\n  display: table-cell;\n  vertical-align: middle;\n  text-align: center;\n  width: 17px;\n  height: 17px;\n  top: 3px;\n  cursor: pointer;\n  border: 1px solid rgb(32, 168, 177);\n  background-color: rgba(0, 0, 0, 0);\n  padding: 0;\n}\n\n.ui-dialog-titlebar-button:active {\n  background-color: rgb(32, 168, 177);\n}\n\n.ui-dialog-titlebar-button-close {\n  right: 4px;\n}\n\n.ui-dialog-titlebar-button-collapse {\n  right: 25px;\n}\n\n.ui-dialog-titlebar-button-collapse-expanded {\n  /* For future changes */\n}\n\n.ui-dialog-titlebar-button-collapse-collapsed {\n  background-color: rgb(32, 168, 177);\n}\n\n.ui-dialog-titlebar-button-collapse::after,\n.ui-dialog-titlebar-button-close::after,\n.ui-dialog-titlebar-button-close::before {\n  content: "";\n  position: absolute;\n  top: 3px;\n  left: 50%;\n  width: 11px;\n  margin-left: -6px;\n  height: 0;\n  border-top: 2px solid rgb(32, 168, 177);\n}\n.ui-dialog-titlebar-button-close::after {\n  transform: translateY(3.5px) rotate(45deg);\n  -webkit-transform: translateY(3.5px) rotate(45deg);\n}\n.ui-dialog-titlebar-button-close::before {\n  transform: translateY(3.5px) rotate(-45deg);\n  -webkit-transform: translateY(3.5px) rotate(-45deg);\n}\n.ui-dialog-titlebar-button.ui-state-active::after,\n.ui-dialog-titlebar-button.ui-state-active::before,\n.ui-dialog-titlebar-button.ui-dialog-titlebar-button-collapse-collapsed::after,\n.ui-dialog-titlebar-button.ui-dialog-titlebar-button-collapse-collapsed::before,\n.ui-dialog-titlebar-button:active::after,\n.ui-dialog-titlebar-button:active::before {\n  border-top-color: rgba(8, 60, 78, 0.9);\n}\n\n.ui-dialog-content {\n  padding: 12px;\n  overflow-y: auto;\n  overflow-x: hidden;\n  max-height: 600px !important;\n  max-width: 700px !important;\n  position: relative;\n}\n\n.ui-dialog-content-hidden {\n  display: none !important;\n}\n\n.ui-dialog-buttonpane {\n  padding: 6px;\n  border-top: 1px solid #20A8B1;\n}\n\n.ui-dialog-buttonset {\n  text-align: right;\n}\n\n.ui-dialog-buttonset button,\n.ui-dialog-content button {\n  padding: 2px;\n  min-width: 40px;\n  color: #FFCE00;\n  border: 1px solid #FFCE00;\n  background-color: rgba(8, 48, 78, 0.9);\n}\n\n.ui-dialog-buttonset button:hover {\n  text-decoration: underline;\n}\n\n.ui-dialog-aboutIITC {\n  width: auto !important;\n  min-width: 400px !important;\n  max-width: 600px !important;\n}\n\ntd {\n  padding: 0;\n  vertical-align: top;\n}\n\ntd + td {\n  padding-left: 4px;\n}\n\n#qrcode > canvas {\n  border: 8px solid white;\n}\n\n/* redeem results *****************************************************/\n.redeemReward {\n  font-family: Inconsolata, Consolas, Menlo, "Courier New", monospace;\n  list-style-type: none;\n  padding: 0;\n  font-size: 14px;\n}\n.redeemReward .itemlevel {\n  font-weight: bold;\n  text-shadow: 0 0 1px #000; /* L8 is hard to read on blue background */\n}\n/*\n.redeem-result-table {\n  font-size: 14px;\n  table-layout: fixed;\n}\n\n.redeem-result tr > td:first-child {\n  width: 50px;\n  text-align: right;\n}\n\n.redeem-result-html {\n  font-family: Inconsolata, Consolas, Menlo, "Courier New", monospace;\n}\n*/\n\n.pl_nudge_date {\n  background-color: #724510;\n  border-left: 1px solid #ffd652;\n  border-bottom: 1px solid #ffd652;\n  border-top: 1px solid #ffd652;\n  color: #ffd652;\n  display: inline-block;\n  float: left;\n  height: 18px;\n  text-align: center;\n}\n\n.pl_nudge_pointy_spacer {\n  background: no-repeat url(//commondatastorage.googleapis.com/ingress.com/img/nudge_pointy.png);\n  display: inline-block;\n  float: left;\n  height: 20px;\n  left: 47px;\n  width: 5px;\n}\n\n.pl_nudge_player {\n  cursor: pointer;\n}\n\n.pl_nudge_me {\n  color: #ffd652;\n}\n\n.RESISTANCE {\n  color: #00c2ff;\n}\n\n.ALIENS, .ENLIGHTENED {\n  color: #28f428;\n}\n\n#portal_highlight_select {\n  position: absolute;\n  top:5px;\n  left:10px;\n  z-index: 2500;\n  font-size:11px;\n  background-color:#0E3C46;\n  color:#ffce00;\n  \n}\n\n\n\n.portal_details th, .portal_details td {\n  vertical-align: top;\n  text-align: left;\n}\n\n.portal_details th {\n  white-space: nowrap;\n  padding-right: 1em;\n}\n\n.portal_details tr.padding-top th, .portal_details tr.padding-top td {\n  padding-top: 0.7em;\n}\n\n#play_button {\n  display: none;\n}\n\n\n/** artifact dialog *****************/\ntable.artifact tr > * {\n  background: rgba(8, 48, 78, 0.9);\n}\n\ntable.artifact td.info {\n  min-width: 110px; /* min-width for info column, to ensure really long portal names don\'t crowd things out */\n}\n\ntable.artifact .portal {\n  min-width: 200px; /* min-width for portal names, to ensure really long lists of artifacts don\'t crowd names out */\n}\n\n\n/* leaflet popups - restyle to match the theme of IITC */\n#map .leaflet-popup {\n  pointer-events: none;\n}\n\n#map .leaflet-popup-content-wrapper {\n  border-radius: 0px;\n  -webkit-border-radius: 0px;\n  border: 1px solid #20A8B1;\n  background: rgba(8, 48, 78, 0.9);\n  pointer-events: auto;\n}\n\n#map .leaflet-popup-content {\n  color: #ffce00;\n  margin: 5px 8px;\n}\n\n#map .leaflet-popup-close-button {\n  padding: 2px 1px 0 0;\n  font-size: 12px;\n  line-height: 8px;\n  width: 10px;\n  height: 10px;\n  pointer-events: auto;\n}\n\n\n#map .leaflet-popup-tip {\n  /* change the tip from an arrow to a simple line */\n  background: #20A8B1;\n  width: 1px;\n  height: 20px;\n  padding: 0;\n  margin: 0 0 0 20px;\n  -webkit-transform: none;\n  -moz-transform: none;\n  -ms-transform: none;\n  -o-transform: none;\n  transform: none;\n}\n\n\n/* misc */\n\n.no-pointer-events {\n  pointer-events: none;\n}\n\n\n.layer_off_warning {\n  color: #FFCE00;\n  margin: 8px;\n  text-align: center;\n}\n\n/* region scores */\n.cellscore .ui-accordion-header, .cellscore .ui-accordion-content {\n	border: 1px solid #20a8b1;\n	margin-top: -1px;\n	display: block;\n}\n.cellscore .ui-accordion-header {\n	color: #ffce00;\n	outline: none\n}\n.cellscore .ui-accordion-header:before {\n	font-size: 18px;\n	margin-right: 2px;\n	content: "⊞";\n}\n.cellscore .ui-accordion-header-active:before {\n	content: "⊟";\n}\ng.checkpoint:hover circle {\n  fill-opacity: 1;\n  stroke-width: 2px;\n}\n.checkpoint_table {\n	border-collapse: collapse;\n}\n.checkpoint_table td {\n	text-align: right;\n	padding-left: 10px;\n}\n\n.text-overflow-ellipsis {\n	display: inline-block;\n	overflow: hidden;\n	white-space: nowrap;\n	text-overflow: ellipsis;\n	vertical-align: text-bottom;\n	width: 100%;\n}\n\n/* tabs */\n.ui-tabs-nav {\n	display: block;\n	border-bottom: 1px solid #20a8b1;\n	border-top: 1px solid transparent;\n	margin: 3px 0 0;\n	padding: 0;\n}\n.ui-tabs-nav::after {\n	content: \'\';\n	clear: left;\n	display: block;\n	height: 0;\n	width: 0;\n}\n.ui-tabs-nav li {\n	list-style: none;\n	display: block;\n	float:left;\n	margin: 0 0 -1px;\n	border: 1px solid #20a8b1;\n}\n.ui-tabs-nav li.ui-tabs-active {\n	border-bottom-color: #0F2C3F;\n	background: #0F2C3F;\n	border-width: 2px 2px 1px;\n	font-weight: bold;\n	margin: -1px 1px;\n}\n.ui-tabs-nav a {\n	display: inline-block;\n	padding: 0.2em 0.7em;\n}\n.ui-tabs-nav .ui-icon {\n	display: inline-block;\n	font-size: 0;\n	height: 22px;\n	overflow: hidden;\n	position: relative;\n	vertical-align: top;\n	width: 16px;\n}\n.ui-tabs-nav .ui-icon-close::before {\n	content: "×";\n	font-size: 16px;\n	height: 16px;\n	position: absolute;\n	text-align: center;\n	top: 2px;\n	vertical-align: baseline;\n	width: 16px;\n	cursor: pointer;\n}\n\n</style>'
  + '<style>/* required styles */\n\n.leaflet-map-pane,\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow,\n.leaflet-tile-pane,\n.leaflet-tile-container,\n.leaflet-overlay-pane,\n.leaflet-shadow-pane,\n.leaflet-marker-pane,\n.leaflet-popup-pane,\n.leaflet-overlay-pane svg,\n.leaflet-zoom-box,\n.leaflet-image-layer,\n.leaflet-layer {\n	position: absolute;\n	left: 0;\n	top: 0;\n	}\n.leaflet-container {\n	overflow: hidden;\n	-ms-touch-action: none;\n	}\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	-webkit-user-select: none;\n	   -moz-user-select: none;\n	        user-select: none;\n	-webkit-user-drag: none;\n	}\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	display: block;\n	}\n/* map is broken in FF if you have max-width: 100% on tiles */\n.leaflet-container img {\n	max-width: none !important;\n	}\n/* stupid Android 2 doesn\'t understand "max-width: none" properly */\n.leaflet-container img.leaflet-image-layer {\n	max-width: 15000px !important;\n	}\n.leaflet-tile {\n	filter: inherit;\n	visibility: hidden;\n	}\n.leaflet-tile-loaded {\n	visibility: inherit;\n	}\n.leaflet-zoom-box {\n	width: 0;\n	height: 0;\n	}\n/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */\n.leaflet-overlay-pane svg {\n	-moz-user-select: none;\n	}\n\n.leaflet-tile-pane    { z-index: 2; }\n.leaflet-objects-pane { z-index: 3; }\n.leaflet-overlay-pane { z-index: 4; }\n.leaflet-shadow-pane  { z-index: 5; }\n.leaflet-marker-pane  { z-index: 6; }\n.leaflet-popup-pane   { z-index: 7; }\n\n.leaflet-vml-shape {\n	width: 1px;\n	height: 1px;\n	}\n.lvml {\n	behavior: url(#default#VML);\n	display: inline-block;\n	position: absolute;\n	}\n\n\n/* control positioning */\n\n.leaflet-control {\n	position: relative;\n	z-index: 7;\n	pointer-events: auto;\n	}\n.leaflet-top,\n.leaflet-bottom {\n	position: absolute;\n	z-index: 1000;\n	pointer-events: none;\n	}\n.leaflet-top {\n	top: 0;\n	}\n.leaflet-right {\n	right: 0;\n	}\n.leaflet-bottom {\n	bottom: 0;\n	}\n.leaflet-left {\n	left: 0;\n	}\n.leaflet-control {\n	float: left;\n	clear: both;\n	}\n.leaflet-right .leaflet-control {\n	float: right;\n	}\n.leaflet-top .leaflet-control {\n	margin-top: 10px;\n	}\n.leaflet-bottom .leaflet-control {\n	margin-bottom: 10px;\n	}\n.leaflet-left .leaflet-control {\n	margin-left: 10px;\n	}\n.leaflet-right .leaflet-control {\n	margin-right: 10px;\n	}\n\n\n/* zoom and fade animations */\n\n.leaflet-fade-anim .leaflet-tile,\n.leaflet-fade-anim .leaflet-popup {\n	opacity: 0;\n	-webkit-transition: opacity 0.2s linear;\n	   -moz-transition: opacity 0.2s linear;\n	     -o-transition: opacity 0.2s linear;\n	        transition: opacity 0.2s linear;\n	}\n.leaflet-fade-anim .leaflet-tile-loaded,\n.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {\n	opacity: 1;\n	}\n\n.leaflet-zoom-anim .leaflet-zoom-animated {\n	-webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1);\n	   -moz-transition:    -moz-transform 0.25s cubic-bezier(0,0,0.25,1);\n	     -o-transition:      -o-transform 0.25s cubic-bezier(0,0,0.25,1);\n	        transition:         transform 0.25s cubic-bezier(0,0,0.25,1);\n	}\n.leaflet-zoom-anim .leaflet-tile,\n.leaflet-pan-anim .leaflet-tile,\n.leaflet-touching .leaflet-zoom-animated {\n	-webkit-transition: none;\n	   -moz-transition: none;\n	     -o-transition: none;\n	        transition: none;\n	}\n\n.leaflet-zoom-anim .leaflet-zoom-hide {\n	visibility: hidden;\n	}\n\n\n/* cursors */\n\n.leaflet-clickable {\n	cursor: pointer;\n	}\n.leaflet-container {\n	cursor: -webkit-grab;\n	cursor:    -moz-grab;\n	}\n.leaflet-popup-pane,\n.leaflet-control {\n	cursor: auto;\n	}\n.leaflet-dragging .leaflet-container,\n.leaflet-dragging .leaflet-clickable {\n	cursor: move;\n	cursor: -webkit-grabbing;\n	cursor:    -moz-grabbing;\n	}\n\n\n/* visual tweaks */\n\n.leaflet-container {\n	background: #ddd;\n	outline: 0;\n	}\n.leaflet-container a {\n	color: #0078A8;\n	}\n.leaflet-container a.leaflet-active {\n	outline: 2px solid orange;\n	}\n.leaflet-zoom-box {\n	border: 2px dotted #38f;\n	background: rgba(255,255,255,0.5);\n	}\n\n\n/* general typography */\n.leaflet-container {\n	font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;\n	}\n\n\n/* general toolbar styles */\n\n.leaflet-bar {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.65);\n	border-radius: 4px;\n	}\n.leaflet-bar a,\n.leaflet-bar a:hover {\n	background-color: #fff;\n	border-bottom: 1px solid #ccc;\n	width: 26px;\n	height: 26px;\n	line-height: 26px;\n	display: block;\n	text-align: center;\n	text-decoration: none;\n	color: black;\n	}\n.leaflet-bar a,\n.leaflet-control-layers-toggle {\n	background-position: 50% 50%;\n	background-repeat: no-repeat;\n	display: block;\n	}\n.leaflet-bar a:hover {\n	background-color: #f4f4f4;\n	}\n.leaflet-bar a:first-child {\n	border-top-left-radius: 4px;\n	border-top-right-radius: 4px;\n	}\n.leaflet-bar a:last-child {\n	border-bottom-left-radius: 4px;\n	border-bottom-right-radius: 4px;\n	border-bottom: none;\n	}\n.leaflet-bar a.leaflet-disabled {\n	cursor: default;\n	background-color: #f4f4f4;\n	color: #bbb;\n	}\n\n.leaflet-touch .leaflet-bar a {\n	width: 30px;\n	height: 30px;\n	line-height: 30px;\n	}\n\n\n/* zoom control */\n\n.leaflet-control-zoom-in,\n.leaflet-control-zoom-out {\n	font: bold 18px \'Lucida Console\', Monaco, monospace;\n	text-indent: 1px;\n	}\n.leaflet-control-zoom-out {\n	font-size: 20px;\n	}\n\n.leaflet-touch .leaflet-control-zoom-in {\n	font-size: 22px;\n	}\n.leaflet-touch .leaflet-control-zoom-out {\n	font-size: 24px;\n	}\n\n\n/* layers control */\n\n.leaflet-control-layers {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.4);\n	background: #fff;\n	border-radius: 5px;\n	}\n.leaflet-control-layers-toggle {\n	background-image: url(data:image/png;base64,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);\n	width: 36px;\n	height: 36px;\n	}\n.leaflet-retina .leaflet-control-layers-toggle {\n	background-image: url(data:image/png;base64,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);\n	background-size: 26px 26px;\n	}\n.leaflet-touch .leaflet-control-layers-toggle {\n	width: 44px;\n	height: 44px;\n	}\n.leaflet-control-layers .leaflet-control-layers-list,\n.leaflet-control-layers-expanded .leaflet-control-layers-toggle {\n	display: none;\n	}\n.leaflet-control-layers-expanded .leaflet-control-layers-list {\n	display: block;\n	position: relative;\n	}\n.leaflet-control-layers-expanded {\n	padding: 6px 10px 6px 6px;\n	color: #333;\n	background: #fff;\n	}\n.leaflet-control-layers-selector {\n	margin-top: 2px;\n	position: relative;\n	top: 1px;\n	}\n.leaflet-control-layers label {\n	display: block;\n	}\n.leaflet-control-layers-separator {\n	height: 0;\n	border-top: 1px solid #ddd;\n	margin: 5px -10px 5px -6px;\n	}\n\n\n/* attribution and scale controls */\n\n.leaflet-container .leaflet-control-attribution {\n	background: #fff;\n	background: rgba(255, 255, 255, 0.7);\n	margin: 0;\n	}\n.leaflet-control-attribution,\n.leaflet-control-scale-line {\n	padding: 0 5px;\n	color: #333;\n	}\n.leaflet-control-attribution a {\n	text-decoration: none;\n	}\n.leaflet-control-attribution a:hover {\n	text-decoration: underline;\n	}\n.leaflet-container .leaflet-control-attribution,\n.leaflet-container .leaflet-control-scale {\n	font-size: 11px;\n	}\n.leaflet-left .leaflet-control-scale {\n	margin-left: 5px;\n	}\n.leaflet-bottom .leaflet-control-scale {\n	margin-bottom: 5px;\n	}\n.leaflet-control-scale-line {\n	border: 2px solid #777;\n	border-top: none;\n	line-height: 1.1;\n	padding: 2px 5px 1px;\n	font-size: 11px;\n	white-space: nowrap;\n	overflow: hidden;\n	-moz-box-sizing: content-box;\n	     box-sizing: content-box;\n\n	background: #fff;\n	background: rgba(255, 255, 255, 0.5);\n	}\n.leaflet-control-scale-line:not(:first-child) {\n	border-top: 2px solid #777;\n	border-bottom: none;\n	margin-top: -2px;\n	}\n.leaflet-control-scale-line:not(:first-child):not(:last-child) {\n	border-bottom: 2px solid #777;\n	}\n\n.leaflet-touch .leaflet-control-attribution,\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	box-shadow: none;\n	}\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	border: 2px solid rgba(0,0,0,0.2);\n	background-clip: padding-box;\n	}\n\n\n/* popup */\n\n.leaflet-popup {\n	position: absolute;\n	text-align: center;\n	}\n.leaflet-popup-content-wrapper {\n	padding: 1px;\n	text-align: left;\n	border-radius: 12px;\n	}\n.leaflet-popup-content {\n	margin: 13px 19px;\n	line-height: 1.4;\n	}\n.leaflet-popup-content p {\n	margin: 18px 0;\n	}\n.leaflet-popup-tip-container {\n	margin: 0 auto;\n	width: 40px;\n	height: 20px;\n	position: relative;\n	overflow: hidden;\n	}\n.leaflet-popup-tip {\n	width: 17px;\n	height: 17px;\n	padding: 1px;\n\n	margin: -10px auto 0;\n\n	-webkit-transform: rotate(45deg);\n	   -moz-transform: rotate(45deg);\n	    -ms-transform: rotate(45deg);\n	     -o-transform: rotate(45deg);\n	        transform: rotate(45deg);\n	}\n.leaflet-popup-content-wrapper,\n.leaflet-popup-tip {\n	background: white;\n\n	box-shadow: 0 3px 14px rgba(0,0,0,0.4);\n	}\n.leaflet-container a.leaflet-popup-close-button {\n	position: absolute;\n	top: 0;\n	right: 0;\n	padding: 4px 4px 0 0;\n	text-align: center;\n	width: 18px;\n	height: 14px;\n	font: 16px/14px Tahoma, Verdana, sans-serif;\n	color: #c3c3c3;\n	text-decoration: none;\n	font-weight: bold;\n	background: transparent;\n	}\n.leaflet-container a.leaflet-popup-close-button:hover {\n	color: #999;\n	}\n.leaflet-popup-scrolled {\n	overflow: auto;\n	border-bottom: 1px solid #ddd;\n	border-top: 1px solid #ddd;\n	}\n\n.leaflet-oldie .leaflet-popup-content-wrapper {\n	zoom: 1;\n	}\n.leaflet-oldie .leaflet-popup-tip {\n	width: 24px;\n	margin: 0 auto;\n\n	-ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";\n	filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);\n	}\n.leaflet-oldie .leaflet-popup-tip-container {\n	margin-top: -1px;\n	}\n\n.leaflet-oldie .leaflet-control-zoom,\n.leaflet-oldie .leaflet-control-layers,\n.leaflet-oldie .leaflet-popup-content-wrapper,\n.leaflet-oldie .leaflet-popup-tip {\n	border: 1px solid #999;\n	}\n\n\n/* div icon */\n\n.leaflet-div-icon {\n	background: #fff;\n	border: 1px solid #666;\n	}\n</style>'
//note: smartphone.css injection moved into code/smartphone.js
  + '<link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Roboto:100,100italic,300,300italic,400,400italic,500,500italic,700,700italic&subset=latin,cyrillic-ext,greek-ext,greek,vietnamese,latin-ext,cyrillic"/>';


document.getElementsByTagName('body')[0].innerHTML = ''
  + '<div id="map">讀取中, 請稍後</div>'
  + '<div id="chatcontrols" style="display:none">'
  + '<a accesskey="0" title="[0]"><span class="toggle expand"></span></a>'
  + '<a accesskey="1" title="[1]">all</a>'
  + '<a accesskey="2" title="[2]" class="active">faction</a>'
  + '<a accesskey="3" title="[3]">alerts</a>'
  + '</div>'
  + '<div id="chat" style="display:none">'
  + '  <div id="chatfaction"></div>'
  + '  <div id="chatall"></div>'
  + '  <div id="chatalerts"></div>'
  + '</div>'
  + '<form id="chatinput" style="display:none"><table><tr>'
  + '  <td><time></time></td>'
  + '  <td><mark>tell faction:</mark></td>'
  + '  <td><input id="chattext" type="text" maxlength="256" accesskey="c" title="[c]" /></td>'
  + '</tr></table></form>'
  + '<a id="sidebartoggle" accesskey="i" title="切換側邊攔 [i]"><span class="toggle close"></span></a>'
  + '<div id="scrollwrapper">' // enable scrolling for small screens
  + '  <div id="sidebar" style="display: none">'
  + '    <div id="playerstat">t</div>'
  + '    <div id="gamestat">&nbsp;讀取全局控制統計數據</div>'
  + '    <div id="searchwrapper">'
  + '      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxNjM1OTRFNUE0RTIxMUUxODNBMUZBQ0ZFQkJDNkRBQiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxNjM1OTRFNkE0RTIxMUUxODNBMUZBQ0ZFQkJDNkRBQiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjE2MzU5NEUzQTRFMjExRTE4M0ExRkFDRkVCQkM2REFCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjE2MzU5NEU0QTRFMjExRTE4M0ExRkFDRkVCQkM2REFCIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+kxvtEgAAAWVJREFUeNqsVctRwzAUlDTccQlxB3RA0kHSQXLxNXEFgQrsHO1L6AA6cKgAd4BLEBXAU2YfszY2oMCb2Rlbelqv3s+2qiozYjPBVjAX3Az2WsFJcBB0WZb1Nt0IWSF4FexGyAzWdvAp6rpOpgjDxgucg3lBKViRzz3WPN6Db8OkjsgaUvQgSAW54IkI77CWwkcVN0PCPZFtAG+mzZPfmVRUhlAZK0mZIR6qbGPi7ChY4zl1yKZ+NTfxltNttg6loep8LJuUjad4zh3F7s1cbs8ayxDD9xEH+0uiL2ed+WdjwhWU2YjzVmJoUfCfhC2eb/8g7Fr73KHRDWopiWVC22kdnhymhrZfcYG6goQcAmGHhleV64lsjlUD+5cSz85RtbfUSscfrp+Qn87Ic2KuyGlBEyd8dYkO4IJfInkc70C2QMf0CD1I95hzCc1GtcfBe7hm/l1he5p3JYVh+AsoaV727EOAAQAWgF3ledLuQAAAAABJRU5ErkJggg=="/ title="目前位置" id="buttongeolocation">'
  + '      <input id="search" placeholder="搜尋地點…" type="search" accesskey="f" title="搜尋一個地點 [f]"/>'
  + '    </div>'
  + '    <div id="portaldetails"></div>'
  + '    <input id="redeem" placeholder="兌換代碼…" type="text"/>'
  + '    <div id="toolbox">'
  + '      <a onmouseover="setPermaLink(this)" onclick="setPermaLink(this);return androidPermalink()" title="此地圖的連結">intel連結</a>'
  + '      <a onclick="window.aboutIITC()" style="cursor: help">關於IITC</a>'
  + '      <a onclick="window.regionScoreboard()" title="查看該區域記分板">區域分數</a>'
  + '    </div>'
  + '  </div>'
  + '</div>'
  + '<div id="updatestatus"><div id="innerstatus"></div></div>'
  // avoid error by stock JS
  + '<div id="play_button"></div>';

// putting everything in a wrapper function that in turn is placed in a
// script tag on the website allows us to execute in the site’s context
// instead of in the Greasemonkey/Extension/etc. context.
function wrapper(info) {
// a cut-down version of GM_info is passed as a parameter to the script
// (not the full GM_info - it contains the ENTIRE script source!)
window.script_info = info;




// LEAFLET PREFER CANVAS ///////////////////////////////////////////////
// Set to true if Leaflet should draw things using Canvas instead of SVG
// Disabled for now because it has several bugs: flickering, constant
// CPU usage and it continuously fires the moveend event.

//L_PREFER_CANVAS = false;

// CONFIG OPTIONS ////////////////////////////////////////////////////
window.REFRESH = 30; // refresh view every 30s (base time)
window.ZOOM_LEVEL_ADJ = 5; // add 5 seconds per zoom level
window.ON_MOVE_REFRESH = 2.5;  //refresh time to use after a movement event
window.MINIMUM_OVERRIDE_REFRESH = 10; //limit on refresh time since previous refresh, limiting repeated move refresh rate
window.REFRESH_GAME_SCORE = 15*60; // refresh game score every 15 minutes
window.MAX_IDLE_TIME = 15*60; // stop updating map after 15min idling
window.HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
window.SIDEBAR_WIDTH = 300;

// how many pixels to the top before requesting new data
window.CHAT_REQUEST_SCROLL_TOP = 200;
window.CHAT_SHRINKED = 60;

// Minimum area to zoom ratio that field M's will display
window.FIELD_MU_DISPLAY_AREA_ZOOM_RATIO = 0.001;

// Point tolerance for displaying M's
window.FIELD_MU_DISPLAY_POINT_TOLERANCE = 60

window.COLOR_SELECTED_PORTAL = '#F80';
window.COLORS = ['#888888', '#0088FF', '#03DC03']; // none, res, enl
window.COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];
window.COLORS_MOD = {VERY_RARE: '#b08cff', RARE: '#73a8ff', COMMON: '#8cffbf'};


window.MOD_TYPE = {RES_SHIELD:'Shield', MULTIHACK:'Multi-hack', FORCE_AMP:'Force Amp', HEATSINK:'Heat Sink', TURRET:'Turret', LINK_AMPLIFIER: 'Link Amp'};

// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
window.ACCESS_INDICATOR_COLOR = 'orange';
window.RANGE_INDICATOR_COLOR = 'red'

// min zoom for intel map - should match that used by stock intel
window.MIN_ZOOM = 3;

window.DEFAULT_PORTAL_IMG = '//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png';
//window.NOMINATIM = '//open.mapquestapi.com/nominatim/v1/search.php?format=json&polygon_geojson=1&q=';
window.NOMINATIM = '//nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=';

// INGRESS CONSTANTS /////////////////////////////////////////////////
// http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
window.RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
window.HACK_RANGE = 40; // in meters, max. distance from portal to be able to access it
window.OCTANTS = ['東', '東北', '北', '西北', '西', '西南', '南', '東南'];
window.OCTANTS_ARROW = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
window.DESTROY_RESONATOR = 75; //AP for destroying portal
window.DESTROY_LINK = 187; //AP for destroying link
window.DESTROY_FIELD = 750; //AP for destroying field
window.CAPTURE_PORTAL = 500; //AP for capturing a portal
window.DEPLOY_RESONATOR = 125; //AP for deploying a resonator
window.COMPLETION_BONUS = 250; //AP for deploying all resonators on portal
window.UPGRADE_ANOTHERS_RESONATOR = 65; //AP for upgrading another's resonator
window.MAX_PORTAL_LEVEL = 8;
window.MAX_RESO_PER_PLAYER = [0, 8, 4, 4, 4, 2, 2, 1, 1];

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
window.TEAM_NONE = 0;
window.TEAM_RES = 1;
window.TEAM_ENL = 2;
window.TEAM_TO_CSS = ['none', 'res', 'enl'];

window.SLOT_TO_LAT = [0, Math.sqrt(2)/2, 1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2];
window.SLOT_TO_LNG = [1, Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, -1, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2];
window.EARTH_RADIUS=6378137;
window.DEG2RAD = Math.PI / 180;

// STORAGE ///////////////////////////////////////////////////////////
// global variables used for storage. Most likely READ ONLY. Proper
// way would be to encapsulate them in an anonymous function and write
// getters/setters, but if you are careful enough, this works.
window.refreshTimeout = undefined;
window.urlPortal = null;
window.urlPortalLL = null;
window.selectedPortal = null;
window.portalRangeIndicator = null;
window.portalAccessIndicator = null;
window.mapRunsUserAction = false;
//var portalsLayers, linksLayer, fieldsLayer;
var portalsFactionLayers, linksFactionLayers, fieldsFactionLayers;

// contain references to all entities loaded from the server. If render limits are hit,
// not all may be added to the leaflet layers
window.portals = {};
window.links = {};
window.fields = {};

window.resonators = {};

// contain current status(on/off) of overlay layerGroups.
// But you should use isLayerGroupDisplayed(name) to check the status
window.overlayStatus = {};

// plugin framework. Plugins may load earlier than iitc, so don’t
// overwrite data
if(typeof window.plugin !== 'function') window.plugin = function() {};


﻿// ARTIFACT ///////////////////////////////////////////////////////

// added as part of the ingress #13magnus in november 2013, artifacts
// are additional game elements overlayed on the intel map
// currently there are only jarvis-related entities
// - shards: move between portals (along links) each hour. more than one can be at a portal
// - targets: specific portals - one per team
// the artifact data includes details for the specific portals, so can be useful
// 2014-02-06: intel site updates hint at new 'amar artifacts', likely following the same system as above


window.artifact = function() {}

window.artifact.setup = function() {
  artifact.REFRESH_JITTER = 2*60;  // 2 minute random period so not all users refresh at once
  artifact.REFRESH_SUCCESS = 60*60;  // 60 minutes on success
  artifact.REFRESH_FAILURE = 2*60;  // 2 minute retry on failure

  artifact.idle = false;
  artifact.clearData();

  addResumeFunction(artifact.idleResume);

  // move the initial data request onto a very short timer. prevents thrown exceptions causing IITC boot failures
  setTimeout (artifact.requestData, 1);

  artifact._layer = new L.LayerGroup();
  addLayerGroup ('神器', artifact._layer, true);

  $('#toolbox').append(' <a onclick="window.artifact.showArtifactList()" title="顯示神器清單">神器</a>');

}

window.artifact.requestData = function() {
  if (isIdle()) {
    artifact.idle = true;
  } else {
    window.postAjax('getArtifactPortals', {}, artifact.handleSuccess, artifact.handleError);
  }
}

window.artifact.idleResume = function() {
  if (artifact.idle) {
    artifact.idle = false;
    artifact.requestData();
  }
}

window.artifact.handleSuccess = function(data) {
  artifact.processData (data);

  // start the next refresh at a multiple of REFRESH_SUCCESS seconds, plus a random REFRESH_JITTER amount to prevent excessive server hits at one time
  var now = Date.now();
  var nextTime = Math.ceil(now/(artifact.REFRESH_SUCCESS*1000))*(artifact.REFRESH_SUCCESS*1000) + Math.floor(Math.random()*artifact.REFRESH_JITTER*1000);

  setTimeout (artifact.requestData, nextTime - now);
}

window.artifact.handleFailure = function(data) {
  // no useful data on failure - do nothing

  setTimeout (artifact.requestData, artifact.REFRESH_FAILURE*1000);
}


window.artifact.processData = function(data) {

  if (data.error || !data.result) {
    console.warn('Failed to find result in getArtifactPortals response');
    return;
  }

  var oldArtifacts = artifact.entities;
  artifact.clearData();

  artifact.processResult(data.result);
  runHooks('artifactsUpdated', {old: oldArtifacts, 'new': artifact.entities});

  // redraw the artifact layer
  artifact.updateLayer();

}


window.artifact.clearData = function() {
  artifact.portalInfo = {};
  artifact.artifactTypes = {};

  artifact.entities = [];
}


window.artifact.processResult = function (portals) {
  // portals is an object, keyed from the portal GUID, containing the portal entity array

  for (var guid in portals) {
    var ent = portals[guid];
    var data = decodeArray.portalSummary(ent);

    // we no longer know the faction for the target portals, and we don't know which fragment numbers are at the portals
    // all we know, from the portal summary data, for each type of artifact, is that each artifact portal is
    // - a target portal or not - no idea for which faction
    // - has one (or more) fragments, or not

    if (!artifact.portalInfo[guid]) artifact.portalInfo[guid] = {};

    // store the decoded data - needed for lat/lng for layer markers
    artifact.portalInfo[guid]._data = data;

    for(var type in data.artifactBrief.target) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].target = TEAM_NONE;  // as we no longer know the team...
    }

    for(var type in data.artifactBrief.fragment) {
      if (!artifact.artifactTypes[type]) artifact.artifactTypes[type] = {};

      if (!artifact.portalInfo[guid][type]) artifact.portalInfo[guid][type] = {};

      artifact.portalInfo[guid][type].fragments = true; //as we no longer have a list of the fragments there
    }


    // let's pre-generate the entities needed to render the map - array of [guid, timestamp, ent_array]
    artifact.entities.push ( [guid, data.timestamp, ent] );

  }

}

window.artifact.getArtifactTypes = function() {
  return Object.keys(artifact.artifactTypes);
}

window.artifact.isArtifact = function(type) {
  return type in artifact.artifactTypes;
}

// used to render portals that would otherwise be below the visible level
window.artifact.getArtifactEntities = function() {
  return artifact.entities;
}

window.artifact.getInterestingPortals = function() {
  return Object.keys(artifact.portalInfo);
}

// quick test for portal being relevant to artifacts - of any type
window.artifact.isInterestingPortal = function(guid) {
  return guid in artifact.portalInfo;
}

// get the artifact data for a specified artifact id (e.g. 'jarvis'), if it exists - otherwise returns something 'false'y
window.artifact.getPortalData = function(guid,artifactId) {
  return artifact.portalInfo[guid] && artifact.portalInfo[guid][artifactId];
}

window.artifact.updateLayer = function() {
  artifact._layer.clearLayers();

  $.each(artifact.portalInfo, function(guid,data) {
    var latlng = L.latLng ([data._data.latE6/1E6, data._data.lngE6/1E6]);

    $.each(data, function(type,detail) {

      // we'll construct the URL form the type - stock seems to do that now

      var iconUrl;
      if (data[type].target !== undefined) {
        // target portal
        if (type == 'abaddonenl')
          var iconUrl = 'data:image/png;base64,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' //iF
        else
          var iconUrl = 'data:image/png;base64,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' //iF
        var iconSize = 80;
        var opacity = 1.0;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      } else if (data[type].fragments) {
        // fragment(s) at portal

        var iconUrl = 'data:image/png;base64,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' //iF
        var iconSize = 50;
        var opacity = 0.6;

        var icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [iconSize,iconSize],
          iconAnchor: [iconSize/2,iconSize/2],
          className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
        });

        var marker = L.marker (latlng, {icon: icon, clickable: false, keyboard: false, opacity: opacity });

        artifact._layer.addLayer(marker);

      }

    });  //end $.each(data, function(type,detail)

  }); //end $.each(artifact.portalInfo, function(guid,data)

}


window.artifact.showArtifactList = function() {
  var html = '';

  if (Object.keys(artifact.artifactTypes).length == 0) {
    html += '<i>該時段沒有任何神器</i>';
  }

  var first = true;
  $.each(artifact.artifactTypes, function(type,type2) {
    // no nice way to convert the Niantic internal name into the correct display name
    // (we do get the description string once a portal with that shard type is selected - could cache that somewhere?)
    var name = type.capitalize() + ' 碎片';

    if (!first) html += '<hr>';
    first = false;
    html += '<div><b>'+name+'</b></div>';

    html += '<table class="artifact artifact-'+type+'">';
    html += '<tr><th>能量塔</th><th>細節</th></tr>';

    var tableRows = [];

    $.each(artifact.portalInfo, function(guid, data) {
      if (type in data) {
        // this portal has data for this artifact type - add it to the table

        var onclick = 'zoomToAndShowPortal(\''+guid+'\',['+data._data.latE6/1E6+','+data._data.lngE6/1E6+'])';
        var row = '<tr><td class="portal"><a onclick="'+onclick+'">'+escapeHtmlSpecialChars(data._data.title)+'</a></td>';

        row += '<td class="info">';

        if (data[type].target !== undefined) {
          if (data[type].target == TEAM_NONE) {
            row += '<span class="target">目標能量塔</span> ';
          } else {
            row += '<span class="target '+TEAM_TO_CSS[data[type].target]+'">'+(data[type].target==TEAM_RES?'Resistance':'Enlightened')+' 目標</span> ';
          }
        }

        if (data[type].fragments) {
          if (data[type].target !== undefined) {
            row += '<br>';
          }
          var fragmentName = '碎片';
//          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': #'+data[type].fragments.join(', #')+'</span> ';
          row += '<span class="碎片'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': 是</span> ';
        }

        row += '</td></tr>';

        // sort by target portals first, then by portal GUID
        var sortVal = (data[type].target !== undefined ? 'A' : 'Z') + guid;

        tableRows.push ( [sortVal, row] );
      }
    });

    // check for no rows, and add a note to the table instead
    if (tableRows.length == 0) {
      html += '<tr><td colspan="2"><i>這個時段沒有神器</i></td></tr>';
    }

    // sort the rows
    tableRows.sort(function(a,b) {
      if (a[0] == b[0]) return 0;
      else if (a[0] < b[0]) return -1;
      else return 1;
    });

    // and add them to the table
    html += tableRows.map(function(a){return a[1];}).join('');


    html += '</table>';
  });


  html += "<hr />"
        + "<p>在2015年夏天, Niantic 更改了神器能量塔的數據格式. 我們已無法得知:</p>"
        + "<ul><li>目標能量塔是哪支陣營 - 只知道它是一個目標能量塔</li>"
        + "<li>碎片是在哪個能量塔, 只知道它具有一個或多個碎片</li></ul>"
        + "<p>您可以選擇一個能量塔，詳細的數據中包含碎片號碼列表, 但依然沒有"
        + "該目標更詳細的資料.</p>";

  dialog({
    title: '神器',
    html: html,
    width: 400,
    position: {my: 'right center', at: 'center-60 center', of: window, collision: 'fit'}
  });

}


;

/// SETUP /////////////////////////////////////////////////////////////
// these functions set up specific areas after the boot function
// created a basic framework. All of these functions should only ever
// be run once.

window.setupLargeImagePreview = function() {
  $('#portaldetails').on('click', '.imgpreview', function() {
    var img = $(this).find('img')[0];
    var details = $(this).find('div.portalDetails')[0];
    //dialogs have 12px padding around the content
    var dlgWidth = Math.max(img.naturalWidth+24,500);
    if (details) {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>' + details.outerHTML,
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    } else {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>',
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    }
  });
}

// adds listeners to the layer chooser such that a long press hides
// all custom layers except the long pressed one.
window.setupLayerChooserSelectOne = function() {
  $('.leaflet-control-layers-overlays').on('click taphold', 'label', function(e) {
    if(!e) return;
    if(!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.type === 'taphold')) return;
    var m = window.map;

    var add = function(layer) {
      if(!m.hasLayer(layer.layer)) m.addLayer(layer.layer);
    };
    var rem = function(layer) {
      if(m.hasLayer(layer.layer)) m.removeLayer(layer.layer);
    };

    var isChecked = $(e.target).find('input').is(':checked');
    var checkSize = $('.leaflet-control-layers-overlays input:checked').length;
    if((isChecked && checkSize === 1) || checkSize === 0) {
      // if nothing is selected or the users long-clicks the only
      // selected element, assume all boxes should be checked again
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(!layer.overlay) return true;
        add(layer);
      });
    } else {
      // uncheck all
      var keep = $.trim($(e.target).text());
      $.each(window.layerChooser._layers, function(ind, layer) {
        if(layer.overlay !== true) return true;
        if(layer.name === keep) { add(layer);  return true; }
        rem(layer);
      });
    }
    e.preventDefault();
  });
}

// Setup the function to record the on/off status of overlay layerGroups
window.setupLayerChooserStatusRecorder = function() {
  // Record already added layerGroups
  $.each(window.layerChooser._layers, function(ind, chooserEntry) {
    if(!chooserEntry.overlay) return true;
    var display = window.map.hasLayer(chooserEntry.layer);
    window.updateDisplayedLayerGroup(chooserEntry.name, display);
  });

  // Record layerGroups change
  window.map.on('overlayadd overlayremove', function(e) {
    var display = (e.type === 'overlayadd');
    window.updateDisplayedLayerGroup(e.name, display);
  });
}

window.layerChooserSetDisabledStates = function() {
// layer selector - enable/disable layers that aren't visible due to zoom level
  var minlvl = getMinPortalLevel();
  var portalSelection = $('.leaflet-control-layers-overlays label');
  //it's an array - 0=unclaimed, 1=lvl 1, 2=lvl 2, ..., 8=lvl 8 - 9 relevant entries
  //mark all levels below (but not at) minlvl as disabled
  portalSelection.slice(0, minlvl).addClass('disabled').attr('title', '將地圖放大來顯示這個項目.');
  //and all from minlvl to 8 as enabled
  portalSelection.slice(minlvl, 8+1).removeClass('disabled').attr('title', '');

//TODO? some generic mechanism where other layers can have their disabled state marked on/off? a few
//plugins have code to do it by hand already
}


window.setupStyles = function() {
  $('head').append('<style>' +
    [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+22)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '.leaflet-right { margin-right: '+(SIDEBAR_WIDTH+1)+'px } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH+2)+'px;  } ',
      '#sidebar { width:'+(SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/)+'px;  } ',
      '#sidebartoggle { right:'+(SIDEBAR_WIDTH+1)+'px;  } ',
      '#scrollwrapper  { width:'+(SIDEBAR_WIDTH + 2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH)+'px; right:-'+(2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH-2)+'px } ',
      '#sidebar > * { width:'+(SIDEBAR_WIDTH+1)+'px;  }'].join("\n")
    + '</style>');
}

function createDefaultBaseMapLayers() {
  var baseLayers = {};

  //OpenStreetMap attribution - required by several of the layers
  osmAttribution = 'Map data © OpenStreetMap contributors';

  //MapQuest offer tiles - http://developer.mapquest.com/web/products/open/map
  //their usage policy has no limits (except required notification above 4000 tiles/sec - we're perhaps at 50 tiles/sec based on CloudMade stats)
  var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  var mqMapOpt = {attribution: osmAttribution+', Tiles Courtesy of MapQuest', maxNativeZoom: 18, maxZoom: 21, subdomains: mqSubdomains};
  baseLayers['MapQuest OSM'] = new L.TileLayer(mqTileUrlPrefix+'/tiles/1.0.0/map/{z}/{x}/{y}.jpg',mqMapOpt);

  // cartodb has some nice tiles too - both dark and light subtle maps - http://cartodb.com/basemaps/
  // (not available over https though - not on the right domain name anyway)
  var cartoAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
  var cartoUrl = 'http://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}.png';
  baseLayers['CartoDB 黑暗'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_all'});
  baseLayers['CartoDB 明亮'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_all'});


  // we'll include google maps too - in the ingress default style, and a few other standard ones
  // as the stock intel map already uses the googme maps API, we just hijack their inclusion of the javascript and API key :)
  var ingressGMapOptions = {
    backgroundColor: '#000000', //or #dddddd ? - that's the Google tile layer default
    styles: [
        { featureType:"all", elementType:"all",
          stylers: [{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}] },
        { featureType:"water", elementType:"all",
          stylers: [{visibility:"on"}, {hue:"#005eff"}, {invert_lightness:true}] },
        { featureType:"poi", stylers:[{visibility:"off"}]},
        { featureType:"transit", elementType:"all", stylers:[{visibility:"off"}] }
      ]
  };
  baseLayers['Google 預設 Ingress 地圖'] = new L.Google('ROADMAP',{maxZoom:21, mapOptions:ingressGMapOptions});
  baseLayers['Google 道路地圖'] = new L.Google('ROADMAP',{maxZoom:21});
  baseLayers['Google 衛星地圖'] = new L.Google('SATELLITE',{maxZoom:21});
  baseLayers['Google 衛星地圖 + 道路'] = new L.Google('HYBRID',{maxZoom:21});
  baseLayers['Google 地形圖'] = new L.Google('TERRAIN',{maxZoom:15});


  return baseLayers;
}


window.setupMap = function() {
  $('#map').text('');




  // proper initial position is now delayed until all plugins are loaded and the base layer is set
  window.map = new L.Map('map', {
    center: [0,0],
    zoom: 1,
    zoomControl: (typeof android !== 'undefined' && android && android.showZoom) ? android.showZoom() : true,
    minZoom: MIN_ZOOM,
//    zoomAnimation: false,
    markerZoomAnimation: false,
    bounceAtZoomLimits: false
  });

  if (L.Path.CANVAS) {
    // for canvas, 2% overdraw only - to help performance
    L.Path.CLIP_PADDING = 0.02;
  } else if (L.Path.SVG) {
    if (L.Browser.mobile) {
      // mobile SVG - 10% ovredraw. might help performance?
      L.Path.CLIP_PADDING = 0.1;
    } else {
      // for svg, 100% overdraw - so we have a full screen worth in all directions
      L.Path.CLIP_PADDING = 1.0;
    }
  }

  // add empty div to leaflet control areas - to force other leaflet controls to move around IITC UI elements
  // TODO? move the actual IITC DOM into the leaflet control areas, so dummy <div>s aren't needed
  if(!isSmartphone()) {
    // chat window area
    $(window.map._controlCorners['bottomleft']).append(
      $('<div>').width(708).height(108).addClass('leaflet-control').css({'pointer-events': 'none', 'margin': '0'}));
  }

  var addLayers = {};
  var hiddenLayer = [];

  portalsFactionLayers = [];
  var portalsLayers = [];
  for(var i = 0; i <= 8; i++) {
    portalsFactionLayers[i] = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    portalsLayers[i] = L.layerGroup(portalsFactionLayers[i]);
    map.addLayer(portalsLayers[i]);
    var t = (i === 0 ? '顯示更多' : '等級' + i) + '能量塔';
    addLayers[t] = portalsLayers[i];
    // Store it in hiddenLayer to remove later
    if(!isLayerGroupDisplayed(t, true)) hiddenLayer.push(portalsLayers[i]);
  }

  fieldsFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var fieldsLayer = L.layerGroup(fieldsFactionLayers);
  map.addLayer(fieldsLayer, true);
  addLayers['控制場'] = fieldsLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Fields', true)) hiddenLayer.push(fieldsLayer);

  linksFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var linksLayer = L.layerGroup(linksFactionLayers);
  map.addLayer(linksLayer, true);
  addLayers['連線'] = linksLayer;
  // Store it in hiddenLayer to remove later
  if(!isLayerGroupDisplayed('Links', true)) hiddenLayer.push(linksLayer);

  // faction-specific layers
  // these layers don't actually contain any data. instead, every time they're added/removed from the map,
  // the matching sub-layers within the above portals/fields/links are added/removed from their parent with
  // the below 'onoverlayadd/onoverlayremove' events
  var factionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  for (var fac in factionLayers) {
    map.addLayer (factionLayers[fac]);
  }

  var setFactionLayersState = function(fac,enabled) {
    if (enabled) {
      if (!fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.addLayer (fieldsFactionLayers[fac]);
      if (!linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.addLayer (linksFactionLayers[fac]);
      for (var lvl in portalsLayers) {
        if (!portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].addLayer (portalsFactionLayers[lvl][fac]);
      }
    } else {
      if (fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.removeLayer (fieldsFactionLayers[fac]);
      if (linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.removeLayer (linksFactionLayers[fac]);
      for (var lvl in portalsLayers) {
        if (portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].removeLayer (portalsFactionLayers[lvl][fac]);
      }
    }
  }

  // to avoid any favouritism, we'll put the player's own faction layer first
  if (PLAYER.team == 'RESISTANCE') {
    addLayers['反抗軍'] = factionLayers[TEAM_RES];
    addLayers['啟蒙軍'] = factionLayers[TEAM_ENL];
  } else {
    addLayers['啟蒙軍'] = factionLayers[TEAM_ENL];
    addLayers['反抗軍'] = factionLayers[TEAM_RES];
  }
  if (!isLayerGroupDisplayed('反抗軍', true)) hiddenLayer.push (factionLayers[TEAM_RES]);
  if (!isLayerGroupDisplayed('啟蒙軍', true)) hiddenLayer.push (factionLayers[TEAM_ENL]);

  setFactionLayersState (TEAM_NONE, true);
  setFactionLayersState (TEAM_RES, isLayerGroupDisplayed('反抗軍', true));
  setFactionLayersState (TEAM_ENL, isLayerGroupDisplayed('啟蒙軍', true));

  // NOTE: these events are fired by the layer chooser, so won't happen until that's created and added to the map
  window.map.on('overlayadd overlayremove', function(e) {
    var displayed = (e.type == 'overlayadd');
    switch (e.name) {
      case '反抗軍':
        setFactionLayersState (TEAM_RES, displayed);
        break;
      case '啟蒙軍':
        setFactionLayersState (TEAM_ENL, displayed);
        break;
    }
  });

  var baseLayers = createDefaultBaseMapLayers();

  window.layerChooser = new L.Control.Layers(baseLayers, addLayers);

  // Remove the hidden layer after layerChooser built, to avoid messing up ordering of layers 
  $.each(hiddenLayer, function(ind, layer){
    map.removeLayer(layer);

    // as users often become confused if they accidentally switch a standard layer off, display a warning in this case
    $('#portaldetails').html('<div class="layer_off_warning">'
                            +'<p><b>警告</b>: 有些標準圖層被關閉。 部分 能量塔/連線/控制場 將不會顯示.</p>'
                            +'<a id="enable_standard_layers">啟用標準圖層</a>'
                            +'</div>');

    $('#enable_standard_layers').on('click', function() {
      $.each(addLayers, function(ind, layer) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      });
      $('#portaldetails').html('');
    });

  });

  map.addControl(window.layerChooser);

  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);

  map.on('moveend', function(e) {
    // two limits on map position
    // we wrap longitude (the L.LatLng 'wrap' method) - so we don't find ourselves looking beyond +-180 degrees
    // then latitude is clamped with the clampLatLng function (to the 85 deg north/south limits)
    var newPos = clampLatLng(map.getCenter().wrap());
    if (!map.getCenter().equals(newPos)) {
      map.panTo(newPos,{animate:false})
    }
  });

  // map update status handling & update map hooks
  // ensures order of calls
  map.on('movestart', function() { window.mapRunsUserAction = true; window.requests.abort(); window.startRefreshTimeout(-1); });
  map.on('moveend', function() { window.mapRunsUserAction = false; window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  map.on('zoomend', function() { window.layerChooserSetDisabledStates(); });
  window.layerChooserSetDisabledStates();

  // on zoomend, check to see the zoom level is an int, and reset the view if not
  // (there's a bug on mobile where zoom levels sometimes end up as fractional levels. this causes the base map to be invisible)
  map.on('zoomend', function() {
    var z = map.getZoom();
    if (z != parseInt(z))
    {
      console.warn('Non-integer zoom level at zoomend: '+z+' - trying to fix...');
      map.setZoom(parseInt(z), {animate:false});
    }
  });


  // set a 'moveend' handler for the map to clear idle state. e.g. after mobile 'my location' is used.
  // possibly some cases when resizing desktop browser too
  map.on('moveend', idleReset);

  window.addResumeFunction(function() { window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  // create the map data requester
  window.mapDataRequest = new MapDataRequest();
  window.mapDataRequest.start();

  // start the refresh process with a small timeout, so the first data request happens quickly
  // (the code originally called the request function directly, and triggered a normal delay for the next refresh.
  //  however, the moveend/zoomend gets triggered on map load, causing a duplicate refresh. this helps prevent that
  window.startRefreshTimeout(ON_MOVE_REFRESH*1000);
};

//adds a base layer to the map. done separately from the above, so that plugins that add base layers can be the default
window.setMapBaseLayer = function() {
  //create a map name -> layer mapping - depends on internals of L.Control.Layers
  var nameToLayer = {};
  var firstLayer = null;

  for (i in window.layerChooser._layers) {
    var obj = window.layerChooser._layers[i];
    if (!obj.overlay) {
      nameToLayer[obj.name] = obj.layer;
      if (!firstLayer) firstLayer = obj.layer;
    }
  }

  var baseLayer = nameToLayer[localStorage['iitc-base-map']] || firstLayer;
  map.addLayer(baseLayer);

  // now we have a base layer we can set the map position
  // (setting an initial position, before a base layer is added, causes issues with leaflet)
  var pos = getPosition();
  map.setView (pos.center, pos.zoom, {reset:true});


  //event to track layer changes and store the name
  map.on('baselayerchange', function(info) {
    for(i in window.layerChooser._layers) {
      var obj = window.layerChooser._layers[i];
      if (info.layer === obj.layer) {
        localStorage['iitc-base-map'] = obj.name;
        break;
      }
    }

    //also, leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
    map.setZoom(map.getZoom());


  });


}

// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  // stock site updated to supply the actual player level, AP requirements and XM capacity values
  var level = PLAYER.verified_level;
  PLAYER.level = level; //for historical reasons IITC expects PLAYER.level to contain the current player level

  var n = window.PLAYER.nickname;
  PLAYER.nickMatcher = new RegExp('\\b('+n+')\\b', 'ig');

  var ap = parseInt(PLAYER.ap);
  var thisLvlAp = parseInt(PLAYER.min_ap_for_current_level);
  var nextLvlAp = parseInt(PLAYER.min_ap_for_next_level);

  if (nextLvlAp) {
    var lvlUpAp = digits(nextLvlAp-ap);
    var lvlApProg = Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100);
  } // else zero nextLvlAp - so at maximum level(?)

  var xmMax = parseInt(PLAYER.xm_capacity);
  var xmRatio = Math.round(PLAYER.energy/xmMax*100);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';


  var t = '等級:\t' + level + '\n'
        + '能量:\t' + PLAYER.energy + ' / ' + xmMax + '\n'
        + '經驗:\t' + digits(ap) + '\n'
        + (nextLvlAp > 0 ? '距離下次升級還差:\t' + lvlUpAp + ' AP' : '已達到最高等級(!)')
        + '\n\邀請函:\t'+PLAYER.available_invites
        + '\n\n提示: 您的玩家狀態只會在網頁刷新時更新 (F5)';

  $('#playerstat').html(''
    + '<h2 title="'+t+'">'+level+'&nbsp;'
    + '<div id="name">'
    + '<span class="'+cls+'">'+PLAYER.nickname+'</span>'
    + '<a href="/_ah/logout?continue=https://www.google.com/accounts/Logout%3Fcontinue%3Dhttps://appengine.google.com/_ah/logout%253Fcontinue%253Dhttps://www.ingress.com/intel%26service%3Dah" id="signout">登出</a>'
    + '</div>'
    + '<div id="stats">'
    + '<sup>能量:'+xmRatio+'%</sup>'
    + '<sub>' + (nextLvlAp > 0 ? '經驗:'+lvlApProg+'%' : '最高級別') + '</sub>'
    + '</div>'
    + '</h2>'
  );
}

window.setupSidebarToggle = function() {
  $('#sidebartoggle').on('click', function() {
    var toggle = $('#sidebartoggle');
    var sidebar = $('#scrollwrapper');
    if(sidebar.is(':visible')) {
      sidebar.hide().css('z-index', 1);
      $('.leaflet-right').css('margin-right','0');
      toggle.html('<span class="toggle open"></span>');
      toggle.css('right', '0');
    } else {
      sidebar.css('z-index', 1001).show();
      $('.leaflet-right').css('margin-right', SIDEBAR_WIDTH+1+'px');
      toggle.html('<span class="toggle close"></span>');
      toggle.css('right', SIDEBAR_WIDTH+1+'px');
    }
    $('.ui-tooltip').remove();
  });
}

window.setupTooltips = function(element) {
  element = element || $(document);
  element.tooltip({
    // disable show/hide animation
    show: { effect: 'none', duration: 0, delay: 350 },
    hide: false,
    open: function(event, ui) {
      // ensure all other tooltips are closed
      $(".ui-tooltip").not(ui.tooltip).remove();
    },
    content: function() {
      var title = $(this).attr('title');
      return window.convertTextToTableMagic(title);
    }
  });

  if(!window.tooltipClearerHasBeenSetup) {
    window.tooltipClearerHasBeenSetup = true;
    $(document).on('click', '.ui-tooltip', function() { $(this).remove(); });
  }
}

window.setupTaphold = function() {
  // @author Rich Adams <rich@richadams.me>

// Implements a tap and hold functionality. If you click/tap and release, it will trigger a normal
// click event. But if you click/tap and hold for 1s (default), it will trigger a taphold event instead.

;(function($)
{
    // Default options
    var defaults = {
        duration: 1000, // ms
        clickHandler: null
    }

    // When start of a taphold event is triggered.
    function startHandler(event)
    {
        var $elem = jQuery(this);

        // Merge the defaults and any user defined settings.
        settings = jQuery.extend({}, defaults, event.data);

        // If object also has click handler, store it and unbind. Taphold will trigger the
        // click itself, rather than normal propagation.
        if (typeof $elem.data("events") != "undefined"
            && typeof $elem.data("events").click != "undefined")
        {
            // Find the one without a namespace defined.
            for (var c in $elem.data("events").click)
            {
                if ($elem.data("events").click[c].namespace == "")
                {
                    var handler = $elem.data("events").click[c].handler
                    $elem.data("taphold_click_handler", handler);
                    $elem.unbind("click", handler);
                    break;
                }
            }
        }
        // Otherwise, if a custom click handler was explicitly defined, then store it instead.
        else if (typeof settings.clickHandler == "function")
        {
            $elem.data("taphold_click_handler", settings.clickHandler);
        }

        // Reset the flags
        $elem.data("taphold_triggered", false); // If a hold was triggered
        $elem.data("taphold_clicked",   false); // If a click was triggered
        $elem.data("taphold_cancelled", false); // If event has been cancelled.

        // Set the timer for the hold event.
        $elem.data("taphold_timer",
            setTimeout(function()
            {
                // If event hasn't been cancelled/clicked already, then go ahead and trigger the hold.
                if (!$elem.data("taphold_cancelled")
                    && !$elem.data("taphold_clicked"))
                {
                    // Trigger the hold event, and set the flag to say it's been triggered.
                    $elem.trigger(jQuery.extend(event, jQuery.Event("taphold")));
                    $elem.data("taphold_triggered", true);
                }
            }, settings.duration));
    }

    // When user ends a tap or click, decide what we should do.
    function stopHandler(event)
    {
        var $elem = jQuery(this);

        // If taphold has been cancelled, then we're done.
        if ($elem.data("taphold_cancelled")) { return; }

        // Clear the hold timer. If it hasn't already triggered, then it's too late anyway.
        clearTimeout($elem.data("taphold_timer"));

        // If hold wasn't triggered and not already clicked, then was a click event.
        if (!$elem.data("taphold_triggered")
            && !$elem.data("taphold_clicked"))
        {
            // If click handler, trigger it.
            if (typeof $elem.data("taphold_click_handler") == "function")
            {
                $elem.data("taphold_click_handler")(jQuery.extend(event, jQuery.Event("click")));
            }

            // Set flag to say we've triggered the click event.
            $elem.data("taphold_clicked", true);
        }
    }

    // If a user prematurely leaves the boundary of the object we're working on.
    function leaveHandler(event)
    {
        // Cancel the event.
        $(this).data("taphold_cancelled", true);
    }

    // Determine if touch events are supported.
    var touchSupported = ("ontouchstart" in window) // Most browsers
                         || ("onmsgesturechange" in window); // Mircosoft

    var taphold = $.event.special.taphold =
    {
        setup: function(data)
        {
            $(this).bind((touchSupported ? "touchstart" : "mousedown"),  data, startHandler)
                   .bind((touchSupported ? "touchend"   : "mouseup"),    stopHandler)
                   .bind((touchSupported ? "touchmove"  : "mouseleave"), leaveHandler);
            if(touchSupported)
                $(this).bind("touchcancel", leaveHandler);
        },
        teardown: function(namespaces)
        {
            $(this).unbind((touchSupported ? "touchstart" : "mousedown"),  startHandler)
                   .unbind((touchSupported ? "touchend"   : "mouseup"),    stopHandler)
                   .unbind((touchSupported ? "touchmove"  : "mouseleave"), leaveHandler);
            if(touchSupported)
                $(this).unbind("touchcancel", leaveHandler);
        }
    };
})(jQuery);

}


window.setupQRLoadLib = function() {
  (function(r){r.fn.qrcode=function(h){var s;function u(a){this.mode=s;this.data=a}function o(a,c){this.typeNumber=a;this.errorCorrectLevel=c;this.modules=null;this.moduleCount=0;this.dataCache=null;this.dataList=[]}function q(a,c){if(void 0==a.length)throw Error(a.length+"/"+c);for(var d=0;d<a.length&&0==a[d];)d++;this.num=Array(a.length-d+c);for(var b=0;b<a.length-d;b++)this.num[b]=a[b+d]}function p(a,c){this.totalCount=a;this.dataCount=c}function t(){this.buffer=[];this.length=0}u.prototype={getLength:function(){return this.data.length},
write:function(a){for(var c=0;c<this.data.length;c++)a.put(this.data.charCodeAt(c),8)}};o.prototype={addData:function(a){this.dataList.push(new u(a));this.dataCache=null},isDark:function(a,c){if(0>a||this.moduleCount<=a||0>c||this.moduleCount<=c)throw Error(a+","+c);return this.modules[a][c]},getModuleCount:function(){return this.moduleCount},make:function(){if(1>this.typeNumber){for(var a=1,a=1;40>a;a++){for(var c=p.getRSBlocks(a,this.errorCorrectLevel),d=new t,b=0,e=0;e<c.length;e++)b+=c[e].dataCount;
for(e=0;e<this.dataList.length;e++)c=this.dataList[e],d.put(c.mode,4),d.put(c.getLength(),j.getLengthInBits(c.mode,a)),c.write(d);if(d.getLengthInBits()<=8*b)break}this.typeNumber=a}this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17;this.modules=Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=Array(this.moduleCount);for(var b=0;b<this.moduleCount;b++)this.modules[d][b]=null}this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-
7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(a,c);7<=this.typeNumber&&this.setupTypeNumber(a);null==this.dataCache&&(this.dataCache=o.createData(this.typeNumber,this.errorCorrectLevel,this.dataList));this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,c){for(var d=-1;7>=d;d++)if(!(-1>=a+d||this.moduleCount<=a+d))for(var b=-1;7>=b;b++)-1>=c+b||this.moduleCount<=c+b||(this.modules[a+d][c+b]=
0<=d&&6>=d&&(0==b||6==b)||0<=b&&6>=b&&(0==d||6==d)||2<=d&&4>=d&&2<=b&&4>=b?!0:!1)},getBestMaskPattern:function(){for(var a=0,c=0,d=0;8>d;d++){this.makeImpl(!0,d);var b=j.getLostPoint(this);if(0==d||a>b)a=b,c=d}return c},createMovieClip:function(a,c,d){a=a.createEmptyMovieClip(c,d);this.make();for(c=0;c<this.modules.length;c++)for(var d=1*c,b=0;b<this.modules[c].length;b++){var e=1*b;this.modules[c][b]&&(a.beginFill(0,100),a.moveTo(e,d),a.lineTo(e+1,d),a.lineTo(e+1,d+1),a.lineTo(e,d+1),a.endFill())}return a},
setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(a=8;a<this.moduleCount-8;a++)null==this.modules[6][a]&&(this.modules[6][a]=0==a%2)},setupPositionAdjustPattern:function(){for(var a=j.getPatternPosition(this.typeNumber),c=0;c<a.length;c++)for(var d=0;d<a.length;d++){var b=a[c],e=a[d];if(null==this.modules[b][e])for(var f=-2;2>=f;f++)for(var i=-2;2>=i;i++)this.modules[b+f][e+i]=-2==f||2==f||-2==i||2==i||0==f&&0==i?!0:!1}},setupTypeNumber:function(a){for(var c=
j.getBCHTypeNumber(this.typeNumber),d=0;18>d;d++){var b=!a&&1==(c>>d&1);this.modules[Math.floor(d/3)][d%3+this.moduleCount-8-3]=b}for(d=0;18>d;d++)b=!a&&1==(c>>d&1),this.modules[d%3+this.moduleCount-8-3][Math.floor(d/3)]=b},setupTypeInfo:function(a,c){for(var d=j.getBCHTypeInfo(this.errorCorrectLevel<<3|c),b=0;15>b;b++){var e=!a&&1==(d>>b&1);6>b?this.modules[b][8]=e:8>b?this.modules[b+1][8]=e:this.modules[this.moduleCount-15+b][8]=e}for(b=0;15>b;b++)e=!a&&1==(d>>b&1),8>b?this.modules[8][this.moduleCount-
b-1]=e:9>b?this.modules[8][15-b-1+1]=e:this.modules[8][15-b-1]=e;this.modules[this.moduleCount-8][8]=!a},mapData:function(a,c){for(var d=-1,b=this.moduleCount-1,e=7,f=0,i=this.moduleCount-1;0<i;i-=2)for(6==i&&i--;;){for(var g=0;2>g;g++)if(null==this.modules[b][i-g]){var n=!1;f<a.length&&(n=1==(a[f]>>>e&1));j.getMask(c,b,i-g)&&(n=!n);this.modules[b][i-g]=n;e--; -1==e&&(f++,e=7)}b+=d;if(0>b||this.moduleCount<=b){b-=d;d=-d;break}}}};o.PAD0=236;o.PAD1=17;o.createData=function(a,c,d){for(var c=p.getRSBlocks(a,
c),b=new t,e=0;e<d.length;e++){var f=d[e];b.put(f.mode,4);b.put(f.getLength(),j.getLengthInBits(f.mode,a));f.write(b)}for(e=a=0;e<c.length;e++)a+=c[e].dataCount;if(b.getLengthInBits()>8*a)throw Error("code length overflow. ("+b.getLengthInBits()+">"+8*a+")");for(b.getLengthInBits()+4<=8*a&&b.put(0,4);0!=b.getLengthInBits()%8;)b.putBit(!1);for(;!(b.getLengthInBits()>=8*a);){b.put(o.PAD0,8);if(b.getLengthInBits()>=8*a)break;b.put(o.PAD1,8)}return o.createBytes(b,c)};o.createBytes=function(a,c){for(var d=
0,b=0,e=0,f=Array(c.length),i=Array(c.length),g=0;g<c.length;g++){var n=c[g].dataCount,h=c[g].totalCount-n,b=Math.max(b,n),e=Math.max(e,h);f[g]=Array(n);for(var k=0;k<f[g].length;k++)f[g][k]=255&a.buffer[k+d];d+=n;k=j.getErrorCorrectPolynomial(h);n=(new q(f[g],k.getLength()-1)).mod(k);i[g]=Array(k.getLength()-1);for(k=0;k<i[g].length;k++)h=k+n.getLength()-i[g].length,i[g][k]=0<=h?n.get(h):0}for(k=g=0;k<c.length;k++)g+=c[k].totalCount;d=Array(g);for(k=n=0;k<b;k++)for(g=0;g<c.length;g++)k<f[g].length&&
(d[n++]=f[g][k]);for(k=0;k<e;k++)for(g=0;g<c.length;g++)k<i[g].length&&(d[n++]=i[g][k]);return d};s=4;for(var j={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,
78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var c=a<<10;0<=j.getBCHDigit(c)-j.getBCHDigit(j.G15);)c^=j.G15<<j.getBCHDigit(c)-j.getBCHDigit(j.G15);return(a<<10|c)^j.G15_MASK},getBCHTypeNumber:function(a){for(var c=a<<12;0<=j.getBCHDigit(c)-
j.getBCHDigit(j.G18);)c^=j.G18<<j.getBCHDigit(c)-j.getBCHDigit(j.G18);return a<<12|c},getBCHDigit:function(a){for(var c=0;0!=a;)c++,a>>>=1;return c},getPatternPosition:function(a){return j.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,c,d){switch(a){case 0:return 0==(c+d)%2;case 1:return 0==c%2;case 2:return 0==d%3;case 3:return 0==(c+d)%3;case 4:return 0==(Math.floor(c/2)+Math.floor(d/3))%2;case 5:return 0==c*d%2+c*d%3;case 6:return 0==(c*d%2+c*d%3)%2;case 7:return 0==(c*d%3+(c+d)%2)%2;default:throw Error("bad maskPattern:"+
a);}},getErrorCorrectPolynomial:function(a){for(var c=new q([1],0),d=0;d<a;d++)c=c.multiply(new q([1,l.gexp(d)],0));return c},getLengthInBits:function(a,c){if(1<=c&&10>c)switch(a){case 1:return 10;case 2:return 9;case s:return 8;case 8:return 8;default:throw Error("mode:"+a);}else if(27>c)switch(a){case 1:return 12;case 2:return 11;case s:return 16;case 8:return 10;default:throw Error("mode:"+a);}else if(41>c)switch(a){case 1:return 14;case 2:return 13;case s:return 16;case 8:return 12;default:throw Error("mode:"+
a);}else throw Error("type:"+c);},getLostPoint:function(a){for(var c=a.getModuleCount(),d=0,b=0;b<c;b++)for(var e=0;e<c;e++){for(var f=0,i=a.isDark(b,e),g=-1;1>=g;g++)if(!(0>b+g||c<=b+g))for(var h=-1;1>=h;h++)0>e+h||c<=e+h||0==g&&0==h||i==a.isDark(b+g,e+h)&&f++;5<f&&(d+=3+f-5)}for(b=0;b<c-1;b++)for(e=0;e<c-1;e++)if(f=0,a.isDark(b,e)&&f++,a.isDark(b+1,e)&&f++,a.isDark(b,e+1)&&f++,a.isDark(b+1,e+1)&&f++,0==f||4==f)d+=3;for(b=0;b<c;b++)for(e=0;e<c-6;e++)a.isDark(b,e)&&!a.isDark(b,e+1)&&a.isDark(b,e+
2)&&a.isDark(b,e+3)&&a.isDark(b,e+4)&&!a.isDark(b,e+5)&&a.isDark(b,e+6)&&(d+=40);for(e=0;e<c;e++)for(b=0;b<c-6;b++)a.isDark(b,e)&&!a.isDark(b+1,e)&&a.isDark(b+2,e)&&a.isDark(b+3,e)&&a.isDark(b+4,e)&&!a.isDark(b+5,e)&&a.isDark(b+6,e)&&(d+=40);for(e=f=0;e<c;e++)for(b=0;b<c;b++)a.isDark(b,e)&&f++;a=Math.abs(100*f/c/c-50)/5;return d+10*a}},l={glog:function(a){if(1>a)throw Error("glog("+a+")");return l.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;256<=a;)a-=255;return l.EXP_TABLE[a]},EXP_TABLE:Array(256),
LOG_TABLE:Array(256)},m=0;8>m;m++)l.EXP_TABLE[m]=1<<m;for(m=8;256>m;m++)l.EXP_TABLE[m]=l.EXP_TABLE[m-4]^l.EXP_TABLE[m-5]^l.EXP_TABLE[m-6]^l.EXP_TABLE[m-8];for(m=0;255>m;m++)l.LOG_TABLE[l.EXP_TABLE[m]]=m;q.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var c=Array(this.getLength()+a.getLength()-1),d=0;d<this.getLength();d++)for(var b=0;b<a.getLength();b++)c[d+b]^=l.gexp(l.glog(this.get(d))+l.glog(a.get(b)));return new q(c,0)},mod:function(a){if(0>
this.getLength()-a.getLength())return this;for(var c=l.glog(this.get(0))-l.glog(a.get(0)),d=Array(this.getLength()),b=0;b<this.getLength();b++)d[b]=this.get(b);for(b=0;b<a.getLength();b++)d[b]^=l.gexp(l.glog(a.get(b))+c);return(new q(d,0)).mod(a)}};p.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],
[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,
116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,
43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,
3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,
55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,
45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];p.getRSBlocks=function(a,c){var d=p.getRsBlockTable(a,c);if(void 0==d)throw Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+c);for(var b=d.length/3,e=[],f=0;f<b;f++)for(var h=d[3*f+0],g=d[3*f+1],j=d[3*f+2],l=0;l<h;l++)e.push(new p(g,j));return e};p.getRsBlockTable=function(a,c){switch(c){case 1:return p.RS_BLOCK_TABLE[4*(a-1)+0];case 0:return p.RS_BLOCK_TABLE[4*(a-1)+1];case 3:return p.RS_BLOCK_TABLE[4*
(a-1)+2];case 2:return p.RS_BLOCK_TABLE[4*(a-1)+3]}};t.prototype={get:function(a){return 1==(this.buffer[Math.floor(a/8)]>>>7-a%8&1)},put:function(a,c){for(var d=0;d<c;d++)this.putBit(1==(a>>>c-d-1&1))},getLengthInBits:function(){return this.length},putBit:function(a){var c=Math.floor(this.length/8);this.buffer.length<=c&&this.buffer.push(0);a&&(this.buffer[c]|=128>>>this.length%8);this.length++}};"string"===typeof h&&(h={text:h});h=r.extend({},{render:"canvas",width:256,height:256,typeNumber:-1,
correctLevel:2,background:"#ffffff",foreground:"#000000"},h);return this.each(function(){var a;if("canvas"==h.render){a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();var c=document.createElement("canvas");c.width=h.width;c.height=h.height;for(var d=c.getContext("2d"),b=h.width/a.getModuleCount(),e=h.height/a.getModuleCount(),f=0;f<a.getModuleCount();f++)for(var i=0;i<a.getModuleCount();i++){d.fillStyle=a.isDark(f,i)?h.foreground:h.background;var g=Math.ceil((i+1)*b)-Math.floor(i*b),
j=Math.ceil((f+1)*b)-Math.floor(f*b);d.fillRect(Math.round(i*b),Math.round(f*e),g,j)}}else{a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();c=r("<table></table>").css("width",h.width+"px").css("height",h.height+"px").css("border","0px").css("border-collapse","collapse").css("background-color",h.background);d=h.width/a.getModuleCount();b=h.height/a.getModuleCount();for(e=0;e<a.getModuleCount();e++){f=r("<tr></tr>").css("height",b+"px").appendTo(c);for(i=0;i<a.getModuleCount();i++)r("<td></td>").css("width",
d+"px").css("background-color",a.isDark(e,i)?h.foreground:h.background).appendTo(f)}}a=c;jQuery(a).appendTo(this)})}})(jQuery);

}

window.setupLayerChooserApi = function() {
  // hide layer chooser if booted with the iitcm android app
  if (typeof android !== 'undefined' && android && android.setLayers) {
    $('.leaflet-control-layers').hide();
  }

  //hook some additional code into the LayerControl so it's easy for the mobile app to interface with it
  //WARNING: does depend on internals of the L.Control.Layers code
  window.layerChooser.getLayers = function() {
    var baseLayers = new Array();
    var overlayLayers = new Array();

    for (i in this._layers) {
      var obj = this._layers[i];
      var layerActive = window.map.hasLayer(obj.layer);
      var info = {
        layerId: L.stamp(obj.layer),
        name: obj.name,
        active: layerActive
      }
      if (obj.overlay) {
        overlayLayers.push(info);
      } else {
        baseLayers.push(info);
      }
    }

    var overlayLayersJSON = JSON.stringify(overlayLayers);
    var baseLayersJSON = JSON.stringify(baseLayers);

    if (typeof android !== 'undefined' && android && android.setLayers) {
        if(this.androidTimer) clearTimeout(this.androidTimer);
        this.androidTimer = setTimeout(function() {
            this.androidTimer = null;
            android.setLayers(baseLayersJSON, overlayLayersJSON);
        }, 1000);
    }

    return {
      baseLayers: baseLayers,
      overlayLayers: overlayLayers
    }
  }

  window.layerChooser.showLayer = function(id,show) {
    if (show === undefined) show = true;
    obj = this._layers[id];
    if (!obj) return false;

    if(show) {
      if (!this._map.hasLayer(obj.layer)) {
        //the layer to show is not currently active
        this._map.addLayer(obj.layer);

        //if it's a base layer, remove any others
        if (!obj.overlay) {
          for(i in this._layers) {
            if (i != id) {
              var other = this._layers[i];
              if (!other.overlay && this._map.hasLayer(other.layer)) this._map.removeLayer(other.layer);
            }
          }
        }
      }
    } else {
      if (this._map.hasLayer(obj.layer)) {
        this._map.removeLayer(obj.layer);
      }
    }

    //below logic based on code in L.Control.Layers _onInputClick
    if(!obj.overlay) {
      this._map.setZoom(this._map.getZoom());
      this._map.fire('baselayerchange', {layer: obj.layer});
    }

    return true;
  };

  var _update = window.layerChooser._update;
  window.layerChooser._update = function() {
    // update layer menu in IITCm
    try {
      if(typeof android != 'undefined')
        window.layerChooser.getLayers();
    } catch(e) {
      console.error(e);
    }
    // call through
    return _update.apply(this, arguments);
  }
  // as this setupLayerChooserApi function is called after the layer menu is populated, we need to also get they layers once
  // so they're passed through to the android app
  try {
    if(typeof android != 'undefined')
      window.layerChooser.getLayers();
  } catch(e) {
    console.error(e);
  }
}

// BOOTING ///////////////////////////////////////////////////////////

function boot() {
  if(!isSmartphone()) // TODO remove completely?
    window.debug.console.overwriteNativeIfRequired();

  console.log('loading done, booting. Built: 2015-11-17-004022');
  if(window.deviceID) console.log('Your device ID: ' + window.deviceID);
  window.runOnSmartphonesBeforeBoot();

  var iconDefImage = 'data:image/png;base64,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';
  var iconDefRetImage = 'data:image/png;base64,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';

  L.Icon.Default = L.Icon.extend({options: {
    iconUrl: iconDefImage,
    iconRetinaUrl: iconDefRetImage,
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    popupAnchor: new L.Point(1, -34),
  }});

  window.extractFromStock();
  window.setupIdle();
  window.setupTaphold();
  window.setupStyles();
  window.setupDialogs();
  window.setupDataTileParams();
  window.setupMap();
  window.setupOMS();
  window.search.setup();
  window.setupRedeem();
  window.setupLargeImagePreview();
  window.setupSidebarToggle();
  window.updateGameScore();
  window.artifact.setup();
  window.ornaments.setup();
  window.setupPlayerStat();
  window.setupTooltips();
  window.chat.setup();
  window.portalDetail.setup();
  window.setupQRLoadLib();
  window.setupLayerChooserSelectOne();
  window.setupLayerChooserStatusRecorder();
  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortalLL = getURLParam('pll');
  if(urlPortalLL) {
    urlPortalLL = urlPortalLL.split(",");
    urlPortalLL = [parseFloat(urlPortalLL[0]) || 0.0, parseFloat(urlPortalLL[1]) || 0.0];
  }
  urlPortal = getURLParam('pguid');

  $('#sidebar').show();

  if(window.bootPlugins) {
    // check to see if a known 'bad' plugin is installed. If so, alert the user, and don't boot any plugins
    var badPlugins = {
      'arc': 'Contains hidden code to report private data to a 3rd party server: <a href="https://plus.google.com/105383756361375410867/posts/4b2EjP3Du42">details here</a>',
    };

    // remove entries from badPlugins which are not installed
    $.each(badPlugins, function(name,desc) {
      if (!(window.plugin && window.plugin[name])) {
        // not detected: delete from the list
        delete badPlugins[name];
      }
    });

    // if any entries remain in the list, report this to the user and don't boot ANY plugins
    // (why not any? it's tricky to know which of the plugin boot entries were safe/unsafe)
    if (Object.keys(badPlugins).length > 0) {
      var warning = 'One or more known unsafe plugins were detected. For your safety, IITC has disabled all plugins.<ul>';
      $.each(badPlugins,function(name,desc) {
        warning += '<li><b>'+name+'</b>: '+desc+'</li>';
      });
      warning += '</ul><p>Please uninstall the problem plugins and reload the page. See this <a href="http://iitc.jonatkins.com/?page=faq#uninstall">FAQ entry</a> for help.</p><p><i>Note: It is tricky for IITC to safely disable just problem plugins</i></p>';

      dialog({
        title: 'Plugin Warning',
        html: warning,
        width: 400
      });
    } else {
      // no known unsafe plugins detected - boot all plugins
      $.each(window.bootPlugins, function(ind, ref) {
        try {
          ref();
        } catch(err) {
          console.error("error starting plugin: index "+ind+", error: "+err);
          debugger;
        }
      });
    }
  }

  window.setMapBaseLayer();
  window.setupLayerChooserApi();

  window.runOnSmartphonesAfterBoot();

  // workaround for #129. Not sure why this is required.
  // setTimeout('window.map.invalidateSize(false);', 500);

  window.iitcLoaded = true;
  window.runHooks('iitcLoaded');


  if (typeof android !== 'undefined' && android && android.bootFinished) {
    android.bootFinished();
  }

}


/* Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed */

//Include the chain.js microframework (http://github.com/chriso/chain.js)
(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]==="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d){b.onError.apply(a,[g,g.length]);return a}var h={};b.onError.apply(h,[g,g.length]);return c(h,null,"onError")}g.unshift(e);if(!d)return c({},[g],e);a.then=a[e],d.push(g);return f?a:a.next()}})(g)}e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)};return a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]==="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this);

var head = document.getElementsByTagName('head')[0] || document.documentElement;

addMethod('load', function (args, argc) {
    for (var queue = [], i = 0; i < argc; i++) {
        (function (i) {
            queue.push(asyncLoadScript(args[i]));
        }(i));
    }
    this.call('run', queue);
});

function asyncLoadScript(src) {
    return function (onload, onerror) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = onload;
        script.onerror = onerror;
        script.onreadystatechange = function () {
            var state = this.readyState;
            if (state === 'loaded' || state === 'complete') {
                script.onreadystatechange = null;
                onload();
            }
        };
        head.insertBefore(script, head.firstChild);
    }
}


try { console.log('Loading included JS now'); } catch(e) {}
﻿/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/
(function (window, document, undefined) {
var oldL = window.L,
    L = {};

L.version = '0.7.3';

// define Leaflet for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = L;

// define Leaflet as an AMD module
} else if (typeof define === 'function' && define.amd) {
	define(L);
}

// define Leaflet as a global L variable, saving the original L to restore later if needed

L.noConflict = function () {
	window.L = oldL;
	return this;
};

window.L = L;


/*
 * L.Util contains various utility functions used throughout Leaflet code.
 */

L.Util = {
	extend: function (dest) { // (Object[, Object, ...]) ->
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},

	bind: function (fn, obj) { // (Function, Object) -> Function
		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
		return function () {
			return fn.apply(obj, args || arguments);
		};
	},

	stamp: (function () {
		var lastId = 0,
		    key = '_leaflet_id';
		return function (obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),

	invokeEach: function (obj, method, context) {
		var i, args;

		if (typeof obj === 'object') {
			args = Array.prototype.slice.call(arguments, 3);

			for (i in obj) {
				method.apply(context, [i, obj[i]].concat(args));
			}
			return true;
		}

		return false;
	},

	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;

		return function wrapperFn() {
			var args = arguments;

			if (lock) {
				execOnUnlock = true;
				return;
			}

			lock = true;

			setTimeout(function () {
				lock = false;

				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);

			fn.apply(context, args);
		};
	},

	falseFn: function () {
		return false;
	},

	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	splitWords: function (str) {
		return L.Util.trim(str).split(/\s+/);
	},

	setOptions: function (obj, options) {
		obj.options = L.extend({}, obj.options, options);
		return obj.options;
	},

	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};

(function () {

	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		var i, fn,
		    prefixes = ['webkit', 'moz', 'o', 'ms'];

		for (i = 0; i < prefixes.length && !fn; i++) {
			fn = window[prefixes[i] + name];
		}

		return fn;
	}

	var lastTime = 0;

	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame ||
	        getPrefixed('RequestAnimationFrame') || timeoutDefer;

	var cancelFn = window.cancelAnimationFrame ||
	        getPrefixed('CancelAnimationFrame') ||
	        getPrefixed('CancelRequestAnimationFrame') ||
	        function (id) { window.clearTimeout(id); };


	L.Util.requestAnimFrame = function (fn, context, immediate, element) {
		fn = L.bind(fn, context);

		if (immediate && requestFn === timeoutDefer) {
			fn();
		} else {
			return requestFn.call(window, fn, element);
		}
	};

	L.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};

}());

// shortcuts for most used utility functions
L.extend = L.Util.extend;
L.bind = L.Util.bind;
L.stamp = L.Util.stamp;
L.setOptions = L.Util.setOptions;


/*
 * L.Class powers the OOP facilities of the library.
 * Thanks to John Resig and Dean Edwards for inspiration!
 */

L.Class = function () {};

L.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks) {
			this.callInitHooks();
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;

	var proto = new F();
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		L.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		L.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = L.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	L.extend(proto, props);

	proto._initHooks = [];

	var parent = this;
	// jshint camelcase: false
	NewClass.__super__ = parent.prototype;

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parent.prototype.callInitHooks) {
			parent.prototype.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};


// method for adding properties to prototype
L.Class.include = function (props) {
	L.extend(this.prototype, props);
};

// merge new default options to the Class
L.Class.mergeOptions = function (options) {
	L.extend(this.prototype.options, options);
};

// add a constructor hook
L.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};


/*
 * L.Mixin.Events is used to add custom events functionality to Leaflet classes.
 */

var eventsKey = '_leaflet_events';

L.Mixin = {};

L.Mixin.Events = {

	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])

		// types can be a map of types/handlers
		if (L.Util.invokeEach(types, this.addEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey] = this[eventsKey] || {},
		    contextId = context && context !== this && L.stamp(context),
		    i, len, event, type, indexKey, indexLenKey, typeIndex;

		// types can be a string of space-separated words
		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			event = {
				action: fn,
				context: context || this
			};
			type = types[i];

			if (contextId) {
				// store listeners of a particular context in a separate hash (if it has an id)
				// gives a major performance boost when removing thousands of map layers

				indexKey = type + '_idx';
				indexLenKey = indexKey + '_len';

				typeIndex = events[indexKey] = events[indexKey] || {};

				if (!typeIndex[contextId]) {
					typeIndex[contextId] = [];

					// keep track of the number of keys in the index to quickly check if it's empty
					events[indexLenKey] = (events[indexLenKey] || 0) + 1;
				}

				typeIndex[contextId].push(event);


			} else {
				events[type] = events[type] || [];
				events[type].push(event);
			}
		}

		return this;
	},

	hasEventListeners: function (type) { // (String) -> Boolean
		var events = this[eventsKey];
		return !!events && ((type in events && events[type].length > 0) ||
		                    (type + '_idx' in events && events[type + '_idx_len'] > 0));
	},

	removeEventListener: function (types, fn, context) { // ([String, Function, Object]) or (Object[, Object])

		if (!this[eventsKey]) {
			return this;
		}

		if (!types) {
			return this.clearAllEventListeners();
		}

		if (L.Util.invokeEach(types, this.removeEventListener, this, fn, context)) { return this; }

		var events = this[eventsKey],
		    contextId = context && context !== this && L.stamp(context),
		    i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;

		types = L.Util.splitWords(types);

		for (i = 0, len = types.length; i < len; i++) {
			type = types[i];
			indexKey = type + '_idx';
			indexLenKey = indexKey + '_len';

			typeIndex = events[indexKey];

			if (!fn) {
				// clear all listeners for a type if function isn't specified
				delete events[type];
				delete events[indexKey];
				delete events[indexLenKey];

			} else {
				listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];

				if (listeners) {
					for (j = listeners.length - 1; j >= 0; j--) {
						if ((listeners[j].action === fn) && (!context || (listeners[j].context === context))) {
							removed = listeners.splice(j, 1);
							// set the old action to a no-op, because it is possible
							// that the listener is being iterated over as part of a dispatch
							removed[0].action = L.Util.falseFn;
						}
					}

					if (context && typeIndex && (listeners.length === 0)) {
						delete typeIndex[contextId];
						events[indexLenKey]--;
					}
				}
			}
		}

		return this;
	},

	clearAllEventListeners: function () {
		delete this[eventsKey];
		return this;
	},

	fireEvent: function (type, data) { // (String[, Object])
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = L.Util.extend({}, data, { type: type, target: this });

		var events = this[eventsKey],
		    listeners, i, len, typeIndex, contextId;

		if (events[type]) {
			// make sure adding/removing listeners inside other listeners won't cause infinite loop
			listeners = events[type].slice();

			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].action.call(listeners[i].context, event);
			}
		}

		// fire event for the context-indexed listeners as well
		typeIndex = events[type + '_idx'];

		for (contextId in typeIndex) {
			listeners = typeIndex[contextId].slice();

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].action.call(listeners[i].context, event);
				}
			}
		}

		return this;
	},

	addOneTimeEventListener: function (types, fn, context) {

		if (L.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) { return this; }

		var handler = L.bind(function () {
			this
			    .removeEventListener(types, fn, context)
			    .removeEventListener(types, handler, context);
		}, this);

		return this
		    .addEventListener(types, fn, context)
		    .addEventListener(types, handler, context);
	}
};

L.Mixin.Events.on = L.Mixin.Events.addEventListener;
L.Mixin.Events.off = L.Mixin.Events.removeEventListener;
L.Mixin.Events.once = L.Mixin.Events.addOneTimeEventListener;
L.Mixin.Events.fire = L.Mixin.Events.fireEvent;


/*
 * L.Browser handles different browser and feature detections for internal Leaflet use.
 */

(function () {

	var ie = 'ActiveXObject' in window,
		ielt9 = ie && !document.addEventListener,

	    // terrible browser detection to work around Safari / iOS / Android browser bugs
	    ua = navigator.userAgent.toLowerCase(),
	    webkit = ua.indexOf('webkit') !== -1,
	    chrome = ua.indexOf('chrome') !== -1,
	    phantomjs = ua.indexOf('phantom') !== -1,
	    android = ua.indexOf('android') !== -1,
	    android23 = ua.search('android [23]') !== -1,
		gecko = ua.indexOf('gecko') !== -1,

	    mobile = typeof orientation !== undefined + '',
	    msPointer = window.navigator && window.navigator.msPointerEnabled &&
	              window.navigator.msMaxTouchPoints && !window.PointerEvent,
		pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
				  msPointer,
	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
	              window.matchMedia('(min-resolution:144dpi)').matches),

	    doc = document.documentElement,
	    ie3d = ie && ('transition' in doc.style),
	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	    gecko3d = 'MozPerspective' in doc.style,
	    opera3d = 'OTransition' in doc.style,
	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


	// PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
	// https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

	var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

		var startName = 'ontouchstart';

		// IE10+ (We simulate these into touch* events in L.DomEvent and L.DomEvent.Pointer) or WebKit, etc.
		if (pointer || (startName in doc)) {
			return true;
		}

		// Firefox/Gecko
		var div = document.createElement('div'),
		    supported = false;

		if (!div.setAttribute) {
			return false;
		}
		div.setAttribute(startName, 'return;');

		if (typeof div[startName] === 'function') {
			supported = true;
		}

		div.removeAttribute(startName);
		div = null;

		return supported;
	}());


	L.Browser = {
		ie: ie,
		ielt9: ielt9,
		webkit: webkit,
		gecko: gecko && !webkit && !window.opera && !ie,

		android: android,
		android23: android23,

		chrome: chrome,

		ie3d: ie3d,
		webkit3d: webkit3d,
		gecko3d: gecko3d,
		opera3d: opera3d,
		any3d: any3d,

		mobile: mobile,
		mobileWebkit: mobile && webkit,
		mobileWebkit3d: mobile && webkit3d,
		mobileOpera: mobile && window.opera,

		touch: touch,
		msPointer: msPointer,
		pointer: pointer,

		retina: retina
	};

}());


/*
 * L.Point represents a point with x and y coordinates.
 */

L.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {
	this.x = (round ? Math.round(x) : x);
	this.y = (round ? Math.round(y) : y);
};

L.Point.prototype = {

	clone: function () {
		return new L.Point(this.x, this.y);
	},

	// non-destructive, returns a new point
	add: function (point) {
		return this.clone()._add(L.point(point));
	},

	// destructive, used directly for performance in situations where it's safe to modify existing point
	_add: function (point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	subtract: function (point) {
		return this.clone()._subtract(L.point(point));
	},

	_subtract: function (point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	divideBy: function (num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function (num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	multiplyBy: function (num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function (num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	round: function () {
		return this.clone()._round();
	},

	_round: function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	floor: function () {
		return this.clone()._floor();
	},

	_floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	distanceTo: function (point) {
		point = L.point(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	equals: function (point) {
		point = L.point(point);

		return point.x === this.x &&
		       point.y === this.y;
	},

	contains: function (point) {
		point = L.point(point);

		return Math.abs(point.x) <= Math.abs(this.x) &&
		       Math.abs(point.y) <= Math.abs(this.y);
	},

	toString: function () {
		return 'Point(' +
		        L.Util.formatNum(this.x) + ', ' +
		        L.Util.formatNum(this.y) + ')';
	}
};

L.point = function (x, y, round) {
	if (x instanceof L.Point) {
		return x;
	}
	if (L.Util.isArray(x)) {
		return new L.Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	return new L.Point(x, y, round);
};


/*
 * L.Bounds represents a rectangular area on the screen in pixel coordinates.
 */

L.Bounds = function (a, b) { //(Point, Point) or Point[]
	if (!a) { return; }

	var points = b ? [a, b] : a;

	for (var i = 0, len = points.length; i < len; i++) {
		this.extend(points[i]);
	}
};

L.Bounds.prototype = {
	// extend the bounds to contain the given point
	extend: function (point) { // (Point)
		point = L.point(point);

		if (!this.min && !this.max) {
			this.min = point.clone();
			this.max = point.clone();
		} else {
			this.min.x = Math.min(point.x, this.min.x);
			this.max.x = Math.max(point.x, this.max.x);
			this.min.y = Math.min(point.y, this.min.y);
			this.max.y = Math.max(point.y, this.max.y);
		}
		return this;
	},

	getCenter: function (round) { // (Boolean) -> Point
		return new L.Point(
		        (this.min.x + this.max.x) / 2,
		        (this.min.y + this.max.y) / 2, round);
	},

	getBottomLeft: function () { // -> Point
		return new L.Point(this.min.x, this.max.y);
	},

	getTopRight: function () { // -> Point
		return new L.Point(this.max.x, this.min.y);
	},

	getSize: function () {
		return this.max.subtract(this.min);
	},

	contains: function (obj) { // (Bounds) or (Point) -> Boolean
		var min, max;

		if (typeof obj[0] === 'number' || obj instanceof L.Point) {
			obj = L.point(obj);
		} else {
			obj = L.bounds(obj);
		}

		if (obj instanceof L.Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	},

	intersects: function (bounds) { // (Bounds) -> Boolean
		bounds = L.bounds(bounds);

		var min = this.min,
		    max = this.max,
		    min2 = bounds.min,
		    max2 = bounds.max,
		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	},

	isValid: function () {
		return !!(this.min && this.max);
	}
};

L.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])
	if (!a || a instanceof L.Bounds) {
		return a;
	}
	return new L.Bounds(a, b);
};


/*
 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.
 */

L.Transformation = function (a, b, c, d) {
	this._a = a;
	this._b = b;
	this._c = c;
	this._d = d;
};

L.Transformation.prototype = {
	transform: function (point, scale) { // (Point, Number) -> Point
		return this._transform(point.clone(), scale);
	},

	// destructive transform (faster)
	_transform: function (point, scale) {
		scale = scale || 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	},

	untransform: function (point, scale) {
		scale = scale || 1;
		return new L.Point(
		        (point.x / scale - this._b) / this._a,
		        (point.y / scale - this._d) / this._c);
	}
};


/*
 * L.DomUtil contains various utility functions for working with DOM.
 */

L.DomUtil = {
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},

	getStyle: function (el, style) {

		var value = el.style[style];

		if (!value && el.currentStyle) {
			value = el.currentStyle[style];
		}

		if ((!value || value === 'auto') && document.defaultView) {
			var css = document.defaultView.getComputedStyle(el, null);
			value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	getViewportOffset: function (element) {

		var top = 0,
		    left = 0,
		    el = element,
		    docBody = document.body,
		    docEl = document.documentElement,
		    pos;

		do {
			top  += el.offsetTop  || 0;
			left += el.offsetLeft || 0;

			//add borders
			top += parseInt(L.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
			left += parseInt(L.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

			pos = L.DomUtil.getStyle(el, 'position');

			if (el.offsetParent === docBody && pos === 'absolute') { break; }

			if (pos === 'fixed') {
				top  += docBody.scrollTop  || docEl.scrollTop  || 0;
				left += docBody.scrollLeft || docEl.scrollLeft || 0;
				break;
			}

			if (pos === 'relative' && !el.offsetLeft) {
				var width = L.DomUtil.getStyle(el, 'width'),
				    maxWidth = L.DomUtil.getStyle(el, 'max-width'),
				    r = el.getBoundingClientRect();

				if (width !== 'none' || maxWidth !== 'none') {
					left += r.left + el.clientLeft;
				}

				//calculate full y offset since we're breaking out of the loop
				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);

				break;
			}

			el = el.offsetParent;

		} while (el);

		el = element;

		do {
			if (el === docBody) { break; }

			top  -= el.scrollTop  || 0;
			left -= el.scrollLeft || 0;

			el = el.parentNode;
		} while (el);

		return new L.Point(left, top);
	},

	documentIsLtr: function () {
		if (!L.DomUtil._docIsLtrCached) {
			L.DomUtil._docIsLtrCached = true;
			L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, 'direction') === 'ltr';
		}
		return L.DomUtil._docIsLtr;
	},

	create: function (tagName, className, container) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		return el;
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
			return el.classList.contains(name);
		}
		var className = L.DomUtil._getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (el.classList !== undefined) {
			var classes = L.Util.splitWords(name);
			for (var i = 0, len = classes.length; i < len; i++) {
				el.classList.add(classes[i]);
			}
		} else if (!L.DomUtil.hasClass(el, name)) {
			var className = L.DomUtil._getClass(el);
			L.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (el.classList !== undefined) {
			el.classList.remove(name);
		} else {
			L.DomUtil._setClass(el, L.Util.trim((' ' + L.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},

	_setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
			el.className = name;
		} else {
			// in case of SVG element
			el.className.baseVal = name;
		}
	},

	_getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	setOpacity: function (el, value) {

		if ('opacity' in el.style) {
			el.style.opacity = value;

		} else if ('filter' in el.style) {

			var filter = false,
			    filterName = 'DXImageTransform.Microsoft.Alpha';

			// filters collection throws an error if we try to retrieve a filter that doesn't exist
			try {
				filter = el.filters.item(filterName);
			} catch (e) {
				// don't set opacity to 1 if we haven't already set an opacity,
				// it isn't needed and breaks transparent pngs.
				if (value === 1) { return; }
			}

			value = Math.round(value * 100);

			if (filter) {
				filter.Enabled = (value !== 100);
				filter.Opacity = value;
			} else {
				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
			}
		}
	},

	testProp: function (props) {

		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	},

	getTranslateString: function (point) {
		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
		// (same speed either way), Opera 12 doesn't support translate3d

		var is3d = L.Browser.webkit3d,
		    open = 'translate' + (is3d ? '3d' : '') + '(',
		    close = (is3d ? ',0' : '') + ')';

		return open + point.x + 'px,' + point.y + 'px' + close;
	},

	getScaleString: function (scale, origin) {

		var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
		    scaleStr = ' scale(' + scale + ') ';

		return preTranslateStr + scaleStr;
	},

	setPosition: function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])

		// jshint camelcase: false
		el._leaflet_pos = point;

		if (!disable3D && L.Browser.any3d) {
			el.style[L.DomUtil.TRANSFORM] =  L.DomUtil.getTranslateString(point);
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		// this method is only used for elements previously positioned using setPosition,
		// so it's safe to cache the position for performance

		// jshint camelcase: false
		return el._leaflet_pos;
	}
};


// prefix style property names

L.DomUtil.TRANSFORM = L.DomUtil.testProp(
        ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

// webkitTransition comes first because some browser versions that drop vendor prefix don't do
// the same for the transitionend event, in particular the Android 4.1 stock browser

L.DomUtil.TRANSITION = L.DomUtil.testProp(
        ['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

L.DomUtil.TRANSITION_END =
        L.DomUtil.TRANSITION === 'webkitTransition' || L.DomUtil.TRANSITION === 'OTransition' ?
        L.DomUtil.TRANSITION + 'End' : 'transitionend';

(function () {
    if ('onselectstart' in document) {
        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);
            },

            enableTextSelection: function () {
                L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);
            }
        });
    } else {
        var userSelectProperty = L.DomUtil.testProp(
            ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

        L.extend(L.DomUtil, {
            disableTextSelection: function () {
                if (userSelectProperty) {
                    var style = document.documentElement.style;
                    this._userSelect = style[userSelectProperty];
                    style[userSelectProperty] = 'none';
                }
            },

            enableTextSelection: function () {
                if (userSelectProperty) {
                    document.documentElement.style[userSelectProperty] = this._userSelect;
                    delete this._userSelect;
                }
            }
        });
    }

	L.extend(L.DomUtil, {
		disableImageDrag: function () {
			L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);
		},

		enableImageDrag: function () {
			L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);
		}
	});
})();


/*
 * L.LatLng represents a geographical point with latitude and longitude coordinates.
 */

L.LatLng = function (lat, lng, alt) { // (Number, Number, Number)
	lat = parseFloat(lat);
	lng = parseFloat(lng);

	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
	}

	this.lat = lat;
	this.lng = lng;

	if (alt !== undefined) {
		this.alt = parseFloat(alt);
	}
};

L.extend(L.LatLng, {
	DEG_TO_RAD: Math.PI / 180,
	RAD_TO_DEG: 180 / Math.PI,
	MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check
});

L.LatLng.prototype = {
	equals: function (obj) { // (LatLng) -> Boolean
		if (!obj) { return false; }

		obj = L.latLng(obj);

		var margin = Math.max(
		        Math.abs(this.lat - obj.lat),
		        Math.abs(this.lng - obj.lng));

		return margin <= L.LatLng.MAX_MARGIN;
	},

	toString: function (precision) { // (Number) -> String
		return 'LatLng(' +
		        L.Util.formatNum(this.lat, precision) + ', ' +
		        L.Util.formatNum(this.lng, precision) + ')';
	},

	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula
	// TODO move to projection code, LatLng shouldn't know about Earth
	distanceTo: function (other) { // (LatLng) -> Number
		other = L.latLng(other);

		var R = 6367000.0, // earth radius in meters
		    d2r = L.LatLng.DEG_TO_RAD,
		    dLat = (other.lat - this.lat) * d2r,
		    dLon = (other.lng - this.lng) * d2r,
		    lat1 = this.lat * d2r,
		    lat2 = other.lat * d2r,
		    sin1 = Math.sin(dLat / 2),
		    sin2 = Math.sin(dLon / 2);

		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	},

	wrap: function (a, b) { // (Number, Number) -> LatLng
		var lng = this.lng;

		a = a || -180;
		b = b ||  180;

		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);

		return new L.LatLng(this.lat, lng);
	}
};

L.latLng = function (a, b) { // (LatLng) or ([Number, Number]) or (Number, Number)
	if (a instanceof L.LatLng) {
		return a;
	}
	if (L.Util.isArray(a)) {
		if (typeof a[0] === 'number' || typeof a[0] === 'string') {
			return new L.LatLng(a[0], a[1], a[2]);
		} else {
			return null;
		}
	}
	if (a === undefined || a === null) {
		return a;
	}
	if (typeof a === 'object' && 'lat' in a) {
		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);
	}
	if (b === undefined) {
		return null;
	}
	return new L.LatLng(a, b);
};



/*
 * L.LatLngBounds represents a rectangular area on the map in geographical coordinates.
 */

L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])
	if (!southWest) { return; }

	var latlngs = northEast ? [southWest, northEast] : southWest;

	for (var i = 0, len = latlngs.length; i < len; i++) {
		this.extend(latlngs[i]);
	}
};

L.LatLngBounds.prototype = {
	// extend the bounds to contain the given point or bounds
	extend: function (obj) { // (LatLng) or (LatLngBounds)
		if (!obj) { return this; }

		var latLng = L.latLng(obj);
		if (latLng !== null) {
			obj = latLng;
		} else {
			obj = L.latLngBounds(obj);
		}

		if (obj instanceof L.LatLng) {
			if (!this._southWest && !this._northEast) {
				this._southWest = new L.LatLng(obj.lat, obj.lng);
				this._northEast = new L.LatLng(obj.lat, obj.lng);
			} else {
				this._southWest.lat = Math.min(obj.lat, this._southWest.lat);
				this._southWest.lng = Math.min(obj.lng, this._southWest.lng);

				this._northEast.lat = Math.max(obj.lat, this._northEast.lat);
				this._northEast.lng = Math.max(obj.lng, this._northEast.lng);
			}
		} else if (obj instanceof L.LatLngBounds) {
			this.extend(obj._southWest);
			this.extend(obj._northEast);
		}
		return this;
	},

	// extend the bounds by a percentage
	pad: function (bufferRatio) { // (Number) -> LatLngBounds
		var sw = this._southWest,
		    ne = this._northEast,
		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

		return new L.LatLngBounds(
		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	},

	getCenter: function () { // -> LatLng
		return new L.LatLng(
		        (this._southWest.lat + this._northEast.lat) / 2,
		        (this._southWest.lng + this._northEast.lng) / 2);
	},

	getSouthWest: function () {
		return this._southWest;
	},

	getNorthEast: function () {
		return this._northEast;
	},

	getNorthWest: function () {
		return new L.LatLng(this.getNorth(), this.getWest());
	},

	getSouthEast: function () {
		return new L.LatLng(this.getSouth(), this.getEast());
	},

	getWest: function () {
		return this._southWest.lng;
	},

	getSouth: function () {
		return this._southWest.lat;
	},

	getEast: function () {
		return this._northEast.lng;
	},

	getNorth: function () {
		return this._northEast.lat;
	},

	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {
			obj = L.latLng(obj);
		} else {
			obj = L.latLngBounds(obj);
		}

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2, ne2;

		if (obj instanceof L.LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else {
			sw2 = ne2 = obj;
		}

		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
	},

	intersects: function (bounds) { // (LatLngBounds)
		bounds = L.latLngBounds(bounds);

		var sw = this._southWest,
		    ne = this._northEast,
		    sw2 = bounds.getSouthWest(),
		    ne2 = bounds.getNorthEast(),

		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

		return latIntersects && lngIntersects;
	},

	toBBoxString: function () {
		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
	},

	equals: function (bounds) { // (LatLngBounds)
		if (!bounds) { return false; }

		bounds = L.latLngBounds(bounds);

		return this._southWest.equals(bounds.getSouthWest()) &&
		       this._northEast.equals(bounds.getNorthEast());
	},

	isValid: function () {
		return !!(this._southWest && this._northEast);
	}
};

//TODO International date line?

L.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)
	if (!a || a instanceof L.LatLngBounds) {
		return a;
	}
	return new L.LatLngBounds(a, b);
};


/*
 * L.Projection contains various geographical projections used by CRS classes.
 */

L.Projection = {};


/*
 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.
 */

L.Projection.SphericalMercator = {
	MAX_LATITUDE: 85.0511287798,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    x = latlng.lng * d,
		    y = lat * d;

		y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    lng = point.x * d,
		    lat = (2 * Math.atan(Math.exp(point.y)) - (Math.PI / 2)) * d;

		return new L.LatLng(lat, lng);
	}
};


/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

L.Projection.LonLat = {
	project: function (latlng) {
		return new L.Point(latlng.lng, latlng.lat);
	},

	unproject: function (point) {
		return new L.LatLng(point.y, point.x);
	}
};


/*
 * L.CRS is a base object for all defined CRS (Coordinate Reference Systems) in Leaflet.
 */

L.CRS = {
	latLngToPoint: function (latlng, zoom) { // (LatLng, Number) -> Point
		var projectedPoint = this.projection.project(latlng),
		    scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	},

	pointToLatLng: function (point, zoom) { // (Point, Number[, Boolean]) -> LatLng
		var scale = this.scale(zoom),
		    untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	},

	project: function (latlng) {
		return this.projection.project(latlng);
	},

	scale: function (zoom) {
		return 256 * Math.pow(2, zoom);
	},

	getSize: function (zoom) {
		var s = this.scale(zoom);
		return L.point(s, s);
	}
};


/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	}
});


/*
 * L.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping
 * and is used by Leaflet by default.
 */

L.CRS.EPSG3857 = L.extend({}, L.CRS, {
	code: 'EPSG:3857',

	projection: L.Projection.SphericalMercator,
	transformation: new L.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5),

	project: function (latlng) { // (LatLng) -> Point
		var projectedPoint = this.projection.project(latlng),
		    earthRadius = 6367000.0;
		return projectedPoint.multiplyBy(earthRadius);
	}
});

L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {
	code: 'EPSG:900913'
});


/*
 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.
 */

L.CRS.EPSG4326 = L.extend({}, L.CRS, {
	code: 'EPSG:4326',

	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1 / 360, 0.5, -1 / 360, 0.5)
});


/*
 * L.Map is the central class of the API - it is used to create a map.
 */

L.Map = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		crs: L.CRS.EPSG3857,

		/*
		center: LatLng,
		zoom: Number,
		layers: Array,
		*/

		fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,
		trackResize: true,
		markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d
	},

	initialize: function (id, options) { // (HTMLElement or String, Object)
		options = L.setOptions(this, options);


		this._initContainer(id);
		this._initLayout();

		// hack for https://github.com/Leaflet/Leaflet/issues/1980
		this._onResize = L.bind(this._onResize, this);

		this._initEvents();

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(L.latLng(options.center), options.zoom, {reset: true});
		}

		this._handlers = [];

		this._layers = {};
		this._zoomBoundLayers = {};
		this._tileLayersNum = 0;

		this.callInitHooks();

		this._addLayers(options.layers);
	},


	// public methods that modify map state

	// replaced by animation-powered implementation in Map.PanAnimation.js
	setView: function (center, zoom) {
		zoom = zoom === undefined ? this.getZoom() : zoom;
		this._resetView(L.latLng(center), this._limitZoom(zoom));
		return this;
	},

	setZoom: function (zoom, options) {
		if (!this._loaded) {
			this._zoom = this._limitZoom(zoom);
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	},

	zoomIn: function (delta, options) {
		return this.setZoom(this._zoom + (delta || 1), options);
	},

	zoomOut: function (delta, options) {
		return this.setZoom(this._zoom - (delta || 1), options);
	},

	setZoomAround: function (latlng, zoom, options) {
		var scale = this.getZoomScale(zoom),
		    viewHalf = this.getSize().divideBy(2),
		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	},

	fitBounds: function (bounds, options) {

		options = options || {};
		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR)),
		    paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		    swPoint = this.project(bounds.getSouthWest(), zoom),
		    nePoint = this.project(bounds.getNorthEast(), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		zoom = options && options.maxZoom ? Math.min(options.maxZoom, zoom) : zoom;

		return this.setView(center, zoom, options);
	},

	fitWorld: function (options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	},

	panTo: function (center, options) { // (LatLng)
		return this.setView(center, this._zoom, {pan: options});
	},

	panBy: function (offset) { // (Point)
		// replaced with animated panBy in Map.PanAnimation.js
		this.fire('movestart');

		this._rawPanBy(L.point(offset));

		this.fire('move');
		return this.fire('moveend');
	},

	setMaxBounds: function (bounds) {
		bounds = L.latLngBounds(bounds);

		this.options.maxBounds = bounds;

		if (!bounds) {
			return this.off('moveend', this._panInsideMaxBounds, this);
		}

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds, this);
	},

	panInsideBounds: function (bounds, options) {
		var center = this.getCenter(),
			newCenter = this._limitCenter(center, this._zoom, bounds);

		if (center.equals(newCenter)) { return this; }

		return this.panTo(newCenter, options);
	},

	addLayer: function (layer) {
		// TODO method is too big, refactor

		var id = L.stamp(layer);

		if (this._layers[id]) { return this; }

		this._layers[id] = layer;

		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)
		if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {
			this._zoomBoundLayers[id] = layer;
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor!!!
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum++;
			this._tileLayersToLoad++;
			layer.on('load', this._onTileLayerLoad, this);
		}

		if (this._loaded) {
			this._layerAdd(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer: layer});
		}

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}

		// TODO looks ugly, refactor
		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {
			this._tileLayersNum--;
			this._tileLayersToLoad--;
			layer.off('load', this._onTileLayerLoad, this);
		}

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (L.stamp(layer) in this._layers);
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	invalidateSize: function (options) {
		if (!this._loaded) { return this; }

		options = L.extend({
			animate: false,
			pan: true
		}, options === true ? {animate: true} : options);

		var oldSize = this.getSize();
		this._sizeChanged = true;
		this._initialCenter = null;

		var newSize = this.getSize(),
		    oldCenter = oldSize.divideBy(2).round(),
		    newCenter = newSize.divideBy(2).round(),
		    offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize: oldSize,
			newSize: newSize
		});
	},

	// TODO handler.addTo
	addHandler: function (name, HandlerClass) {
		if (!HandlerClass) { return this; }

		var handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	},

	remove: function () {
		if (this._loaded) {
			this.fire('unload');
		}

		this._initEvents('off');

		try {
			// throws error in IE6-8
			delete this._container._leaflet;
		} catch (e) {
			this._container._leaflet = undefined;
		}

		this._clearPanes();
		if (this._clearControlPos) {
			this._clearControlPos();
		}

		this._clearHandlers();

		return this;
	},


	// public methods for getting map state

	getCenter: function () { // (Boolean) -> LatLng
		this._checkIfLoaded();

		if (this._initialCenter && !this._moved()) {
			return this._initialCenter;
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	},

	getZoom: function () {
		return this._zoom;
	},

	getBounds: function () {
		var bounds = this.getPixelBounds(),
		    sw = this.unproject(bounds.getBottomLeft()),
		    ne = this.unproject(bounds.getTopRight());

		return new L.LatLngBounds(sw, ne);
	},

	getMinZoom: function () {
		return this.options.minZoom === undefined ?
			(this._layersMinZoom === undefined ? 0 : this._layersMinZoom) :
			this.options.minZoom;
	},

	getMaxZoom: function () {
		return this.options.maxZoom === undefined ?
			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
			this.options.maxZoom;
	},

	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
		bounds = L.latLngBounds(bounds);

		var zoom = this.getMinZoom() - (inside ? 1 : 0),
		    maxZoom = this.getMaxZoom(),
		    size = this.getSize(),

		    nw = bounds.getNorthWest(),
		    se = bounds.getSouthEast(),

		    zoomNotFound = true,
		    boundsSize;

		padding = L.point(padding || [0, 0]);

		do {
			zoom++;
			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

		} while (zoomNotFound && zoom <= maxZoom);

		if (zoomNotFound && inside) {
			return null;
		}

		return inside ? zoom : zoom - 1;
	},

	getSize: function () {
		if (!this._size || this._sizeChanged) {
			this._size = new L.Point(
				this._container.clientWidth,
				this._container.clientHeight);

			this._sizeChanged = false;
		}
		return this._size.clone();
	},

	getPixelBounds: function () {
		var topLeftPoint = this._getTopLeftPoint();
		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	},

	getPixelOrigin: function () {
		this._checkIfLoaded();
		return this._initialTopLeftPoint;
	},

	getPanes: function () {
		return this._panes;
	},

	getContainer: function () {
		return this._container;
	},


	// TODO replace with universal implementation after refactoring projections

	getZoomScale: function (toZoom) {
		var crs = this.options.crs;
		return crs.scale(toZoom) / crs.scale(this._zoom);
	},

	getScaleZoom: function (scale) {
		return this._zoom + (Math.log(scale) / Math.LN2);
	},


	// conversion methods

	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);
	},

	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng
		zoom = zoom === undefined ? this._zoom : zoom;
		return this.options.crs.pointToLatLng(L.point(point), zoom);
	},

	layerPointToLatLng: function (point) { // (Point)
		var projectedPoint = L.point(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	},

	latLngToLayerPoint: function (latlng) { // (LatLng)
		var projectedPoint = this.project(L.latLng(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	},

	containerPointToLayerPoint: function (point) { // (Point)
		return L.point(point).subtract(this._getMapPanePos());
	},

	layerPointToContainerPoint: function (point) { // (Point)
		return L.point(point).add(this._getMapPanePos());
	},

	containerPointToLatLng: function (point) {
		var layerPoint = this.containerPointToLayerPoint(L.point(point));
		return this.layerPointToLatLng(layerPoint);
	},

	latLngToContainerPoint: function (latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));
	},

	mouseEventToContainerPoint: function (e) { // (MouseEvent)
		return L.DomEvent.getMousePosition(e, this._container);
	},

	mouseEventToLayerPoint: function (e) { // (MouseEvent)
		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
	},

	mouseEventToLatLng: function (e) { // (MouseEvent)
		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
	},


	// map initialization methods

	_initContainer: function (id) {
		var container = this._container = L.DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._leaflet) {
			throw new Error('Map container is already initialized.');
		}

		container._leaflet = true;
	},

	_initLayout: function () {
		var container = this._container;

		L.DomUtil.addClass(container, 'leaflet-container' +
			(L.Browser.touch ? ' leaflet-touch' : '') +
			(L.Browser.retina ? ' leaflet-retina' : '') +
			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +
			(this.options.fadeAnimation ? ' leaflet-fade-anim' : ''));

		var position = L.DomUtil.getStyle(container, 'position');

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	},

	_initPanes: function () {
		var panes = this._panes = {};

		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);

		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);
		panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);
		panes.shadowPane = this._createPane('leaflet-shadow-pane');
		panes.overlayPane = this._createPane('leaflet-overlay-pane');
		panes.markerPane = this._createPane('leaflet-marker-pane');
		panes.popupPane = this._createPane('leaflet-popup-pane');

		var zoomHide = ' leaflet-zoom-hide';

		if (!this.options.markerZoomAnimation) {
			L.DomUtil.addClass(panes.markerPane, zoomHide);
			L.DomUtil.addClass(panes.shadowPane, zoomHide);
			L.DomUtil.addClass(panes.popupPane, zoomHide);
		}
	},

	_createPane: function (className, container) {
		return L.DomUtil.create('div', className, container || this._panes.objectsPane);
	},

	_clearPanes: function () {
		this._container.removeChild(this._mapPane);
	},

	_addLayers: function (layers) {
		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];

		for (var i = 0, len = layers.length; i < len; i++) {
			this.addLayer(layers[i]);
		}
	},


	// private methods that modify map state

	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {

		var zoomChanged = (this._zoom !== zoom);

		if (!afterZoomAnim) {
			this.fire('movestart');

			if (zoomChanged) {
				this.fire('zoomstart');
			}
		}

		this._zoom = zoom;
		this._initialCenter = center;

		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);

		if (!preserveMapOffset) {
			L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));
		} else {
			this._initialTopLeftPoint._add(this._getMapPanePos());
		}

		this._tileLayersToLoad = this._tileLayersNum;

		var loading = !this._loaded;
		this._loaded = true;

		this.fire('viewreset', {hard: !preserveMapOffset});

		if (loading) {
			this.fire('load');
			this.eachLayer(this._layerAdd, this);
		}

		this.fire('move');

		if (zoomChanged || afterZoomAnim) {
			this.fire('zoomend');
		}

		this.fire('moveend', {hard: !preserveMapOffset});
	},

	_rawPanBy: function (offset) {
		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	},

	_getZoomSpan: function () {
		return this.getMaxZoom() - this.getMinZoom();
	},

	_updateZoomLevels: function () {
		var i,
			minZoom = Infinity,
			maxZoom = -Infinity,
			oldZoomSpan = this._getZoomSpan();

		for (i in this._zoomBoundLayers) {
			var layer = this._zoomBoundLayers[i];
			if (!isNaN(layer.options.minZoom)) {
				minZoom = Math.min(minZoom, layer.options.minZoom);
			}
			if (!isNaN(layer.options.maxZoom)) {
				maxZoom = Math.max(maxZoom, layer.options.maxZoom);
			}
		}

		if (i === undefined) { // we have no tilelayers
			this._layersMaxZoom = this._layersMinZoom = undefined;
		} else {
			this._layersMaxZoom = maxZoom;
			this._layersMinZoom = minZoom;
		}

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}
	},

	_panInsideMaxBounds: function () {
		this.panInsideBounds(this.options.maxBounds);
	},

	_checkIfLoaded: function () {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	},

	// map events

	_initEvents: function (onOff) {
		if (!L.DomEvent) { return; }

		onOff = onOff || 'on';

		L.DomEvent[onOff](this._container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter',
		              'mouseleave', 'mousemove', 'contextmenu'],
		    i, len;

		for (i = 0, len = events.length; i < len; i++) {
			L.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			L.DomEvent[onOff](window, 'resize', this._onResize, this);
		}
	},

	_onResize: function () {
		L.Util.cancelAnimFrame(this._resizeRequest);
		this._resizeRequest = L.Util.requestAnimFrame(
		        function () { this.invalidateSize({debounceMoveend: true}); }, this, false, this._container);
	},

	_onMouseClick: function (e) {
		if (!this._loaded || (!e._simulated &&
		        ((this.dragging && this.dragging.moved()) ||
		         (this.boxZoom  && this.boxZoom.moved()))) ||
		            L.DomEvent._skipped(e)) { return; }

		this.fire('preclick');
		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this._loaded || L.DomEvent._skipped(e)) { return; }

		var type = e.type;

		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) { return; }

		if (type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}

		var containerPoint = this.mouseEventToContainerPoint(e),
		    layerPoint = this.containerPointToLayerPoint(containerPoint),
		    latlng = this.layerPointToLatLng(layerPoint);

		this.fire(type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});
	},

	_onTileLayerLoad: function () {
		this._tileLayersToLoad--;
		if (this._tileLayersNum && !this._tileLayersToLoad) {
			this.fire('tilelayersload');
		}
	},

	_clearHandlers: function () {
		for (var i = 0, len = this._handlers.length; i < len; i++) {
			this._handlers[i].disable();
		}
	},

	whenReady: function (callback, context) {
		if (this._loaded) {
			callback.call(context || this, this);
		} else {
			this.on('load', callback, context);
		}
		return this;
	},

	_layerAdd: function (layer) {
		layer.onAdd(this);
		this.fire('layeradd', {layer: layer});
	},


	// private methods for getting map state

	_getMapPanePos: function () {
		return L.DomUtil.getPosition(this._mapPane);
	},

	_moved: function () {
		var pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	},

	_getTopLeftPoint: function () {
		return this.getPixelOrigin().subtract(this._getMapPanePos());
	},

	_getNewTopLeftPoint: function (center, zoom) {
		var viewHalf = this.getSize()._divideBy(2);
		// TODO round on display, not calculation to increase precision?
		return this.project(center, zoom)._subtract(viewHalf)._round();
	},

	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {
		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());
		return this.project(latlng, newZoom)._subtract(topLeft);
	},

	// layer point of the current center
	_getCenterLayerPoint: function () {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	},

	// offset of the specified place to the current center in pixels
	_getCenterOffset: function (latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	},

	// adjust center for view to get inside bounds
	_limitCenter: function (center, zoom, bounds) {

		if (!bounds) { return center; }

		var centerPoint = this.project(center, zoom),
		    viewHalf = this.getSize().divideBy(2),
		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		return this.unproject(centerPoint.add(offset), zoom);
	},

	// adjust offset for view to get inside bounds
	_limitOffset: function (offset, bounds) {
		if (!bounds) { return offset; }

		var viewBounds = this.getPixelBounds(),
		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	},

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),
		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),

		    dx = this._rebound(nwOffset.x, -seOffset.x),
		    dy = this._rebound(nwOffset.y, -seOffset.y);

		return new L.Point(dx, dy);
	},

	_rebound: function (left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	},

	_limitZoom: function (zoom) {
		var min = this.getMinZoom(),
		    max = this.getMaxZoom();

		return Math.max(min, Math.min(max, zoom));
	}
});

L.map = function (id, options) {
	return new L.Map(id, options);
};


/*
 * Mercator projection that takes into account that the Earth is not a perfect sphere.
 * Less popular than spherical mercator; used by projections like EPSG:3395.
 */

L.Projection.Mercator = {
	MAX_LATITUDE: 85.0840591556,

	R_MINOR: 6356752.314245179,
	R_MAJOR: 6378137,

	project: function (latlng) { // (LatLng) -> Point
		var d = L.LatLng.DEG_TO_RAD,
		    max = this.MAX_LATITUDE,
		    lat = Math.max(Math.min(max, latlng.lat), -max),
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    x = latlng.lng * d * r,
		    y = lat * d,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1.0 - tmp * tmp),
		    con = eccent * Math.sin(y);

		con = Math.pow((1 - con) / (1 + con), eccent * 0.5);

		var ts = Math.tan(0.5 * ((Math.PI * 0.5) - y)) / con;
		y = -r * Math.log(ts);

		return new L.Point(x, y);
	},

	unproject: function (point) { // (Point, Boolean) -> LatLng
		var d = L.LatLng.RAD_TO_DEG,
		    r = this.R_MAJOR,
		    r2 = this.R_MINOR,
		    lng = point.x * d / r,
		    tmp = r2 / r,
		    eccent = Math.sqrt(1 - (tmp * tmp)),
		    ts = Math.exp(- point.y / r),
		    phi = (Math.PI / 2) - 2 * Math.atan(ts),
		    numIter = 15,
		    tol = 1e-7,
		    i = numIter,
		    dphi = 0.1,
		    con;

		while ((Math.abs(dphi) > tol) && (--i > 0)) {
			con = eccent * Math.sin(phi);
			dphi = (Math.PI / 2) - 2 * Math.atan(ts *
			            Math.pow((1.0 - con) / (1.0 + con), 0.5 * eccent)) - phi;
			phi += dphi;
		}

		return new L.LatLng(phi * d, lng);
	}
};



L.CRS.EPSG3395 = L.extend({}, L.CRS, {
	code: 'EPSG:3395',

	projection: L.Projection.Mercator,

	transformation: (function () {
		var m = L.Projection.Mercator,
		    r = m.R_MAJOR,
		    scale = 0.5 / (Math.PI * r);

		return new L.Transformation(scale, 0.5, -scale, 0.5);
	}())
});


/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.TileLayer = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		zoomOffset: 0,
		opacity: 1,
		/*
		maxNativeZoom: null,
		zIndex: null,
		tms: false,
		continuousWorld: false,
		noWrap: false,
		zoomReverse: false,
		detectRetina: false,
		reuseTiles: false,
		bounds: false,
		*/
		unloadInvisibleTiles: L.Browser.mobile,
		updateWhenIdle: L.Browser.mobile
	},

	initialize: function (url, options) {
		options = L.setOptions(this, options);

		// detecting retina displays, adjusting tileSize and zoom levels
		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {

			options.tileSize = Math.floor(options.tileSize / 2);
			options.zoomOffset++;

			if (options.minZoom > 0) {
				options.minZoom--;
			}
			this.options.maxZoom--;
		}

		if (options.bounds) {
			options.bounds = L.latLngBounds(options.bounds);
		}

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map) {
		this._map = map;
		this._animated = map._zoomAnimated;

		// create a container div for tiles
		this._initContainer();

		// set up events
		map.on({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.on({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		this._container.parentNode.removeChild(this._container);

		map.off({
			'viewreset': this._reset,
			'moveend': this._update
		}, this);

		if (this._animated) {
			map.off({
				'zoomanim': this._animateZoom,
				'zoomend': this._endZoomAnim
			}, this);
		}

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	bringToFront: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.appendChild(this._container);
			this._setAutoZIndex(pane, Math.max);
		}

		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.tilePane;

		if (this._container) {
			pane.insertBefore(this._container, pane.firstChild);
			this._setAutoZIndex(pane, Math.min);
		}

		return this;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	getContainer: function () {
		return this._container;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	setZIndex: function (zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();

		return this;
	},

	setUrl: function (url, noRedraw) {
		this._url = url;

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}
		return this;
	},

	_updateZIndex: function () {
		if (this._container && this.options.zIndex !== undefined) {
			this._container.style.zIndex = this.options.zIndex;
		}
	},

	_setAutoZIndex: function (pane, compare) {

		var layers = pane.children,
		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min
		    zIndex, i, len;

		for (i = 0, len = layers.length; i < len; i++) {

			if (layers[i] !== this._container) {
				zIndex = parseInt(layers[i].style.zIndex, 10);

				if (!isNaN(zIndex)) {
					edgeZIndex = compare(edgeZIndex, zIndex);
				}
			}
		}

		this.options.zIndex = this._container.style.zIndex =
		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
	},

	_updateOpacity: function () {
		var i,
		    tiles = this._tiles;

		if (L.Browser.ielt9) {
			for (i in tiles) {
				L.DomUtil.setOpacity(tiles[i], this.options.opacity);
			}
		} else {
			L.DomUtil.setOpacity(this._container, this.options.opacity);
		}
	},

	_initContainer: function () {
		var tilePane = this._map._panes.tilePane;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-layer');

			this._updateZIndex();

			if (this._animated) {
				var className = 'leaflet-tile-container';

				this._bgBuffer = L.DomUtil.create('div', className, this._container);
				this._tileContainer = L.DomUtil.create('div', className, this._container);

			} else {
				this._tileContainer = this._container;
			}

			tilePane.appendChild(this._container);

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_reset: function (e) {
		for (var key in this._tiles) {
			this.fire('tileunload', {tile: this._tiles[key]});
		}

		this._tiles = {};
		this._tilesToLoad = 0;

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		this._tileContainer.innerHTML = '';

		if (this._animated && e && e.hard) {
			this._clearBgBuffer();
		}

		this._initContainer();
	},

	_getTileSize: function () {
		var map = this._map,
		    zoom = map.getZoom() + this.options.zoomOffset,
		    zoomN = this.options.maxNativeZoom,
		    tileSize = this.options.tileSize;

		if (zoomN && zoom > zoomN) {
			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
		}

		return tileSize;
	},

	_update: function () {

		if (!this._map) { return; }

		var map = this._map,
		    bounds = map.getPixelBounds(),
		    zoom = map.getZoom(),
		    tileSize = this._getTileSize();

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var tileBounds = L.bounds(
		        bounds.min.divideBy(tileSize)._floor(),
		        bounds.max.divideBy(tileSize)._floor());

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
		    center = bounds.getCenter();

		var j, i, point;

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				point = new L.Point(i, j);

				if (this._tileShouldBeLoaded(point)) {
					queue.push(point);
				}
			}
		}

		var tilesToLoad = queue.length;

		if (tilesToLoad === 0) { return; }

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(queue[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (!options.continuousWorld) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
			    nwPoint = tilePoint.multiplyBy(tileSize),
			    sePoint = nwPoint.add([tileSize, tileSize]),
			    nw = this._map.unproject(nwPoint),
			    se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) { return false; }
		}

		return true;
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			x = parseInt(kArr[0], 10);
			y = parseInt(kArr[1], 10);

			// remove tile if it's out of bounds
			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
				this._removeTile(key);
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire('tileunload', {tile: tile, url: tile.src});

		if (this.options.reuseTiles) {
			L.DomUtil.removeClass(tile, 'leaflet-tile-loaded');
			this._unusedTiles.push(tile);

		} else if (tile.parentNode === this._tileContainer) {
			this._tileContainer.removeChild(tile);
		}

		// for https://github.com/CloudMade/Leaflet/issues/137
		if (!L.Browser.android) {
			tile.onload = null;
			tile.src = L.Util.emptyImageUrl;
		}

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint);

		// get unused tile - or create a new tile
		var tile = this._getTile();

		/*
		Chrome 20 layouts much faster with top/left (verify with timeline, frames)
		Android 4 browser has display issues with top/left and requires transform instead
		(other browsers don't currently care) - see debug/hacks/jitter.html for an example
		*/
		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},

	_getZoomForUrl: function () {

		var options = this.options,
		    zoom = this._map.getZoom();

		if (options.zoomReverse) {
			zoom = options.maxZoom - zoom;
		}

		zoom += options.zoomOffset;

		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
		    tileSize = this._getTileSize();

		return tilePoint.multiplyBy(tileSize).subtract(origin);
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (tilePoint) {
		return L.Util.template(this._url, L.extend({
			s: this._getSubdomain(tilePoint),
			z: tilePoint.z,
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_getWrapTileNum: function () {
		var crs = this._map.options.crs,
		    size = crs.getSize(this._map.getZoom());
		return size.divideBy(this._getTileSize())._floor();
	},

	_adjustTilePoint: function (tilePoint) {

		var limit = this._getWrapTileNum();

		// wrap tile coordinates
		if (!this.options.continuousWorld && !this.options.noWrap) {
			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
		}

		if (this.options.tms) {
			tilePoint.y = limit.y - tilePoint.y - 1;
		}

		tilePoint.z = this._getZoomForUrl();
	},

	_getSubdomain: function (tilePoint) {
		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	// Override if data stored on a tile needs to be cleaned up before reuse
	_resetTile: function (/*tile*/) {},

	_createTile: function () {
		var tile = L.DomUtil.create('img', 'leaflet-tile');
		tile.style.width = tile.style.height = this._getTileSize() + 'px';
		tile.galleryimg = 'no';

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		if (L.Browser.ielt9 && this.options.opacity !== undefined) {
			L.DomUtil.setOpacity(tile, this.options.opacity);
		}
		// without this hack, tiles disappear after zoom on Chrome for Android
		// https://github.com/Leaflet/Leaflet/issues/2078
		if (L.Browser.mobileWebkit3d) {
			tile.style.WebkitBackfaceVisibility = 'hidden';
		}
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(tilePoint);

		this.fire('tileloadstart', {
			tile: tile,
			url: tile.src
		});
	},

	_tileLoaded: function () {
		this._tilesToLoad--;

		if (this._animated) {
			L.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');
		}

		if (!this._tilesToLoad) {
			this.fire('load');

			if (this._animated) {
				// clear scaled tiles after all new tiles are loaded (for performance)
				clearTimeout(this._clearBgBufferTimer);
				this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);
			}
		}
	},

	_tileOnLoad: function () {
		var layer = this._layer;

		//Only if we are loading an actual image
		if (this.src !== L.Util.emptyImageUrl) {
			L.DomUtil.addClass(this, 'leaflet-tile-loaded');

			layer.fire('tileload', {
				tile: this,
				url: this.src
			});
		}

		layer._tileLoaded();
	},

	_tileOnError: function () {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}

		layer._tileLoaded();
	}
});

L.tileLayer = function (url, options) {
	return new L.TileLayer(url, options);
};


/*
 * L.TileLayer.WMS is used for putting WMS tile layers on the map.
 */

L.TileLayer.WMS = L.TileLayer.extend({

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/jpeg',
		transparent: false
	},

	initialize: function (url, options) { // (String, Object)

		this._url = url;

		var wmsParams = L.extend({}, this.defaultWmsParams),
		    tileSize = options.tileSize || this.options.tileSize;

		if (options.detectRetina && L.Browser.retina) {
			wmsParams.width = wmsParams.height = tileSize * 2;
		} else {
			wmsParams.width = wmsParams.height = tileSize;
		}

		for (var i in options) {
			// all keys that are not TileLayer options go to WMS params
			if (!this.options.hasOwnProperty(i) && i !== 'crs') {
				wmsParams[i] = options[i];
			}
		}

		this.wmsParams = wmsParams;

		L.setOptions(this, options);
	},

	onAdd: function (map) {

		this._crs = this.options.crs || map.options.crs;

		this._wmsVersion = parseFloat(this.wmsParams.version);

		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;

		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (tilePoint) { // (Point, Number) -> String

		var map = this._map,
		    tileSize = this.options.tileSize,

		    nwPoint = tilePoint.multiplyBy(tileSize),
		    sePoint = nwPoint.add([tileSize, tileSize]),

		    nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),
		    se = this._crs.project(map.unproject(sePoint, tilePoint.z)),
		    bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?
		        [se.y, nw.x, nw.y, se.x].join(',') :
		        [nw.x, se.y, se.x, nw.y].join(','),

		    url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

		return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
	},

	setParams: function (params, noRedraw) {

		L.extend(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
});

L.tileLayer.wms = function (url, options) {
	return new L.TileLayer.WMS(url, options);
};


/*
 * L.TileLayer.Canvas is a class that you can use as a base for creating
 * dynamically drawn Canvas-based tile layers.
 */

L.TileLayer.Canvas = L.TileLayer.extend({
	options: {
		async: false
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	redraw: function () {
		if (this._map) {
			this._reset({hard: true});
			this._update();
		}

		for (var i in this._tiles) {
			this._redrawTile(this._tiles[i]);
		}
		return this;
	},

	_redrawTile: function (tile) {
		this.drawTile(tile, tile._tilePoint, this._map._zoom);
	},

	_createTile: function () {
		var tile = L.DomUtil.create('canvas', 'leaflet-tile');
		tile.width = tile.height = this.options.tileSize;
		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
		return tile;
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer = this;
		tile._tilePoint = tilePoint;

		this._redrawTile(tile);

		if (!this.options.async) {
			this.tileDrawn(tile);
		}
	},

	drawTile: function (/*tile, tilePoint*/) {
		// override with rendering code
	},

	tileDrawn: function (tile) {
		this._tileOnLoad.call(tile);
	}
});


L.tileLayer.canvas = function (options) {
	return new L.TileLayer.Canvas(options);
};


/*
 * L.ImageOverlay is used to overlay images over the map (to specific geographical bounds).
 */

L.ImageOverlay = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		opacity: 1
	},

	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)
		this._url = url;
		this._bounds = L.latLngBounds(bounds);

		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._image) {
			this._initImage();
		}

		map._panes.overlayPane.appendChild(this._image);

		map.on('viewreset', this._reset, this);

		if (map.options.zoomAnimation && L.Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._reset();
	},

	onRemove: function (map) {
		map.getPanes().overlayPane.removeChild(this._image);

		map.off('viewreset', this._reset, this);

		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path
	bringToFront: function () {
		if (this._image) {
			this._map._panes.overlayPane.appendChild(this._image);
		}
		return this;
	},

	bringToBack: function () {
		var pane = this._map._panes.overlayPane;
		if (this._image) {
			pane.insertBefore(this._image, pane.firstChild);
		}
		return this;
	},

	setUrl: function (url) {
		this._url = url;
		this._image.src = this._url;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	_initImage: function () {
		this._image = L.DomUtil.create('img', 'leaflet-image-layer');

		if (this._map.options.zoomAnimation && L.Browser.any3d) {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		L.extend(this._image, {
			galleryimg: 'no',
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onImageLoad, this),
			src: this._url
		});
	},

	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

		image.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},

	_reset: function () {
		var image   = this._image,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);

		L.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

	_onImageLoad: function () {
		this.fire('load');
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

L.imageOverlay = function (url, bounds, options) {
	return new L.ImageOverlay(url, bounds, options);
};


/*
 * L.Icon is an image-based icon class that you can use with L.Marker for custom markers.
 */

L.Icon = L.Class.extend({
	options: {
		/*
		iconUrl: (String) (required)
		iconRetinaUrl: (String) (optional, used for retina devices if detected)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (String) (no shadow by default)
		shadowRetinaUrl: (String) (optional, used for retina devices if detected)
		shadowSize: (Point)
		shadowAnchor: (Point)
		*/
		className: ''
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	createIcon: function (oldIcon) {
		return this._createIcon('icon', oldIcon);
	},

	createShadow: function (oldIcon) {
		return this._createIcon('shadow', oldIcon);
	},

	_createIcon: function (name, oldIcon) {
		var src = this._getIconUrl(name);

		if (!src) {
			if (name === 'icon') {
				throw new Error('iconUrl not set in Icon options (see the docs).');
			}
			return null;
		}

		var img;
		if (!oldIcon || oldIcon.tagName !== 'IMG') {
			img = this._createImg(src);
		} else {
			img = this._createImg(src, oldIcon);
		}
		this._setIconStyles(img, name);

		return img;
	},

	_setIconStyles: function (img, name) {
		var options = this.options,
		    size = L.point(options[name + 'Size']),
		    anchor;

		if (name === 'shadow') {
			anchor = L.point(options.shadowAnchor || options.iconAnchor);
		} else {
			anchor = L.point(options.iconAnchor);
		}

		if (!anchor && size) {
			anchor = size.divideBy(2, true);
		}

		img.className = 'leaflet-marker-' + name + ' ' + options.className;

		if (anchor) {
			img.style.marginLeft = (-anchor.x) + 'px';
			img.style.marginTop  = (-anchor.y) + 'px';
		}

		if (size) {
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}
	},

	_createImg: function (src, el) {
		el = el || document.createElement('img');
		el.src = src;
		return el;
	},

	_getIconUrl: function (name) {
		if (L.Browser.retina && this.options[name + 'RetinaUrl']) {
			return this.options[name + 'RetinaUrl'];
		}
		return this.options[name + 'Url'];
	}
});

L.icon = function (options) {
	return new L.Icon(options);
};


/*
 * L.Icon.Default is the blue marker icon used by default in Leaflet.
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (L.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = L.Icon.Default.imagePath;

		if (!path) {
			throw new Error('Couldn\'t autodetect L.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

L.Icon.Default.imagePath = (function () {
	var scripts = document.getElementsByTagName('script'),
	    leafletRe = /[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}());


/*
 * L.Marker is used to display clickable/draggable icons on the map.
 */

L.Marker = L.Class.extend({

	includes: L.Mixin.Events,

	options: {
		icon: new L.Icon.Default(),
		title: '',
		alt: '',
		clickable: true,
		draggable: false,
		keyboard: true,
		zIndexOffset: 0,
		opacity: 1,
		riseOnHover: false,
		riseOffset: 250
	},

	initialize: function (latlng, options) {
		L.setOptions(this, options);
		this._latlng = L.latLng(latlng);
	},

	onAdd: function (map) {
		this._map = map;

		map.on('viewreset', this.update, this);

		this._initIcon();
		this.update();
		this.fire('add');

		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {
			map.on('zoomanim', this._animateZoom, this);
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		if (this.dragging) {
			this.dragging.disable();
		}

		this._removeIcon();
		this._removeShadow();

		this.fire('remove');

		map.off({
			'viewreset': this.update,
			'zoomanim': this._animateZoom
		}, this);

		this._map = null;
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);

		this.update();

		return this.fire('move', { latlng: this._latlng });
	},

	setZIndexOffset: function (offset) {
		this.options.zIndexOffset = offset;
		this.update();

		return this;
	},

	setIcon: function (icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup);
		}

		return this;
	},

	update: function () {
		if (this._icon) {
			var pos = this._map.latLngToLayerPoint(this._latlng).round();
			this._setPos(pos);
		}

		return this;
	},

	_initIcon: function () {
		var options = this.options,
		    map = this._map,
		    animation = (map.options.zoomAnimation && map.options.markerZoomAnimation),
		    classToAdd = animation ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide';

		var icon = options.icon.createIcon(this._icon),
			addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}
			
			if (options.alt) {
				icon.alt = options.alt;
			}
		}

		L.DomUtil.addClass(icon, classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
		}

		this._icon = icon;

		this._initInteraction();

		if (options.riseOnHover) {
			L.DomEvent
				.on(icon, 'mouseover', this._bringToFront, this)
				.on(icon, 'mouseout', this._resetZIndex, this);
		}

		var newShadow = options.icon.createShadow(this._shadow),
			addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			L.DomUtil.addClass(newShadow, classToAdd);
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		var panes = this._map._panes;

		if (addIcon) {
			panes.markerPane.appendChild(this._icon);
		}

		if (newShadow && addShadow) {
			panes.shadowPane.appendChild(this._shadow);
		}
	},

	_removeIcon: function () {
		if (this.options.riseOnHover) {
			L.DomEvent
			    .off(this._icon, 'mouseover', this._bringToFront)
			    .off(this._icon, 'mouseout', this._resetZIndex);
		}

		this._map._panes.markerPane.removeChild(this._icon);

		this._icon = null;
	},

	_removeShadow: function () {
		if (this._shadow) {
			this._map._panes.shadowPane.removeChild(this._shadow);
		}
		this._shadow = null;
	},

	_setPos: function (pos) {
		L.DomUtil.setPosition(this._icon, pos);

		if (this._shadow) {
			L.DomUtil.setPosition(this._shadow, pos);
		}

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	},

	_updateZIndex: function (offset) {
		this._icon.style.zIndex = this._zIndex + offset;
	},

	_animateZoom: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	},

	_initInteraction: function () {

		if (!this.options.clickable) { return; }

		// TODO refactor into something shared with Map/Path/etc. to DRY it up

		var icon = this._icon,
		    events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];

		L.DomUtil.addClass(icon, 'leaflet-clickable');
		L.DomEvent.on(icon, 'click', this._onMouseClick, this);
		L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);

		for (var i = 0; i < events.length; i++) {
			L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);
		}

		if (L.Handler.MarkerDrag) {
			this.dragging = new L.Handler.MarkerDrag(this);

			if (this.options.draggable) {
				this.dragging.enable();
			}
		}
	},

	_onMouseClick: function (e) {
		var wasDragged = this.dragging && this.dragging.moved();

		if (this.hasEventListeners(e.type) || wasDragged) {
			L.DomEvent.stopPropagation(e);
		}

		if (wasDragged) { return; }

		if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) { return; }

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});
	},

	_onKeyPress: function (e) {
		if (e.keyCode === 13) {
			this.fire('click', {
				originalEvent: e,
				latlng: this._latlng
			});
		}
	},

	_fireMouseEvent: function (e) {

		this.fire(e.type, {
			originalEvent: e,
			latlng: this._latlng
		});

		// TODO proper custom event propagation
		// this line will always be called if marker is in a FeatureGroup
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._icon, this.options.opacity);
		if (this._shadow) {
			L.DomUtil.setOpacity(this._shadow, this.options.opacity);
		}
	},

	_bringToFront: function () {
		this._updateZIndex(this.options.riseOffset);
	},

	_resetZIndex: function () {
		this._updateZIndex(0);
	}
});

L.marker = function (latlng, options) {
	return new L.Marker(latlng, options);
};


/*
 * L.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based L.Icon)
 * to use with L.Marker.
 */

L.DivIcon = L.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		if (options.html !== false) {
			div.innerHTML = options.html;
		} else {
			div.innerHTML = '';
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
			        (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};


/*
 * L.Popup is used for displaying popups on the map.
 */

L.Map.mergeOptions({
	closePopupOnClick: true
});

L.Popup = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minWidth: 50,
		maxWidth: 300,
		// maxHeight: null,
		autoPan: true,
		closeButton: true,
		offset: [0, 7],
		autoPanPadding: [5, 5],
		// autoPanPaddingTopLeft: null,
		// autoPanPaddingBottomRight: null,
		keepInView: false,
		className: '',
		zoomAnimation: true
	},

	initialize: function (options, source) {
		L.setOptions(this, options);

		this._source = source;
		this._animated = L.Browser.any3d && this.options.zoomAnimation;
		this._isOpen = false;
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initLayout();
		}

		var animFade = map.options.fadeAnimation;

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 0);
		}
		map._panes.popupPane.appendChild(this._container);

		map.on(this._getEvents(), this);

		this.update();

		if (animFade) {
			L.DomUtil.setOpacity(this._container, 1);
		}

		this.fire('open');

		map.fire('popupopen', {popup: this});

		if (this._source) {
			this._source.fire('popupopen', {popup: this});
		}
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	openOn: function (map) {
		map.openPopup(this);
		return this;
	},

	onRemove: function (map) {
		map._panes.popupPane.removeChild(this._container);

		L.Util.falseFn(this._container.offsetWidth); // force reflow

		map.off(this._getEvents(), this);

		if (map.options.fadeAnimation) {
			L.DomUtil.setOpacity(this._container, 0);
		}

		this._map = null;

		this.fire('close');

		map.fire('popupclose', {popup: this});

		if (this._source) {
			this._source.fire('popupclose', {popup: this});
		}
	},

	getLatLng: function () {
		return this._latlng;
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	},

	getContent: function () {
		return this._content;
	},

	setContent: function (content) {
		this._content = content;
		this.update();
		return this;
	},

	update: function () {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	},

	_getEvents: function () {
		var events = {
			viewreset: this._updatePosition
		};

		if (this._animated) {
			events.zoomanim = this._zoomAnimation;
		}
		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
			events.preclick = this._close;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}

		return events;
	},

	_close: function () {
		if (this._map) {
			this._map.closePopup(this);
		}
	},

	_initLayout: function () {
		var prefix = 'leaflet-popup',
			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +
			        (this._animated ? 'animated' : 'hide'),
			container = this._container = L.DomUtil.create('div', containerClass),
			closeButton;

		if (this.options.closeButton) {
			closeButton = this._closeButton =
			        L.DomUtil.create('a', prefix + '-close-button', container);
			closeButton.href = '#close';
			closeButton.innerHTML = '&#215;';
			L.DomEvent.disableClickPropagation(closeButton);

			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
		}

		var wrapper = this._wrapper =
		        L.DomUtil.create('div', prefix + '-content-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);

		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);

		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
	},

	_updateContent: function () {
		if (!this._content) { return; }

		if (typeof this._content === 'string') {
			this._contentNode.innerHTML = this._content;
		} else {
			while (this._contentNode.hasChildNodes()) {
				this._contentNode.removeChild(this._contentNode.firstChild);
			}
			this._contentNode.appendChild(this._content);
		}
		this.fire('contentupdate');
	},

	_updateLayout: function () {
		var container = this._contentNode,
		    style = container.style;

		style.width = '';
		style.whiteSpace = 'nowrap';

		var width = container.offsetWidth;
		width = Math.min(width, this.options.maxWidth);
		width = Math.max(width, this.options.minWidth);

		style.width = (width + 1) + 'px';
		style.whiteSpace = '';

		style.height = '';

		var height = container.offsetHeight,
		    maxHeight = this.options.maxHeight,
		    scrolledClass = 'leaflet-popup-scrolled';

		if (maxHeight && height > maxHeight) {
			style.height = maxHeight + 'px';
			L.DomUtil.addClass(container, scrolledClass);
		} else {
			L.DomUtil.removeClass(container, scrolledClass);
		}

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function () {
		if (!this._map) { return; }

		var pos = this._map.latLngToLayerPoint(this._latlng),
		    animated = this._animated,
		    offset = L.point(this.options.offset);

		if (animated) {
			L.DomUtil.setPosition(this._container, pos);
		}

		this._containerBottom = -offset.y - (animated ? 0 : pos.y);
		this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);

		// bottom position the popup in case the height of the popup changes (images loading etc)
		this._container.style.bottom = this._containerBottom + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},

	_zoomAnimation: function (opt) {
		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);

		L.DomUtil.setPosition(this._container, pos);
	},

	_adjustPan: function () {
		if (!this.options.autoPan) { return; }

		var map = this._map,
		    containerHeight = this._container.offsetHeight,
		    containerWidth = this._containerWidth,

		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);

		if (this._animated) {
			layerPos._add(L.DomUtil.getPosition(this._container));
		}

		var containerPos = map.layerPointToContainerPoint(layerPos),
		    padding = L.point(this.options.autoPanPadding),
		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
		    size = map.getSize(),
		    dx = 0,
		    dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		if (dx || dy) {
			map
			    .fire('autopanstart')
			    .panBy([dx, dy]);
		}
	},

	_onCloseButtonClick: function (e) {
		this._close();
		L.DomEvent.stop(e);
	}
});

L.popup = function (options, source) {
	return new L.Popup(options, source);
};


L.Map.include({
	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])
		this.closePopup();

		if (!(popup instanceof L.Popup)) {
			var content = popup;

			popup = new L.Popup(options)
			    .setLatLng(latlng)
			    .setContent(content);
		}
		popup._isOpen = true;

		this._popup = popup;
		return this.addLayer(popup);
	},

	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		if (popup) {
			this.removeLayer(popup);
			popup._isOpen = false;
		}
		return this;
	}
});


/*
 * Popup extension to L.Marker, adding popup-related methods.
 */

L.Marker.include({
	openPopup: function () {
		if (this._popup && this._map && !this._map.hasLayer(this._popup)) {
			this._popup.setLatLng(this._latlng);
			this._map.openPopup(this._popup);
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	togglePopup: function () {
		if (this._popup) {
			if (this._popup._isOpen) {
				this.closePopup();
			} else {
				this.openPopup();
			}
		}
		return this;
	},

	bindPopup: function (content, options) {
		var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]);

		anchor = anchor.add(L.Popup.prototype.options.offset);

		if (options && options.offset) {
			anchor = anchor.add(options.offset);
		}

		options = L.extend({offset: anchor}, options);

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this.togglePopup, this)
			    .on('remove', this.closePopup, this)
			    .on('move', this._movePopup, this);
			this._popupHandlersAdded = true;
		}

		if (content instanceof L.Popup) {
			L.setOptions(content, options);
			this._popup = content;
		} else {
			this._popup = new L.Popup(options, this)
				.setContent(content);
		}

		return this;
	},

	setPopupContent: function (content) {
		if (this._popup) {
			this._popup.setContent(content);
		}
		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this.togglePopup, this)
			    .off('remove', this.closePopup, this)
			    .off('move', this._movePopup, this);
			this._popupHandlersAdded = false;
		}
		return this;
	},

	getPopup: function () {
		return this._popup;
	},

	_movePopup: function (e) {
		this._popup.setLatLng(e.latlng);
	}
});


/*
 * L.LayerGroup is a class to combine several layers into one so that
 * you can manipulate the group (e.g. add/remove it) as one layer.
 */

L.LayerGroup = L.Class.extend({
	initialize: function (layers) {
		this._layers = {};

		var i, len;

		if (layers) {
			for (i = 0, len = layers.length; i < len; i++) {
				this.addLayer(layers[i]);
			}
		}
	},

	addLayer: function (layer) {
		var id = this.getLayerId(layer);

		this._layers[id] = layer;

		if (this._map) {
			this._map.addLayer(layer);
		}

		return this;
	},

	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	hasLayer: function (layer) {
		if (!layer) { return false; }

		return (layer in this._layers || this.getLayerId(layer) in this._layers);
	},

	clearLayers: function () {
		this.eachLayer(this.removeLayer, this);
		return this;
	},

	invoke: function (methodName) {
		var args = Array.prototype.slice.call(arguments, 1),
		    i, layer;

		for (i in this._layers) {
			layer = this._layers[i];

			if (layer[methodName]) {
				layer[methodName].apply(layer, args);
			}
		}

		return this;
	},

	onAdd: function (map) {
		this._map = map;
		this.eachLayer(map.addLayer, map);
	},

	onRemove: function (map) {
		this.eachLayer(map.removeLayer, map);
		this._map = null;
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	eachLayer: function (method, context) {
		for (var i in this._layers) {
			method.call(context, this._layers[i]);
		}
		return this;
	},

	getLayer: function (id) {
		return this._layers[id];
	},

	getLayers: function () {
		var layers = [];

		for (var i in this._layers) {
			layers.push(this._layers[i]);
		}
		return layers;
	},

	setZIndex: function (zIndex) {
		return this.invoke('setZIndex', zIndex);
	},

	getLayerId: function (layer) {
		return L.stamp(layer);
	}
});

L.layerGroup = function (layers) {
	return new L.LayerGroup(layers);
};


/*
 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and additional methods
 * shared between a group of interactive layers (like vectors or markers).
 */

L.FeatureGroup = L.LayerGroup.extend({
	includes: L.Mixin.Events,

	statics: {
		EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose'
	},

	addLayer: function (layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		if ('on' in layer) {
			layer.on(L.FeatureGroup.EVENTS, this._propagateEvent, this);
		}

		L.LayerGroup.prototype.addLayer.call(this, layer);

		if (this._popupContent && layer.bindPopup) {
			layer.bindPopup(this._popupContent, this._popupOptions);
		}

		return this.fire('layeradd', {layer: layer});
	},

	removeLayer: function (layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.off(L.FeatureGroup.EVENTS, this._propagateEvent, this);

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		if (this._popupContent) {
			this.invoke('unbindPopup');
		}

		return this.fire('layerremove', {layer: layer});
	},

	bindPopup: function (content, options) {
		this._popupContent = content;
		this._popupOptions = options;
		return this.invoke('bindPopup', content, options);
	},

	openPopup: function (latlng) {
		// open popup on the first layer
		for (var id in this._layers) {
			this._layers[id].openPopup(latlng);
			break;
		}
		return this;
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new L.LatLngBounds();

		this.eachLayer(function (layer) {
			bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());
		});

		return bounds;
	},

	_propagateEvent: function (e) {
		e = L.extend({
			layer: e.target,
			target: this
		}, e);
		this.fire(e.type, e);
	}
});

L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};


/*
 * L.Path is a base class for rendering vector paths on a map. Inherited by Polyline, Circle, etc.
 */

L.Path = L.Class.extend({
	includes: [L.Mixin.Events],

	statics: {
		// how much to extend the clip area around the map view
		// (relative to its size, e.g. 0.5 is half the screen in each direction)
		// set it so that SVG element doesn't exceed 1280px (vectors flicker on dragend if it is)
		CLIP_PADDING: (function () {
			var max = L.Browser.mobile ? 1280 : 2000,
			    target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;
			return Math.max(0, Math.min(0.5, target));
		})()
	},

	options: {
		stroke: true,
		color: '#0033ff',
		dashArray: null,
		lineCap: null,
		lineJoin: null,
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2,

		clickable: true
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initElements();
			this._initEvents();
		}

		this.projectLatlngs();
		this._updatePath();

		if (this._container) {
			this._map._pathRoot.appendChild(this._container);
		}

		this.fire('add');

		map.on({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	onRemove: function (map) {
		map._pathRoot.removeChild(this._container);

		// Need to fire remove event before we set _map to null as the event hooks might need the object
		this.fire('remove');
		this._map = null;

		if (L.Browser.vml) {
			this._container = null;
			this._stroke = null;
			this._fill = null;
		}

		map.off({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath
		}, this);
	},

	projectLatlngs: function () {
		// do all projection stuff here
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._container) {
			this._updateStyle();
		}

		return this;
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._updatePath();
		}
		return this;
	}
});

L.Map.include({
	_updatePathViewport: function () {
		var p = L.Path.CLIP_PADDING,
		    size = this.getSize(),
		    panePos = L.DomUtil.getPosition(this._mapPane),
		    min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()),
		    max = min.add(size.multiplyBy(1 + p * 2)._round());

		this._pathViewport = new L.Bounds(min, max);
	}
});


/*
 * Extends L.Path with SVG-specific rendering code.
 */

L.Path.SVG_NS = 'http://www.w3.org/2000/svg';

L.Browser.svg = !!(document.createElementNS && document.createElementNS(L.Path.SVG_NS, 'svg').createSVGRect);

L.Path = L.Path.extend({
	statics: {
		SVG: L.Browser.svg
	},

	bringToFront: function () {
		var root = this._map._pathRoot,
		    path = this._container;

		if (path && root.lastChild !== path) {
			root.appendChild(path);
		}
		return this;
	},

	bringToBack: function () {
		var root = this._map._pathRoot,
		    path = this._container,
		    first = root.firstChild;

		if (path && first !== path) {
			root.insertBefore(path, first);
		}
		return this;
	},

	getPathString: function () {
		// form path string here
	},

	_createElement: function (name) {
		return document.createElementNS(L.Path.SVG_NS, name);
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._initPath();
		this._initStyle();
	},

	_initPath: function () {
		this._container = this._createElement('g');

		this._path = this._createElement('path');

		if (this.options.className) {
			L.DomUtil.addClass(this._path, this.options.className);
		}

		this._container.appendChild(this._path);
	},

	_initStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke-linejoin', 'round');
			this._path.setAttribute('stroke-linecap', 'round');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill-rule', 'evenodd');
		}
		if (this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', this.options.pointerEvents);
		}
		if (!this.options.clickable && !this.options.pointerEvents) {
			this._path.setAttribute('pointer-events', 'none');
		}
		this._updateStyle();
	},

	_updateStyle: function () {
		if (this.options.stroke) {
			this._path.setAttribute('stroke', this.options.color);
			this._path.setAttribute('stroke-opacity', this.options.opacity);
			this._path.setAttribute('stroke-width', this.options.weight);
			if (this.options.dashArray) {
				this._path.setAttribute('stroke-dasharray', this.options.dashArray);
			} else {
				this._path.removeAttribute('stroke-dasharray');
			}
			if (this.options.lineCap) {
				this._path.setAttribute('stroke-linecap', this.options.lineCap);
			}
			if (this.options.lineJoin) {
				this._path.setAttribute('stroke-linejoin', this.options.lineJoin);
			}
		} else {
			this._path.setAttribute('stroke', 'none');
		}
		if (this.options.fill) {
			this._path.setAttribute('fill', this.options.fillColor || this.options.color);
			this._path.setAttribute('fill-opacity', this.options.fillOpacity);
		} else {
			this._path.setAttribute('fill', 'none');
		}
	},

	_updatePath: function () {
		var str = this.getPathString();
		if (!str) {
			// fix webkit empty string parsing bug
			str = 'M0 0';
		}
		this._path.setAttribute('d', str);
	},

	// TODO remove duplication with L.Map
	_initEvents: function () {
		if (this.options.clickable) {
			if (L.Browser.svg || !L.Browser.vml) {
				L.DomUtil.addClass(this._path, 'leaflet-clickable');
			}

			L.DomEvent.on(this._container, 'click', this._onMouseClick, this);

			var events = ['dblclick', 'mousedown', 'mouseover',
			              'mouseout', 'mousemove', 'contextmenu'];
			for (var i = 0; i < events.length; i++) {
				L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);
			}
		}
	},

	_onMouseClick: function (e) {
		if (this._map.dragging && this._map.dragging.moved()) { return; }

		this._fireMouseEvent(e);
	},

	_fireMouseEvent: function (e) {
		if (!this.hasEventListeners(e.type)) { return; }

		var map = this._map,
		    containerPoint = map.mouseEventToContainerPoint(e),
		    layerPoint = map.containerPointToLayerPoint(containerPoint),
		    latlng = map.layerPointToLatLng(layerPoint);

		this.fire(e.type, {
			latlng: latlng,
			layerPoint: layerPoint,
			containerPoint: containerPoint,
			originalEvent: e
		});

		if (e.type === 'contextmenu') {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousemove') {
			L.DomEvent.stopPropagation(e);
		}
	}
});

L.Map.include({
	_initPathRoot: function () {
		if (!this._pathRoot) {
			this._pathRoot = L.Path.prototype._createElement('svg');
			this._panes.overlayPane.appendChild(this._pathRoot);

			if (this.options.zoomAnimation && L.Browser.any3d) {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-animated');

				this.on({
					'zoomanim': this._animatePathZoom,
					'zoomend': this._endPathZoom
				});
			} else {
				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-hide');
			}

			this.on('moveend', this._updateSvgViewport);
			this._updateSvgViewport();
		}
	},

	_animatePathZoom: function (e) {
		var scale = this.getZoomScale(e.zoom),
		    offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);

		this._pathRoot.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';

		this._pathZooming = true;
	},

	_endPathZoom: function () {
		this._pathZooming = false;
	},

	_updateSvgViewport: function () {

		if (this._pathZooming) {
			// Do not update SVGs while a zoom animation is going on otherwise the animation will break.
			// When the zoom animation ends we will be updated again anyway
			// This fixes the case where you do a momentum move and zoom while the move is still ongoing.
			return;
		}

		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    max = vp.max,
		    width = max.x - min.x,
		    height = max.y - min.y,
		    root = this._pathRoot,
		    pane = this._panes.overlayPane;

		// Hack to make flicker on drag end on mobile webkit less irritating
		if (L.Browser.mobileWebkit) {
			pane.removeChild(root);
		}

		L.DomUtil.setPosition(root, min);
		root.setAttribute('width', width);
		root.setAttribute('height', height);
		root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));

		if (L.Browser.mobileWebkit) {
			pane.appendChild(root);
		}
	}
});


/*
 * Popup extension to L.Path (polylines, polygons, circles), adding popup-related methods.
 */

L.Path.include({

	bindPopup: function (content, options) {

		if (content instanceof L.Popup) {
			this._popup = content;
		} else {
			if (!this._popup || options) {
				this._popup = new L.Popup(options, this);
			}
			this._popup.setContent(content);
		}

		if (!this._popupHandlersAdded) {
			this
			    .on('click', this._openPopup, this)
			    .on('remove', this.closePopup, this);

			this._popupHandlersAdded = true;
		}

		return this;
	},

	unbindPopup: function () {
		if (this._popup) {
			this._popup = null;
			this
			    .off('click', this._openPopup)
			    .off('remove', this.closePopup);

			this._popupHandlersAdded = false;
		}
		return this;
	},

	openPopup: function (latlng) {

		if (this._popup) {
			// open the popup from one of the path's points if not specified
			latlng = latlng || this._latlng ||
			         this._latlngs[Math.floor(this._latlngs.length / 2)];

			this._openPopup({latlng: latlng});
		}

		return this;
	},

	closePopup: function () {
		if (this._popup) {
			this._popup._close();
		}
		return this;
	},

	_openPopup: function (e) {
		this._popup.setLatLng(e.latlng);
		this._map.openPopup(this._popup);
	}
});


/*
 * Vector rendering for IE6-8 through VML.
 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!
 */

L.Browser.vml = !L.Browser.svg && (function () {
	try {
		var div = document.createElement('div');
		div.innerHTML = '<v:shape adj="1"/>';

		var shape = div.firstChild;
		shape.style.behavior = 'url(#default#VML)';

		return shape && (typeof shape.adj === 'object');

	} catch (e) {
		return false;
	}
}());

L.Path = L.Browser.svg || !L.Browser.vml ? L.Path : L.Path.extend({
	statics: {
		VML: true,
		CLIP_PADDING: 0.02
	},

	_createElement: (function () {
		try {
			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');
			return function (name) {
				return document.createElement('<lvml:' + name + ' class="lvml">');
			};
		} catch (e) {
			return function (name) {
				return document.createElement(
				        '<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
			};
		}
	}()),

	_initPath: function () {
		var container = this._container = this._createElement('shape');

		L.DomUtil.addClass(container, 'leaflet-vml-shape' +
			(this.options.className ? ' ' + this.options.className : ''));

		if (this.options.clickable) {
			L.DomUtil.addClass(container, 'leaflet-clickable');
		}

		container.coordsize = '1 1';

		this._path = this._createElement('path');
		container.appendChild(this._path);

		this._map._pathRoot.appendChild(container);
	},

	_initStyle: function () {
		this._updateStyle();
	},

	_updateStyle: function () {
		var stroke = this._stroke,
		    fill = this._fill,
		    options = this.options,
		    container = this._container;

		container.stroked = options.stroke;
		container.filled = options.fill;

		if (options.stroke) {
			if (!stroke) {
				stroke = this._stroke = this._createElement('stroke');
				stroke.endcap = 'round';
				container.appendChild(stroke);
			}
			stroke.weight = options.weight + 'px';
			stroke.color = options.color;
			stroke.opacity = options.opacity;

			if (options.dashArray) {
				stroke.dashStyle = L.Util.isArray(options.dashArray) ?
				    options.dashArray.join(' ') :
				    options.dashArray.replace(/( *, *)/g, ' ');
			} else {
				stroke.dashStyle = '';
			}
			if (options.lineCap) {
				stroke.endcap = options.lineCap.replace('butt', 'flat');
			}
			if (options.lineJoin) {
				stroke.joinstyle = options.lineJoin;
			}

		} else if (stroke) {
			container.removeChild(stroke);
			this._stroke = null;
		}

		if (options.fill) {
			if (!fill) {
				fill = this._fill = this._createElement('fill');
				container.appendChild(fill);
			}
			fill.color = options.fillColor || options.color;
			fill.opacity = options.fillOpacity;

		} else if (fill) {
			container.removeChild(fill);
			this._fill = null;
		}
	},

	_updatePath: function () {
		var style = this._container.style;

		style.display = 'none';
		this._path.v = this.getPathString() + ' '; // the space fixes IE empty path string bug
		style.display = '';
	}
});

L.Map.include(L.Browser.svg || !L.Browser.vml ? {} : {
	_initPathRoot: function () {
		if (this._pathRoot) { return; }

		var root = this._pathRoot = document.createElement('div');
		root.className = 'leaflet-vml-container';
		this._panes.overlayPane.appendChild(root);

		this.on('moveend', this._updatePathViewport);
		this._updatePathViewport();
	}
});


/*
 * Vector rendering for all browsers that support canvas.
 */

L.Browser.canvas = (function () {
	return !!document.createElement('canvas').getContext;
}());

L.Path = (L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? L.Path : L.Path.extend({
	statics: {
		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value
		CANVAS: true,
		SVG: false
	},

	redraw: function () {
		if (this._map) {
			this.projectLatlngs();
			this._requestUpdate();
		}
		return this;
	},

	setStyle: function (style) {
		L.setOptions(this, style);

		if (this._map) {
			this._updateStyle();
			this._requestUpdate();
		}
		return this;
	},

	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initElements();
			this._initEvents();
		}

		this.projectLatlngs();
		this._updatePath();

		if (this._container) {
			this._map._pathRoot.appendChild(this._container);
		}

		this.fire('add');

		map.on({
			'viewreset': this.projectLatlngs,
			'moveend': this._updatePath,
			'canvasredraw': this._updatePath
		}, this);
	},

	onRemove: function (map) {
		map
		    .off('viewreset', this.projectLatlngs, this)
		    .off('moveend', this._updatePath, this)
		    .off('canvasredraw', this._updatePath, this);

		if (this.options.clickable) {
			this._map.off('click', this._onClick, this);
			this._map.off('mousemove', this._onMouseMove, this);
		}

		this._requestUpdate();
		
		this.fire('remove');
		this._map = null;
	},

	_requestUpdate: function () {
		if (this._map && !L.Path._updateRequest) {
			L.Path._updateRequest = L.Util.requestAnimFrame(this._fireCanvasRedraw, this._map);
		}
	},

	_fireCanvasRedraw: function () {
		L.Path._updateRequest = null;
		this.fire('canvasredraw');
	},

	_initElements: function () {
		this._map._initPathRoot();
		this._ctx = this._map._canvasCtx;
	},

	_updateStyle: function () {
		var options = this.options;

		if (options.stroke) {
			this._ctx.lineWidth = options.weight;
			this._ctx.strokeStyle = options.color;
		}
		if (options.fill) {
			this._ctx.fillStyle = options.fillColor || options.color;
		}
	},

	_drawPath: function () {
		var i, j, len, len2, point, drawMethod;

		this._ctx.beginPath();

		for (i = 0, len = this._parts.length; i < len; i++) {
			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {
				point = this._parts[i][j];
				drawMethod = (j === 0 ? 'move' : 'line') + 'To';

				this._ctx[drawMethod](point.x, point.y);
			}
			// TODO refactor ugly hack
			if (this instanceof L.Polygon) {
				this._ctx.closePath();
			}
		}
	},

	_checkIfEmpty: function () {
		return !this._parts.length;
	},

	_updatePath: function () {
		if (this._checkIfEmpty()) { return; }

		var ctx = this._ctx,
		    options = this.options;

		this._drawPath();
		ctx.save();
		this._updateStyle();

		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fill();
		}

		if (options.stroke) {
			ctx.globalAlpha = options.opacity;
			ctx.stroke();
		}

		ctx.restore();

		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature
	},

	_initEvents: function () {
		if (this.options.clickable) {
			// TODO dblclick
			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onClick, this);
		}
	},

	_onClick: function (e) {
		if (this._containsPoint(e.layerPoint)) {
			this.fire('click', e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map._animatingZoom) { return; }

		// TODO don't do on each move
		if (this._containsPoint(e.layerPoint)) {
			this._ctx.canvas.style.cursor = 'pointer';
			this._mouseInside = true;
			this.fire('mouseover', e);

		} else if (this._mouseInside) {
			this._ctx.canvas.style.cursor = '';
			this._mouseInside = false;
			this.fire('mouseout', e);
		}
	}
});

L.Map.include((L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? {} : {
	_initPathRoot: function () {
		var root = this._pathRoot,
		    ctx;

		if (!root) {
			root = this._pathRoot = document.createElement('canvas');
			root.style.position = 'absolute';
			ctx = this._canvasCtx = root.getContext('2d');

			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			this._panes.overlayPane.appendChild(root);

			if (this.options.zoomAnimation) {
				this._pathRoot.className = 'leaflet-zoom-animated';
				this.on('zoomanim', this._animatePathZoom);
				this.on('zoomend', this._endPathZoom);
			}
			this.on('moveend', this._updateCanvasViewport);
			this.on('canvasredraw', this._updateCanvasViewport);
			this._updateCanvasViewport();
		}
	},

	_updateCanvasViewport: function () {
		// don't redraw while zooming. See _updateSvgViewport for more details
		if (this._pathZooming) { return; }
		this._updatePathViewport();

		var vp = this._pathViewport,
		    min = vp.min,
		    size = vp.max.subtract(min),
		    root = this._pathRoot;

		//TODO check if this works properly on mobile webkit
		L.DomUtil.setPosition(root, min);
		root.width = size.x;
		root.height = size.y;
		root.getContext('2d').translate(-min.x, -min.y);
	}
});


/*
 * L.LineUtil contains different utility functions for line segments
 * and polylines (clipping, simplification, distances, etc.)
 */

/*jshint bitwise:false */ // allow bitwise operations for this file

L.LineUtil = {

	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
	// Improves rendering performance dramatically by lessening the number of points to draw.

	simplify: function (/*Point[]*/ points, /*Number*/ tolerance) {
		if (!tolerance || !points.length) {
			return points.slice();
		}

		var sqTolerance = tolerance * tolerance;

		// stage 1: vertex reduction
		points = this._reducePoints(points, sqTolerance);

		// stage 2: Douglas-Peucker simplification
		points = this._simplifyDP(points, sqTolerance);

		return points;
	},

	// distance from a point to a segment between two points
	pointToSegmentDistance:  function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));
	},

	closestPointOnSegment: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return this._sqClosestPointOnSegment(p, p1, p2);
	},

	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm
	_simplifyDP: function (points, sqTolerance) {

		var len = points.length,
		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
		    markers = new ArrayConstructor(len);

		markers[0] = markers[len - 1] = 1;

		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

		var i,
		    newPoints = [];

		for (i = 0; i < len; i++) {
			if (markers[i]) {
				newPoints.push(points[i]);
			}
		}

		return newPoints;
	},

	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {

		var maxSqDist = 0,
		    index, i, sqDist;

		for (i = first + 1; i <= last - 1; i++) {
			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			markers[index] = 1;

			this._simplifyDPStep(points, markers, sqTolerance, first, index);
			this._simplifyDPStep(points, markers, sqTolerance, index, last);
		}
	},

	// reduce points that are too close to each other to a single point
	_reducePoints: function (points, sqTolerance) {
		var reducedPoints = [points[0]];

		for (var i = 1, prev = 0, len = points.length; i < len; i++) {
			if (this._sqDist(points[i], points[prev]) > sqTolerance) {
				reducedPoints.push(points[i]);
				prev = i;
			}
		}
		if (prev < len - 1) {
			reducedPoints.push(points[len - 1]);
		}
		return reducedPoints;
	},

	// Cohen-Sutherland line clipping algorithm.
	// Used to avoid rendering parts of a polyline that are not currently visible.

	clipSegment: function (a, b, bounds, useLastCode) {
		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),
		    codeB = this._getBitCode(b, bounds),

		    codeOut, p, newCode;

		// save 2nd code to avoid calculating it on the next segment
		this._lastCode = codeB;

		while (true) {
			// if a,b is inside the clip window (trivial accept)
			if (!(codeA | codeB)) {
				return [a, b];
			// if a,b is outside the clip window (trivial reject)
			} else if (codeA & codeB) {
				return false;
			// other cases
			} else {
				codeOut = codeA || codeB;
				p = this._getEdgeIntersection(a, b, codeOut, bounds);
				newCode = this._getBitCode(p, bounds);

				if (codeOut === codeA) {
					a = p;
					codeA = newCode;
				} else {
					b = p;
					codeB = newCode;
				}
			}
		}
	},

	_getEdgeIntersection: function (a, b, code, bounds) {
		var dx = b.x - a.x,
		    dy = b.y - a.y,
		    min = bounds.min,
		    max = bounds.max;

		if (code & 8) { // top
			return new L.Point(a.x + dx * (max.y - a.y) / dy, max.y);
		} else if (code & 4) { // bottom
			return new L.Point(a.x + dx * (min.y - a.y) / dy, min.y);
		} else if (code & 2) { // right
			return new L.Point(max.x, a.y + dy * (max.x - a.x) / dx);
		} else if (code & 1) { // left
			return new L.Point(min.x, a.y + dy * (min.x - a.x) / dx);
		}
	},

	_getBitCode: function (/*Point*/ p, bounds) {
		var code = 0;

		if (p.x < bounds.min.x) { // left
			code |= 1;
		} else if (p.x > bounds.max.x) { // right
			code |= 2;
		}
		if (p.y < bounds.min.y) { // bottom
			code |= 4;
		} else if (p.y > bounds.max.y) { // top
			code |= 8;
		}

		return code;
	},

	// square distance (to avoid unnecessary Math.sqrt calls)
	_sqDist: function (p1, p2) {
		var dx = p2.x - p1.x,
		    dy = p2.y - p1.y;
		return dx * dx + dy * dy;
	},

	// return closest point on segment or distance to that point
	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {
		var x = p1.x,
		    y = p1.y,
		    dx = p2.x - x,
		    dy = p2.y - y,
		    dot = dx * dx + dy * dy,
		    t;

		if (dot > 0) {
			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;

			if (t > 1) {
				x = p2.x;
				y = p2.y;
			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);
	}
};


/*
 * L.Polyline is used to display polylines on a map.
 */

L.Polyline = L.Path.extend({
	initialize: function (latlngs, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlngs = this._convertLatLngs(latlngs);
	},

	options: {
		// how much to simplify the polyline on each zoom level
		// more = better performance and smoother look, less = more accurate
		smoothFactor: 1.0,
		noClip: false
	},

	projectLatlngs: function () {
		this._originalPoints = [];

		for (var i = 0, len = this._latlngs.length; i < len; i++) {
			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
		}
	},

	getPathString: function () {
		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {
			str += this._getPathPartStr(this._parts[i]);
		}
		return str;
	},

	getLatLngs: function () {
		return this._latlngs;
	},

	setLatLngs: function (latlngs) {
		this._latlngs = this._convertLatLngs(latlngs);
		return this.redraw();
	},

	addLatLng: function (latlng) {
		this._latlngs.push(L.latLng(latlng));
		return this.redraw();
	},

	spliceLatLngs: function () { // (Number index, Number howMany)
		var removed = [].splice.apply(this._latlngs, arguments);
		this._convertLatLngs(this._latlngs, true);
		this.redraw();
		return removed;
	},

	closestLayerPoint: function (p) {
		var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;

		for (var j = 0, jLen = parts.length; j < jLen; j++) {
			var points = parts[j];
			for (var i = 1, len = points.length; i < len; i++) {
				p1 = points[i - 1];
				p2 = points[i];
				var sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
				if (sqDist < minDistance) {
					minDistance = sqDist;
					minPoint = L.LineUtil._sqClosestPointOnSegment(p, p1, p2);
				}
			}
		}
		if (minPoint) {
			minPoint.distance = Math.sqrt(minDistance);
		}
		return minPoint;
	},

	getBounds: function () {
		return new L.LatLngBounds(this.getLatLngs());
	},

	_convertLatLngs: function (latlngs, overwrite) {
		var i, len, target = overwrite ? latlngs : [];

		for (i = 0, len = latlngs.length; i < len; i++) {
			if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
				return;
			}
			target[i] = L.latLng(latlngs[i]);
		}
		return target;
	},

	_initEvents: function () {
		L.Path.prototype._initEvents.call(this);
	},

	_getPathPartStr: function (points) {
		var round = L.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
		}
		return str;
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    len = points.length,
		    i, k, segment;

		if (this.options.noClip) {
			this._parts = [points];
			return;
		}

		this._parts = [];

		var parts = this._parts,
		    vp = this._map._pathViewport,
		    lu = L.LineUtil;

		for (i = 0, k = 0; i < len - 1; i++) {
			segment = lu.clipSegment(points[i], points[i + 1], vp, i);
			if (!segment) {
				continue;
			}

			parts[k] = parts[k] || [];
			parts[k].push(segment[0]);

			// if segment goes out of screen, or it's the last one, it's the end of the line part
			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {
				parts[k].push(segment[1]);
				k++;
			}
		}
	},

	// simplify each clipped part of the polyline
	_simplifyPoints: function () {
		var parts = this._parts,
		    lu = L.LineUtil;

		for (var i = 0, len = parts.length; i < len; i++) {
			parts[i] = lu.simplify(parts[i], this.options.smoothFactor);
		}
	},

	_updatePath: function () {
		if (!this._map) { return; }

		this._clipPoints();
		this._simplifyPoints();

		L.Path.prototype._updatePath.call(this);
	}
});

L.polyline = function (latlngs, options) {
	return new L.Polyline(latlngs, options);
};


/*
 * L.PolyUtil contains utility functions for polygons (clipping, etc.).
 */

/*jshint bitwise:false */ // allow bitwise operations here

L.PolyUtil = {};

/*
 * Sutherland-Hodgeman polygon clipping algorithm.
 * Used to avoid rendering parts of a polygon that are not currently visible.
 */
L.PolyUtil.clipPolygon = function (points, bounds) {
	var clippedPoints,
	    edges = [1, 4, 2, 8],
	    i, j, k,
	    a, b,
	    len, edge, p,
	    lu = L.LineUtil;

	for (i = 0, len = points.length; i < len; i++) {
		points[i]._code = lu._getBitCode(points[i], bounds);
	}

	// for each edge (left, bottom, right, top)
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];

		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];

			// if a is inside the clip window
			if (!(a._code & edge)) {
				// if b is outside the clip window (a->b goes out of screen)
				if (b._code & edge) {
					p = lu._getEdgeIntersection(b, a, edge, bounds);
					p._code = lu._getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);

			// else if b is inside the clip window (a->b enters the screen)
			} else if (!(b._code & edge)) {
				p = lu._getEdgeIntersection(b, a, edge, bounds);
				p._code = lu._getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}

	return points;
};


/*
 * L.Polygon is used to display polygons on a map.
 */

L.Polygon = L.Polyline.extend({
	options: {
		fill: true
	},

	initialize: function (latlngs, options) {
		L.Polyline.prototype.initialize.call(this, latlngs, options);
		this._initWithHoles(latlngs);
	},

	_initWithHoles: function (latlngs) {
		var i, len, hole;
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._latlngs = this._convertLatLngs(latlngs[0]);
			this._holes = latlngs.slice(1);

			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = this._holes[i] = this._convertLatLngs(this._holes[i]);
				if (hole[0].equals(hole[hole.length - 1])) {
					hole.pop();
				}
			}
		}

		// filter out last point if its equal to the first one
		latlngs = this._latlngs;

		if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {
			latlngs.pop();
		}
	},

	projectLatlngs: function () {
		L.Polyline.prototype.projectLatlngs.call(this);

		// project polygon holes points
		// TODO move this logic to Polyline to get rid of duplication
		this._holePoints = [];

		if (!this._holes) { return; }

		var i, j, len, len2;

		for (i = 0, len = this._holes.length; i < len; i++) {
			this._holePoints[i] = [];

			for (j = 0, len2 = this._holes[i].length; j < len2; j++) {
				this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
			}
		}
	},

	setLatLngs: function (latlngs) {
		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {
			this._initWithHoles(latlngs);
			return this.redraw();
		} else {
			return L.Polyline.prototype.setLatLngs.call(this, latlngs);
		}
	},

	_clipPoints: function () {
		var points = this._originalPoints,
		    newParts = [];

		this._parts = [points].concat(this._holePoints);

		if (this.options.noClip) { return; }

		for (var i = 0, len = this._parts.length; i < len; i++) {
			var clipped = L.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);
			if (clipped.length) {
				newParts.push(clipped);
			}
		}

		this._parts = newParts;
	},

	_getPathPartStr: function (points) {
		var str = L.Polyline.prototype._getPathPartStr.call(this, points);
		return str + (L.Browser.svg ? 'z' : 'x');
	}
});

L.polygon = function (latlngs, options) {
	return new L.Polygon(latlngs, options);
};


/*
 * Contains L.MultiPolyline and L.MultiPolygon layers.
 */

(function () {
	function createMulti(Klass) {

		return L.FeatureGroup.extend({

			initialize: function (latlngs, options) {
				this._layers = {};
				this._options = options;
				this.setLatLngs(latlngs);
			},

			setLatLngs: function (latlngs) {
				var i = 0,
				    len = latlngs.length;

				this.eachLayer(function (layer) {
					if (i < len) {
						layer.setLatLngs(latlngs[i++]);
					} else {
						this.removeLayer(layer);
					}
				}, this);

				while (i < len) {
					this.addLayer(new Klass(latlngs[i++], this._options));
				}

				return this;
			},

			getLatLngs: function () {
				var latlngs = [];

				this.eachLayer(function (layer) {
					latlngs.push(layer.getLatLngs());
				});

				return latlngs;
			}
		});
	}

	L.MultiPolyline = createMulti(L.Polyline);
	L.MultiPolygon = createMulti(L.Polygon);

	L.multiPolyline = function (latlngs, options) {
		return new L.MultiPolyline(latlngs, options);
	};

	L.multiPolygon = function (latlngs, options) {
		return new L.MultiPolygon(latlngs, options);
	};
}());


/*
 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.
 */

L.Rectangle = L.Polygon.extend({
	initialize: function (latLngBounds, options) {
		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
	},

	setBounds: function (latLngBounds) {
		this.setLatLngs(this._boundsToLatLngs(latLngBounds));
	},

	_boundsToLatLngs: function (latLngBounds) {
		latLngBounds = L.latLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
});

L.rectangle = function (latLngBounds, options) {
	return new L.Rectangle(latLngBounds, options);
};


/*
 * L.Circle is a circle overlay (with a certain radius in meters).
 */

L.Circle = L.Path.extend({
	initialize: function (latlng, radius, options) {
		L.Path.prototype.initialize.call(this, options);

		this._latlng = L.latLng(latlng);
		this._mRadius = radius;
	},

	options: {
		fill: true
	},

	setLatLng: function (latlng) {
		this._latlng = L.latLng(latlng);
		return this.redraw();
	},

	setRadius: function (radius) {
		this._mRadius = radius;
		return this.redraw();
	},

	projectLatlngs: function () {
		var lngRadius = this._getLngRadius(),
		    latlng = this._latlng,
		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);

		this._point = this._map.latLngToLayerPoint(latlng);
		this._radius = Math.max(this._point.x - pointLeft.x, 1);
	},

	getBounds: function () {
		var lngRadius = this._getLngRadius(),
		    latRadius = (this._mRadius / 40075017) * 360,
		    latlng = this._latlng;

		return new L.LatLngBounds(
		        [latlng.lat - latRadius, latlng.lng - lngRadius],
		        [latlng.lat + latRadius, latlng.lng + lngRadius]);
	},

	getLatLng: function () {
		return this._latlng;
	},

	getPathString: function () {
		var p = this._point,
		    r = this._radius;

		if (this._checkIfEmpty()) {
			return '';
		}

		if (L.Browser.svg) {
			return 'M' + p.x + ',' + (p.y - r) +
			       'A' + r + ',' + r + ',0,1,1,' +
			       (p.x - 0.1) + ',' + (p.y - r) + ' z';
		} else {
			p._round();
			r = Math.round(r);
			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);
		}
	},

	getRadius: function () {
		return this._mRadius;
	},

	// TODO Earth hardcoded, move into projection code!

	_getLatRadius: function () {
		return (this._mRadius / 40075017) * 360;
	},

	_getLngRadius: function () {
		return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);
	},

	_checkIfEmpty: function () {
		if (!this._map) {
			return false;
		}
		var vp = this._map._pathViewport,
		    r = this._radius,
		    p = this._point;

		return p.x - r > vp.max.x || p.y - r > vp.max.y ||
		       p.x + r < vp.min.x || p.y + r < vp.min.y;
	}
});

L.circle = function (latlng, radius, options) {
	return new L.Circle(latlng, radius, options);
};


/*
 * L.CircleMarker is a circle overlay with a permanent pixel radius.
 */

L.CircleMarker = L.Circle.extend({
	options: {
		radius: 10,
		weight: 2
	},

	initialize: function (latlng, options) {
		L.Circle.prototype.initialize.call(this, latlng, null, options);
		this._radius = this.options.radius;
	},

	projectLatlngs: function () {
		this._point = this._map.latLngToLayerPoint(this._latlng);
	},

	_updateStyle : function () {
		L.Circle.prototype._updateStyle.call(this);
		this.setRadius(this.options.radius);
	},

	setLatLng: function (latlng) {
		L.Circle.prototype.setLatLng.call(this, latlng);
		if (this._popup && this._popup._isOpen) {
			this._popup.setLatLng(latlng);
		}
		return this;
	},

	setRadius: function (radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	},

	getRadius: function () {
		return this._radius;
	}
});

L.circleMarker = function (latlng, options) {
	return new L.CircleMarker(latlng, options);
};


/*
 * Extends L.Polyline to be able to manually detect clicks on Canvas-rendered polylines.
 */

L.Polyline.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p, closed) {
		var i, j, k, len, len2, dist, part,
		    w = this.options.weight / 2;

		if (L.Browser.touch) {
			w += 10; // polyline click tolerance on touch devices
		}

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				if (!closed && (j === 0)) {
					continue;
				}

				dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);

				if (dist <= w) {
					return true;
				}
			}
		}
		return false;
	}
});


/*
 * Extends L.Polygon to be able to manually detect clicks on Canvas-rendered polygons.
 */

L.Polygon.include(!L.Path.CANVAS ? {} : {
	_containsPoint: function (p) {
		var inside = false,
		    part, p1, p2,
		    i, j, k,
		    len, len2;

		// TODO optimization: check if within bounds first

		if (L.Polyline.prototype._containsPoint.call(this, p, true)) {
			// click on polygon border
			return true;
		}

		// ray casting algorithm for detecting if point is in polygon

		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];

			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				p1 = part[j];
				p2 = part[k];

				if (((p1.y > p.y) !== (p2.y > p.y)) &&
						(p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
					inside = !inside;
				}
			}
		}

		return inside;
	}
});


/*
 * Extends L.Circle with Canvas-specific code.
 */

L.Circle.include(!L.Path.CANVAS ? {} : {
	_drawPath: function () {
		var p = this._point;
		this._ctx.beginPath();
		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);
	},

	_containsPoint: function (p) {
		var center = this._point,
		    w2 = this.options.stroke ? this.options.weight / 2 : 0;

		return (p.distanceTo(center) <= this._radius + w2);
	}
});


/*
 * CircleMarker canvas specific drawing parts.
 */

L.CircleMarker.include(!L.Path.CANVAS ? {} : {
	_updateStyle: function () {
		L.Path.prototype._updateStyle.call(this);
	}
});


/*
 * L.GeoJSON turns any GeoJSON data into a Leaflet layer.
 */

L.GeoJSON = L.FeatureGroup.extend({

	initialize: function (geojson, options) {
		L.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// Only add this if geometry or geometries are set and not null
				feature = features[i];
				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
					this.addData(features[i]);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return; }

		var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);
		layer.feature = L.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	resetStyle: function (layer) {
		var style = this.options.style;
		if (style) {
			// reset any custom styles
			L.Util.extend(layer.options, layer.defaultOptions);

			this._setLayerStyle(layer, style);
		}
	},

	setStyle: function (style) {
		this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

L.extend(L.GeoJSON, {
	geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry.coordinates,
		    layers = [],
		    latlng, latlngs, i, len;

		coordsToLatLng = coordsToLatLng || this.coordsToLatLng;

		switch (geometry.type) {
		case 'Point':
			latlng = coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = coordsToLatLng(coords[i]);
				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));
			}
			return new L.FeatureGroup(layers);

		case 'LineString':
			latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
			return new L.Polyline(latlngs, vectorOptions);

		case 'Polygon':
			if (coords.length === 2 && !coords[1].length) {
				throw new Error('Invalid GeoJSON object.');
			}
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.Polygon(latlngs, vectorOptions);

		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
			return new L.MultiPolyline(latlngs, vectorOptions);

		case 'MultiPolygon':
			latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
			return new L.MultiPolygon(latlngs, vectorOptions);

		case 'GeometryCollection':
			for (i = 0, len = geometry.geometries.length; i < len; i++) {

				layers.push(this.geometryToLayer({
					geometry: geometry.geometries[i],
					type: 'Feature',
					properties: geojson.properties
				}, pointToLayer, coordsToLatLng, vectorOptions));
			}
			return new L.FeatureGroup(layers);

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng
		return new L.LatLng(coords[1], coords[0], coords[2]);
	},

	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) { // (Array[, Number, Function]) -> Array
		var latlng, i, len,
		    latlngs = [];

		for (i = 0, len = coords.length; i < len; i++) {
			latlng = levelsDeep ?
			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :
			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);

			latlngs.push(latlng);
		}

		return latlngs;
	},

	latLngToCoords: function (latlng) {
		var coords = [latlng.lng, latlng.lat];

		if (latlng.alt !== undefined) {
			coords.push(latlng.alt);
		}
		return coords;
	},

	latLngsToCoords: function (latLngs) {
		var coords = [];

		for (var i = 0, len = latLngs.length; i < len; i++) {
			coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));
		}

		return coords;
	},

	getFeature: function (layer, newGeometry) {
		return layer.feature ? L.extend({}, layer.feature, {geometry: newGeometry}) : L.GeoJSON.asFeature(newGeometry);
	},

	asFeature: function (geoJSON) {
		if (geoJSON.type === 'Feature') {
			return geoJSON;
		}

		return {
			type: 'Feature',
			properties: {},
			geometry: geoJSON
		};
	}
});

var PointToGeoJSON = {
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'Point',
			coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
		});
	}
};

L.Marker.include(PointToGeoJSON);
L.Circle.include(PointToGeoJSON);
L.CircleMarker.include(PointToGeoJSON);

L.Polyline.include({
	toGeoJSON: function () {
		return L.GeoJSON.getFeature(this, {
			type: 'LineString',
			coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())
		});
	}
});

L.Polygon.include({
	toGeoJSON: function () {
		var coords = [L.GeoJSON.latLngsToCoords(this.getLatLngs())],
		    i, len, hole;

		coords[0].push(coords[0][0]);

		if (this._holes) {
			for (i = 0, len = this._holes.length; i < len; i++) {
				hole = L.GeoJSON.latLngsToCoords(this._holes[i]);
				hole.push(hole[0]);
				coords.push(hole);
			}
		}

		return L.GeoJSON.getFeature(this, {
			type: 'Polygon',
			coordinates: coords
		});
	}
});

(function () {
	function multiToGeoJSON(type) {
		return function () {
			var coords = [];

			this.eachLayer(function (layer) {
				coords.push(layer.toGeoJSON().geometry.coordinates);
			});

			return L.GeoJSON.getFeature(this, {
				type: type,
				coordinates: coords
			});
		};
	}

	L.MultiPolyline.include({toGeoJSON: multiToGeoJSON('MultiLineString')});
	L.MultiPolygon.include({toGeoJSON: multiToGeoJSON('MultiPolygon')});

	L.LayerGroup.include({
		toGeoJSON: function () {

			var geometry = this.feature && this.feature.geometry,
				jsons = [],
				json;

			if (geometry && geometry.type === 'MultiPoint') {
				return multiToGeoJSON('MultiPoint').call(this);
			}

			var isGeometryCollection = geometry && geometry.type === 'GeometryCollection';

			this.eachLayer(function (layer) {
				if (layer.toGeoJSON) {
					json = layer.toGeoJSON();
					jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));
				}
			});

			if (isGeometryCollection) {
				return L.GeoJSON.getFeature(this, {
					geometries: jsons,
					type: 'GeometryCollection'
				});
			}

			return {
				type: 'FeatureCollection',
				features: jsons
			};
		}
	});
}());

L.geoJson = function (geojson, options) {
	return new L.GeoJSON(geojson, options);
};


/*
 * L.DomEvent contains functions for working with DOM events.
 */

L.DomEvent = {
	/* inspired by John Resig, Dean Edwards and YUI addEvent implementations */
	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler, originalHandler, newType;

		if (obj[key]) { return this; }

		handler = function (e) {
			return fn.call(context || obj, e || L.DomEvent._getEvent());
		};

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			return this.addPointerListener(obj, type, handler, id);
		}
		if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
			this.addDoubleTapListener(obj, handler, id);
		}

		if ('addEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.addEventListener('DOMMouseScroll', handler, false);
				obj.addEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				originalHandler = handler;
				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

				handler = function (e) {
					if (!L.DomEvent._checkMouse(obj, e)) { return; }
					return originalHandler(e);
				};

				obj.addEventListener(newType, handler, false);

			} else if (type === 'click' && L.Browser.android) {
				originalHandler = handler;
				handler = function (e) {
					return L.DomEvent._filterClick(e, originalHandler);
				};

				obj.addEventListener(type, handler, false);
			} else {
				obj.addEventListener(type, handler, false);
			}

		} else if ('attachEvent' in obj) {
			obj.attachEvent('on' + type, handler);
		}

		obj[key] = handler;

		return this;
	},

	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

		var id = L.stamp(fn),
		    key = '_leaflet_' + type + id,
		    handler = obj[key];

		if (!handler) { return this; }

		if (L.Browser.pointer && type.indexOf('touch') === 0) {
			this.removePointerListener(obj, type, id);
		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
			this.removeDoubleTapListener(obj, id);

		} else if ('removeEventListener' in obj) {

			if (type === 'mousewheel') {
				obj.removeEventListener('DOMMouseScroll', handler, false);
				obj.removeEventListener(type, handler, false);

			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {
				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
			} else {
				obj.removeEventListener(type, handler, false);
			}
		} else if ('detachEvent' in obj) {
			obj.detachEvent('on' + type, handler);
		}

		obj[key] = null;

		return this;
	},

	stopPropagation: function (e) {

		if (e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
		L.DomEvent._skipped(e);

		return this;
	},

	disableScrollPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		return L.DomEvent
			.on(el, 'mousewheel', stop)
			.on(el, 'MozMousePixelScroll', stop);
	},

	disableClickPropagation: function (el) {
		var stop = L.DomEvent.stopPropagation;

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(el, L.Draggable.START[i], stop);
		}

		return L.DomEvent
			.on(el, 'click', L.DomEvent._fakeStop)
			.on(el, 'dblclick', stop);
	},

	preventDefault: function (e) {

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return this;
	},

	stop: function (e) {
		return L.DomEvent
			.preventDefault(e)
			.stopPropagation(e);
	},

	getMousePosition: function (e, container) {
		if (!container) {
			return new L.Point(e.clientX, e.clientY);
		}

		var rect = container.getBoundingClientRect();

		return new L.Point(
			e.clientX - rect.left - container.clientLeft,
			e.clientY - rect.top - container.clientTop);
	},

	getWheelDelta: function (e) {

		var delta = 0;

		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
		}
		if (e.detail) {
			delta = -e.detail / 3;
		}
		return delta;
	},

	_skipEvents: {},

	_fakeStop: function (e) {
		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
		L.DomEvent._skipEvents[e.type] = true;
	},

	_skipped: function (e) {
		var skipped = this._skipEvents[e.type];
		// reset when checking, as it's only used in map container and propagates outside of the map
		this._skipEvents[e.type] = false;
		return skipped;
	},

	// check if element really left/entered the event target (for mouseenter/mouseleave)
	_checkMouse: function (el, e) {

		var related = e.relatedTarget;

		if (!related) { return true; }

		try {
			while (related && (related !== el)) {
				related = related.parentNode;
			}
		} catch (err) {
			return false;
		}
		return (related !== el);
	},

	_getEvent: function () { // evil magic for IE
		/*jshint noarg:false */
		var e = window.event;
		if (!e) {
			var caller = arguments.callee.caller;
			while (caller) {
				e = caller['arguments'][0];
				if (e && window.Event === e.constructor) {
					break;
				}
				caller = caller.caller;
			}
		}
		return e;
	},

	// this is a horrible workaround for a bug in Android where a single touch triggers two click events
	_filterClick: function (e, handler) {
		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
			elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);

		// are they closer together than 500ms yet more than 100ms?
		// Android typically triggers them ~300ms apart while multiple listeners
		// on the same event should be triggered far faster;
		// or check if click is simulated on the element, and if it is, reject any non-simulated events

		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
			L.DomEvent.stop(e);
			return;
		}
		L.DomEvent._lastClick = timeStamp;

		return handler(e);
	}
};

L.DomEvent.on = L.DomEvent.addListener;
L.DomEvent.off = L.DomEvent.removeListener;


/*
 * L.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
 */

L.Draggable = L.Class.extend({
	includes: L.Mixin.Events,

	statics: {
		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],
		END: {
			mousedown: 'mouseup',
			touchstart: 'touchend',
			pointerdown: 'touchend',
			MSPointerDown: 'touchend'
		},
		MOVE: {
			mousedown: 'mousemove',
			touchstart: 'touchmove',
			pointerdown: 'touchmove',
			MSPointerDown: 'touchmove'
		}
	},

	initialize: function (element, dragStartTarget) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
	},

	enable: function () {
		if (this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.on(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) { return; }

		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {
			L.DomEvent.off(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);
		}

		this._enabled = false;
		this._moved = false;
	},

	_onDown: function (e) {
		this._moved = false;

		if (e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }

		L.DomEvent.stopPropagation(e);

		if (L.Draggable._disabled) { return; }

		L.DomUtil.disableImageDrag();
		L.DomUtil.disableTextSelection();

		if (this._moving) { return; }

		var first = e.touches ? e.touches[0] : e;

		this._startPoint = new L.Point(first.clientX, first.clientY);
		this._startPos = this._newPos = L.DomUtil.getPosition(this._element);

		L.DomEvent
		    .on(document, L.Draggable.MOVE[e.type], this._onMove, this)
		    .on(document, L.Draggable.END[e.type], this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			this._moved = true;
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
		    newPoint = new L.Point(first.clientX, first.clientY),
		    offset = newPoint.subtract(this._startPoint);

		if (!offset.x && !offset.y) { return; }
		if (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

		L.DomEvent.preventDefault(e);

		if (!this._moved) {
			this.fire('dragstart');

			this._moved = true;
			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

			L.DomUtil.addClass(document.body, 'leaflet-dragging');
			this._lastTarget = e.target || e.srcElement;
			L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
		}

		this._newPos = this._startPos.add(offset);
		this._moving = true;

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
	},

	_updatePosition: function () {
		this.fire('predrag');
		L.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag');
	},

	_onUp: function () {
		L.DomUtil.removeClass(document.body, 'leaflet-dragging');

		if (this._lastTarget) {
			L.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');
			this._lastTarget = null;
		}

		for (var i in L.Draggable.MOVE) {
			L.DomEvent
			    .off(document, L.Draggable.MOVE[i], this._onMove)
			    .off(document, L.Draggable.END[i], this._onUp);
		}

		L.DomUtil.enableImageDrag();
		L.DomUtil.enableTextSelection();

		if (this._moved && this._moving) {
			// ensure drag is not fired after dragend
			L.Util.cancelAnimFrame(this._animRequest);

			this.fire('dragend', {
				distance: this._newPos.distanceTo(this._startPos)
			});
		}

		this._moving = false;
	}
});


/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});


/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

L.Map.mergeOptions({
	dragging: true,

	inertia: !L.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	inertiaThreshold: L.Browser.touch ? 32 : 18, // ms
	easeLinearity: 0.25,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				'dragstart': this._onDragStart,
				'drag': this._onDrag,
				'dragend': this._onDragEnd
			}, this);

			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDrag, this);
				map.on('viewreset', this._onViewReset, this);

				map.whenReady(this._onViewReset, this);
			}
		}
		this._draggable.enable();
	},

	removeHooks: function () {
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		var map = this._map;

		if (map._panAnim) {
			map._panAnim.stop();
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function () {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 200) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move')
		    .fire('drag');
	},

	_onViewReset: function () {
		// TODO fix hardcoded Earth values
		var pxCenter = this._map.getSize()._divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.project([0, 180]).x;
	},

	_onPreDrag: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,
		    delay = +new Date() - this._lastTime,

		    noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime + delay - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x || !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true
					});
				});
			}
		}
	}
});

L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);


/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

L.Map.mergeOptions({
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);


/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

L.Map.mergeOptions({
	scrollWheelZoom: true
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);
		L.DomEvent.on(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll);
		L.DomEvent.off(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(40 - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.preventDefault(e);
		L.DomEvent.stopPropagation(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);


/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

L.extend(L.DomEvent, {

	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',

	// inspired by Zepto touch code by Thomas Fuchs
	addDoubleTapListener: function (obj, handler, id) {
		var last,
		    doubleTap = false,
		    delay = 250,
		    touch,
		    pre = '_leaflet_',
		    touchstart = this._touchstart,
		    touchend = this._touchend,
		    trackedTouches = [];

		function onTouchStart(e) {
			var count;

			if (L.Browser.pointer) {
				trackedTouches.push(e.pointerId);
				count = trackedTouches.length;
			} else {
				count = e.touches.length;
			}
			if (count > 1) {
				return;
			}

			var now = Date.now(),
				delta = now - (last || now);

			touch = e.touches ? e.touches[0] : e;
			doubleTap = (delta > 0 && delta <= delay);
			last = now;
		}

		function onTouchEnd(e) {
			if (L.Browser.pointer) {
				var idx = trackedTouches.indexOf(e.pointerId);
				if (idx === -1) {
					return;
				}
				trackedTouches.splice(idx, 1);
			}

			if (doubleTap) {
				if (L.Browser.pointer) {
					// work around .type being readonly with MSPointer* events
					var newTouch = { },
						prop;

					// jshint forin:false
					for (var i in touch) {
						prop = touch[i];
						if (typeof prop === 'function') {
							newTouch[i] = prop.bind(touch);
						} else {
							newTouch[i] = prop;
						}
					}
					touch = newTouch;
				}
				touch.type = 'dblclick';
				handler(touch);
				last = null;
			}
		}
		obj[pre + touchstart + id] = onTouchStart;
		obj[pre + touchend + id] = onTouchEnd;

		// on pointer we need to listen on the document, otherwise a drag starting on the map and moving off screen
		// will not come through to us, so we will lose track of how many touches are ongoing
		var endElement = L.Browser.pointer ? document.documentElement : obj;

		obj.addEventListener(touchstart, onTouchStart, false);
		endElement.addEventListener(touchend, onTouchEnd, false);

		if (L.Browser.pointer) {
			endElement.addEventListener(L.DomEvent.POINTER_CANCEL, onTouchEnd, false);
		}

		return this;
	},

	removeDoubleTapListener: function (obj, id) {
		var pre = '_leaflet_';

		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);
		(L.Browser.pointer ? document.documentElement : obj).removeEventListener(
		        this._touchend, obj[pre + this._touchend + id], false);

		if (L.Browser.pointer) {
			document.documentElement.removeEventListener(L.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id],
				false);
		}

		return this;
	}
});


/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	//static
	POINTER_DOWN: L.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: L.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: L.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {

			L.DomEvent.preventDefault(e);

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

L.Map.mergeOptions({
	touchZoom: L.Browser.touch && !L.Browser.android23,
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]),
		    viewCenter = map._getCenterLayerPoint();

		this._startCenter = p1.add(p2)._divideBy(2);
		this._startDist = p1.distanceTo(p2);

		this._moved = false;
		this._zooming = true;

		this._centerOffset = viewCenter.subtract(this._startCenter);

		if (map._panAnim) {
			map._panAnim.stop();
		}

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]);

		this._scale = p1.distanceTo(p2) / this._startDist;
		this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);

		if (this._scale === 1) { return; }

		if (!map.options.bounceAtZoomLimits) {
			if ((map.getZoom() === map.getMinZoom() && this._scale < 1) ||
			    (map.getZoom() === map.getMaxZoom() && this._scale > 1)) { return; }
		}

		if (!this._moved) {
			L.DomUtil.addClass(map._mapPane, 'leaflet-touching');

			map
			    .fire('movestart')
			    .fire('zoomstart');

			this._moved = true;
		}

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(
		        this._updateOnMove, this, true, this._map._container);

		L.DomEvent.preventDefault(e);
	},

	_updateOnMove: function () {
		var map = this._map,
		    origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),
		    zoom = map.getScaleZoom(this._scale);

		map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta, false, true);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		var map = this._map;

		this._zooming = false;
		L.DomUtil.removeClass(map._mapPane, 'leaflet-touching');
		L.Util.cancelAnimFrame(this._animRequest);

		L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		var origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),

		    oldZoom = map.getZoom(),
		    floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom,
		    roundZoomDelta = (floatZoomDelta > 0 ?
		            Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta)),

		    zoom = map._limitZoom(oldZoom + roundZoomDelta),
		    scale = map.getZoomScale(zoom) / this._scale;

		map._animateZoom(center, zoom, origin, scale);
	},

	_getScaleOrigin: function () {
		var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
		return this._startCenter.add(centerOffset);
	}
});

L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);


/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

L.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		L.DomEvent
			.on(document, 'touchmove', this._onMove, this)
			.on(document, 'touchend', this._onUp, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent
			.off(document, 'touchmove', this._onMove, this)
			.off(document, 'touchend', this._onUp, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}


/*
 * L.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

L.Map.mergeOptions({
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._moved = false;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown);
		this._moved = false;
	},

	moved: function () {
		return this._moved;
	},

	_onMouseDown: function (e) {
		this._moved = false;

		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		L.DomEvent
		    .on(document, 'mousemove', this._onMouseMove, this)
		    .on(document, 'mouseup', this._onMouseUp, this)
		    .on(document, 'keydown', this._onKeyDown, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
			L.DomUtil.setPosition(this._box, this._startLayerPoint);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';
			this._map.fire('boxzoomstart');
		}

		var startPoint = this._startLayerPoint,
		    box = this._box,

		    layerPoint = this._map.mouseEventToLayerPoint(e),
		    offset = layerPoint.subtract(startPoint),

		    newPos = new L.Point(
		        Math.min(layerPoint.x, startPoint.x),
		        Math.min(layerPoint.y, startPoint.y));

		L.DomUtil.setPosition(box, newPos);

		this._moved = true;

		// TODO refactor: remove hardcoded 4 pixels
		box.style.width  = (Math.max(0, Math.abs(offset.x) - 4)) + 'px';
		box.style.height = (Math.max(0, Math.abs(offset.y) - 4)) + 'px';
	},

	_finish: function () {
		if (this._moved) {
			this._pane.removeChild(this._box);
			this._container.style.cursor = '';
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent
		    .off(document, 'mousemove', this._onMouseMove)
		    .off(document, 'mouseup', this._onMouseUp)
		    .off(document, 'keydown', this._onKeyDown);
	},

	_onMouseUp: function (e) {

		this._finish();

		var map = this._map,
		    layerPoint = map.mouseEventToLayerPoint(e);

		if (this._startLayerPoint.equals(layerPoint)) { return; }

		var bounds = new L.LatLngBounds(
		        map.layerPointToLatLng(this._startLayerPoint),
		        map.layerPointToLatLng(layerPoint));

		map.fitBounds(bounds);

		map.fire('boxzoomend', {
			boxZoomBounds: bounds
		});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);


/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

L.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex === -1) {
			container.tabIndex = '0';
		}

		L.DomEvent
		    .on(container, 'focus', this._onFocus, this)
		    .on(container, 'blur', this._onBlur, this)
		    .on(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .on('focus', this._addHooks, this)
		    .on('blur', this._removeHooks, this);
	},

	removeHooks: function () {
		this._removeHooks();

		var container = this._map._container;

		L.DomEvent
		    .off(container, 'focus', this._onFocus, this)
		    .off(container, 'blur', this._onBlur, this)
		    .off(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .off('focus', this._addHooks, this)
		    .off('blur', this._removeHooks, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		var key = e.keyCode,
		    map = this._map;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			map.panBy(this._panKeys[key]);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + this._zoomKeys[key]);

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);


/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon);
		}

		this._draggable
			.on('dragstart', this._onDragStart, this)
			.on('drag', this._onDrag, this)
			.on('dragend', this._onDragEnd, this);
		this._draggable.enable();
		L.DomUtil.addClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable
			.off('dragstart', this._onDragStart, this)
			.off('drag', this._onDrag, this)
			.off('dragend', this._onDragEnd, this);

		this._draggable.disable();
		L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function () {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;

		marker
		    .fire('move', {latlng: latlng})
		    .fire('drag');
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});


/*
 * L.Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 */

L.Control = L.Class.extend({
	options: {
		position: 'topright'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	getPosition: function () {
		return this.options.position;
	},

	setPosition: function (position) {
		var map = this._map;

		if (map) {
			map.removeControl(this);
		}

		this.options.position = position;

		if (map) {
			map.addControl(this);
		}

		return this;
	},

	getContainer: function () {
		return this._container;
	},

	addTo: function (map) {
		this._map = map;

		var container = this._container = this.onAdd(map),
		    pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		L.DomUtil.addClass(container, 'leaflet-control');

		if (pos.indexOf('bottom') !== -1) {
			corner.insertBefore(container, corner.firstChild);
		} else {
			corner.appendChild(container);
		}

		return this;
	},

	removeFrom: function (map) {
		var pos = this.getPosition(),
		    corner = map._controlCorners[pos];

		corner.removeChild(this._container);
		this._map = null;

		if (this.onRemove) {
			this.onRemove(map);
		}

		return this;
	},

	_refocusOnMap: function () {
		if (this._map) {
			this._map.getContainer().focus();
		}
	}
});

L.control = function (options) {
	return new L.Control(options);
};


// adds control-related methods to L.Map

L.Map.include({
	addControl: function (control) {
		control.addTo(this);
		return this;
	},

	removeControl: function (control) {
		control.removeFrom(this);
		return this;
	},

	_initControlPos: function () {
		var corners = this._controlCorners = {},
		    l = 'leaflet-',
		    container = this._controlContainer =
		            L.DomUtil.create('div', l + 'control-container', this._container);

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos: function () {
		this._container.removeChild(this._controlContainer);
	}
});


/*
 * L.Control.Zoom is used for the default zoom buttons on the map.
 */

L.Control.Zoom = L.Control.extend({
	options: {
		position: 'topleft',
		zoomInText: '+',
		zoomInTitle: '放大',
		zoomOutText: '-',
		zoomOutTitle: '縮小'
	},

	onAdd: function (map) {
		var zoomName = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar');

		this._map = map;

		this._zoomInButton  = this._createButton(
		        this.options.zoomInText, this.options.zoomInTitle,
		        zoomName + '-in',  container, this._zoomIn,  this);
		this._zoomOutButton = this._createButton(
		        this.options.zoomOutText, this.options.zoomOutTitle,
		        zoomName + '-out', container, this._zoomOut, this);

		this._updateDisabled();
		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

		return container;
	},

	onRemove: function (map) {
		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
	},

	_zoomIn: function (e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},

	_zoomOut: function (e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = L.DomEvent.stopPropagation;

		L.DomEvent
		    .on(link, 'click', stop)
		    .on(link, 'mousedown', stop)
		    .on(link, 'dblclick', stop)
		    .on(link, 'click', L.DomEvent.preventDefault)
		    .on(link, 'click', fn, context)
		    .on(link, 'click', this._refocusOnMap, context);

		return link;
	},

	_updateDisabled: function () {
		var map = this._map,
			className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	}
});

L.Map.mergeOptions({
	zoomControl: true
});

L.Map.addInitHook(function () {
	if (this.options.zoomControl) {
		this.zoomControl = new L.Control.Zoom();
		this.addControl(this.zoomControl);
	}
});

L.control.zoom = function (options) {
	return new L.Control.Zoom(options);
};



/*
 * L.Control.Attribution is used for displaying attribution on the map (added by default).
 */

L.Control.Attribution = L.Control.extend({
	options: {
		position: 'bottomright',
		prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
	},

	initialize: function (options) {
		L.setOptions(this, options);

		this._attributions = {};
	},

	onAdd: function (map) {
		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
		L.DomEvent.disableClickPropagation(this._container);

		for (var i in map._layers) {
			if (map._layers[i].getAttribution) {
				this.addAttribution(map._layers[i].getAttribution());
			}
		}
		
		map
		    .on('layeradd', this._onLayerAdd, this)
		    .on('layerremove', this._onLayerRemove, this);

		this._update();

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerAdd)
		    .off('layerremove', this._onLayerRemove);

	},

	setPrefix: function (prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	addAttribution: function (text) {
		if (!text) { return; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	removeAttribution: function (text) {
		if (!text) { return; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update: function () {
		if (!this._map) { return; }

		var attribs = [];

		for (var i in this._attributions) {
			if (this._attributions[i]) {
				attribs.push(i);
			}
		}

		var prefixAndAttribs = [];

		if (this.options.prefix) {
			prefixAndAttribs.push(this.options.prefix);
		}
		if (attribs.length) {
			prefixAndAttribs.push(attribs.join(', '));
		}

		this._container.innerHTML = prefixAndAttribs.join(' | ');
	},

	_onLayerAdd: function (e) {
		if (e.layer.getAttribution) {
			this.addAttribution(e.layer.getAttribution());
		}
	},

	_onLayerRemove: function (e) {
		if (e.layer.getAttribution) {
			this.removeAttribution(e.layer.getAttribution());
		}
	}
});

L.Map.mergeOptions({
	attributionControl: true
});

L.Map.addInitHook(function () {
	if (this.options.attributionControl) {
		this.attributionControl = (new L.Control.Attribution()).addTo(this);
	}
});

L.control.attribution = function (options) {
	return new L.Control.Attribution(options);
};


/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.Scale = L.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className, container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className + '-line', container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className + '-line', container);
		}
	},

	_update: function () {
		var bounds = this._map.getBounds(),
		    centerLat = bounds.getCenter().lat,
		    halfWorldMeters = 6367000.0 * Math.PI * Math.cos(centerLat * Math.PI / 180),
		    dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

		    size = this._map.getSize(),
		    options = this.options,
		    maxMeters = 0;

		if (size.x > 0) {
			maxMeters = dist * (options.maxWidth / size.x);
		}

		this._updateScales(options, maxMeters);
	},

	_updateScales: function (options, maxMeters) {
		if (options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}

		if (options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters);

		this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
		this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    scale = this._iScale,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);

			scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
			scale.innerHTML = miles + ' mi';

		} else {
			feet = this._getRoundNum(maxFeet);

			scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
			scale.innerHTML = feet + ' ft';
		}
	},

	_getScaleWidth: function (ratio) {
		return Math.round(this.options.maxWidth * ratio) - 10;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

L.control.scale = function (options) {
	return new L.Control.Scale(options);
};


/*
 * L.Control.Layers is a control to allow users to switch between different layers on the map.
 */

L.Control.Layers = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (baseLayers, overlays, options) {
		L.setOptions(this, options);

		this._layers = {};
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in baseLayers) {
			this._addLayer(baseLayers[i], i);
		}

		for (i in overlays) {
			this._addLayer(overlays[i], i, true);
		}
	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		map
		    .on('layeradd', this._onLayerChange, this)
		    .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	onRemove: function (map) {
		map
		    .off('layeradd', this._onLayerChange, this)
		    .off('layerremove', this._onLayerChange, this);
	},

	addBaseLayer: function (layer, name) {
		this._addLayer(layer, name);
		this._update();
		return this;
	},

	addOverlay: function (layer, name) {
		this._addLayer(layer, name, true);
		this._update();
		return this;
	},

	removeLayer: function (layer) {
		var id = L.stamp(layer);
		delete this._layers[id];
		this._update();
		return this;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

		container.appendChild(form);
	},

	_addLayer: function (layer, name, overlay) {
		var id = L.stamp(layer);

		this._layers[id] = {
			layer: layer,
			name: name,
			overlay: overlay
		};

		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._baseLayersList.innerHTML = '';
		this._overlaysList.innerHTML = '';

		var baseLayersPresent = false,
		    overlaysPresent = false,
		    i, obj;

		for (i in this._layers) {
			obj = this._layers[i];
			this._addItem(obj);
			overlaysPresent = overlaysPresent || obj.overlay;
			baseLayersPresent = baseLayersPresent || !obj.overlay;
		}

		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
	},

	_onLayerChange: function (e) {
		var obj = this._layers[L.stamp(e.layer)];

		if (!obj) { return; }

		if (!this._handlingClick) {
			this._update();
		}

		var type = obj.overlay ?
			(e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
			(e.type === 'layeradd' ? 'baselayerchange' : null);

		if (type) {
			this._map.fire(type, obj);
		}
	},

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
		if (checked) {
			radioHtml += ' checked="checked"';
		}
		radioHtml += '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    input,
		    checked = this._map.hasLayer(obj.layer);

		if (obj.overlay) {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'leaflet-control-layers-selector';
			input.defaultChecked = checked;
		} else {
			input = this._createRadioElement('leaflet-base-layers', checked);
		}

		input.layerId = L.stamp(obj.layer);

		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		label.appendChild(input);
		label.appendChild(name);

		var container = obj.overlay ? this._overlaysList : this._baseLayersList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			obj = this._layers[input.layerId];

			if (input.checked && !this._map.hasLayer(obj.layer)) {
				this._map.addLayer(obj.layer);

			} else if (!input.checked && this._map.hasLayer(obj.layer)) {
				this._map.removeLayer(obj.layer);
			}
		}

		this._handlingClick = false;

		this._refocusOnMap();
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

L.control.layers = function (baseLayers, overlays, options) {
	return new L.Control.Layers(baseLayers, overlays, options);
};


/*
 * L.PosAnimation is used by Leaflet internally for pan animations.
 */

L.PosAnimation = L.Class.extend({
	includes: L.Mixin.Events,

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._newPos = newPos;

		this.fire('start');

		el.style[L.DomUtil.TRANSITION] = 'all ' + (duration || 0.25) +
		        's cubic-bezier(0,0,' + (easeLinearity || 0.5) + ',1)';

		L.DomEvent.on(el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
		L.DomUtil.setPosition(el, newPos);

		// toggle reflow, Chrome flickers for some reason if you don't do this
		L.Util.falseFn(el.offsetWidth);

		// there's no native way to track value updates of transitioned properties, so we imitate this
		this._stepTimer = setInterval(L.bind(this._onStep, this), 50);
	},

	stop: function () {
		if (!this._inProgress) { return; }

		// if we just removed the transition property, the element would jump to its final position,
		// so we need to make it stay at the current position

		L.DomUtil.setPosition(this._el, this._getPos());
		this._onTransitionEnd();
		L.Util.falseFn(this._el.offsetWidth); // force reflow in case we are about to start a new animation
	},

	_onStep: function () {
		var stepPos = this._getPos();
		if (!stepPos) {
			this._onTransitionEnd();
			return;
		}
		// jshint camelcase: false
		// make L.DomUtil.getPosition return intermediate position value during animation
		this._el._leaflet_pos = stepPos;

		this.fire('step');
	},

	// you can't easily get intermediate values of properties animated with CSS3 Transitions,
	// we need to parse computed style (in case of transform it returns matrix string)

	_transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,

	_getPos: function () {
		var left, top, matches,
		    el = this._el,
		    style = window.getComputedStyle(el);

		if (L.Browser.any3d) {
			matches = style[L.DomUtil.TRANSFORM].match(this._transformRe);
			if (!matches) { return; }
			left = parseFloat(matches[1]);
			top  = parseFloat(matches[2]);
		} else {
			left = parseFloat(style.left);
			top  = parseFloat(style.top);
		}

		return new L.Point(left, top, true);
	},

	_onTransitionEnd: function () {
		L.DomEvent.off(this._el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);

		if (!this._inProgress) { return; }
		this._inProgress = false;

		this._el.style[L.DomUtil.TRANSITION] = '';

		// jshint camelcase: false
		// make sure L.DomUtil.getPosition returns the final position value after animation
		this._el._leaflet_pos = this._newPos;

		clearInterval(this._stepTimer);

		this.fire('step').fire('end');
	}

});


/*
 * Extends L.Map to handle panning animations.
 */

L.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		if (this._panAnim) {
			this._panAnim.stop();
		}

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate}, options.pan);
			}

			// try animating pan or zoom
			var animated = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (animated) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});


/*
 * L.PosAnimation fallback implementation that powers Leaflet pan animations
 * in browsers that don't support CSS3 Transitions.
 */

L.PosAnimation = L.DomUtil.TRANSITION ? L.PosAnimation : L.PosAnimation.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step();
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function () {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		L.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});


/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

if (L.DomUtil.TRANSITION) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation && L.DomUtil.TRANSITION &&
				L.Browser.any3d && !L.Browser.android23 && !L.Browser.mobileOpera;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!L.DomUtil.TRANSITION ? {} : {

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	},

	_animateZoom: function (center, zoom, origin, scale, delta, backwards, forTouchZoom) {

		if (!forTouchZoom) {
			this._animatingZoom = true;
		}

		// put transform transition on all layers with leaflet-zoom-animated class
		L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');

		// remember what center/zoom to set after animation
		this._animateToCenter = center;
		this._animateToZoom = zoom;

		// disable any dragging during animation
		if (L.Draggable) {
			L.Draggable._disabled = true;
		}

		L.Util.requestAnimFrame(function () {
			this.fire('zoomanim', {
				center: center,
				zoom: zoom,
				origin: origin,
				scale: scale,
				delta: delta,
				backwards: backwards
			});
		}, this);
	},

	_onZoomTransitionEnd: function () {

		this._animatingZoom = false;

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		this._resetView(this._animateToCenter, this._animateToZoom, true, true);

		if (L.Draggable) {
			L.Draggable._disabled = false;
		}
	}
});


/*
	Zoom animation logic for L.TileLayer.
*/

L.TileLayer.include({
	_animateZoom: function (e) {
		if (!this._animating) {
			this._animating = true;
			this._prepareBgBuffer();
		}

		var bg = this._bgBuffer,
		    transform = L.DomUtil.TRANSFORM,
		    initialTransform = e.delta ? L.DomUtil.getTranslateString(e.delta) : bg.style[transform],
		    scaleStr = L.DomUtil.getScaleString(e.scale, e.origin);

		bg.style[transform] = e.backwards ?
				scaleStr + ' ' + initialTransform :
				initialTransform + ' ' + scaleStr;
	},

	_endZoomAnim: function () {
		var front = this._tileContainer,
		    bg = this._bgBuffer;

		front.style.visibility = '';
		front.parentNode.appendChild(front); // Bring to fore

		// force reflow
		L.Util.falseFn(bg.offsetWidth);

		this._animating = false;
	},

	_clearBgBuffer: function () {
		var map = this._map;

		if (map && !map._animatingZoom && !map.touchZoom._zooming) {
			this._bgBuffer.innerHTML = '';
			this._bgBuffer.style[L.DomUtil.TRANSFORM] = '';
		}
	},

	_prepareBgBuffer: function () {

		var front = this._tileContainer,
		    bg = this._bgBuffer;

		// if foreground layer doesn't have many tiles but bg layer does,
		// keep the existing bg layer and just zoom it some more

		var bgLoaded = this._getLoadedTilesPercentage(bg),
		    frontLoaded = this._getLoadedTilesPercentage(front);

		if (bg && bgLoaded > 0.5 && frontLoaded < 0.5) {

			front.style.visibility = 'hidden';
			this._stopLoadingImages(front);
			return;
		}

		// prepare the buffer to become the front tile pane
		bg.style.visibility = 'hidden';
		bg.style[L.DomUtil.TRANSFORM] = '';

		// switch out the current layer to be the new bg layer (and vice-versa)
		this._tileContainer = bg;
		bg = this._bgBuffer = front;

		this._stopLoadingImages(bg);

		//prevent bg buffer from clearing right after zoom
		clearTimeout(this._clearBgBufferTimer);
	},

	_getLoadedTilesPercentage: function (container) {
		var tiles = container.getElementsByTagName('img'),
		    i, len, count = 0;

		for (i = 0, len = tiles.length; i < len; i++) {
			if (tiles[i].complete) {
				count++;
			}
		}
		return count / len;
	},

	// stops loading all tiles in the background layer
	_stopLoadingImages: function (container) {
		var tiles = Array.prototype.slice.call(container.getElementsByTagName('img')),
		    i, len, tile;

		for (i = 0, len = tiles.length; i < len; i++) {
			tile = tiles[i];

			if (!tile.complete) {
				tile.onload = L.Util.falseFn;
				tile.onerror = L.Util.falseFn;
				tile.src = L.Util.emptyImageUrl;

				tile.parentNode.removeChild(tile);
			}
		}
	}
});


/*
 * Provides L.Map with convenient shortcuts for using browser geolocation features.
 */

L.Map.include({
	_defaultLocateOptions: {
		watch: false,
		setView: false,
		maxZoom: Infinity,
		timeout: 10000,
		maximumAge: 0,
		enableHighAccuracy: false
	},

	locate: function (/*Object*/ options) {

		options = this._locateOptions = L.extend(this._defaultLocateOptions, options);

		if (!navigator.geolocation) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		var onResponse = L.bind(this._handleGeolocationResponse, this),
			onError = L.bind(this._handleGeolocationError, this);

		if (options.watch) {
			this._locationWatchId =
			        navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	},

	stopLocate: function () {
		if (navigator.geolocation) {
			navigator.geolocation.clearWatch(this._locationWatchId);
		}
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	},

	_handleGeolocationError: function (error) {
		var c = error.code,
		    message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: 'Geolocation error: ' + message + '.'
		});
	},

	_handleGeolocationResponse: function (pos) {
		var lat = pos.coords.latitude,
		    lng = pos.coords.longitude,
		    latlng = new L.LatLng(lat, lng),

		    latAccuracy = 180 * pos.coords.accuracy / 40075017,
		    lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat),

		    bounds = L.latLngBounds(
		            [lat - latAccuracy, lng - lngAccuracy],
		            [lat + latAccuracy, lng + lngAccuracy]),

		    options = this._locateOptions;

		if (options.setView) {
			var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);
			this.setView(latlng, zoom);
		}

		var data = {
			latlng: latlng,
			bounds: bounds,
			timestamp: pos.timestamp
		};

		for (var i in pos.coords) {
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}
});


}(window, document));

/*
Geodesic extension to Leaflet library, by Fragger
https://github.com/Fragger/Leaflet.Geodesic
Version from master branch, dated Apr 26, 2013
Modified by qnstie 2013-07-17 to maintain compatibility with Leaflet.draw
*/
(function () {
  function geodesicPoly(Klass, fill) {
    return Klass.extend({
      initialize: function (latlngs, options) {
        Klass.prototype.initialize.call(this, L.geodesicConvertLines(latlngs, fill), options);
        this._latlngsinit = this._convertLatLngs(latlngs);
      },
      getLatLngs: function () {
        return this._latlngsinit;
      },
      setLatLngs: function (latlngs) {
        this._latlngsinit = this._convertLatLngs(latlngs);
        return this.redraw();
      },
      addLatLng: function (latlng) {
        this._latlngsinit.push(L.latLng(latlng));
        return this.redraw();
      },
      spliceLatLngs: function () { // (Number index, Number howMany)
        var removed = [].splice.apply(this._latlngsinit, arguments);
        this._convertLatLngs(this._latlngsinit);
        this.redraw();
        return removed;
      },
      redraw: function() {
        this._latlngs = this._convertLatLngs(L.geodesicConvertLines(this._latlngsinit, fill));
        return Klass.prototype.redraw.call(this);
      }
    });
  }

  // alternative geodesic line intermediate points function
  // as north/south lines have very little curvature in the projection, we cam use longitude (east/west) seperation
  // to calculate intermediate points. hopeefully this will avoid the rounding issues seen in the full intermediate
  // points code that have been seen
  function geodesicConvertLine(startLatLng, endLatLng, convertedPoints) {
    var R = 6367000.0; // earth radius in meters (doesn't have to be exact)
    var d2r = Math.PI/180.0;
    var r2d = 180.0/Math.PI;

    // maths based on http://williams.best.vwh.net/avform.htm#Int

    var lat1 = startLatLng.lat * d2r;
    var lat2 = endLatLng.lat * d2r;
    var lng1 = startLatLng.lng * d2r;
    var lng2 = endLatLng.lng * d2r;

    var dLng = lng2-lng1;

    var segments = Math.floor(Math.abs(dLng * R / 5000));

    if (segments > 1) {
      // pre-calculate some constant values for the loop
      var sinLat1 = Math.sin(lat1);
      var sinLat2 = Math.sin(lat2);
      var cosLat1 = Math.cos(lat1);
      var cosLat2 = Math.cos(lat2);

      var sinLat1CosLat2 = sinLat1*cosLat2;
      var sinLat2CosLat1 = sinLat2*cosLat1;

      var cosLat1CosLat2SinDLng = cosLat1*cosLat2*Math.sin(dLng);

      for (var i=1; i < segments; i++) {
        var iLng = lng1+dLng*(i/segments);
        var iLat = Math.atan( (sinLat1CosLat2*Math.sin(lng2-iLng) + sinLat2CosLat1*Math.sin(iLng-lng1))
                              / cosLat1CosLat2SinDLng)

        var point = L.latLng ( [iLat*r2d, iLng*r2d] );
        convertedPoints.push(point);
      }
    }

    convertedPoints.push(L.latLng(endLatLng));
  }



  L.geodesicConvertLines = function (latlngs, fill) {
    if (latlngs.length == 0) {
      return [];
    }

    for (var i = 0, len = latlngs.length; i < len; i++) {
      if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {
        return;
      }
      latlngs[i] = L.latLng(latlngs[i]);
    }

    // geodesic calculations have issues when crossing the anti-meridian. so offset the points
    // so this isn't an issue, then add back the offset afterwards
    // a center longitude would be ideal - but the start point longitude will be 'good enough'
    var lngOffset = latlngs[0].lng;

    // points are wrapped after being offset relative to the first point coordinate, so they're
    // within +-180 degrees
    latlngs = latlngs.map(function(a){ return L.latLng(a.lat, a.lng-lngOffset).wrap(); });

    var geodesiclatlngs = [];

    if(!fill) {
      geodesiclatlngs.push(latlngs[0]);
    }
    for (i = 0, len = latlngs.length - 1; i < len; i++) {
      geodesicConvertLine(latlngs[i], latlngs[i+1], geodesiclatlngs);
    }
    if(fill) {
      geodesicConvertLine(latlngs[len], latlngs[0], geodesiclatlngs);
    }

    // now add back the offset subtracted above. no wrapping here - the drawing code handles
    // things better when there's no sudden jumps in coordinates. yes, lines will extend
    // beyond +-180 degrees - but they won't be 'broken'
    geodesiclatlngs = geodesiclatlngs.map(function(a){ return L.latLng(a.lat, a.lng+lngOffset); });

    return geodesiclatlngs;
  }
  
  L.GeodesicPolyline = geodesicPoly(L.Polyline, 0);
  L.GeodesicPolygon = geodesicPoly(L.Polygon, 1);

  //L.GeodesicMultiPolyline = createMulti(L.GeodesicPolyline);
  //L.GeodesicMultiPolygon = createMulti(L.GeodesicPolygon);

  /*L.GeodesicMultiPolyline = L.MultiPolyline.extend({
    initialize: function (latlngs, options) {
      L.MultiPolyline.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/

  /*L.GeodesicMultiPolygon = L.MultiPolygon.extend({
    initialize: function (latlngs, options) {
      L.MultiPolygon.prototype.initialize.call(this, L.geodesicConvertLines(latlngs), options);
    }
  });*/


  L.GeodesicCircle = L.Polygon.extend({
    initialize: function (latlng, radius, options) {
      this._latlng = L.latLng(latlng);
      this._mRadius = radius;

      points = this._calcPoints();

      L.Polygon.prototype.initialize.call(this, points, options);
    },

    options: {
      fill: true
    },

    setLatLng: function (latlng) {
      this._latlng = L.latLng(latlng);
      points = this._calcPoints();
      this.setLatLngs(points);
    },

    setRadius: function (radius) {
      this._mRadius = radius;
      points = this._calcPoints();
      this.setLatLngs(points);

    },

    getLatLng: function () {
      return this._latlng;
    },

    getRadius: function() {
      return this._mRadius;
    },


    _calcPoints: function() {
      var R = 6367000.0; //earth radius in meters (approx - taken from leaflet source code)
      var d2r = Math.PI/180.0;
      var r2d = 180.0/Math.PI;
//console.log("geodesicCircle: radius = "+this._mRadius+"m, centre "+this._latlng.lat+","+this._latlng.lng);

      // circle radius as an angle from the centre of the earth
      var radRadius = this._mRadius / R;

//console.log(" (radius in radians "+radRadius);

      // pre-calculate various values used for every point on the circle
      var centreLat = this._latlng.lat * d2r;
      var centreLng = this._latlng.lng * d2r;

      var cosCentreLat = Math.cos(centreLat);
      var sinCentreLat = Math.sin(centreLat);

      var cosRadRadius = Math.cos(radRadius);
      var sinRadRadius = Math.sin(radRadius);

      var calcLatLngAtAngle = function(angle) {
        var lat = Math.asin(sinCentreLat*cosRadRadius + cosCentreLat*sinRadRadius*Math.cos(angle));
        var lng = centreLng + Math.atan2(Math.sin(angle)*sinRadRadius*cosCentreLat, cosRadRadius-sinCentreLat*Math.sin(lat));

        return L.latLng(lat * r2d,lng * r2d);
      }


      var segments = Math.max(48,Math.floor(this._mRadius/1000));
//console.log(" (drawing circle as "+segments+" lines)");
      var points = [];
      for (var i=0; i<segments; i++) {
        var angle = Math.PI*2/segments*i;

        var point = calcLatLngAtAngle(angle)
        points.push ( point );
      }

      return points;
    },

  });


  L.geodesicPolyline = function (latlngs, options) {
    return new L.GeodesicPolyline(latlngs, options);
  };

  L.geodesicPolygon = function (latlngs, options) {
    return new L.GeodesicPolygon(latlngs, options);
  };
  
  /*
  L.geodesicMultiPolyline = function (latlngs, options) {
    return new L.GeodesicMultiPolyline(latlngs, options);
  };

  L.geodesicMultiPolygon = function (latlngs, options) {
    return new L.GeodesicMultiPolygon(latlngs, options);
  };

  */

  L.geodesicCircle = function (latlng, radius, options) {
    return new L.GeodesicCircle(latlng, radius, options);
  }

}());

// modified version of https://github.com/shramov/leaflet-plugins. Also
// contains the default Ingress map style.
/*
 * Google layer using Google Maps API
 */
//(function (google, L) {

L.Google = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		opacity: 1,
		continuousWorld: false,
		noWrap: false,
		mapOptions: {
			backgroundColor: '#dddddd'
		}
	},

	// Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._ready = google.maps.Map != undefined;
		if (!this._ready) L.Google.asyncWait.push(this);

		this._type = type || 'SATELLITE';
	},

	onAdd: function(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._resetCallback, this);

		this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
		map.on('move', this._update, this);

		map.on('zoomanim', this._handleZoomAnim, this);

		//20px instead of 1em to avoid a slight overlap with google's attribution
		map._controlCorners['bottomright'].style.marginBottom = "20px";

		this._reset();
		this._update();
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);
		//this._container = null;

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);

		this._map.off('zoomanim', this._handleZoomAnim, this);

		map._controlCorners['bottomright'].style.marginBottom = "0em";
		//this._map.off('moveend', this._update, this);
	},

	getAttribution: function() {
		return this.options.attribution;
	},

	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function(e, size) {
		e.style.width = size.x + "px";
		e.style.height = size.y + "px";
	},

	_initContainer: function() {
		var tilePane = this._map._container,
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-google-layer leaflet-top leaflet-left');
			this._container.id = "_GMapContainer_" + L.Util.stamp(this);
			this._container.style.zIndex = "auto";
		}

		if (true) {
			tilePane.insertBefore(this._container, first);

			this.setOpacity(this.options.opacity);
			this.setElementSize(this._container, this._map.getSize());
		}
	},

	_initMapObject: function() {
		if (!this._ready) return;
		this._google_center = new google.maps.LatLng(0, 0);
		var map = new google.maps.Map(this._container, {
		    center: this._google_center,
		    zoom: 0,
		    tilt: 0,
		    mapTypeId: google.maps.MapTypeId[this._type],
		    disableDefaultUI: true,
		    keyboardShortcuts: false,
		    draggable: false,
		    disableDoubleClickZoom: true,
		    scrollwheel: false,
		    streetViewControl: false,
		    styles: this.options.mapOptions.styles,
		    backgroundColor: this.options.mapOptions.backgroundColor
		});

		var _this = this;
		this._reposition = google.maps.event.addListenerOnce(map, "center_changed",
			function() { _this.onReposition(); });
		this._google = map;

		google.maps.event.addListenerOnce(map, "idle",
			function() { _this._checkZoomLevels(); });
	},

	_checkZoomLevels: function() {
		//setting the zoom level on the Google map may result in a different zoom level than the one requested
		//(it won't go beyond the level for which they have data).
		// verify and make sure the zoom levels on both Leaflet and Google maps are consistent
		if (this._google.getZoom() !== this._map.getZoom()) {
			//zoom levels are out of sync. Set the leaflet zoom level to match the google one
			this._map.setZoom( this._google.getZoom() );
		}
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function(e) {
		if (!this._google) return;
		this._resize();

		var center = e && e.latlng ? e.latlng : this._map.getCenter();
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._google.setCenter(_center);
		this._google.setZoom(this._map.getZoom());

		this._checkZoomLevels();
		//this._google.fitBounds(google_bounds);
	},

	_resize: function() {
		var size = this._map.getSize();
		if (this._container.style.width == size.x &&
		    this._container.style.height == size.y)
			return;
		this.setElementSize(this._container, size);
		this.onReposition();
	},


	_handleZoomAnim: function (e) {
		var center = e.center;
		var _center = new google.maps.LatLng(center.lat, center.lng);

		this._google.setCenter(_center);
		this._google.setZoom(e.zoom);
	},


	onReposition: function() {
		if (!this._google) return;
		google.maps.event.trigger(this._google, "resize");
	}
});

L.Google.asyncWait = [];
L.Google.asyncInitialize = function() {
	var i;
	for (i = 0; i < L.Google.asyncWait.length; i++) {
		var o = L.Google.asyncWait[i];
		o._ready = true;
		if (o._container) {
			o._initMapObject();
			o._update();
		}
	}
	L.Google.asyncWait = [];
};
//})(window.google, L)

(function(){var f=[].slice;String.prototype.autoLink=function(){var c,e,d,a,b;a=1<=arguments.length?f.call(arguments,0):[];e="";d=a[0];b=/(^|\s)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026@#\/%?=~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~_|])/gi;if(!(0<a.length))return this.replace(b,"$1<a href='$2'>$2</a>");for(c in d)a=d[c],"callback"!==c&&(e+=" "+c+"='"+a+"'");return this.replace(b,function(a,c,b){a=("function"===typeof d.callback?d.callback(b):void 0)||"<a href='"+b+"'"+e+">"+b+"</a>";return""+c+a})}}).call(this);

(function(){/*
 OverlappingMarkerSpiderfier
https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
Copyright (c) 2011 - 2012 George MacKerron
Released under the MIT licence: http://opensource.org/licenses/mit-license
Note: The Leaflet maps API must be included *before* this code
*/
(function(){var q={}.hasOwnProperty,r=[].slice;null!=this.L&&(this.OverlappingMarkerSpiderfier=function(){function n(c,b){var a,e,g,f,d=this;this.map=c;null==b&&(b={});for(a in b)q.call(b,a)&&(e=b[a],this[a]=e);this.initMarkerArrays();this.listeners={};f=["click","zoomend"];e=0;for(g=f.length;e<g;e++)a=f[e],this.map.addEventListener(a,function(){return d.unspiderfy()})}var d,k;d=n.prototype;d.VERSION="0.2.6";k=2*Math.PI;d.keepSpiderfied=!1;d.nearbyDistance=20;d.circleSpiralSwitchover=9;d.circleFootSeparation=
25;d.circleStartAngle=k/12;d.spiralFootSeparation=28;d.spiralLengthStart=11;d.spiralLengthFactor=5;d.legWeight=1.5;d.legColors={usual:"#222",highlighted:"#f00"};d.initMarkerArrays=function(){this.markers=[];return this.markerListeners=[]};d.addMarker=function(c){var b,a=this;if(null!=c._oms)return this;c._oms=!0;b=function(){return a.spiderListener(c)};c.addEventListener("click",b);this.markerListeners.push(b);this.markers.push(c);return this};d.getMarkers=function(){return this.markers.slice(0)};
d.removeMarker=function(c){var b,a;null!=c._omsData&&this.unspiderfy();b=this.arrIndexOf(this.markers,c);if(0>b)return this;a=this.markerListeners.splice(b,1)[0];c.removeEventListener("click",a);delete c._oms;this.markers.splice(b,1);return this};d.clearMarkers=function(){var c,b,a,e,g;this.unspiderfy();g=this.markers;c=a=0;for(e=g.length;a<e;c=++a)b=g[c],c=this.markerListeners[c],b.removeEventListener("click",c),delete b._oms;this.initMarkerArrays();return this};d.addListener=function(c,b){var a,
e;(null!=(e=(a=this.listeners)[c])?e:a[c]=[]).push(b);return this};d.removeListener=function(c,b){var a;a=this.arrIndexOf(this.listeners[c],b);0>a||this.listeners[c].splice(a,1);return this};d.clearListeners=function(c){this.listeners[c]=[];return this};d.trigger=function(){var c,b,a,e,g,f;b=arguments[0];c=2<=arguments.length?r.call(arguments,1):[];b=null!=(a=this.listeners[b])?a:[];f=[];e=0;for(g=b.length;e<g;e++)a=b[e],f.push(a.apply(null,c));return f};d.generatePtsCircle=function(c,b){var a,e,
g,f,d;g=this.circleFootSeparation*(2+c)/k;e=k/c;d=[];for(a=f=0;0<=c?f<c:f>c;a=0<=c?++f:--f)a=this.circleStartAngle+a*e,d.push(new L.Point(b.x+g*Math.cos(a),b.y+g*Math.sin(a)));return d};d.generatePtsSpiral=function(c,b){var a,e,g,f,d;g=this.spiralLengthStart;a=0;d=[];for(e=f=0;0<=c?f<c:f>c;e=0<=c?++f:--f)a+=this.spiralFootSeparation/g+5E-4*e,e=new L.Point(b.x+g*Math.cos(a),b.y+g*Math.sin(a)),g+=k*this.spiralLengthFactor/a,d.push(e);return d};d.spiderListener=function(c){var b,a,e,g,f,d,h,k,l;(b=null!=
c._omsData)&&this.keepSpiderfied||this.unspiderfy();if(b)return this.trigger("click",c);g=[];f=[];d=this.nearbyDistance*this.nearbyDistance;e=this.map.latLngToLayerPoint(c.getLatLng());l=this.markers;h=0;for(k=l.length;h<k;h++)b=l[h],this.map.hasLayer(b)&&(a=this.map.latLngToLayerPoint(b.getLatLng()),this.ptDistanceSq(a,e)<d?g.push({marker:b,markerPt:a}):f.push(b));return 1===g.length?this.trigger("click",c):this.spiderfy(g,f)};d.makeHighlightListeners=function(c){var b=this;return{highlight:function(){return c._omsData.leg.setStyle({color:b.legColors.highlighted})},
unhighlight:function(){return c._omsData.leg.setStyle({color:b.legColors.usual})}}};d.spiderfy=function(c,b){var a,e,g,d,p,h,k,l,n,m;this.spiderfying=!0;m=c.length;a=this.ptAverage(function(){var a,b,e;e=[];a=0;for(b=c.length;a<b;a++)k=c[a],e.push(k.markerPt);return e}());d=m>=this.circleSpiralSwitchover?this.generatePtsSpiral(m,a).reverse():this.generatePtsCircle(m,a);a=function(){var a,b,k,m=this;k=[];a=0;for(b=d.length;a<b;a++)g=d[a],e=this.map.layerPointToLatLng(g),n=this.minExtract(c,function(a){return m.ptDistanceSq(a.markerPt,
g)}),h=n.marker,p=new L.Polyline([h.getLatLng(),e],{color:this.legColors.usual,weight:this.legWeight,clickable:!1}),this.map.addLayer(p),h._omsData={usualPosition:h.getLatLng(),leg:p},this.legColors.highlighted!==this.legColors.usual&&(l=this.makeHighlightListeners(h),h._omsData.highlightListeners=l,h.addEventListener("mouseover",l.highlight),h.addEventListener("mouseout",l.unhighlight)),h.setLatLng(e),h.setZIndexOffset(1E6),k.push(h);return k}.call(this);delete this.spiderfying;this.spiderfied=!0;
return this.trigger("spiderfy",a,b)};d.unspiderfy=function(c){var b,a,e,d,f,k,h;null==c&&(c=null);if(null==this.spiderfied)return this;this.unspiderfying=!0;d=[];e=[];h=this.markers;f=0;for(k=h.length;f<k;f++)b=h[f],null!=b._omsData?(this.map.removeLayer(b._omsData.leg),b!==c&&b.setLatLng(b._omsData.usualPosition),b.setZIndexOffset(0),a=b._omsData.highlightListeners,null!=a&&(b.removeEventListener("mouseover",a.highlight),b.removeEventListener("mouseout",a.unhighlight)),delete b._omsData,d.push(b)):
e.push(b);delete this.unspiderfying;delete this.spiderfied;this.trigger("unspiderfy",d,e);return this};d.ptDistanceSq=function(c,b){var a,e;a=c.x-b.x;e=c.y-b.y;return a*a+e*e};d.ptAverage=function(c){var b,a,e,d,f;d=a=e=0;for(f=c.length;d<f;d++)b=c[d],a+=b.x,e+=b.y;c=c.length;return new L.Point(a/c,e/c)};d.minExtract=function(c,b){var a,d,g,f,k,h;g=k=0;for(h=c.length;k<h;g=++k)if(f=c[g],f=b(f),"undefined"===typeof a||null===a||f<d)d=f,a=g;return c.splice(a,1)[0]};d.arrIndexOf=function(c,b){var a,
d,g,f;if(null!=c.indexOf)return c.indexOf(b);a=g=0;for(f=c.length;g<f;a=++g)if(d=c[a],d===b)return a;return-1};return n}())}).call(this);}).call(this);
/* Mon 14 Oct 2013 10:54:59 BST */


try { console.log('done loading included JS'); } catch(e) {}

//note: no protocol - so uses http or https as used on the current page
var JQUERY = '//ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';
var JQUERYUI = '//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js';

// after all scripts have loaded, boot the actual app
load(JQUERY).then(JQUERYUI).thenRun(boot);


;

window.chat = function() {};

//WORK IN PROGRESS - NOT YET USED!!
window.chat.commTabs = [
// channel: the COMM channel ('tab' parameter in server requests)
// name: visible name
// inputPrompt: string for the input prompt
// inputColor: (optional) color for input
// sendMessage: (optional) function to send the message (to override the default of sendPlext)
// globalBounds: (optional) if true, always use global latLng bounds
  {channel:'all', name:'All', inputPrompt: 'broadcast:', inputColor:'#f66'},
  {channel:'faction', name:'Aaction', inputPrompt: 'tell faction:'},
  {channel:'alerts', name:'Alerts', inputPrompt: 'tell Jarvis:', inputColor: '#666', globalBounds: true, sendMessage: function() {
    alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");
  }},
];


window.chat.handleTabCompletion = function() {
  var el = $('#chatinput input');
  var curPos = el.get(0).selectionStart;
  var text = el.val();
  var word = text.slice(0, curPos).replace(/.*\b([a-z0-9-_])/, '$1').toLowerCase();

  var list = $('#chat > div:visible mark');
  list = list.map(function(ind, mark) { return $(mark).text(); } );
  list = uniqueArray(list);

  var nick = null;
  for(var i = 0; i < list.length; i++) {
    if(!list[i].toLowerCase().startsWith(word)) continue;
    if(nick && nick !== list[i]) {
      console.log('More than one nick matches, aborting. ('+list[i]+' vs '+nick+')');
      return;
    }
    nick = list[i];
  }
  if(!nick) {
    console.log('No matches for ' + word);
    return;
  }

  var posStart = curPos - word.length;
  var newText = text.substring(0, posStart);
  var atPresent = text.substring(posStart-1, posStart) === '@';
  newText += (atPresent ? '' : '@') + nick + ' ';
  newText += text.substring(curPos);
  el.val(newText);
}

//
// clear management
//


window.chat._oldBBox = null;
window.chat.genPostData = function(channel, storageHash, getOlderMsgs) {
  if (typeof channel !== 'string') throw ('API changed: isFaction flag now a channel string - all, faction, alerts');

  var b = clampLatLngBounds(map.getBounds());

  // set a current bounding box if none set so far
  if (!chat._oldBBox) chat._oldBBox = b;

  // to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box
  // is not considered different
  var CHAT_BOUNDINGBOX_SAME_FACTOR = 0.1;
  // if the old and new box contain each other, after expanding by the factor, don't reset chat
  if (!(b.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(chat._oldBBox) && chat._oldBBox.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(b))) {
    console.log('Bounding Box changed, chat will be cleared (old: '+chat._oldBBox.toBBoxString()+'; new: '+b.toBBoxString()+')');

    $('#chat > div').data('needsClearing', true);

    // need to reset these flags now because clearing will only occur
    // after the request is finished – i.e. there would be one almost
    // useless request.
    chat._faction.data = {};
    chat._faction.oldestTimestamp = -1;
    chat._faction.newestTimestamp = -1;

    chat._public.data = {};
    chat._public.oldestTimestamp = -1;
    chat._public.newestTimestamp = -1;

    chat._alerts.data = {};
    chat._alerts.oldestTimestamp = -1;
    chat._alerts.newestTimestamp = -1;

    chat._oldBBox = b;
  }

  var ne = b.getNorthEast();
  var sw = b.getSouthWest();
  var data = {
//    desiredNumItems: isFaction ? CHAT_FACTION_ITEMS : CHAT_PUBLIC_ITEMS ,
    minLatE6: Math.round(sw.lat*1E6),
    minLngE6: Math.round(sw.lng*1E6),
    maxLatE6: Math.round(ne.lat*1E6),
    maxLngE6: Math.round(ne.lng*1E6),
    minTimestampMs: -1,
    maxTimestampMs: -1,
    tab: channel,
  }

  if(getOlderMsgs) {
    // ask for older chat when scrolling up
    data = $.extend(data, {maxTimestampMs: storageHash.oldestTimestamp});
  } else {
    // ask for newer chat
    var min = storageHash.newestTimestamp;
    // the initial request will have both timestamp values set to -1,
    // thus we receive the newest desiredNumItems. After that, we will
    // only receive messages with a timestamp greater or equal to min
    // above.
    // After resuming from idle, there might be more new messages than
    // desiredNumItems. So on the first request, we are not really up to
    // date. We will eventually catch up, as long as there are less new
    // messages than desiredNumItems per each refresh cycle.
    // A proper solution would be to query until no more new results are
    // returned. Another way would be to set desiredNumItems to a very
    // large number so we really get all new messages since the last
    // request. Setting desiredNumItems to -1 does unfortunately not
    // work.
    // Currently this edge case is not handled. Let’s see if this is a
    // problem in crowded areas.
    $.extend(data, {minTimestampMs: min});
    // when requesting with an actual minimum timestamp, request oldest rather than newest first.
    // this matches the stock intel site, and ensures no gaps when continuing after an extended idle period
    if (min > -1) $.extend(data, {ascendingTimestampOrder: true});
  }
  return data;
}



//
// faction
//

window.chat._requestFactionRunning = false;
window.chat.requestFaction = function(getOlderMsgs, isRetry) {
  if(chat._requestFactionRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestFactionRunning = true;
  $("#chatcontrols a:contains('faction')").addClass('loading');

  var d = chat.genPostData('faction', chat._faction, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleFaction(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestFactionRunning = false; }
      : function() { window.chat.requestFaction(getOlderMsgs, true) }
  );
}


window.chat._faction = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleFaction = function(data, olderMsgs) {
  chat._requestFactionRunning = false;
  $("#chatcontrols a:contains('faction')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('faction chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._faction.oldestTimestamp;
  chat.writeDataToHash(data, chat._faction, false, olderMsgs);
  var oldMsgsWereAdded = old !== chat._faction.oldestTimestamp;

  runHooks('factionChatDataAvailable', {raw: data, result: data.result, processed: chat._faction.data});

  window.chat.renderFaction(oldMsgsWereAdded);
}

window.chat.renderFaction = function(oldMsgsWereAdded) {
  chat.renderData(chat._faction.data, 'chatfaction', oldMsgsWereAdded);
}


//
// all
//

window.chat._requestPublicRunning = false;
window.chat.requestPublic = function(getOlderMsgs, isRetry) {
  if(chat._requestPublicRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestPublicRunning = true;
  $("#chatcontrols a:contains('all')").addClass('loading');

  var d = chat.genPostData('all', chat._public, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handlePublic(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestPublicRunning = false; }
      : function() { window.chat.requestPublic(getOlderMsgs, true) }
  );
}

window.chat._public = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handlePublic = function(data, olderMsgs) {
  chat._requestPublicRunning = false;
  $("#chatcontrols a:contains('all')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('public chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._public.oldestTimestamp;
  chat.writeDataToHash(data, chat._public, undefined, olderMsgs);   //NOTE: isPublic passed as undefined - this is the 'all' channel, so not really public or private
  var oldMsgsWereAdded = old !== chat._public.oldestTimestamp;

  runHooks('publicChatDataAvailable', {raw: data, result: data.result, processed: chat._public.data});

  window.chat.renderPublic(oldMsgsWereAdded);

}

window.chat.renderPublic = function(oldMsgsWereAdded) {
  chat.renderData(chat._public.data, 'chatall', oldMsgsWereAdded);
}


//
// alerts
//

window.chat._requestAlertsRunning = false;
window.chat.requestAlerts = function(getOlderMsgs, isRetry) {
  if(chat._requestAlertsRunning && !isRetry) return;
  if(isIdle()) return renderUpdateStatus();
  chat._requestAlertsRunning = true;
  $("#chatcontrols a:contains('alerts')").addClass('loading');

  var d = chat.genPostData('alerts', chat._alerts, getOlderMsgs);
  var r = window.postAjax(
    'getPlexts',
    d,
    function(data, textStatus, jqXHR) { chat.handleAlerts(data, getOlderMsgs); },
    isRetry
      ? function() { window.chat._requestAlertsRunning = false; }
      : function() { window.chat.requestAlerts(getOlderMsgs, true) }
  );
}


window.chat._alerts = {data:{}, oldestTimestamp:-1, newestTimestamp:-1};
window.chat.handleAlerts = function(data, olderMsgs) {
  chat._requestAlertsRunning = false;
  $("#chatcontrols a:contains('alerts')").removeClass('loading');

  if(!data || !data.result) {
    window.failedRequestCount++;
    return console.warn('alerts chat error. Waiting for next auto-refresh.');
  }

  if(data.result.length === 0) return;

  var old = chat._alerts.oldestTimestamp;
  chat.writeDataToHash(data, chat._alerts, undefined, olderMsgs); //NOTE: isPublic passed as undefined - it's nether public or private!
  var oldMsgsWereAdded = old !== chat._alerts.oldestTimestamp;

// no hoot for alerts - API change planned here...
//  runHooks('alertsChatDataAvailable', {raw: data, result: data.result, processed: chat._alerts.data});

  window.chat.renderAlerts(oldMsgsWereAdded);
}

window.chat.renderAlerts = function(oldMsgsWereAdded) {
  chat.renderData(chat._alerts.data, 'chatalerts', oldMsgsWereAdded);
}



//
// common
//

window.chat.nicknameClicked = function(event, nickname) {
  var hookData = { event: event, nickname: nickname };
  
  if (window.runHooks('nicknameClicked', hookData)) {
    window.chat.addNickname('@' + nickname);
  }

  event.preventDefault();
  event.stopPropagation();
  return false;
}

window.chat.writeDataToHash = function(newData, storageHash, isPublicChannel, isOlderMsgs) {
  $.each(newData.result, function(ind, json) {
    // avoid duplicates
    if(json[0] in storageHash.data) return true;

    var isSecureMessage = false;
    var msgToPlayer = false;

    var time = json[1];
    var team = json[2].plext.team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
    var auto = json[2].plext.plextType !== 'PLAYER_GENERATED';
    var systemNarrowcast = json[2].plext.plextType === 'SYSTEM_NARROWCAST';

    //track oldest + newest timestamps
    if (storageHash.oldestTimestamp === -1 || storageHash.oldestTimestamp > time) storageHash.oldestTimestamp = time;
    if (storageHash.newestTimestamp === -1 || storageHash.newestTimestamp < time) storageHash.newestTimestamp = time;

    //remove "Your X on Y was destroyed by Z" from the faction channel
//    if (systemNarrowcast && !isPublicChannel) return true;

    var msg = '', nick = '';
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'SENDER': // user generated messages
        nick = markup[1].plain.slice(0, -2); // cut “: ” at end
        break;

      case 'PLAYER': // automatically generated messages
        nick = markup[1].plain;
        team = markup[1].team === 'RESISTANCE' ? TEAM_RES : TEAM_ENL;
        if(ind > 0) msg += nick; // don’t repeat nick directly
        break;

      case 'TEXT':
        msg += $('<div/>').text(markup[1].plain).html().autoLink();
        break;

      case 'AT_PLAYER':
        var thisToPlayer = (markup[1].plain == ('@'+window.PLAYER.nickname));
        var spanClass = thisToPlayer ? "pl_nudge_me" : (markup[1].team + " pl_nudge_player");
        var atPlayerName = markup[1].plain.replace(/^@/, "");
        msg += $('<div/>').html($('<span/>')
                          .attr('class', spanClass)
                          .attr('onclick',"window.chat.nicknameClicked(event, '"+atPlayerName+"')")
                          .text(markup[1].plain)).html();
        msgToPlayer = msgToPlayer || thisToPlayer;
        break;

      case 'PORTAL':
        var latlng = [markup[1].latE6/1E6, markup[1].lngE6/1E6];
        var perma = '/intel?ll='+latlng[0]+','+latlng[1]+'&z=17&pll='+latlng[0]+','+latlng[1];
        var js = 'window.selectPortalByLatLng('+latlng[0]+', '+latlng[1]+');return false';

        msg += '<a onclick="'+js+'"'
          + ' title="'+markup[1].address+'"'
          + ' href="'+perma+'" class="help">'
          + window.chat.getChatPortalName(markup[1])
          + '</a>';
        break;

      case 'SECURE':
        //NOTE: we won't add the '[secure]' string here - it'll be handled below instead
        isSecureMessage = true;
        break;

      default:
        //handle unknown types by outputting the plain text version, marked with it's type
        msg += $('<div/>').text(markup[0]+':<'+markup[1].plain+'>').html();
        break;
      }
    });


//    //skip secure messages on the public channel
//    if (isPublicChannel && isSecureMessage) return true;

//    //skip public messages (e.g. @player mentions) on the secure channel
//    if ((!isPublicChannel) && (!isSecureMessage)) return true;


    //NOTE: these two are redundant with the above two tests in place - but things have changed...
    //from the server, private channel messages are flagged with a SECURE string '[secure] ', and appear in
    //both the public and private channels
    //we don't include this '[secure]' text above, as it's redundant in the faction-only channel
    //let's add it here though if we have a secure message in the public channel, or the reverse if a non-secure in the faction one
    if (!auto && !(isPublicChannel===false) && isSecureMessage) msg = '<span style="color: #f88; background-color: #500;">[faction]</span> ' + msg;
    //and, add the reverse - a 'public' marker to messages in the private channel
    if (!auto && !(isPublicChannel===true) && (!isSecureMessage)) msg = '<span style="color: #ff6; background-color: #550">[public]</span> ' + msg;


    // format: timestamp, autogenerated, HTML message
    storageHash.data[json[0]] = [json[1], auto, chat.renderMsg(msg, nick, time, team, msgToPlayer, systemNarrowcast), nick];

  });
}

// Override portal names that are used over and over, such as 'US Post Office'
window.chat.getChatPortalName = function(markup) {
  var name = markup.name;
  if(name === 'US Post Office') {
    var address = markup.address.split(',');
    name = 'USPS: ' + address[0];
  }
  return name;
}

// renders data from the data-hash to the element defined by the given
// ID. Set 3rd argument to true if it is likely that old data has been
// added. Latter is only required for scrolling.
window.chat.renderData = function(data, element, likelyWereOldMsgs) {
  var elm = $('#'+element);
  if(elm.is(':hidden')) return;

  // discard guids and sort old to new
//TODO? stable sort, to preserve server message ordering? or sort by GUID if timestamps equal?
  var vals = $.map(data, function(v, k) { return [v]; });
  vals = vals.sort(function(a, b) { return a[0]-b[0]; });

  // render to string with date separators inserted
  var msgs = '';
  var prevTime = null;
  $.each(vals, function(ind, msg) {
    var nextTime = new Date(msg[0]).toLocaleDateString();
    if(prevTime && prevTime !== nextTime)
      msgs += chat.renderDivider(nextTime);
    msgs += msg[2];
    prevTime = nextTime;
  });

  var scrollBefore = scrollBottom(elm);
  elm.html('<table>' + msgs + '</table>');
  chat.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
}


window.chat.renderDivider = function(text) {
  var d = ' ──────────────────────────────────────────────────────────────────────────';
  return '<tr><td colspan="3" style="padding-top:3px"><summary>─ ' + text + d + '</summary></td></tr>';
}


window.chat.renderMsg = function(msg, nick, time, team, msgToPlayer, systemNarrowcast) {
  var ta = unixTimeToHHmm(time);
  var tb = unixTimeToDateTimeString(time, true);
  //add <small> tags around the milliseconds
  tb = (tb.slice(0,19)+'<small class="milliseconds">'+tb.slice(19)+'</small>').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // help cursor via “#chat time”
  var t = '<time title="'+tb+'" data-timestamp="'+time+'">'+ta+'</time>';
  if ( msgToPlayer )
  {
    t = '<div class="pl_nudge_date">' + t + '</div><div class="pl_nudge_pointy_spacer"></div>';
  }
  if (systemNarrowcast)
  {
    msg = '<div class="system_narrowcast">' + msg + '</div>';
  }
  var color = COLORS[team];
  if (nick === window.PLAYER.nickname) color = '#fd6';    //highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
  var s = 'style="cursor:pointer; color:'+color+'"';
  var i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
  return '<tr><td>'+t+'</td><td>'+i[0]+'<mark class="nickname" ' + s + '>'+ nick+'</mark>'+i[1]+'</td><td>'+msg+'</td></tr>';
}

window.chat.addNickname= function(nick) {
  var c = document.getElementById("chattext");
  c.value = [c.value.trim(), nick].join(" ").trim() + " ";
  c.focus()
}




window.chat.getActive = function() {
  return $('#chatcontrols .active').text();
}

window.chat.tabToChannel = function(tab) {
  if (tab == 'faction') return 'faction';
  if (tab == 'alerts') return 'alerts';
  return 'all';
};



window.chat.toggle = function() {
  var c = $('#chat, #chatcontrols');
  if(c.hasClass('expand')) {
    $('#chatcontrols a:first').html('<span class="toggle expand"></span>');
    c.removeClass('expand');
    var div = $('#chat > div:visible');
    div.data('ignoreNextScroll', true);
    div.scrollTop(99999999); // scroll to bottom
    $('.leaflet-control').css('margin-left', '13px');
  } else {
    $('#chatcontrols a:first').html('<span class="toggle shrink"></span>');
    c.addClass('expand');
    $('.leaflet-control').css('margin-left', '720px');
    chat.needMoreMessages();
  }
}


// called by plugins (or other things?) that need to monitor COMM data streams when the user is not viewing them
// instance: a unique string identifying the plugin requesting background COMM
// channel: either 'all', 'faction' or (soon) 'alerts' - others possible in the future
// flag: true for data wanted, false for not wanted
window.chat.backgroundChannelData = function(instance,channel,flag) {
  //first, store the state for this instance
  if (!window.chat.backgroundInstanceChannel) window.chat.backgroundInstanceChannel = {};
  if (!window.chat.backgroundInstanceChannel[instance]) window.chat.backgroundInstanceChannel[instance] = {};
  window.chat.backgroundInstanceChannel[instance][channel] = flag;

  //now, to simplify the request code, merge the flags for all instances into one
  // 1. clear existing overall flags
  window.chat.backgroundChannels = {};
  // 2. for each instance monitoring COMM...
  $.each(window.chat.backgroundInstanceChannel, function(instance,channels) {
    // 3. and for each channel monitored by this instance...
    $.each(window.chat.backgroundInstanceChannel[instance],function(channel,flag) {
      // 4. if it's monitored, set the channel flag
      if (flag) window.chat.backgroundChannels[channel] = true;
    });
  });

}


window.chat.request = function() {
  console.log('refreshing chat');
  var channel = chat.tabToChannel(chat.getActive());
  if (channel == 'faction' || (window.chat.backgroundChannels && window.chat.backgroundChannels['faction'])) {
    chat.requestFaction(false);
  }
  if (channel == 'all' || (window.chat.backgroundChannels && window.chat.backgroundChannels['all'])) {
    chat.requestPublic(false);
  }
  if (channel == 'alerts' || (window.chat.backgroundChannels && window.chat.backgroundChannels['alerts'])) {
    chat.requestAlerts(false);
  }
}


// checks if there are enough messages in the selected chat tab and
// loads more if not.
window.chat.needMoreMessages = function() {
  var activeTab = chat.getActive();
  if(activeTab === 'debug') return;

  var activeChat = $('#chat > :visible');
  if(activeChat.length === 0) return;

  var hasScrollbar = scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0;
  var nearTop = activeChat.scrollTop() <= CHAT_REQUEST_SCROLL_TOP;
  if(hasScrollbar && !nearTop) return;

  console.log('No scrollbar or near top in active chat. Requesting more data.');

  if(activeTab === 'faction')
    chat.requestFaction(true);
  else
    chat.requestPublic(true);
};


window.chat.chooseTab = function(tab) {
  if (tab != 'all' && tab != 'faction' && tab != 'alerts') {
    console.warn('chat tab "'+tab+'" requested - but only "all", "faction" and "alerts" are valid - assuming "all" wanted');
    tab = 'all';
  }

  var oldTab = chat.getActive();

  localStorage['iitc-chat-tab'] = tab;

  var mark = $('#chatinput mark');
  var input = $('#chatinput input');

  $('#chatcontrols .active').removeClass('active');
  $("#chatcontrols a:contains('" + tab + "')").addClass('active');

  if (tab != oldTab) startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a tab change

  $('#chat > div').hide();

  var elm;

  switch(tab) {
    case 'faction':
      input.css('color', '');
      mark.css('color', '');
      mark.text('陣營信息:');

      chat.renderFaction(false);
      break;

    case 'all':
      input.css('cssText', 'color: #f66 !important');
      mark.css('cssText', 'color: #f66 !important');
      mark.text('廣播:');

      chat.renderPublic(false);
      break;

    case 'alerts':
      mark.css('cssText', 'color: #bbb !important');
      input.css('cssText', 'color: #bbb !important');
      mark.text('和Jarvis說:');

      chat.renderAlerts(false);
      break;

    default:
      throw('chat.chooser was asked to handle unknown button: ' + tt);
  }

  var elm = $('#chat' + tab);
  elm.show();

  if(elm.data('needsScrollTop')) {
    elm.data('ignoreNextScroll', true);
    elm.scrollTop(elm.data('needsScrollTop'));
    elm.data('needsScrollTop', null);
  }
}

window.chat.show = function(name) {
    window.isSmartphone()
        ? $('#updatestatus').hide()
        : $('#updatestatus').show();
    $('#chat, #chatinput').show();

    window.chat.chooseTab(name);
}

window.chat.chooser = function(event) {
  var t = $(event.target);
  var tab = t.text();
  window.chat.chooseTab(tab);
}

// contains the logic to keep the correct scroll position.
window.chat.keepScrollPosition = function(box, scrollBefore, isOldMsgs) {
  // If scrolled down completely, keep it that way so new messages can
  // be seen easily. If scrolled up, only need to fix scroll position
  // when old messages are added. New messages added at the bottom don’t
  // change the view and enabling this would make the chat scroll down
  // for every added message, even if the user wants to read old stuff.

  if(box.is(':hidden') && !isOldMsgs) {
    box.data('needsScrollTop', 99999999);
    return;
  }

  if(scrollBefore === 0 || isOldMsgs) {
    box.data('ignoreNextScroll', true);
    box.scrollTop(box.scrollTop() + (scrollBottom(box)-scrollBefore));
  }
}




//
// setup
//

window.chat.setup = function() {
  if (localStorage['iitc-chat-tab']) {
    chat.chooseTab(localStorage['iitc-chat-tab']);
 }

  $('#chatcontrols, #chat, #chatinput').show();

  $('#chatcontrols a:first').click(window.chat.toggle);
  $('#chatcontrols a').each(function(ind, elm) {
    if($.inArray($(elm).text(), ['all', 'faction', 'alerts']) !== -1)
      $(elm).click(window.chat.chooser);
  });


  $('#chatinput').click(function() {
    $('#chatinput input').focus();
  });

  window.chat.setupTime();
  window.chat.setupPosting();

  $('#chatfaction').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestFaction(true);
    if(scrollBottom(t) === 0) chat.requestFaction(false);
  });

  $('#chatall').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestPublic(true);
    if(scrollBottom(t) === 0) chat.requestPublic(false);
  });

  $('#chatalerts').scroll(function() {
    var t = $(this);
    if(t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if(t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) chat.requestAlerts(true);
    if(scrollBottom(t) === 0) chat.requestAlerts(false);
  });

  window.requests.addRefreshFunction(chat.request);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';
  $('#chatinput mark').addClass(cls);

  $(document).on('click', '.nickname', function(event) {
    return window.chat.nicknameClicked(event, $(this).text());
  });
}


window.chat.setupTime = function() {
  var inputTime = $('#chatinput time');
  var updateTime = function() {
    if(window.isIdle()) return;
    var d = new Date();
    var h = d.getHours() + ''; if(h.length === 1) h = '0' + h;
    var m = d.getMinutes() + ''; if(m.length === 1) m = '0' + m;
    inputTime.text(h+':'+m);
    // update ON the minute (1ms after)
    setTimeout(updateTime, (60 - d.getSeconds()) * 1000 + 1);
  };
  updateTime();
  window.addResumeFunction(updateTime);
}


//
// posting
//


window.chat.setupPosting = function() {
  if (!isSmartphone()) {
    $('#chatinput input').keydown(function(event) {
      try {
        var kc = (event.keyCode ? event.keyCode : event.which);
        if(kc === 13) { // enter
          chat.postMsg();
          event.preventDefault();
        } else if (kc === 9) { // tab
          event.preventDefault();
          window.chat.handleTabCompletion();
        }
      } catch(error) {
        console.log(error);
        debug.printStackTrace();
      }
    });
  }

  $('#chatinput').submit(function(event) {
    event.preventDefault();
    chat.postMsg();
  });
}


window.chat.postMsg = function() {
  var c = chat.getActive();
  if(c == 'alerts')
    return alert("Jarvis: A strange game. The only winning move is not to play. How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");

  var msg = $.trim($('#chatinput input').val());
  if(!msg || msg === '') return;

  if(c === 'debug') {
    var result;
    try {
      result = eval(msg);
    } catch(e) {
      if(e.stack) console.error(e.stack);
      throw e; // to trigger native error message
    }
    if(result !== undefined)
      console.log(result.toString());
    return result;
  }

  var latlng = map.getCenter();

  var data = {message: msg,
              latE6: Math.round(latlng.lat*1E6),
              lngE6: Math.round(latlng.lng*1E6),
              tab: c};

  var errMsg = 'Your message could not be delivered. You can copy&' +
               'paste it here and try again if you want:\n\n' + msg;

  window.postAjax('sendPlext', data,
    function(response) {
      if(response.error) alert(errMsg);
      startRefreshTimeout(0.1*1000); //only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a send message
    },
    function() {
      alert(errMsg);
    }
  );

  $('#chatinput input').val('');
}


;

// MAP DATA CACHE ///////////////////////////////////
// cache for map data tiles. 

window.DataCache = function() {
  this.REQUEST_CACHE_FRESH_AGE = 3*60;  // if younger than this, use data in the cache rather than fetching from the server

  this.REQUEST_CACHE_MAX_AGE = 5*60;  // maximum cache age. entries are deleted from the cache after this time

  //NOTE: characters are 16 bits (ECMAScript standard), so divide byte size by two for correct limit
  if (L.Browser.mobile) {
    // on mobile devices, smaller cache size
    this.REQUEST_CACHE_MAX_ITEMS = 300;  // if more than this many entries, expire early
    this.REQUEST_CACHE_MAX_CHARS = 5000000/2; // or more than this total size
  } else {
    // but on desktop, allow more
    this.REQUEST_CACHE_MAX_ITEMS = 1000;  // if more than this many entries, expire early
    this.REQUEST_CACHE_MAX_CHARS = 20000000/2; // or more than this total size
  }

  this._cache = {};
  this._cacheCharSize = 0;

  this._interval = undefined;

}

window.DataCache.prototype.store = function(qk,data,freshTime) {
  // fixme? common behaviour for objects is that properties are kept in the order they're added
  // this is handy, as it allows easy retrieval of the oldest entries for expiring
  // however, this is not guaranteed by the standards, but all our supported browsers work this way

  this.remove(qk);

  var time = new Date().getTime();

  if (freshTime===undefined) freshTime = this.REQUEST_CACHE_FRESH_AGE*1000;
  var expire = time + freshTime;

  var dataStr = JSON.stringify(data);

  this._cacheCharSize += dataStr.length;
  this._cache[qk] = { time: time, expire: expire, dataStr: dataStr };
}

window.DataCache.prototype.remove = function(qk) {
  if (qk in this._cache) {
    this._cacheCharSize -= this._cache[qk].dataStr.length;
    delete this._cache[qk];
  }
}


window.DataCache.prototype.get = function(qk) {
  if (qk in this._cache) return JSON.parse(this._cache[qk].dataStr);
  else return undefined;
}

window.DataCache.prototype.getTime = function(qk) {
  if (qk in this._cache) return this._cache[qk].time;
  else return 0;
}

window.DataCache.prototype.isFresh = function(qk) {
  if (qk in this._cache) {
    var d = new Date();
    var t = d.getTime();
    if (this._cache[qk].expire >= t) return true;
    else return false;
  }

  return undefined;
}

window.DataCache.prototype.startExpireInterval = function(period) {
  if (this._interval === undefined) {
    var savedContext = this;
    this._interval = setInterval (function() { savedContext.runExpire(); }, period*1000);
  }
}

window.DataCache.prototype.stopExpireInterval = function() {
  if (this._interval !== undefined) {
    stopInterval (this._interval);
    this._interval = undefined;
  }
}



window.DataCache.prototype.runExpire = function() {
  var d = new Date();
  var t = d.getTime()-this.REQUEST_CACHE_MAX_AGE*1000;

  var cacheSize = Object.keys(this._cache).length;

  for(var qk in this._cache) {

    // fixme? our MAX_SIZE test here assumes we're processing the oldest first. this relies
    // on looping over object properties in the order they were added. this is true in most browsers,
    // but is not a requirement of the standards
    if (cacheSize > this.REQUEST_CACHE_MAX_ITEMS || this._cacheCharSize > this.REQUEST_CACHE_MAX_CHARS || this._cache[qk].time < t) {
      this._cacheCharSize -= this._cache[qk].dataStr.length;
      delete this._cache[qk];
      cacheSize--;
    }
  }
}


window.DataCache.prototype.debug = function() {
//NOTE: ECMAScript strings use 16 bit chars (it's in the standard), so convert for bytes/Kb
  return 'Cache: '+Object.keys(this._cache).length+' items, '+(this._cacheCharSize*2).toLocaleString()+' bytes ('+Math.ceil(this._cacheCharSize/512).toLocaleString()+'K)';
}


;


// DEBUGGING TOOLS ///////////////////////////////////////////////////
// meant to be used from browser debugger tools and the like.

window.debug = function() {}

window.debug.renderDetails = function() {
  console.log('portals: ' + Object.keys(window.portals).length);
  console.log('links:   ' + Object.keys(window.links).length);
  console.log('fields:  ' + Object.keys(window.fields).length);
}

window.debug.printStackTrace = function() {
  var e = new Error('dummy');
  console.log(e.stack);
  return e.stack;
}



window.debug.console = function() {
  $('#debugconsole').text();
}

window.debug.console.show = function() {
    $('#chat, #chatinput').show();
    window.debug.console.create();
    $('#chatinput mark').css('cssText', 'color: #bbb !important').text('debug:');
    $('#chat > div').hide();
    $('#debugconsole').show();
    $('#chatcontrols .active').removeClass('active');
    $("#chatcontrols a:contains('debug')").addClass('active');
}

window.debug.console.create = function() {
  if($('#debugconsole').length) return;
  $('#chatcontrols').append('<a>debug</a>');
  $('#chatcontrols a:last').click(window.debug.console.show);
  $('#chat').append('<div style="display: none" id="debugconsole"><table></table></div>');
}

window.debug.console.renderLine = function(text, errorType) {
  debug.console.create();
  switch(errorType) {
    case 'error':   var color = '#FF424D'; break;
    case 'warning': var color = '#FFDE42'; break;
    default:        var color = '#eee';
  }
  if(typeof text !== 'string' && typeof text !== 'number') {
    var cache = [];
    text = JSON.stringify(text, function(key, value) {
      if(typeof value === 'object' && value !== null) {
        if(cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    });
    cache = null;
  }
  var d = new Date();
  var ta = d.toLocaleTimeString(); // print line instead maybe?
  var tb = d.toLocaleString();
  var t = '<time title="'+tb+'" data-timestamp="'+d.getTime()+'">'+ta+'</time>';
  var s = 'style="color:'+color+'"';
  var l = '<tr><td>'+t+'</td><td><mark '+s+'>'+errorType+'</mark></td><td>'+text+'</td></tr>';
  $('#debugconsole table').prepend(l);
}

window.debug.console.log = function(text) {
  debug.console.renderLine(text, 'notice');
}

window.debug.console.warn = function(text) {
  debug.console.renderLine(text, 'warning');
}

window.debug.console.error = function(text) {
  debug.console.renderLine(text, 'error');
}

window.debug.console.overwriteNative = function() {
  window.debug.console.create();

  var nativeConsole = window.console;
  window.console = {};

  function overwrite(which) {
    window.console[which] = function() {
      nativeConsole[which].apply(nativeConsole, arguments);
      window.debug.console[which].apply(window.debug.console, arguments);
    }
  }

  overwrite("log");
  overwrite("warn");
  overwrite("error");
}

window.debug.console.overwriteNativeIfRequired = function() {
  if(!window.console || L.Browser.mobile)
    window.debug.console.overwriteNative();
}


;

// DIALOGS /////////////////////////////////////////////////////////
// Inspired by TES III: Morrowind. Long live House Telvanni. ///////
////////////////////////////////////////////////////////////////////

/* The global ID of onscreen dialogs.
 * Starts at 0.
 */
window.DIALOG_ID = 0;

/* All onscreen dialogs, keyed by their ID.
 */
window.DIALOGS = {};

/* The number of dialogs on screen.
 */
window.DIALOG_COUNT = 0;

/* The dialog that has focus.
 */
window.DIALOG_FOCUS = null;

/* Controls how quickly the slide toggle animation
 * should play for dialog collapsing and expanding.
 */
window.DIALOG_SLIDE_DURATION = 100;

/* Creates a dialog and puts it onscreen. Takes one argument: options, a JS object.
 * == Common options
 * (text|html): The text or HTML to display in the dialog. Text is auto-converted to HTML.
 * title: The dialog's title.
 * modal: Whether to open a modal dialog. Implies draggable=false; dialogClass='ui-dialog-modal'.
 *        Please note that modal dialogs hijack the entire screen and should only be used in very
 *        specific cases. (If IITC is running on mobile, modal will always be true).
 * id:   A unique ID for this dialog. If a dialog with id `id' is already open and dialog() is called
 *       again, it will be automatically closed.
 *
 * == Callbacks
 * closeCallback: A callback to run on close. Takes no arguments.
 * collapseCallback: A callback to run on dialog collapse.  Takes no arguments.
 * expandCallback:   A callback to run on dialog expansion. Takes no arguments.
 * collapseExpandCallback: A callback to run on both collapse and expand (overrides collapseCallback
 *                         and expandCallback, takes a boolean argument `collapsing' - true if collapsing;
 *                         false if expanding)
 * focusCallback: A callback to run when the dialog gains focus.
 * blurCallback:  A callback to run when the dialog loses focus.
 *
 * See http://docs.jquery.com/UI/API/1.8/Dialog for a list of all the options. If you previously
 * applied a class to your dialog after creating it with alert(), dialogClass may be particularly
 * useful.
 */
window.dialog = function(options) {
  // Override for smartphones. Preserve default behavior and create a modal dialog.
  options = options || {};

  // Build an identifier for this dialog
  var id = 'dialog-' + (options.modal ? 'modal' : (options.id ? options.id : 'anon-' + window.DIALOG_ID++));
  var jqID = '#' + id;
  var html = '';

  // hint for iitc mobile that a dialog was opened
  if (typeof android !== 'undefined' && android && android.dialogOpened) {
    android.dialogOpened(id, true);
  }

  // Convert text to HTML if necessary
  if(options.text) {
    html = window.convertTextToTableMagic(options.text);
  } else if(options.html) {
    html = options.html;
  } else {
    console.log('window.dialog: warning: no text in dialog');
    html = window.convertTextToTableMagic('');
  }

  // Modal dialogs should not be draggable
  if(options.modal) {
    options.dialogClass = (options.dialogClass ? options.dialogClass + ' ' : '') + 'ui-dialog-modal';
    options.draggable = false;
  }

  // Close out existing dialogs.
  if(window.DIALOGS[id]) {
    try {
      var selector = $(window.DIALOGS[id]);
      selector.dialog('close');
      selector.remove();
    } catch(err) {
      console.log('window.dialog: Tried to close nonexistent dialog ' + id);
    }
  }

  // there seems to be a bug where width/height are set to a fixed value after moving a dialog
  function sizeFix() {
    if(dialog.data('collapsed')) return;

    var options = dialog.dialog('option');
    dialog.dialog('option', 'height', options.height);
    dialog.dialog('option', 'width', options.width);
  }

  // Create the window, appending a div to the body
  $('body').append('<div id="' + id + '"></div>');
  var dialog = $(jqID).dialog($.extend(true, {
    autoOpen: false,
    modal: false,
    draggable: true,
    closeText: '&nbsp;',
    title: '',
    buttons: {
      '確定': function() {
        $(this).dialog('close');
      }
    },
    open: function() {
      var titlebar = $(this).closest('.ui-dialog').find('.ui-dialog-titlebar');
      titlebar.find('.ui-dialog-title').addClass('ui-dialog-title-active');
      var close = titlebar.find('.ui-dialog-titlebar-close');

      // Title should not show up on mouseover
      close.removeAttr('title').addClass('ui-dialog-titlebar-button');

      if(!$(this).dialog('option', 'modal')) {
        // Start out with a cloned version of the close button
        var collapse = close.clone();

        // Change it into a collapse button and set the click handler
        collapse.addClass('ui-dialog-titlebar-button-collapse ui-dialog-titlebar-button-collapse-expanded');
        collapse.click($.proxy(function() {
          var collapsed = ($(this).data('collapsed') === true);

          // Run callbacks if we have them
          if($(this).data('collapseExpandCallback')) {
            $.proxy($(this).data('collapseExpandCallback'), this)(!collapsed);
          } else {
            if(!collapsed && $(this).data('collapseCallback')) {
              $.proxy($(this).data('collapseCallback'), this)();
            } else if (collapsed && $(this).data('expandCallback')) {
              $.proxy($(this).data('expandCallback'), this)();
            }
          }

          // Find the button pane and content dialog in this ui-dialog, and add or remove the 'hidden' class.
          var dialog   = $(this).closest('.ui-dialog');
          var selector = dialog.find('.ui-dialog-content,.ui-dialog-buttonpane');
          var button   = dialog.find('.ui-dialog-titlebar-button-collapse');

          // Slide toggle
          $(this).css('height', '');
          $(selector).slideToggle({duration: window.DIALOG_SLIDE_DURATION, complete: sizeFix});

          if(collapsed) {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-collapsed');
            $(button).addClass('ui-dialog-titlebar-button-collapse-expanded');
          } else {
            $(button).removeClass('ui-dialog-titlebar-button-collapse-expanded');
            $(button).addClass('ui-dialog-titlebar-button-collapse-collapsed');
          }

          // Toggle collapsed state
          $(this).data('collapsed', !collapsed);
        }, this));

        // Put it into the titlebar
        titlebar.prepend(collapse);
        close.addClass('ui-dialog-titlebar-button-close');
      }

      window.DIALOGS[$(this).data('id')] = this;
      window.DIALOG_COUNT++;

      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') opened. ' + window.DIALOG_COUNT + ' remain.');
    },
    close: function() {
      // Run the close callback if we have one
      if($(this).data('closeCallback')) {
        $.proxy($(this).data('closeCallback'), this)();
      }

      // Make sure that we don't keep a dead dialog in focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') === $(this).data('id')) {
        window.DIALOG_FOCUS = null;
      }

      // Finalize
      delete window.DIALOGS[$(this).data('id')];

      window.DIALOG_COUNT--;
      console.log('window.dialog: ' + $(this).data('id') + ' (' + $(this).dialog('option', 'title') + ') closed. ' + window.DIALOG_COUNT + ' remain.');
      // hint for iitc mobile that a dialog was closed
      if (typeof android !== 'undefined' && android && android.dialogOpened) {
        android.dialogOpened(id, false);
      }

      // remove from DOM and destroy
      $(this).dialog('destroy').remove();
    },
    focus: function() {
      if($(this).data('focusCallback')) {
        $.proxy($(this).data('focusCallback'), this)();
      }

      // Blur the window currently in focus unless we're gaining focus
      if(window.DIALOG_FOCUS && $(window.DIALOG_FOCUS).data('id') !== $(this).data('id')) {
        $.proxy(function(event, ui) {
          if($(this).data('blurCallback')) {
            $.proxy($(this).data('blurCallback'), this)();
          }

          $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-active').addClass('ui-dialog-title-inactive');
        }, window.DIALOG_FOCUS)();
      }

      // This dialog is now in focus
      window.DIALOG_FOCUS = this;
      // hint for iitc mobile that a dialog was focused
      if (typeof android !== 'undefined' && android && android.dialogFocused) {
        android.dialogFocused($(window.DIALOG_FOCUS).data('id'));
      }
      $(this).closest('.ui-dialog').find('.ui-dialog-title').removeClass('ui-dialog-title-inactive').addClass('ui-dialog-title-active');
    }
  }, options));

  dialog.on('dialogdragstop dialogresizestop', sizeFix);

  // Set HTML and IDs
  dialog.html(html);
  dialog.data('id', id);
  dialog.data('jqID', jqID);

  // Set callbacks
  dialog.data('closeCallback', options.closeCallback);
  dialog.data('collapseCallback', options.collapseCallback);
  dialog.data('expandCallback', options.expandCallback);
  dialog.data('collapseExpandCallback', options.collapseExpandCallback);
  dialog.data('focusCallback', options.focusCallback);
  dialog.data('blurCallback', options.blurCallback);

  if(options.modal) {
    // ui-modal includes overrides for modal dialogs
    dialog.parent().addClass('ui-modal');
  } else {
    // Enable snapping
    dialog.dialog().parents('.ui-dialog').draggable('option', 'snap', true);
  }

  // Run it
  dialog.dialog('open');

  return dialog;
}

/* Creates an alert dialog with default settings.
 * If you want more configurability, use window.dialog instead.
 */
window.alert = function(text, isHTML, closeCallback) {
  var obj = {closeCallback: closeCallback};
  if(isHTML) {
    obj.html = text;
  } else {
    obj.text = text;
  }

  return dialog(obj);
}

window.setupDialogs = function() {
  window.DIALOG_ID = 0;
  window.DIALOGS   = {}
  window.DIALOG_COUNT = 0;
  window.DIALOG_FOCUS = null;
}


;

// decode the on-network array entity format into an object format closer to that used before
// makes much more sense as an object, means that existing code didn't need to change, and it's what the
// stock intel site does internally too (the array format is only on the network)


// anonymous wrapper function
(function(){
  window.decodeArray = function(){};


  function parseMod(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      name: arr[1],
      rarity: arr[2],
      stats: arr[3],
    };
  }
  function parseResonator(arr) {
    if(arr == null) { return null; }
    return {
      owner: arr[0],
      level: arr[1],
      energy: arr[2],
    };
  }
  function parseArtifactBrief(arr) {
    if (arr === null) return null;

    // array index 0 is for fragments at the portal. index 1 is for target portals
    // each of those is two dimensional - not sure why. part of this is to allow for multiple types of artifacts,
    // with their own targets, active at once - but one level for the array is enough for that

    // making a guess - first level is for different artifact types, second index would allow for
    // extra data for that artifact type

    function decodeArtifactArray(arr) {
      var result = {};
      for (var i=0; i<arr.length; i++) {
        // we'll use the type as the key - and store any additional array values as the value
        // that will be an empty array for now, so only object keys are useful data
        result[arr[i][0]] = arr[i].slice(1);
      }
      return result;
    }

    return {
      fragment: decodeArtifactArray(arr[0]),
      target: decodeArtifactArray(arr[1]),
    };
  }

  function parseArtifactDetail(arr) {
    if (arr == null) { return null; }
    // empty artifact data is pointless - ignore it
    if (arr.length == 3 && arr[0] == "" && arr[1] == "" && arr[2].length == 0) { return null; }
    return {
      type: arr[0],
      displayName: arr[1],
      fragments: arr[2],
    };
  }


//there's also a 'placeholder' portal - generated from the data in links/fields. only has team/lat/lng

  var CORE_PORTA_DATA_LENGTH = 4;
  function corePortalData(a) {
    return {
      // a[0] == type (always 'p')
      team:          a[1],
      latE6:         a[2],
      lngE6:         a[3]
    }
  };

  var SUMMARY_PORTAL_DATA_LENGTH = 14;
  function summaryPortalData(a) {
    return {
      level:         a[4],
      health:        a[5],
      resCount:      a[6],
      image:         a[7],
      title:         a[8],
      ornaments:     a[9],
      mission:       a[10],
      mission50plus: a[11],
      artifactBrief: parseArtifactBrief(a[12]),
      timestamp:     a[13]
    };
  };

  var DETAILED_PORTAL_DATA_LENGTH = SUMMARY_PORTAL_DATA_LENGTH+4;


  window.decodeArray.portalSummary = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalSUmmary - not a portal';

    if (a.length == CORE_PORTA_DATA_LENGTH) {
      return corePortalData(a);
    }

    // NOTE: allow for either summary or detailed portal data to be passed in here, as details are sometimes
    // passed into code only expecting summaries
    if (a.length != SUMMARY_PORTAL_DATA_LENGTH && a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal summary length changed - portal details likely broken!');
      debugger;
    }

    return $.extend(corePortalData(a), summaryPortalData(a));
  }

  window.decodeArray.portalDetail = function(a) {
    if (!a) return undefined;

    if (a[0] != 'p') throw 'Error: decodeArray.portalDetail - not a portal';

    if (a.length != DETAILED_PORTAL_DATA_LENGTH) {
      console.warn('Portal detail length changed - portal details may be wrong');
      debugger;
    }

    //TODO look at the array values, make a better guess as to which index the mods start at, rather than using the hard-coded SUMMARY_PORTAL_DATA_LENGTH constant


    // the portal details array is just an extension of the portal summary array
    // to allow for niantic adding new items into the array before the extended details start,
    // use the length of the summary array
    return $.extend(corePortalData(a), summaryPortalData(a),{
      mods:      a[SUMMARY_PORTAL_DATA_LENGTH+0].map(parseMod),
      resonators:a[SUMMARY_PORTAL_DATA_LENGTH+1].map(parseResonator),
      owner:     a[SUMMARY_PORTAL_DATA_LENGTH+2],
      artifactDetail:  parseArtifactDetail(a[SUMMARY_PORTAL_DATA_LENGTH+3]),
    });
    
  }


})();


;



// ENTITY DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of an entity (i.e.
// portal, link, field) and they will return useful data.


// given the entity detail data, returns the team the entity belongs
// to. Uses TEAM_* enum values.
window.getTeam = function(details) {
  return teamStringToId(details.team);
}

window.teamStringToId = function(teamStr) {
  var team = TEAM_NONE;
  if(teamStr === 'ENLIGHTENED') team = TEAM_ENL;
  if(teamStr === 'RESISTANCE') team = TEAM_RES;
  if(teamStr === 'E') team = TEAM_ENL;
  if(teamStr === 'R') team = TEAM_RES;
  return team;
}




;

﻿// as of 2014-08-14, Niantic have returned to minifying the javascript. This means we no longer get the nemesis object
// and it's various member objects, functions, etc.
// so we need to extract some essential parameters from the code for IITC to use

window.extractFromStock = function() {
  window.niantic_params = {}

  // extract the former nemesis.dashboard.config.CURRENT_VERSION from the code
  var reVersion = new RegExp('"X-CSRFToken".*[a-z].v="([a-f0-9]{40})";');

  var minified = new RegExp('^[a-zA-Z$][a-zA-Z$0-9]?$');

  for (var topLevel in window) {
    if (minified.test(topLevel)) {
      // a minified object - check for minified prototype entries

      var topObject = window[topLevel];
      if (topObject && topObject.prototype) {

        // the object has a prototype - iterate through the properties of that
        for (var secLevel in topObject.prototype) {
          if (minified.test(secLevel)) {
            // looks like we've found an object of the format "XX.prototype.YY"...
            var item = topObject.prototype[secLevel];

            if (item && typeof(item) == "function") {
              // a function - test it against the relevant regular expressions
              var funcStr = item.toString();

              var match = reVersion.exec(funcStr);
              if (match) {
                console.log('Found former CURRENT_VERSION in '+topLevel+'.prototype.'+secLevel);
                niantic_params.CURRENT_VERSION = match[1];
              }
            }
          }
        }

      } //end 'if .prototype'

      if (topObject && Array.isArray && Array.isArray(topObject)) {
        // find all non-zero length arrays containing just numbers
        if (topObject.length>0) {
          var justInts = true;
          for (var i=0; i<topObject.length; i++) {
            if (typeof(topObject[i]) !== 'number' || topObject[i] != parseInt(topObject[i])) {
              justInts = false;
              break;
            }
          }
          if (justInts) {

            // current lengths are: 17: ZOOM_TO_LEVEL, 14: TILES_PER_EDGE
            // however, slightly longer or shorter are a possibility in the future

            if (topObject.length >= 12 && topObject.length <= 18) {
              // a reasonable array length for tile parameters
              // need to find two types:
              // a. portal level limits. decreasing numbers, starting at 8
              // b. tiles per edge. increasing numbers. current max is 36000, 9000 was the previous value - 18000 is a likely possibility too

              if (topObject[0] == 8) {
                // check for tile levels
                var decreasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] < topObject[i]) {
                    decreasing = false;
                    break;
                  }
                }
                if (decreasing) {
                  console.log ('int array '+topLevel+' looks like ZOOM_TO_LEVEL: '+JSON.stringify(topObject));
                  window.niantic_params.ZOOM_TO_LEVEL = topObject;
                }
              } // end if (topObject[0] == 8)

              // 2015-06-25 - changed to top value of 64000, then to 32000 - allow for them to restore it just in case
              if (topObject[topObject.length-1] >= 9000 && topObject[topObject.length-1] <= 64000) {
                var increasing = true;
                for (var i=1; i<topObject.length; i++) {
                  if (topObject[i-1] > topObject[i]) {
                    increasing = false;
                    break;
                  }
                }
                if (increasing) {
                  console.log ('int array '+topLevel+' looks like TILES_PER_EDGE: '+JSON.stringify(topObject));
                  window.niantic_params.TILES_PER_EDGE = topObject;
                }

              } //end if (topObject[topObject.length-1] == 9000) {

            }
          }
        }
      }


    }
  }


  if (niantic_params.CURRENT_VERSION === undefined) {
    dialog({
      title: 'IITC 死掉了',
      html: '<p>IITC從intel網站未能擷取所需的參數</p>'
           +'<p>這種現象可能是Niantic更新intel網站造成的. 需要由IITC開發人員進行修復.</p>',
    });

    console.log('Discovered parameters');
    console.log(JSON.stringify(window.niantic_params,null,2));

    throw('Error: IITC failed to extract CURRENT_VERSION string - cannot continue');
  }

}



;


// GAME STATUS ///////////////////////////////////////////////////////
// MindUnit display


window.updateGameScore = function(data) {
  if(!data) {
    // move the postAjax call onto a very short timer. this way, if it throws an exception, it won't prevent IITC booting
    setTimeout (function() { window.postAjax('getGameScore', {}, window.updateGameScore); }, 1);
    return;
  }

  if (data && data.result) {

    var e = parseInt(data.result[0]); //enlightened score in result[0]
    var r = parseInt(data.result[1]); //resistance score in result[1]
    var s = r+e;
    var rp = r/s*100, ep = e/s*100;
    r = digits(r), e = digits(e);
    var rs = '<span class="res" style="width:'+rp+'%;">'+Math.round(rp)+'%&nbsp;</span>';
    var es = '<span class="enl" style="width:'+ep+'%;">&nbsp;'+Math.round(ep)+'%</span>';
    $('#gamestat').html(rs+es).one('click', function() { window.updateGameScore() });
    // help cursor via “#gamestat span”
    $('#gamestat').attr('title', '反抗軍:\t'+r+' MindUnits\n啟蒙軍:\t'+e+' MindUnits');
  } else if (data && data.error) {
    console.warn('game score failed to load: '+data.error);
  } else {
    console.warn('game score failed to load - unknown reason');
  }

  // TODO: idle handling - don't refresh when IITC is idle!
  window.setTimeout('window.updateGameScore', REFRESH_GAME_SCORE*1000);
}


;

// PLUGIN HOOKS ////////////////////////////////////////////////////////
// Plugins may listen to any number of events by specifying the name of
// the event to listen to and handing a function that should be exe-
// cuted when an event occurs. Callbacks will receive additional data
// the event created as their first parameter. The value is always a
// hash that contains more details.
//
// For example, this line will listen for portals to be added and print
// the data generated by the event to the console:
// window.addHook('portalAdded', function(data) { console.log(data) });
//
// Boot hook: booting is handled differently because IITC may not yet
//            be available. Have a look at the plugins in plugins/. All
//            code before “// PLUGIN START” and after “// PLUGIN END” is
//            required to successfully boot the plugin.
//
// Here’s more specific information about each event:
// portalSelected: called when portal on map is selected/unselected.
//              Provide guid of selected and unselected portal.
// mapDataRefreshStart: called when we start refreshing map data
// mapDataEntityInject: called just as we start to render data. has callback to inject cached entities into the map render
// mapDataRefreshEnd: called when we complete the map data load
// portalAdded: called when a portal has been received and is about to
//              be added to its layer group. Note that this does NOT
//              mean it is already visible or will be, shortly after.
//              If a portal is added to a hidden layer it may never be
//              shown at all. Injection point is in
//              code/map_data.js#renderPortal near the end. Will hand
//              the Leaflet CircleMarker for the portal in "portal" var.
// linkAdded:   called when a link is about to be added to the map
// fieldAdded:  called when a field is about to be added to the map
// portalDetailsUpdated: fired after the details in the sidebar have
//              been (re-)rendered Provides data about the portal that
//              has been selected.
// publicChatDataAvailable: this hook runs after data for any of the
//              public chats has been received and processed, but not
//              yet been displayed. The data hash contains both the un-
//              processed raw ajax response as well as the processed
//              chat data that is going to be used for display.
// factionChatDataAvailable: this hook runs after data for the faction
//              chat has been received and processed, but not yet been
//              displayed. The data hash contains both the unprocessed
//              raw ajax response as well as the processed chat data
//              that is going to be used for display.
// requestFinished: DEPRECATED: best to use mapDataRefreshEnd instead
//              called after each map data request finished. Argument is
//              {success: boolean} indicated the request success or fail.
// iitcLoaded: called after IITC and all plugins loaded
// portalDetailLoaded: called when a request to load full portal detail
//              completes. guid, success, details parameters
// paneChanged  called when the current pane has changed. On desktop,
//              this only selects the current chat pane; on mobile, it
//              also switches between map, info and other panes defined
//              by plugins
// artifactsUpdated: called when the set of artifacts (including targets)
//              has changed. Parameters names are old, new.

window._hooks = {}
window.VALID_HOOKS = [
  'portalSelected', 'portalDetailsUpdated', 'artifactsUpdated',
  'mapDataRefreshStart', 'mapDataEntityInject', 'mapDataRefreshEnd',
  'portalAdded', 'linkAdded', 'fieldAdded',
  'publicChatDataAvailable', 'factionChatDataAvailable',
  'requestFinished', 'nicknameClicked',
  'geoSearch', 'search', 'iitcLoaded',
  'portalDetailLoaded', 'paneChanged'];

window.runHooks = function(event, data) {
  if(VALID_HOOKS.indexOf(event) === -1) throw('Unknown event type: ' + event);

  if(!_hooks[event]) return true;
  var interrupted = false;
  $.each(_hooks[event], function(ind, callback) {
    try {
      if (callback(data) === false) {
        interrupted = true;
        return false;  //break from $.each
      }
    } catch(err) {
      console.error('error running hook '+event+', error: '+err);
      debugger;
    }
  });
  return !interrupted;
}

// helper method to allow plugins to create new hooks
window.pluginCreateHook = function(event) {
  if($.inArray(event, window.VALID_HOOKS) < 0) {
    window.VALID_HOOKS.push(event);
  }
}


window.addHook = function(event, callback) {
  if(VALID_HOOKS.indexOf(event) === -1) {
    console.error('addHook: Unknown event type: ' + event + ' - ignoring');
    debugger;
    return;
  }

  if(typeof callback !== 'function') throw('Callback must be a function.');

  if(!_hooks[event])
    _hooks[event] = [callback];
  else
    _hooks[event].push(callback);
}

// callback must the SAME function to be unregistered.
window.removeHook = function(event, callback) {
  if (typeof callback !== 'function') throw('Callback must be a function.');

  if (_hooks[event]) {
    var index = _hooks[event].indexOf(callback);
    if(index == -1)
      console.warn('Callback wasn\'t registered for this event.');
    else
      _hooks[event].splice(index, 1);
  }
}


;

// IDLE HANDLING /////////////////////////////////////////////////////

window.idleTime = 0; // in seconds
window._idleTimeLimit = MAX_IDLE_TIME;

var IDLE_POLL_TIME = 10;

var idlePoll = function() {
  var wasIdle = isIdle();
  window.idleTime += IDLE_POLL_TIME;

  var hidden = (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden || false);
  if (hidden) {
    window._idleTimeLimit = window.REFRESH; // set a small time limit before entering idle mode
  }
  if (!wasIdle && isIdle()) {
    console.log('idlePoll: entering idle mode');
  }
}

setInterval(idlePoll, IDLE_POLL_TIME*1000);

window.idleReset = function () {
  // update immediately when the user comes back
  if(isIdle()) {
    console.log ('idleReset: leaving idle mode');
    window.idleTime = 0;
    $.each(window._onResumeFunctions, function(ind, f) {
      f();
    });
  }
  window.idleTime = 0;
  window._idleTimeLimit = MAX_IDLE_TIME;
};

window.idleSet = function() {
  var wasIdle = isIdle();

  window._idleTimeLimit = 0; // a zero time here will cause idle to start immediately

  if (!wasIdle && isIdle()) {
    console.log ('idleSet: entering idle mode');
  }
}


// only reset idle on mouse move where the coordinates are actually different.
// some browsers send the event when not moving!
var _lastMouseX=-1, _lastMouseY=-1;
var idleMouseMove = function(e) {
  var dX = _lastMouseX-e.clientX;
  var dY = _lastMouseY-e.clientY;
  var deltaSquared = dX*dX + dY*dY;
  // only treat movements over 3 pixels as enough to reset us
  if (deltaSquared > 3*3) {
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    idleReset();
  }
}

window.setupIdle = function() {
  $('body').keypress(idleReset);
  $('body').mousemove(idleMouseMove);
}


window.isIdle = function() {
  return window.idleTime >= window._idleTimeLimit;
}

window._onResumeFunctions = [];

// add your function here if you want to be notified when the user
// resumes from being idle
window.addResumeFunction = function(f) {
  window._onResumeFunctions.push(f);
}


;


// LOCATION HANDLING /////////////////////////////////////////////////
// i.e. setting initial position and storing new position after moving

// retrieves current position from map and stores it cookies
window.storeMapPosition = function() {
  var m = window.map.getCenter();

  if(m['lat'] >= -90  && m['lat'] <= 90)
    writeCookie('ingress.intelmap.lat', m['lat']);

  if(m['lng'] >= -180 && m['lng'] <= 180)
    writeCookie('ingress.intelmap.lng', m['lng']);

  writeCookie('ingress.intelmap.zoom', window.map.getZoom());
}


// either retrieves the last shown position from a cookie, from the
// URL or if neither is present, via Geolocation. If that fails, it
// returns a map that shows the whole world.
window.getPosition = function() {
  if(getURLParam('latE6') && getURLParam('lngE6')) {
    console.log("mappos: reading email URL params");
    var lat = parseInt(getURLParam('latE6'))/1E6 || 0.0;
    var lng = parseInt(getURLParam('lngE6'))/1E6 || 0.0;
    var z = parseInt(getURLParam('z')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  if(getURLParam('ll')) {
    console.log("mappos: reading stock Intel URL params");
    var lat = parseFloat(getURLParam('ll').split(",")[0]) || 0.0;
    var lng = parseFloat(getURLParam('ll').split(",")[1]) || 0.0;
    var z = parseInt(getURLParam('z')) || 17;
    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  if(readCookie('ingress.intelmap.lat') && readCookie('ingress.intelmap.lng')) {
    console.log("mappos: reading cookies");
    var lat = parseFloat(readCookie('ingress.intelmap.lat')) || 0.0;
    var lng = parseFloat(readCookie('ingress.intelmap.lng')) || 0.0;
    var z = parseInt(readCookie('ingress.intelmap.zoom')) || 17;

    if(lat < -90  || lat > 90) lat = 0.0;
    if(lng < -180 || lng > 180) lng = 0.0;

    return {center: new L.LatLng(lat, lng), zoom: z};
  }

  setTimeout("window.map.locate({setView : true});", 50);

  return {center: new L.LatLng(0.0, 0.0), zoom: 1};
}


;

// MAP DATA REQUEST CALCULATORS //////////////////////////////////////
// Ingress Intel splits up requests for map data (portals, links,
// fields) into tiles. To get data for the current viewport (i.e. what
// is currently visible) it first calculates which tiles intersect.
// For all those tiles, it then calculates the lat/lng bounds of that
// tile and a quadkey. Both the bounds and the quadkey are “somewhat”
// required to get complete data.
//
// Conversion functions courtesy of
// http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames


window.setupDataTileParams = function() {
  // default values - used to fall back to if we can't detect those used in stock intel
  var DEFAULT_ZOOM_TO_TILES_PER_EDGE = [1,1,1,40,40,80,80,320,1000,2000,2000,4000,8000,16000,16000,32000];
  var DEFAULT_ZOOM_TO_LEVEL = [8,8,8,8,7,7,7,6,6,5,4,4,3,2,2,1,1];

  // stock intel doesn't have this array (they use a switch statement instead), but this is far neater
  var DEFAULT_ZOOM_TO_LINK_LENGTH = [200000,200000,200000,200000,200000,60000,60000,10000,5000,2500,2500,800,300,0,0];

  window.TILE_PARAMS = {};

  // not in stock to detect - we'll have to assume the above values...
  window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH = DEFAULT_ZOOM_TO_LINK_LENGTH;


  if (niantic_params.ZOOM_TO_LEVEL && niantic_params.TILES_PER_EDGE) {
    window.TILE_PARAMS.ZOOM_TO_LEVEL = niantic_params.ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = niantic_params.TILES_PER_EDGE;


    // lazy numerical array comparison
    if ( JSON.stringify(niantic_params.ZOOM_TO_LEVEL) != JSON.stringify(DEFAULT_ZOOM_TO_LEVEL)) {
      console.warn('Tile parameter ZOOM_TO_LEVEL have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }
    if ( JSON.stringify(niantic_params.TILES_PER_EDGE) != JSON.stringify(DEFAULT_ZOOM_TO_TILES_PER_EDGE)) {
      console.warn('Tile parameter TILES_PER_EDGE have changed in stock intel. Detected correct values, but code should be updated');
      debugger;
    }

  } else {
    dialog({
      title: 'IITC Warning',
      html: "<p>IITC failed to detect the ZOOM_TO_LEVEL and/or TILES_PER_EDGE settings from the stock intel site.</p>"
           +"<p>IITC is now using fallback default values. However, if detection has failed it's likely the values have changed."
           +" IITC may not load the map if these default values are wrong.</p>",
    });

    window.TILE_PARAMS.ZOOM_TO_LEVEL = DEFAULT_ZOOM_TO_LEVEL;
    window.TILE_PARAMS.TILES_PER_EDGE = DEFAULT_ZOOM_TO_TILES_PER_EDGE;
  }

  // 2015-07-01: niantic added code to the stock site that overrides the min zoom level for unclaimed portals to 15 and above
  // instead of updating the zoom-to-level array. makes no sense really....
  // we'll just chop off the array at that point, so the code defaults to level 0 (unclaimed) everywhere...
  window.TILE_PARAMS.ZOOM_TO_LEVEL = window.TILE_PARAMS.ZOOM_TO_LEVEL.slice(0,15);

}


window.debugMapZoomParameters = function() {

  //for debug purposes, log the tile params used for each zoom level
  console.log('DEBUG: Map Zoom Parameters');
  var doneZooms = {};
  for (var z=MIN_ZOOM; z<=21; z++) {
    var ourZoom = getDataZoomForMapZoom(z);
    console.log('DEBUG: map zoom '+z+': IITC requests '+ourZoom+(ourZoom!=z?' instead':''));
    if (!doneZooms[ourZoom]) {
      var params = getMapZoomTileParameters(ourZoom);
      var msg = 'DEBUG: data zoom '+ourZoom;
      if (params.hasPortals) {
        msg += ' has portals, L'+params.level+'+';
      } else {
        msg += ' NO portals (was L'+params.level+'+)';
      }
      msg += ', minLinkLength='+params.minLinkLength;
      msg += ', tiles per edge='+params.tilesPerEdge;
      console.log(msg);
      doneZooms[ourZoom] = true;
    }
  }
}



window.getMapZoomTileParameters = function(zoom) {


  // the current API allows the client to request a minimum portal level. the window.TILE_PARAMS.ZOOM_TO_LEVEL list are minimums
  // however, in my view, this can return excessive numbers of portals in many cases. let's try an optional reduction
  // of detail level at some zoom levels

  var level = window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0;  // default to level 0 (all portals) if not in array

//  if (window.CONFIG_ZOOM_SHOW_LESS_PORTALS_ZOOMED_OUT) {
//    if (level <= 7 && level >= 4) {
//      // reduce portal detail level by one - helps reduce clutter
//      level = level+1;
//    }
//  }

  var maxTilesPerEdge = window.TILE_PARAMS.TILES_PER_EDGE[window.TILE_PARAMS.TILES_PER_EDGE.length-1];

  return {
    level: level,
    maxLevel: window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0,  // for reference, for log purposes, etc
    tilesPerEdge: window.TILE_PARAMS.TILES_PER_EDGE[zoom] || maxTilesPerEdge,
    minLinkLength: window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH[zoom] || 0,
    hasPortals: zoom >= window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH.length,  // no portals returned at all when link length limits things
    zoom: zoom  // include the zoom level, for reference
  };
}


window.getDataZoomForMapZoom = function(zoom) {
  // we can fetch data at a zoom level different to the map zoom.

  //NOTE: the specifics of this are tightly coupled with the above ZOOM_TO_LEVEL and TILES_PER_EDGE arrays

  // firstly, some of IITCs zoom levels, depending on base map layer, can be higher than stock. limit zoom level
  // (stock site max zoom may vary depending on google maps detail in the area - 20 or 21 max is common)
  if (zoom > 21) {
    zoom = 21;
  }


  if (!window.CONFIG_ZOOM_DEFAULT_DETAIL_LEVEL) {

    // to improve the cacheing performance, we try and limit the number of zoom levels we retrieve data for
    // to avoid impacting server load, we keep ourselves restricted to a zoom level with the sane numbre
    // of tilesPerEdge and portal levels visible

    var origTileParams = getMapZoomTileParameters(zoom);

    while (zoom > MIN_ZOOM) {
      var newTileParams = getMapZoomTileParameters(zoom-1);

      if ( newTileParams.tilesPerEdge != origTileParams.tilesPerEdge
        || newTileParams.hasPortals != origTileParams.hasPortals
        || newTileParams.level*newTileParams.hasPortals != origTileParams.level*origTileParams.hasPortals  // multiply by 'hasPortals' bool - so comparison does not matter when no portals available
      ) {
        // switching to zoom-1 would result in a different detail level - so we abort changing things
        break;
      } else {
        // changing to zoom = zoom-1 results in identical tile parameters - so we can safely step back
        // with no increase in either server load or number of requests
        zoom = zoom-1;
      }
    }

  }

  return zoom;
}


window.lngToTile = function(lng, params) {
  return Math.floor((lng + 180) / 360 * params.tilesPerEdge);
}

window.latToTile = function(lat, params) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
    1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * params.tilesPerEdge);
}

window.tileToLng = function(x, params) {
  return x / params.tilesPerEdge * 360 - 180;
}

window.tileToLat = function(y, params) {
  var n = Math.PI - 2 * Math.PI * y / params.tilesPerEdge;
  return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

window.pointToTileId = function(params, x, y) {
//change to quadkey construction
//as of 2014-05-06: zoom_x_y_minlvl_maxlvl_maxhealth

  return params.zoom + "_" + x + "_" + y + "_" + params.level + "_8_100";
}


window.getResonatorLatLng = function(dist, slot, portalLatLng) {
  // offset in meters
  var dn = dist*SLOT_TO_LAT[slot];
  var de = dist*SLOT_TO_LNG[slot];

  // Coordinate offset in radians
  var dLat = dn/EARTH_RADIUS;
  var dLon = de/(EARTH_RADIUS*Math.cos(Math.PI/180*portalLatLng[0]));

  // OffsetPosition, decimal degrees
  var lat0 = portalLatLng[0] + dLat * 180/Math.PI;
  var lon0 = portalLatLng[1] + dLon * 180/Math.PI;

  return [lat0, lon0];
}


;

﻿// MAP DATA DEBUG //////////////////////////////////////
// useful bits to assist debugging map data tiles


window.RenderDebugTiles = function() {
  this.CLEAR_CHECK_TIME = L.Path.CANVAS ? 2.0 : 0.5;
  this.FADE_TIME = 2.0;

  this.debugTileLayer = L.layerGroup();
  window.addLayerGroup("資料方塊", this.debugTileLayer, false);

  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
  this.timer = undefined;
}

window.RenderDebugTiles.prototype.reset = function() {
  this.debugTileLayer.clearLayers();
  this.debugTileToRectangle = {};
  this.debugTileClearTimes = {};
}

window.RenderDebugTiles.prototype.create = function(id,bounds) {
  var s = {color: '#666', weight: 2, opacity: 0.4, fillColor: '#666', fillOpacity: 0.1, clickable: false};

  var bounds = new L.LatLngBounds(bounds);
  bounds = bounds.pad(-0.02);

  var l = L.rectangle(bounds,s);
  this.debugTileToRectangle[id] = l;
  this.debugTileLayer.addLayer(l);
  if (map.hasLayer(this.debugTileLayer)) {
    // only bring to back if we have the debug layer turned on
    l.bringToBack();
  }
}

window.RenderDebugTiles.prototype.setColour = function(id,bordercol,fillcol) {
  var l = this.debugTileToRectangle[id];
  if (l) {
    var s = {color: bordercol, fillColor: fillcol};
    l.setStyle(s);
  }
}

window.RenderDebugTiles.prototype.setState = function(id,state) {
  var col = '#f0f';
  var fill = '#f0f';
  var clearDelay = -1;
  switch(state) {
    case 'ok': col='#0f0'; fill='#0f0'; clearDelay = 2; break;
    case 'error': col='#f00'; fill='#f00'; clearDelay = 30; break;
    case 'cache-fresh': col='#0f0'; fill='#ff0'; clearDelay = 2; break;
    case 'cache-stale': col='#f00'; fill='#ff0'; clearDelay = 10; break;
    case 'requested': col='#66f'; fill='#66f'; break;
    case 'retrying': col='#666'; fill='#666'; break;
    case 'request-fail': col='#a00'; fill='#666'; break;
    case 'tile-fail': col='#f00'; fill='#666'; break;
    case 'tile-timeout': col='#ff0'; fill='#666'; break;
    case 'render-queue': col='#f0f'; fill='#f0f'; break;
  }
  this.setColour (id, col, fill);
  if (clearDelay >= 0) {
    var clearAt = Date.now() + clearDelay*1000;
    this.debugTileClearTimes[id] = clearAt;

    if (!this.timer) {
      this.startTimer(clearDelay*1000);
    }
  }
}


window.RenderDebugTiles.prototype.startTimer = function(waitTime) {
  var _this = this;
  if (!_this.timer) {
    // a timeout of 0 firing the actual timeout - helps things run smoother
    _this.timer = setTimeout ( function() {
      _this.timer = setTimeout ( function() { _this.timer = undefined; _this.runClearPass(); }, waitTime );
    }, 0);
  }
}

window.RenderDebugTiles.prototype.runClearPass = function() {

  var now = Date.now();
  for (var id in this.debugTileClearTimes) {
    var diff = now - this.debugTileClearTimes[id];
    if (diff > 0) {
      if (diff > this.FADE_TIME*1000) {
        this.debugTileLayer.removeLayer(this.debugTileToRectangle[id]);
        delete this.debugTileClearTimes[id];
      } else {
        var fade = 1.0 - (diff / (this.FADE_TIME*1000));

        this.debugTileToRectangle[id].setStyle ({ opacity: 0.4*fade, fillOpacity: 0.1*fade });
      }
    }
  }

  if (Object.keys(this.debugTileClearTimes).length > 0) {
    this.startTimer(this.CLEAR_CHECK_TIME*1000);
  }
}


;

// MAP DATA RENDER ////////////////////////////////////////////////
// class to handle rendering into leaflet the JSON data from the servers



window.Render = function() {
  this.portalMarkerScale = undefined;
}

// start a render pass. called as we start to make the batch of data requests to the servers
window.Render.prototype.startRenderPass = function(level,bounds) {
  this.isRendering = true;

  this.deletedGuid = {};  // object - represents the set of all deleted game entity GUIDs seen in a render pass

  this.seenPortalsGuid = {};
  this.seenLinksGuid = {};
  this.seenFieldsGuid = {};

  this.bounds = bounds;
  this.level = level;

  // we pad the bounds used for clearing a litle bit, as entities are sometimes returned outside of their specified tile boundaries
  // this will just avoid a few entity removals at start of render when they'll just be added again
  var paddedBounds = bounds.pad(0.1);

  this.clearPortalsOutsideBounds(paddedBounds);

  this.clearLinksOutsideBounds(paddedBounds);
  this.clearFieldsOutsideBounds(paddedBounds);


  this.rescalePortalMarkers();
}

window.Render.prototype.clearPortalsOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.portals) {
    var p = portals[guid];
    // clear portals outside visible bounds - unless it's the selected portal, or it's relevant to artifacts
    if (!bounds.contains(p.getLatLng()) && guid !== selectedPortal && !artifact.isInterestingPortal(guid)) {
      this.deletePortalEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' portals by level/bounds');
}

window.Render.prototype.clearLinksOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.links) {
    var l = links[guid];

    // NOTE: our geodesic lines can have lots of intermediate points. the bounds calculation hasn't been optimised for this
    // so can be particularly slow. a simple bounds check based on start+end point will be good enough for this check
    var lls = l.getLatLngs();
    var linkBounds = L.latLngBounds(lls);

    if (!bounds.intersects(linkBounds)) {
      this.deleteLinkEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' links by bounds');
}

window.Render.prototype.clearFieldsOutsideBounds = function(bounds) {
  var count = 0;
  for (var guid in window.fields) {
    var f = fields[guid];

    // NOTE: our geodesic polys can have lots of intermediate points. the bounds calculation hasn't been optimised for this
    // so can be particularly slow. a simple bounds check based on corner points will be good enough for this check
    var lls = f.getLatLngs();
    var fieldBounds = L.latLngBounds([lls[0],lls[1]]).extend(lls[2]);

    if (!bounds.intersects(fieldBounds)) {
      this.deleteFieldEntity(guid);
      count++;
    }
  }
  console.log('Render: deleted '+count+' fields by bounds');
}


// process deleted entity list and entity data
window.Render.prototype.processTileData = function(tiledata) {
  this.processDeletedGameEntityGuids(tiledata.deletedGameEntityGuids||[]);
  this.processGameEntities(tiledata.gameEntities||[]);
}


window.Render.prototype.processDeletedGameEntityGuids = function(deleted) {
  for(var i in deleted) {
    var guid = deleted[i];

    if ( !(guid in this.deletedGuid) ) {
      this.deletedGuid[guid] = true;  // flag this guid as having being processed

      if (guid == selectedPortal) {
        // the rare case of the selected portal being deleted. clear the details tab and deselect it
        renderPortalDetails(null);
      }

      this.deleteEntity(guid);

    }
  }

}

window.Render.prototype.processGameEntities = function(entities) {

  // we loop through the entities three times - for fields, links and portals separately
  // this is a reasonably efficient work-around for leafletjs limitations on svg render order


  for (var i in entities) {
    var ent = entities[i];
    if (ent[2][0] == 'r' && !(ent[0] in this.deletedGuid)) {
      this.createFieldEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2][0] == 'e' && !(ent[0] in this.deletedGuid)) {
      this.createLinkEntity(ent);
    }
  }

  for (var i in entities) {
    var ent = entities[i];

    if (ent[2][0] == 'p' && !(ent[0] in this.deletedGuid)) {
      this.createPortalEntity(ent);
    }
  }
}


// end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
// is considered complete
window.Render.prototype.endRenderPass = function() {
  var countp=0,countl=0,countf=0;

  // check to see if there are any entities we haven't seen. if so, delete them
  for (var guid in window.portals) {
    // special case for selected portal - it's kept even if not seen
    // artifact (e.g. jarvis shard) portals are also kept - but they're always 'seen'
    if (!(guid in this.seenPortalsGuid) && guid !== selectedPortal) {
      this.deletePortalEntity(guid);
      countp++;
    }
  }
  for (var guid in window.links) {
    if (!(guid in this.seenLinksGuid)) {
      this.deleteLinkEntity(guid);
      countl++;
    }
  }
  for (var guid in window.fields) {
    if (!(guid in this.seenFieldsGuid)) {
      this.deleteFieldEntity(guid);
      countf++;
    }
  }

  console.log('Render: end cleanup: removed '+countp+' portals, '+countl+' links, '+countf+' fields');

  // reorder portals to be after links/fields
  this.bringPortalsToFront();

  this.isRendering = false;

  // re-select the selected portal, to re-render the side-bar. ensures that any data calculated from the map data is up to date
  if (selectedPortal) {
    renderPortalDetails (selectedPortal);
  }
}

window.Render.prototype.bringPortalsToFront = function() {
  for (var lvl in portalsFactionLayers) {
    // portals are stored in separate layers per faction
    // to avoid giving weight to one faction or another, we'll push portals to front based on GUID order
    var lvlPortals = {};
    for (var fac in portalsFactionLayers[lvl]) {
      var layer = portalsFactionLayers[lvl][fac];
      if (layer._map) {
        layer.eachLayer (function(p) {
          lvlPortals[p.options.guid] = p;
        });
      }
    }

    var guids = Object.keys(lvlPortals);
    guids.sort();

    for (var j in guids) {
      var guid = guids[j];
      lvlPortals[guid].bringToFront();
    }
  }

  // artifact portals are always brought to the front, above all others
  $.each(artifact.getInterestingPortals(), function(i,guid) {
    if (portals[guid] && portals[guid]._map) {
      portals[guid].bringToFront();
    }
  });

}


window.Render.prototype.deleteEntity = function(guid) {
  this.deletePortalEntity(guid);
  this.deleteLinkEntity(guid);
  this.deleteFieldEntity(guid);
}

window.Render.prototype.deletePortalEntity = function(guid) {
  if (guid in window.portals) {
    var p = window.portals[guid];
    window.ornaments.removePortal(p);
    this.removePortalFromMapLayer(p);
    delete window.portals[guid];
  }
}

window.Render.prototype.deleteLinkEntity = function(guid) {
  if (guid in window.links) {
    var l = window.links[guid];
    linksFactionLayers[l.options.team].removeLayer(l);
    delete window.links[guid];
  }
}


window.Render.prototype.deleteFieldEntity = function(guid) {
  if (guid in window.fields) {
    var f = window.fields[guid];
    var fd = f.options.details;

    fieldsFactionLayers[f.options.team].removeLayer(f);
    delete window.fields[guid];
  }
}


window.Render.prototype.createPlaceholderPortalEntity = function(guid,latE6,lngE6,team) {
  // intel no longer returns portals at anything but the closest zoom
  // stock intel creates 'placeholder' portals from the data in links/fields - IITC needs to do the same
  // we only have the portal guid, lat/lng coords, and the faction - no other data
  // having the guid, at least, allows the portal details to be loaded once it's selected. however,
  // no highlighters, portal level numbers, portal names, useful counts of portals, etc are possible


  var ent = [
    guid,       //ent[0] = guid
    0,          //ent[1] = timestamp - zero will mean any other source of portal data will have a higher timestamp
                //ent[2] = an array with the entity data
    [ 'p',      //0 - a portal
      team,     //1 - team
      latE6,    //2 - lat
      lngE6     //3 - lng
    ]
  ];

  // placeholder portals don't have a useful timestamp value - so the standard code that checks for updated
  // portal details doesn't apply
  // so, check that the basic details are valid and delete the existing portal if out of date
  if (guid in window.portals) {
    var p = window.portals[guid];
    if (team != p.options.data.team || latE6 != p.options.data.latE6 || lngE6 != p.options.data.lngE6) {
      // team or location have changed - delete existing portal
      this.deletePortalEntity(guid);
    }
  }

  this.createPortalEntity(ent);

}


window.Render.prototype.createPortalEntity = function(ent) {
  this.seenPortalsGuid[ent[0]] = true;  // flag we've seen it

  var previousData = undefined;

  // check if entity already exists
  if (ent[0] in window.portals) {
    // yes. now check to see if the entity data we have is newer than that in place
    var p = window.portals[ent[0]];

    if (p.options.timestamp >= ent[1]) return; // this data is identical or older - abort processing

    // the data we have is newer. many data changes require re-rendering of the portal
    // (e.g. level changed, so size is different, or stats changed so highlighter is different)
    // so to keep things simple we'll always re-create the entity in this case

    // remember the old details, for the callback

    previousData = p.options.data;

    this.deletePortalEntity(ent[0]);
  }

  var portalLevel = parseInt(ent[2][4])||0;
  var team = teamStringToId(ent[2][1]);
  // the data returns unclaimed portals as level 1 - but IITC wants them treated as level 0
  if (team == TEAM_NONE) portalLevel = 0;

  var latlng = L.latLng(ent[2][2]/1E6, ent[2][3]/1E6);

  var data = decodeArray.portalSummary(ent[2]);

  var dataOptions = {
    level: portalLevel,
    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data
  };

  window.pushPortalGuidPositionCache(ent[0], data.latE6, data.lngE6);

  var marker = createMarker(latlng, dataOptions);

  marker.on('click', function() { window.renderPortalDetails(ent[0]); });
  marker.on('dblclick', function() { window.renderPortalDetails(ent[0]); window.map.setView(latlng, 17); });


  window.runHooks('portalAdded', {portal: marker, previousData: previousData});

  window.portals[ent[0]] = marker;

  // check for URL links to portal, and select it if this is the one
  if (urlPortalLL && urlPortalLL[0] == marker.getLatLng().lat && urlPortalLL[1] == marker.getLatLng().lng) {
    // URL-passed portal found via pll parameter - set the guid-based parameter
    console.log('urlPortalLL '+urlPortalLL[0]+','+urlPortalLL[1]+' matches portal GUID '+ent[0]);

    urlPortal = ent[0];
    urlPortalLL = undefined;  // clear the URL parameter so it's not matched again
  }
  if (urlPortal == ent[0]) {
    // URL-passed portal found via guid parameter - set it as the selected portal
    console.log('urlPortal GUID '+urlPortal+' found - selecting...');
    selectedPortal = ent[0];
    urlPortal = undefined;  // clear the URL parameter so it's not matched again
  }

  // (re-)select the portal, to refresh the sidebar on any changes
  if (ent[0] == selectedPortal) {
    console.log('portal guid '+ent[0]+' is the selected portal - re-rendering portal details');
    renderPortalDetails (selectedPortal);
  }

  window.ornaments.addPortal(marker);

  //TODO? postpone adding to the map layer
  this.addPortalToMapLayer(marker);

}


window.Render.prototype.createFieldEntity = function(ent) {
  this.seenFieldsGuid[ent[0]] = true;  // flag we've seen it

  var data = {
//    type: ent[2][0],
    team: ent[2][1],
    points: ent[2][2].map(function(arr) { return {guid: arr[0], latE6: arr[1], lngE6: arr[2] }; })
  };

  //create placeholder portals for field corners. we already do links, but there are the odd case where this is useful
  for (var i=0; i<3; i++) {
    var p=data.points[i];
    this.createPlaceholderPortalEntity(p.guid, p.latE6, p.lngE6, data.team);
  }

  // check if entity already exists
  if(ent[0] in window.fields) {
    // yes. in theory, we should never get updated data for an existing field. they're created, and they're destroyed - never changed
    // but theory and practice may not be the same thing...
    var f = window.fields[ent[0]];

    if (f.options.timestamp >= ent[1]) return; // this data is identical (or order) than that rendered - abort processing

    // the data we have is newer - two options
    // 1. just update the data, assume the field render appearance is unmodified
    // 2. delete the entity, then re-create with the new data
    this.deleteFieldEntity(ent[0]); // option 2, for now
  }

  var team = teamStringToId(ent[2][1]);
  var latlngs = [
    L.latLng(data.points[0].latE6/1E6, data.points[0].lngE6/1E6),
    L.latLng(data.points[1].latE6/1E6, data.points[1].lngE6/1E6),
    L.latLng(data.points[2].latE6/1E6, data.points[2].lngE6/1E6)
  ];

  var poly = L.geodesicPolygon(latlngs, {
    fillColor: COLORS[team],
    fillOpacity: 0.25,
    stroke: false,
    clickable: false,

    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data,
  });

  runHooks('fieldAdded',{field: poly});

  window.fields[ent[0]] = poly;

  // TODO? postpone adding to the layer??
  fieldsFactionLayers[poly.options.team].addLayer(poly);
}

window.Render.prototype.createLinkEntity = function(ent,faked) {
  // Niantic have been faking link entities, based on data from fields
  // these faked links are sent along with the real portal links, causing duplicates
  // the faked ones all have longer GUIDs, based on the field GUID (with _ab, _ac, _bc appended)
  var fakedLink = new RegExp("^[0-9a-f]{32}\.b_[ab][bc]$"); //field GUIDs always end with ".b" - faked links append the edge identifier
  if (fakedLink.test(ent[0])) return;


  this.seenLinksGuid[ent[0]] = true;  // flag we've seen it

  var data = { // TODO add other properties and check correction direction
//    type:   ent[2][0],
    team:   ent[2][1],
    oGuid:  ent[2][2],
    oLatE6: ent[2][3],
    oLngE6: ent[2][4],
    dGuid:  ent[2][5],
    dLatE6: ent[2][6],
    dLngE6: ent[2][7]
  };

  // create placeholder entities for link start and end points (before checking if the link itself already exists
  this.createPlaceholderPortalEntity(data.oGuid, data.oLatE6, data.oLngE6, data.team);
  this.createPlaceholderPortalEntity(data.dGuid, data.dLatE6, data.dLngE6, data.team);


  // check if entity already exists
  if (ent[0] in window.links) {
    // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
    var l = window.links[ent[0]];

    // the faked data will have older timestamps than real data (currently, faked set to zero)
    if (l.options.timestamp >= ent[1]) return; // this data is older or identical to the rendered data - abort processing

    // the data is newer/better - two options
    // 1. just update the data. assume the link render appearance is unmodified
    // 2. delete the entity, then re-create it with the new data
    this.deleteLinkEntity(ent[0]); // option 2 - for now
  }

  var team = teamStringToId(ent[2][1]);
  var latlngs = [
    L.latLng(data.oLatE6/1E6, data.oLngE6/1E6),
    L.latLng(data.dLatE6/1E6, data.dLngE6/1E6)
  ];
  var poly = L.geodesicPolyline(latlngs, {
    color: COLORS[team],
    opacity: 0.5, // iF: Make the line becomes transparent so that the map display clearer.
    weight: faked ? 1 : 2,
    clickable: false,

    team: team,
    ent: ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
    guid: ent[0],
    timestamp: ent[1],
    data: data
  });

  runHooks('linkAdded', {link: poly});

  window.links[ent[0]] = poly;

  linksFactionLayers[poly.options.team].addLayer(poly);
}



window.Render.prototype.rescalePortalMarkers = function() {
  if (this.portalMarkerScale === undefined || this.portalMarkerScale != portalMarkerScale()) {
    this.portalMarkerScale = portalMarkerScale();

    console.log('Render: map zoom '+map.getZoom()+' changes portal scale to '+portalMarkerScale()+' - redrawing all portals');

    //NOTE: we're not calling this because it resets highlights - we're calling it as it
    // resets the style (inc size) of all portal markers, applying the new scale
    resetHighlightedPortals();
  }
}



// add the portal to the visible map layer
window.Render.prototype.addPortalToMapLayer = function(portal) {
  portalsFactionLayers[parseInt(portal.options.level)||0][portal.options.team].addLayer(portal);
}

window.Render.prototype.removePortalFromMapLayer = function(portal) {
  //remove it from the portalsLevels layer
  portalsFactionLayers[parseInt(portal.options.level)||0][portal.options.team].removeLayer(portal);
}




;

﻿// MAP DATA REQUEST ///////////////////////////////////////////////////
// class to request the map data tiles from the Ingress servers
// and then pass it on to the render class for display purposes
// Uses the map data cache class to reduce network requests


window.MapDataRequest = function() {
  this.cache = new DataCache();
  this.render = new Render();
  this.debugTiles = new RenderDebugTiles();

  this.activeRequestCount = 0;
  this.requestedTiles = {};

  this.renderQueue = [];
  this.renderQueueTimer = undefined;
  this.renderQueuePaused = false;

  this.idle = false;


  // no more than this many requests in parallel. stock site seems to rely on browser limits (6, usually), sending
  // many requests at once.
  // using our own queue limit ensures that other requests (e.g. chat, portal details) don't get delayed
  this.MAX_REQUESTS = 5;

  // this many tiles in one request
  this.NUM_TILES_PER_REQUEST = 25;

  // number of times to retry a tile after an error (including "error: TIMEOUT" now - as stock intel does)
  // TODO? different retry counters for TIMEOUT vs other errors..?
  this.MAX_TILE_RETRIES = 5;

  // refresh timers
  this.MOVE_REFRESH = 3; //time, after a map move (pan/zoom) before starting the refresh processing
  this.STARTUP_REFRESH = 3; //refresh time used on first load of IITC
  this.IDLE_RESUME_REFRESH = 5; //refresh time used after resuming from idle

  // after one of the above, there's an additional delay between preparing the refresh (clearing out of bounds,
  // processing cache, etc) and actually sending the first network requests
  this.DOWNLOAD_DELAY = 1;  //delay after preparing the data download before tile requests are sent


  // a short delay between one request finishing and the queue being run for the next request.
  this.RUN_QUEUE_DELAY = 0;

  // delay before processing the queue after failed requests
  this.BAD_REQUEST_RUN_QUEUE_DELAY = 5; // longer delay before doing anything after errors (other than TIMEOUT)

  // delay before processing the queue after empty responses
  this.EMPTY_RESPONSE_RUN_QUEUE_DELAY = 5; // also long delay - empty responses are likely due to some server issues

  // delay before processing the queue after error==TIMEOUT requests. this is 'expected', so minimal extra delay over the regular RUN_QUEUE_DELAY
  this.TIMEOUT_REQUEST_RUN_QUEUE_DELAY = 0;


  // render queue
  // number of items to process in each render pass. there are pros and cons to smaller and larger values
  // (however, if using leaflet canvas rendering, it makes sense to push as much as possible through every time)
  this.RENDER_BATCH_SIZE = L.Path.CANVAS ? 1E9 : 1500;

  // delay before repeating the render loop. this gives a better chance for user interaction
  this.RENDER_PAUSE = (typeof android === 'undefined') ? 0.1 : 0.2; //100ms desktop, 200ms mobile


  this.REFRESH_CLOSE = 300;  // refresh time to use for close views z>12 when not idle and not moving
  this.REFRESH_FAR = 900;  // refresh time for far views z <= 12
  this.FETCH_TO_REFRESH_FACTOR = 2;  //minumum refresh time is based on the time to complete a data fetch, times this value

  // ensure we have some initial map status
  this.setStatus ('初始化', undefined, -1);

  // add a portalDetailLoaded hook, so we can use the exteneed details to update portals on the map
  var _this = this;
  addHook('portalDetailLoaded',function(data){
    _this.render.processGameEntities([data.ent]);
  });

}


window.MapDataRequest.prototype.start = function() {
  var savedContext = this;

  // setup idle resume function
  window.addResumeFunction ( function() { savedContext.idleResume(); } );

  // and map move start/end callbacks
  window.map.on('movestart', this.mapMoveStart, this);
  window.map.on('moveend', this.mapMoveEnd, this);


  // then set a timeout to start the first refresh
  this.refreshOnTimeout (this.STARTUP_REFRESH);
  this.setStatus ('刷新中', undefined, -1);

  this.cache && this.cache.startExpireInterval (15);
}


window.MapDataRequest.prototype.mapMoveStart = function() {
  console.log('refresh map movestart');

  this.setStatus('暫停');
  this.clearTimeout();
  this.pauseRenderQueue(true);
}

window.MapDataRequest.prototype.mapMoveEnd = function() {
  var bounds = clampLatLngBounds(map.getBounds());
  var zoom = map.getZoom();

  if (this.fetchedDataParams) {
    // we have fetched (or are fetching) data...
    if (this.fetchedDataParams.mapZoom == map.getZoom() && this.fetchedDataParams.bounds.contains(bounds)) {
      // ... and the zoom level is the same and the current bounds is inside the fetched bounds
      // so, no need to fetch data. if there's time left, restore the original timeout

      var remainingTime = (this.timerExpectedTimeoutTime - new Date().getTime())/1000;

      if (remainingTime > this.MOVE_REFRESH) {
        this.setStatus('完成','地圖被移動，但沒有數據需要更新');
        this.refreshOnTimeout(remainingTime);
        this.pauseRenderQueue(false);
        return;
      }
    }
  }

  this.setStatus('刷新中', undefined, -1);
  this.refreshOnTimeout(this.MOVE_REFRESH);
}

window.MapDataRequest.prototype.idleResume = function() {
  // if we have no timer set and there are no active requests, refresh has gone idle and the timer needs restarting

  if (this.idle) {
    console.log('refresh map idle resume');
    this.idle = false;
    this.setStatus('閒置刷新', undefined, -1);
    this.refreshOnTimeout(this.IDLE_RESUME_REFRESH);
  }
}


window.MapDataRequest.prototype.clearTimeout = function() {

  if (this.timer) {
    console.log('cancelling existing map refresh timer');
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}

window.MapDataRequest.prototype.refreshOnTimeout = function(seconds) {
  this.clearTimeout();

  console.log('starting map refresh in '+seconds+' seconds');

  // 'this' won't be right inside the callback, so save it
  // also, double setTimeout used to ensure the delay occurs after any browser-related rendering/updating/etc
  var _this = this;
  this.timer = setTimeout ( function() {
    _this.timer = setTimeout ( function() { _this.timer = undefined; _this.refresh(); }, seconds*1000);
  }, 0);
  this.timerExpectedTimeoutTime = new Date().getTime() + seconds*1000;
}


window.MapDataRequest.prototype.setStatus = function(short,long,progress) {
  this.status = { short: short, long: long, progress: progress };
  window.renderUpdateStatus();
}


window.MapDataRequest.prototype.getStatus = function() {
  return this.status;
};


window.MapDataRequest.prototype.refresh = function() {

  // if we're idle, don't refresh
  if (window.isIdle()) {
    console.log('suspending map refresh - is idle');
    this.setStatus ('閒置');
    this.idle = true;
    return;
  }

  //time the refresh cycle
  this.refreshStartTime = new Date().getTime();

  this.debugTiles.reset();
  this.resetRenderQueue();

  // a 'set' to keep track of hard failures for tiles
  this.tileErrorCount = {};

  // the 'set' of requested tile QKs
  // NOTE: javascript does not guarantee any order to properties of an object. however, in all major implementations
  // properties retain the order they are added in. IITC uses this to control the tile fetch order. if browsers change
  // then fetch order isn't optimal, but it won't break things.
  this.queuedTiles = {};


  var bounds = clampLatLngBounds(map.getBounds());
  var mapZoom = map.getZoom();

  var dataZoom = getDataZoomForMapZoom(mapZoom);

  var tileParams = getMapZoomTileParameters(dataZoom);


//DEBUG: resize the bounds so we only retrieve some data
//bounds = bounds.pad(-0.4);

//var debugrect = L.rectangle(bounds,{color: 'red', fill: false, weight: 4, opacity: 0.8}).addTo(map);
//setTimeout (function(){ map.removeLayer(debugrect); }, 10*1000);

  var x1 = lngToTile(bounds.getWest(), tileParams);
  var x2 = lngToTile(bounds.getEast(), tileParams);
  var y1 = latToTile(bounds.getNorth(), tileParams);
  var y2 = latToTile(bounds.getSouth(), tileParams);

  // calculate the full bounds for the data - including the part of the tiles off the screen edge
  var dataBounds = L.latLngBounds([
    [tileToLat(y2+1,tileParams), tileToLng(x1,tileParams)],
    [tileToLat(y1,tileParams), tileToLng(x2+1,tileParams)]
  ]);
//var debugrect2 = L.rectangle(dataBounds,{color: 'magenta', fill: false, weight: 4, opacity: 0.8}).addTo(map);
//setTimeout (function(){ map.removeLayer(debugrect2); }, 10*1000);

  // store the parameters used for fetching the data. used to prevent unneeded refreshes after move/zoom
  this.fetchedDataParams = { bounds: dataBounds, mapZoom: mapZoom, dataZoom: dataZoom };


  window.runHooks ('mapDataRefreshStart', {bounds: bounds, mapZoom: mapZoom, dataZoom: dataZoom, minPortalLevel: tileParams.level, tileBounds: dataBounds});

  this.render.startRenderPass(tileParams.level, dataBounds);

  var _render = this.render;
  window.runHooks ('mapDataEntityInject', {callback: function(ents) { _render.processGameEntities(ents);}});


  this.render.processGameEntities(artifact.getArtifactEntities());

  var logMessage = 'requesting data tiles at zoom '+dataZoom;
  if (tileParams.level != tileParams.maxLevel) {
    logMessage += ' (L'+tileParams.level+'+ portals - could have done L'+tileParams.maxLevel+'+';
  } else {
    logMessage += ' (L'+tileParams.level+'+ portals';
  }
  logMessage += ', '+tileParams.tilesPerEdge+' tiles per global edge), map zoom is '+mapZoom;

  console.log(logMessage);


  this.cachedTileCount = 0;
  this.requestedTileCount = 0;
  this.successTileCount = 0;
  this.failedTileCount = 0;
  this.staleTileCount = 0;

  var tilesToFetchDistance = {};

  // map center point - for fetching center tiles first
  var mapCenterPoint = map.project(map.getCenter(), mapZoom);

  // y goes from left to right
  for (var y = y1; y <= y2; y++) {
    // x goes from bottom to top(?)
    for (var x = x1; x <= x2; x++) {
      var tile_id = pointToTileId(tileParams, x, y);
      var latNorth = tileToLat(y,tileParams);
      var latSouth = tileToLat(y+1,tileParams);
      var lngWest = tileToLng(x,tileParams);
      var lngEast = tileToLng(x+1,tileParams);

      this.debugTiles.create(tile_id,[[latSouth,lngWest],[latNorth,lngEast]]);

//TODO: with recent backend changes there are now multiple zoom levels of data that is identical except perhaps for some
// reduction of detail when zoomed out. to take good advantage of the cache, a check for cached data at a closer zoom
// but otherwise the same parameters (min portal level, tiles per edge) will mean less downloads when zooming out
// (however, the default code in getDataZoomForMapZoom currently reduces the need for this, as it forces the furthest 
//  out zoom tiles for a detail level)
      if (this.cache && this.cache.isFresh(tile_id) ) {
        // data is fresh in the cache - just render it
        this.pushRenderQueue(tile_id,this.cache.get(tile_id),'cache-fresh');
        this.cachedTileCount += 1;
      } else {

        // no fresh data

        // tile needed. calculate the distance from the centre of the screen, to optimise the load order

        var latCenter = (latNorth+latSouth)/2;
        var lngCenter = (lngEast+lngWest)/2;
        var tileLatLng = L.latLng(latCenter,lngCenter);

        var tilePoint = map.project(tileLatLng, mapZoom);

        var delta = mapCenterPoint.subtract(tilePoint);
        var distanceSquared = delta.x*delta.x + delta.y*delta.y;

        tilesToFetchDistance[tile_id] = distanceSquared;
        this.requestedTileCount += 1;
      }
    }
  }

  // re-order the tile list by distance from the centre of the screen. this should load more relevant data first
  var tilesToFetch = Object.keys(tilesToFetchDistance);
  tilesToFetch.sort(function(a,b) {
    return tilesToFetchDistance[a]-tilesToFetchDistance[b];
  });

  for (var i in tilesToFetch) {
    var qk = tilesToFetch[i];

    this.queuedTiles[qk] = qk;
  }



  this.setStatus ('讀取中', undefined, -1);

  // technically a request hasn't actually finished - however, displayed portal data has been refreshed
  // so as far as plugins are concerned, it should be treated as a finished request
  window.runHooks('requestFinished', {success: true});

  console.log ('done request preparation (cleared out-of-bounds and invalid for zoom, and rendered cached data)');

  if (Object.keys(this.queuedTiles).length > 0) {
    // queued requests - don't start processing the download queue immediately - start it after a short delay
    this.delayProcessRequestQueue (this.DOWNLOAD_DELAY,true);
  } else {
    // all data was from the cache, nothing queued - run the queue 'immediately' so it handles the end request processing
    this.delayProcessRequestQueue (0,true);
  }
}


window.MapDataRequest.prototype.delayProcessRequestQueue = function(seconds,isFirst) {
  if (this.timer === undefined) {
    var _this = this;
    this.timer = setTimeout ( function() {
      _this.timer = setTimeout ( function() { _this.timer = undefined; _this.processRequestQueue(isFirst); }, seconds*1000 );
    }, 0);
  }
}


window.MapDataRequest.prototype.processRequestQueue = function(isFirstPass) {

  // if nothing left in the queue, finish
  if (Object.keys(this.queuedTiles).length == 0) {
    // we leave the renderQueue code to handle ending the render pass now
    // (but we need to make sure it's not left without it's timer running!)
    if (!this.renderQueuePaused) {
      this.startQueueTimer(this.RENDER_PAUSE);
    }

    return;
  }


  // create a list of tiles that aren't requested over the network
  var pendingTiles = [];
  for (var id in this.queuedTiles) {
    if (!(id in this.requestedTiles) ) {
      pendingTiles.push(id);
    }
  }

//  console.log('- request state: '+Object.keys(this.requestedTiles).length+' tiles in '+this.activeRequestCount+' active requests, '+pendingTiles.length+' tiles queued');

  var requestBuckets = this.MAX_REQUESTS - this.activeRequestCount;
  if (pendingTiles.length > 0 && requestBuckets > 0) {

    for (var bucket=0; bucket < requestBuckets; bucket++) {

      // if the tiles for this request have had several retries, use smaller requests
      // maybe some of the tiles caused all the others to error? no harm anyway, and it may help...
      var numTilesThisRequest = Math.min(this.NUM_TILES_PER_REQUEST,pendingTiles.length);

      var id = pendingTiles[0];
      var retryTotal = (this.tileErrorCount[id]||0);
      for (var i=1; i<numTilesThisRequest; i++) {
        id = pendingTiles[i];
        retryTotal += (this.tileErrorCount[id]||0);
        if (retryTotal > this.MAX_TILE_RETRIES) {
          numTilesThisRequest = i;
          break;
        }
      }

      var tiles = pendingTiles.splice(0, numTilesThisRequest);
      if (tiles.length > 0) {
        this.sendTileRequest(tiles);
      }
    }

  }


  // update status
  var pendingTileCount = this.requestedTileCount - (this.successTileCount+this.failedTileCount+this.staleTileCount);
  var longText = '資料方塊: ' + this.cachedTileCount + ' 快取, ' +
                 this.successTileCount + ' 讀取完畢, ' +
                 (this.staleTileCount ? this.staleTileCount + ' 保持, ' : '') +
                 (this.failedTileCount ? this.failedTileCount + ' 失敗, ' : '剩餘') +
                 pendingTileCount + '';

  progress = this.requestedTileCount > 0 ? (this.requestedTileCount-pendingTileCount) / this.requestedTileCount : undefined;
  this.setStatus ('讀取中', longText, progress);
}


window.MapDataRequest.prototype.sendTileRequest = function(tiles) {

  var tilesList = [];

  for (var i in tiles) {
    var id = tiles[i];

    this.debugTiles.setState (id, 'requested');

    this.requestedTiles[id] = true;

    if (id in this.queuedTiles) {
      tilesList.push (id);
    } else {
      console.warn('no queue entry for tile id '+id);
    }
  }

  var data = { tileKeys: tilesList };

  this.activeRequestCount += 1;

  var savedThis = this;

  // NOTE: don't add the request with window.request.add, as we don't want the abort handling to apply to map data any more
  window.postAjax('getEntities', data, 
    function(data, textStatus, jqXHR) { savedThis.handleResponse (data, tiles, true); },  // request successful callback
    function() { savedThis.handleResponse (undefined, tiles, false); }  // request failed callback
  );
}

window.MapDataRequest.prototype.requeueTile = function(id, error) {
  if (id in this.queuedTiles) {
    // tile is currently wanted...

    // first, see if the error can be ignored due to retry counts
    if (error) {
      this.tileErrorCount[id] = (this.tileErrorCount[id]||0)+1;
      if (this.tileErrorCount[id] <= this.MAX_TILE_RETRIES) {
        // retry limit low enough - clear the error flag
        error = false;
      }
    }

    if (error) {
      // if error is still true, retry limit hit. use stale data from cache if available
      var data = this.cache ? this.cache.get(id) : undefined;
      if (data) {
        // we have cached data - use it, even though it's stale
        this.pushRenderQueue(id,data,'cache-stale');
        this.staleTileCount += 1;
      } else {
        // no cached data
        this.debugTiles.setState (id, 'error');
        this.failedTileCount += 1;
      }
      // and delete from the pending requests...
      delete this.queuedTiles[id];

    } else {
      // if false, was a 'timeout' or we're retrying, so unlimited retries (as the stock site does)
      this.debugTiles.setState (id, 'retrying');

      // FIXME? it's nice to move retried tiles to the end of the request queue. however, we don't actually have a
      // proper queue, just an object with guid as properties. Javascript standards don't guarantee the order of properties
      // within an object. however, all current browsers do keep property order, and new properties are added at the end.
      // therefore, delete and re-add the requeued tile and it will be added to the end of the queue
      delete this.queuedTiles[id];
      this.queuedTiles[id] = id;

    }
  } // else the tile wasn't currently wanted (an old non-cancelled request) - ignore
}


window.MapDataRequest.prototype.handleResponse = function (data, tiles, success) {

  this.activeRequestCount -= 1;

  var successTiles = [];
  var errorTiles = [];
  var retryTiles = [];
  var timeoutTiles = [];
  var unaccountedTiles = tiles.slice(0); // Clone

  if (!success || !data || !data.result) {
    console.warn('Request.handleResponse: request failed - requeuing...'+(data && data.error?' error: '+data.error:''));

    //request failed - requeue all the tiles(?)

    if (data && data.error && data.error == 'RETRY') {
      // the server can sometimes ask us to retry a request. this is botguard related, I believe

      for (var i in tiles) {
        var id = tiles[i];
        retryTiles.push(id);
        this.debugTiles.setState (id, 'retrying');
      }

      window.runHooks('requestFinished', {success: false});

    } else {
      for (var i in tiles) {
        var id = tiles[i];
        errorTiles.push(id);
        this.debugTiles.setState (id, 'request-fail');
      }

      window.runHooks('requestFinished', {success: false});
    }
    unaccountedTiles = [];
  } else {

    // TODO: use result.minLevelOfDetail ??? stock site doesn't use it yet...

    var m = data.result.map;

    for (var id in m) {
      var val = m[id];
      unaccountedTiles.splice(unaccountedTiles.indexOf(id), 1);
      if ('error' in val) {
        // server returned an error for this individual data tile

        if (val.error == "TIMEOUT") {
          // TIMEOUT errors for individual tiles are quite common. used to be unlimited retries, but not any more
          timeoutTiles.push (id);
        } else {
          console.warn('map data tile '+id+' failed: error=='+val.error);
          errorTiles.push (id);
          this.debugTiles.setState (id, 'tile-fail');
        }
      } else {
        // no error for this data tile - process it
        successTiles.push (id);

        // store the result in the cache
        this.cache && this.cache.store (id, val);

        // if this tile was in the render list, render it
        // (requests aren't aborted when new requests are started, so it's entirely possible we don't want to render it!)
        if (id in this.queuedTiles) {

          this.pushRenderQueue(id,val,'ok');

          delete this.queuedTiles[id];
          this.successTileCount += 1;

        } // else we don't want this tile (from an old non-cancelled request) - ignore
      }

    }

    // TODO? check for any requested tiles in 'tiles' not being mentioned in the response - and handle as if it's a 'timeout'?


    window.runHooks('requestFinished', {success: true});
  }

  // set the queue delay based on any errors or timeouts
  // NOTE: retryTimes are retried at the regular delay - no longer wait as for error/timeout cases
  var nextQueueDelay = errorTiles.length > 0 ? this.BAD_REQUEST_RUN_QUEUE_DELAY :
                       unaccountedTiles.length > 0 ? this.EMPTY_RESPONSE_RUN_QUEUE_DELAY :
                       timeoutTiles.length > 0 ? this.TIMEOUT_REQUEST_RUN_QUEUE_DELAY :
                       this.RUN_QUEUE_DELAY;
  var statusMsg = 'getEntities status: '+tiles.length+' tiles: ';
  statusMsg += successTiles.length+' 成功';
  if (retryTiles.length) statusMsg += ', '+retryTiles.length+' 重試';
  if (timeoutTiles.length) statusMsg += ', '+timeoutTiles.length+' 逾時';
  if (errorTiles.length) statusMsg += ', '+errorTiles.length+' 失敗';
  if (unaccountedTiles.length) statusMsg += ', '+unaccountedTiles.length+' 不明';
  statusMsg += '. 延遲 '+nextQueueDelay+' 秒';
  console.log (statusMsg);


  // requeue any 'timeout' tiles immediately
  if (timeoutTiles.length > 0) {
    for (var i in timeoutTiles) {
      var id = timeoutTiles[i];
      delete this.requestedTiles[id];

      this.requeueTile(id, true);
    }
  }

  if (retryTiles.length > 0) {
    for (var i in retryTiles) {
      var id = retryTiles[i];
      delete this.requestedTiles[id];

      this.requeueTile(id, false);  //tiles from a error==RETRY request are requeued without counting it as an error
    }
  }

  if (errorTiles.length > 0) {
    for (var i in errorTiles) {
      var id = errorTiles[i];
      delete this.requestedTiles[id];
      this.requeueTile(id, true);
    }
  }

  if (unaccountedTiles.length > 0) {
    for (var i in unaccountedTiles) {
      var id = unaccountedTiles[i];
      delete this.requestedTiles[id];
      this.requeueTile(id, true);
    }
  }

  for (var i in successTiles) {
    var id = successTiles[i];
    delete this.requestedTiles[id];
  }


  this.delayProcessRequestQueue(nextQueueDelay);
}


window.MapDataRequest.prototype.resetRenderQueue = function() {
  this.renderQueue = [];

  if (this.renderQueueTimer) {
    clearTimeout(this.renderQueueTimer);
    this.renderQueueTimer = undefined;
  }
  this.renderQueuePaused = false;  
}


window.MapDataRequest.prototype.pushRenderQueue = function (id, data, status) {
  this.debugTiles.setState(id,'render-queue');
  this.renderQueue.push({
    id:id,
    // the data in the render queue is modified as we go, so we need to copy the values of the arrays. just storing the reference would modify the data in the cache!
    deleted: (data.deletedGameEntityGuids||[]).slice(0),
    entities: (data.gameEntities||[]).slice(0),
    status:status});

  if (!this.renderQueuePaused) {
    this.startQueueTimer(this.RENDER_PAUSE);
  }
}

window.MapDataRequest.prototype.startQueueTimer = function(delay) {
  if (this.renderQueueTimer === undefined) {
    var _this = this;
    this.renderQueueTimer = setTimeout( function() {
      _this.renderQueueTimer = setTimeout ( function() { _this.renderQueueTimer = undefined; _this.processRenderQueue(); }, (delay||0)*1000 );
    }, 0);
  }
}

window.MapDataRequest.prototype.pauseRenderQueue = function(pause) {
  this.renderQueuePaused = pause;
  if (pause) {
    if (this.renderQueueTimer) {
      clearTimeout(this.renderQueueTimer);
      this.renderQueueTimer = undefined;
    }
  } else {
    if (this.renderQueue.length > 0) {
      this.startQueueTimer(this.RENDER_PAUSE);
    }
  }
}

window.MapDataRequest.prototype.processRenderQueue = function() {
  var drawEntityLimit = this.RENDER_BATCH_SIZE;


//TODO: we don't take account of how many of the entities are actually new/removed - they
// could already be drawn and not changed. will see how it works like this...
  while (drawEntityLimit > 0 && this.renderQueue.length > 0) {
    var current = this.renderQueue[0];

    if (current.deleted.length > 0) {
      var deleteThisPass = current.deleted.splice(0,drawEntityLimit);
      drawEntityLimit -= deleteThisPass.length;
      this.render.processDeletedGameEntityGuids(deleteThisPass);
    }

    if (drawEntityLimit > 0 && current.entities.length > 0) {
      var drawThisPass = current.entities.splice(0,drawEntityLimit);
      drawEntityLimit -= drawThisPass.length;
      this.render.processGameEntities(drawThisPass);
    }

    if (current.deleted.length == 0 && current.entities.length == 0) {
      this.renderQueue.splice(0,1);
      this.debugTiles.setState(current.id, current.status);
    }


  }

  if (this.renderQueue.length > 0) {
    this.startQueueTimer(this.RENDER_PAUSE);
  } else if (Object.keys(this.queuedTiles).length == 0) {

    this.render.endRenderPass();

    var endTime = new Date().getTime();
    var duration = (endTime - this.refreshStartTime)/1000;

    console.log('finished requesting data! (took '+duration+' seconds to complete)');

    window.runHooks ('mapDataRefreshEnd', {});

    var longStatus = '資料方塊: ' + this.cachedTileCount + ' 快取, ' +
                 this.successTileCount + ' 讀取完畢, ' +
                 (this.staleTileCount ? this.staleTileCount + ' 執行中, ' : '') +
                 (this.failedTileCount ? this.failedTileCount + ' 失敗, ' : '') +
                 '花費 ' + duration + ' 秒';

    // refresh timer based on time to run this pass, with a minimum of REFRESH seconds
    var minRefresh = map.getZoom()>12 ? this.REFRESH_CLOSE : this.REFRESH_FAR;
    var refreshTimer = Math.max(minRefresh, duration*this.FETCH_TO_REFRESH_FACTOR);
    this.refreshOnTimeout(refreshTimer);
    this.setStatus (this.failedTileCount ? '錯誤' : this.staleTileCount ? '資料過期' : '完成', longStatus);

  }

}


;

/*
OMS doesn't cancel the original click event, so the topmost marker will get a click event while spiderfying.
Also, OMS only supports a global callback for all managed markers. Therefore, we will use a custom event that gets fired
for each marker.
*/

window.setupOMS = function() {
  window.oms = new OverlappingMarkerSpiderfier(map, {
    keepSpiderfied: true,
    legWeight: 3.5,
    legColors: {
      usual: '#FFFF00',
      highlighted: '#FF0000'
    }
  });

  window.oms.addListener('click', function(marker) {
    map.closePopup();
    marker.fireEvent('spiderfiedclick', {target: marker});
  });
  window.oms.addListener('spiderfy', function(markers) {
    map.closePopup();
  });
  map._container.addEventListener("keypress", function(ev) {
    if(ev.keyCode === 27) // Esc
      window.oms.unspiderfy();
  }, false);
}

window.registerMarkerForOMS = function(marker) {
  marker.on('add', function () {
    window.oms.addMarker(marker);
  });
  marker.on('remove', function () {
    window.oms.removeMarker(marker);
  });
  if(marker._map) // marker has already been added
    window.oms.addMarker(marker);
}




;

﻿// ORNAMENTS ///////////////////////////////////////////////////////

// added as part of the ingress #helios in 2014, ornaments
// are additional image overlays for portals
// currently there are 28 known ornaments: ap$x$suffix
// - cluster portals (without suffix)
// - volatile portals (_v)
// - meeting points (_start)
// - finish points (_end)
// (there are 7 different colors for each of them)


window.ornaments = {}
window.ornaments.OVERLAY_SIZE = 60;
window.ornaments.OVERLAY_OPACITY = 0.6;

window.ornaments.setup = function() {
  window.ornaments._portals = {};
  window.ornaments._layer = L.layerGroup();
  window.addLayerGroup('碎片', window.ornaments._layer, true);
}

// quick test for portal having ornaments
window.ornaments.isInterestingPortal = function(portal) {
  return portal.options.data.ornaments.length != 0;
}

window.ornaments.addPortal = function(portal) {
  var guid = portal.options.guid;

  window.ornaments.removePortal(portal);

  var size = window.ornaments.OVERLAY_SIZE;
  var latlng = portal.getLatLng();

  if (portal.options.data.ornaments) {
    window.ornaments._portals[guid] = portal.options.data.ornaments.map(function(ornament) {
      var icon = L.icon({
        iconUrl: "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/"+ornament+".png",
        iconSize: [size, size],
        iconAnchor: [size/2,size/2],
        className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
      });

      return L.marker(latlng, {icon: icon, clickable: false, keyboard: false, opacity: window.ornaments.OVERLAY_OPACITY }).addTo(window.ornaments._layer);
    });
  }
}

window.ornaments.removePortal = function(portal) {
  var guid = portal.options.guid;
  if(window.ornaments._portals[guid]) {
    window.ornaments._portals[guid].forEach(function(marker) {
      window.ornaments._layer.removeLayer(marker);
    });
    delete window.ornaments._portals[guid];
  }
}


;

// created to start cleaning up "window" interaction
//

window.currentPane = '';

window.show = function(id) {
  if(window.currentPane == id) return;
  window.currentPane = id;
  window.hideall();

  runHooks("paneChanged", id);

  switch(id) {
    case 'all':
    case 'faction':
    case 'alerts':
      window.chat.show(id);
      break;
    case 'debug':
      window.debug.console.show();
      break;
    case 'map':
      window.smartphone.mapButton.click();
      $('#portal_highlight_select').show();
      $('#farm_level_select').show();
      break;
    case 'info':
      window.smartphone.sideButton.click();
      break;
  }

  if (typeof android !== 'undefined' && android && android.switchToPane) {
    android.switchToPane(id);
  }
}

window.hideall = function() {
  $('#chatcontrols, #chat, #chatinput, #sidebartoggle, #scrollwrapper, #updatestatus, #portal_highlight_select').hide();
  $('#farm_level_select').hide();
  $('#map').css('visibility', 'hidden');
  $('.ui-tooltip').remove();
}


;

// PLAYER NAMES //////////////////////////////////////////////////////



// test to see if a specific player GUID is a special system account (e.g. __JARVIS__, __ADA__) that shouldn't
// be listed as a player
window.isSystemPlayer = function(name) {

  switch (name) {
    case '__ADA__':
    case '__JARVIS__':
      return true;

    default:
      return false;
  }

}


;

/// PORTAL DATA TOOLS ///////////////////////////////////////////////////
// misc functions to get portal info

// search through the links data for all that link from or to a portal. returns an object with separate lists of in
// and out links. may or may not be as accurate as the portal details, depending on how much data the API returns
window.getPortalLinks = function(guid) {

  var links = { in: [], out: [] };

  $.each(window.links, function(g,l) {
    var d = l.options.data;

    if (d.oGuid == guid) {
      links.out.push(g);
    }
    if (d.dGuid == guid) {
      links.in.push(g);
    }
  });

  return links;
}

window.getPortalLinksCount = function(guid) {
  var links = getPortalLinks(guid);
  return links.in.length+links.out.length;
}


// search through the fields for all that reference a portal
window.getPortalFields = function(guid) {
  var fields = [];

  $.each(window.fields, function(g,f) {
    var d = f.options.data;

    if ( d.points[0].guid == guid
      || d.points[1].guid == guid
      || d.points[2].guid == guid ) {

      fields.push(g);
    }
  });

  return fields;
}

window.getPortalFieldsCount = function(guid) {
  var fields = getPortalFields(guid);
  return fields.length;
}


// find the lat/lon for a portal, using any and all available data
// (we have the list of portals, the cached portal details, plus links and fields as sources of portal locations)
window.findPortalLatLng = function(guid) {
  if (window.portals[guid]) {
    return window.portals[guid].getLatLng();
  }

  // not found in portals - try the cached (and possibly stale) details - good enough for location
  var details = portalDetail.get(guid);
  if (details) {
    return L.latLng (details.latE6/1E6, details.lngE6/1E6);
  }

  // now try searching through fields
  for (var fguid in window.fields) {
    var f = window.fields[fguid].options.data;

    for (var i in f.points) {
      if (f.points[i].guid == guid) {
        return L.latLng (f.points[i].latE6/1E6, f.points[i].lngE6/1E6);
      }
    }
  }

  // and finally search through links
  for (var lguid in window.links) {
    var l = window.links[lguid].options.data;
    if (l.oGuid == guid) {
      return L.latLng (l.oLatE6/1E6, l.oLngE6/1E6);
    }
    if (l.dGuid == guid) {
      return L.latLng (l.dLatE6/1E6, l.dLngE6/1E6);
    }
  }

  // no luck finding portal lat/lng
  return undefined;
};


(function() {
  var cache = {};
  var cache_level = 0;
  var GC_LIMIT = 15000; // run garbage collector when cache has more that 5000 items
  var GC_KEEP  = 10000; // keep the 4000 most recent items

  window.findPortalGuidByPositionE6 = function(latE6, lngE6) {
    var item = cache[latE6+","+lngE6];
    if(item) return item[0];

    // now try searching through currently rendered portals
    for(var guid in window.portals) {
      var data = window.portals[guid].options.data;
      if(data.latE6 == latE6 && data.lngE6 == lngE6) return guid;
    }

    // now try searching through fields
    for(var fguid in window.fields) {
      var points = window.fields[fguid].options.data.points;

      for(var i in points) {
        var point = points[i];
        if(point.latE6 == latE6 && point.lngE6 == lngE6) return point.guid;
      }
    }

    // and finally search through links
    for(var lguid in window.links) {
      var l = window.links[lguid].options.data;
      if(l.oLatE6 == latE6 && l.oLngE6 == lngE6) return l.oGuid;
      if(l.dLatE6 == latE6 && l.dLngE6 == lngE6) return l.dGuid;
    }

    return null;
  };

  window.pushPortalGuidPositionCache = function(guid, latE6, lngE6) {
    cache[latE6+","+lngE6] = [guid, Date.now()];
    cache_level += 1;

    if(cache_level > GC_LIMIT) {
      Object.keys(cache) // get all latlngs
        .map(function(latlng) { return [latlng, cache[latlng][1]]; })  // map them to [latlng, timestamp]
        .sort(function(a,b) { return b[1] - a[1]; }) // sort them
        .slice(GC_KEEP) // drop the MRU
        .forEach(function(item) { delete cache[item[0]] }); // delete the rest
      cache_level = Object.keys(cache).length
    }
  }
})();


// get the AP gains from a portal, based only on the brief summary data from portals, links and fields
// not entirely accurate - but available for all portals on the screen
window.getPortalApGain = function(guid) {

  var p = window.portals[guid];
  if (p) {
    var data = p.options.data;

    var linkCount = getPortalLinksCount(guid);
    var fieldCount = getPortalFieldsCount(guid);

    var result = portalApGainMaths(data.resCount, linkCount, fieldCount);
    return result;
  }

  return undefined;
}

// given counts of resonators, links and fields, calculate the available AP
// doesn't take account AP for resonator upgrades or AP for adding mods
window.portalApGainMaths = function(resCount, linkCount, fieldCount) {

  var deployAp = (8-resCount)*DEPLOY_RESONATOR;
  if (resCount == 0) deployAp += CAPTURE_PORTAL;
  if (resCount != 8) deployAp += COMPLETION_BONUS;
  // there could also be AP for upgrading existing resonators, and for deploying mods - but we don't have data for that
  var friendlyAp = deployAp;

  var destroyResoAp = resCount*DESTROY_RESONATOR;
  var destroyLinkAp = linkCount*DESTROY_LINK;
  var destroyFieldAp = fieldCount*DESTROY_FIELD;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var destroyAp = destroyResoAp+destroyLinkAp+destroyFieldAp;
  var enemyAp = destroyAp+captureAp;

  return {
    friendlyAp: friendlyAp,
    enemyAp: enemyAp,
    destroyAp: destroyAp,
    destroyResoAp: destroyResoAp,
    captureAp: captureAp
  }
}


;

/// PORTAL DETAIL //////////////////////////////////////
// code to retrieve the new portal detail data from the servers

// NOTE: the API for portal detailed information is NOT FINAL
// this is a temporary measure to get things working again after a major change to the intel map
// API. expect things to change here


// anonymous function wrapper for the code - any variables/functions not placed into 'window' will be private
(function(){

var cache;
var requestQueue = {};

window.portalDetail = function() {};

window.portalDetail.setup = function() {
  cache = new DataCache();

  cache.startExpireInterval(20);
}

window.portalDetail.get = function(guid) {
  return cache.get(guid);
}

window.portalDetail.isFresh = function(guid) {
  return cache.isFresh(guid);
}


var handleResponse = function(guid, data, success) {
  delete requestQueue[guid];

  if (!data || data.error || !data.result) {
    success = false;
  }

  if (success) {

    var dict = decodeArray.portalDetail(data.result);

    // entity format, as used in map data
    var ent = [guid,dict.timestamp,data.result];

    cache.store(guid,dict);

    //FIXME..? better way of handling sidebar refreshing...

    if (guid == selectedPortal) {
      renderPortalDetails(guid);
    }

    window.runHooks ('portalDetailLoaded', {guid:guid, success:success, details:dict, ent:ent});

  } else {
    if (data && data.error == "RETRY") {
      // server asked us to try again
      portalDetail.request(guid);
    } else {
      window.runHooks ('portalDetailLoaded', {guid:guid, success:success});
    }
  }

}

window.portalDetail.request = function(guid) {
  if (!requestQueue[guid]) {
    requestQueue[guid] = true;

    window.postAjax('getPortalDetails', {guid:guid},
      function(data,textStatus,jqXHR) { handleResponse(guid, data, true); },
      function() { handleResponse(guid, undefined, false); }
    );
  }

}



})(); // anonymous wrapper function end




;

// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.renderPortalDetails = function(guid) {
  selectPortal(window.portals[guid] ? guid : null);

  if (guid && !portalDetail.isFresh(guid)) {
    portalDetail.request(guid);
  }

  // TODO? handle the case where we request data for a particular portal GUID, but it *isn't* in
  // window.portals....

  if(!window.portals[guid]) {
    urlPortal = guid;
    $('#portaldetails').html('');
    if(isSmartphone()) {
      $('.fullimg').remove();
      $('#mobileinfo').html('<div style="text-align: center"><b>按此處檢視資訊頁面</b></div>');
    }
    return;
  }

  var portal = window.portals[guid];
  var data = portal.options.data;
  var details = portalDetail.get(guid);

  // details and data can get out of sync. if we have details, construct a matching 'data'
  if (details) {
    data = getPortalSummaryData(details);
  }


  var modDetails = details ? '<div class="mods">'+getModDetails(details)+'</div>' : '';
  var miscDetails = details ? getPortalMiscDetails(guid,details) : '';
  var resoDetails = details ? getResonatorDetails(details) : '';

//TODO? other status details...
  var statusDetails = details ? '' : '<div id="portalStatus">數據讀取中...</div>';
 

  var img = fixPortalImageUrl(details ? details.image : data.image);
  var title = (details && details.title) || (data && data.title) || '(untitled)';

  var lat = data.latE6/1E6;
  var lng = data.lngE6/1E6;

  var imgTitle = title+'\n\n點擊顯示全部圖像.';


  // portal level. start with basic data - then extend with fractional info in tooltip if available
  var levelInt = (teamStringToId(data.team) == TEAM_NONE) ? 0 : data.level;
  var levelDetails = levelInt;
  if (details) {
    levelDetails = getPortalLevel(details);
    if(levelDetails != 8) {
      if(levelDetails==Math.ceil(levelDetails))
        levelDetails += "\n還需 8";
      else
        levelDetails += "\n還需 " + (Math.ceil(levelDetails) - levelDetails)*8;
      levelDetails += " 個震盪器級數才能升級";
    } else {
      levelDetails += "\n已完全升級";
    }
  }
  levelDetails = "等級 " + levelDetails;


  var linkDetails = [];

  var posOnClick = 'window.showPortalPosLinks('+lat+','+lng+',\''+escapeJavascriptString(title)+'\')';
  var permalinkUrl = '/intel?ll='+lat+','+lng+'&z=17&pll='+lat+','+lng;

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    // android devices. one share link option - and the android app provides an interface to share the URL,
    // share as a geo: intent (navigation via google maps), etc

    var shareLink = $('<div>').html( $('<a>').attr({onclick:posOnClick}).text('分享能量塔') ).html();
    linkDetails.push('<aside>'+shareLink+'</aside>');

  } else {
    // non-android - a permalink for the portal
    var permaHtml = $('<div>').html( $('<a>').attr({href:permalinkUrl, title:'產生一個連結到這個能量塔'}).text('能量塔連結') ).html();
    linkDetails.push ( '<aside>'+permaHtml+'</aside>' );

    // and a map link popup dialog
    var mapHtml = $('<div>').html( $('<a>').attr({onclick:posOnClick, title:'連結到其他地圖 (例如 Google)'}).text('地圖連結') ).html();
    linkDetails.push('<aside>'+mapHtml+'</aside>');

  }

  $('#portaldetails')
    .html('') //to ensure it's clear
    .attr('class', TEAM_TO_CSS[teamStringToId(data.team)])
    .append(
      $('<h3>').attr({class:'title'}).text(title),

      $('<span>').attr({
        class: 'close',
        title: '關閉 [w]',
        onclick:'renderPortalDetails(null); if(isSmartphone()) show("map");',
        accesskey: 'w'
      }).text('X'),

      // help cursor via ".imgpreview img"
      $('<div>')
      .attr({class:'imgpreview', title:imgTitle, style:"background-image: url('"+img+"')"})
      .append(
        $('<span>').attr({id:'level', title: levelDetails}).text(levelInt),
        $('<img>').attr({class:'hide', src:img})
      ),

      modDetails,
      miscDetails,
      resoDetails,
      statusDetails,
      '<div class="linkdetails">' + linkDetails.join('') + '</div>'
    );

  // only run the hooks when we have a portalDetails object - most plugins rely on the extended data
  // TODO? another hook to call always, for any plugins that can work with less data?
  if (details) {
    runHooks('portalDetailsUpdated', {guid: guid, portal: portal, portalDetails: details, portalData: data});
  }
}



window.getPortalMiscDetails = function(guid,d) {

  var randDetails;

  if (d) {

    // collect some random data that’s not worth to put in an own method
    var linkInfo = getPortalLinks(guid);
    var maxOutgoing = getMaxOutgoingLinks(d);
    var linkCount = linkInfo.in.length + linkInfo.out.length;
    var links = {incoming: linkInfo.in.length, outgoing: linkInfo.out.length};

    var title = '最多 ' + maxOutgoing + ' 條連出線\n' +
                links.outgoing + ' 條連出\n' +
                links.incoming + ' 條連入\n' +
                '(共' + (links.outgoing+links.incoming) + ' 條)'
    var linksText = ['連線數', links.outgoing+' 出 / '+links.incoming+' 入', title];

    var player = d.owner
      //iF: Add title for long player name
      ? '<span class="nickname" title="' + d.owner + '">' + d.owner + '</span>'
      : '-';
    var playerText = ['擁有者', player];


    var fieldCount = getPortalFieldsCount(guid);

    var fieldsText = ['控制場', fieldCount];

    var apGainText = getAttackApGainText(d,fieldCount,linkCount);

    var attackValues = getPortalAttackValues(d);


    // collect and html-ify random data

    var randDetailsData = [
      // these pieces of data are only relevant when the portal is captured
      // maybe check if portal is captured and remove?
      // But this makes the info panel look rather empty for unclaimed portals
      playerText, getRangeText(d),
      linksText, fieldsText,
      getMitigationText(d,linkCount), getEnergyText(d),
      // and these have some use, even for uncaptured portals
      apGainText, getHackDetailsText(d),
    ];

    if(attackValues.attack_frequency != 0)
      randDetailsData.push([
        '<span title="打擊頻率" class="text-overflow-ellipsis">打擊頻率</span>',
        '×'+attackValues.attack_frequency]);
    if(attackValues.hit_bonus != 0)
      randDetailsData.push(['打擊獎勵', attackValues.hit_bonus+'%']);
    if(attackValues.force_amplifier != 0)
      randDetailsData.push([
        '<span title="攻擊強化" class="text-overflow-ellipsis">攻擊強化</span>',
        '×'+attackValues.force_amplifier]);

    randDetails = '<table id="randdetails">' + genFourColumnTable(randDetailsData) + '</table>';


    // artifacts - tacked on after (but not as part of) the 'randdetails' table
    // instead of using the existing columns....

    if (d.artifactBrief && d.artifactBrief.target && Object.keys(d.artifactBrief.target).length > 0) {
      var targets = Object.keys(d.artifactBrief.target);
//currently (2015-07-10) we no longer know the team each target portal is for - so we'll just show the artifact type(s) 
       randDetails += '<div id="artifact_target">目標能量塔: '+targets.map(function(x) { return x.capitalize(); }).join(', ')+'</div>';
    }

    // shards - taken directly from the portal details
    if (d.artifactDetail) {
      randDetails += '<div id="artifact_fragments">碎片: '+d.artifactDetail.displayName+' #'+d.artifactDetail.fragments.join(', ')+'</div>';
    }

  }

  return randDetails;
}


// draws link-range and hack-range circles around the portal with the
// given details. Clear them if parameter 'd' is null.
window.setPortalIndicators = function(p) {

  if(portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  portalRangeIndicator = null;
  if(portalAccessIndicator) map.removeLayer(portalAccessIndicator);
  portalAccessIndicator = null;

  // if we have a portal...

  if(p) {
    var coord = p.getLatLng();

    // range is only known for sure if we have portal details
    // TODO? render a min range guess until details are loaded..?

    var d = portalDetail.get(p.options.guid);
    if (d) {
      var range = getPortalRange(d);
      portalRangeIndicator = (range.range > 0
          ? L.geodesicCircle(coord, range.range, {
              fill: false,
              color: RANGE_INDICATOR_COLOR,
              weight: 3,
              dashArray: range.isLinkable ? undefined : "10,10",
              clickable: false })
          : L.circle(coord, range.range, { fill: false, stroke: false, clickable: false })
        ).addTo(map);
    }

    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, clickable: false }
    ).addTo(map);
  }

}

// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it's still the same portal that just needs an
// update.
window.selectPortal = function(guid) {
  var update = selectedPortal === guid;
  var oldPortalGuid = selectedPortal;
  selectedPortal = guid;

  var oldPortal = portals[oldPortalGuid];
  var newPortal = portals[guid];

  // Restore style of unselected portal
  if(!update && oldPortal) setMarkerStyle(oldPortal,false);

  // Change style of selected portal
  if(newPortal) {
    setMarkerStyle(newPortal, true);

    if (map.hasLayer(newPortal)) {
      newPortal.bringToFront();
    }
  }

  setPortalIndicators(newPortal);

  runHooks('portalSelected', {selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid});
  return update;
}


;

// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

// returns displayable text+link about portal range
window.getRangeText = function(d) {
  var range = getPortalRange(d);
  
  var title = '基礎範圍:\t' + digits(Math.floor(range.base))+'公尺'
    + '\nLink amp 增益:\t×'+range.boost
    + '\n範圍:\t'+digits(Math.floor(range.range))+'公尺';
  
  if(!range.isLinkable) title += '\n能量塔缺少共震器，無法建立連線';
  
  return ['範圍',
      '<a onclick="window.rangeLinkClick()"'
    + (range.isLinkable ? '' : ' style="text-decoration:line-through;"')
    + '>'
    + (range.range > 1000
      ? Math.floor(range.range/1000) + ' 公里'
      : Math.floor(range.range)      + ' 公尺')
    + '</a>',
    title];
}


// given portal details, returns html code to display mod details.
window.getModDetails = function(d) {
  var mods = [];
  var modsTitle = [];
  var modsColor = [];
  $.each(d.mods, function(ind, mod) {
    var modName = '';
    var modTooltip = '';
    var modColor = '#000';

    if (mod) {
      // all mods seem to follow the same pattern for the data structure
      // but let's try and make this robust enough to handle possible future differences

      modName = mod.name || '(未知模組)';

      // iF:mod name translate.
      if      (modName === 'Portal Shield')      modName = '能量塔護盾';
      else if (modName === 'AXA Shield')         modName = 'AXA護盾';
      else if (modName === 'Heat Sink')          modName = '散熱器';
      else if (modName === 'Multi-hack')         modName = '多重入侵';
      else if (modName === 'Force Amp')          modName = '功率增幅';
      else if (modName === 'Turret')             modName = '砲塔';
      else if (modName === 'Link Amp')           modName = '連線增幅';
      else if (modName === 'SoftBank Ultra Link') modName = 'SoftBank超連結';
      // iF:rarity translate
      if (mod.rarity) {
        //modName = mod.rarity.capitalize().replace(/_/g,' ') + ' ' + modName;
        var modRarity = mod.rarity.capitalize().replace(/_/g,' ');
        if      (modRarity === 'Common')    modRarity = '常見 ';
        else if (modRarity === 'Rare')      modRarity = '罕見 ';
        else if (modRarity === 'Very rare') modRarity = '十分罕見 ';
        modName = modRarity + modName;
      }
      //iF:remove duplicate information
      //modTooltip = modName + '\n';
      if (mod.owner) {
        modTooltip += '擁有者: '+ mod.owner + '\n';
      }

      if (mod.stats) {
        modTooltip += '屬性:';
        for (var key in mod.stats) {
          if (!mod.stats.hasOwnProperty(key)) continue;
          var val = mod.stats[key];

          // if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

          // special formatting for known mod stats, where the display of the raw value is less useful
          if      (key === 'HACK_SPEED')            val = (val/10000)+'% 入侵速度'; // 500000 = 50%
          else if (key === 'HIT_BONUS')             val = (val/10000)+'% 打擊獎勵'; // 300000 = 30%
          else if (key === 'ATTACK_FREQUENCY')      val = (val/1000) +'x 攻擊頻率'; // 2000 = 2x
          else if (key === 'FORCE_AMPLIFIER')       val = (val/1000) +'x 攻擊力強化'; // 2000 = 2x
          else if (key === 'LINK_RANGE_MULTIPLIER') val = (val/1000) +'x 連結範圍'; // 2000 = 2x
          else if (key === 'LINK_DEFENSE_BOOST')    val = (val/1000) +'x 連結防禦'; // 1500 = 1.5x
          else if (key === 'REMOVAL_STICKINESS' && val > 100) val = (val/10000)+'% 黏性'; // an educated guess
          //iF:translate mod stats
          else if (key === 'OUTGOING_LINKS_BONUS')  val =  val + ' 連出數';
          else if (key === 'BURNOUT_INSULATION')    val =  val + ' 燒毀點';
          else if (key === 'REMOVAL_STICKINESS')    val =  val + '% 黏性';
          else if (key === 'MITIGATION')            val =  val + '% 減傷';
          else val = val + ' ' + key.capitalize().replace(/_/g,' ');
          // else display unmodified. correct for shield mitigation and multihack - unknown for future/other mods
          //iF:translate mod stats
          //modTooltip += '\n+' +  val + ' ' + key.capitalize().replace(/_/g,' ');
          modTooltip += '\n+' +  val;
        }
      }

      if (mod.rarity) {
        modColor = COLORS_MOD[mod.rarity];
      } else {
        modColor = '#fff';
      }
    }

    mods.push(modName);
    modsTitle.push(modTooltip);
    modsColor.push(modColor);
  });


  var t = '';
  for (var i=0; i<mods.length; i++) {
    //iF: Add mod image
    var modImage = '';
    
    if      (mods[i] == '常見 能量塔護盾')     modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 能量塔護盾')     modImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAABDCAYAAADHyrhzAAAAA3NCSVQICAjb4U/gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAACWelRYdFJhdyBwcm9maWxlIHR5cGUgQVBQMQAAeJxVjkEOwyAMBO+8gieMbTDwHFSRKlLVVvn/oQdI2+xlpVlr1+E+nuPYb/F9vLb9MUKMMUaRGlJLTTtQmVIwQVCgLOTTvdVCAmTxwUUZb24uxXxeGECbPYmFTE0NpM98dX09d/438vnXKV2Z/jqzWrO62HVLbD4BQPgA51U1dO8s/dUAABnfSURBVHhe7VwJeFTV2X5n3zKTyWSZSSZ7SEIWEhJDwpYqyCYUC+6iVsVWpYq/f6G4tC5o+9e6VaW4tVakBSoUUFR2ZJNNNrNgYoBA9oTsy2RmMtv/nRvucDPOhESr/s/ze57nPnc7c+8553vP+y3nuyMSiUUeUBGJRNwW6Ji/P5y9v2fx17gXXSz8ez0erinewp8L977H7Hy4G3sB/xvhMev9wBYMaM7/rxORWCL2CKXNS04sFnMjwfbC+4Od+97zRZEvUoaCjKEgwe12D0CH8NzfPfZe/vqPyAgAeJFUJuWQcTkU8FL3t/e9xp4nRIkvyoS8wb+bb5+QNwJxga/k+XPh3t81/nmB0PIjZwiJXCaXccgIxAVCqbNj4cb/zve6v98IkccfD0bPQrYPJHl23RcN/DV/e/ZM32cJ0fIjMoTIUCgVXm0SiA/8SV54TSKRcIhh+0Bo8WfH8FzCMzqTmj+bg5cou89rAnbscrk4SQv3rC5/PlyUcO34Ibf0uFE/6PuFfRcpVUqP7xz3J11e+jwi2LnwGn/u77fCa1KplJOcRx6C+6feCH2LBSvLt6C+o9WLCl7bCG2MQNzgdDq96OCeexEZQnQEQooQcez4B+GM+BEF+E3hdehqrMTLB95Hc1fH/wlTV6TWqDlkBNIa/qTP84O/vfAazwkMGUyy4mATZhX8FFenZaK+5HP8adcqyGQyyOVybjDMCVno7WhHQ8NpKBQKrk28tH25gpcqQ4aQM9ixPy4Rcosvl/DP+t44Q2XO9Lz0wOueo4+s9Pxi7Ay/PJF5/VLPnMd3eBIyZnskEvX3ziWiIG2QFxm+WkOoJXiJ89ww2D1Wl0mbScgONXLGXYsFoyZAHCXGpx+sw4aivVAqlWD8IdQghfNfgCpCAY3HDbMNKD5xGnv3vw1LTzv3PIYwhgQmSV9E+HIHj5BAKPGnab5bzjClYEbODLx05TVAVyse27sCmw7sDMgP437xJqJNuTh3oQx9Tismxk1GuEuGTZuewsnifzLv6jvlFpEuWPc1ZPhKnUnQFxnsmhAl7JjNf27TmyAOT8WCvMlIviIMsnIrlu94E+WNNZxU2bP43/NcwPaGuByMmnQ/UmLcaHUCnXYXNFY3wqSEMIsbBw/sRdGxtbD2dnK/99Uc/rhDiJDLoeQ/j4ywOKRnT8ei5GxMHZ2DQ5/vwsObl6OhsXFIUjWnZiFswv0IlSdBKnKgzlELuGjawIgMQxZ6uquxddvTqKnaP6TnDaeSSB+i9yJDiAhfqbNzXpr8nqGAr6cIDoMqKR85ejNuvWoMpOESnNt4gFOdbL5zevxiNI39jhUeSQ6HA1arleOPBGMU5l19J84GRcCu1xMq3KjqBhpt3QiRyBHa50awuw9WhxN7PvsYpcUfwm13DPA5fNHA88vltM5/BBnioFBo4nNx/+gJuD82HZI+F145sRGvfLp2SIIZN34cnvz14/jbH99Gp+cCVly3BC1d3XiqtAgn5SbEB6ejz9GOZnc9XISWcAQjWmyEUWdGc+dp7Nz1PDqbyob0rsEqiQyhBg4ZgVAhRIMQEcwOYJJWm0fBlJCJuxLTYBptgrJNgRWrX8bR5kqv7SJEGXsGQ0JLSwsSjfF4cOo9GDnvigFt9LS5AIkIHi3QcKwVLxRXIy02CznBDjTQlDnZVg+NVAKDQwNDH6HEZsfp80XYuf01UFyOaxd7B29bsGMeLUKU+Nok3woZUnM6Ik2peKFwKsZFRGPjoR14q+QTlJ2vHFRKcfFxeOS+xbh58s0wVAdjy5bdaJfZMXfJNKgSlah4uQy11SdgUNgRpw/Fv06W4kVLB4J0yZiivxrt9nrsa9oKt9jOTd0kRSJSg1Ox7+Q/cPLYCvK2aDC/QRGFhYcNQIZQSwiRwI75TWswQR6diSSS7PzM0VBEanBy6za8c+QjznLkOYL3Ypk0enp6YIqKxJVXFeKu2+++1NQGOmwGtq2vQKhWi7wrI1F1tp8TRo5SwxNB8U0DRcDb3Hh69TZUavRYkJWLEJUT22ta0e3sQp/NhvHqcMgddpS2dGHnttfQ3VnLIcRut3OoYG3gESJEh9A++UbIkEVnYHRsBpZN/Rmsne14+8RmrNm3OaAsKLSIJ596EpPHTsaElAn4ctcp1HxRB7M+ArFxJnS3d6DhQhsM6WaYMyJwaO0XqKxvQm1TK8wxYUg3yJAdLseF+kY83fAV1nW2IS8sDyM1KTjasBdN9mpoJTrkK8fAINOhtO04ThStQHvz6WHhQxQeEU6mb78Hym++PCHUGqxOYeGtmBYRhsraChxoOo2O3h5u5FlhqLCRpJh2YBpkztw5eGDBA/2NchCCP/Sgqq4NcZEhEN3UH4HnSjFtWX7azuwsdm80izVQpMrqwqlPKvD8+TJckT4O6WoNOq0OFLVXEq0qUBisIPvOirMddmzf/yZam85y3MEjQ4gOX/4YNjIkcjUWXXM/thzbgJK68wFHfuasmbjjtttwww03QeKUou8rCzrrOqHPNUIipQAMdUBuVhFR9j+irrQJHU2dyLg65evPPNoHTx1R4xwy33vo+J0jWPXlKTxTfgS9aj1G60fD00PTSj0CGihh7WuHW+bGpqN/ROX5z4aMDpHRZPRyBs8JvE3BznlUMImzEU6LS0d+wkis+3wr51/wWoX3/NgcvfbaOfjlL+9hvE4GArXlDG0Th9ymy1bkEMIiXCV2vHpwDw41NyM7djRM0nDonXaEuOxQya34rLwa2w+9wj2vj7QO2xgafPmDR8iwkZETl0uSCMa7Rbv7G60OAT2d3kaWEZVkYwweu2kxpkTNxNHyEtYKJMXHI/OGXEhy+42tgOWikerY1Q4nqVaJBqguqkFEfgx00/Tofr8B1mo7wn8TB0+3C7ZXP0W7UoT5W9agmKaTXSaCVqqDSWKAWW5GT1MVdhx45rKDy1cQmSJNXs7w5QqhBmEIYGVa5nhkp43B66dOIjv/GphCY2B3OtBt70CwRIwJah1yyIp0hjmhjlUPuSF8Rc8uknsC+S864pN2ukrWODeVomnroI14BwXks3WSlpETF0j6NUVfgx1bdnyOvfVVsMokUGmCIBfJcX7/Gli72zmtwvhiMO4YHjJUeoSk5EMhj0BUUDLyjAUwKWNgI6vQIupFPVmPjWIbetFNZObA1IxU5MSbkJsWhchkvZcfuI6TJNveqoIhOhIYRcGdOELBZ3XY9PYxuJx9iDboYbFYYO+1wWLrhcPpwsiEGJp4ZGxFGNAmrkdF6Q5cnzsFBh2h0+FCe3cXTpIz+Pznu9HkJlVKoYCmsr30jK4hCYVDxmCIEPJHWv6NKMyeiDidmhorg0KlpNEn/0SswOkuObo8EgRzazAS2Ikbm2n2NPaShiG4JwYBubFAEB1zhYVuztIWTluwoK0XgA/eKEesKQypiWHQZNO9MPLVDtNYJl+sz6pTvTsW34Hw0FDkmpORpDYhdXQ2+ohA39v1MfpaGjB74gy8uX01zpDmYbYG03I8Mnju4Pfs/rCQcWXWA8hPvB6Wvl5og3QI1UWhWdyBz20n0SLqgExEbrVUToyuh8athk4WDo1IDYVYAxcJv9VGOJdakUADOY0Go7G2EUFKFeKpQ9FkaUbekgSHwYWld72H+vJapCREY0pOFtKTzNh3uJy0hB3pI6OQ+ussfPLyx/jpotlfk3hB1miUnK1Adnwy/mfaQtzzwWuoPMd08+WLKDIqkuOMQOhg2oTdY9bc7ImLMS43HmqNEiqVCga1DLubFCi21iBEoYdURdankmKXMi2ZyhT3JPGrVWS/0JDL+gAlWclBNP/b6TybAhZa8kF0ZBfoxlBDDQMbe2x5KyJiQxBbQNwRQfeqaPD29MF0Z3+8dPPybXj/6GpOo7H28xqBl3ykVIM7p96L3+9Ygbb6rzi+YNqEIUDIHUJbY5jIWID85OvRSxLSqyPQK7Ni24Wt6HJ2k+2gokbJIJYr4GYbM5ZEzJCjIBAz5YnUQM6VhwZJSlPrqhoLlB290Gg0KMwahavmFEA88ZK2WfvkHhzfdwrGiBDkpCegurYZ5xpbMe/FSRghj8VtN92Lfx1/J6C4s+JHYNGshzF/xVNwWVovDwvWXCEyhOjg7Qu2573aWeMfRl7mCKhlKlg8SuzvvACnRoRg0iAMFWww1MHB8EiUHFnKpSJyuSnHgzaXlTiTpoaTNtKGyK23QN3jpsFQwWyUAmP9tJesaQf5LWUVHehu6UbKlTEIZyhqA1b/dSu2nFrFoYL3hIWWZmSQHvcW3oknt75O5n6zlysGszWGhYxJ2fejIPlm1FjrcMRyGN1uG0Qe4gmRm4yvYGjIOvWoldCIQ6AW6WiSiKEk9rxgI+tS1E51aUmC0NFHTlhhtwSxZDJ75ErSNiNI82QhdGHMwBE54cRXuyvx1oaPaOrp8MuFM5AaH4Vtq0/iw5JVeGPHKwElPjIqFo/Megh3/3UJ1Rla7NSLDKHW4OOZQjuDjXpOzo2YkDoZNqUa1bJ22EjHjzGORKxWBhEhSC0V06CQJqFO60ibUJAKFJgiFAE1xBkO2ltJw1R2AgvTARXx6ZeHupCergOYxAOUPc9UQpcYgtzbSYUepUqhwPFTh/D7d5/nOIOPorE28twwOSWbDL9JeOLgO+ghBLPrPFf40yjD1iZipQbJBTcjOiQDBmcEmiyNSKXjkepMHHEdh4xUbZgoEt1SB9rIPzAqzOh09pIK1pAGspF8XGjua0SfogfPzCiAZk8V1h09ihSKb0wbMwrmnGioCimiQwNHPheOPvcFN0WLD5chaTbZNfFJeG/5fkz/VS6WvPkg1q/b+LXhCyZbqJNsDqN5BH6edzVeWP/ikPiCVfJaoMI4hpAveG3CR8J+lj8DFVYL2rRxmJw2E1FSBaxi8mFIpbaRBeogsrCS+ghSiaEigZvJRmAIyIgnTaL3aVcpdfgAmdhWCtKQlh+fRpbXdKrDbCSy7ivXNiPxBjJEBLPn8PN1GLvEjNdfewObPlyP+TNvgUdnQLtbgl6Jggw+CSHRDRsZbg5LJ87sWk32Ra9XiwjRIbQx2PGwOIN1xWyIwpiIGHxAHmNQcg6iRl4FrS6MXmaBo6cFTmsnnF3tePCaW/Hw0ru43ls3N5HjRJaVh9SiglQlDVLj8Sqs2boPpWcq0ECLzqR3cEVyKmLCohAfZkDBtfk4d+4sHO12xOaZETY5EoeXfk7hvUbcccssrFn/HCknFZadKsLxtgbIggxQEnGrxCpoiOC1Ui3qWkpQc/Lr6AkEFc5rDRTHEK6F8GsnUlUw5l91B/Yd+jfOdTZDRtpASxEq3hbh1zN0FGd4bs6zUE2hec4KQf+zF6sxwhwBU7oSPST98jNtkMpdpKopstXtgE6rQWpEOHRzBza39kM7as80YewiMmGpMK+1lgZ4ZX0ZmqQyjIsfDa3LATGhwU0eq4ViKX3kve7Y9S9Unz7oXYHz5Q0+AvaNvVbWGKM5Ay9OuxEJJjMWU/D3cFXgyPTSeU/g0WcehzxJiRd+tQbnjjYgWC9HJA1gbnoyKs7X40xtNaRkwmclJNIWh5R8ivJM6x+Qw78/jAt13Zh+40+g0Crw1fEi/G7POmyuOoNIfSISZPE0AOS7iF1QsunqksIg1sJO1zYfegqWdrLbh1hEEcaIAfGMwaxRHimaxDxMHpGLn6aOhlKvwZHdm7DixBbv+imzVlldxu4MKVmxo7D42d9wTWrYwCJdJOVbTZzPwRWyG1gcFOSzsSkUqJSsPo9N7hbYyTGLU0Zxhmk1mfiZZMXqiZxFfVaaog5Ud9hwrKESBz59eUCE3NcfEVqt3Jovh7phFpnaQAtGeZhoTsA88k/y4kbg05oiLNrwCvkPTBV8vWgVQVj+0Cu4rfB2/OXv62EMDYYpMgw2lw1dXRZYumxIJb4YNy2XYhQWNH9Vh5RbMjmtUv76Z1h6YB+2dzRCQ2s0EheFB8g9tzl6ycTuwVzjdQh1B9NyZDOqXdXk0XaivPwjNFTsG1bPuOi4cM3Edw1VaGsIURMUTHKJGYW4oDA8mjEB0iSKTtd346Udy/BFzVkEBVE84eLKOWsRQwubo9nho7BkwaMAH91jiGBx23zayBD1LRWf1ODfHT3kwIXDaGCGHPkWFits3d3otXdB5ZRjpl6HBgr7ne9xoL6lFmWln6C57qh3rYSPe/KahOcKfs+vr3wjZPANZvFQeQJFvuIzsUgfg4KoBIry2XDP2j+guI755/5LXFQyll73JG79yVwcKylFK6Uy5aclwbiQVCuV3vJzOPPpl3j0w/04TN03GGOJHMlosvXQVHAROZLeddq42GpSUDxCKTLeLbGhsaUU5776BF0XqoeFCL6yKDQsdEgrajxfCC1VZhApyRqVJBYgOdSMX2dPhjyOvEiPDDu3rsU/j2yGWk0DRghhdfkVeC4yRdPpzp/ch5kLJhNsBG0nn6psZxH2Bhkhio3g/Jg+MmFFYg96HeTP0LM1ZFRRUAAuG63HdNvR2mNDedGHqCj5mEMgn3vhb62EX2nzl/HzrZDh7QI1QB6Tiaz0QtxnSsLPopMhDVLi4Q0vYyUFjgcrjy98FPMfvgfFJV/gsSW/RW7uPSjRmtBHvACKmzC/wkVqk/k6IaQplHa2FHqRoD12mioNKD25Bi01p74RGoQ/EoUYQoa8Ci/kDN5K5e0PLufCEANtVCYWpk3EiPHRkLll2PPJRvxt7wbOVecj6bymYb9h19iz2uxaFM5bAnkE2Szkz7jJ71GRqGgxDUHE9JYu4gpydNpoX0dBoabaEzh7bg/6OliQlMWk+7P+hHtfO2KwddZvrE0GE4GI3PnQ9ImYO3IsfjcyBxqFHH/Y/A7+vHvwFfmRt74AfXQaOtrI5nDKYBZHQkkGlU5JUR+aIj09jbQ4dBpNDQdQVvQxTRH/WuvbwEMUrA8ekLkj1Cz+8rj85W3wiOFzuViD+sKSMDN3Bm7NzKGgiQjNh0rw201/4fiDR5U3z5PUyPT/egMa6jfZSsigkFh9hweNrW50tffgdMl2NNcehM3S5uUDxjnCjGHhKrsvAvzxg28Wz3eCDKFkWN5G7pjr8dgVEzEu3IiVBzbh0U3LvyY8mTYMGbe/CoVbgauCx6Kx4RSqLJ+h8cvtZC8c+TbCHtZvRVqd1m+2XyCE+KKFzxAURsn4DB12j4X/IlIKsSB/FmKzKMRfXIrfrXuD0zJ89p4qJBaFcx/HhZISVFXsROOFYs5OYW1g6x3CPE1fTvDN0hns3F++uTDrj43c95JvqYzL9CyY97SnaOl6zxs3PuzRa4IGvDc0NOp7acdg/RVpgjQDkMH7FYG+GvCXO87ziPAen3Es9GYhUSM3expuz7kSoq4qPLJ+GTlUTo5D+PnP55nz0Svh9yC8ZP1l7fnmfQrzLgIhgs8+5tHxn7EzhjUzgRHpV+KhvGlwdTfivzcuG+avv7vqXO648Esk3yxhX2kH+qrAN2ecR4QwJ529h6GAk4gsFHNzJmDLF1vhpHNuvl7MEeX3vMSE36r5SjlQ7if/W39aI1Du+A+CjO9Ott/uydz3JkL2D/R1QSDE+OMW37pCHmLHvH3Bf3Xk+wWjsEu+Xxz6SnwwPvCXHy685vu9ydC1SfLznm0rLZ4ybiv2PJY8NC2UM2m+J8efxpq00bPttrGXNMiA52/03MR+41sn0DX++cOt79MuqZzMZSEyfFHiRYqWPM+yJZj83gaIr/grdt74EFat+mDA14w8IrwcZFyIl64V4bX2E7TS2P/lNCvc3qyBPDQRBdx4gNZUr4X8+L2468iZfuQU5GNMNNUxJOCKPIfX1nC3PYVFLW5kZGZ4rVGvtEPklOASgpjYmEv31BR3V2hA3vmlZwi+ehR+0Sjtsw/Rxg8h89dhRUN9A3ImUWCWIkzVia+i7O6LwUrqUPW2qzG9/hFsm5mEWCOdNyWB8tjwxylHkHZ89qW6Tcsxb7MFfZ5KHDncb2Eead2EXzzxNp5poWesumh1qi0wTf0b/nkxZ3b/uxrci43YFvUn7j2X3r0dT/18LtbG0MKyqh01Sa/5tOsPFDO5/HqrmKUl0retYAgh/oBKraJVdjWF1zS0BKClVXIdKL8cIRpaNctaBpomWB3zFiat2oy7x07DoXUpmPrbVMx4/e+Q5N2GqSSd2M4VmP3sdXhw0wrUt72HRR8fRFrT41jGcrtYMWZhvFEFWUg0RtGiM7ep/oHFL47FX0LepXdswwOjMpFJdeoP34HrnsvDosNVSBo5BymhFC/RhuPeCZeEwKLH18yJgTmI1oVpseYuatfB9+NRuCgOE9fsgkiu4vrA+sL6xPrG+sj6yvrM+s7GQOqkdc8hlTCCavFCpL34d2/1L6rPYlxPHWpr6JLSClddOXa0R6P63EGcOc16bgEFqNBQXo5Riy0YvV+DtGfm4+2Vs9HcRMuNklqUFFPel6CUFKdBRXWnhJVieRMFeCX1KPuyDMocSkyjOFpFqw0uRTOOdp/F/gNZuPdiahn3iEmUIq3rQhG1a3xvM1oopJhjiIeHAsUdlGt6uSKW0EIw24QIoW9dvShho0hfK0FLa6giWmXnUGIIAeWco2b7m5DcbeHQUvbELBzaswWRGvo2hdZWzNFmRNtqUW98AKv/vAy6rvMo5OouQyHk9Bxataf4adKIJG6bft+p/ufQttS8Av+uSUQiVycU8QnxMGioncQHccHEXZTueOH0biTw7175Ee40hiOcckEYP1Sf2oX4i/f+lEuLVhQKYH1gfeHRwProRQTNDjYGP9oZArh4/z+DZ3lemwy25zWMsI6/a/6e4dUmFxvha2PwNgi7LfyuVWiFDnbMNIuvbTKU37L3/S9uc1FG+r3iSwAAAABJRU5ErkJggg==';
    else if (mods[i] == '十分罕見 能量塔護盾') modImage = 'data:image/png;base64,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';
    else if (mods[i] == '十分罕見 AXA護盾')  modImage = 'data:image/png;base64,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';
    else if (mods[i] == '常見 多重入侵')     modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 多重入侵')     modImage = 'data:image/png;base64,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';
    else if (mods[i] == '十分罕見 多重入侵') modImage = 'data:image/png;base64,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';
    else if (mods[i] == '常見 散熱器')       modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 散熱器')       modImage = 'data:image/png;base64,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';
    else if (mods[i] == '十分罕見 散熱器')   modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 功率增幅')     modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 砲塔')         modImage = 'data:image/png;base64,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';
    else if (mods[i] == '罕見 連線增幅')     modImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAABDCAYAAADHyrhzAAAAA3NCSVQICAjb4U/gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAACWelRYdFJhdyBwcm9maWxlIHR5cGUgQVBQMQAAeJxVjkEOwyAMBO+8gieMbTDwHFSRKlLVVvn/oQdI2+xlpVlr1+E+nuPYb/F9vLb9MUKMMUaRGlJLTTtQmVIwQVCgLOTTvdVCAmTxwUUZb24uxXxeGECbPYmFTE0NpM98dX09d/438vnXKV2Z/jqzWrO62HVLbD4BQPgA51U1dO8s/dUAABcZSURBVHhe7Zx5eBRV1sbfSnrvdPZ9XyCEbEAAISHsWwQVBRzAjcF1RsdPHGaReZwR0UHHEUfHcYb50EeBwe3DBWQTEInsgqxiwhYSQhKykaSTdKfX+51bbbWVojuy6vxhQT9VdW91dVWd333PufeeigCA0eenhZ6AoFKrmCAIUH4CAgLEMr6WPsr9nsqlY+Vr6Tf4k5dvKy3BmMc+fC3/uN1ucV++5tvSR6qTl/k6Vn4O+fmFn8j4zhSCWqPuRoacCF9kBAYGXkSMnB4lLb7IkFMoUSKRICeCb0uWVRLhjwIlKS6Xy0uTkiAlIT+RIWujgkarEclQaoQ/ffBFAadFToSSHl90SL8n6QM/RlrkmuFLD3qigpOg1Axf+/JzSNs/kSEnQ6fXMX9UyC0uWV4qk9f5Ok5JkC86JCVX6gYvl65J2eZ5nVSmpMDXvi9SpDIlHf8VZOhNEbC2N3ts9CNekWAwGkQyetICJQ18vydCeiJFosDpdMIYHAOXEACdWoP2llpq607E9StB3dHN5EZc4jVJHkXyKkoqJCv7WvdU50tHfkQ7ADE5k2C3NMLWcpbcnwv2zhZk3fY0zGcPoXrvqh88KhZMwaaLyFBaXk6BtK1SqUTLScf60hBlmRRf8LZqCE1ATN8StDefRlvtYSSFJaG6sQp9b/sl1Bo3KjauwoXzp8UYQU6H3KJyy/Nt6cOPke8rj5PXy8/3o5ERm38TjGEpsHU2INbVgehALbaf/RLpJfPhVmvhaKnB8Y8Xgrl/uK6TEBIawvxpgpwQiQTlWkmGVC9RI/dCnAxupdDY3ojKHgtblwNoq8PE5FxUt5zGlv2rMW7aE0C8VqTh5J5DOLP3I6/3kAhREsCtyzXoUtb+iOHf/VHISBo4FbrQRAguEtELFRjZuwgf71mJyprjSIhOQc7UBWg1GiHY7Sj/cCHaak78IPohhEeEdyNDbmlpm1tbWe5LM3x5GalMijNMUelIyL0Req0RztaziHR1on9GIVaVvo7zTdUiBWMn3Im0nGzUWtz4qrIJ1Z/8VdQOiSypzfuiQdIHXqekwFeZnLIflgz6tfh+tyAvcxJuiBiNT3Y9jMSQBGTGZeO11U9Rs7F5Qo0AAU/N3oq0rBwsubATTV99jJNbll13OoSo6CjRm/iiQE6Ev21fJCk1iFuUWzMqKRvGzEI8kF2AC3UC1h5ZgqK8SdAFBuD1j/7arW+SkZKFR+54EE0BbqxvcqN2wzI0nD0mHiNZmK+V1pbvX+72D0cG/VJi0QzkJU/Avb3vxNzX+yEyIh6jcscinDzKgrWvXuQ5Jg9/CE/MeBH/qj+FozWb8c3y+XA5XdeNECEmNkbUDP5RWl/a97f2pymcNLlX4VSEJ2YjMm8k5o7Ow5FdAVix5XHk50zEwLgM5IUGYcXej1H69QHEZQxAS00ZDAaDeE1PzlkIdSrD+jonykt3o2LHe91GunxZX04O1wRf+76+x58yd+TX9yOAxRZMYbfOeZd98hcXCwuLZkmJmSwypT97fMIcVrvoI3ZzfpF4DWlDbmehcb291zNgwA1s69+62DOLrKzg8RUsPOG7umt93UJ8QvxFZHCrymnwty3RJJEg1w/+Ha4V3AIxaf0Qlj0Cj/XLxekaAa+8/QhSkii2aG/Do0PGImvKELzzrzew5/gR5A+ehmZbF84eXgcHrfl5ppf8D4onpGFTFXDg5DlUrHrG21SU3kPSEV+6ItcY5TY/z/Ung6hIGXknm3L3f9ia590sKSFDtHpUfB8Wm5bHNt/7N9b50lYWHR4plg9I689yi+9iMVkju9H69OwtbNUrDjbiD+tYr7GzrwvJQmJSokiG0vq+9uXESN9RxiASEbxe9CApeaQVozF3TA5pBfC/q39FfRoNXIZgFCbm4a5fTAPOAw8veljs65i0egwdNBmn3WrUn9iLtnpPwBUfE48/PPAEGgKBNQ1A5ep/oLHqmDf28GV1OSX+iJETdF3JCFQFsvgh09iM+1ezTS8xFhERL1o0JCaFmRKz2O+nPMHYPw+zF25+tJulI3UmNn7iQyy+4DYWHBblrbux8F62a4mL3fHHg2zAQ39n/PzXUjeE5JRkLxmS5ZVrOQX+9EMeq0gjSHHpAxGaPRy/zs9FeTXw6nsPQ6MzIigyEepAPZ4aNgsYZsLB9zbjjR2rodV6+iR8GTtwDMxhvXHyxAHUlG1DSEgIAigeeeqBRVAnu7GpyYWyz/fixLaVYqQpWdjhcHTb5nXyMn+08PLrRga3WvKIe9iUu95h655nLCgowktFZEoeKxo6nW2eu4yxl3ez8f09nkT+CdLr2eQRs1jOhF+Q18nz1hUMGMR2vOZmf3nJyW743fssJiP3mtEhpKSmMH9E+CrnlKjVam9couyj8KfLvUhU2kBEZ4/EoyMycWS/G6+vnguNxoCgqEToBT16J/TF1HFFgAF4+oUFMFvaRctwC3HKtDotsuJTEJ48FMcam1B/bDPstg6Pd5nwCIon9cbnVQ4crriA4+8v6NYPkUjg55Jv90QFr7suEShRgbihM1CcORNzcm7GtD+FoKPTjLC4NASqdEiPTkc+9UdeHjIRh+rKUfzPX3mbh3KDvAuQOgBNLXWoPrTRW73o/lL0HVCEf7XuQc2u/+DYun/7PcelVghp6Wl+NYMT0BM1So8i9Szjeg1FeJ8iPJqXia8rnViyai5UGi0iE/siwG5FVEgKhiRlIX9ypnidh7YfBHMxVJ85j7w+ffFh6Qc4W18tEqJyAyMLp6BKFYRzx3aRdykXvVRMTBzpx5NoUPO+ixMVq5ei7vRhsXcrEcGpkMi4FFquuWZotFqKK2az6Xd9QNEmYxq1RmzTkYm9WFRyLouMjGEDeo9i21Z9Qdf97VJH6xrGvnrxOCv9Qxl74Y5Xu+lAdFAomzjxQZYwcCozhsR468YMnknexcFmLjjM+j/4ylV7F5GMnqzvjw65bkgRKH+ykSkDEZc/Gg8Pz8D+PRa8tfp30BlMiErog7bmc1AJdswcMh3ZN+b7ppdiDkQA69auwYatm6DX68XjRuePgD02C0fKD+F82ecw8sEf0qYn5jwLYzrDxvMOHN+2F998vkKkQYpM5WT4okSuI9eUDL3BQFTczebcv4l9/GfG+KS2h4pMlpQ5SNyef/9vGCtn7NSLp9ih3x1g7CxRYWNs7Z+2sxenrGQv/2w161xtZds2butGh06tZpOLp7Pcsb9k4Un53rq83Fy25WU7e/Y5C+v/2DIWmZRzxd5FSM9I96kZSiKkfV/lUh8kIWsYYrKL8UhOJvaVtePNT34vxhWR8ZmwdbQiJyMHM6dNAjzG7r5cAHZvakNBrxBoB3mqlq1YhrKyMu/8SXJoFBL7jMTRhmY0fLMVls4LokbcMv5+jLoxG1tOu7H/dA2qPlp00ZiHL/1QepprRoaHijvZrLvWsA+fYSwg0BMdRhAV8Rn92LAbprDxo2axv92+gpW+ecwrF6WrD7IXZr/D6jbWi2UNy2s9dQ2MLV+w4iIr58T3ZoNGzWZxeeMZjYh56+dNf5ct/0sLG/bbD1n6mHuuiA6/miEnwN+2FI1yzYijEazYvsV4aFgGtm9rwHubFopaYYxIQIjKRHMhRszJ6I/gbz2IFwsavPp8fS1G/zb+YlpqgGdefwZWh1UcEuTtm/rCGDVoEirVITh3fAeNfRwX6QgODsWTd8/HuUAHNlyw4+y6N1F/5qjoebh+2Glw+fvouCZxhpEuJHTQrSjpdQ9KEkfi9j9Rb4rrYGImdLogxIbFYU7/4Xik6DZUntwPdclQmM5EIPieEOpxAW8/vwPtFgdun5KD8GnR4nfPb6+D+5MjqDC04dnNy/HprnXehxWq0WNg4TSUtbWitWIPLOYmsa4w92Y8eddSLDl/FKcaduMUdfUddpqOuMTlkr2JUjM0Go3YlvmTT6L+RxxFmw8OTMWegw14Z92foVLrERydRIqvxR1pQ9F35gDxklYufAVJRQUYMW5490uknig8z8GztNBHRR/Tt/vkZf7z3kp8VXWIYh+gV1Qy9HTeCpp1qznymTgyxpeHp8+HJtGCz+odKPviK1R9+aGXCCUZSs24ajKCQsIQ0m8SRibNQklyCe55TiWG0vGp+TDTRPL84bdh3qg7QPOImLtyMV7Z+b540WWfHUXWmFxx2/62BZqhdDPpVL7hDN74vyV4e8NKTOxTjBk0p1KcmYsglwZwBeAILmDxpnewfMe7GD54Ai4EJaP+1F40VR0Wz5Walorn7v4ch8m9rm1cj3Mb/o1WGka8lEWgL4txhrJnysvkNCjJ4PucjJjMIqTmjsbsG+KxeetprC99DTl9C3GmpQHTc4ag+GejPIbe+g0Wrl0KY5BRpCkjIwNjxo2FWquGi2IEo86Ez3Z/gXO1p3H6XAVCw0LF4zq7GGaPmoJB6f3pTumBcQBoct5d50bp2k+xix6yk2KR2m92wtLWKP7WuOLbUVCUit1n7ThU0YKqTa/ASc1F3oOVUyLFGldFhjE4HKF54zGhz70YEV2MOc8bMXLYragkl1fQOw0fTp1P1gT+/sESPPbRy5diHL/HhMQkY0RSHqZnDcGt/Qtpts2FdV/vxD5zI3Y21aPlwlmcPHXAO8I+rPA+qHPGocXZiNbyUlTt+eB7f1/stSr7GEoqlPv8rPw7sYRw5oBxmJUfix37a1HVuJe6rCYkRgRh6p03ke7Tsz5wHo8tf84bKyivSJqL5RRIi3KbH6M36GG1WMH1cNbomzE0bzBcjc1w1TRhe0Mtym0WGjPtwLl60pDaUxweFNz0G1i0VjBbJ45tXo0WKucUcM8i9V/ktFwxGR4qJmJY7FTkGLPw7r67aZ40l5p1F+5Ly8O0/OFYe2gHZi5/Gi5KPPG1UFQJk8mEYL2RmqTWkyjLIwRBBY1KS82Ez66p4aaQxXOKADhp2MMWqIagViFYcKGrw0ydPDeaLB0INUZR4osBFmsbWs11iIpKg7b/TbAwSpw1N6B625Ie512EpOQkv2OgSs2QCOIXHZ1eRHHFYOQnpaKj5gxNIptRRy5ufEov5CVmITBYhcdfewqMRqf6JGfCKeZjBsKgDyKq1HAwGikWPDmlYCrYXA4qV4HzIdB3qNdFD9GTB0rfFHvPTren3fOb52sb9YBt1ga4HHYxjnHQvkbQIIgeCB2KloZqmNLzYY8KgsNtQe3RMzh3cEO3MQ75KNgVkaHRmxCbP4UumAZ5uloRYmlGU3sTBUbt1KYLUF57Bsfb62B2UFc7sT9UNHdKPXTPAAxPd/4WE44qD5gc5HX4IpD5xQQ2CrLcDhqYcXaJ6UxUApfdRg+OBn9sVgKEGgGvE5fvmhf3xQHUgePnCNEFI0QbCpvTii6KS7oCNQhPyEb9kfVwkab5WoSExIRu8ya+erASIVL7ju1LfZDkAroMhjhnB1moGS10A8FaAa3NdeLvWOxuJPQaDA1dBL8gFaeAIHd9O9boIhKYy06CR/OldKNOvu100DG8nXhuMIBiN3E8lUjgk9E8gJLPwEvt3TvnIWYJUhPTh8JJ5AV0UdRp5yNYDE0XqtButcBNFFo6W0XNUI6YXzYZPDMvos84EXu9vRPOtko0drTARSLlsHqG7viipsiTL46uDp9WuJxCSvanwWId1CojdJowmIIiaR2CMFMyYk0J6KABnnOaC+Smg+mhqajV6eAigbdWn0Dr15thpZunzhLaOz2u198ixMXHecnwNX8ijVt444peQxBO0V+Qy4pA2NFGKu50dMBhafXOvfBjpVxOKZuGE8fbpzQjzwVTp6W+iz4SWk0QTLpYuslousFEhBtjEREqIIRiCpPeDb2Gsn5pNMBKTcPisgA6LjNu2IkkTtiOqgDUMtINVxcCWRd5HTsZx4ZWurb6ynY0H/yEYpD6bn0UaURdPt9yeWTQ0To9RZyGEKgpZdFBmuFEB5rP1yA6JgaRUQkIDokiLAyEqQZpQdlQOfV0Y6kINsSJw30mbRiCKEKlkA2kk5SOwFO1qRmQIDCnAHOHG2Y7YKVPm53RzbthEyxod7fAEtBBOtVFGmCD+M9thVWwkTaR5R28eZGUUHOjtkgbDmq+1CzoYXW2nkf9fsoeJIP1SEZ0THQ3MpR0KEfCo8MTyILhois0U9qiWx+CjOEzxb6BQJGgQF6A/CKsdLs/jwqAIZYybuwCDDSuQbLBHwECSVsEFb3PQk/DRvLQSUlsnXT9FidDO90L/RfXnfQwAgJ5rhbQRakIAj0YrisBdMMuEmeBbtRFuuCy2Smplqgxt1HCXBs6KRAztzTB3NoESweVdXTQupWIafepFdKcy2WRoVbrYDKGk8o7Eei2QRuXgrCCGVAZQkVPEEids0CVR8QEUnANoziC2nkbiSx3i3a3QKhbCFe6QUbCRsakrp7YpDQB5DOsXeSRzKT2ZhIbCrDamkUdYtQkYe+gqQJqIpQvGkhUMPIqHeaWa5oNKERERlxEhi/tEKNACo74rJdAd6GN6oWIIeOhN+qgp+bCe7E6nU6MIbg+GHl/h+gxaGlGn7sFsiRvx3ayjsPagU5KgLW2tZCrpJsnkbWTALvoBp1Ouzf7WGw6ilxxKYKU8jelnCx/c6nKnqmvfA3pHJdFxneuwoCY/pPE9tjVSk3F3kXOi6Icpw1uuiFKWiIhI9fpthOyPbfTy/Eq1/tYISw8zJvT9X25XVLvlhMgkcDX8pl3KaNX8v38BqR3SaSMP6lMyg3nJPKFf1f6SPuS95Hmb+XvnPnLCJZn5Ugj5crsHYkQebbwlZFxvU30I51fCA4JvogMZU64MqdLmRXM97kF5Zk88rcU/L2nxu9ZokO6f4ksOSVyGiQNkb+hpMwNl+d/yuMIZV6okqyfyJBRKNDIkzdDWG5NpfWVGTrKbGAp91P5bpu8XP7WovwNA2WrkNMhjW0o3zeR2rrcqyjfFlAS4qte/laBqFNX9YlZzOaV3P/dObLWsHmFhb7P2VMdCtnkGXa2SH6uq722y/y+QCNIl/QmkjzrtxsVQXNxY2IltlRu9MYHvvRC1AbjHzFE8zb2tZ0RYZB7GajuwaDgRHTSbFtj9bOgKSWfbzzL9cMXFXJifHkbJVFyMq5eM2IWY96AMize+LqH9qw1mBf2HBa3zMei4SXeFnBiuwZvwVO3Cm/gIRoY37kmG+vqPYcMLrEjp1KDY6me9VvlnnPJz/Fdc9qIj5begn2K+uavR2Lx7t1X7IsEGtb3kuHvXVZlLng3MkzzcEtyBdafWu95zy3iRUzUv4kttnsxzvAWShtP0/zJchQIz2KH/ecoDk+C0fE2Np//TEbHGOSnD0dDxdOoU89BUVgVdtTRe2qmhSjWLENpwwnEJ2xFbNsofNmagazec2Au/z0qQ57HRO1SrKv+hvpIj+KmXgxf7H8JjdQ1UBLSExFSDKOSMvmv+HHGmFES3ojDhzzzFsjqxKiw0/iypQPDw05iJ1kqpdCGbJSjtKUNE1PbcCJpKgzHnvRSgay5GKemccv0jRhv3ogT7qkIKqP6sDYMCivDDjrHYILMULkLe8oZIpI70PDlPhyg35qeGoQjh4/QC29mTAwtw65yjtSVLd43nuVU+CJEokP+ZpG4HfxbTBt4L4LF3y/F7goBufql+NT2IEr0bxABJ+nNo3cwOGABtnbdhzFEzTbzGIxOvwPtNaPxlbkX+qQvRVAT3/ZEocHRK1CAp7HVOgdjdG9gS90JJKbsQHxrEXY190ZO9n1oPfprVIa/hMmU9xWsT6HfrqLcsRuxr93z3qtST+TaIN+WqPB6sKvyJpep2Nf0t3r0TpfvJX3+/QzJ+t9Hiz+vwcv9RZ1SfCF5E24RyatI1uF18ghUue31KFGvYprhH3j/1Nd+/6aGPwrkEax0/qv3JlfWPP8rv/X/0wfETd+fw7QAAAAASUVORK5CYII=';
	else if (mods[i] == '十分罕見 連線增幅') modImage = 'data:image/png;base64,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';
    else if (mods[i] == '十分罕見 SoftBank超連結') modImage = 'data:image/png;base64,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';
	else modImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAABDCAIAAABIqC8kAAAAA3NCSVQICAjb4U/gAAAAlnpUWHRSYXcgcHJvZmlsZSB0eXBlIEFQUDEAAHicVY5BDsMgDATvvIInjG0w8BxUkSpS1Vb5/6EHSNvsZaVZa9fhPp7j2G/xfby2/TFCjDFGkRpSS007UJlSMEFQoCzk073VQgJk8cFFGW9uLsV8XhhAmz2JhUxNDaTPfHV9PXf+N/L51yldmf46s1qzuth1S2w+AUD4AOdVNXTvLP3VAAADoUlEQVRogeWb21LjQAxEJTuQcA3kCvv/n4ntfRiildXS2LC2Qw39MCW7QqB00pJmYohKEdermpmJiJmrqiKiqqqYOV3iijfND6a3ksD8vq7r0ipB27ZE1LZtupkCWc2lrOYHl0zZ7OLVzYouQFjpS0C4L7rQyDChCxnRN7Do1y+dufnEN7c3iMIloAMXSHKLJkN9LJI5SScphxgsmoZLycBZPHWziW/Xt64xDAEEEpHJFK6kQZPo3Js4Y55F0zareL1ZIw0EYoRGQqvQiH6CJnE5GCGxspjc3d+5lqjrOsMEK1vGJynQhYsCnwzSSGqaBs1zpQTOIH54fEBjGCAZPoiFvjh3jQTSNE102V1msELET89PJs1CIAXmMmIS+QR7vOuTDBNJfwrMpehKCZxBvH3ZGhr5VV5p2rzAoXgQTjJk2n5LSZc63xpFtJbF5HX3aoBg4GKJfPL5vkOzsAR5n7gQMCiLyf6wj4C4cCTg/maGVBv5fOusTyQ2A5iQwZKlA7w5c6IWFB+OB8MBL/MmoWxTz8sdjSOraJk7ZfnkdD4hAZdMZJLv0dAyXd+1SkRDNFlKri4+v51dYwz6ZCogSYgl7xO0zQTJ+CHit/c3ZLJarSIg9WXimhBIEu5Y3JaS9PHxUToTlMaSMclUQJLMGBZZxQAprna9/3nPm6TuT196407TmSTJdHrpKm75MmQm/DOuLMcnERNTuJZh0sDO5FcycWXK15K1a0yPL4tJmru+x2Raq+Dm8bcyOZ1P2DewwWsg9QyjV2bocluKFC65OUEyfoj4eDrWwf4k2jPi6eP/kMFj4sTBzMIi1zNlzcKH40GS7cIxx184EeNh1xg45hiSvKplgGROWMpistvv9FiFcEyA513cF32FSdcXnnc13gGkCdrSziBfXl/0QVYEx93KYwUbicUFomm4m3gXhawLJWwB8fP2WX/0deJ1jCYxVqn6D9wNMpGS1Q1996sTr7Hom2UxeXx6xEwbAgaOpjHGKjziGQljEgPEpF/HJTK5f7jHHLtkosJVBUf3kVW0Q0wbicpXnkZX2jMSm7sNZhch6NWtXe4Mhlg670usqMEnLHp1aRTHZL1Zm896xjZR1RosX6JM4cpUMBdFuUzMs6muW6JLt3AZIBpLFz9LhOULPeM6RIIrJXAG+c9wZwwTAakuc1flPS+hpQsXeXPXIBbzYnnDQvTvfx2QiYsF7xub0dA4rLOIhUsn3i1l6KvSmPwF4BfHMEUMY10AAAAASUVORK5CYII=';
	
    if (modImage != '')
      t += '<span'+(modsTitle[i].length ? ' title="'+mods[i]+'<br>'+modsTitle[i]+'"' : '')+' style="color:'+modsColor[i]+'; background-image:url('+ modImage +'); background-size: 67px 67px; background-repeat: no-repeat;"></span>'
    else
      t += '<span'+(modsTitle[i].length ? ' title="'+modsTitle[i]+'"' : '')+' style="color:'+modsColor[i]+'">'+mods[i]+'</span>'
  }
  // and add blank entries if we have less than 4 mods (as the server no longer returns all mod slots, but just the filled ones)
  for (var i=mods.length; i<4; i++) {
    t += '<span style="color:#000"></span>'
  }

  return t;
}

window.getEnergyText = function(d) {
  var currentNrg = getCurrentPortalEnergy(d);
  var totalNrg = getTotalPortalEnergy(d);
  var title = currentNrg + ' / ' + totalNrg;
  var fill = prettyEnergy(currentNrg) + ' / ' + prettyEnergy(totalNrg)
  return ['能量', fill, title];
}


window.getResonatorDetails = function(d) {
  var resoDetails = [];
  // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
  // resos in the display should be ordered like this:
  //   N    NE         Since the view is displayed in rows, they
  //  NW    E          need to be ordered like this: N NE NW E W SE SW S
  //   W    SE         i.e. 2 1 3 0 4 7 5 6
  //  SW    S
  // note: as of 2014-05-23 update, this is not true for portals with empty slots!

  var processResonatorSlot = function(reso,slot) {
    var lvl=0, nrg=0, owner=null;

    if (reso) {
      lvl = parseInt(reso.level);
      nrg = parseInt(reso.energy);
      owner = reso.owner;
    }

    resoDetails.push(renderResonatorDetails(slot, lvl, nrg, owner));
  };


  // if all 8 resonators are deployed, we know which is in which slot

  if (d.resonators.length == 8) {
    // fully deployed - we can make assumptions about deployment slots
    $.each([2, 1, 3, 0, 4, 7, 5, 6], function(ind, slot) {
      processResonatorSlot(d.resonators[slot],slot);
    });
  } else {
    // partially deployed portal - we can no longer find out which resonator is in which slot
    for(var ind=0; ind<8; ind++) {
      processResonatorSlot(ind < d.resonators.length ? d.resonators[ind] : null, null);
    }

  }

  return '<table id="resodetails">' + genFourColumnTable(resoDetails) + '</table>';

}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).
window.renderResonatorDetails = function(slot, level, nrg, nick) {
  if(OCTANTS[slot] === 'N')
    var className = 'meter north';
  else
    var className = 'meter';

  var max = RESO_NRG[level];
  var fillGrade = level > 0 ? nrg/max*100 : 0;

  var inf = (level > 0 ? '能量:\t' + nrg   + ' / ' + max + ' (' + Math.round(fillGrade) + '%)\n'
                        +'等級:\t'  + level + '\n'
                        +'擁有者:\t'  + nick  + '\n'
                       : '')
          + (slot !== null ? '方位:\t' + OCTANTS[slot] + ' ' + OCTANTS_ARROW[slot]:'');

  var style = fillGrade ? 'width:'+fillGrade+'%; background:'+COLORS_LVL[level]+';':'';

  var color = (level < 3 ? "#9900FF" : "#FFFFFF");

  var lbar = level > 0 ? '<span class="meter-level" style="color: ' + color + ';"> L ' + level + ' </span>' : '';

  var fill  = '<span style="'+style+'"></span>';

  var meter = '<span class="' + className + '" title="'+inf+'">' + fill + lbar + '</span>';

  //iF: Add title for long player name
  nick = nick ? '<span class="nickname" title="'+nick+'">'+nick+'</span>' : null;
  return [meter, nick || ''];
}

// calculate AP gain from destroying portal and then capturing it by deploying resonators
window.getAttackApGainText = function(d,fieldCount,linkCount) {
  var breakdown = getAttackApGain(d,fieldCount,linkCount);
  var totalGain = breakdown.enemyAp;

  var t = '';
  if (teamStringToId(PLAYER.team) == teamStringToId(d.team)) {
    totalGain = breakdown.friendlyAp;
    t += '友軍 AP:\t' + breakdown.friendlyAp + '\n';
    t += '  佈署 ' + breakdown.deployCount + ', ';
    t += '升級 ' + breakdown.upgradeCount + '\n';
    t += '---------------\n';
  }
  t += '敵軍 AP:\t' + breakdown.enemyAp + '\n';
  t += '  摧毀 AP:\t' + breakdown.destroyAp + '\n';
  t += '  佔領 AP:\t' + breakdown.captureAp + '\n';

  return ['可用AP', digits(totalGain), t];
}


window.getHackDetailsText = function(d) {
  var hackDetails = getPortalHackDetails(d);

  var shortHackInfo = hackDetails.hacks+'次 / '+formatInterval(hackDetails.cooldown);

  var title = '每 4 小時可入侵\n'
            + '入侵次數:\t'+hackDetails.hacks+'\n'
            + '冷卻時間:\t'+formatInterval(hackDetails.cooldown)+'\n'
            + '燒毀時間:\t'+formatInterval(hackDetails.burnout);

  return ['入侵', shortHackInfo, title];
}


window.getMitigationText = function(d,linkCount) {
  var mitigationDetails = getPortalMitigationDetails(d,linkCount);

  var mitigationShort = mitigationDetails.total;
  if (mitigationDetails.excess) mitigationShort += ' (+'+mitigationDetails.excess+')';

  var title = '防護總計:\t'+(mitigationDetails.shields+mitigationDetails.links)+'\n'
            + '- 有效:\t'+mitigationDetails.total+'\n'
            + '- 額外:\t'+mitigationDetails.excess+'\n'
            + '來源\n'
            + '- 盾牌:\t'+mitigationDetails.shields+'\n'
            + '- 鏈接:\t'+mitigationDetails.links;

  return ['防護', mitigationShort, title];
}


;

﻿// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters

// an object mapping highlighter names to the object containing callback functions
window._highlighters = null;

// the name of the current highlighter
window._current_highlighter = localStorage.portal_highlighter;

window._no_highlighter = '無標記';


window.addPortalHighlighter = function(name, data) {
  if(_highlighters === null) {
    _highlighters = {};
  }

  // old-format highlighters just passed a callback function. this is the same as just a highlight method
  if (!data.highlight) {
    data = {highlight: data}
  }

  _highlighters[name] = data;

  if (typeof android !== 'undefined' && android && android.addPortalHighlighter)
    android.addPortalHighlighter(name);

  if(window._current_highlighter === undefined) {
    _current_highlighter = name;
  }

  if (_current_highlighter == name) {
    if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
      android.setActiveHighlighter(name);

    // call the setSelected callback 
    if (_highlighters[_current_highlighter].setSelected) {
      _highlighters[_current_highlighter].setSelected(true);
    }

  }
  updatePortalHighlighterControl();
}

// (re)creates the highlighter dropdown list
window.updatePortalHighlighterControl = function() {
  if (typeof android !== 'undefined' && android && android.addPortalHighlighter) {
    $('#portal_highlight_select').remove();
    return;
  }

  if(_highlighters !== null) {
    if($('#portal_highlight_select').length === 0) {
      $("body").append("<select id='portal_highlight_select'></select>");
      $("#portal_highlight_select").change(function(){ changePortalHighlights($(this).val());});
      $(".leaflet-top.leaflet-left").css('padding-top', '20px');
      $(".leaflet-control-scale-line").css('margin-top','25px');
    }
    $("#portal_highlight_select").html('');
    $("#portal_highlight_select").append($("<option>").attr('value',_no_highlighter).text(_no_highlighter));
    var h_names = Object.keys(_highlighters).sort();
    
    $.each(h_names, function(i, name) {  
      $("#portal_highlight_select").append($("<option>").attr('value',name).text(name));
    });

    $("#portal_highlight_select").val(_current_highlighter);
  }
}

window.changePortalHighlights = function(name) {

  // first call any previous highlighter select callback
  if (_current_highlighter && _highlighters[_current_highlighter] && _highlighters[_current_highlighter].setSelected) {
    _highlighters[_current_highlighter].setSelected(false);
  }

  _current_highlighter = name;
  if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
    android.setActiveHighlighter(name);

  // now call the setSelected callback for the new highlighter
  if (_current_highlighter && _highlighters[_current_highlighter] && _highlighters[_current_highlighter].setSelected) {
    _highlighters[_current_highlighter].setSelected(true);
  }

  resetHighlightedPortals();
  localStorage.portal_highlighter = name;
}

window.highlightPortal = function(p) {
  
  if(_highlighters !== null && _highlighters[_current_highlighter] !== undefined) {
    _highlighters[_current_highlighter].highlight({portal: p});
  }
}

window.resetHighlightedPortals = function() {
  $.each(portals, function(guid, portal) {
    setMarkerStyle(portal, guid === selectedPortal);
  });
}


;

// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.

// returns a float. Displayed portal level is always rounded down from
// that value.
window.getPortalLevel = function(d) {
  var lvl = 0;
  var hasReso = false;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    lvl += parseInt(reso.level);
    hasReso = true;
  });
  return hasReso ? Math.max(1, lvl/8) : 0;
}

window.getTotalPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    var level = parseInt(reso.level);
    var max = RESO_NRG[level];
    nrg += max;
  });
  return nrg;
}

// For backwards compatibility
window.getPortalEnergy = window.getTotalPortalEnergy;

window.getCurrentPortalEnergy = function(d) {
  var nrg = 0;
  $.each(d.resonators, function(ind, reso) {
    if(!reso) return true;
    nrg += parseInt(reso.energy);
  });
  return nrg;
}

window.getPortalRange = function(d) {
  // formula by the great gals and guys at
  // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/

  var lvl = 0;
  var resoMissing = false;
  // currently we get a short resonator array when some are missing
  if (d.resonators.length < 8) {
    resoMissing = true;
  }
  // but in the past we used to always get an array of 8, but will 'null' objects for some entries. maybe that will return?
  $.each(d.resonators, function(ind, reso) {
    if(!reso) {
      resoMissing = true;
      return;
    }
  });

  var range = {
    base: 160*Math.pow(getPortalLevel(d), 4),
    boost: getLinkAmpRangeBoost(d)
  };

  range.range = range.boost * range.base;
  range.isLinkable = !resoMissing;

  return range;
}

window.getLinkAmpRangeBoost = function(d) {
  // additional range boost calculation

  // link amps scale: first is full, second a quarter, the last two an eighth
  var scale = [1.0, 0.25, 0.125, 0.125];

  var boost = 0.0;  // initial boost is 0.0 (i.e. no boost over standard range)

  var linkAmps = getPortalModsByType(d, 'LINK_AMPLIFIER');

  linkAmps.forEach(function(mod, i) {
    // link amp stat LINK_RANGE_MULTIPLIER is 2000 for rare, and gives 2x boost to the range
    // and very-rare is 7000 and gives 7x the range
    var baseMultiplier = mod.stats.LINK_RANGE_MULTIPLIER/1000;
    boost += baseMultiplier*scale[i];
  });

  return (linkAmps.length > 0) ? boost : 1.0;
}


window.getAttackApGain = function(d,fieldCount,linkCount) {
  if (!fieldCount) fieldCount = 0;

  var resoCount = 0;
  var maxResonators = MAX_RESO_PER_PLAYER.slice(0);
  var curResonators = [ 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for(var n = PLAYER.level + 1; n < 9; n++) {
    maxResonators[n] = 0;
  }
  $.each(d.resonators, function(ind, reso) {
    if(!reso)
      return true;
    resoCount += 1;
    var reslevel=parseInt(reso.level);
    if(reso.owner === PLAYER.nickname) {
      if(maxResonators[reslevel] > 0) {
        maxResonators[reslevel] -= 1;
      }
    } else {
      curResonators[reslevel] += 1;
    }
  });


  var resoAp = resoCount * DESTROY_RESONATOR;
  var linkAp = linkCount * DESTROY_LINK;
  var fieldAp = fieldCount * DESTROY_FIELD;
  var destroyAp = resoAp + linkAp + fieldAp;
  var captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
  var enemyAp = destroyAp + captureAp;
  var deployCount = 8 - resoCount;
  var completionAp = (deployCount > 0) ? COMPLETION_BONUS : 0;
  var upgradeCount = 0;
  var upgradeAvailable = maxResonators[8];
  for(var n = 7; n >= 0; n--) {
    upgradeCount += curResonators[n];
    if(upgradeAvailable < upgradeCount) {
        upgradeCount -= (upgradeCount - upgradeAvailable);
    }
    upgradeAvailable += maxResonators[n];
  }
  var friendlyAp = deployCount * DEPLOY_RESONATOR + upgradeCount * UPGRADE_ANOTHERS_RESONATOR + completionAp;
  return {
    friendlyAp: friendlyAp,
    deployCount: deployCount,
    upgradeCount: upgradeCount,
    enemyAp: enemyAp,
    destroyAp: destroyAp,
    resoAp: resoAp,
    captureAp: captureAp
  };
}

//This function will return the potential level a player can upgrade it to
window.potentialPortalLevel = function(d) {
  var current_level = getPortalLevel(d);
  var potential_level = current_level;
  
  if(PLAYER.team === d.team) {
    var resonators_on_portal = d.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for(var i=1;i<=MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function(ind, reso) {
      if(reso !== null && reso.owner === window.PLAYER.nickname) {
        player_resontators[reso.level]--;
      }
      resonator_levels.push(reso === null ? 0 : reso.level);  
    });
    
    resonator_levels.sort(function(a, b) {
      return(a - b);
    });
    
    // Max out portal
    var install_index = 0;
    for(var i=MAX_PORTAL_LEVEL;i>=1; i--) {
      for(var install = player_resontators[i]; install>0; install--) {
        if(resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    //console.log(resonator_levels);
    potential_level = resonator_levels.reduce(function(a, b) {return a + b;}) / 8;
  }
  return(potential_level);
}


window.fixPortalImageUrl = function(url) {
  if (url) {
    if (window.location.protocol === 'https:') {
      url = url.indexOf('www.panoramio.com') !== -1
            ? url.replace(/^http:\/\/www/, 'https://ssl').replace('small', 'medium')
            : url.replace(/^http:\/\//, '//');
    }
    return url;
  } else {
    return DEFAULT_PORTAL_IMG;
  }

}


window.getPortalModsByType = function(d, type) {
  var mods = [];

  var typeToStat = {
    RES_SHIELD: 'MITIGATION',
    FORCE_AMP: 'FORCE_AMPLIFIER',
    TURRET: 'HIT_BONUS',  // and/or ATTACK_FREQUENCY??
    HEATSINK: 'HACK_SPEED',
    MULTIHACK: 'BURNOUT_INSULATION',
    LINK_AMPLIFIER: 'LINK_RANGE_MULTIPLIER',
    ULTRA_LINK_AMP: 'OUTGOING_LINKS_BONUS', // and/or LINK_DEFENSE_BOOST??
  };

  var stat = typeToStat[type];

  $.each(d.mods || [], function(i,mod) {
    if (mod && mod.stats.hasOwnProperty(stat)) mods.push(mod);
  });


  // sorting mods by the stat keeps code simpler, when calculating combined mod effects
  mods.sort (function(a,b) {
    return b.stats[stat] - a.stats[stat];
  });

  return mods;
}



window.getPortalShieldMitigation = function(d) {
  var shields = getPortalModsByType(d, 'RES_SHIELD');

  var mitigation = 0;
  $.each(shields, function(i,s) {
    mitigation += parseInt(s.stats.MITIGATION);
  });

  return mitigation;
}

window.getPortalLinksMitigation = function(linkCount) {
  var mitigation = Math.round(400/9*Math.atan(linkCount/Math.E));
  return mitigation;
}

window.getPortalMitigationDetails = function(d,linkCount) {
  var mitigation = {
    shields: getPortalShieldMitigation(d),
    links: getPortalLinksMitigation(linkCount)
  };

  // mitigation is limited to 95% (as confirmed by Brandon Badger on G+)
  mitigation.total = Math.min(95, mitigation.shields+mitigation.links);

  mitigation.excess = (mitigation.shields+mitigation.links) - mitigation.total;

  return mitigation;
}

window.getMaxOutgoingLinks = function(d) {
  var linkAmps = getPortalModsByType(d, 'ULTRA_LINK_AMP');

  var links = 8;

  linkAmps.forEach(function(mod, i) {
    links += parseInt(mod.stats.OUTGOING_LINKS_BONUS);
  });

  return links;
};

window.getPortalHackDetails = function(d) {

  var heatsinks = getPortalModsByType(d, 'HEATSINK');
  var multihacks = getPortalModsByType(d, 'MULTIHACK');

  // first mod of type is fully effective, the others are only 50% effective
  var effectivenessReduction = [ 1, 0.5, 0.5, 0.5 ];

  var cooldownTime = 300; // 5 mins - 300 seconds 

  $.each(heatsinks, function(index,mod) {
    var hackSpeed = parseInt(mod.stats.HACK_SPEED)/1000000;
    cooldownTime = Math.round(cooldownTime * (1 - hackSpeed * effectivenessReduction[index]));
  });

  var numHacks = 4; // default hacks

  $.each(multihacks, function(index,mod) {
    var extraHacks = parseInt(mod.stats.BURNOUT_INSULATION);
    numHacks = numHacks + (extraHacks * effectivenessReduction[index]);
  });

  return {cooldown: cooldownTime, hacks: numHacks, burnout: cooldownTime*(numHacks-1)};
}

// given a detailed portal structure, return summary portal data, as seen in the map tile data
window.getPortalSummaryData = function(d) {

  // NOTE: the summary data reports unclaimed portals as level 1 - not zero as elsewhere in IITC
  var level = parseInt(getPortalLevel(d));
  if (level == 0) level = 1; //niantic returns neutral portals as level 1, not 0 as used throughout IITC elsewhere

  var resCount = 0;
  if (d.resonators) {
    for (var x in d.resonators) {
      if (d.resonators[x]) resCount++;
    }
  }
  var maxEnergy = getTotalPortalEnergy(d);
  var curEnergy = getCurrentPortalEnergy(d);
  var health = maxEnergy>0 ? parseInt(curEnergy/maxEnergy*100) : 0;

  return {
    level: level,
    title: d.title,
    image: d.image,
    resCount: resCount,
    latE6: d.latE6,
    health: health,
    team: d.team,
    lngE6: d.lngE6,
    type: 'portal'
  };
}

window.getPortalAttackValues = function(d) {
  var forceamps = getPortalModsByType(d, 'FORCE_AMP');
  var turrets = getPortalModsByType(d, 'TURRET');

  // at the time of writing, only rare force amps and turrets have been seen in the wild, so there's a little guesswork
  // at how the stats work and combine
  // algorithm has been compied from getLinkAmpRangeBoost
  // FIXME: only extract stats and put the calculation in a method to be used for link range, force amplifier and attack
  // frequency
  // note: scanner shows rounded values (adding a second FA shows: 2.5x+0.2x=2.8x, which should be 2.5x+0.25x=2.75x)

  // amplifier scale: first is full, second a quarter, the last two an eighth
  var scale = [1.0, 0.25, 0.125, 0.125];

  var attackValues = {
    hit_bonus: 0,
    force_amplifier: 0,
    attack_frequency: 0,
  };

  forceamps.forEach(function(mod, i) {
    // force amp stat FORCE_AMPLIFIER is 2000 for rare, and gives 2x boost to the range
    var baseMultiplier = mod.stats.FORCE_AMPLIFIER / 1000;
    attackValues.force_amplifier += baseMultiplier * scale[i];
  });

  turrets.forEach(function(mod, i) {
    // turret stat ATTACK_FREQUENCY is 2000 for rare, and gives 2x boost to the range
    var baseMultiplier = mod.stats.ATTACK_FREQUENCY / 1000;
    attackValues.attack_frequency += baseMultiplier * scale[i];

    attackValues.hit_bonus += mod.stats.HIT_BONUS / 10000;
  });

  return attackValues;
}




;

﻿// PORTAL MARKER //////////////////////////////////////////////
// code to create and update a portal marker


window.portalMarkerScale = function() {
  var zoom = map.getZoom();
  if (L.Browser.mobile)
    return zoom >= 16 ? 1.5 : zoom >= 14 ? 1.2 : zoom >= 11 ? 1.0 : zoom >= 8 ? 0.65 : 0.5;
  else
    return zoom >= 14 ? 1 : zoom >= 11 ? 0.8 : zoom >= 8 ? 0.65 : 0.5;
}

// create a new marker. 'data' contain the IITC-specific entity data to be stored in the object options
window.createMarker = function(latlng, data) {
  var styleOptions = window.getMarkerStyleOptions(data);

  var options = L.extend({}, data, styleOptions, { clickable: true });

  var marker = L.circleMarker(latlng, options);

  highlightPortal(marker);

  return marker;
}


window.setMarkerStyle = function(marker, selected) {

  var styleOptions = window.getMarkerStyleOptions(marker.options);

  marker.setStyle(styleOptions);

  // FIXME? it's inefficient to set the marker style (above), then do it again inside the highlighter
  // the highlighter API would need to be changed for this to be improved though. will it be too slow?
  highlightPortal(marker);

// iF: remove select color change (I don't like it...)
//  if (selected) {
//    marker.setStyle ({color: COLOR_SELECTED_PORTAL});
//  }
}


window.getMarkerStyleOptions = function(details) {
  var scale = window.portalMarkerScale();

  //   portal level      0  1  2  3  4  5  6  7  8
  var LEVEL_TO_WEIGHT = [2, 2, 2, 2, 2, 3, 3, 3, 4];
  var LEVEL_TO_RADIUS = [7, 7, 7, 7, 8, 8, 9,10,11];

  var level = Math.floor(details.level||0);

  var lvlWeight = LEVEL_TO_WEIGHT[level] * Math.sqrt(scale);
  var lvlRadius = LEVEL_TO_RADIUS[level] * scale;

  var dashArray = null;
  // thinner and dashed outline for placeholder portals
  if (details.team != TEAM_NONE && level==0) {
    lvlWeight = 1;
    dashArray = [1,2];
  }

  var options = {
    radius: lvlRadius,
    stroke: true,
    color: COLORS[details.team],
    weight: lvlWeight,
    opacity: 1,
    fill: true,
    fillColor: COLORS[details.team],
    fillOpacity: 0.5,
    dashArray: dashArray
  };

  return options;
}



;

﻿// REDEEMING ///////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

window.REDEEM_SHORT_NAMES = {
  'portal shield':'S',
  'force amp':'FA',
  'link amp':'LA',
  'heatsink':'H',
  'multihack':'M',
  'turret':'T',
  'unusual object':'U',
  'resonator':'R',
  'xmp burster':'X',
  'power cube':'C',
  'media':'M',
  'ultra strike':'US',
}

/* These are HTTP status codes returned by the redemption API.
 * TODO: Move to another file? Use more generally across IITC?
 */
window.REDEEM_STATUSES = {
  429: '您正遭到伺服器限速中. 請稍後再試.',
  500: '內部伺服器錯誤'
};

window.handleRedeemResponse = function(data, textStatus, jqXHR) {
  var passcode = jqXHR.passcode;

  if(data.error) {
    console.error('Error redeeming passcode "'+passcode+'": ' + data.error)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>' + data.error + '</strong>'
    });
    return;
  }
  if(!data.rewards) {
    console.error('Error redeeming passcode "'+passcode+'": ', data)
    dialog({
      title: 'Error: ' + passcode,
      html: '<strong>An unexpected error occured</strong>'
    });
    return;
  }

  if(data.playerData) {
    window.PLAYER = data.playerData;
    window.setupPlayerStat();
  }

  var format = "long";
  try {
    format = localStorage["iitc-passcode-format"];
  } catch(e) {}

  var formatHandlers = {
    "short": formatPasscodeShort,
    "long": formatPasscodeLong
  }
  if(!formatHandlers[format])
    format = "long";

  var html = formatHandlers[format](data.rewards);

  var buttons = {};
  Object.keys(formatHandlers).forEach(function(label) {
    if(label == format) return;

    buttons[label.toUpperCase()] = function() {
      $(this).dialog("close");
      localStorage["iitc-passcode-format"] = label;
      handleRedeemResponse(data, textStatus, jqXHR);
    }
  });

  // Display it
  dialog({
    title: 'Passcode: ' + passcode,
    html: html,
    buttons: buttons
  });
};

window.formatPasscodeLong = function(data) {
  var html = '<p><strong>Passcode confirmed. Acquired items:</strong></p><ul class="redeemReward">';

  if(data.other) {
    data.other.forEach(function(item) {
      html += '<li>' + window.escapeHtmlSpecialChars(item) + '</li>';
    });
  }

  if(0 < data.xm)
    html += '<li>' + window.escapeHtmlSpecialChars(data.xm) + ' XM</li>';
  if(0 < data.ap)
    html += '<li>' + window.escapeHtmlSpecialChars(data.ap) + ' AP</li>';

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        html += '<li>' + item.count + 'x ';

        var l = item.level;
        if(0 < l) {
          l = parseInt(l);
          html += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
        }

        html += window.escapeHtmlSpecialChars(type.name) + '</li>';
      });
    });
  }

  html += '</ul>'
  return html;
}

window.formatPasscodeShort = function(data) {

  if(data.other) {
    var awards = data.other.map(window.escapeHtmlSpecialChars);
  } else {
    var awards = [];
  }

  if(0 < data.xm)
    awards.push(window.escapeHtmlSpecialChars(data.xm) + ' XM');
  if(0 < data.ap)
    awards.push(window.escapeHtmlSpecialChars(data.ap) + ' AP');

  if(data.inventory) {
    data.inventory.forEach(function(type) {
      type.awards.forEach(function(item) {
        var str = "";
        if(item.count > 1)
          str += item.count + "&nbsp;";

        if(window.REDEEM_SHORT_NAMES[type.name.toLowerCase()]) {
          var shortName = window.REDEEM_SHORT_NAMES[type.name.toLowerCase()];

          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">' + shortName + l + '</span>';
          } else {
            str += shortName;
          }
        } else { // no short name known
          var l = item.level;
          if(0 < l) {
            l = parseInt(l);
            str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
          }
          str += type.name;
        }

        awards.push(str);
      });
    });
  }

  return '<p class="redeemReward">' + awards.join(', ') + '</p>'
}

window.setupRedeem = function() {
  $("#redeem").keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;

    var passcode = $(this).val();
    if(!passcode) return;

    var jqXHR = window.postAjax('redeemReward', {passcode:passcode}, window.handleRedeemResponse, function(response) {
      var extra = '';
      if(response.status) {
        extra = (window.REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
      } else {
        extra = 'No status code was returned.';
      }
      dialog({
        title: 'Request failed: ' + data.passcode,
        html: '<strong>The HTTP request failed.</strong> ' + extra
      });
    });
    jqXHR.passcode = passcode;
  });
};


;

﻿

window.regionScoreboard = function() {
  // TODO: rather than just load the region scores for the center of the map, display a list of regions in the current view
  // and let the user select one (with automatic selection when just one region, and limited to close enough zooms so list size is reasonable)
  var latLng = map.getCenter();

  var latE6 = Math.round(latLng.lat*1E6);
  var lngE6 = Math.round(latLng.lng*1E6);

  var dlg = dialog({title:'區域分數',html:'讀取區域分數...',width:450,minHeight:320});

  window.postAjax('getRegionScoreDetails', {latE6:latE6,lngE6:lngE6}, function(res){regionScoreboardSuccess(res,dlg);}, function(){regionScoreboardFailure(dlg);});
}

function regionScoreboardFailure(dlg) {
  dlg.html('區域分數讀取失敗 - 請重試');
}


function regionScoreboardScoreHistoryChart(result, logscale) {
  // svg area 400x130. graph area 350x100, offset to 40,10

  if(!Math.log10)
    Math.log10 = function(x) { return Math.log(x) / Math.LN10; };

  var max = Math.max(result.gameScore[0],result.gameScore[1],10); //NOTE: ensure a min of 10 for the graph
  var items = []; //we'll copy the items to an array indexed by checkpoint number - easier to access!
  for (var i=0; i<result.scoreHistory.length; i++) {
    max = Math.max(max, result.scoreHistory[i][1], result.scoreHistory[i][2]); //note: index 0 is the checkpoint number here
    items[result.scoreHistory[i][0]] = [result.scoreHistory[i][1], result.scoreHistory[i][2]];
  }

  // scale up maximum a little, so graph isn't squashed right against upper edge
  max *= 1.09;

  // 0 cannot be displayed on a log scale, so we set the minimum to 0.001 and divide by lg(0.001)=-3
  var scale = logscale
    ? function(y) { return  10 - Math.log10(Math.max(0.001,y/max)) / 3 * 100; }
    : function(y) { return 110-y/max*100; };

  var teamPaths = [[],[]];
  var otherSvg = [];

  for (var i=0; i<items.length; i++) {
    var x=i*10+40;
    if (items[i] !== undefined) {
      // paths
      if (i>0 && items[i-1] !== undefined) {
        for (var t=0; t<2; t++) {
          teamPaths[t].push('M'+(x-10)+','+scale(items[i-1][t])+' L'+x+','+scale(items[i][t]));
        }
      }
      // markers
      otherSvg.push('<g title="test" class="checkpoint" data-cp="'+i+'" data-enl="'+items[i][0]+'" data-res="'+items[i][1]+'">');
      otherSvg.push('<rect x="'+(i*10+35)+'" y="10" width="10" height="100" fill="black" fill-opacity="0" />');
      for (var t=0; t<2; t++) {
        var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
        otherSvg.push('<circle cx="'+x+'" cy="'+scale(items[i][t])+'" r="3" stroke-width="1" stroke="'+col+'" fill="'+col+'" fill-opacity="0.5" />');
      }
      otherSvg.push('</g>');
    }
  }


  var paths = '<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />';

  // graph tickmarks - horizontal
  var ticks = [];
  for (var i=5; i<=35; i+=5) {
    var x=i*10+40;
    ticks.push('M'+x+',10 L'+x+',110');
    otherSvg.push('<text x="'+x+'" y="125" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="middle" fill="#fff">'+i+'</text>');
  }

  // vertical
  // first we calculate the power of 10 that is smaller than the max limit
  var vtickStep = Math.pow(10,Math.floor(Math.log10(max)));
  var vticks = [];
  if(logscale) {
    for(var i=0;i<4;i++) {
      vticks.push(vtickStep);
      vtickStep /= 10;
    }
  } else {
    // this could be between 1 and 10 grid lines - so we adjust to give nicer spacings
    if (vtickStep < (max/5)) {
      vtickStep *= 2;
    } else if (vtickStep > (max/2)) {
      vtickStep /= 2;
    }
    for (var i=vtickStep; i<=max; i+=vtickStep) {
      vticks.push(i);
    }
  }
  vticks.forEach(function(i) {
    var y = scale(i);

    ticks.push('M40,'+y+' L390,'+y);

    var istr = i>=1000000000 ? i/1000000000+'B' : i>=1000000 ? i/1000000+'M' : i>=1000 ? i/1000+'k' : i;
    otherSvg.push('<text x="35" y="'+y+'" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="end" fill="#fff">'+istr+'</text>');
  });

  paths += '<path d="'+ticks.join(' ')+'" stroke="#fff" opacity="0.3" />;'

  for (var t=0; t<2; t++) {
    var col = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    if (teamPaths[t].length > 0) {
      paths += '<path d="'+teamPaths[t].join(' ')+'" stroke="'+col+'" />';
    }

    var y = scale(result.gameScore[t]);
    paths += '<path d="M40,'+y+' L390,'+y+'" stroke="'+col+'" stroke-dasharray="3,2" opacity="0.8" />';
  }

  var svg = '<div><svg width="400" height="130">'
           +'<rect x="0" y="0" width="400" height="130" stroke="#FFCE00" fill="#08304E" />'
           +paths
           +otherSvg.join('')
           +'<foreignObject height="18" width="45" y="111" x="0" class="node"><label title="對數刻度">'
           +'<input type="checkbox" class="logscale" style="height:auto;padding:0;vertical-align:middle"'+(logscale?' checked':'')+'/>'
           +'log</label></foreignObject>'
           +'</svg></div>';

  return svg;
}

function regionScoreboardScoreHistoryTable(result) {
  var history = result.scoreHistory;
  var table = '<table class="checkpoint_table"><thead><tr><th>檢查點</th><th>啟蒙軍</th><th>反抗軍</th></tr></thead>';

  for(var i=0; i<history.length; i++) {
    table += '<tr><td>' + history[i][0] + '</td><td>' + digits(history[i][1]) + '</td><td>' + digits(history[i][2]) + '</td></tr>';
  }

  table += '</table>';
  return table;
}

function regionScoreboardSuccess(data,dlg,logscale) {
  if (data.result === undefined) {
    return regionScoreboardFailure(dlg);
  }

  var agentTable = '<table><tr><th>#</th><th>探員</th></tr>';
  for (var i=0; i<data.result.topAgents.length; i++) {
    var agent = data.result.topAgents[i];
    agentTable += '<tr><td>'+(i+1)+'</td><td class="nickname '+(agent.team=='RESISTANCE'?'res':'enl')+'">'+agent.nick+'</td></tr>';
  }
  if (data.result.topAgents.length==0) {
    agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
  }
  agentTable += '</table>';


  var maxAverage = Math.max(data.result.gameScore[0], data.result.gameScore[1], 1);
  var teamRow = [];
  for (var t=0; t<2; t++) {
    var team = t==0 ? '啟蒙軍' : '反抗軍';
    var teamClass = t==0 ? 'enl' : 'res';
    var teamCol = t==0 ? COLORS[TEAM_ENL] : COLORS[TEAM_RES];
    var barSize = Math.round(data.result.gameScore[t]/maxAverage*200);
    teamRow[t] = '<tr><th class="'+teamClass+'">'+team+'</th><td class="'+teamClass+'">'+digits(data.result.gameScore[t])+'</td><td><div style="background:'+teamCol+'; width: '+barSize+'px; height: 1.3ex; border: 2px outset '+teamCol+'"> </td></tr>';

  }

  var first = PLAYER.team == 'RESISTANCE' ? 1 : 0;

  // we need some divs to make the accordion work properly
  dlg.html('<div class="cellscore">'
         +'<b>區域 '+data.result.regionName+'</b>'
         +'<div><table>'+teamRow[first]+teamRow[1-first]+'</table>'
         +regionScoreboardScoreHistoryChart(data.result, logscale)+'</div>'
         +'<b>歷史紀錄</b>'
         +'<div>'+regionScoreboardScoreHistoryTable(data.result)+'</div>'
         +'<b>頂級探員</b>'
         +'<div>'+agentTable+'</div>'
         +'</div>');

  $('g.checkpoint', dlg).each(function(i, elem) {
    elem = $(elem);

    var tooltip = '檢查點:\t'+elem.attr('data-cp')
      + '\n啟蒙軍:\t' + digits(elem.attr('data-enl'))
      + '\n反抗軍:\t' + digits(elem.attr('data-res'));
    elem.tooltip({
      content: convertTextToTableMagic(tooltip),
      position: {my: "center bottom", at: "center top-10"}
    });
  });

  $('.cellscore', dlg).accordion({
    header: 'b',
    heightStyle: "fill",
  });

  $('input.logscale', dlg).change(function(){
    var input = $(this);
    regionScoreboardSuccess(data, dlg, input.prop('checked'));
  });
}


;


// REQUEST HANDLING //////////////////////////////////////////////////
// note: only meant for portal/links/fields request, everything else
// does not count towards “loading”

window.activeRequests = [];
window.failedRequestCount = 0;
window.statusTotalMapTiles = 0;
window.statusCachedMapTiles = 0;
window.statusSuccessMapTiles = 0;
window.statusStaleMapTiles = 0;
window.statusErrorMapTiles = 0;


window.requests = function() {}

//time of last refresh
window.requests._lastRefreshTime = 0;
window.requests._quickRefreshPending = false;

window.requests.add = function(ajax) {
  window.activeRequests.push(ajax);
  renderUpdateStatus();
}

window.requests.remove = function(ajax) {
  window.activeRequests.splice(window.activeRequests.indexOf(ajax), 1);
  renderUpdateStatus();
}

window.requests.abort = function() {
  $.each(window.activeRequests, function(ind, actReq) {
    if(actReq) actReq.abort();
  });

  window.activeRequests = [];
  window.failedRequestCount = 0;
  window.chat._requestPublicRunning  = false;
  window.chat._requestFactionRunning  = false;

  renderUpdateStatus();
}



// sets the timer for the next auto refresh. Ensures only one timeout
// is queued. May be given 'override' in milliseconds if time should
// not be guessed automatically. Especially useful if a little delay
// is required, for example when zooming.
window.startRefreshTimeout = function(override) {
  // may be required to remove 'paused during interaction' message in
  // status bar
  window.renderUpdateStatus();
  if(refreshTimeout) clearTimeout(refreshTimeout);
  if(override == -1) return;  //don't set a new timeout

  var t = 0;
  if(override) {
    window.requests._quickRefreshPending = true;
    t = override;
    //ensure override can't cause too fast a refresh if repeatedly used (e.g. lots of scrolling/zooming)
    timeSinceLastRefresh = new Date().getTime()-window.requests._lastRefreshTime;
    if(timeSinceLastRefresh < 0) timeSinceLastRefresh = 0;  //in case of clock adjustments
    if(timeSinceLastRefresh < MINIMUM_OVERRIDE_REFRESH*1000)
      t = (MINIMUM_OVERRIDE_REFRESH*1000-timeSinceLastRefresh);
  } else {
    window.requests._quickRefreshPending = false;
    t = REFRESH*1000;

    var adj = ZOOM_LEVEL_ADJ * (18 - map.getZoom());
    if(adj > 0) t += adj*1000;
  }
  var next = new Date(new Date().getTime() + t).toLocaleTimeString();
//  console.log('planned refresh in ' + (t/1000) + ' seconds, at ' + next);
  refreshTimeout = setTimeout(window.requests._callOnRefreshFunctions, t);
  renderUpdateStatus();
}

window.requests._onRefreshFunctions = [];
window.requests._callOnRefreshFunctions = function() {
//  console.log('running refresh at ' + new Date().toLocaleTimeString());
  startRefreshTimeout();

  if(isIdle()) {
//    console.log('user has been idle for ' + idleTime + ' seconds, or window hidden. Skipping refresh.');
    renderUpdateStatus();
    return;
  }

//  console.log('refreshing');

  //store the timestamp of this refresh
  window.requests._lastRefreshTime = new Date().getTime();

  $.each(window.requests._onRefreshFunctions, function(ind, f) {
    f();
  });
}


// add method here to be notified of auto-refreshes
window.requests.addRefreshFunction = function(f) {
  window.requests._onRefreshFunctions.push(f);
}

window.requests.isLastRequest = function(action) {
  var result = true;
  $.each(window.activeRequests, function(ind, req) {
    if(req.action === action) {
      result = false;
      return false;
    }
  });
  return result;
}


;


// SEARCH /////////////////////////////////////////////////////////

/*
you can implement your own result provider by listing to the search hook:
addHook('search', function(query) {});

`query` is an object with the following members:
- `term` is the term for which the user has searched
- `confirmed` is a boolean indicating if the user has pressed enter after searching. You should not search online or 
  heavy processing unless the user has confirmed the search term
- `addResult(result)` can be called to add a result to the query.

`result` may have the following members (`title` is required, as well as one of `position` and `bounds`):
- `title`: the label for this result. Will be interpreted as HTML, so make sure to escape properly.
- `description`: secondary information for this result. Will be interpreted as HTML, so make sure to escape properly.
- `position`: a L.LatLng object describing the position of this result
- `bounds`: a L.LatLngBounds object describing the bounds of this result
- `layer`: a ILayer to be added to the map when the user selects this search result. Will be generated if not set.
  Set to `null` to prevent the result from being added to the map.
- `icon`: a URL to a icon to display in the result list. Should be 12x12.
- `onSelected(result, event)`: a handler to be called when the result is selected. May return `true` to prevent the map
  from being repositioned. You may reposition the map yourself or do other work.
- `onRemove(result)`: a handler to be called when the result is removed from the map (because another result has been
  selected or the search was cancelled by the user).
*/

window.search = {
  lastSearch: null,
};

window.search.Query = function(term, confirmed) {
  this.term = term;
  this.confirmed = confirmed;
  this.init();
};
window.search.Query.prototype.init = function() {
  this.results = [];

  this.container = $('<div>').addClass('searchquery');

  this.header = $('<h3>')
    .text(this.confirmed
      ? this.term
      : ((this.term.length > 16
        ? this.term.substr(0,8) + '…' + this.term.substr(this.term.length-8,8)
        : this.term)
        + ' (Return to load more)'))
    .appendTo(this.container);

  this.list = $('<ul>')
    .appendTo(this.container)
    .append($('<li>').text(this.confirmed ? 'No local results, searching online...' : 'No local results.'));

  this.container.accordion({
    collapsible: true,
    heightStyle: 'content',
  });

  runHooks('search', this);
};
window.search.Query.prototype.show = function() {
  this.container.appendTo('#searchwrapper');
};
window.search.Query.prototype.hide = function() {
  this.container.remove();
  this.removeSelectedResult();
};
window.search.Query.prototype.addResult = function(result) {
  if(this.results.length == 0) {
    // remove 'No results'
    this.list.empty();
  }

  this.results.push(result);
  var item = $('<li>')
    .appendTo(this.list)
    .attr('tabindex', '0')
    .on('click dblclick', function(ev) {
      this.onResultSelected(result, ev);
    }.bind(this))
    .keypress(function(ev) {
      if((ev.keyCode || ev.charCode || ev.which) == 32) {
        ev.preventDefault();
        ev.type = 'click';
        $(this).trigger(ev);
        return;
      }
      if((ev.keyCode || ev.charCode || ev.which) == 13) {
        ev.preventDefault();
        ev.type = 'dblclick';
        $(this).trigger(ev);
        return;
      }
    });

  var link = $('<a>')
    .append(result.title)
    .appendTo(item);

  if(result.icon) {
    link.css('background-image', 'url("'+result.icon+'")');
    item.css('list-style', 'none');
  }

  if(result.description) {
    item
      .append($('<br>'))
      .append($('<em>')
        .append(result.description));
  }

};
window.search.Query.prototype.onResultSelected = function(result, ev) {
  this.removeSelectedResult();
  this.selectedResult = result;

  if(result.onSelected) {
    if(result.onSelected(result, ev)) return;
  }

  if(ev.type == 'dblclick') {
    if(result.position) {
      map.setView(result.position, 17);
    } else if(result.bounds) {
      map.fitBounds(result.bounds, {maxZoom: 17});
    }
  } else { // ev.type != 'dblclick'
    if(result.bounds) {
      map.fitBounds(result.bounds, {maxZoom: 17});
    } else if(result.position) {
      map.setView(result.position);
    }
  }

  if(result.layer !== null && !result.layer) {
    result.layer = L.layerGroup();

    if(result.position) {
      createGenericMarker(result.position, 'red', {
        title: result.title
      }).addTo(result.layer);
    }

    if(result.bounds) {
      L.rectangle(result.bounds, {
        title: result.title,
        clickable: false,
        color: 'red',
        fill: false,
      }).addTo(result.layer);
    }
  }

  if(result.layer)
    map.addLayer(result.layer);

  if(window.isSmartphone()) window.show('map');
}
window.search.Query.prototype.removeSelectedResult = function() {
  if(this.selectedResult) {
    if(this.selectedResult.layer) map.removeLayer(this.selectedResult.layer);
    if(this.selectedResult.onRemove) this.selectedResult.onRemove(this.selectedResult);
  }
}

window.search.doSearch = function(term, confirmed) {
  term = term.trim();

  // minimum 3 characters for automatic search
  if(term.length < 3 && !confirmed) return;

  // don't clear last confirmed search
  if(window.search.lastSearch
  && window.search.lastSearch.confirmed
  && !confirmed)
    return;

  // don't make the same query again
  if(window.search.lastSearch
  && window.search.lastSearch.confirmed == confirmed
  && window.search.lastSearch.term == term)
    return;

  if(window.search.lastSearch) window.search.lastSearch.hide();
  window.search.lastSearch = null;

  // clear results
  if(term == '') return;

  if(useAndroidPanes()) show('info');

  $('.ui-tooltip').remove();

  window.search.lastSearch = new window.search.Query(term, confirmed);
  window.search.lastSearch.show();
};

window.search.setup = function() {
  $('#search')
    .keypress(function(e) {
      if((e.keyCode ? e.keyCode : e.which) != 13) return;
      e.preventDefault();

      var term = $(this).val();

      clearTimeout(window.search.timer);
      window.search.doSearch(term, true);
    })
    .on('keyup keypress change paste', function(e) {
      clearTimeout(window.search.timer);
      window.search.timer = setTimeout(function() {
        var term = $(this).val();
        window.search.doSearch(term, false);
      }.bind(this), 500);
    });
  $('#buttongeolocation').click(function(){
    map.locate({setView : true, maxZoom: 13});
  });
};

addHook('search', function(query) {
  var term = query.term.toLowerCase();
  var teams = ['NEU','RES','ENL'];

  $.each(portals, function(guid, portal) {
    var data = portal.options.data;
    if(!data.title) return;

    if(data.title.toLowerCase().indexOf(term) !== -1) {
      var team = portal.options.team;
      var color = team==TEAM_NONE ? '#CCC' : COLORS[team];
      query.addResult({
        title: data.title,
        description: teams[team] + ', L' + data.level + ', ' + data.health + '%, ' + data.resCount + ' Resonators',
        position: portal.getLatLng(),
        icon: 'data:image/svg+xml;base64,'+btoa('<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.1">\n	<g style="fill:%COLOR%;stroke:none">\n		<path d="m 6,12 -2,-12  4,0 z" />\n		<path d="m 6,12 -4, -8  8,0 z" />\n		<path d="m 6,12 -6, -4 12,0 z" />\n	</g>\n</svg>\n'.replace(/%COLOR%/g, color)),
        onSelected: function(result, event) {
          if(event.type == 'dblclick') {
            zoomToAndShowPortal(guid, portal.getLatLng());
          } else if(window.portals[guid]) {
            if(!map.getBounds().contains(result.position)) map.setView(result.position);
            renderPortalDetails(guid);
          } else {
            window.selectPortalByLatLng(portal.getLatLng());
          }
          return true; // prevent default behavior
        },
      });
    }
  });
});

// TODO: recognize 50°31'03.8"N 7°59'05.3"E and similar formats
// TODO: if a portal with these exact coordinates is found, select it
addHook('search', function(query) {
  if(query.term.split(',').length == 2) {
    var ll = query.term.split(',');
    if(!isNaN(ll[0]) && !isNaN(ll[1])) {
      query.addResult({
        title: query.term,
        description: 'geo coordinates',
        position: L.latLng(parseFloat(ll[0]), parseFloat(ll[1])),
      });
    }
  }
});

addHook('search', function(query) {
  if(!query.confirmed) return;

  $.getJSON(NOMINATIM + encodeURIComponent(query.term), function(data) {
    if(data.length == 0) {
      query.addResult({
        title: 'No results on OpenStreetMap',
        icon: '//www.openstreetmap.org/favicon.ico',
        onSelected: function() {return true;},
      });
      return;
    }

    data.forEach(function(item) {
      var result = {
        title: item.display_name,
        description: 'Type: ' + item.type,
        position: L.latLng(parseFloat(item.lat), parseFloat(item.lon)),
        icon: item.icon,
      };

      if(item.geojson) {
        result.layer = L.geoJson(item.geojson, {
          clickable: false,
          color: 'red',
          opacity: 0.7,
          weight: 2,
          fill: false,
          pointToLayer: function(featureData,latLng) {
            return createGenericMarker(latLng,'red');
          }
        });
      }

      var b = item.boundingbox;
      if(b) {
        var southWest = new L.LatLng(b[0], b[2]),
            northEast = new L.LatLng(b[1], b[3]);
        result.bounds = new L.LatLngBounds(southWest, northEast);
      }

      query.addResult(result);
    });
  });
});



;


// posts AJAX request to Ingress API.
// action: last part of the actual URL, the rpc/dashboard. is
//         added automatically
// data: JSON data to post. method will be derived automatically from
//       action, but may be overridden. Expects to be given Hash.
//       Strings are not supported.
// success: method to call on success. See jQuery API docs for avail-
//          able arguments: http://api.jquery.com/jQuery.ajax/
// error: see above. Additionally it is logged if the request failed.
window.postAjax = function(action, data, successCallback, errorCallback) {
  // state management functions... perhaps should be outside of this func?

//  var remove = function(data, textStatus, jqXHR) { window.requests.remove(jqXHR); };
//  var errCnt = function(jqXHR) { window.failedRequestCount++; window.requests.remove(jqXHR); };

  if (window.latestFailedRequestTime && window.latestFailedRequestTime < Date.now()-120*1000) {
    // no errors in the last two minutes - clear the error count
    window.failedRequestCount = 0;
    window.latestFailedRequestTime = undefined;
  }

  var onError = function(jqXHR, textStatus, errorThrown) {
    window.requests.remove(jqXHR);
    window.failedRequestCount++;

    window.latestFailedRequestTime = Date.now();

    // pass through to the user error func, if one exists
    if (errorCallback) {
      errorCallback(jqXHR, textStatus, errorThrown);
    }
  };

  var onSuccess = function(data, textStatus, jqXHR) {
    window.requests.remove(jqXHR);

    // the Niantic server can return a HTTP success, but the JSON response contains an error. handle that sensibly
    if (data && data.error && data.error == 'out of date') {
      window.failedRequestCount++;
      // let's call the error callback in thos case...
      if (errorCallback) {
        errorCallback(jqXHR, textStatus, "data.error == 'out of date'");
      }

      window.outOfDateUserPrompt();
    } else {
      successCallback(data, textStatus, jqXHR);
    }
  };

  // we set this flag when we want to block all requests due to having an out of date CURRENT_VERSION
  if (window.blockOutOfDateRequests) {
    window.failedRequestCount++;
    window.latestFailedRequestTime = Date.now();

    // call the error callback, if one exists
    if (errorCallback) {
      // NOTE: error called on a setTimeout - as it won't be expected to be synchronous
      // ensures no recursion issues if the error handler immediately resends the request
      setTimeout(function(){errorCallback(null, undefined, "window.blockOutOfDateRequests is set");}, 10);
    }
    return;
  }

  var versionStr = niantic_params.CURRENT_VERSION;
  var post_data = JSON.stringify($.extend({}, data, {v: versionStr}));

  var result = $.ajax({
    url: '/r/'+action,
    type: 'POST',
    data: post_data,
    context: data,
    dataType: 'json',
    success: [onSuccess],
    error: [onError],
    contentType: 'application/json; charset=utf-8',
    beforeSend: function(req) {
      req.setRequestHeader('X-CSRFToken', readCookie('csrftoken'));
    }
  });
  result.action = action;

  requests.add(result);

  return result;
}


window.outOfDateUserPrompt = function()
{
  // we block all requests while the dialog is open. 
  if (!window.blockOutOfDateRequests) {
    window.blockOutOfDateRequests = true;

    dialog({
      title: '刷新IITC',
      html: '<p>IITC正在使用過期的程式碼. 這可能在Niantic更新官方intel網站時發生.</p>'
           +'<p>您需要重新讀取網頁來取得這些更新.</p>'
           +'<p>若您已經刷新過網頁, 那可能是因為官方intel的腳本還被快取在某些地方.'
           +'這種情況下, 試著清除您的快取, 或等待15-30分鐘, 直到舊的資料過期.</p>',
      buttons: {
        '刷新': function() {
          if (typeof android !== 'undefined' && android && android.reloadIITC) {
            android.reloadIITC();
          } else {
            window.location.reload();
          }
        }
      },
      close: function(event, ui) {
        delete window.blockOutOfDateRequests;
      }

    });


  }

}


;

window.isSmartphone = function() {
  // this check is also used in main.js. Note it should not detect
  // tablets because their display is large enough to use the desktop
  // version.

  // The stock intel site allows forcing mobile/full sites with a vp=m or vp=f
  // parameter - let's support the same. (stock only allows this for some
  // browsers - e.g. android phone/tablet. let's allow it for all, but
  // no promises it'll work right)
  var viewParam = getURLParam('vp');
  if (viewParam == 'm') return true;
  if (viewParam == 'f') return false;

  return navigator.userAgent.match(/Android.*Mobile/);
}

window.smartphone = function() {};

window.runOnSmartphonesBeforeBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone pre boot stuff');

  // add smartphone stylesheet
  headHTML = document.getElementsByTagName('head')[0].innerHTML;
  headHTML += '<style>body {\n  color: #fff;\n}\n\n#updatestatus {\n  background: #262c32;\n  width: 100%;\n  color: #d4d5d6;\n  border: 0;\n  padding: 0;\n}\n\n#updatestatus .map {\n  margin-left: 4px;\n}\n\n#innerstatus {\n  padding: 4px;\n  float: right;\n  width: 50%;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#loadlevel {\n  border-width: 0;\n  background: transparent;\n  color: #FFF;\n}\n\n#mobileinfo {\n  float: left;\n  width: 50%;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  overflow: hidden;\n  position:relative;\n  padding: 4px 0;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#mobileinfo .portallevel {\n  padding: 0 0.25em;\n  color: #FFF;\n}\n\n#mobileinfo .resonator {\n  position: absolute;\n  width: 12%; /* a little less that 1/8 to have a small distance */\n  height: 100%;\n  top: 0;\n  border-top: 3px solid red;\n  box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n}\n\n#mobileinfo .resonator.north:before {\n  content: "";\n  background-color: red;\n  border-radius: 100%;\n  display: block;\n  height: 6px;\n  width: 6px;\n  left: 50%;\n  top: -3px; \n  margin-left: -3px;\n  position: absolute;\n  z-index: -1;\n}\n\n#mobileinfo .filllevel {\n  position: absolute;\n  bottom: 0;\n  height: 3px;\n}\n\n#mobileinfo .enl .filllevel {\n  background-color: #03fe03 !important;\n}\n\n#mobileinfo .res .filllevel {\n  background-color: #00c5ff !important;\n}\n\n#name #signout { /* no hover, always show signout button */\n  display: block;\n}\n\n#sidebar, #chatcontrols, #chat, #chatinput {\n  background: transparent !important;\n}\n\n.leaflet-top .leaflet-control {\n  margin-top: 5px !important;\n  margin-left: 5px !important;\n}\n\n#searchwrapper {\n  font-size: 1.2em;\n}\n#searchwrapper .ui-accordion-header {\n  padding: 0.3em 0;\n}\n#searchwrapper li {\n  line-height: 1.3em;\n}\n\n#chatcontrols {\n  height: 38px;\n  width: 100%;\n  display: none !important;\n}\n\n/* hide shrink button */\n#chatcontrols a:first-child {\n  display: none;\n}\n\n#chatcontrols a {\n  width: 50px;\n  height:36px;\n  overflow: hidden;\n  vertical-align: middle;\n  line-height: 36px;\n  text-decoration: none;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n#chat {\n  left:0;\n  right:0;\n  top: 1px !important;\n  bottom:30px;\n  width: auto;\n}\n\n#chatinput {\n  width: 100%;\n  height: 30px;\n}\n\n#chat td:nth-child(2), #chatinput td:nth-child(2) {\n  width: 77px;\n}\n\n#chatcontrols a.active {\n  border-color: #FFCE00;\n  border-bottom-width:0px;\n  font-weight:bold\n}\n\n#chatcontrols a.active + a {\n  border-left-color: #FFCE00\n}\n\n#sidebartoggle {\n  display: none !important;\n}\n\n#scrollwrapper {\n  bottom: 0;\n  max-height: none !important;\n  width: 100% !important;\n  right: 0;\n  left:0;\n}\n\n#sidebar {\n  width: 100% !important;\n  min-height: 100%;\n  border:0;\n}\n\n#sidebar > * {\n  width: 100%;\n}\n\n#playerstat {\n  margin-top: 5px;\n}\n\n#portaldetails {\n  min-height: 0;\n}\n\n.fullimg {\n  width: 100%;\n}\n\n/*\n * for some reason leaflet popups on mobile are colored white on white\n * so force the popup msg color to black\n */\n.leaflet-popup-content{\n    color:black;\n}\n\n\n/* add extra padding, and a button effect, to sidebar link areas */\n.linkdetails aside  {\n  padding: 5px;\n  margin-top: 3px;\n  margin-bottom: 3px;\n  border: 2px outset #20A8B1;\n}\n\n#toolbox > a {\n  padding: 5px;\n  margin-top: 3px;\n  margin-bottom: 3px;\n  border: 2px outset #20A8B1;\n}\n\n#portaldetails .close {\n  padding: 4px;\n  border: 1px outset #20A8B1;\n  margin-top: 2px;\n}\n</style>';
  document.getElementsByTagName('head')[0].innerHTML = headHTML;

  // don’t need many of those
  window.setupStyles = function() {
    $('head').append('<style>' +
      [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
        '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
        '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } '].join("\n")
      + '</style>');
  }

  window.smartphone.mapButton = $('<a>map</a>').click(function() {
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('#chatcontrols a .active').removeClass('active');
    $("#chatcontrols a:contains('map')").addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
    $('#scrollwrapper').show();
    $('.active').removeClass('active');
    $("#chatcontrols a:contains('info')").addClass('active');
  });

  $('#chatcontrols').append(smartphone.mapButton).append(smartphone.sideButton);

  window.addHook('portalDetailsUpdated', function(data) {
    var x = $('.imgpreview img').removeClass('hide');

    if(!x.length) {
      $('.fullimg').remove();
      return;
    }

    if($('.fullimg').length) {
      $('.fullimg').replaceWith(x.addClass('fullimg'));
    } else {
      x.addClass('fullimg').appendTo('#sidebar');
    }
  });
}

window.smartphoneInfo = function(data) {
  var guid = data.selectedPortalGuid;
  if(!window.portals[guid]) return;

  var data = window.portals[selectedPortal].options.data;
  var details = window.portalDetail.get(guid);

  var lvl = data.level;
  if(data.team === "NEUTRAL")
    var t = '<span class="portallevel">L0</span>';
  else
    var t = '<span class="portallevel" style="background: '+COLORS_LVL[lvl]+';">L' + lvl + '</span>';

  var percentage = data.health;
  if(details) {
    var totalEnergy = getTotalPortalEnergy(details);
    if(getTotalPortalEnergy(details) > 0) {
      percentage = Math.floor(getCurrentPortalEnergy(details) / totalEnergy * 100);
    }
  }
  t += ' ' + percentage + '% ';
  t += data.title;

  if(details) {
    var l,v,max,perc;
    var eastAnticlockwiseToNorthClockwise = [2,1,0,7,6,5,4,3];

    for(var ind=0;ind<8;ind++)
    {
      if (details.resonators.length == 8) {
        var slot = eastAnticlockwiseToNorthClockwise[ind];
        var reso = details.resonators[slot];
      } else {
        var slot = null;
        var reso = ind < details.resonators.length ? details.resonators[ind] : null;
      }

      var className = TEAM_TO_CSS[getTeam(details)];
      if(slot !== null && OCTANTS[slot] === 'N')
        className += ' north'
      if(reso) {
        l = parseInt(reso.level);
        v = parseInt(reso.energy);
        max = RESO_NRG[l];
        perc = v/max*100;
      } else {
        l = 0;
        v = 0;
        max = 0;
        perc = 0;
      }

      t += '<div class="resonator '+className+'" style="border-top-color: '+COLORS_LVL[l]+';left: '+(100*ind/8.0)+'%;">';
      t += '<div class="filllevel" style="width:'+perc+'%;"></div>';
      t += '</div>'
    }
  }

  $('#mobileinfo').html(t);
}

window.runOnSmartphonesAfterBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone post boot stuff');

  window.show('map');

  // add a div/hook for updating mobile info
  $('#updatestatus').prepend('<div id="mobileinfo" onclick="show(\'info\')"></div>');
  window.addHook('portalSelected', window.smartphoneInfo);
  // init msg of status bar. hint for the user that a tap leads to the info screen
  $('#mobileinfo').html('<div style="text-align: center"><b>按此處檢視資訊頁面</b></div>');

  // disable img full view
  $('#portaldetails').off('click', '**');

  // make buttons in action bar flexible
  var l = $('#chatcontrols a:visible');
  l.css('width', 100/l.length + '%');

  // notify android that a select spinner is enabled.
  // this disables javascript injection on android side.
  // if android is not notified, the spinner closes on the next JS call
  if (typeof android !== 'undefined' && android && android.spinnerEnabled) {
    $("body").on("click", "select", function() {
      android.spinnerEnabled(true);
    });
  }

  // add event to portals that allows long press to switch to sidebar
  window.addHook('portalAdded', function(data) {
    data.portal.on('add', function() {
      if(!this._container || this.options.addedTapHoldHandler) return;
      this.options.addedTapHoldHandler = true;
      var guid = this.options.guid;

      // this is a hack, accessing Leaflet’s private _container is evil
      $(this._container).on('taphold', function() {
        window.renderPortalDetails(guid);
        window.show('info');
      });
    });
  });

  if(typeof android !== 'undefined' && android && android.setPermalink) {
    window.map.on('moveend', window.setAndroidPermalink);
    addHook('portalSelected', window.setAndroidPermalink);
  }


  // for some reason, leaflet misses the WebView size being set at startup on IITC Mobile
  // create a short timer that checks for this issue
  setTimeout (function() { map.invalidateSize(); }, 0.2*1000);

}



window.setAndroidPermalink = function() {
  var c = window.map.getCenter();
  var lat = Math.round(c.lat*1E6)/1E6;
  var lng = Math.round(c.lng*1E6)/1E6;

  var href = '/intel?ll='+lat+','+lng+'&z=' + map.getZoom();

  if(window.selectedPortal && window.portals[window.selectedPortal]) {
    var p = window.portals[window.selectedPortal].getLatLng();
    lat = Math.round(p.lat*1E6)/1E6;
    lng = Math.round(p.lng*1E6)/1E6;
    href += '&pll='+lat+','+lng;
  }

  href = $('<a>').prop('href',  href).prop('href'); // to get absolute URI
  android.setPermalink(href);
}

window.useAndroidPanes = function() {
  // isSmartphone is important to disable panes in desktop mode
  return (typeof android !== 'undefined' && android && android.addPane && window.isSmartphone());
}

if(typeof android !== 'undefined' && android && android.getFileRequestUrlPrefix) {
  window.requestFile = function(callback) {
    do {
      var funcName = "onFileSelected" + parseInt(Math.random()*0xFFFF).toString(16);
    } while(window[funcName] !== undefined)

    window[funcName] = function(filename, content) {
      callback(decodeURIComponent(filename), atob(content));
    };
    var script = document.createElement('script');
    script.src = android.getFileRequestUrlPrefix() + funcName;
    (document.body || document.head || document.documentElement).appendChild(script);
  };
}



;

// STATUS BAR ///////////////////////////////////////

// gives user feedback about pending operations. Draws current status
// to website. Updates info in layer chooser.
window.renderUpdateStatusTimer_ = undefined;

window.renderUpdateStatus = function() {
  var progress = 1;

  // portal/limk level display

  var zoom = map.getZoom();
  zoom = getDataZoomForMapZoom(zoom);
  var tileParams = getMapZoomTileParameters(zoom);

  var t = '<span class="help portallevel" title="過濾能量塔等級和連線長度. 放大來顯示更多.">';

  if (tileParams.hasPortals) {
    // zoom level includes portals (and also all links/fields)
    if(!window.isSmartphone()) // space is valuable
      t += '<b>能量塔</b>: ';
    if(tileParams.level === 0)
      //iF:Adjust color to background color.
      t += '<span id="loadlevel" style="background: rgba(0, 0, 0, 0); color: #FFCE00;">全部</span>';
    else
      t += '<span id="loadlevel" style="background:'+COLORS_LVL[tileParams.level]+'">L'+tileParams.level+(tileParams.level<8?'+':'') + '</span>';
  } else {
    if(!window.isSmartphone()) // space is valuable
      t += '<b>連線</b>: ';

    if (tileParams.minLinkLength > 0)
      //iF:Adjust color to background color.
      t += '<span id="loadlevel" style="background: rgba(0, 0, 0, 0); color: #FFCE00;">&gt;'+(tileParams.minLinkLength>1000?tileParams.minLinkLength/1000+'公里':tileParams.minLinkLength+'公尺')+'</span>';
    else
      //iF:Adjust color to background color.
      t += '<span id="loadlevel" style="background: rgba(0, 0, 0, 0); color: #FFCE00;">所有連線</span>';
  }

  t +='</span>';


  // map status display
  t += ' <span class="map"><b>地圖</b>: ';

  if (window.mapDataRequest) {
    var status = window.mapDataRequest.getStatus();

    // status.short - short description of status
    // status.long - longer description, for tooltip (optional)
    // status.progress - fractional progress (from 0 to 1; -1 for indeterminate) of current state (optional)
    if (status.long)
      t += '<span class="help" title="'+status.long+'">'+status.short+'</span>';
    else
      t += '<span>'+status.short+'</span>';

    if (status.progress !== undefined) {
      if(status.progress !== -1)
        t += ' '+Math.floor(status.progress*100)+'%';
      progress = status.progress;
    }
  } else {
    // no mapDataRequest object - no status known
    t += '...未知...';
  }

  t += '</span>';

  //request status
  if (window.activeRequests.length > 0)
    t += ' ' + window.activeRequests.length + '個要求';
  if (window.failedRequestCount > 0)
    t += ' <span style="color:#f66">' + window.failedRequestCount + '個失敗</span>'


  //it's possible that updating the status bar excessively causes some performance issues. so rather than doing it
  //immediately, delay it to the next javascript event loop, cancelling any pending update
  // will also cause any browser-related rendering to occur first, before the status actually updates

  if (window.renderUpdateStatusTimer_) clearTimeout(window.renderUpdateStatusTimer_);

  window.renderUpdateStatusTimer_ = setTimeout ( function() {
    window.renderUpdateStatusTimer_ = undefined;

    $('#innerstatus').html(t);
    //$('#updatestatus').click(function() { startRefreshTimeout(10); });
    //. <a style="cursor: pointer" onclick="startRefreshTimeout(10)" title="Refresh">⟳</a>';

    if(progress == 1 && window.activeRequests.length > 0) {
      // we don't know the exact progress, but we have requests (e.g. chat) running, so show it as indeterminate.
      progress = -1;
    }

    if (typeof android !== 'undefined' && android && android.setProgress)
      android.setProgress(progress);
  }, 0);

}


;

// UTILS + MISC  ///////////////////////////////////////////////////////

window.aboutIITC = function() {
  var v = (script_info.script && script_info.script.version || script_info.dateTimeVersion) + ' ['+script_info.buildName+']';
  if (typeof android !== 'undefined' && android && android.getVersionName) {
    v += '[IITC Mobile '+android.getVersionName()+']';
  }

  var plugins = '<ul>';
  for (var i in bootPlugins) {
    var info = bootPlugins[i].info;
    if (info) {
      var pname = info.script && info.script.name || info.pluginId;
      if (pname.substr(0,13) == 'IITC plugin: ' || pname.substr(0,13) == 'IITC Plugin: ') {
        pname = pname.substr(13);
      }
      var pvers = info.script && info.script.version || info.dateTimeVersion;

      var ptext = pname + ' - ' + pvers;
      if (info.buildName != script_info.buildName) {
        ptext += ' ['+(info.buildName||'<i>non-standard plugin</i>')+']';
      }

      plugins += '<li>'+ptext+'</li>';
    } else {
      // no 'info' property of the plugin setup function - old plugin wrapper code
      // could attempt to find the "window.plugin.NAME = function() {};" line it's likely to have..?
      plugins += '<li>(unknown plugin: index '+i+')</li>';
    }
  }
  plugins += '</ul>';

  var attrib = '<p>This project is licensed under the permissive <a href="http://www.isc.org/downloads/software-support-policy/isc-license/">ISC license</a>. Parts imported from other projects remain under their respective licenses:</p>\n\n<ul>\n<li><a href="https://github.com/bryanwoods/autolink-js">autolink-js by Bryan Woods; MIT</a></li>\n<li><a href="https://github.com/chriso/load.js">load.js by Chris O\'Hara; MIT</a></li>\n<li><a href="http://leafletjs.com/">leaflet.js; custom license (but appears free)</a></li>\n<li><a href="https://github.com/Leaflet/Leaflet.draw">leaflet.draw.js by jacobtoye; MIT</a></li>\n<li>\n<a href="https://github.com/shramov/leaflet-plugins">leaflet_google.js by Pavel Shramov; same as Leaflet</a> (modified, though)</li>\n<li><a href="https://github.com/jeromeetienne/jquery-qrcode">jquery.qrcode.js by Jerome Etienne; MIT</a></li>\n<li><a href="https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet">oms.min.js by George MacKerron; MIT</a></li>\n<li><a href="https://github.com/richadams/jquery-taphold">taphold.js by Rich Adams; unknown</a></li>\n<li><a href="https://github.com/kartena/Leaflet.Pancontrol">L.Control.Pan.js by Kartena AB; same as Leaflet</a></li>\n<li><a href="https://github.com/kartena/Leaflet.zoomslider">L.Control.Zoomslider.js by Kartena AB; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">KML.js by shramov; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">leaflet.filelayer.js by shramov; same as Leaflet</a></li>\n<li><a href="https://github.com/shramov/leaflet-plugins">togeojson.js by shramov; same as Leaflet</a></li>\n<li>StackOverflow-CopyPasta is attributed in the source; <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-Wiki</a>\n</li>\n<li>all Ingress/Niantic related stuff obviously remains non-free and is still copyrighted by Niantic/Google</li>\n</ul>\n';
  var contrib = '<p>So far, these people have contributed:</p>\n\n<p><a href="https://github.com/Bananeweizen">Bananeweizen</a>,\n<a href="https://github.com/blakjakau">blakjakau</a>,\n<a href="https://github.com/boombuler">boombuler</a>,\n<a href="https://github.com/breunigs">breunigs</a>,\n<a href="https://github.com/cathesaurus">cathesaurus</a>,\n<a href="https://github.com/ccjon">ccjon</a>,\n<a href="https://github.com/cmrn">cmrn</a>,\n<a href="https://github.com/epf">epf</a>,\n<a href="https://github.com/fkloft">fkloft</a>,\n<a href="https://github.com/Fragger">Fragger</a>,\n<a href="https://github.com/hastarin">hastarin</a>,\n<a href="https://github.com/integ3r">integ3r</a>,\n<a href="https://github.com/j16sdiz">j16sdiz</a>,\n<a href="https://github.com/JasonMillward">JasonMillward</a>,\n<a href="https://github.com/jonatkins">jonatkins</a>,\n<a href="https://github.com/leCradle">leCradle</a>,\n<a href="https://github.com/Merovius">Merovius</a>,\n<a href="https://github.com/mledoze">mledoze</a>,\n<a href="https://github.com/OshiHidra">OshiHidra</a>,\n<a href="https://github.com/phoenixsong6">phoenixsong6</a>,\n<a href="https://github.com/Pirozek">Pirozek</a>,\n<a href="https://github.com/saithis">saithis</a>,\n<a href="https://github.com/Scrool">Scrool</a>,\n<a href="https://github.com/sorgo">sorgo</a>,\n<a href="https://github.com/tpenner">tpenner</a>,\n<a href="https://github.com/vita10gy">vita10gy</a>,\n<a href="https://github.com/Xelio">Xelio</a>,\n<a href="https://github.com/ZauberNerd">ZauberNerd</a>,\n<a href="https://github.com/waynn">waynn</a></p>\n'

  var a = ''
  + '  <div><b>About IITC</b></div> '
  + '  <div>Ingress Intel Total Conversion</div> '
  + '  <hr>'
  + '  <div>'
  + '    <a href="http://iitc.jonatkins.com/" target="_blank">IITC Homepage</a><br />'
  + '     On the script’s homepage you can:'
  + '     <ul>'
  + '       <li>Find Updates</li>'
  + '       <li>Get Plugins</li>'
  + '       <li>Report Bugs</li>'
  + '       <li>Contribute!</li>'
  + '     </ul>'
  + '  </div>'
  + '  <div>'
  + '    MapQuest OSM tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">'
  + '  </div>'
  + '  <hr>'
  + '  <div>Version: ' + v + '</div>'
  + '  <div>Plugins: ' + plugins + '</div>'
  + '  <hr>'
  + '  <div>' + attrib + '</div>'
  + '  <hr>'
  + '  <div>' + contrib + '</div>';

  dialog({
    title: 'IITC ' + v,
    html: a,
    dialogClass: 'ui-dialog-aboutIITC'
  });
}


window.layerGroupLength = function(layerGroup) {
  var layersCount = 0;
  var layers = layerGroup._layers;
  if (layers)
    layersCount = Object.keys(layers).length;
  return layersCount;
}

// retrieves parameter from the URL?query=string.
window.getURLParam = function(param) {
  var items = window.location.search.substr(1).split('&');
  if (items == "") return "";

  for (var i=0; i<items.length; i++) {
    var item = items[i].split('=');

    if (item[0] == param) {
      var val = item.length==1 ? '' : decodeURIComponent (item[1].replace(/\+/g,' '));
      return val;
    }
  }

  return '';
}

// read cookie by name.
// http://stackoverflow.com/a/5639455/1684530 by cwolves
window.readCookie = function(name){
  var C, i, c = document.cookie.split('; ');
  var cookies = {};
  for(i=c.length-1; i>=0; i--){
    C = c[i].split('=');
    cookies[C[0]] = unescape(C[1]);
  }
  return cookies[name];
}

window.writeCookie = function(name, val) {
  var d = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = name + "=" + val + '; expires='+d+'; path=/';
}

window.eraseCookie = function(name) {
  document.cookie = name + '=; expires=Thu, 1 Jan 1970 00:00:00 GMT; path=/';
}

//certain values were stored in cookies, but we're better off using localStorage instead - make it easy to convert
window.convertCookieToLocalStorage = function(name) {
  var cookie=readCookie(name);
  if(cookie !== undefined) {
    console.log('converting cookie '+name+' to localStorage');
    if(localStorage[name] === undefined) {
      localStorage[name] = cookie;
    }
    eraseCookie(name);
  }
}

// add thousand separators to given number.
// http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
window.digits = function(d) {
  // U+2009 - Thin Space. Recommended for use as a thousands separator...
  // https://en.wikipedia.org/wiki/Space_(punctuation)#Table_of_spaces
  return (d+"").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1&#8201;");
}


window.zeroPad = function(number,pad) {
  number = number.toString();
  var zeros = pad - number.length;
  return Array(zeros>0?zeros+1:0).join("0") + number;
}


// converts javascript timestamps to HH:mm:ss format if it was today;
// otherwise it returns YYYY-MM-DD
window.unixTimeToString = function(time, full) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var time = d.toLocaleTimeString();
//  var time = zeroPad(d.getHours(),2)+':'+zeroPad(d.getMinutes(),2)+':'+zeroPad(d.getSeconds(),2);
  var date = d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2);
  if(typeof full !== 'undefined' && full) return date + ' ' + time;
  if(d.toDateString() == new Date().toDateString())
    return time;
  else
    return date;
}

// converts a javascript time to a precise date and time (optionally with millisecond precision)
// formatted in ISO-style YYYY-MM-DD hh:mm:ss.mmm - but using local timezone
window.unixTimeToDateTimeString = function(time, millisecond) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  return d.getFullYear()+'-'+zeroPad(d.getMonth()+1,2)+'-'+zeroPad(d.getDate(),2)
    +' '+zeroPad(d.getHours(),2)+':'+zeroPad(d.getMinutes(),2)+':'+zeroPad(d.getSeconds(),2)+(millisecond?'.'+zeroPad(d.getMilliseconds(),3):'');
}

window.unixTimeToHHmm = function(time) {
  if(!time) return null;
  var d = new Date(typeof time === 'string' ? parseInt(time) : time);
  var h = '' + d.getHours(); h = h.length === 1 ? '0' + h : h;
  var s = '' + d.getMinutes(); s = s.length === 1 ? '0' + s : s;
  return  h + ':' + s;
}

window.formatInterval = function(seconds,maxTerms) {

  var d = Math.floor(seconds / 86400);
  var h = Math.floor((seconds % 86400) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;

  var terms = [];
  if (d > 0) terms.push(d+'天');
  if (h > 0) terms.push(h+'時');
  if (m > 0) terms.push(m+'分');
  if (s > 0 || terms.length==0) terms.push(s+'秒');

  if (maxTerms) terms = terms.slice(0,maxTerms);

  return terms.join(' ');
}


window.rangeLinkClick = function() {
  if(window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
  if(window.isSmartphone())
    window.show('map');
}

window.showPortalPosLinks = function(lat, lng, name) {
  var encoded_name = 'undefined';
  if(name !== undefined) {
    encoded_name = encodeURIComponent(name);
  }

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    android.intentPosLink(lat, lng, map.getZoom(), name, true);
  } else {
    var qrcode = '<div id="qrcode"></div>';
    var script = '<script>$(\'#qrcode\').qrcode({text:\'GEO:'+lat+','+lng+'\'});</script>';
    var gmaps = '<a href="https://maps.google.com/maps?ll='+lat+','+lng+'&q='+lat+','+lng+'%20('+encoded_name+')">Google Maps</a>';
    var bingmaps = '<a href="http://www.bing.com/maps/?v=2&cp='+lat+'~'+lng+'&lvl=16&sp=Point.'+lat+'_'+lng+'_'+encoded_name+'___">Bing Maps</a>';
    var osm = '<a href="http://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'&zoom=16">OpenStreetMap</a>';
    var latLng = '<span>&lt;' + lat + ',' + lng +'&gt;</span>';
    dialog({
      html: '<div style="text-align: center;">' + qrcode + script + gmaps + '; ' + bingmaps + '; ' + osm + '<br />' + latLng + '</div>',
      title: name,
      id: 'poslinks'
    });
  }
}

window.isTouchDevice = function() {
  return 'ontouchstart' in window // works on most browsers
      || 'onmsgesturechange' in window; // works on ie10
};

window.androidCopy = function(text) {
  if(typeof android === 'undefined' || !android || !android.copy)
    return true; // i.e. execute other actions
  else
    android.copy(text);
  return false;
}

window.androidPermalink = function() {
  if(typeof android === 'undefined' || !android || !android.intentPosLink)
    return true; // i.e. execute other actions

  var center = map.getCenter();
  android.intentPosLink(center.lat, center.lng, map.getZoom(), "Selected map view", false);
  return false;
}



window.getMinPortalLevel = function() {
  var z = map.getZoom();
  z = getDataZoomForMapZoom(z);
  return getMapZoomTileParameters(z).level;
}

// returns number of pixels left to scroll down before reaching the
// bottom. Works similar to the native scrollTop function.
window.scrollBottom = function(elm) {
  if(typeof elm === 'string') elm = $(elm);
  return elm.get(0).scrollHeight - elm.innerHeight() - elm.scrollTop();
}

window.zoomToAndShowPortal = function(guid, latlng) {
  map.setView(latlng, 17);
  // if the data is available, render it immediately. Otherwise defer
  // until it becomes available.
  if(window.portals[guid])
    renderPortalDetails(guid);
  else
    urlPortal = guid;
}

window.selectPortalByLatLng = function(lat, lng) {
  if(lng === undefined && lat instanceof Array) {
    lng = lat[1];
    lat = lat[0];
  } else if(lng === undefined && lat instanceof L.LatLng) {
    lng = lat.lng;
    lat = lat.lat;
  }
  for(var guid in window.portals) {
    var latlng = window.portals[guid].getLatLng();
    if(latlng.lat == lat && latlng.lng == lng) {
      renderPortalDetails(guid);
      return;
    }
  }

  // not currently visible
  urlPortalLL = [lat, lng];
  map.setView(urlPortalLL, 17);
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// http://stackoverflow.com/a/646643/1684530 by Bergi and CMS
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) === str;
  };
}

// escape a javascript string, so quotes and backslashes are escaped with a backslash
// (for strings passed as parameters to html onclick="..." for example)
window.escapeJavascriptString = function(str) {
  return (str+'').replace(/[\\"']/g,'\\$&');
}

//escape special characters, such as tags
window.escapeHtmlSpecialChars = function(str) {
  var div = document.createElement(div);
  var text = document.createTextNode(str);
  div.appendChild(text);
  return div.innerHTML;
}

window.prettyEnergy = function(nrg) {
  return nrg> 1000 ? Math.round(nrg/1000) + ' k': nrg;
}

window.setPermaLink = function(elm) {
  var c = map.getCenter();
  var lat = Math.round(c.lat*1E6)/1E6;
  var lng = Math.round(c.lng*1E6)/1E6;
  var qry = 'll='+lat+','+lng+'&z=' + map.getZoom();
  $(elm).attr('href',  '/intel?' + qry);
}

window.uniqueArray = function(arr) {
  return $.grep(arr, function(v, i) {
    return $.inArray(v, arr) === i;
  });
}

window.genFourColumnTable = function(blocks) {
  var t = $.map(blocks, function(detail, index) {
    if(!detail) return '';
    var title = detail[2] ? ' title="'+escapeHtmlSpecialChars(detail[2]) + '"' : '';
    if(index % 2 === 0)
      return '<tr><td'+title+'>'+detail[1]+'</td><th'+title+'>'+detail[0]+'</th>';
    else
      return '    <th'+title+'>'+detail[0]+'</th><td'+title+'>'+detail[1]+'</td></tr>';
  }).join('');
  if(t.length % 2 === 1) t + '<td></td><td></td></tr>';
  return t;
}


// converts given text with newlines (\n) and tabs (\t) to a HTML
// table automatically.
window.convertTextToTableMagic = function(text) {
  // check if it should be converted to a table
  if(!text.match(/\t/)) return text.replace(/\n/g, '<br>');

  var data = [];
  var columnCount = 0;

  // parse data
  var rows = text.split('\n');
  $.each(rows, function(i, row) {
    data[i] = row.split('\t');
    if(data[i].length > columnCount) columnCount = data[i].length;
  });

  // build the table
  var table = '<table>';
  $.each(data, function(i, row) {
    table += '<tr>';
    $.each(data[i], function(k, cell) {
      var attributes = '';
      if(k === 0 && data[i].length < columnCount) {
        attributes = ' colspan="'+(columnCount - data[i].length + 1)+'"';
      }
      table += '<td'+attributes+'>'+cell+'</td>';
    });
    table += '</tr>';
  });
  table += '</table>';
  return table;
}

// Given 3 sets of points in an array[3]{lat, lng} returns the area of the triangle
window.calcTriArea = function(p) {
  return Math.abs((p[0].lat*(p[1].lng-p[2].lng)+p[1].lat*(p[2].lng-p[0].lng)+p[2].lat*(p[0].lng-p[1].lng))/2);
}

// Update layerGroups display status to window.overlayStatus and localStorage 'ingress.intelmap.layergroupdisplayed'
window.updateDisplayedLayerGroup = function(name, display) {
  overlayStatus[name] = display;
  localStorage['ingress.intelmap.layergroupdisplayed'] = JSON.stringify(overlayStatus);
}

// Read layerGroup status from window.overlayStatus if it was added to map,
// read from cookie if it has not added to map yet.
// return 'defaultDisplay' if both overlayStatus and cookie didn't have the record
window.isLayerGroupDisplayed = function(name, defaultDisplay) {
  if(typeof(overlayStatus[name]) !== 'undefined') return overlayStatus[name];

  convertCookieToLocalStorage('ingress.intelmap.layergroupdisplayed');
  var layersJSON = localStorage['ingress.intelmap.layergroupdisplayed'];
  if(!layersJSON) return defaultDisplay;

  var layers = JSON.parse(layersJSON);
  // keep latest overlayStatus
  overlayStatus = $.extend(layers, overlayStatus);
  if(typeof(overlayStatus[name]) === 'undefined') return defaultDisplay;
  return overlayStatus[name];
}

window.addLayerGroup = function(name, layerGroup, defaultDisplay) {
  if (defaultDisplay === undefined) defaultDisplay = true;

  if(isLayerGroupDisplayed(name, defaultDisplay)) map.addLayer(layerGroup);
  layerChooser.addOverlay(layerGroup, name);
}

window.removeLayerGroup = function(layerGroup) {
  if(!layerChooser._layers[layerGroup._leaflet_id]) throw('Layer was not found');
  // removing the layer will set it's default visibility to false (store if layer gets added again)
  var name = layerChooser._layers[layerGroup._leaflet_id].name;
  var enabled = isLayerGroupDisplayed(name);
  map.removeLayer(layerGroup);
  layerChooser.removeLayer(layerGroup);
  updateDisplayedLayerGroup(name, enabled);
};

window.clampLat = function(lat) {
  // the map projection used does not handle above approx +- 85 degrees north/south of the equator
  if (lat > 85.051128)
    lat = 85.051128;
  else if (lat < -85.051128)
    lat = -85.051128;
  return lat;
}

window.clampLng = function(lng) {
  if (lng > 179.999999)
    lng = 179.999999;
  else if (lng < -180.0)
    lng = -180.0;
  return lng;
}


window.clampLatLng = function(latlng) {
  return new L.LatLng ( clampLat(latlng.lat), clampLng(latlng.lng) );
}

window.clampLatLngBounds = function(bounds) {
  return new L.LatLngBounds ( clampLatLng(bounds.getSouthWest()), clampLatLng(bounds.getNorthEast()) );
}

window.getGenericMarkerSvg = function(color) {
  var markerTemplate = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"\n	version="1.1" baseProfile="full"\n	width="25px" height="41px" viewBox="0 0 25 41">\n\n	<path d="M1.36241844765,18.67488124675 A12.5,12.5 0 1,1 23.63758155235,18.67488124675 L12.5,40.5336158073 Z" style="stroke:none; fill: %COLOR%;" />\n	<path d="M1.80792170975,18.44788599685 A12,12 0 1,1 23.19207829025,18.44788599685 L12.5,39.432271175 Z" style="stroke:#000000; stroke-width:1px; stroke-opacity: 0.15; fill: none;" />\n	<path d="M2.921679865,17.8803978722 A10.75,10.75 0 1,1 22.078320135,17.8803978722 L12.5,36.6789095943 Z" style="stroke:#ffffff; stroke-width:1.5px; stroke-opacity: 0.35; fill: none;" />\n\n	<path d="M19.86121593215,17.25 L12.5,21.5 L5.13878406785,17.25 L5.13878406785,8.75 L12.5,4.5 L19.86121593215,8.75 Z M7.7368602792,10.25 L17.2631397208,10.25 L12.5,18.5 Z M12.5,13 L7.7368602792,10.25 M12.5,13 L17.2631397208,10.25 M12.5,13 L12.5,18.5 M19.86121593215,17.25 L16.39711431705,15.25 M5.13878406785,17.25 L8.60288568295,15.25 M12.5,4.5 L12.5,8.5" style="stroke:#ffffff; stroke-width:1.25px; stroke-opacity: 1; fill: none;" />\n\n</svg>';

  return markerTemplate.replace(/%COLOR%/g, color);
}

window.getGenericMarkerIcon = function(color,className) {
  return L.divIcon({
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    html: getGenericMarkerSvg(color),
    className: className || 'leaflet-iitc-divicon-generic-marker'
  });
}

window.createGenericMarker = function(ll,color,options) {
  options = options || {};

  var markerOpt = $.extend({
    icon: getGenericMarkerIcon(color || '#a24ac3')
  }, options);

  return L.marker(ll, markerOpt);
}



// Fix Leaflet: handle touchcancel events in Draggable
L.Draggable.prototype._onDownOrig = L.Draggable.prototype._onDown;
L.Draggable.prototype._onDown = function(e) {
  L.Draggable.prototype._onDownOrig.apply(this, arguments);

  if(e.type === "touchstart") {
    L.DomEvent.on(document, "touchcancel", this._onUp, this);
  }
}




} // end of wrapper

// inject code into site context
var script = document.createElement('script');
var info = { buildName: 'mobile', dateTimeVersion: '20151117.4022' };
if (this.GM_info && this.GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
