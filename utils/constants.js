// 牌的类型和字牌
const TILE_TYPES = {
  MANZU: 'MANZU',    // 万子
  PINZU: 'PINZU',    // 筒子
  SOUZU: 'SOUZU',    // 索子
  JIHAI: 'JIHAI'     // 字牌
};

const JIHAI_TYPES = {
  EAST: '东',
  SOUTH: '南',
  WEST: '西',
  NORTH: '北',
  WHITE: '白',
  GREEN: '发',
  RED: '中'
};

// 基本点数定义
const BASE_POINTS = {
  MANGAN: 2000,
  HANEMAN: 3000,
  BAIMAN: 4000,
  SANBAIMAN: 6000,
  YAKUMAN: 8000
};

// 役种定义
const YAKU = {
  DORA: { name: '宝牌', han: 1, yakuman: 0 },
  URADORA: { name: '里宝牌', han: 1, yakuman: 0 },
  // 1番
  RIICHI: { name: '立直', han: 1, yakuman: 0 },
  IPPATSU: { name: '一发', han: 1, yakuman: 0 },
  TSUMO: { name: '门前清自摸和', han: 1, yakuman: 0 },
  TANYAO: { name: '断幺九', han: 1, yakuman: 0 },
  PINFU: { name: '平和', han: 1, yakuman: 0 },
  IIPEIKO: { name: '一杯口', han: 1, yakuman: 0 },
  HAKU: { name: '役牌白', han: 1, yakuman: 0 },
  HATSU: { name: '役牌发', han: 1, yakuman: 0 },
  CHUN: { name: '役牌中', han: 1, yakuman: 0 },
  JIKAZE: { name: '自风', han: 1, yakuman: 0 },
  BAKAZE: { name: '场风', han: 1, yakuman: 0 },
  ITTSU_OPEN:{name:'一气通贯（副露）',han:1,yakuman:0},
  // 2番
  DOUBLE_RIICHI: { name: '双立直', han: 2, yakuman: 0 },
  CHIITOITSU: { name: '七对子', han: 2, yakuman: 0 },
  SANANKOU: { name: '三暗刻', han: 2, yakuman: 0 },
  SANKANTSU: { name: '三杠子', han: 2, yakuman: 0 },
  TOITOI: { name: '对对和', han: 2, yakuman: 0 },
  HONITSU: { name: '混一色', han: 2, yakuman: 0 },
  JUNCHAN: { name: '纯全带幺九', han: 2, yakuman: 0 },
  ITTSU_CLOSED:{name:'一气通贯（门清）',han:2,yakuman:0},

  // 3番
  RYANPEIKOU: { name: '二杯口', han: 3, yakuman: 0 },
  HONITSU_CLOSED: { name: '混一色(门清)', han: 3, yakuman: 0 },

  // 6番
  CHINITSU: { name: '清一色', han: 6, yakuman: 0 },

  // 役满
  KOKUSHI: { name: '国士无双', han: 13, yakuman: 1 },
  SUUANKOU: { name: '四暗刻', han: 13, yakuman: 1 },
  DAISANGEN: { name: '大三元', han: 13, yakuman: 1 },
  SHOUSUUSHI: { name: '小四喜', han: 13, yakuman: 1 },
  DAISUUSHI: { name: '大四喜', han: 26, yakuman: 2 },
  TSUUIISOU: { name: '字一色', han: 13, yakuman: 1 },
  RYUUIISOU: { name: '绿一色', han: 13, yakuman: 1 },
  SUUKANTSU: { name: '四杠子', han: 13, yakuman: 1 },
  CHINROUTOU: { name: '清老头', han: 13, yakuman: 1 },
  CHUUREN: { name: '九莲宝灯', han: 13, yakuman: 1 }
};

// 符数相关常量
const FU = {
  BASE: 20,          // 基本符数
  TSUMO: 2,          // 自摸符数
  CLOSED_RON: 10,    // 门清荣和符数
  PAIR_YAKUHAI: 2,   // 役牌对子符数
  KOUTSU: {          // 刻子符数
    CLOSED: {
      SIMPLE: 4,     // 暗刻中张
      TERMINAL: 8    // 暗刻幺九
    },
    OPEN: {
      SIMPLE: 2,     // 明刻中张
      TERMINAL: 4    // 明刻幺九
    }
  },
  KANTSU: {          // 杠子符数
    CLOSED: {
      SIMPLE: 16,    // 暗杠中张
      TERMINAL: 32   // 暗杠幺九
    },
    OPEN: {
      SIMPLE: 8,     // 明杠中张
      TERMINAL: 16   // 明杠幺九
    }
  }
};

// 副露类型
const NAKI_TYPES = {
  CHI: 'CHI',     // 吃
  PON: 'PON',     // 碰
  MINKAN: 'MINKAN', // 明杠
  ANKAN: 'ANKAN'   // 暗杠
};

module.exports = {
  TILE_TYPES,
  JIHAI_TYPES,
  BASE_POINTS,
  YAKU,
  FU,
  NAKI_TYPES
};