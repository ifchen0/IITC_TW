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

  var t = '<span class="help portallevel" title="過濾門泉等級和連線長度. 放大來顯示更多.">';

  if (tileParams.hasPortals) {
    // zoom level includes portals (and also all links/fields)
    if(!window.isSmartphone()) // space is valuable
      t += '<b>Portal</b>: ';
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
