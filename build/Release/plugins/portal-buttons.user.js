// ==UserScript==
// @id             iitc-plugin-portal-buttons
// @name           IITC plugin: Portal Buttons
// @category       圖層
// @version        0.1.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/portal-buttons.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/portal-buttons.user.js
// @description    Adds some buttons to show/hide portals on the map
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

//Made from Jnmllr.


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'Release';
plugin_info.dateTimeVersion = '20161010.123144';
plugin_info.pluginId = 'portal-buttons';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.PortalButtons = function() {};

window.plugin.PortalButtons.loadExternals = function() {
  console.log('Loading EasyButton JS now');
  (function(){

// This is for grouping buttons into a bar
// takes an array of `L.easyButton`s and
// then the usual `.addTo(map)`
L.Control.EasyBar = L.Control.extend({

  options: {
    position:       'topleft',  // part of leaflet's defaults
    id:             null,       // an id to tag the Bar with
    leafletClasses: true        // use leaflet classes?
  },


  initialize: function(buttons, options){

    if(options){
      L.Util.setOptions( this, options );
    }

    this._buildContainer();
    this._buttons = [];

    for(var i = 0; i < buttons.length; i++){
      buttons[i]._bar = this;
      buttons[i]._container = buttons[i].button;
      this._buttons.push(buttons[i]);
      this.container.appendChild(buttons[i].button);
    }

  },


  _buildContainer: function(){
    this._container = this.container = L.DomUtil.create('div', '');
    this.options.leafletClasses && L.DomUtil.addClass(this.container, 'leaflet-bar easy-button-container leaflet-control');
    this.options.id && (this.container.id = this.options.id);
  },


  enable: function(){
    L.DomUtil.addClass(this.container, 'enabled');
    L.DomUtil.removeClass(this.container, 'disabled');
    this.container.setAttribute('aria-hidden', 'false');
    return this;
  },


  disable: function(){
    L.DomUtil.addClass(this.container, 'disabled');
    L.DomUtil.removeClass(this.container, 'enabled');
    this.container.setAttribute('aria-hidden', 'true');
    return this;
  },


  onAdd: function () {
    return this.container;
  },

  addTo: function (map) {
    this._map = map;

    for(var i = 0; i < this._buttons.length; i++){
      this._buttons[i]._map = map;
    }

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
  }

});

L.easyBar = function(){
  var args = [L.Control.EasyBar];
  for(var i = 0; i < arguments.length; i++){
    args.push( arguments[i] );
  }
  return new (Function.prototype.bind.apply(L.Control.EasyBar, args));
};

// L.EasyButton is the actual buttons
// can be called without being grouped into a bar
L.Control.EasyButton = L.Control.extend({

  options: {
    position:  'topleft',       // part of leaflet's defaults

    id:        null,            // an id to tag the button with

    type:      'replace',       // [(replace|animate)]
                                // replace swaps out elements
                                // animate changes classes with all elements inserted

    states:    [],              // state names look like this
                                // {
                                //   stateName: 'untracked',
                                //   onClick: function(){ handle_nav_manually(); };
                                //   title: 'click to make inactive',
                                //   icon: 'fa-circle',    // wrapped with <a>
                                // }

    leafletClasses:   true      // use leaflet styles for the button
  },



  initialize: function(icon, onClick, title, id){

    // clear the states manually
    this.options.states = [];

    // add id to options
    if(id != null){
      this.options.id = id;
    }

    // storage between state functions
    this.storage = {};

    // is the last item an object?
    if( typeof arguments[arguments.length-1] === 'object' ){

      // if so, it should be the options
      L.Util.setOptions( this, arguments[arguments.length-1] );
    }

    // if there aren't any states in options
    // use the early params
    if( this.options.states.length === 0 &&
        typeof icon  === 'string' &&
        typeof onClick === 'function'){

      // turn the options object into a state
      this.options.states.push({
        icon: icon,
        onClick: onClick,
        title: typeof title === 'string' ? title : ''
      });
    }

    // curate and move user's states into
    // the _states for internal use
    this._states = [];

    for(var i = 0; i < this.options.states.length; i++){
      this._states.push( new State(this.options.states[i], this) );
    }

    this._buildButton();

    this._activateState(this._states[0]);

  },

  _buildButton: function(){

    this.button = L.DomUtil.create('a', '');

    if (this.options.id ){
      this.button.id = this.options.id;
    }

    if (this.options.leafletClasses){
      L.DomUtil.addClass(this.button, 'leaflet-bar');
    }

    // don't let double clicks get to the map
    L.DomEvent.addListener(this.button, 'dblclick', L.DomEvent.stop);

    // take care of normal clicks
    L.DomEvent.addListener(this.button,'click', function(e){
      L.DomEvent.stop(e);
      this._currentState.onClick(this, this._map ? this._map : null );
      this._map.getContainer().focus();
    }, this);

    // prep the contents of the control
    if(this.options.type == 'replace'){
      this.button.appendChild(this._currentState.icon);
    } else {
      for(var i=0;i<this._states.length;i++){
        this.button.appendChild(this._states[i].icon);
      }
    }
  },


  _currentState: {
    // placeholder content
    stateName: 'unnamed',
    icon: (function(){ return document.createElement('span'); })()
  },



  _states: null, // populated on init



  state: function(newState){

    // activate by name
    if(typeof newState == 'string'){

      this._activateStateNamed(newState);

    // activate by index
    } else if (typeof newState == 'number'){

      this._activateState(this._states[newState]);
    }

    return this;
  },


  _activateStateNamed: function(stateName){
    for(var i = 0; i < this._states.length; i++){
      if( this._states[i].stateName == stateName ){
        this._activateState( this._states[i] );
      }
    }
  },

  _activateState: function(newState){

    if( newState === this._currentState ){

      // don't touch the dom if it'll just be the same after
      return;

    } else {

      // swap out elements... if you're into that kind of thing
      if( this.options.type == 'replace' ){
        this.button.appendChild(newState.icon);
        this.button.removeChild(this._currentState.icon);
      }

      if( newState.title ){
        this.button.title = newState.title;
      } else {
        this.button.removeAttribute('title');
      }

      // update classes for animations
      for(var i=0;i<this._states.length;i++){
        L.DomUtil.removeClass(this._states[i].icon, this._currentState.stateName + '-active');
        L.DomUtil.addClass(this._states[i].icon, newState.stateName + '-active');
      }

      // update classes for animations
      L.DomUtil.removeClass(this.button, this._currentState.stateName + '-active');
      L.DomUtil.addClass(this.button, newState.stateName + '-active');

      // update the record
      this._currentState = newState;

    }
  },



  enable: function(){
    L.DomUtil.addClass(this.button, 'enabled');
    L.DomUtil.removeClass(this.button, 'disabled');
    this.button.setAttribute('aria-hidden', 'false');
    return this;
  },



  disable: function(){
    L.DomUtil.addClass(this.button, 'disabled');
    L.DomUtil.removeClass(this.button, 'enabled');
    this.button.setAttribute('aria-hidden', 'true');
    return this;
  },


  removeFrom: function (map) {

    this._container.parentNode.removeChild(this._container);
    this._map = null;

    return this;
  },

  onAdd: function(){
    var containerObj = L.easyBar([this], {
      position: this.options.position,
      leafletClasses: this.options.leafletClasses
    });
    this._container = containerObj.container;
    return this._container;
  }


});

L.easyButton = function(/* args will pass automatically */){
  var args = Array.prototype.concat.apply([L.Control.EasyButton],arguments);
  return new (Function.prototype.bind.apply(L.Control.EasyButton, args));
};

/*************************
 *
 * util functions
 *
 *************************/

// constructor for states so only curated
// states end up getting called
function State(template, easyButton){

  this.title = template.title;
  this.stateName = template.stateName ? template.stateName : 'unnamed-state';

  // build the wrapper
  this.icon = L.DomUtil.create('span', '');

  L.DomUtil.addClass(this.icon, 'button-state state-' + this.stateName.replace(/(^\s*|\s*$)/g,''));
  this.icon.innerHTML = buildIcon(template.icon);
  this.onClick = L.Util.bind(template.onClick?template.onClick:function(){}, easyButton);
}

function buildIcon(ambiguousIconString) {

  var tmpIcon;

  // does this look like html? (i.e. not a class)
  if( ambiguousIconString.match(/[&;=<>"']/) ){

    // if so, the user should have put in html
    // so move forward as such
    tmpIcon = ambiguousIconString;

  // then it wasn't html, so
  // it's a class list, figure out what kind
  } else {
      ambiguousIconString = ambiguousIconString.replace(/(^\s*|\s*$)/g,'');
      tmpIcon = L.DomUtil.create('span', '');

      if( ambiguousIconString.indexOf('fa-') === 0 ){
        L.DomUtil.addClass(tmpIcon, 'fa '  + ambiguousIconString)
      } else if ( ambiguousIconString.indexOf('glyphicon-') === 0 ) {
        L.DomUtil.addClass(tmpIcon, 'glyphicon ' + ambiguousIconString)
      } else {
        L.DomUtil.addClass(tmpIcon, /*rollwithit*/ ambiguousIconString)
      }

      // make this a string so that it's easy to set innerHTML below
      tmpIcon = tmpIcon.outerHTML;
  }

  return tmpIcon;
}

})();

  console.log('done loading EasyButton JS');

  window.plugin.PortalButtons.boot();

//  $('head').append('<style>.leaflet-bar button,\n.leaflet-bar button:hover {\n  background-color: #fff;\n  border: none;\n  border-bottom: 1px solid #ccc;\n  width: 26px;\n  height: 26px;\n  line-height: 26px;\n  display: block;\n  text-align: center;\n  text-decoration: none;\n  color: black;\n  }\n  \n  .leaflet-bar button {\n  background-position: 50% 50%;\n  background-repeat: no-repeat;\n  overflow: hidden;\n  display: block;\n  }\n  \n  .leaflet-bar button:hover {\n  background-color: #f4f4f4;\n  }\n  \n  .leaflet-bar button:first-of-type {\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n  }\n  \n  .leaflet-bar button:last-of-type {\n  border-bottom-left-radius: 4px;\n  border-bottom-right-radius: 4px;\n  border-bottom: none;\n  }\n  \n  .leaflet-bar.disabled,\n  .leaflet-bar button.disabled {\n  cursor: default;\n  pointer-events: none;\n  opacity: .4;\n  }\n  \n  .easy-button-button .button-state{\n  display: block;\n  width: 100%;\n  height: 100%;\n  position: relative;\n  }\n  \n  .easy-button-button{\n  padding: 1px;\n  }\n  \n  \n  .leaflet-touch .leaflet-bar button {\n  width: 30px;\n  height: 30px;\n  line-height: 30px;\n  }\n  </style>');
  $('head').append('<style>/* required styles */\n\n.leaflet-map-pane,\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow,\n.leaflet-tile-pane,\n.leaflet-tile-container,\n.leaflet-overlay-pane,\n.leaflet-shadow-pane,\n.leaflet-marker-pane,\n.leaflet-popup-pane,\n.leaflet-overlay-pane svg,\n.leaflet-zoom-box,\n.leaflet-image-layer,\n.leaflet-layer {\n	position: absolute;\n	left: 0;\n	top: 0;\n	}\n.leaflet-container {\n	overflow: hidden;\n	-ms-touch-action: none;\n	touch-action: none;\n	}\n.leaflet-tile,\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	-webkit-user-select: none;\n	   -moz-user-select: none;\n	        user-select: none;\n	-webkit-user-drag: none;\n	}\n.leaflet-marker-icon,\n.leaflet-marker-shadow {\n	display: block;\n	}\n/* map is broken in FF if you have max-width: 100% on tiles */\n.leaflet-container img {\n	max-width: none !important;\n	}\n/* stupid Android 2 doesn\'t understand "max-width: none" properly */\n.leaflet-container img.leaflet-image-layer {\n	max-width: 15000px !important;\n	}\n.leaflet-tile {\n	filter: inherit;\n	visibility: hidden;\n	}\n.leaflet-tile-loaded {\n	visibility: inherit;\n	}\n.leaflet-zoom-box {\n	width: 0;\n	height: 0;\n	}\n/* workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=888319 */\n.leaflet-overlay-pane svg {\n	-moz-user-select: none;\n	}\n\n.leaflet-tile-pane    { z-index: 2; }\n.leaflet-objects-pane { z-index: 3; }\n.leaflet-overlay-pane { z-index: 4; }\n.leaflet-shadow-pane  { z-index: 5; }\n.leaflet-marker-pane  { z-index: 6; }\n.leaflet-popup-pane   { z-index: 7; }\n\n.leaflet-vml-shape {\n	width: 1px;\n	height: 1px;\n	}\n.lvml {\n	behavior: url(#default#VML);\n	display: inline-block;\n	position: absolute;\n	}\n\n\n/* control positioning */\n\n.leaflet-control {\n	position: relative;\n	z-index: 7;\n	pointer-events: auto;\n	}\n.leaflet-top,\n.leaflet-bottom {\n	position: absolute;\n	z-index: 1000;\n	pointer-events: none;\n	}\n.leaflet-top {\n	top: 0;\n	}\n.leaflet-right {\n	right: 0;\n	}\n.leaflet-bottom {\n	bottom: 0;\n	}\n.leaflet-left {\n	left: 0;\n	}\n.leaflet-control {\n	float: left;\n	clear: both;\n	}\n.leaflet-right .leaflet-control {\n	float: right;\n	}\n.leaflet-top .leaflet-control {\n	margin-top: 10px;\n	}\n.leaflet-bottom .leaflet-control {\n	margin-bottom: 10px;\n	}\n.leaflet-left .leaflet-control {\n	margin-left: 10px;\n	}\n.leaflet-right .leaflet-control {\n	margin-right: 10px;\n	}\n\n\n/* zoom and fade animations */\n\n.leaflet-fade-anim .leaflet-tile,\n.leaflet-fade-anim .leaflet-popup {\n	opacity: 0;\n	-webkit-transition: opacity 0.2s linear;\n	   -moz-transition: opacity 0.2s linear;\n	     -o-transition: opacity 0.2s linear;\n	        transition: opacity 0.2s linear;\n	}\n.leaflet-fade-anim .leaflet-tile-loaded,\n.leaflet-fade-anim .leaflet-map-pane .leaflet-popup {\n	opacity: 1;\n	}\n\n.leaflet-zoom-anim .leaflet-zoom-animated {\n	-webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1);\n	   -moz-transition:    -moz-transform 0.25s cubic-bezier(0,0,0.25,1);\n	     -o-transition:      -o-transform 0.25s cubic-bezier(0,0,0.25,1);\n	        transition:         transform 0.25s cubic-bezier(0,0,0.25,1);\n	}\n.leaflet-zoom-anim .leaflet-tile,\n.leaflet-pan-anim .leaflet-tile,\n.leaflet-touching .leaflet-zoom-animated {\n	-webkit-transition: none;\n	   -moz-transition: none;\n	     -o-transition: none;\n	        transition: none;\n	}\n\n.leaflet-zoom-anim .leaflet-zoom-hide {\n	visibility: hidden;\n	}\n\n\n/* cursors */\n\n.leaflet-clickable {\n	cursor: pointer;\n	}\n.leaflet-container {\n	cursor: -webkit-grab;\n	cursor:    -moz-grab;\n	}\n.leaflet-popup-pane,\n.leaflet-control {\n	cursor: auto;\n	}\n.leaflet-dragging .leaflet-container,\n.leaflet-dragging .leaflet-clickable {\n	cursor: move;\n	cursor: -webkit-grabbing;\n	cursor:    -moz-grabbing;\n	}\n\n\n/* visual tweaks */\n\n.leaflet-container {\n	background: #ddd;\n	outline: 0;\n	}\n.leaflet-container a {\n	color: #0078A8;\n	}\n.leaflet-container a.leaflet-active {\n	outline: 2px solid orange;\n	}\n.leaflet-zoom-box {\n	border: 2px dotted #38f;\n	background: rgba(255,255,255,0.5);\n	}\n\n\n/* general typography */\n.leaflet-container {\n	font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;\n	}\n\n\n/* general toolbar styles */\n\n.leaflet-bar {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.65);\n	border-radius: 0px;\n	}\n.leaflet-bar a,\n.leaflet-bar a:hover {\n	background-color: rgba(8, 48, 78, 0.7);\n	border: 1px solid #00FFFF;\n	width: 26px;\n	height: 26px;\n	line-height: 26px;\n	display: block;\n	text-align: center;\n	text-decoration: none;\n	color: white;\n    border-bottom: none;\n	}\n.leaflet-bar a,\n.leaflet-control-layers-toggle {\n	background-position: 50% 50%;\n	background-repeat: no-repeat;\n	display: block;\n	}\n.leaflet-bar a:hover {\n	/*background-color: #f4f4f4;*/\n	}\n.leaflet-bar a:first-child {\n	border-top-left-radius: 0px;\n	border-top-right-radius: 0px;\n	}\n.leaflet-bar a:last-child {\n	border-bottom-left-radius: 0px;\n	border-bottom-right-radius: 0px;\n    border-bottom: 1px solid #00FFFF;\n	}\n.leaflet-bar a.leaflet-disabled {\n	cursor: default;\n	background-color: rgba(8, 48, 78, 0.7);\n	color: rgba(4, 24, 39, 0.7);\n	}\n\n.leaflet-touch .leaflet-bar a {\n	width: 30px;\n	height: 30px;\n	line-height: 30px;\n	}\n\n\n/* zoom control */\n\n.leaflet-control-zoom-in,\n.leaflet-control-zoom-out {\n	font: bold 18px \'Lucida Console\', Monaco, monospace;\n	text-indent: 1px;\n	}\n.leaflet-control-zoom-out {\n	font-size: 20px;\n	}\n\n.leaflet-touch .leaflet-control-zoom-in {\n	font-size: 22px;\n	}\n.leaflet-touch .leaflet-control-zoom-out {\n	font-size: 24px;\n	}\n\n\n/* layers control */\n\n.leaflet-control-layers {\n	box-shadow: 0 1px 5px rgba(0,0,0,0.4);\n	background: rgba(8, 48, 78, 0.7);\n    border: 1px solid #00FFFF;\n	border-radius: 0px;\n	}\n.leaflet-control-layers-toggle {\n	background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADdYAAA3WAZBveZwAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAADRElEQVRIS7WUX0gUURTGV4hedDP68xBUEBESFFEQEQUS1IOEQURET6ERJRERpiKaKZulRVHm9hCYRBgUkUEPFhTrKhgZii25ZBEYFFIqYaVY4X593+yddXaazC078LGXc7/zOzP3nlnfX0Sa0f+LA/eRVdKLcklrk565WFOP9GOd2Fc9iOC5sbi0Vk57xvZvcfABsk/0o8Zu4Jb25DH21CPvLhYXRVBY+9W7gVPyyKsaU/7nWFiF2Uc7sDvwEXUe0GvVw3gpae3aC6pGtWIYnHfwCNaVvULADZDOjCDEexknDJLWynl5xRDLYCcjtxELirpxiIVX3EU8lluEDtgN3NKePO46scQU22py+DG2V73DebeRxVd5RD2ETbjhHpqQVzVujtjq4fMH0FESSTbwaVr4pF88gFNKNap1ssRWD5//+OAOf/GnvrVB3OFTNVH9XpBUJIZYYoqtHtbxbQxi7vo6hJecRoxT41mcisQQS0yxrSackOzSPkQp8EvHykvAtkag7I03ZCqpRrViiCWm2OrhY+d2TseQSVri/xgWBeK/VQPeUKfkcdY4WWKrh31HkT1NaCuNImYbeInIuQ5kXQQKu70bSNqTR17VJJqQJabYiTviq2auOIvQ8guY0PkmzNSRMLCsBth1Azj5drKB1sppTx5njRjMx/gA7byneVYTJjfRGNEmv2arMKfB9XQU/8esoyl4FJfWyjk91imwVgyxxCS7j9qq/7Y2flAflDQb2HvTnHdLMojnDU6RJa2de/KqRrVi2Dyyh5lvs+5oTtHQiy0NCNNgHZ0xYEM9sPpy0gT9Iu3JI69q7HqyYry3dt5RT+KO2CidqvVXjEY4NVHbLGmKODXWk/KCJ5twrZz25EmqacHrjIqxLjHFtpo4g8lV7B7mGevtPtuFOopcXrygempJa+Wcx8T1KAeglYyQWAb720ijMZ/G6M4mdNgQSUOgj1HS2rnHt3tqRjlfjDhqGuGv/DafzRoyKr8/4wT1O6FOFTzE+8xTeCKvakx56sEn3ExIFy88xKMZtxtw/YPT18q36JTH2P8t+AnMIqzYXz7Sm3cbXfubEeHgPFdOe8Y2c8FJWkr4Pb5hs9YmPY3w+X4Cv22EMdzAozYAAAAASUVORK5CYII=);\n	width: 36px;\n	height: 36px;\n	}\n.leaflet-retina .leaflet-control-layers-toggle {\n	background-image: url(data:image/png;base64,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);\n	background-size: 26px 26px;\n	}\n.leaflet-touch .leaflet-control-layers-toggle {\n	width: 44px;\n	height: 44px;\n	}\n.leaflet-control-layers .leaflet-control-layers-list,\n.leaflet-control-layers-expanded .leaflet-control-layers-toggle {\n	display: none;\n	}\n.leaflet-control-layers-expanded .leaflet-control-layers-list {\n	display: block;\n	position: relative;\n	}\n.leaflet-control-layers-expanded {\n	padding: 6px 10px 6px 6px;\n	color: #00FFFF;\n    background: rgba(8, 48, 78, 0.7);\n	}\n.leaflet-control-layers-selector {\n	margin-top: 2px;\n	position: relative;\n	top: 1px;\n	}\n.leaflet-control-layers label {\n	display: block;\n	}\n.leaflet-control-layers-separator {\n	height: 0;\n	border-top: 1px solid #ddd;\n	margin: 5px -10px 5px -6px;\n	}\n\n\n/* attribution and scale controls */\n\n.leaflet-container .leaflet-control-attribution {\n	background: #fff;\n	background: rgba(255, 255, 255, 0.7);\n	margin: 0;\n	}\n.leaflet-control-attribution,\n.leaflet-control-scale-line {\n	padding: 0 5px;\n	color: #333;\n	}\n.leaflet-control-attribution a {\n	text-decoration: none;\n	}\n.leaflet-control-attribution a:hover {\n	text-decoration: underline;\n	}\n.leaflet-container .leaflet-control-attribution,\n.leaflet-container .leaflet-control-scale {\n	font-size: 11px;\n	}\n.leaflet-left .leaflet-control-scale {\n	margin-left: 5px;\n	}\n.leaflet-bottom .leaflet-control-scale {\n	margin-bottom: 5px;\n	}\n.leaflet-control-scale-line {\n	border: 2px solid #777;\n	border-top: none;\n	line-height: 1.1;\n	padding: 2px 5px 1px;\n	font-size: 11px;\n	white-space: nowrap;\n	overflow: hidden;\n	-moz-box-sizing: content-box;\n	     box-sizing: content-box;\n\n	background: #fff;\n	background: rgba(255, 255, 255, 0.5);\n	}\n.leaflet-control-scale-line:not(:first-child) {\n	border-top: 2px solid #777;\n	border-bottom: none;\n	margin-top: -2px;\n	}\n.leaflet-control-scale-line:not(:first-child):not(:last-child) {\n	border-bottom: 2px solid #777;\n	}\n\n.leaflet-touch .leaflet-control-attribution,\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	box-shadow: none;\n	}\n.leaflet-touch .leaflet-control-layers,\n.leaflet-touch .leaflet-bar {\n	border: 2px solid rgba(0,0,0,0.2);\n	background-clip: padding-box;\n	}\n\n\n/* popup */\n\n.leaflet-popup {\n	position: absolute;\n	text-align: center;\n	}\n.leaflet-popup-content-wrapper {\n	padding: 1px;\n	text-align: left;\n	border-radius: 12px;\n	}\n.leaflet-popup-content {\n	margin: 13px 19px;\n	line-height: 1.4;\n	}\n.leaflet-popup-content p {\n	margin: 18px 0;\n	}\n.leaflet-popup-tip-container {\n	margin: 0 auto;\n	width: 40px;\n	height: 20px;\n	position: relative;\n	overflow: hidden;\n	}\n.leaflet-popup-tip {\n	width: 17px;\n	height: 17px;\n	padding: 1px;\n\n	margin: -10px auto 0;\n\n	-webkit-transform: rotate(45deg);\n	   -moz-transform: rotate(45deg);\n	    -ms-transform: rotate(45deg);\n	     -o-transform: rotate(45deg);\n	        transform: rotate(45deg);\n	}\n.leaflet-popup-content-wrapper,\n.leaflet-popup-tip {\n	background: white;\n\n	box-shadow: 0 3px 14px rgba(0,0,0,0.4);\n	}\n.leaflet-container a.leaflet-popup-close-button {\n	position: absolute;\n	top: 0;\n	right: 0;\n	padding: 4px 4px 0 0;\n	text-align: center;\n	width: 18px;\n	height: 14px;\n	font: 16px/14px Tahoma, Verdana, sans-serif;\n	color: #c3c3c3;\n	text-decoration: none;\n	font-weight: bold;\n	background: transparent;\n	}\n.leaflet-container a.leaflet-popup-close-button:hover {\n	color: #999;\n	}\n.leaflet-popup-scrolled {\n	overflow: auto;\n	border-bottom: 1px solid #ddd;\n	border-top: 1px solid #ddd;\n	}\n\n.leaflet-oldie .leaflet-popup-content-wrapper {\n	zoom: 1;\n	}\n.leaflet-oldie .leaflet-popup-tip {\n	width: 24px;\n	margin: 0 auto;\n\n	-ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";\n	filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);\n	}\n.leaflet-oldie .leaflet-popup-tip-container {\n	margin-top: -1px;\n	}\n\n.leaflet-oldie .leaflet-control-zoom,\n.leaflet-oldie .leaflet-control-layers,\n.leaflet-oldie .leaflet-popup-content-wrapper,\n.leaflet-oldie .leaflet-popup-tip {\n	border: 1px solid #999;\n	}\n\n\n/* div icon */\n\n.leaflet-div-icon {\n	background: #fff;\n	border: 1px solid #666;\n	}\n</style>');
};

window.plugin.PortalButtons.boot = function() {

    var showLayer = function (name, show) {

        for (i in window.layerChooser._layers) {

            // layer has .layer, .name and .overlay
            var layer = window.layerChooser._layers[i];
            
            if (layer.name === name) {
                if (show) {
                    if (!window.map.hasLayer(layer.layer)) {
                        window.map.addLayer(layer.layer);
                    }
                }
                else {
                    if (window.map.hasLayer(layer.layer)) {
                        window.map.removeLayer(layer.layer);
                    }     
                }           
            }
        }
    }

    var showNone = function () {
        showLayer("顯示更多能量塔", false);
        showLayer("等級1能量塔",   false);
        showLayer("等級2能量塔",   false);
        showLayer("等級3能量塔",   false);
        showLayer("等級4能量塔",   false);
        showLayer("等級5能量塔",   false);
        showLayer("等級6能量塔",   false);
        showLayer("等級7能量塔",   false);
        showLayer("等級8能量塔",   false);
    };

    var showAll = function () {
        showLayer("顯示更多能量塔", true);
        showLayer("等級1能量塔",   true);
        showLayer("等級2能量塔",   true);
        showLayer("等級3能量塔",   true);
        showLayer("等級4能量塔",   true);
        showLayer("等級5能量塔",   true);
        showLayer("等級6能量塔",   true);
        showLayer("等級7能量塔",   true);
        showLayer("等級8能量塔",   true);
    };

    var show78 = function () {
        showLayer("顯示更多能量塔", false);
        showLayer("等級1能量塔",   false);
        showLayer("等級2能量塔",   false);
        showLayer("等級3能量塔",   false);
        showLayer("等級4能量塔",   false);
        showLayer("等級5能量塔",   false);
        showLayer("等級6能量塔",   false);
        showLayer("等級7能量塔",   true);
        showLayer("等級8能量塔",   true);
    };

    var show8 = function () {
        showLayer("顯示更多能量塔", false);
        showLayer("等級1能量塔",   false);
        showLayer("等級2能量塔",   false);
        showLayer("等級3能量塔",   false);
        showLayer("等級4能量塔",   false);
        showLayer("等級5能量塔",   false);
        showLayer("等級6能量塔",   false);
        showLayer("等級7能量塔",   false);
        showLayer("等級8能量塔",   true);
    };

    var optionsNone = {
        id: 'portal-buttons-none',
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states:[{
            stateName: 'default',
            onClick: showNone,
            title: '隱藏所有能量塔',
            icon: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfgBBILJyuvLCwyAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAQFJREFUSEu10qFOw1AUh/EhQG0YNHZLNoniDeaW4EiQk4g9AA+wZOAxON4BRyYmcHgEKMyWLFlCssC2lO8mt83Z5d/WHMQvab9zzEnbyLLsX8noSUZPMnqS0ZOMnmQ0WvjEvWm5McIs7KSzgoyJS+xwZlob3wgzu/uHjMIzXnAQ358wjc+VZBS6+MEQA2zQg9rdI2OJCRZ4x11stWQs0cQSX6j8sJaMJc6xjfqx1ZKxxAwPeMQr8g9eSUbhAmucooNwxRXU7h4ZE4d4w61p4YoPHJkmyZi4xgonpuVXjEyTZDSOMceNablwRfhtw046K8joSUZPMnqS0ZOMnmT0kzV+AUcz27Jfhd4HAAAAAElFTkSuQmCC">'
        }]
    };

    var optionsAll = {
        id: 'portal-buttons-all',
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states:[{
            stateName: 'default',
            onClick: showAll,
            title: '顯示所有能量塔',
            icon: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfgBBILJwVz+iH9AAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAPFJREFUSEu108HKwUEUBfB/WbL0CqztlRewVPaysOA92MtSeQEL3gCRR1DWvAArFuOcmqnpdv8x03XqV+Z06/R9UTjn/kotLamlJbW0pJaW1DIBM4Gy99eBC1xFF2OyB9rw9jq+k5jsgSXsYA8r30lM1kAVHjD2nlADecdkDQzgBXWPn4cg75isgQNso/cGjtE7YJIHGsD0IXQ9FkgT4lsmeWAKZZlBfMskDVTgBgtoCXO4A2/CPZM00AVG/iuIHcOb0DFJA2s4iS52Bt6EN/PzQPg6jqJO4m8ifH35ZpL+AnNqaUktLamlJbW0pJZ2XPEBb38Ec2mO0u0AAAAASUVORK5CYII=">'
        }]
    };

    var options78 = {
        id: 'portal-buttons-78',  
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states:[{
            stateName: 'default',
            onClick: show78,
            title: '顯示L7和L8能量塔',
            icon: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfgBBILKBHuuOlPAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAORJREFUSEu10TEOAUEUxnEiEgqFXqdVaCWOoFApHECvdgAXcAid3g0cQK9RShQ6kfF9xW6el29HbJ6X/Ar/mTVrNFJKfyVjJBkjyRhJxkgyRlIxN2p/looz4QhnUPuzZHR6cIeVaVYHmq6VZHTWcIOuaRZnBGrt6wEtuMDWNI9T+4AFPGFgmsepfcAJ9q7xznMzhnK/fdCbAmcCtvMP5RsXOHMoPvMFyv32Qe8A/AVqzeLwi9Va5QFDeMHStCqcnw/YwRXaplXhnX9ci6ViHx6wMa02GSPJGEnGSDJGkjGSjHFS4w3IqeGSL/ljNwAAAABJRU5ErkJggg==">'
        }]
    };

    var options8 = {
        id: 'portal-buttons-8',
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states:[{
            stateName: 'default',
            onClick: show8,
            title: '顯示L8能量塔',
            icon: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAHdElNRQfgBBILKC5Y3sRyAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAPhJREFUSEu107EqhWEcx/GjU6wuQC7BNTAbLXYDA1Eog3ISnQwms3IFRpvNNYgQGUwUEumk1/et95Tnf76Z/uetT2/Pt1/P9rSqqhoqjZk0ZtKYSWMmjZk0BmPYwx2+mv8+6m77gsbgBM9YxDSW8IJj2L6gMfjERmibqPvfpjQG9zgM7QjXoSmNwQJ62MYEOvjGHGxf0Ci20P9+MAvbDdAYTOEVZ5jHLR4wCdsXNAbnuEC7OY/jEqfN+V8agw+shLaG99CUxuARu6Ed4Ck0pTHo4g3LmME67G0ojcEodnCD+uIrrGIEti9ozKQxk8ZMGjNpzKQxT9X6BQA14wkbGXL5AAAAAElFTkSuQmCC">'
        }]
    };

    var buttons = [L.easyButton(optionsAll), L.easyButton(options78), L.easyButton(options8), L.easyButton(optionsNone)];

    L.easyBar(buttons).addTo(window.map);
};

var setup = window.plugin.PortalButtons.loadExternals;

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

