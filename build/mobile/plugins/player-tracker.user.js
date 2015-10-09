// ==UserScript==
// @id             iitc-plugin-player-tracker@breunigs
// @name           IITC Plugin: Player tracker
// @category       Layer
// @version        0.11.1.20151009.125525
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/mobile/plugins/player-tracker.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/mobile/plugins/player-tracker.user.js
// @description    [mobile-2015-10-09-125525] Draw trails for the path a user took onto the map based on status messages in COMMs. Uses up to three hours of data. Does not request chat data on its own, even if that would be useful.
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
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20151009.125525';
plugin_info.pluginId = 'player-tracker';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////
//iF: change 3 hour to 10 minute, no need to track such a long time.
window.PLAYER_TRACKER_MAX_TIME = 30*60*1000; // in milliseconds
window.PLAYER_TRACKER_MIN_ZOOM = 9;
window.PLAYER_TRACKER_MIN_OPACITY = 0.3;
window.PLAYER_TRACKER_LINE_COLOUR = '#FF00FD';


// use own namespace for plugin
window.plugin.playerTracker = function() {};

window.plugin.playerTracker.setup = function() {
  $('<style>').prop('type', 'text/css').html('.plugin-player-tracker-popup a {\n	color: inherit;\n	text-decoration: underline;\n	text-decoration-style: dashed;\n	-moz-text-decoration-style: dashed;\n	-webkit-text-decoration-style: dashed;\n}\n').appendTo('head');

  var iconEnlImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAD20lEQVR42u2WX0jTURTHr9NCZvmPkiQowh5KKKMH9SGhxHyJwoheBtkfg0gqCB/SokilshChl0CkLKKH6iEoK/fH/ablnOSfprVlTZ2ZSSzNPw2tpG/3nLmQ5Z/c9lDghcPGdrmfe8/5nu+9QiyMhbEw/qNRLhaJahEvHopVU2JZcCH3RJTQix0yjgqDOMGfeqFhWNCG3LVKpypKaUx5q3mlGY9VYt0S1sPAJyIhOBBKlUEYV9evRu94L850nkFMbQyETrhk5AUHRGnRCzdBfvz8geGJYVR+rER0bTTk7/eEVmRx3QKG1Ah4Ie1f2/Fh/APuf7oPlUHVI0GXJChFxjoJU/ufrimQHFsOVj5fCfOQGfHP4hFpikSoIfSBTN1VOXcbC2Xe8qWcy/x7Icc6jvHCa+rXIMGcgLL3ZdjavBWybkPyVKVybubfnYgmVYvNk3KtopPQrptHmnH3011satyE0JpQHLIdQt94H6yjVuy07vSIgUCzisG7c63YL3f2gBYPqQnBimcrsLFxI8fyuuWIMkXxaQh4ynEKaU1pXKfM1kwSw7WZIbR7KqBOFMmwhyvhSG9Jh3ZAy2nyBqnrfNd5Bu6y7kLV5yrc6r+F7rFuHO84DpVeNTdkqbL0QqI50XHZeRn93/rxcvQl550WLuwqRHlfOZxjTl70iP0IsqxZKHAUeOvSzGqbC6Jp09xQBpSvru8uFHcXI7EhkfNPqaNQK2okv0hG3rs8dLg7UOIswRLTEs//OrmCTuyd2dsmIWQhYYYwCy1M9dj3eh8vuNa8Fusb1uO04zTqvtQhzBgGSinVi74zRC8qWDCzKuqx2MBF14t8LiAVX+5uj3VPL9WmeqAah+2Hsdi4mIOK3jTSBMuwBakvUildN3mN+RgjC8Hjvm2qGhWfZnvrdu6VuLo41A/V44DtAB65HuH6x+t0kjvzg3ht3qM4LdXiovMibG4bDtoOcopy3+SiZaSFFUh95B/E2ztS1hFKBCr6KnDy7cnfQiB7oV4hN5BzHP67MtVK5toXQnavNqrdyZZkV4QxwsT9Rafwy5EJItPgC9ndthtJliQji4MuMFKV35Y/AyT7dTbOvTvXyb3huVPUgTwkpoVQE+Y78ickxMIWH+Br5Q8IuYDdbUdGS4any5+KLUGF0NWrDCq43X+bLYYvq4DveR/I6MQoesZ62E4mDVEz/9twDgmT3VPRJ72qNDivFZ9mNAwaEFsbC3570VUbtGeqNM1IJbL1SveV4ez2bFeILsQhIWeD+1yVEpU3XoG0+pJoU3Qhu3TAipru7UUdPTUCLvZ0KfONf2n8AiO1wK7yBRMCAAAAAElFTkSuQmCC';
  var iconEnlRetImage = 'data:image/png;base64,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';
  var iconResImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAADY0lEQVR42u2W2W+MURTA++LFixcvXvwHXoi2Yo89IoRIJDyJSCTSkM60WqqtWGotGmupfWktQ5doKW2q6ELtaq9a2miJ1hKMmJ9zvvv1my6mpoa3ucnJt9x7z++ec88590ZEhFu4hVu4hVvwbdB8elmSTO+gxZ7zZ+WL6BfpYvJgF0mRbnIi3b6n8myRZ4NIkfnnSL7138UXe5zHmifzVU9ASLSLqCg3a4Ym+CpHLoVRyzrKiEQYEg/DE7v2qci8migXG1RPQIisZqauOOsiNLfC+08dpbwWxiyHvGr5/ti1/2AJDHZToXoCQsTcGIE0Z5fD2UpIPAwpx/2ScAiWHTHS+X/pPTh5FQSgoNiAEDVVBykkPRdi90F+tV/K7sM6D+RWQcF1///FWXC0zA+JjGNLYHdJZ3vIzkJ42Qwld41ce2QgRTfNylWeNMKOc3DscjuIm+1BQ7bkwRXZh6mrYVgCjE+B5GMwzf6emAqX7sDW/E6W9AQyWiLmTKVxzYy1EB3nl+lpxhLtn7QCDpX+JUTfJ8jq9xabyNpVZGS3yO062HMBxiWbcSFBVEYnwcoc+P4Dq336CiuyJS+W+MeEBLHi3spqWO8xkI1njcvsbG8IGaIVQEuGbvSLJgOpeQZjjZtyBLQ/dEtcvjuy2lp9T802kFUnHCuXtOVWyHvSJv8Fon7XsnH/JVQ9+S1knirsEcT2vwPRiptRYIrljsKuELVCQDc6Q1RPdwVygQzyKqT4tintm/NMxT0uZaP8QUeISL0+NQg0j5wCKXoCu0sPLAnZtNPQ+gXO34K5GVAtrvrpA5+vC8TKdk8FfPNC0lHLhTdUT+BDy81A28fetFPw1WtKx5x0Ayqs6QjRWnZBFvL5myn3Ok/ni5sHBD5+Y+nbdnCpEvd+eP7WlPh52yDugLFQVzx7E1RIVa5vMgDdP+tIjmPaoHj6dH/OOyA8Gl0Ld5voultvNl6tUHfWvobHbyAm0wF4ggI4IBkokTNeJmYKyDtrAzwUpY0fTEV+9Q5u1ZnKbO2NZr1eIIIFOCC55kTFM8zOHa+e7defmg1W9+l+WHsg/Tqux4D29y8NBjurW7Ssrz4JU1YpwNes+aD9Qd23/tQ0Wswlg0y7IGbqZaHbKPorqyQgxCX9HZEL3D+x4F+1X+PiK9JY4fJ1AAAAAElFTkSuQmCC';
  var iconResRetImage = 'data:image/png;base64,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';

  plugin.playerTracker.iconEnl = L.Icon.Default.extend({options: {
    iconUrl: iconEnlImage,
    iconRetinaUrl: iconEnlRetImage
  }});
  plugin.playerTracker.iconRes = L.Icon.Default.extend({options: {
    iconUrl: iconResImage,
    iconRetinaUrl: iconResRetImage
  }});

  plugin.playerTracker.drawnTracesEnl = new L.LayerGroup();
  plugin.playerTracker.drawnTracesRes = new L.LayerGroup();
  // to avoid any favouritism, we'll put the player's own faction layer first
  if (PLAYER.team == 'RESISTANCE') {
    window.addLayerGroup('藍軍探員', plugin.playerTracker.drawnTracesRes, true);
    window.addLayerGroup('綠軍探員', plugin.playerTracker.drawnTracesEnl, true);
  } else {
    window.addLayerGroup('綠軍探員', plugin.playerTracker.drawnTracesEnl, true);
    window.addLayerGroup('藍軍探員', plugin.playerTracker.drawnTracesRes, true);
  }
  map.on('layeradd',function(obj) {
    if(obj.layer === plugin.playerTracker.drawnTracesEnl || obj.layer === plugin.playerTracker.drawnTracesRes) {
      obj.layer.eachLayer(function(marker) {
        if(marker._icon) window.setupTooltips($(marker._icon));
      });
    }
  });

  plugin.playerTracker.playerPopup = new L.Popup({offset: L.point([1,-34])});

  addHook('publicChatDataAvailable', window.plugin.playerTracker.handleData);

  window.map.on('zoomend', function() {
    window.plugin.playerTracker.zoomListener();
  });
  window.plugin.playerTracker.zoomListener();
  
  plugin.playerTracker.setupUserSearch();
}

window.plugin.playerTracker.stored = {};

plugin.playerTracker.onClickListener = function(event) {
  var marker = event.target;

  if (marker.options.desc) {
    plugin.playerTracker.playerPopup.setContent(marker.options.desc);
    plugin.playerTracker.playerPopup.setLatLng(marker.getLatLng());
    map.openPopup(plugin.playerTracker.playerPopup);
  }
};

// force close all open tooltips before markers are cleared
window.plugin.playerTracker.closeIconTooltips = function() {
  plugin.playerTracker.drawnTracesRes.eachLayer(function(layer) {
    if ($(layer._icon)) { $(layer._icon).tooltip('close');}
  });
  plugin.playerTracker.drawnTracesEnl.eachLayer(function(layer) {
    if ($(layer._icon)) { $(layer._icon).tooltip('close');}
  });
}

window.plugin.playerTracker.zoomListener = function() {
  var ctrl = $('.leaflet-control-layers-selector + span:contains("Player Tracker")').parent();
  if(window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) {
    if (!window.isTouchDevice()) plugin.playerTracker.closeIconTooltips();
    plugin.playerTracker.drawnTracesEnl.clearLayers();
    plugin.playerTracker.drawnTracesRes.clearLayers();
    ctrl.addClass('disabled').attr('title', '將地圖放大來顯示這個項目.');
    //note: zoomListener is also called at init time to set up things, so we only need to do this in here
    window.chat.backgroundChannelData('plugin.playerTracker', 'all', false);   //disable this plugin's interest in 'all' COMM
  } else {
    ctrl.removeClass('disabled').attr('title', '');
    //note: zoomListener is also called at init time to set up things, so we only need to do this in here
    window.chat.backgroundChannelData('plugin.playerTracker', 'all', true);    //enable this plugin's interest in 'all' COMM
  }
}

window.plugin.playerTracker.getLimit = function() {
 return new Date().getTime() - window.PLAYER_TRACKER_MAX_TIME;
}

window.plugin.playerTracker.discardOldData = function() {
  var limit = plugin.playerTracker.getLimit();
  $.each(plugin.playerTracker.stored, function(plrname, player) {
    var i;
    var ev = player.events;
    for(i = 0; i < ev.length; i++) {
      if(ev[i].time >= limit) break;
    }
    if(i === 0) return true;
    if(i === ev.length) return delete plugin.playerTracker.stored[plrname];
    plugin.playerTracker.stored[plrname].events.splice(0, i);
  });
}

window.plugin.playerTracker.eventHasLatLng = function(ev, lat, lng) {
  var hasLatLng = false;
  $.each(ev.latlngs, function(ind, ll) {
    if(ll[0] === lat && ll[1] === lng) {
      hasLatLng = true;
      return false;
    }
  });
  return hasLatLng;
}

window.plugin.playerTracker.processNewData = function(data) {
  var limit = plugin.playerTracker.getLimit();
  $.each(data.result, function(ind, json) {
    // skip old data
    if(json[1] < limit) return true;

    // find player and portal information
    var plrname, lat, lng, id=null, name, address;
    var skipThisMessage = false;
    $.each(json[2].plext.markup, function(ind, markup) {
      switch(markup[0]) {
      case 'TEXT':
        // Destroy link and field messages depend on where the link or
        // field was originally created. Therefore it’s not clear which
        // portal the player is at, so ignore it.
        if(markup[1].plain.indexOf('destroyed the Link') !== -1
          || markup[1].plain.indexOf('destroyed a Control Field') !== -1
          || markup[1].plain.indexOf('Your Link') !== -1) {
          skipThisMessage = true;
          return false;
        }
        break;
      case 'PLAYER':
        plrname = markup[1].plain;
        break;
      case 'PORTAL':
        // link messages are “player linked X to Y” and the player is at
        // X.
        lat = lat ? lat : markup[1].latE6/1E6;
        lng = lng ? lng : markup[1].lngE6/1E6;

        // no GUID in the data any more - but we need some unique string. use the latE6,lngE6
        id = markup[1].latE6+","+markup[1].lngE6;

        name = name ? name : markup[1].name;
        address = address ? address : markup[1].address;
        break;
      }
    });

    // skip unusable events
    if(!plrname || !lat || !lng || !id || skipThisMessage) return true;

    var newEvent = {
      latlngs: [[lat, lng]],
      ids: [id],
      time: json[1],
      name: name,
      address: address
    };

    var playerData = window.plugin.playerTracker.stored[plrname];

    // short-path if this is a new player
    if(!playerData || playerData.events.length === 0) {
      plugin.playerTracker.stored[plrname] = {
        nick: plrname,
        team: json[2].plext.team,
        events: [newEvent]
      };
      return true;
    }

    var evts = playerData.events;
    // there’s some data already. Need to find correct place to insert.
    var i;
    for(i = 0; i < evts.length; i++) {
      if(evts[i].time > json[1]) break;
    }

    var cmp = Math.max(i-1, 0);

    // so we have an event that happened at the same time. Most likely
    // this is multiple resos destroyed at the same time.
    if(evts[cmp].time === json[1]) {
      evts[cmp].latlngs.push([lat, lng]);
      evts[cmp].ids.push(id);
      plugin.playerTracker.stored[plrname].events = evts;
      return true;
    }

    // the time changed. Is the player still at the same location?

    // assume this is an older event at the same location. Then we need
    // to look at the next item in the event list. If this event is the
    // newest one, there may not be a newer event so check for that. If
    // it really is an older event at the same location, then skip it.
    if(evts[cmp+1] && plugin.playerTracker.eventHasLatLng(evts[cmp+1], lat, lng))
      return true;

    // if this event is newer, need to look at the previous one
    var sameLocation = plugin.playerTracker.eventHasLatLng(evts[cmp], lat, lng);

    // if it’s the same location, just update the timestamp. Otherwise
    // push as new event.
    if(sameLocation) {
      evts[cmp].time = json[1];
    } else {
      evts.splice(i, 0,  newEvent);
    }

    // update player data
    plugin.playerTracker.stored[plrname].events = evts;
  });
}

window.plugin.playerTracker.getLatLngFromEvent = function(ev) {
//TODO? add weight to certain events, or otherwise prefer them, to give better locations?
  var lats = 0;
  var lngs = 0;
  $.each(ev.latlngs, function(i, latlng) {
    lats += latlng[0];
    lngs += latlng[1];
  });

  return L.latLng(lats / ev.latlngs.length, lngs / ev.latlngs.length);
}

window.plugin.playerTracker.ago = function(time, now) {
  var s = (now-time) / 1000;
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var returnVal = m + '分鐘';
  if(h > 0) {
    returnVal = h + '小時' + returnVal;
  }
  return returnVal;
}

window.plugin.playerTracker.drawData = function() {
  var isTouchDev = window.isTouchDevice();

  var gllfe = plugin.playerTracker.getLatLngFromEvent;

  var polyLineByAgeEnl = [[], [], [], []];
  var polyLineByAgeRes = [[], [], [], []];

  var split = PLAYER_TRACKER_MAX_TIME / 4;
  var now = new Date().getTime();
  $.each(plugin.playerTracker.stored, function(plrname, playerData) {
    if(!playerData || playerData.events.length === 0) {
      console.warn('broken player data for plrname=' + plrname);
      return true;
    }

    // gather line data and put them in buckets so we can color them by
    // their age
    var playerLine = [];
    for(var i = 1; i < playerData.events.length; i++) {
      var p = playerData.events[i];
      var ageBucket = Math.min(parseInt((now - p.time) / split), 4-1);
      var line = [gllfe(p), gllfe(playerData.events[i-1])];

      if(playerData.team === 'RESISTANCE')
        polyLineByAgeRes[ageBucket].push(line);
      else
        polyLineByAgeEnl[ageBucket].push(line);
    }

    var evtsLength = playerData.events.length;
    var last = playerData.events[evtsLength-1];
    var ago = plugin.playerTracker.ago;

    // tooltip for marker - no HTML - and not shown on touchscreen devices
	//iF:Remove 0min
    var tooltip = (isTouchDev || ago(last.time, now)=='0分鐘') ? '' : (playerData.nick+', '+ago(last.time, now)+'前');

    // popup for marker
    var popup = $('<div>')
      .addClass('plugin-player-tracker-popup');
    $('<span>')
      .addClass('nickname ' + (playerData.team === 'RESISTANCE' ? 'res' : 'enl'))
      .css('font-weight', 'bold')
      .text(playerData.nick)
      .appendTo(popup);

    if(window.plugin.guessPlayerLevels !== undefined &&
       window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer !== undefined) {
      function getLevel(lvl) {
        return $('<span>')
          .css({
            padding: '4px',
            color: 'white',
            backgroundColor: COLORS_LVL[lvl],
          })
          .text(lvl);
      }

      var level = $('<span>')
        .css({'font-weight': 'bold', 'margin-left': '10px'})
        .appendTo(popup);

      var playerLevelDetails = window.plugin.guessPlayerLevels.fetchLevelDetailsByPlayer(plrname);
      level
        .text('最低等級 ')
        .append(getLevel(playerLevelDetails.min));
      if(playerLevelDetails.min != playerLevelDetails.guessed)
        level
          .append(document.createTextNode(', 預測等級: '))
          .append(getLevel(playerLevelDetails.guessed));
    }
    //iF: Hide 0min
    if(ago(last.time, now)!='0分鐘'){
    popup
      .append('<br>')
      .append(document.createTextNode(ago(last.time, now)))
    }
    popup
      .append('<br>')
      .append(plugin.playerTracker.getPortalLink(last));

    // show previous data in popup
    if(evtsLength >= 2) {
      popup
        .append('<br>')
        .append('<br>')
        .append(document.createTextNode('之前的位置:'))
        .append('<br>');

      var table = $('<table>')
        .appendTo(popup)
        .css('border-spacing', '0');
      for(var i = evtsLength - 2; i >= 0 && i >= evtsLength - 10; i--) {
        var ev = playerData.events[i];
        $('<tr>')
          .append($('<td>')
            .text(ago(ev.time, now) + '前'))
          .append($('<td>')
            .append(plugin.playerTracker.getPortalLink(ev)))
          .appendTo(table);
      }
    }

    // calculate the closest portal to the player
    var eventPortal = []
    var closestPortal;
    var mostPortals = 0;
    $.each(last.ids, function(i, id) {
      if(eventPortal[id]) {
        eventPortal[id]++;
      } else {
        eventPortal[id] = 1;
      }
      if(eventPortal[id] > mostPortals) {
        mostPortals = eventPortal[id];
        closestPortal = id;
      }
    });

    // marker opacity
    var relOpacity = 1 - (now - last.time) / window.PLAYER_TRACKER_MAX_TIME
    var absOpacity = window.PLAYER_TRACKER_MIN_OPACITY + (1 - window.PLAYER_TRACKER_MIN_OPACITY) * relOpacity;

    // marker itself
    var icon = playerData.team === 'RESISTANCE' ?  new plugin.playerTracker.iconRes() :  new plugin.playerTracker.iconEnl();
    // as per OverlappingMarkerSpiderfier docs, click events (popups, etc) must be handled via it rather than the standard
    // marker click events. so store the popup text in the options, then display it in the oms click handler
    var m = L.marker(gllfe(last), {icon: icon, referenceToPortal: closestPortal, opacity: absOpacity, desc: popup[0], title: tooltip});
    m.addEventListener('spiderfiedclick', plugin.playerTracker.onClickListener);

    // m.bindPopup(title);

    if (tooltip) {
      // ensure tooltips are closed, sometimes they linger
      m.on('mouseout', function() { $(this._icon).tooltip('close'); });
    }

    playerData.marker = m;

    m.addTo(playerData.team === 'RESISTANCE' ? plugin.playerTracker.drawnTracesRes : plugin.playerTracker.drawnTracesEnl);
    window.registerMarkerForOMS(m);

    // jQueryUI doesn’t automatically notice the new markers
    if (!isTouchDev) {
      window.setupTooltips($(m._icon));
    }
  });

  // draw the poly lines to the map
  $.each(polyLineByAgeEnl, function(i, polyLine) {
    if(polyLine.length === 0) return true;

    var opts = {
      weight: 1.5,
      color: '#FFDC03',
      clickable: false,
      opacity: 1-0.2*i,
      dashArray: "1,3"
    };

    $.each(polyLine,function(ind,poly) {
      L.polyline(poly, opts).addTo(plugin.playerTracker.drawnTracesEnl);
    });
  });
  $.each(polyLineByAgeRes, function(i, polyLine) {
    if(polyLine.length === 0) return true;

    var opts = {
      weight: 1.5,
      color: '#FF88FF',
      clickable: false,
      opacity: 1-0.2*i,
      dashArray: "1,3"
    };

    $.each(polyLine, function(ind,poly) {
      L.polyline(poly, opts).addTo(plugin.playerTracker.drawnTracesRes);
    });
  });
}

window.plugin.playerTracker.getPortalLink = function(data) {
  var position = data.latlngs[0];
  var ll = position.join(',');
  return $('<a>')
    .addClass('text-overflow-ellipsis')
    .css('max-width', '15em')
    .text(window.chat.getChatPortalName(data))
    .prop({
      title: window.chat.getChatPortalName(data),
      href: '/intel?ll=' + ll + '&pll=' + ll,
    })
    .click(function(event) {
      window.selectPortalByLatLng(position);
      event.preventDefault();
      return false;
    })
    .dblclick(function(event) {
      map.setView(position, 17)
      window.selectPortalByLatLng(position);
      event.preventDefault();
      return false;
    });
}

window.plugin.playerTracker.handleData = function(data) {
  if(window.map.getZoom() < window.PLAYER_TRACKER_MIN_ZOOM) return;

  plugin.playerTracker.discardOldData();
  plugin.playerTracker.processNewData(data);
  if (!window.isTouchDevice()) plugin.playerTracker.closeIconTooltips();

  plugin.playerTracker.drawnTracesEnl.clearLayers();
  plugin.playerTracker.drawnTracesRes.clearLayers();
  plugin.playerTracker.drawData();
}

window.plugin.playerTracker.findUser = function(nick) {
  nick = nick.toLowerCase();
  var foundPlayerData = false;
  $.each(plugin.playerTracker.stored, function(plrname, playerData) {
    if (playerData.nick.toLowerCase() === nick) {
      foundPlayerData = playerData;
      return false;
    }
  });
  return foundPlayerData;
}

window.plugin.playerTracker.findUserPosition = function(nick) {
  var data = window.plugin.playerTracker.findUser(nick);
  if (!data) return false;

  var last = data.events[data.events.length - 1];
  return plugin.playerTracker.getLatLngFromEvent(last);
}

window.plugin.playerTracker.centerMapOnUser = function(nick) {
  var data = plugin.playerTracker.findUser(nick);
  if(!data) return false;

  var last = data.events[data.events.length - 1];
  var position = plugin.playerTracker.getLatLngFromEvent(last);

  if(window.isSmartphone()) window.show('map');
  window.map.setView(position, map.getZoom());

  if(data.marker) {
    window.plugin.playerTracker.onClickListener({target: data.marker});
  }
  return true;
}

window.plugin.playerTracker.onNicknameClicked = function(info) {
  if (info.event.ctrlKey || info.event.metaKey) {
    return !plugin.playerTracker.centerMapOnUser(info.nickname);
  }
  return true; // don't interrupt hook
}

window.plugin.playerTracker.onSearchResultSelected = function(result, event) {
  event.stopPropagation(); // prevent chat from handling the click

  if(window.isSmartphone()) window.show('map');

  // if the user moved since the search was started, check if we have a new set of data
  if(false === window.plugin.playerTracker.centerMapOnUser(result.nickname))
    map.setView(result.position);

  if(event.type == 'dblclick')
    map.setZoom(17);

  return true;
};

window.plugin.playerTracker.onSearch = function(query) {
  var term = query.term.toLowerCase();

  if (term.length && term[0] == '@') term = term.substr(1);

  $.each(plugin.playerTracker.stored, function(nick, data) {
    if(nick.toLowerCase().indexOf(term) === -1) return;

    var event = data.events[data.events.length - 1];

    query.addResult({
      title: '<mark class="nickname help '+TEAM_TO_CSS[getTeam(data)]+'">' + nick + '</mark>',
      nickname: nick,
      description: data.team.substr(0,3) + ', last seen ' + unixTimeToDateTimeString(event.time),
      position: plugin.playerTracker.getLatLngFromEvent(event),
      onSelected: window.plugin.playerTracker.onSearchResultSelected,
    });
  });
}

window.plugin.playerTracker.setupUserSearch = function() {
  addHook('nicknameClicked', window.plugin.playerTracker.onNicknameClicked);
  addHook('search', window.plugin.playerTracker.onSearch);
}


var setup = plugin.playerTracker.setup;

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


