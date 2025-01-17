const { YAKU, BASE_POINTS, FU,TILE_TYPES } = require('./constants.js');

// 计算点数的主函数
function calculateScore(hand, concealedTiles, meldedTiles, winningTile, options) {
  // 检查输入数据的有效性
  if (!Array.isArray(hand) || !options) {
    return {
      error: '输入数据无效'
    };
  }

  // 1. 检查和牌是否成立
  if (!isValidWinningHand(hand)) {
    return {
      error: '不是有效的和牌'
    };
  }

  // 2. 获取所有成立的役种
  const yakuList = getYakuList(hand, concealedTiles, meldedTiles, winningTile, options);
  console.log("yakuList:",yakuList)
  if (yakuList.length === 0) {
    return {
      error: '无役'
    };
  }

  // 3. 计算总番数
  let totalHan = calculateTotalHan(yakuList);
  // 4. 计算符数
  const fu = calculateFu(hand, concealedTiles, meldedTiles, winningTile, options);
  totalHan+=Number(options.doraCount)+Number(options.uradoraCount);

  // 5. 计算最终点数
  const total = calculateFinalScore(totalHan, fu, options,yakuList);
  return {
    score: {    
      total:total,
      han: totalHan,
      fu:fu
    },
    yaku: yakuList
  };
}

// 检查和牌是否成立
function isValidWinningHand(hand) {
  if (!Array.isArray(hand) || hand.length !== 14) return false;
  
  // 检查每张牌的数据格式是否正确
  const isValidTile = hand.every(tile => {
    if (!tile || !tile.type) return false;
    if (tile.type === 'JIHAI') return !!tile.value;
    return !!tile.number;
  });
  
  if (!isValidTile) return false;
  
  // 检查三种和牌方式
  return isStandardWin(hand) || isSevenPairs(hand) || isKokushiMusou(hand);
}

// 检查标准和牌（四面子一雀头）
function isStandardWin(hand) {
  // 先尝试所有可能的雀头
  const tiles = groupTiles(hand);
  
  for (const [key, count] of Object.entries(tiles)) {
    if (count >= 2) {
      // 移除这对牌，检查剩余牌能否组成四组面子
      const remainingTiles = { ...tiles };
      remainingTiles[key] -= 2;
      if (canFormMentsu(remainingTiles, 4)) {
        return true;
      }
    }
  }
  return false;
}

// 检查七对子
function isSevenPairs(hand) {
  const tiles = groupTiles(hand);
  return Object.values(tiles).every(count => count === 2) && 
         Object.keys(tiles).length === 7;
}

// 检查国士无双
function isKokushiMusou(hand) {
  const terminals = ['1m', '9m', '1p', '9p', '1s', '9s', 
                    'EAST', 'SOUTH', 'WEST', 'NORTH', 
                    'WHITE', 'GREEN', 'RED'];
  const tiles = groupTiles(hand);
  
  // 检查是否只包含幺九牌和字牌
  for (const tile of Object.keys(tiles)) {
    if (!terminals.includes(getTileKey(tile))) {
      return false;
    }
  }
  
  // 检查是否有一个对子，其他都是单张
  let hasPair = false;
  for (const count of Object.values(tiles)) {
    if (count > 2) return false;
    if (count === 2) {
      if (hasPair) return false;
      hasPair = true;
    }
  }
  
  return hasPair && Object.keys(tiles).length === 13;
}

// 辅助函数：将手牌转换为计数对象
function groupTiles(hand) {
  if (!Array.isArray(hand)) return {};
  
  const tiles = {};
  hand.forEach(tile => {
    const key = getTileKey(tile);
    if (key) {  // 只处理有效的键值
      tiles[key] = (tiles[key] || 0) + 1;
    }
  });
  return tiles;
}

// 辅助函数：获取牌的键值
function getTileKey(tile) {
  if (!tile || !tile.type) return null;
  
  if (tile.type === 'JIHAI') {
    if (!tile.value) return null;
    return tile.value;
  }
  if (!tile.number) return null;
  return `${tile.number}${tile.type.charAt(0).toLowerCase()}`;
}

// 检查是否能组成指定数量的面子
function canFormMentsu(tiles, count) {
  if (count === 0) {
    return Object.values(tiles).every(v => v === 0);
  }
  
  // 尝试所有可能的面子组合
  for (const [key, value] of Object.entries(tiles)) {
    // 尝试刻子
    if (value >= 3) {
      const newTiles = { ...tiles };
      newTiles[key] -= 3;
      if (canFormMentsu(newTiles, count - 1)) {
        return true;
      }
    }
    
    // 尝试顺子（只对数字牌）
    if (key.match(/\d[mps]/)) {
      const suit = key.charAt(1);
      const num = parseInt(key.charAt(0));
      if (num <= 7 && 
          tiles[`${num + 1}${suit}`] > 0 && 
          tiles[`${num + 2}${suit}`] > 0) {
        const newTiles = { ...tiles };
        newTiles[key]--;
        newTiles[`${num + 1}${suit}`]--;
        newTiles[`${num + 2}${suit}`]--;
        if (canFormMentsu(newTiles, count - 1)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 获取成立的役种列表
function getYakuList(hand, concealedTiles, meldedTiles, winningTile, options) {
  const yakuList = [];
  //分解正确
  const mentsuList = decomposeHand(hand,concealedTiles,meldedTiles,winningTile);
  console.log("mentsuList:",mentsuList)

  // 特殊和牌类型判定
  //如果是国士无双形式
  if (isKokushiMusou(hand)) {
    if (YAKU.KOKUSHI) yakuList.push(YAKU.KOKUSHI);
    return yakuList;
  }
 //如果是七对子形式
  if (isSevenPairs(hand)) {
    if (YAKU.CHIITOITSU) yakuList.push(YAKU.CHIITOITSU);
  }

  // 如果是七对子或国士无双，直接返回
  if (!mentsuList) return yakuList;

  const allTiles = getAllTiles(hand, mentsuList);

  //yakuman判断
  if(isYakuman(mentsuList,hand,yakuList)){
    console.log("yakuList:",yakuList)
      return yakuList;
  }

  // 立直
  if (options.isRiichi && YAKU.RIICHI) yakuList.push(YAKU.RIICHI);
  //double立直
  if (options.isDoubleRiichi && YAKU.DOUBLE_RIICHI) yakuList.push(YAKU.DOUBLE_RIICHI);
  //一发
  if (options.isIppatsu && YAKU.IPPATSU) yakuList.push(YAKU.IPPATSU);
  //门清自摸
  if (options.isTsumo && !options.isNaki && YAKU.TSUMO) yakuList.push(YAKU.TSUMO);

  // 字牌判定（中发白、自风、场风）
  checkYakuhai(allTiles, options, yakuList);

  // 顺子和刻子相关役种
  //如果非副露
  if (!options.isNaki) {
    checkMentsuBasedYaku(mentsuList, yakuList);
  }

  // 断幺九
  if (isTanyao(allTiles)) {
    if (YAKU.TANYAO) yakuList.push(YAKU.TANYAO);
  }

  // 一气通贯
  if (hasIttsu(mentsuList)) {
    const ittsuYaku = options.isNaki ? YAKU.ITTSU_OPEN : YAKU.ITTSU_CLOSED;
    if (ittsuYaku) yakuList.push(ittsuYaku);
  }

  // 混一色/清一色
  const suitType = checkSuitType(allTiles);
  if (suitType === 'chinitsu') {
    const chinitsuYaku = options.isNaki ? YAKU.CHINITSU_OPEN : YAKU.CHINITSU_CLOSED;
    if (chinitsuYaku) yakuList.push(chinitsuYaku);
  } else if (suitType === 'honitsu') {
    const honitsuYaku = options.isNaki ? YAKU.HONITSU_OPEN : YAKU.HONITSU_CLOSED;
    if (honitsuYaku) yakuList.push(honitsuYaku);
  }

  return yakuList;
}

function isYakuman(mentsuList,hand, yakuList) {
    //四暗刻
    const hiddenKoutsu = mentsuList.mentsu.filter(m => 
        m.type === 'KOUTSU' && m.isHidden
      ).length;
      if (hiddenKoutsu == 4) {
        yakuList.push(YAKU.SUUANKOU);
      }
    //大三元
    const sanyuanKoutsu = mentsuList.mentsu.filter(m =>
        m.type === 'KOUTSU' && 
        ['HAK', 'HAT', 'CHU'].includes(m.tile)
    ).length;
    if (sanyuanKoutsu === 3) {
        yakuList.push(YAKU.DAISANGEN);
    }

    //大四喜
    const kazeKoutsu = mentsuList.mentsu.filter(m =>
        m.type === 'KOUTSU' && 
        ['TON', 'NAN', 'SHA', 'PEI'].includes(m.tile)
    ).length;
    if (kazeKoutsu === 4) {
        yakuList.push(YAKU.DAISUUSHI);
    }

    // 清老头 - 所有牌都是19数牌
    const allTerminals = mentsuList.mentsu.every(m =>
        ['1', '9'].includes(m.tile[0]) && 
        ['M', 'P', 'S'].includes(m.tile[1])
    );
    if (allTerminals) {
        yakuList.push(YAKU.CHINROUTOU);
    }

    // 字一色 - 所有牌都是字牌
    const allHonors = mentsuList.mentsu.every(m =>
        ['TON', 'NAN', 'SHA', 'PEI', 'HAK', 'HAT', 'CHU'].includes(m.tile)
    );
    if (allHonors) {
        yakuList.push(YAKU.TSUUIISOU);
    }

    // 四杠子 - 4个杠子
    const kantsuCount = mentsuList.mentsu.filter(m => 
        m.type === 'KANTSU'
    ).length;
    if (kantsuCount === 4) {
        yakuList.push(YAKU.SUUKANTSU);
    }

    // 小四喜 - 3个风牌刻子+1个风牌雀头
    const kazeKoutsuCount = mentsuList.mentsu.filter(m =>
        m.type === 'KOUTSU' && 
        ['TON', 'NAN', 'SHA', 'PEI'].includes(m.tile)
    ).length;
    const kazeToitsu = mentsuList.jantou && 
        ['TON', 'NAN', 'SHA', 'PEI'].includes(mentsuList.jantou.tile);
    if (kazeKoutsuCount === 3 && kazeToitsu) {
        yakuList.push(YAKU.SHOUSUUSHI);
    }

    // 绿一色 - 只使用23468索和发
    const isGreen = mentsuList.mentsu.every(m => {
        const greenTiles = ['2S', '3S', '4S', '6S', '8S', 'HAT'];
        return greenTiles.includes(m.tile);
    }) && (!mentsuList.jantou || 
        ['2S', '3S', '4S', '6S', '8S', 'HAT'].includes(mentsuList.jantou.tile));
    if (isGreen) {
        yakuList.push(YAKU.RYUUIISOU);
    }

    // 九莲宝灯 - 同种数牌1112345678999+任意同种数牌
    const SUITS = ['MANZU', 'PINZU', 'SOUZU'];
    
    SUITS.forEach(suit => { 
        const suitTiles = hand.filter(t => t.type === suit);
        if (suitTiles.length === 14) {
            const counts = Array(10).fill(0);
            suitTiles.forEach(t => counts[t.number]++);
            console.log("counts:",counts)
            if (counts[1] >= 3 && counts[9] >= 3 &&
                counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 &&
                counts[5] >= 1 && counts[6] >= 1 && counts[7] >= 1 && counts[8] >= 1) {
                yakuList.push(YAKU.CHUUREN);
            }
        }
    });
    return yakuList.length > 0;
}

// 检查役牌
function checkYakuhai(tiles, options, yakuList) {
  const counts = {};
  tiles.forEach(tile => {
    if (tile.type === 'JIHAI') {
      counts[tile.value] = (counts[tile.value] || 0) + 1;
    }
  });

  // 三元牌
  if (counts['WHITE'] >= 3) yakuList.push(YAKU.HAKU);
  if (counts['GREEN'] >= 3) yakuList.push(YAKU.HATSU);
  if (counts['RED'] >= 3) yakuList.push(YAKU.CHUN);

  // 自风场风
  if (counts[options.seatWind] >= 3) yakuList.push(YAKU.JIKAZE);
  if (counts[options.roundWind] >= 3) yakuList.push(YAKU.BAKAZE);
}

// 检查面子相关役种
function checkMentsuBasedYaku(mentsuList, yakuList) {
  // 一杯口/二杯口
  const shuntsuPairs = countShuntsuPairs(mentsuList.mentsu);
  if (shuntsuPairs === 2) {
    yakuList.push(YAKU.RYANPEIKOU);
  } else if (shuntsuPairs === 1) {
    yakuList.push(YAKU.IIPEIKO);
  }

  // 对对和
  if (mentsuList.mentsu.every(m => m.type === 'KOUTSU')) {
    yakuList.push(YAKU.TOITOI);
  }

  // 三暗刻
  const hiddenKoutsu = mentsuList.mentsu.filter(m => 
    m.type === 'KOUTSU' && m.isHidden
  ).length;
  if (hiddenKoutsu >= 3) {
    yakuList.push(YAKU.SANANKOU);
  }
}

// 辅助函数：获取所有牌（包括雀头和面子）
function getAllTiles(hand, mentsuList) {

  if (!mentsuList) return hand;
  
  const allTiles = [mentsuList.pair];
  mentsuList.mentsu.forEach(mentsu => {
    if (mentsu.type === 'KOUTSU') {
      allTiles.push(mentsu.tile, mentsu.tile, mentsu.tile);
    } else if (mentsu.type === 'SHUNTSU') {
      allTiles.push(mentsu.tile, mentsu.middle, mentsu.end);
    }
  });
  return allTiles;
}

// 检查是否断幺九
function isTanyao(tiles) {
  return tiles.every(tile => {
    if (tile.type === 'JIHAI') return false;
    return tile.number > 1 && tile.number < 9;
  });
}

// 检查一气通贯
function hasIttsu(mentsuList) {
  if (!mentsuList || !mentsuList.mentsu) return false;

  // 按花色分组所有顺子
  const shuntsuBySuit = {
    MANZU: new Set(),
    PINZU: new Set(),
    SOUZU: new Set()
  };

  // 收集所有顺子的起始数字
  mentsuList.mentsu.forEach(mentsu => {
    if (mentsu.type === 'SHUNTSU') {
      const suit = mentsu.tile.type;
      const startNum = mentsu.tile.number;
      shuntsuBySuit[suit].add(startNum);
    }
  });
  // 检查每种花色是否有123、456、789
  return Object.values(shuntsuBySuit).some(numbers => {
    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

    if (sortedNumbers.length < 3) return false;

    // 检查是否包含1、4、7这三个起始数字
    return sortedNumbers.includes(1) && 
           sortedNumbers.includes(4) && 
           sortedNumbers.includes(7);
  });
}

// 检查清一色/混一色
function checkSuitType(tiles) {
  let hasJihai = false;
  const suits = new Set();
  
  tiles.forEach(tile => {
    if (tile.type === 'JIHAI') {
      hasJihai = true;
    } else {
      suits.add(tile.type);
    }
  });

  if (suits.size === 1) {
    return hasJihai ? 'honitsu' : 'chinitsu';
  }
  return null;
}

// 计算一杯口/二杯口
function countShuntsuPairs(mentsuList) {
  const shuntsuMap = new Map();
  let pairs = 0;

  mentsuList.forEach(mentsu => {
    if (mentsu.type === 'SHUNTSU') {
      const key = `${mentsu.tile.type}${mentsu.tile.number}`;
      shuntsuMap.set(key, (shuntsuMap.get(key) || 0) + 1);
    }
  });

  for (const count of shuntsuMap.values()) {
    pairs += Math.floor(count / 2);
  }

  return pairs;
}

// 计算总番数
function calculateTotalHan(yakuList) {
  if (!Array.isArray(yakuList)) return 0;

  return yakuList.reduce((total, yaku) => {
    if (!yaku) return total;
    if (yaku.yakuman) return total + yaku.yakuman * 13;
    if (typeof yaku.han !== 'number') return total;
    return total + yaku.han;
  }, 0);
}

// 计算符数
function calculateFu(hand,concealedTiles,meldedTiles,winningTile, options) {
  // 七对子固定25符
  if (isSevenPairs(hand)) return 25;
  
  let fu = 20; // 基本符数
  const mentsuList = decomposeHand(hand);
  
  if (!mentsuList) return 0; // 非标准和牌
  
  // 自摸符
  if (options.isTsumo && !isAllSimples(hand)) fu += 2;
  
  // 门清荣和符
  if (!options.isNaki && !options.isTsumo) fu += 10;
  
  // 雀头符
  const pair = mentsuList.pair;
  if (isYakuhai(pair, options)) fu += 2;
  
  // 面子符
  mentsuList.mentsu.forEach(mentsu => {
    if (mentsu.type === 'KOUTSU') { // 刻子
      let value = 2;
      if (mentsu.isHidden) value *= 2; // 暗刻
      if (isTerminalOrHonor(mentsu.tile)) value *= 2; // 幺九牌
      fu += value;
    } else if (mentsu.type === 'KANTSU') { // 杠子
      let value = 8;
      if (mentsu.isHidden) value *= 2; // 暗杠
      if (isTerminalOrHonor(mentsu.tile)) value *= 2; // 幺九牌
      fu += value;
    }
  });
  
  // 边张、坎张、单骑符
  if (mentsuList.winningType === 'PENCHAN' || 
      mentsuList.winningType === 'KANCHAN' ||
      mentsuList.winningType === 'TANKI') {
    fu += 2;
  }
  
  // 符数向上取整到十位
  return Math.ceil(fu / 10) * 10;
}

// 计算最终点数
function calculateFinalScore(han, fu, options,yakuList) {
    if (options.doraCount > 0) {
        yakuList.push({
            ...YAKU.DORA, // 保留 YAKU.DORA 的其他属性
            han: options.doraCount // 修改 han 属性
        });
    }
    if (options.uradoraCount > 0) {
        yakuList.push({
            ...YAKU.URADORA, // 保留 YAKU.DORA 的其他属性
            han: options.uradoraCount // 修改 han 属性
        });
    }
  // 役满
  if (han >= 13) {
    let basePoints = BASE_POINTS.YAKUMAN;
    if(options.isDealer){
        basePoints*=6;
      }else{
        basePoints*=4;
      }
    return basePoints;
  }
  
  // 计算基本点数
  let basePoints = fu * Math.pow(2, han + 2);
  console.log("basePoints:",basePoints)
  // 满贯以上的情况
  if (han >= 11 ) basePoints = BASE_POINTS.SANBAIMAN;
  else if (han >= 8 ) basePoints = BASE_POINTS.BAIMAN;
  else if (han >= 6 ) basePoints = BASE_POINTS.HANEMAN;
  else if (han >= 5 ) basePoints = BASE_POINTS.MANGAN;
  if(options.isDealer){
    basePoints*=6;
  }else{
    basePoints*=4;
  }
  basePoints = Math.ceil(basePoints/100)*100;


  return basePoints;
}

// 计算具体支付点数
function calculatePayment(basePoints, isTsumo) {
    
  // 四家支付点数
  if (isTsumo) {
    // 自摸时，亲家和子家支付不同点数
    return {
      dealerPay: Math.ceil(basePoints/2),
      nonDealerPay: Math.ceil(basePoints / 4)
    };
  } else {
    // 荣和时，放铳者支付全部点数
    return basePoints;
  }
}

// 辅助函数：判断是否为役牌
function isYakuhai(tile, options) {
  if (tile.type !== 'JIHAI') return false;
  return tile.value === options.seatWind ||
         tile.value === options.roundWind ||
         ['WHITE', 'GREEN', 'RED'].includes(tile.value);
}

// 辅助函数：判断是否为幺九牌
function isTerminalOrHonor(tile) {
  if (tile.type === 'JIHAI') return true;
  return tile.number === 1 || tile.number === 9;
}

// 辅助函数：判断是否为断幺九
function isAllSimples(hand) {
  return hand.every(tile => {
    if (tile.type === 'JIHAI') return false;
    return tile.number > 1 && tile.number < 9;
  });
}

// 辅助函数：分解手牌为面子和雀头
function decomposeHand(hand,concealedTiles,meldedTiles,winningTile) {
  // 如果是七对子或国士无双，不需要分解
  if (isSevenPairs(hand) || isKokushiMusou(hand)) return null;
  
  const tiles = groupTiles(hand);
  
  // 尝试每一种可能的雀头
  for (const [pairKey, count] of Object.entries(tiles)) {
    if (count >= 2) {
      const remainingTiles = { ...tiles };
      remainingTiles[pairKey] -= 2;
      
      // 尝试分解剩余的牌
      const mentsuList = findAllMentsu(remainingTiles,concealedTiles,meldedTiles,winningTile);
      if (mentsuList) {
        // 找到有效分解，返回结果
        return {
          pair: keyToTile(pairKey),
          mentsu: mentsuList,
          winningType: determineWinningType(hand, concealedTiles, meldedTiles, winningTile, mentsuList)
        };
      }
    }
  }
  
  return null;
}

// 寻找所有可能的面子组合
function findAllMentsu(tiles, concealedTiles, meldedTiles, winningTile) {
  if (Object.values(tiles).every(v => v === 0)) {
    return [];
  }
  
  // 检查牌是否在暗手中
  function isConcealed(tile,concealedTiles) {
    if (!Array.isArray(concealedTiles) || concealedTiles.length === 0) {
        return false;
    }
    return concealedTiles.some(t => 
      t.type === tile.type && 
      (t.type === 'JIHAI' ? 
        t.value === tile.value : 
        t.number === tile.number)
    );
  }
  
  // 尝试每一种可能的面子
  for (const [key, value] of Object.entries(tiles)) {
    // 尝试刻子
    if (value >= 3) {
      const newTiles = { ...tiles };
      newTiles[key] -= 3;
      const restMentsu = findAllMentsu(newTiles, concealedTiles, meldedTiles, winningTile);
      if (restMentsu !== null) {
        const tileParsed = keyToTile(key);
        // 检查这个刻子的所有牌是否都在暗手中
        const isHidden = isConcealed(tileParsed,concealedTiles);
        
        return [
          { type: 'KOUTSU', tile: tileParsed, isHidden },
          ...restMentsu
        ];
      }
    }
    
    // 尝试顺子（只对数字牌）
    if (key.match(/\d[mps]/)) {
      const suit = key.charAt(1);
      const num = parseInt(key.charAt(0));
      if (num <= 7 && 
          tiles[`${num + 1}${suit}`] > 0 && 
          tiles[`${num + 2}${suit}`] > 0) {
        const newTiles = { ...tiles };
        newTiles[key]--;
        newTiles[`${num + 1}${suit}`]--;
        newTiles[`${num + 2}${suit}`]--;
        const restMentsu = findAllMentsu(newTiles, concealedTiles, meldedTiles, winningTile);
        if (restMentsu !== null) {
          const startTile = keyToTile(key);
          const middleTile = keyToTile(`${num + 1}${suit}`);
          const endTile = keyToTile(`${num + 2}${suit}`);
          
          // 检查顺子的所有牌是否都在暗手中
          const isHidden = isConcealed(startTile,concealedTiles) && 
                          isConcealed(middleTile,concealedTiles) && 
                          isConcealed(endTile,concealedTiles);
          
          return [
            { 
              type: 'SHUNTSU', 
              tile: startTile,
              middle: middleTile,
              end: endTile,
              isHidden 
            },
            ...restMentsu
          ];
        }
      }
    }
  }
  
  return null;
}

// 判断和牌方式（边张、坎张、单骑等）
function determineWinningType(hand, concealedTiles, meldedTiles, winningTile, mentsuList) {
  // 如果没有和牌张，返回null
  if (!winningTile) return null;

  // 单骑判断：如果和牌张能组成对子，且这个对子不是其他面子的一部分
  function isTanki(tiles, winningTile) {
    const pair = tiles.find(tile => 
      tile.type === winningTile.type && 
      (tile.type === 'JIHAI' ? 
        tile.value === winningTile.value : 
        tile.number === winningTile.number)
    );
    // 检查这个对子是否被用在其他面子中
    const isUsedInMentsu = mentsuList.some((t => 
        t.type === pair?.type && 
        (t.type === 'JIHAI' ? 
          t.value === pair.value : 
          t.number === pair.number)
      )
    );

    return pair && !isUsedInMentsu ? 'TANKI' : null;
  }

  // 坎张判断：数字牌中间的牌
  function isKanchan(tiles, winningTile) {
    if (winningTile.type === 'JIHAI') return null;
    
    const hasLower = tiles.some(t => 
      t.type === winningTile.type && 
      t.number === winningTile.number - 1
    );
    
    const hasUpper = tiles.some(t => 
      t.type === winningTile.type && 
      t.number === winningTile.number + 1
    );

    return hasLower && hasUpper ? 'KANCHAN' : null;
  }

  // 边张判断：123的3或789的7
  function isPenchan(tiles, winningTile) {
    if (winningTile.type === 'JIHAI') return null;
    
    // 3张和牌
    if (winningTile.number === 3) {
      const hasOne = tiles.some(t => 
        t.type === winningTile.type && 
        t.number === 1
      );
      const hasTwo = tiles.some(t => 
        t.type === winningTile.type && 
        t.number === 2
      );
      if (hasOne && hasTwo) return 'PENCHAN';
    }
    
    // 7张和牌
    if (winningTile.number === 7) {
      const hasEight = tiles.some(t => 
        t.type === winningTile.type && 
        t.number === 8
      );
      const hasNine = tiles.some(t => 
        t.type === winningTile.type && 
        t.number === 9
      );
      if (hasEight && hasNine) return 'PENCHAN';
    }

    return null;
  }

  // 两面判断：非123的3和非789的7的顺子等待
  function isRyanmen(tiles, winningTile) {
    if (winningTile.type === 'JIHAI') return null;
    
    // 检查是否有相邻的两张牌
    const hasLower = tiles.some(t => 
      t.type === winningTile.type && 
      t.number === winningTile.number - 1
    );
    
    const hasUpper = tiles.some(t => 
      t.type === winningTile.type && 
      t.number === winningTile.number + 1
    );

    // 排除边张和坎张的情况
    if (hasLower && hasUpper && 
        winningTile.number !== 3 && 
        winningTile.number !== 7 && 
        winningTile.number !== 2) {
      return 'RYANMEN';
    }

    return null;
  }

  // 按优先级检查和牌方式
  const checkTypes = [isTanki, isPenchan, isKanchan, isRyanmen];
  
  for (const check of checkTypes) {
    const result = check(concealedTiles, winningTile);
    if (result) return result;
  }

  return 'NORMAL'; // 如果都不是特殊和牌方式，返回普通和牌
}

// 将键值转换回牌对象
function keyToTile(key) {
  if (key.match(/\d[mps]/)) {
    const type = {
      'm': 'MANZU',
      'p': 'PINZU',
      's': 'SOUZU'
    }[key.charAt(1)];
    return {
      type,
      number: parseInt(key.charAt(0))
    };
  } else {
    return {
      type: 'JIHAI',
      value: key
    };
  }
}

module.exports = {
  calculateScore
};