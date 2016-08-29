// ==UserScript==
// @id             iitc-player-tracker-names-alt
// @name           IITC plugin: Player Tracker Names (by neon-ninja)
// @category       調整
// @version        1.0
// @namespace      https://gist.github.com/neon-ninja/iitc-player-tracker-names.user.js
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/IITC Player Tracker Names.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/IITC Player Tracker Names.user.js
// @description    This plugin displays player names for player tracker
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @require        http://leaflet.github.io/Leaflet.label/leaflet.label.js
// @grant          none
// ==/UserScript==
function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function() {};

    // PLUGIN START ////////////////////////////////////////////////////////

    window.plugin.playerTrackerNames = function() {};

    window.plugin.playerTrackerNames.setupHook = function() {
        plugin.playerTracker.drawnTracesRes.eachLayer(function(layer) {
            if ($(layer._icon) && layer.bindLabel && layer.options.desc) {
                var text = layer.options.desc.childNodes[0].textContent; // + ', ' + (layer.options.desc.childNodes[2].textContent || layer.options.desc.childNodes[3].textContent) + ' ago';
                layer.bindLabel(text, { noHide: true });
                if (layer.showLabel) {
                    layer.showLabel();
                    console.log('added label for ' + text);
                }
            }
        });
        plugin.playerTracker.drawnTracesEnl.eachLayer(function(layer) {
            if ($(layer._icon) && layer.bindLabel && layer.options.desc) {
                var text = layer.options.desc.childNodes[0].textContent; // + ', ' + (layer.options.desc.childNodes[2].textContent || layer.options.desc.childNodes[3].textContent) + ' ago';
                layer.bindLabel(text, { noHide: true });
                if (layer.showLabel) {
                    layer.showLabel();
                    console.log('added label for ' + text);
                }
            }
        });
    }

    window.plugin.playerTrackerNames.setup = function() {
        if (window.plugin.playerTracker === undefined) {
            console.log("This plugin requires player tracker");
            return;
        }
        addHook('publicChatDataAvailable', window.plugin.playerTrackerNames.setupHook);
        cssString = '.leaflet-label{background:#ebebeb;background:rgba(235,235,235,.81);background-clip:padding-box;border-color:#777;border-color:rgba(0,0,0,.25);border-radius:4px;border-style:solid;border-width:4px;color:#111;display:block;font:12px/20px "Helvetica Neue",Arial,Helvetica,sans-serif;font-weight:700;padding:1px 6px;position:absolute;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none;white-space:nowrap;z-index:6}.leaflet-label.leaflet-clickable{cursor:pointer}.leaflet-label:after,.leaflet-label:before{border-top:6px solid transparent;border-bottom:6px solid transparent;content:none;position:absolute;top:5px}.leaflet-label:before{border-right:6px solid #000;border-right-color:inherit;left:-10px}.leaflet-label:after{border-left:6px solid #000;border-left-color:inherit;right:-10px}.leaflet-label-left:after,.leaflet-label-right:before{content:""}';
        $("<style>").prop("type", "text/css").html(cssString).appendTo("head");
    };

    var setup = window.plugin.playerTrackerNames.setup;

    // PLUGIN END //////////////////////////////////////////////////////////


    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
};
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);