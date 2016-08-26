// ==UserScript==
// @id             iitc-plugin-player-tracker@breunigs
// @name           IITC Plugin: Player tracker
// @category       Layer
// @version        0.11.1.20160826.60012
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/player-tracker.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/Release/plugins/player-tracker.user.js
// @description    [Release-2016-08-26-060012] 運用通訊科廣播信息在地圖上繪製玩家的路徑. 使用顯示30分鐘.
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
plugin_info.dateTimeVersion = '20160826.60012';
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
    window.addLayerGroup('反抗軍探員', plugin.playerTracker.drawnTracesRes, true);
    window.addLayerGroup('啟蒙軍探員', plugin.playerTracker.drawnTracesEnl, true);
  } else {
    window.addLayerGroup('啟蒙軍探員', plugin.playerTracker.drawnTracesEnl, true);
    window.addLayerGroup('反抗軍探員', plugin.playerTracker.drawnTracesRes, true);
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
  if(m < 0) m = 0;  //iF: Fix -1min
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


