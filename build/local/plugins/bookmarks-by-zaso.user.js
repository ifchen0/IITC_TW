// ==UserScript==
// @id             iitc-plugin-bookmarks@ZasoGD
// @name           IITC plugin: Bookmarks for maps and portals
// @category       Controls
// @version        0.2.12.20151127.20547
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/local/plugins/bookmarks-by-zaso.meta.js
// @downloadURL    https://raw.githubusercontent.com/ifchen0/IITC_TW/master/build/local/plugins/bookmarks-by-zaso.user.js
// @description    [local-2015-11-27-020547] 您最喜歡的地圖和Portalh保存為書籤, 可和Sync一起使用.
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
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20151127.20547';
plugin_info.pluginId = 'bookmarks-by-zaso';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////
/***********************************************************************

  HOOKS:
  - pluginBkmrksEdit: fired when a bookmarks/folder is removed, added or sorted, also when a folder is opened/closed;
  - pluginBkmrksOpenOpt: fired when the "Bookmarks Options" panel is opened (you can add new options);
  - pluginBkmrksSyncEnd: fired when the sync is finished;

***********************************************************************/
////////////////////////////////////////////////////////////////////////

  // use own namespace for plugin
  window.plugin.bookmarks = function() {};

  window.plugin.bookmarks.SYNC_DELAY = 5000;

  window.plugin.bookmarks.KEY_OTHER_BKMRK = 'idOthers';
  window.plugin.bookmarks.KEY_STORAGE = 'plugin-bookmarks';
  window.plugin.bookmarks.KEY_STATUS_BOX = 'plugin-bookmarks-box';

  window.plugin.bookmarks.KEY = {key: window.plugin.bookmarks.KEY_STORAGE, field: 'bkmrksObj'};
  window.plugin.bookmarks.UPDATE_QUEUE = {key: 'plugin-bookmarks-queue', field: 'updateQueue'};
  window.plugin.bookmarks.UPDATING_QUEUE = {key: 'plugin-bookmarks-updating-queue', field: 'updatingQueue'};

  window.plugin.bookmarks.bkmrksObj = {};
  window.plugin.bookmarks.statusBox = {};
  window.plugin.bookmarks.updateQueue = {};
  window.plugin.bookmarks.updatingQueue = {};

  window.plugin.bookmarks.enableSync = false;

  window.plugin.bookmarks.starLayers = {};
  window.plugin.bookmarks.starLayerGroup = null;

  window.plugin.bookmarks.isSmart = undefined;
  window.plugin.bookmarks.isAndroid = function() {
    if(typeof android !== 'undefined' && android) {
      return true;
    }
    return false;
  }

/*********************************************************************************************************************/

  // Generate an ID for the bookmark (date time + random number)
  window.plugin.bookmarks.generateID = function() {
    var d = new Date();
    var ID = d.getTime()+(Math.floor(Math.random()*99)+1);
    var ID = 'id'+ID.toString();
    return ID;
  }

  // Format the string
  window.plugin.bookmarks.escapeHtml = function(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, '&#47;')
        .replace(/\\/g, '&#92;');
  }

  // Update the localStorage
  window.plugin.bookmarks.saveStorage = function() {
    localStorage[plugin.bookmarks.KEY_STORAGE] = JSON.stringify(window.plugin.bookmarks.bkmrksObj);
  }
  // Load the localStorage
  window.plugin.bookmarks.loadStorage = function() {
    window.plugin.bookmarks.bkmrksObj = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
  }

  window.plugin.bookmarks.saveStorageBox = function() {
    localStorage[plugin.bookmarks.KEY_STATUS_BOX] = JSON.stringify(window.plugin.bookmarks.statusBox);
  }
  window.plugin.bookmarks.loadStorageBox = function() {
    window.plugin.bookmarks.statusBox = JSON.parse(localStorage[plugin.bookmarks.KEY_STATUS_BOX]);
  }

  window.plugin.bookmarks.upgradeToNewStorage = function() {
    if(localStorage['plugin-bookmarks-portals-data'] && localStorage['plugin-bookmarks-maps-data']) {
      var oldStor_1 = JSON.parse(localStorage['plugin-bookmarks-maps-data']);
      var oldStor_2 = JSON.parse(localStorage['plugin-bookmarks-portals-data']);

      window.plugin.bookmarks.bkmrksObj.maps = oldStor_1.bkmrk_maps;
      window.plugin.bookmarks.bkmrksObj.portals = oldStor_2.bkmrk_portals;
      window.plugin.bookmarks.saveStorage();

      localStorage.removeItem('plugin-bookmarks-maps-data');
      localStorage.removeItem('plugin-bookmarks-portals-data');
      localStorage.removeItem('plugin-bookmarks-status-box');
    }
  }

  window.plugin.bookmarks.createStorage = function() {
    if(!localStorage[window.plugin.bookmarks.KEY_STORAGE]) {
      window.plugin.bookmarks.bkmrksObj.maps = {idOthers:{label:"Others",state:1,bkmrk:{}}};
      window.plugin.bookmarks.bkmrksObj.portals = {idOthers:{label:"Others",state:1,bkmrk:{}}};
      window.plugin.bookmarks.saveStorage();
    }
    if(!localStorage[window.plugin.bookmarks.KEY_STATUS_BOX]) {
      window.plugin.bookmarks.statusBox.show = 1;
      window.plugin.bookmarks.statusBox.page = 0;
      window.plugin.bookmarks.statusBox.pos = {x:100,y:100};
      window.plugin.bookmarks.saveStorageBox();
    }
  }

  window.plugin.bookmarks.refreshBkmrks = function() {
    $('#bkmrk_maps > ul, #bkmrk_portals > ul').remove();

    window.plugin.bookmarks.loadStorage();
    window.plugin.bookmarks.loadList('maps');
    window.plugin.bookmarks.loadList('portals');

    window.plugin.bookmarks.updateStarPortal();
    window.plugin.bookmarks.jquerySortableScript();
  }

/***************************************************************************************************************************************************************/

  // Show/hide the bookmarks box
  window.plugin.bookmarks.switchStatusBkmrksBox = function(status) {
    var newStatus = status;

    if(newStatus === 'switch') {
      if(window.plugin.bookmarks.statusBox.show === 1) {
        newStatus = 0;
      } else {
        newStatus = 1;
      }
    }

    if(newStatus === 1) {
      $('#bookmarksBox').css('height', 'auto');
      $('#bkmrksTrigger').css('height', '0');
    } else {
      $('#bkmrksTrigger').css('height', '64px');
      $('#bookmarksBox').css('height', '0');
    }

    window.plugin.bookmarks.statusBox['show'] = newStatus;
    window.plugin.bookmarks.saveStorageBox();
  }

  window.plugin.bookmarks.onPaneChanged = function(pane) {
    if(pane == "plugin-bookmarks")
      $('#bookmarksBox').css("display", "");
    else
      $('#bookmarksBox').css("display", "none");
  }

  // Switch list (maps/portals)
  window.plugin.bookmarks.switchPageBkmrksBox = function(elem, page) {
    window.plugin.bookmarks.statusBox.page = page;
    window.plugin.bookmarks.saveStorageBox();

    $('h5').removeClass('current');
    $(elem).addClass('current');

    var sectList = '#'+$(elem).attr('class').replace(' current', '');
    $('#bookmarksBox .bookmarkList').removeClass('current');
    $(sectList).addClass('current');
  }

  // Switch the status folder to open/close (in the localStorage)
  window.plugin.bookmarks.openFolder = function(elem) {
    $(elem).parent().parent('li').toggleClass('open');

    var typeList = $(elem).parent().parent().parent().parent('div').attr('id').replace('bkmrk_', '');
    var ID = $(elem).parent().parent('li').attr('id');

    var newFlag;
    var flag = window.plugin.bookmarks.bkmrksObj[typeList][ID]['state'];
    if(flag) { newFlag = 0; }
    else if(!flag) { newFlag = 1; }

    window.plugin.bookmarks.bkmrksObj[typeList][ID]['state'] = newFlag;
    window.plugin.bookmarks.saveStorage();
    window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": newFlag?"open":"close", "id": ID});
  }

  // Load the HTML bookmarks
  window.plugin.bookmarks.loadList = function(typeList) {
    var element = '';
    var elementTemp = '';
    var elementExc = '';
    var returnToMap = '';

    if(window.plugin.bookmarks.isSmart) {
      returnToMap = 'window.show(\'map\');';
    }

    // For each folder
    var list = window.plugin.bookmarks.bkmrksObj[typeList];

    for(var idFolders in list) {
      var folders = list[idFolders];
      var active = '';

      // Create a label and a anchor for the sortable
      var folderDelete = '<span class="folderLabel"><a class="bookmarksRemoveFrom" onclick="window.plugin.bookmarks.removeElement(this, \'folder\');return false;" title="刪除這個資料夾">X</a>';
      var folderName = '<a class="bookmarksAnchor" onclick="window.plugin.bookmarks.openFolder(this);return false"><span></span>'+folders['label']+'</a></span>';//<span><span></span></span>';
      var folderLabel = folderDelete+folderName;

      if(folders['state']) { active = ' open'; }
      if(idFolders === window.plugin.bookmarks.KEY_OTHER_BKMRK) {
        folderLabel = '';
        active= ' othersBookmarks open';
      }
      // Create a folder
      elementTemp = '<li class="bookmarkFolder'+active+'" id="'+idFolders+'">'+folderLabel+'<ul>';

      // For each bookmark
      var fold = folders['bkmrk'];
      for(var idBkmrk in fold) {
        var btn_link;
        var btn_remove = '<a class="bookmarksRemoveFrom" onclick="window.plugin.bookmarks.removeElement(this, \''+typeList+'\');return false;" title="Remove from bookmarks">X</a>';

        var btn_move = '';
        if(window.plugin.bookmarks.isSmart) {
          btn_move = '<a class="bookmarksMoveIn" onclick="window.plugin.bookmarks.dialogMobileSort(\''+typeList+'\', this);return false;">=</a>';
        }

        var bkmrk = fold[idBkmrk];
        var label = bkmrk['label'];
        var latlng = bkmrk['latlng'];

        // If it's a map
        if(typeList === 'maps') {
          if(bkmrk['label']=='') { label = bkmrk['latlng']+' ['+bkmrk['z']+']'; }
          btn_link = '<a class="bookmarksLink" onclick="'+returnToMap+'window.map.setView(['+latlng+'], '+bkmrk['z']+');return false;">'+label+'</a>';
        }
        // If it's a portal
        else if(typeList === 'portals') {
          var guid = bkmrk['guid'];
          var btn_link = '<a class="bookmarksLink" onclick="$(\'a.bookmarksLink.selected\').removeClass(\'selected\');'+returnToMap+'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+label+'</a>';
        }
        // Create the bookmark
        elementTemp += '<li class="bkmrk" id="'+idBkmrk+'">'+btn_remove+btn_move+btn_link+'</li>';
      }
      elementTemp += '</li></ul>';

      // Add folder 'Others' in last position
      if(idFolders != window.plugin.bookmarks.KEY_OTHER_BKMRK) { element += elementTemp; }
      else{ elementExc = elementTemp; }
    }
    element += elementExc;
    element = '<ul>'+element+'</ul>';

    // Append all folders and bookmarks
    $('#bkmrk_'+typeList).append(element);
  }

/***************************************************************************************************************************************************************/

  window.plugin.bookmarks.findByGuid = function(guid) {
    var list = window.plugin.bookmarks.bkmrksObj['portals'];

    for(var idFolders in list) {
      for(var idBkmrk in list[idFolders]['bkmrk']) {
        var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
        if(guid === portalGuid) {
          return {"id_folder":idFolders,"id_bookmark":idBkmrk};
        }
       }
    }
    return;
  }

  // Append a 'star' flag in sidebar.
  window.plugin.bookmarks.onPortalSelectedPending = false;
  window.plugin.bookmarks.onPortalSelected = function() {
    $('.bkmrksStar').remove();

    if(window.selectedPortal == null) return;

    if (!window.plugin.bookmarks.onPortalSelectedPending) {
      window.plugin.bookmarks.onPortalSelectedPending = true;

      setTimeout(function() { // the sidebar is constructed after firing the hook
        window.plugin.bookmarks.onPortalSelectedPending = false;

        $('.bkmrksStar').remove();

        if(typeof(Storage) === "undefined") {
          $('#portaldetails > .imgpreview').after(plugin.bookmarks.htmlDisabledMessage);
          return;
        }

        // Prepend a star to mobile status-bar
        if(window.plugin.bookmarks.isSmart) {
          $('#updatestatus').prepend(plugin.bookmarks.htmlStar);
          $('#updatestatus .bkmrksStar').attr('title', '');
        }

        $('#portaldetails > h3.title').before(plugin.bookmarks.htmlStar);
        window.plugin.bookmarks.updateStarPortal();
      }, 0);
    }

  }

  // Update the status of the star (when a portal is selected from the map/bookmarks-list)
  window.plugin.bookmarks.updateStarPortal = function() {
    var guid = window.selectedPortal;
    $('.bkmrksStar').removeClass('favorite');
    $('.bkmrk a.bookmarksLink.selected').removeClass('selected');

    // If current portal is into bookmarks: select bookmark portal from portals list and select the star
    if(localStorage[window.plugin.bookmarks.KEY_STORAGE].search(guid) != -1) {
      var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
      if(bkmrkData) {
        $('.bkmrk#'+bkmrkData['id_bookmark']+' a.bookmarksLink').addClass('selected');
        $('.bkmrksStar').addClass('favorite');
      }
    }
  }

  // Switch the status of the star
  window.plugin.bookmarks.switchStarPortal = function(guid) {
    if(guid == undefined) guid = window.selectedPortal;

    // If portal is saved in bookmarks: Remove this bookmark
    var bkmrkData = window.plugin.bookmarks.findByGuid(guid);
    if(bkmrkData) {
      var list = window.plugin.bookmarks.bkmrksObj['portals'];
      delete list[bkmrkData['id_folder']]['bkmrk'][bkmrkData['id_bookmark']];
      $('.bkmrk#'+bkmrkData['id_bookmark']+'').remove();

      window.plugin.bookmarks.saveStorage();
      window.plugin.bookmarks.updateStarPortal();

      window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "remove", "folder": bkmrkData['id_folder'], "id": bkmrkData['id_bookmark'], "guid":guid});
      console.log('BOOKMARKS: removed portal ('+bkmrkData['id_bookmark']+' situated in '+bkmrkData['id_folder']+' folder)');
    }
    // If portal isn't saved in bookmarks: Add this bookmark
    else{
      // Get portal name and coordinates
      var p = window.portals[guid];
      var ll = p.getLatLng();
      plugin.bookmarks.addPortalBookmark(guid, ll.lat+','+ll.lng, p.options.data.title);
    }
  }

  plugin.bookmarks.addPortalBookmark = function(guid, latlng, label) {
    var ID = window.plugin.bookmarks.generateID();

    // Add bookmark in the localStorage
    window.plugin.bookmarks.bkmrksObj['portals'][window.plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"guid":guid,"latlng":latlng,"label":label};

    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "add", "id": ID, "guid": guid});
    console.log('BOOKMARKS: added portal '+ID);
  }

  // Add BOOKMARK/FOLDER
  window.plugin.bookmarks.addElement = function(elem, type) {
    var ID = window.plugin.bookmarks.generateID();
    var typeList = $(elem).parent().parent('div').attr('id');

    // Get the label | Convert some characters | Set the input (empty)
    var input = '#'+typeList+' .addForm input';
    var label = $(input).val();
    label = window.plugin.bookmarks.escapeHtml(label);
    $(input).val('');

    // Add a map
    if(type === 'map') {
      // Get the coordinates and zoom
      var c = map.getCenter();
      var lat = Math.round(c.lat*1E6)/1E6;
      var lng = Math.round(c.lng*1E6)/1E6;
      var latlng = lat+','+lng;
      var zoom = parseInt(map.getZoom());
      // Add bookmark in the localStorage
      window.plugin.bookmarks.bkmrksObj['maps'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"label":label,"latlng":latlng,"z":zoom};
    }
    else{
      if(label === '') { label = '資料夾'; }
      var short_type = typeList.replace('bkmrk_', '');
      // Add new folder in the localStorage
      window.plugin.bookmarks.bkmrksObj[short_type][ID] = {"label":label,"state":1,"bkmrk":{}};
    }
    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": type, "action": "add", "id": ID});
    console.log('BOOKMARKS: added '+type+' '+ID);
  }

  // Remove BOOKMARK/FOLDER
  window.plugin.bookmarks.removeElement = function(elem, type) {
    if(type === 'maps' || type === 'portals') {
      var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
      var ID = $(elem).parent('li').attr('id');
      var IDfold = $(elem).parent().parent().parent('li').attr('id');
      var guid = window.plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][IDfold]['bkmrk'][ID].guid;

      delete window.plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][IDfold]['bkmrk'][ID];
      $(elem).parent('li').remove();

      if(type === 'portals') {
        var list = window.plugin.bookmarks.bkmrksObj['portals'];

        window.plugin.bookmarks.updateStarPortal();
        window.plugin.bookmarks.saveStorage();

        window.runHooks('pluginBkmrksEdit', {"target": "portal", "action": "remove", "folder": IDfold, "id": ID, "guid": guid});
        console.log('BOOKMARKS: removed portal ('+ID+' situated in '+IDfold+' folder)');
      } else {
        window.plugin.bookmarks.saveStorage();
        window.runHooks('pluginBkmrksEdit', {"target": "map", "action": "remove", "id": ID});
        console.log('BOOKMARKS: removed map '+ID);
      }
    }
    else if(type === 'folder') {
      var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
      var ID = $(elem).parent().parent('li').attr('id');

      delete plugin.bookmarks.bkmrksObj[typeList.replace('bkmrk_', '')][ID];
      $(elem).parent().parent('li').remove();
      window.plugin.bookmarks.saveStorage();
      window.plugin.bookmarks.updateStarPortal();
      window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": "remove", "id": ID});
      console.log('BOOKMARKS: removed folder '+ID);
    }
  }

  window.plugin.bookmarks.deleteMode = function() {
    $('#bookmarksBox').removeClass('moveMode').toggleClass('deleteMode');
  }

  window.plugin.bookmarks.moveMode = function() {
    $('#bookmarksBox').removeClass('deleteMode').toggleClass('moveMode');
  }

  window.plugin.bookmarks.mobileSortIDb = '';
  window.plugin.bookmarks.mobileSortIDf = '';
  window.plugin.bookmarks.dialogMobileSort = function(type, elem){
    window.plugin.bookmarks.mobileSortIDb = $(elem).parent('li.bkmrk').attr('id');
    window.plugin.bookmarks.mobileSortIDf = $(elem).parent('li.bkmrk').parent('ul').parent('li.bookmarkFolder').attr('id');

    if(type === 'maps'){ type = 1; }
    else if(type === 'portals'){ type = 2; }

    dialog({
      html: window.plugin.bookmarks.dialogLoadListFolders('bookmarksDialogMobileSort', 'window.plugin.bookmarks.mobileSort', true, type),
      dialogClass: 'ui-dialog-bkmrksSet-copy',
      title: 'Bookmarks - Move Bookmark'
    });
  }

  window.plugin.bookmarks.mobileSort = function(elem){
    var type = $(elem).data('type');
    var idBkmrk = window.plugin.bookmarks.mobileSortIDb;
    var newFold = $(elem).data('id');
    var oldFold = window.plugin.bookmarks.mobileSortIDf;

    var Bkmrk = window.plugin.bookmarks.bkmrksObj[type][oldFold].bkmrk[idBkmrk];

    delete window.plugin.bookmarks.bkmrksObj[type][oldFold].bkmrk[idBkmrk];

    window.plugin.bookmarks.bkmrksObj[type][newFold].bkmrk[idBkmrk] = Bkmrk;

    window.plugin.bookmarks.saveStorage();
    window.plugin.bookmarks.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', {"target": "bookmarks", "action": "sort"});
    window.plugin.bookmarks.mobileSortIDf = newFold;
    console.log('Move Bookmarks '+type+' ID:'+idBkmrk+' from folder ID:'+oldFold+' to folder ID:'+newFold);
  }

  window.plugin.bookmarks.onSearch = function(query) {
    var term = query.term.toLowerCase();

    $.each(plugin.bookmarks.bkmrksObj.maps, function(id, folder) {
      $.each(folder.bkmrk, function(id, bookmark) {
        if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

        query.addResult({
          title: escapeHtmlSpecialChars(bookmark.label),
          description: 'Map in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADYSURBVCiRldExLoRxEAXw33xZ4QIKB9BQWPl0yFKJA4hCo1CqXMABVA6gcgkFnc7/s7VQaByAgoYdhU3sZr9NmGSaee/NvJeJUkr6R3WgrusYm/ajJ7zr5t3ouGmarFrXpFPpuA2aFDSxIWxjXz/mWy25jx3hEAsqS0NsFi/68YxHlXPK8MKbGwR6GN06g0XhwYrrX0tb+enJAS5b8pzp5gk5GM+wl1/C1YQgfEwPPbA+JN3iAgMsTxeEOWlXNzet5pHKGl7HOKWUzEx/6VJKdvj54IT3KfUNvrNZ/jYm+uoAAAAASUVORK5CYII=',
          position: L.latLng(bookmark.latlng.split(",")),
          zoom: bookmark.z,
          onSelected: window.plugin.bookmarks.onSearchResultSelected,
        });
      });
    });

    $.each(plugin.bookmarks.bkmrksObj.portals, function(id, folder) {
      $.each(folder.bkmrk, function(id, bookmark) {
        if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

        query.addResult({
          title: escapeHtmlSpecialChars(bookmark.label),
          description: 'Bookmark in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADFSURBVCiRrdEtTkMBEATgb19C0gsgEEgMFW2TooAURzgACoNAorgAB6jqAVBcghBQYPmxBAQeBYYQ4C2CJvTlPUibMG53ZpKZ3chMs6Bo3N7EwG2sTG9Ih9J+ExW1SFexpnCBNyzq5VPdcB2bwi4WsIz5Mf+OR9wrjHTy9DvSi3MEBhNimMOScKfj7KfDRn54sIPjhj5D3Twgy2rp7fwUTuotvU6O1SuVVseiSxyhRPt3Q2hJW7q5rpd7Cn08VyT/8+k/8AVY7Dd1pA43RAAAAABJRU5ErkJggg==',
          position: L.latLng(bookmark.latlng.split(",")),
          guid: bookmark.guid,
          onSelected: window.plugin.bookmarks.onSearchResultSelected,
        });
      });
    });
  };

  window.plugin.bookmarks.onSearchResultSelected = function(result, event) {
    if(result.guid) { // portal
      var guid = result.guid;
      if(event.type == 'dblclick')
        zoomToAndShowPortal(guid, result.position);
      else if(window.portals[guid])
        renderPortalDetails(guid);
      else
        window.selectPortalByLatLng(result.position);
    } else if(result.zoom) { // map
      map.setView(result.position, result.zoom);
    }
    return true; // prevent default behavior
  };

/***************************************************************************************************************************************************************/

  // Saved the new sort of the folders (in the localStorage)
  window.plugin.bookmarks.sortFolder = function(typeList) {
    var keyType = typeList.replace('bkmrk_', '');

    var newArr = {};
    $('#'+typeList+' li.bookmarkFolder').each(function() {
        var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks.bkmrksObj[keyType][idFold];
    });
    window.plugin.bookmarks.bkmrksObj[keyType] = newArr;
    window.plugin.bookmarks.saveStorage();

    window.runHooks('pluginBkmrksEdit', {"target": "folder", "action": "sort"});
    console.log('BOOKMARKS: sorted folder');
  }

  // Saved the new sort of the bookmarks (in the localStorage)
  window.plugin.bookmarks.sortBookmark = function(typeList) {
    var keyType = typeList.replace('bkmrk_', '');
    var list = window.plugin.bookmarks.bkmrksObj[keyType];
    var newArr = {};

    $('#'+typeList+' li.bookmarkFolder').each(function() {
      var idFold = $(this).attr('id');
      newArr[idFold] = window.plugin.bookmarks.bkmrksObj[keyType][idFold];
      newArr[idFold].bkmrk = {};
    });

    $('#'+typeList+' li.bkmrk').each(function() {
      window.plugin.bookmarks.loadStorage();

      var idFold = $(this).parent().parent('li').attr('id');
      var id = $(this).attr('id');

      var list = window.plugin.bookmarks.bkmrksObj[keyType];
      for(var idFoldersOrigin in list) {
        for(var idBkmrk in list[idFoldersOrigin]['bkmrk']) {
          if(idBkmrk == id) {
            newArr[idFold].bkmrk[id] = window.plugin.bookmarks.bkmrksObj[keyType][idFoldersOrigin].bkmrk[id];
          }
        }
      }
    });
    window.plugin.bookmarks.bkmrksObj[keyType] = newArr;
    window.plugin.bookmarks.saveStorage();
    window.runHooks('pluginBkmrksEdit', {"target": "bookmarks", "action": "sort"});
    console.log('BOOKMARKS: sorted bookmark (portal/map)');
  }

  window.plugin.bookmarks.jquerySortableScript = function() {
    $(".bookmarkList > ul").sortable({
      items:"li.bookmarkFolder:not(.othersBookmarks)",
      handle:".bookmarksAnchor",
      placeholder:"sortable-placeholder",
      helper:'clone', // fix accidental click in firefox
      forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortFolder(typeList);
      }
    });

    $(".bookmarkList ul li ul").sortable({
      items:"li.bkmrk",
      connectWith:".bookmarkList ul ul",
      handle:".bookmarksLink",
      placeholder:"sortable-placeholder",
      helper:'clone', // fix accidental click in firefox
      forcePlaceholderSize:true,
      update:function(event, ui) {
        var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
        window.plugin.bookmarks.sortBookmark(typeList);
      }
    });
  }

/***************************************************************************************************************************************************************/
/** OPTIONS ****************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  // Manual import, export and reset data
  window.plugin.bookmarks.manualOpt = function() {
    dialog({
      html: plugin.bookmarks.htmlSetbox,
      dialogClass: 'ui-dialog-bkmrksSet',
      title: '書籤選項'
    });

    window.runHooks('pluginBkmrksOpenOpt');
  }

  window.plugin.bookmarks.optAlert = function(message) {
      $('.ui-dialog-bkmrksSet .ui-dialog-buttonset').prepend('<p class="bkrmks-alert" style="float:left;margin-top:4px;">'+message+'</p>');
      $('.bkrmks-alert').delay(2500).fadeOut();
  }

  window.plugin.bookmarks.optCopy = function() {
    if(typeof android !== 'undefined' && android && android.shareString) {
      return android.shareString(localStorage[window.plugin.bookmarks.KEY_STORAGE]);
    } else {
      dialog({
        html: '<p><a onclick="$(\'.ui-dialog-bkmrksSet-copy textarea\').select();">全選</a>並按 CTRL+C 來複製.</p><textarea readonly>'+localStorage[window.plugin.bookmarks.KEY_STORAGE]+'</textarea>',
        dialogClass: 'ui-dialog-bkmrksSet-copy',
        title: '匯出書籤'
      });
    }
  }

  window.plugin.bookmarks.optExport = function() {
    if(typeof android !== 'undefined' && android && android.saveFile) {
      android.saveFile("IITC-bookmarks.json", "application/json", localStorage[window.plugin.bookmarks.KEY_STORAGE]);
    }
  }

  window.plugin.bookmarks.optPaste = function() {
    var promptAction = prompt('按 CTRL+V 貼', '');
    if(promptAction !== null && promptAction !== '') {
      try {
        JSON.parse(promptAction); // try to parse JSON first
        localStorage[window.plugin.bookmarks.KEY_STORAGE] = promptAction;
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});
        console.log('BOOKMARKS: reset and imported bookmarks');
        window.plugin.bookmarks.optAlert('成功. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to import data: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">匯入失敗 </span>');
      }
    }
  }

  window.plugin.bookmarks.optImport = function() {
    if (window.requestFile === undefined) return;
    window.requestFile(function(filename, content) {
      try {
        JSON.parse(content); // try to parse JSON first
        localStorage[window.plugin.bookmarks.KEY_STORAGE] = content;
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});
        console.log('BOOKMARKS: reset and imported bookmarks');
        window.plugin.bookmarks.optAlert('成功. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to import data: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">匯入失敗 </span>');
      }
    });
  }

  window.plugin.bookmarks.optReset = function() {
    var promptAction = confirm('所有書籤將會被移除. 你確定嗎?', '');
    if(promptAction) {
      delete localStorage[window.plugin.bookmarks.KEY_STORAGE];
      window.plugin.bookmarks.createStorage();
      window.plugin.bookmarks.loadStorage();
      window.plugin.bookmarks.refreshBkmrks();
      window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "reset"});
      console.log('BOOKMARKS: reset all bookmarks');
      window.plugin.bookmarks.optAlert('成功. ');
    }
  }

  window.plugin.bookmarks.optBox = function(command) {
    if(!window.plugin.bookmarks.isAndroid()) {
      switch(command) {
        case 'save':
          var boxX = parseInt($('#bookmarksBox').css('top'));
          var boxY = parseInt($('#bookmarksBox').css('left'));
          window.plugin.bookmarks.statusBox.pos = {x:boxX, y:boxY};
          window.plugin.bookmarks.saveStorageBox();
          window.plugin.bookmarks.optAlert('已取得定位. ');
          break;
        case 'reset':
          $('#bookmarksBox').css({'top':100, 'left':100});
          window.plugin.bookmarks.optBox('save');
          break;
      }
    } else {
      window.plugin.bookmarks.optAlert('僅供IITC桌面版使用. ');
    }
  }

  window.plugin.bookmarks.dialogLoadListFolders = function(idBox, clickAction, showOthersF, scanType/*0 = maps&portals; 1 = maps; 2 = portals*/) {
    var list = JSON.parse(localStorage['plugin-bookmarks']);
    var listHTML = '';
    var foldHTML = '';
    var elemGenericFolder = '';

    // For each type and folder
    for(var type in list){
      if(scanType === 0 || (scanType === 1 && type === 'maps') || (scanType === 2 && type === 'portals')){
        listHTML += '<h3>'+type+':</h3>';

        for(var idFolders in list[type]) {
          var label = list[type][idFolders]['label'];

          // Create a folder
          foldHTML = '<div class="bookmarkFolder" id="'+idFolders+'" data-type="'+type+'" data-id="'+idFolders+'" onclick="'+clickAction+'(this)";return false;">'+label+'</div>';

          if(idFolders !== window.plugin.bookmarks.KEY_OTHER_BKMRK) {
            listHTML += foldHTML;
          } else {
            if(showOthersF === true){
              elemGenericFolder = foldHTML;
            }
          }
        }
      }
      listHTML += elemGenericFolder;
      elemGenericFolder = '';
    }

    // Append all folders
    var r = '<div class="bookmarksDialog" id="'+idBox+'">'
      + listHTML
      + '</div>';

    return r;
  }

  window.plugin.bookmarks.renameFolder = function(elem){
    var type = $(elem).data('type');
    var idFold = $(elem).data('id');

    var promptAction = prompt('輸入一個新的名稱.', '');
    if(promptAction !== null && promptAction !== '') {
      try {
        var newName = window.plugin.bookmarks.escapeHtml(promptAction);

        window.plugin.bookmarks.bkmrksObj[type][idFold].label = newName;
        $('#bookmarksDialogRenameF #'+idFold).text(newName);
        window.plugin.bookmarks.saveStorage();
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "import"});

        console.log('BOOKMARKS: renamed bookmarks folder');
        window.plugin.bookmarks.optAlert('成功. ');
      } catch(e) {
        console.warn('BOOKMARKS: failed to rename folder: '+e);
        window.plugin.bookmarks.optAlert('<span style="color: #f88">重新命名失敗 </span>');
        return;
      }
    }
  }

  window.plugin.bookmarks.optRenameF = function() {
    dialog({
      html: window.plugin.bookmarks.dialogLoadListFolders('bookmarksDialogRenameF', 'window.plugin.bookmarks.renameFolder', false, 0),
      dialogClass: 'ui-dialog-bkmrksSet-copy',
      title: '重新命名資料夾'
    });
  }

/***************************************************************************************************************************************************************/
/** AUTO DRAW **************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.dialogDrawer = function() {
    dialog({
      html:window.plugin.bookmarks.dialogLoadList,
      dialogClass:'ui-dialog-autodrawer',
      title:'書籤 - 自動繪圖',
      buttons:{
        '繪製': function() {
          window.plugin.bookmarks.draw(0);
        },
        '繪製並顯示': function() {
          window.plugin.bookmarks.draw(1);
        }
      }
    });
    window.plugin.bookmarks.autoDrawOnSelect();
  }

  window.plugin.bookmarks.draw = function(view) {
    var latlngs = [];
    var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
      var tt = $(this).data('latlng');
      latlngs[i] = tt;
    });

    if(latlngs.length >= 2 && latlngs.length <= 3) {
      // TODO: add an API to draw-tools rather than assuming things about its internals

      var layer, layerType;
      if(latlngs.length == 2) {
        layer = L.geodesicPolyline(latlngs, window.plugin.drawTools.lineOptions);
        layerType = 'polyline';
      } else {
        layer = L.geodesicPolygon(latlngs, window.plugin.drawTools.polygonOptions);
        layerType = 'polygon';
      }

      map.fire('draw:created', {
        layer: layer,
        layerType: layerType
      });

      if($('#bkmrkClearSelection').prop('checked'))
        $('#bkmrksAutoDrawer a.bkmrk.selected').removeClass('selected');

      if(window.plugin.bookmarks.isSmart) {
        window.show('map');
      }

      // Shown the layer if it is hidden
      if(!map.hasLayer(window.plugin.drawTools.drawnItems)) {
        map.addLayer(window.plugin.drawTools.drawnItems);
      }

      if(view) {
        map.fitBounds(layer.getBounds());
      }
    }
  }

  window.plugin.bookmarks.autoDrawOnSelect = function() {
    var latlngs = [];
    var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
      var tt = $(this).data('latlng');
      latlngs[i] = tt;
    });

    var text = "你必須選擇 2 或 3 個能量塔書籤!";
    var color = "red";

    function formatDistance(distance) {
      var text = digits(distance > 10000 ? (distance/1000).toFixed(2) + "公里" : (Math.round(distance) + "公尺"));
      return distance >= 200000
        ? '<em title="遠距離連線" class="help longdistance">'+text+'</em>'
        : text;
    }

    if(latlngs.length == 2) {
      var distance = L.latLng(latlngs[0]).distanceTo(latlngs[1]);
      text = '能量塔之間的距離: ' + formatDistance(distance);
      color = "";
    } else if(latlngs.length == 3) {
      var longdistance = false;
      var distances = latlngs.map(function(ll1, i, latlngs) {
        var ll2 = latlngs[(i+1)%3];
        return formatDistance(L.latLng(ll1).distanceTo(ll2));
      });
      text = '距離: ' + distances.join(", ");
      color = "";
    }

    $('#bkmrksAutoDrawer p')
      .html(text)
      .css("color", color);
  }

  window.plugin.bookmarks.dialogLoadList = function() {
    var r = 'The "<a href="http://iitc.jonatkins.com/?page=desktop#plugin-draw-tools" target="_BLANK"><strong>Draw Tools</strong></a>" plugin is required.</span>';

    if(!window.plugin.bookmarks || !window.plugin.drawTools) {
      $('.ui-dialog-autodrawer .ui-dialog-buttonset .ui-button:not(:first)').hide();
    }
    else{
      var portalsList = JSON.parse(localStorage['plugin-bookmarks']);
      var element = '';
      var elementTemp = '';
      var elemGenericFolder = '';

      // For each folder
      var list = portalsList.portals;
      for(var idFolders in list) {
        var folders = list[idFolders];

        // Create a label and a anchor for the sortable
        var folderLabel = '<a class="folderLabel" onclick="$(this).siblings(\'div\').toggle();return false;">'+folders['label']+'</a>';

        // Create a folder
        elementTemp = '<div class="bookmarkFolder" id="'+idFolders+'">'+folderLabel+'<div>';

        // For each bookmark
        var fold = folders['bkmrk'];
        for(var idBkmrk in fold) {
          var bkmrk = fold[idBkmrk];
          var label = bkmrk['label'];
          var latlng = bkmrk['latlng'];

          // Create the bookmark
          elementTemp += '<a class="bkmrk" id="'+idBkmrk+'" onclick="$(this).toggleClass(\'selected\');return false" data-latlng="['+latlng+']">'+label+'</a>';
        }
        elementTemp += '</div></div>';

        if(idFolders !== window.plugin.bookmarks.KEY_OTHER_BKMRK) {
          element += elementTemp;
        } else {
          elemGenericFolder += elementTemp;
        }
      }
      element += elemGenericFolder;

      // Append all folders and bookmarks
      r = '<div id="bkmrksAutoDrawer">'
        + '<label style="margin-bottom: 9px; display: block;">'
        + '<input style="vertical-align: middle;" type="checkbox" id="bkmrkClearSelection" checked>'
        + ' 繪圖後清除選取的書籤</label>'
        + '<p style="margin-bottom:9px;color:red">您必須選擇 2 或 3 個能量塔書籤!</p>'
        + '<div onclick="window.plugin.bookmarks.autoDrawOnSelect();return false;">'
        + element
        + '</div>'
        + '</div>';
    }
    return r;
  }

/***************************************************************************************************************************************************************/
/** SYNC *******************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  // Delay the syncing to group a few updates in a single request
  window.plugin.bookmarks.delaySync = function() {
    if(!window.plugin.bookmarks.enableSync) return;
    clearTimeout(plugin.bookmarks.delaySync.timer);
    window.plugin.bookmarks.delaySync.timer = setTimeout(function() {
        window.plugin.bookmarks.delaySync.timer = null;
        window.plugin.bookmarks.syncNow();
      }, window.plugin.bookmarks.SYNC_DELAY);
  }

  // Store the updateQueue in updatingQueue and upload
  window.plugin.bookmarks.syncNow = function() {
    if(!window.plugin.bookmarks.enableSync) return;
    $.extend(window.plugin.bookmarks.updatingQueue, window.plugin.bookmarks.updateQueue);
    window.plugin.bookmarks.updateQueue = {};
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATING_QUEUE);
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);

    window.plugin.sync.updateMap('bookmarks', window.plugin.bookmarks.KEY.field, Object.keys(window.plugin.bookmarks.updatingQueue));
  }

  // Call after IITC and all plugin loaded
  window.plugin.bookmarks.registerFieldForSyncing = function() {
    if(!window.plugin.sync) return;
    window.plugin.sync.registerMapForSync('bookmarks', window.plugin.bookmarks.KEY.field, window.plugin.bookmarks.syncCallback, window.plugin.bookmarks.syncInitialed);
  }

  // Call after local or remote change uploaded
  window.plugin.bookmarks.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
    if(fieldName === window.plugin.bookmarks.KEY.field) {
      window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.KEY);
      // All data is replaced if other client update the data during this client offline,
      if(fullUpdated) {
        window.plugin.bookmarks.refreshBkmrks();
        return;
      }

      if(!e) return;
      if(e.isLocal) {
        // Update pushed successfully, remove it from updatingQueue
        delete window.plugin.bookmarks.updatingQueue[e.property];
      } else {
        // Remote update
        delete window.plugin.bookmarks.updateQueue[e.property];
        window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);
        window.plugin.bookmarks.refreshBkmrks();
        window.runHooks('pluginBkmrksSyncEnd', {"target": "all", "action": "sync"});
        console.log('BOOKMARKS: synchronized all');
      }
    }
  }

  // syncing of the field is initialed, upload all queued update
  window.plugin.bookmarks.syncInitialed = function(pluginName, fieldName) {
    if(fieldName === window.plugin.bookmarks.KEY.field) {
      window.plugin.bookmarks.enableSync = true;
      if(Object.keys(window.plugin.bookmarks.updateQueue).length > 0) {
        window.plugin.bookmarks.delaySync();
      }
    }
  }

  window.plugin.bookmarks.storeLocal = function(mapping) {
    if(typeof(window.plugin.bookmarks[mapping.field]) !== 'undefined' && window.plugin.bookmarks[mapping.field] !== null) {
      localStorage[mapping.key] = JSON.stringify(window.plugin.bookmarks[mapping.field]);
    } else {
      localStorage.removeItem(mapping.key);
    }
  }

  window.plugin.bookmarks.loadLocal = function(mapping) {
    var objectJSON = localStorage[mapping.key];
    if(!objectJSON) return;
    window.plugin.bookmarks[mapping.field] = mapping.convertFunc
                            ? mapping.convertFunc(JSON.parse(objectJSON))
                            : JSON.parse(objectJSON);
  }

  window.plugin.bookmarks.syncBkmrks = function() {
    window.plugin.bookmarks.loadLocal(window.plugin.bookmarks.KEY);

    window.plugin.bookmarks.updateQueue = window.plugin.bookmarks.bkmrksObj;
    window.plugin.bookmarks.storeLocal(window.plugin.bookmarks.UPDATE_QUEUE);

    window.plugin.bookmarks.delaySync();
  }

/***************************************************************************************************************************************************************/
/** HIGHLIGHTER ************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.highlight = function(data) {
    var guid = data.portal.options.ent[0];
    if(window.plugin.bookmarks.findByGuid(guid)) {
      // iF: change color to yellow and add opacity to 0.8
      data.portal.setStyle({fillColor:'yellow'});
      data.portal.setStyle({fillOpacity:0.8});
    }
  }

  window.plugin.bookmarks.highlightRefresh = function(data) {
    if(_current_highlighter === '能量塔書籤') {
      if(data.action === 'sync' || data.target === 'portal' || (data.target === 'folder' && data.action === 'remove') || (data.target === 'all' && data.action === 'import') || (data.target === 'all' && data.action === 'reset')) {
        window.resetHighlightedPortals();
      }
    }
  }

/***************************************************************************************************************************************************************/
/** BOOKMARKED PORTALS LAYER ***********************************************************************************************************************************/
/***************************************************************************************************************************************************************/
  window.plugin.bookmarks.addAllStars = function() {
    var list = window.plugin.bookmarks.bkmrksObj.portals;

    for(var idFolders in list) {
      for(var idBkmrks in list[idFolders]['bkmrk']) {
        var latlng = list[idFolders]['bkmrk'][idBkmrks].latlng.split(",");
        var guid = list[idFolders]['bkmrk'][idBkmrks].guid;
        var lbl = list[idFolders]['bkmrk'][idBkmrks].label;
        window.plugin.bookmarks.addStar(guid, latlng, lbl);
      }
    }
  }

  window.plugin.bookmarks.resetAllStars = function() {
    for(guid in window.plugin.bookmarks.starLayers) {
      var starInLayer = window.plugin.bookmarks.starLayers[guid];
      window.plugin.bookmarks.starLayerGroup.removeLayer(starInLayer);
      delete window.plugin.bookmarks.starLayers[guid];
    }
    window.plugin.bookmarks.addAllStars();
  }

  window.plugin.bookmarks.addStar = function(guid, latlng, lbl) {
    var star = L.marker(latlng, {
      title: lbl,
      icon: L.icon({
        iconUrl: 'data:image/png;base64,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',
        iconAnchor: [16,28],
        iconSize: [32,32]
      })
    });
    window.registerMarkerForOMS(star);
    star.on('spiderfiedclick', function() { renderPortalDetails(guid); });

    window.plugin.bookmarks.starLayers[guid] = star;
    star.addTo(window.plugin.bookmarks.starLayerGroup);
  }

  window.plugin.bookmarks.editStar = function(data) {
    if(data.target === 'portal') {
      if(data.action === 'add') {
        var guid = data.guid;
        var latlng = window.portals[guid].getLatLng();
        var lbl = window.portals[guid].options.data.title;
        var starInLayer = window.plugin.bookmarks.starLayers[data.guid];
        window.plugin.bookmarks.addStar(guid, latlng, lbl);
      }
      else if(data.action === 'remove') {
        var starInLayer = window.plugin.bookmarks.starLayers[data.guid];
        window.plugin.bookmarks.starLayerGroup.removeLayer(starInLayer);
        delete window.plugin.bookmarks.starLayers[data.guid];
      }
    }
    else if((data.target === 'all' && (data.action === 'import' || data.action === 'reset')) || (data.target === 'folder' && data.action === 'remove')) {
      window.plugin.bookmarks.resetAllStars();
    }
  }

/***************************************************************************************************************************************************************/

  window.plugin.bookmarks.setupCSS = function() {
    $('<style>').prop('type', 'text/css').html('/* hide when printing */\n@media print {\n	#bkmrksTrigger { display: none !important; }\n}\n\n\n#bookmarksBox *{\n	display:block;\n	padding:0;\n	margin:0;\n	width:auto;\n	height:auto;\n	font-family:Verdana,Geneva,sans-serif;\n	font-size:13px;\n	line-height:22px;\n	text-indent:0;\n	text-decoration:none;\n	-webkit-box-sizing:border-box;\n	-moz-box-sizing:border-box;\n	box-sizing:border-box;\n}\n\n#bookmarksBox{\n	display:block;\n	position:absolute !important;\n	z-index:4001;\n	top:100px;\n	left:100px;\n	width:231px;\n	height:auto;\n	overflow:hidden;\n}\n#bookmarksBox .addForm,\n#bookmarksBox #bookmarksTypeBar,\n#bookmarksBox h5{\n	height:28px;\n	overflow:hidden;\n	color:#fff;\n	font-size:14px;\n}\n#bookmarksBox #topBar{\n	height:15px !important;\n}\n#bookmarksBox #topBar *{\n	height: 14px !important;\n}\n#bookmarksBox #topBar *{\n	float:left !important;\n}\n#bookmarksBox .handle{\n	width:80%;\n	text-align:center;\n	color:#fff;\n	line-height:6px;\n	cursor:move;\n}\n#bookmarksBox #topBar .btn{\n	display:block;\n	width:10%;\n	cursor:pointer;\n	color:#20a8b1;\n\n	font-weight:bold;\n	text-align:center;\n	line-height:13px;\n	font-size:18px;\n}\n\n#bookmarksBox #topBar #bookmarksDel{\n	overflow:hidden;\n	text-indent:-999px;\n	background:#B42E2E;\n}\n\n#bookmarksBox #topBar #bookmarksMin:hover{\n	color:#ffce00;\n}\n#bookmarksBox #bookmarksTypeBar{\n	clear:both;\n}\n#bookmarksBox h5{\n	padding:4px 0 23px;\n	width:50%;\n	height:93px !important;\n	text-align:center;\n	color:#788;\n}\n#bookmarksBox h5.current{\n	cursor:default;\n	background:0;\n	color:#fff !important;\n}\n#bookmarksBox h5:hover{\n	color:#ffce00;\n	background:rgba(0,0,0,0);\n}\n#bookmarksBox #topBar,\n#bookmarksBox .addForm,\n#bookmarksBox #bookmarksTypeBar,\n#bookmarksBox .bookmarkList li.bookmarksEmpty,\n#bookmarksBox .bookmarkList li.bkmrk a,\n#bookmarksBox .bookmarkList li.bkmrk:hover{\n	background-color:rgba(8,48,78,.85);\n}\n#bookmarksBox h5,\n#bookmarksBox .bookmarkList li.bkmrk:hover .bookmarksLink,\n#bookmarksBox .addForm *{\n	background:rgba(0,0,0,.3);\n}\n#bookmarksBox .addForm *{\n	display:block;\n	float:left;\n	height:28px !important;\n}\n#bookmarksBox .addForm a{\n	cursor:pointer;\n	color:#20a8b1;\n	font-size:12px;\n	width:35%;\n	text-align:center;\n	line-height:20px;\n	padding:4px 0 23px;\n}\n#bookmarksBox .addForm a:hover{\n	background:#ffce00;\n	color:#000;\n	text-decoration:none;\n}\n#bookmarksBox .addForm input{\n	font-size:11px !important;\n	color:#ffce00;\n	height:28px;\n	padding:4px 8px 1px;\n	line-height:12px;\n	font-size:12px;\n}\n#bookmarksBox #bkmrk_portals .addForm input{\n	width:65%;\n}\n#bookmarksBox #bkmrk_maps .addForm input{\n	width:42%;\n}\n#bookmarksBox #bkmrk_maps .addForm a{\n	width:29%;\n}\n#bookmarksBox .addForm input:hover,\n#bookmarksBox .addForm input:focus{\n	outline:0;\n	background:rgba(0,0,0,.6);\n}\n#bookmarksBox .bookmarkList > ul{\n	clear:both;\n	list-style-type:none;\n	color:#fff;\n	overflow:hidden;\n	overflow-y:auto;\n	max-height:580px;\n}\n#bookmarksBox .sortable-placeholder{\n	background:rgba(8,48,78,.55);\n	box-shadow:inset 1px 0 0 #20a8b1;\n}\n#bookmarksBox .ui-sortable-helper{\n	border-top-width:1px;\n}\n#bookmarksBox .bookmarkList{\n	display:none;\n}\n#bookmarksBox .bookmarkList.current{\n	display:block;\n}\n#bookmarksBox h5,\n#bookmarksBox .addForm *,\n#bookmarksBox ul li.bkmrk,\n#bookmarksBox ul li.bkmrk a{\n	height:22px;\n}\n#bookmarksBox h5,\n#bookmarksBox ul li.bkmrk a{\n	overflow:hidden;\n	cursor:pointer;\n	float:left;\n}\n#bookmarksBox ul .bookmarksEmpty{\n	text-indent:27px;\n	color:#eee;\n}\n#bookmarksBox ul .bookmarksRemoveFrom{\n	width:10%;\n	text-align:center;\n	color:#fff;\n}\n#bookmarksBox ul .bookmarksLink{\n	width:90%;\n	padding:0 10px 0 8px;\n	color:#ffce00;\n}\n#bookmarksBox ul .bookmarksLink.selected{\n	color:#03fe03;\n}\n#bookmarksBox ul .othersBookmarks .bookmarksLink{\n	width:90%;\n}\n#bookmarksBox ul .bookmarksLink:hover{\n	color:#03fe03;\n}\n#bookmarksBox ul .bookmarksRemoveFrom:hover{\n	color:#fff;\n	background:#e22 !important;\n}\n\n/*---- UI border -----*/\n#bookmarksBox,\n#bookmarksBox *{\n	border-color:#20a8b1;\n	border-style:solid;\n	border-width:0;\n}\n#bookmarksBox #topBar,\n#bookmarksBox ul .bookmarkFolder{\n	border-top-width:1px;\n}\n\n#bookmarksBox #topBar,\n#bookmarksBox #bookmarksTypeBar,\n#bookmarksBox .addForm,\n#bookmarksBox ul .bookmarkFolder .folderLabel,\n#bookmarksBox ul li.bkmrk a {\n	border-bottom-width:1px;\n}\n#bookmarksBox ul .bookmarkFolder{\n	border-right-width:1px;\n	border-left-width:1px;\n}\n#bookmarksBox #topBar *,\n#bookmarksBox #bookmarksTypeBar *,\n#bookmarksBox .addForm *,\n#bookmarksBox ul li.bkmrk{\n	border-left-width:1px;\n}\n#bookmarksBox #topBar,\n#bookmarksBox #bookmarksTypeBar,\n#bookmarksBox .addForm,\n#bookmarksBox ul .bookmarksRemoveFrom{\n	border-right-width:1px;\n}\n#bookmarksBox ul .bookmarkFolder.othersBookmarks li.bkmrk,\n#bookmarksBox ul .bookmarkFolder .folderLabel .bookmarksRemoveFrom{\n	border-left-width:0;\n}\n#bkmrksTrigger{\n	display:block;\n	position:absolute;\n	overflow:hidden;\n	top:0;\n	left:277px;\n	width:47px;\n	margin-top:-36px;\n	height:64px;\n	height:0;\n	cursor:pointer;\n	z-index:2999;\n	background-position:center bottom;\n	background-repeat:no-repeat;\n	transition:margin-top 100ms ease-in-out;\n	text-indent:-100%;\n	text-decoration:none;\n	text-align:center;\n}\n#bkmrksTrigger:hover{\n	margin-top:0;\n}\n#sidebar #portaldetails h3.title{\n	width:auto;\n}\n.portal-list-bookmark span {\n	display:inline-block;\n	margin: -3px;\n	width:16px;\n	height:15px;\n	overflow:hidden;\n	background-repeat:no-repeat;\n	cursor:pointer;\n}\n#bkmrksTrigger, .bkmrksStar span, .portal-list-bookmark span {\n	background-image:url(data:image/png;base64,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);\n}\n.bkmrksStar span{\n	display:inline-block;\n	float:left;\n	margin:3px 1px 0 4px;\n	width:16px;\n	height:15px;\n	overflow:hidden;\n	background-repeat:no-repeat;\n}\n.bkmrksStar span, .bkmrksStar.favorite:focus span{\n	background-position:left top;\n}\n.bkmrksStar:focus span, .bkmrksStar.favorite span, .portal-list-bookmark.favorite span{\n	background-position:right top;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder{\n	overflow:hidden;\n	margin-top:-1px;\n	height:auto;\n	background:rgba(8,58,78,.7);\n}\n#bookmarksBox .bookmarkList ul li.sortable-placeholder{\n	box-shadow:inset -1px 0 0 #20a8b1,inset 1px 0 0 #20a8b1,0 -1px 0 #20a8b1;\n	background:rgba(8,58,78,.9);\n}\n#bookmarksBox .bookmarkList .bkmrk.ui-sortable-helper{\n	border-right-width:1px;\n	border-left-width:1px !important;\n}\n#bookmarksBox .bookmarkList ul li ul li.sortable-placeholder{\n	height:23px;\n	box-shadow:inset 0 -1px 0 #20a8b1,inset 1px 0 0 #20a8b1;\n}\n\n#bookmarksBox .bookmarkList ul li.bookmarkFolder.ui-sortable-helper,\n#bookmarksBox .bookmarkList ul li.othersBookmarks ul li.sortable-placeholder{\n	box-shadow:inset 0 -1px 0 #20a8b1;\n}\n\n#bookmarksBox #topBar #bookmarksDel,\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel:hover .bookmarksRemoveFrom,\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel:hover .bookmarksAnchor{\n	border-bottom-width:1px;\n}\n\n/*---------*/\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span,\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > span,\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > span > span,\n#bookmarksBox .bookmarkList .triangle{\n	width:0;\n	height:0;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel{\n	overflow:visible;\n	height:25px;\n	cursor:pointer;\n	background:#069;\n	text-indent:0;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > *{\n	height:25px;\n	float:left;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor{\n	line-height:25px;\n	color:#fff;\n	width:90%;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span{\n	float:left;\n	border-width:5px 0 5px 7px;\n	border-color:transparent transparent transparent white;\n	margin:7px 7px 0 6px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.open .folderLabel .bookmarksAnchor span{\n	margin:9px 5px 0 5px;\n	border-width:7px 5px 0 5px;\n	border-color:white transparent transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > span,\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > span > span{\n	display:none;\n	border-width:0 12px 10px 0;\n	border-color:transparent #20a8b1 transparent transparent;\n	margin:-20px 0 0;\n	position:relative;\n	top:21px;\n	left:219px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel > span > span{\n	top:18px;\n	left:0;\n	border-width:0 10px 9px 0;\n	border-color:transparent #069 transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.open .folderLabel > span,\n#bookmarksBox .bookmarkList .bookmarkFolder.open .folderLabel > span > span{\n	display:block;\n	display:none;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.open .folderLabel:hover > span > span{\n	border-color:transparent #036 transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel:hover .bookmarksAnchor{\n	background:#036;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder ul{\n	display:none;\n	margin-left:10%;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.open ul{\n	display:block;\n	min-height:22px;\n}\n#bookmarksBox .bookmarkFolder.othersBookmarks ul{\n	margin-left:0;\n}\n\n/*---- Width for deleteMode -----*/\n#bookmarksBox .bookmarksRemoveFrom{\n	display:none !important;\n}\n#bookmarksBox.deleteMode .bookmarksRemoveFrom{\n	display:block !important;\n}\n\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor,\n#bookmarksBox ul .bookmarksLink,\n#bookmarksBox ul .othersBookmarks .bookmarksLink{\n	width:100% !important;\n}\n\n#bookmarksBox.deleteMode .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor,\n#bookmarksBox.deleteMode ul .bookmarksLink,\n#bookmarksBox.deleteMode ul .othersBookmarks .bookmarksLink{\n	width:90% !important;\n}\n\n/**********************************************\n	MOBILE\n**********************************************/\n#bookmarksBox.mobile{\n	position:absolute !important;\n	width: 100% !important;\n	height: 100% !important;\n	top: 0 !important;\n	left: 0 !important;\n	margin: 0 !important;\n	padding: 0 !important;\n	border: 0 !important;\n	background: transparent !important;\n	overflow:auto !important;\n}\n#bookmarksBox.mobile .bookmarkList ul,\n#bookmarksBox.mobile .bookmarkList ul li,\n#bookmarksBox.mobile .bookmarkList.current,\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder.open ul{\n	width:100% !important;\n	display:block !important;\n}\n#bookmarksBox.mobile *{\n	box-shadow:none !important;\n	border-width:0 !important;\n}\n#bookmarksBox.mobile #topBar #bookmarksMin,\n#bookmarksBox.mobile #topBar .handle{\n	display:none !important;\n}\n\n#bookmarksBox.mobile #bookmarksTypeBar h5{\n	cursor:pointer;\n	text-align:center;\n	float:left;\n	width:50%;\n	height:auto !important;\n	padding:7px 0;\n}\n#bookmarksBox.mobile #bookmarksTypeBar h5.current{\n	cursor:default;\n	color:#fff;\n}\n#bookmarksBox.mobile #bookmarksTypeBar,\n#bookmarksBox.mobile .bookmarkList .addForm{\n	border-bottom:1px solid #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList ul li ul li.bkmrk,\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder .folderLabel{\n	height:36px !important;\n	clear:both;\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder .folderLabel a,\n#bookmarksBox.mobile .bookmarkList ul li ul li.bkmrk a{\n	background:none;\n	padding:7px 0;\n	height:auto;\n	box-shadow:inset 0 1px 0 #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder a.bookmarksRemoveFrom,\n#bookmarksBox.mobile .bookmarkList li.bkmrk a.bookmarksRemoveFrom{\n	box-shadow:inset 0 1px 0 #20a8b1,inset -1px 0 0 #20a8b1 !important;\n	width:10%;\n	background:none !important;\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder a.bookmarksAnchor,\n#bookmarksBox.mobile .bookmarkList li.bkmrk a.bookmarksLink{\n	text-indent:10px;\n	height:36px;\n	line-height:24px;\n	overflow:hidden;\n}\n#bookmarksBox.mobile .bookmarkList ul li.bookmarkFolder ul{\n	margin-left:0 !important;\n}\n#bookmarksBox.mobile .bookmarkList > ul{\n	border-bottom:1px solid #20a8b1 !important;\n}\n\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder.othersBookmarks  ul{\n	border-top:5px solid #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder,\n#bookmarksBox.mobile .bookmarkList li.bkmrk{\n	box-shadow:inset 0 1px 0 #20a8b1, 1px 0 0 #20a8b1, -1px 1px 0 #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList > ul{\n	max-height:none;\n/*	width:85% !important;*/\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder .folderLabel{\n	box-shadow:0 1px 0 #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList ul li.bookmarkFolder ul{\n	width:90% !important;\n	margin-left:10% !important;\n}\n#bookmarksBox.mobile .bookmarkList ul li.bookmarkFolder.othersBookmarks ul{\n	width:100% !important;\n	margin-left:0% !important;\n}\n#bookmarksBox.mobile{\n	margin-bottom:5px !important;\n}\n#bookmarksBox.mobile #bookmarksTypeBar{\n	height:auto;\n}\n#bookmarksBox.mobile .addForm,\n#bookmarksBox.mobile .addForm *{\n	height:35px !important;\n	padding:0;\n}\n#bookmarksBox.mobile .addForm a{\n	line-height:37px;\n}\n\n#bookmarksBox.mobile .addForm a{\n/*	width:25% !important;*/\n}\n#bookmarksBox.mobile .addForm input{\n/*	width:50% !important;*/\n	text-indent:10px;\n}\n#bookmarksBox.mobile #bkmrk_portals .addForm input{\n/*	width:75% !important;*/\n}\n#bookmarksBox.mobile #bookmarksTypeBar h5,\n#bookmarksBox.mobile .bookmarkList .addForm a{\n	box-shadow:-1px 0 0 #20a8b1 !important;\n}\n#bookmarksBox.mobile .bookmarkList li.bookmarkFolder ul{\n	display:none !important;\n	min-height:37px !important;\n}\n#updatestatus .bkmrksStar{\n	float:left;\n	margin:-19px 0 0 -5px;\n	padding:0 3px 1px 4px;\n	background:#262c32;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span,\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel > span,\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel > span > span,\n#bookmarksBox.mobile .bookmarkList .triangle{\n	width:0 !important;\n	height:0 !important;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span{\n	float:left !important;\n	border-width:5px 0 5px 7px !important;\n	border-color:transparent transparent transparent white !important;\n	margin:7px 3px 0 13px !important;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder.open .folderLabel .bookmarksAnchor span{\n	margin:9px 1px 0 12px !important;\n	border-width:7px 5px 0 5px !important;\n	border-color:white transparent transparent transparent !important;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel > span,\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel > span > span{\n	display:none !important;\n	border-width:0 12px 10px 0 !important;\n	border-color:transparent #20a8b1 transparent transparent !important;\n	margin:-20px 0 0 100% !important;\n	position:relative !important;\n	top:21px !important;\n	left:-10px !important;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder .folderLabel > span > span{\n	top:18px !important;\n	left:0 !important;\n	border-width:0 10px 9px 0 !important;\n	border-color:transparent #069 transparent transparent !important;\n}\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder.open .folderLabel > span,\n#bookmarksBox.mobile .bookmarkList .bookmarkFolder.open .folderLabel > span > span{\n	display:block !important;\n}\n\n/**********************************************\n	DIALOG BOX\n**********************************************/\n/*---- Auto Drawer -----*/\n#bkmrksAutoDrawer,\n#bkmrksAutoDrawer p,\n#bkmrksAutoDrawer a{\n	display:block;\n	padding:0;\n	margin:0;\n}\n#bkmrksAutoDrawer .bookmarkFolder{\n	margin-bottom:4px;\n	border:1px solid #20a8b1;\n}\n#bkmrksAutoDrawer .folderLabel{\n	background:#069;\n	padding:4px 0;\n	color:#fff;\n}\n#bkmrksAutoDrawer .bookmarkFolder div{\n	border-top:1px solid #20a8b1;\n	padding:6px 0;\n	background:rgba(0,0,0,0.3);\n}\n#bkmrksAutoDrawer .bookmarkFolder#idOthers .folderLabel{\n	display:none;\n}\n#bkmrksAutoDrawer .bookmarkFolder#idOthers div{\n	display:block;\n	border-top:none;\n}\n#bkmrksAutoDrawer a{\n	text-indent:10px;\n	padding:2px 0;\n}\n#bkmrksAutoDrawer .longdistance {\n	color: #FFCC00;\n	font-weight: bold;\n	border-bottom: 1px dashed currentColor;\n}\n#bkmrksAutoDrawer .bookmarkFolder div {\n	display:none;\n}\n#bkmrksAutoDrawer a.bkmrk.selected{\n	color:#03dc03;\n}\n\n/*---- Options panel -----*/\n#bkmrksSetbox a{\n	display:block;\n	color:#ffce00;\n	border:1px solid #ffce00;\n	padding:3px 0;\n	margin:10px auto;\n	width:80%;\n	text-align:center;\n	background:rgba(8,48,78,.9);\n}\n#bkmrksSetbox a.disabled,\n#bkmrksSetbox a.disabled:hover{\n	color:#666;\n	border-color:#666;\n	text-decoration:none;\n}\n/*---- Opt panel - copy -----*/\n.ui-dialog-bkmrksSet-copy textarea{\n	width:96%;\n	height:120px;\n	resize:vertical;\n}\n\n\n/*--- Other Opt css ---*/\n#bookmarksBox.mobile a.bookmarksMoveIn{\n	display:none !important;\n}\n\n#bookmarksBox.mobile .bookmarkList ul li ul li.bkmrk a.bookmarksMoveIn{\n	background:none !important;\n	text-align:center;\n	color:#fff;\n	box-shadow: inset 0 1px 0 #20A8B1,inset -1px 0 0 #20A8B1 !important;\n	width:10%;\n}\n\n#bookmarksBox.mobile.moveMode a.bookmarksMoveIn{\n	display:block !important;\n}\n\n#bookmarksBox.moveMode ul .bookmarksLink,\n#bookmarksBox.moveMode ul .othersBookmarks .bookmarksLink{\n	width:90% !important;\n}\n.bookmarksDialog h3{\n	text-transform:capitalize;margin-top:10px;\n}\n.bookmarksDialog .bookmarkFolder{\n	margin-bottom:4px;\n	border:1px solid #20a8b1;\n	background:#069;\n	padding:4px 10px;\n	color:#fff;\n	cursor:pointer;\n}\n.bookmarksDialog .bookmarkFolder:hover{\n	text-decoration:underline;\n}\n\n#bookmarksBox.mobile #topBar .btn{\n	width:100%;height:45px !important;\n	font-size:13px;\n	color:#fff;\n	font-weight:normal;\n	padding-top:17px;\n	text-indent:0 !important;\n}\n#bookmarksBox.mobile .btn{\n	width:50% !important;\n	background:#222;\n}\n#bookmarksBox.mobile .btn.left{\n	border-right:1px solid #20a8b1 !important;\n}\n#bookmarksBox.mobile .btn#bookmarksMove{\n	background:#B42E2E;\n}\n#bkmrksSetbox{\n	text-align:center;\n}\n').appendTo('head');
  }

  window.plugin.bookmarks.setupPortalsList = function() {
    function onBookmarkChanged(data) {
      console.log(data, data.target, data.guid);

      if(data.target == "portal" && data.guid) {
        if(plugin.bookmarks.findByGuid(data.guid))
          $('[data-list-bookmark="'+data.guid+'"]').addClass("favorite");
        else
          $('[data-list-bookmark="'+data.guid+'"]').removeClass("favorite");
      } else {
        $('[data-list-bookmark]').each(function(i, element) {
          var guid = element.getAttribute("data-list-bookmark");
          if(plugin.bookmarks.findByGuid(guid))
            $(element).addClass("favorite");
          else
            $(element).removeClass("favorite");
        });
      }
    }

    window.addHook('pluginBkmrksEdit', onBookmarkChanged);
    window.addHook('pluginBkmrksSyncEnd', onBookmarkChanged);

    window.plugin.portalslist.fields.unshift({ // insert at first column
      title: "",
      value: function(portal) { return portal.options.guid; }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
      sort: function(guidA, guidB) {
        var infoA = plugin.bookmarks.findByGuid(guidA);
        var infoB = plugin.bookmarks.findByGuid(guidB);
        if(infoA && !infoB) return 1;
        if(infoB && !infoA) return -1;
        return 0;
      },
      format: function(cell, portal, guid) {
        $(cell)
          .addClass("portal-list-bookmark")
          .attr("data-list-bookmark", guid);

        // for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
        $('<span>').appendTo(cell)[0].addEventListener("click", function() {
          if(window.plugin.bookmarks.findByGuid(guid)) {
            window.plugin.bookmarks.switchStarPortal(guid);
          } else {
            var ll = portal.getLatLng();
            plugin.bookmarks.addPortalBookmark(guid, ll.lat+','+ll.lng, portal.options.data.title);
          }
        }, false);

        if(plugin.bookmarks.findByGuid(guid))
          cell.className += " favorite";
      },
    });
  }

  window.plugin.bookmarks.setupContent = function() {
    plugin.bookmarks.htmlBoxTrigger = '<a id="bkmrksTrigger" class="open" onclick="window.plugin.bookmarks.switchStatusBkmrksBox(\'switch\');return false;" accesskey="v" title="顯示書籤視窗 [v]">[-] Bookmarks</a>';
    plugin.bookmarks.htmlBkmrksBox = '<div id="bookmarksBox">'
                          +'<div id="topBar">'
                            +'<a id="bookmarksMin" class="btn" onclick="window.plugin.bookmarks.switchStatusBkmrksBox(0);return false;" title="最小化 [v]">-</a>'
                            +'<div class="handle">...</div>'
                            +'<a id="bookmarksDel" class="btn" onclick="window.plugin.bookmarks.deleteMode();return false;" title="顯示/隱藏 \'X\' 按鈕">顯示/隱藏 "X" 按鈕</a>'
                          +'</div>'
                          +'<div id="bookmarksTypeBar">'
                            +'<h5 class="bkmrk_maps current" onclick="window.plugin.bookmarks.switchPageBkmrksBox(this, 0);return false">地圖</h5>'
                            +'<h5 class="bkmrk_portals" onclick="window.plugin.bookmarks.switchPageBkmrksBox(this, 1);return false">能量塔</h5>'
                            +'<div style="clear:both !important;"></div>'
                          +'</div>'
                          +'<div id="bkmrk_maps" class="bookmarkList current">'
                            +'<div class="addForm">'
                              +'<input placeholder="輸入標籤名稱" />'
                              +'<a class="newMap" onclick="window.plugin.bookmarks.addElement(this, \'map\');return false;">+ 地圖</a>'
                              +'<a class="newFolder" onclick="window.plugin.bookmarks.addElement(this, \'folder\');return false;">+ 資料夾</a>'
                            +'</div>'
                          +'</div>'
                          +'<div id="bkmrk_portals" class="bookmarkList">'
                            +'<div class="addForm">'
                              +'<input placeholder="輸入標籤名稱" />'
                              +'<a class="newFolder" onclick="window.plugin.bookmarks.addElement(this, \'folder\');return false;">+ 資料夾</a>'
                            +'</div>'
                          +'</div>'
                          +'<div style="border-bottom-width:1px;"></div>'
                        +'</div>';

    plugin.bookmarks.htmlDisabledMessage = '<div title="Your browser do not support localStorage">Plugin Bookmarks disabled*.</div>';
    plugin.bookmarks.htmlStar = '<a class="bkmrksStar" accesskey="b" onclick="window.plugin.bookmarks.switchStarPortal();return false;" title="將這個能量塔加入書籤 [b]"><span></span></a>';
    plugin.bookmarks.htmlCalldrawBox = '<a onclick="window.plugin.bookmarks.dialogDrawer();return false;" accesskey="q" title="在標記的能量塔上自動產生 連線/三角形 [q]">自動繪圖</a>';
    plugin.bookmarks.htmlCallSetBox = '<a onclick="window.plugin.bookmarks.manualOpt();return false;">書籤選項</a>';
    plugin.bookmarks.htmlMoveBtn = '<a id="bookmarksMove" class="btn" onclick="window.plugin.bookmarks.moveMode();return false;">顯示/隱藏 "移動" 按鈕</a>'

    var actions = '';
    actions += '<a onclick="window.plugin.bookmarks.optReset();return false;">重置書籤</a>';
    actions += '<a onclick="window.plugin.bookmarks.optCopy();return false;">複製書籤</a>';
    actions += '<a onclick="window.plugin.bookmarks.optPaste();return false;">貼上書籤</a>';

    if(plugin.bookmarks.isAndroid()) {
      actions += '<a onclick="window.plugin.bookmarks.optImport();return false;">匯入書籤</a>';
      actions += '<a onclick="window.plugin.bookmarks.optExport();return false;">匯出書籤</a>';
    }
    actions += '<a onclick="window.plugin.bookmarks.optRenameF();return false;">重新命名資料夾</a>'
    if(!plugin.bookmarks.isAndroid()) {
      actions += '<a onclick="window.plugin.bookmarks.optBox(\'save\');return false;">儲存小視窗位置</a>';
      actions += '<a onclick="window.plugin.bookmarks.optBox(\'reset\');return false;">重置小視窗位置</a>';
    }
    plugin.bookmarks.htmlSetbox = '<div id="bkmrksSetbox">' + actions + '</div>';
  }

/***************************************************************************************************************************************************************/

  var setup = function() {
    window.plugin.bookmarks.isSmart = window.isSmartphone();

    // Fired when a bookmarks/folder is removed, added or sorted, also when a folder is opened/closed.
    if($.inArray('pluginBkmrksEdit', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksEdit'); }
    // Fired when the "Bookmarks Options" panel is opened (you can add new options);
    if($.inArray('pluginBkmrksOpenOpt', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksOpenOpt'); }
    // Fired when the sync is finished;
    if($.inArray('pluginBkmrksSyncEnd', window.VALID_HOOKS) < 0) { window.VALID_HOOKS.push('pluginBkmrksSyncEnd'); }

    // If the storage not exists or is a old version
    window.plugin.bookmarks.createStorage();
    window.plugin.bookmarks.upgradeToNewStorage();

    // Load data from localStorage
    window.plugin.bookmarks.loadStorage();
    window.plugin.bookmarks.loadStorageBox();
    window.plugin.bookmarks.setupContent();
    window.plugin.bookmarks.setupCSS();

    if(!window.plugin.bookmarks.isSmart) {
      $('body').append(window.plugin.bookmarks.htmlBoxTrigger + window.plugin.bookmarks.htmlBkmrksBox);
      $('#bookmarksBox').draggable({ handle:'.handle', containment:'window' });
      $("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox ul li a span, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();
      $('#bookmarksBox').css({'top':window.plugin.bookmarks.statusBox.pos.x, 'left':window.plugin.bookmarks.statusBox.pos.y});
    }else{
      $('body').append(window.plugin.bookmarks.htmlBkmrksBox);
      $('#bookmarksBox').css("display", "none").addClass("mobile");

      if(window.useAndroidPanes())
        android.addPane("plugin-bookmarks", "書籤", "ic_action_star");
      window.addHook('paneChanged', window.plugin.bookmarks.onPaneChanged);
    }
    $('#toolbox').append(window.plugin.bookmarks.htmlCallSetBox+window.plugin.bookmarks.htmlCalldrawBox);

    if(window.plugin.bookmarks.isSmart) {
//      $('#bookmarksBox.mobile #topBar').prepend(window.plugin.bookmarks.htmlCallSetBox+window.plugin.bookmarks.htmlCalldrawBox); // wonk in progress
      $('#bookmarksBox.mobile #topBar').append(plugin.bookmarks.htmlMoveBtn);
    }

    window.plugin.bookmarks.loadList('maps');
    window.plugin.bookmarks.loadList('portals');
    window.plugin.bookmarks.jquerySortableScript();

    if(window.plugin.bookmarks.statusBox['show'] === 0) { window.plugin.bookmarks.switchStatusBkmrksBox(0); }
    if(window.plugin.bookmarks.statusBox['page'] === 1) { $('#bookmarksBox h5.bkmrk_portals').trigger('click'); }

    window.addHook('portalSelected', window.plugin.bookmarks.onPortalSelected);
    window.addHook('search', window.plugin.bookmarks.onSearch);

    // Sync
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.syncBkmrks);
    window.addHook('iitcLoaded', window.plugin.bookmarks.registerFieldForSyncing);

    // Highlighter - bookmarked portals
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.highlightRefresh);
    window.addHook('pluginBkmrksSyncEnd', window.plugin.bookmarks.highlightRefresh);
    window.addPortalHighlighter('能量塔書籤', window.plugin.bookmarks.highlight);

    // Layer - Bookmarked portals
    window.plugin.bookmarks.starLayerGroup = new L.LayerGroup();
    window.addLayerGroup('能量塔書籤', window.plugin.bookmarks.starLayerGroup, false);
    window.plugin.bookmarks.addAllStars();
    window.addHook('pluginBkmrksEdit', window.plugin.bookmarks.editStar);
    window.addHook('pluginBkmrksSyncEnd', window.plugin.bookmarks.resetAllStars);

    if(window.plugin.portalslist) {
      window.plugin.bookmarks.setupPortalsList();
    } else {
      setTimeout(function() {
        if(window.plugin.portalslist)
          window.plugin.bookmarks.setupPortalsList();
      }, 500);
    }
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


