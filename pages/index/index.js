// index.js
const { TILE_TYPES, JIHAI_TYPES } = require('../../utils/constants.js')
const { calculateScore } = require('../../utils/scoreCalculator.js')

Page({
  data: {
    concealedTiles: [],
    meldedTiles: [],
    winningTile: null,
    hand: [],
    currentTarget: 'concealed', // 默认选择暗手区域
    options: {
      isTsumo: false,
      isRiichi: false,
      isDoubleRiichi: false,
      isIppatsu: false,
      doraCount: 0,
      uradoraCount: 0,
      seatWind: 'EAST',
      roundWind: 'EAST',
      isDealer: false    // 是否为庄家
    },
    score: null,
    yaku: [],
    tileTypes: TILE_TYPES,
    jihaiTypes: JIHAI_TYPES,
    windValues: ['EAST', 'SOUTH', 'WEST', 'NORTH'],
    windDisplayValues: ['东', '南', '西', '北'],
  },

  // 切换目标区域
  switchTarget(e) {
    const { target } = e.currentTarget.dataset;
    
    this.setData({ currentTarget: target });
  },

  handleTileSelect(e) {
    const { type, number, value } = e.currentTarget.dataset;
    console.log(e.currentTarget)
    const newTile = type === 'JIHAI' ? { type, value } : { type, number };
    
    // 使用当前选择的目标区域
    switch(this.data.currentTarget) {
      case 'concealed':
        if (this.data.hand.length>=14||this.data.concealedTiles.length +this.data.meldedTiles.length>= 13) {
          wx.showToast({ title: '手牌已满', icon: 'none' });
          return;
        }
        this.addTile('concealedTiles', newTile);
        break;
      case 'melded':
        if (this.data.hand.length>=14||this.data.meldedTiles.length+this.data.concealedTiles.length >= 13) {
          wx.showToast({ title: '手牌已满', icon: 'none' });
          return;
        }
        this.addTile('meldedTiles', newTile);
        break;
      case 'winning':
        if (this.data.hand.length>=14||this.data.winningTile>=1) {
          wx.showToast({ title: '手牌已满', icon: 'none' });
          return;
        }
        this.setData({ winningTile: newTile });
        break;
    }

    // 更新总hand
    this.updateHand();
  },

  // 添加牌到指定区域
  addTile(target, tile) {
    const tiles = this.data[target];
    const sortedTiles = this.sortHand([...tiles, tile]);
    this.setData({ [target]: sortedTiles });
  },

  // 更新总hand
  updateHand() {
    const { concealedTiles, meldedTiles, winningTile } = this.data;
    const hand = [
      ...concealedTiles,
      ...meldedTiles,
      ...(winningTile ? [winningTile] : [])
    ];
    this.setData({ hand });
  },

  handleOptionChange(e) {
    const { field } = e.currentTarget.dataset;
    let value = e.detail.value;
    
    // 对于风位的特殊处理
    if (field === 'seatWind' || field === 'roundWind') {
      value = this.data.windValues[value];
    }
    console.log(field,value)
    this.setData({
      [`options.${field}`]: value
    });
  },

  calculateScore() {
    const result = calculateScore(this.data.hand, this.data.concealedTiles, this.data.meldedTiles, this.data.winningTile, this.data.options);
    console.log(result)
    this.setData({
      score: result.score,
      yaku: result.yaku
    });
  },

  // 从指定区域移除牌
  removeTile(e) {
    const { index, target } = e.currentTarget.dataset;
    // 将target映射到正确的数据属性名
    const targetMap = {
      'concealed': 'concealedTiles',
      'melded': 'meldedTiles',
      'winning': 'winningTile'
    };
    
    const actualTarget = targetMap[target];
    
    if (!actualTarget) {
      console.error('Invalid target:', target);
      return;
    }

    if (target === 'winning') {
      this.setData({ winningTile: null });
    } else {
      const currentTiles = this.data[actualTarget] || [];
      const tiles = currentTiles.filter((_, i) => i !== index);
      this.setData({ [actualTarget]: tiles });
    }
    
    this.updateHand();
  },

  // 手牌排序函数
  sortHand(hand) {
    const tileOrder = {
      MANZU: 0,
      PINZU: 1,
      SOUZU: 2,
      JIHAI: 3
    };
    
    const jihaiOrder = {
      EAST: 0,
      SOUTH: 1,
      WEST: 2,
      NORTH: 3,
      WHITE: 4,
      GREEN: 5,
      RED: 6
    };
    
    return hand.sort((a, b) => {
      if (a.type !== b.type) {
        return tileOrder[a.type] - tileOrder[b.type];
      }
      if (a.type === 'JIHAI') {
        return jihaiOrder[a.value] - jihaiOrder[b.value];
      }
      return a.number - b.number;
    });
  },

  clearHand() {
    this.setData({ hand: [], concealedTiles: [], meldedTiles: [], winningTile: null });
  }
})
