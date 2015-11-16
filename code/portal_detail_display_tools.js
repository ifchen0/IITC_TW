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
    
    if      (mods[i] == '常見 能量塔護盾')     modImage = '@@INCLUDEIMAGE:images/mods/CS.png@@';
    else if (mods[i] == '罕見 能量塔護盾')     modImage = '@@INCLUDEIMAGE:images/mods/RS.png@@';
    else if (mods[i] == '十分罕見 能量塔護盾') modImage = '@@INCLUDEIMAGE:images/mods/VRS.png@@';
    else if (mods[i] == '十分罕見 AXA護盾')  modImage = '@@INCLUDEIMAGE:images/mods/AXAS.png@@';
    else if (mods[i] == '常見 多重入侵')     modImage = '@@INCLUDEIMAGE:images/mods/CMH.png@@';
    else if (mods[i] == '罕見 多重入侵')     modImage = '@@INCLUDEIMAGE:images/mods/RMH.png@@';
    else if (mods[i] == '十分罕見 多重入侵') modImage = '@@INCLUDEIMAGE:images/mods/VRMH.png@@';
    else if (mods[i] == '常見 散熱器')       modImage = '@@INCLUDEIMAGE:images/mods/CHS.png@@';
    else if (mods[i] == '罕見 散熱器')       modImage = '@@INCLUDEIMAGE:images/mods/RHS.png@@';
    else if (mods[i] == '十分罕見 散熱器')   modImage = '@@INCLUDEIMAGE:images/mods/VRHS.png@@';
    else if (mods[i] == '罕見 功率增幅')     modImage = '@@INCLUDEIMAGE:images/mods/FA.png@@';
    else if (mods[i] == '罕見 砲塔')         modImage = '@@INCLUDEIMAGE:images/mods/T.png@@';
    else if (mods[i] == '罕見 連線增幅')     modImage = '@@INCLUDEIMAGE:images/mods/RLA.png@@';
	else if (mods[i] == '十分罕見 連線增幅') modImage = '@@INCLUDEIMAGE:images/mods/VRLA.png@@';
    else if (mods[i] == '十分罕見 SoftBank超連結') modImage = '@@INCLUDEIMAGE:images/mods/SBUL.png@@';
	else modImage = '@@INCLUDEIMAGE:images/mods/none.png@@';
	
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
