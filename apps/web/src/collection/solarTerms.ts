/**
 * 节气限时神兽 —— 基于日期的 24 节气算法（无需外部 API）。
 *
 * 24 节气对应太阳黄经，每节气约 15°。这里采用「近似日期」查表法：
 * 每个节气给定一个常年公历近似日期，依月份-日序排序后，判定「当前日期
 * 落在哪两个节气之间」——即上一个已过的节气即当日所处节气。
 *
 * 注：近似日期为常年平均值（可用于普通年份的节气判定，误差通常 ±1~2 天）。
 */

export interface QuestStep {
  title: string
  description: string
}

export interface SolarTerm {
  name: string        // "冬至"
  date: string        // "12-21" 大致日期
  creatureIds: string[] // 该节气对应的神兽ID
  creatureName: string // 对应神兽名（用于横幅展示）
  description: string // "冬至夜最长，阴极阳生，夜行神兽出没"
  eventTitle: string  // 节气限时事件标题
  eventDescription: string // 节气限时事件描述
  boostedCreatures: string[] // 在该节气出现率提升的神兽ID
  quest: QuestStep[] // 3 步任务链
}

/**
 * 24 节气表（按公历时间先后排序，跨年：小寒→大寒→…→冬至）。
 * creatureIds 与数据集 id 对齐；creatureName 用于横幅文案。
 */
export const SOLAR_TERMS: SolarTerm[] = [
  {
    name: '小寒',
    date: '01-06',
    creatureIds: ['chi-you'],
    creatureName: '蚩尤',
    description: '寒铁凝霜，战神蚩尤踏雪而出，寒光甲胄响彻北荒。',
    eventTitle: '小寒 · 寒铁凝霜',
    eventDescription: '寒铁凝霜，北荒战鼓隐隐，战神蚩尤将踏雪而归。',
    boostedCreatures: ['chi-you'],
    quest: [
      { title: '踏雪寻踪', description: '在北地省份寻找一处未探索的栖息地。' },
      { title: '寒铁试炼', description: '与节气提升神兽完成一次遭遇。' },
      { title: '北荒祭礼', description: '收集 3 只不同的北山经神兽。' },
    ],
  },
  {
    name: '大寒',
    date: '01-20',
    creatureIds: ['xing-tian'],
    creatureName: '刑天',
    description: '一年至寒，刑天无头舞干戚，抗寒不屈其志。',
    eventTitle: '大寒 · 干戚不屈',
    eventDescription: '一年至寒，刑天无头舞干戚，勇士之魂不灭。',
    boostedCreatures: ['xing-tian'],
    quest: [
      { title: '踏冰寻痕', description: '在严寒省份发现一只未收录神兽。' },
      { title: '不屈之证', description: '与刑天完成一次遭遇并收录图鉴。' },
      { title: '祭天封灵', description: '累计收集 5 只海外大荒神兽。' },
    ],
  },
  {
    name: '立春',
    date: '02-04',
    creatureIds: ['qi-lin'],
    creatureName: '麒麟',
    description: '瑞兽迎春，麒麟踏青而至，含仁怀义兆丰年。',
    eventTitle: '立春 · 瑞兽迎春',
    eventDescription: '东风解冻，麒麟踏青而至，万物始生。',
    boostedCreatures: ['qi-lin'],
    quest: [
      { title: '迎春踏青', description: '在南方省份完成一次探索。' },
      { title: '瑞兆初显', description: '与麒麟完成一次遭遇。' },
      { title: '麒麟赐福', description: '收集 3 只南山经神兽。' },
    ],
  },
  {
    name: '雨水',
    date: '02-19',
    creatureIds: ['ying-long'],
    creatureName: '应龙',
    description: '龙行雨施，应龙振翼兴云作雨，润泽万物。',
    eventTitle: '雨水 · 龙行雨施',
    eventDescription: '春雨绵绵，应龙振翼兴云，润泽九州。',
    boostedCreatures: ['ying-long'],
    quest: [
      { title: '云起龙骧', description: '在江河沿岸省份完成一次探索。' },
      { title: '甘霖润物', description: '与应龙完成一次遭遇。' },
      { title: '雨师之印', description: '累计发现 5 只与水相关的神兽。' },
    ],
  },
  {
    name: '惊蛰',
    date: '03-06',
    creatureIds: ['ba-she'],
    creatureName: '巴蛇',
    description: '春雷惊百虫，巴蛇吞象而出，蛇虫惊起蛰伏破。',
    eventTitle: '惊蛰 · 雷兽将醒',
    eventDescription: '春雷惊百虫，巴蛇吞象而出，蛰伏已破。',
    boostedCreatures: ['ba-she'],
    quest: [
      { title: '闻雷启蛰', description: '在惊蛰时节完成一次探索。' },
      { title: '蛇影初现', description: '与巴蛇完成一次遭遇。' },
      { title: '惊蛰封印', description: '收集 3 只蛇虫类神兽。' },
    ],
  },
  {
    name: '春分',
    date: '03-21',
    creatureIds: ['jiu-wei-hu'],
    creatureName: '九尾狐',
    description: '春分昼夜平，九尾狐鸣于青丘，阴阳和而瑞兽现。',
    eventTitle: '春分 · 青丘狐鸣',
    eventDescription: '昼夜均分，九尾狐鸣于青丘，阴阳和而瑞兽现。',
    boostedCreatures: ['jiu-wei-hu'],
    quest: [
      { title: '踏青访丘', description: '在南方丘陵省份完成一次探索。' },
      { title: '狐鸣相应', description: '与九尾狐完成一次遭遇。' },
      { title: '青丘之誓', description: '收集 3 只南山经神兽。' },
    ],
  },
  {
    name: '清明',
    date: '04-05',
    creatureIds: ['luan-niao'],
    creatureName: '鸾鸟',
    description: '清明鸟鸣，鸾鸟和鸣于山阿，见则天下安宁。',
    eventTitle: '清明 · 鸾鸟和鸣',
    eventDescription: '清明鸟鸣，鸾鸟和鸣于山阿，见则天下安宁。',
    boostedCreatures: ['luan-niao'],
    quest: [
      { title: '扫墓寻芳', description: '在山间省份完成一次探索。' },
      { title: '鸾音入耳', description: '与鸾鸟完成一次遭遇。' },
      { title: '太平之愿', description: '收集 3 只鸟形神兽。' },
    ],
  },
  {
    name: '谷雨',
    date: '04-20',
    creatureIds: ['kui'],
    creatureName: '夔',
    description: '雷霆谷雨，夔一足而出，其声如雷，雨生百谷。',
    eventTitle: '谷雨 · 一足惊雷',
    eventDescription: '谷雨雷动，夔一足而出，其声如雷，雨生百谷。',
    boostedCreatures: ['kui'],
    quest: [
      { title: '雷泽听鼓', description: '在多雨省份完成一次探索。' },
      { title: '夔牛踏雨', description: '与夔完成一次遭遇。' },
      { title: '仓颉遗文', description: '累计发现 5 只山经神兽。' },
    ],
  },
  {
    name: '立夏',
    date: '05-06',
    creatureIds: ['zhu-que'],
    creatureName: '朱雀',
    description: '立夏南风起，朱雀司南方火神，振羽而炎威至。',
    eventTitle: '立夏 · 朱雀司火',
    eventDescription: '立夏南风起，朱雀振羽，炎威渐至。',
    boostedCreatures: ['zhu-que'],
    quest: [
      { title: '南离观火', description: '在南方省份完成一次探索。' },
      { title: '朱雀之羽', description: '与朱雀完成一次遭遇。' },
      { title: '夏日灼印', description: '收集 3 只火属神兽。' },
    ],
  },
  {
    name: '小满',
    date: '05-21',
    creatureIds: ['lu-shu'],
    creatureName: '鹿蜀',
    description: '小满物盈，鹿蜀满山奔跑，其状如马白首赤尾。',
    eventTitle: '小满 · 马鸣白首',
    eventDescription: '小满物盈，鹿蜀满山奔跑，其状如马白首赤尾。',
    boostedCreatures: ['lu-shu'],
    quest: [
      { title: '杻阳寻马', description: '在南方草原省份完成一次探索。' },
      { title: '鹿蜀留踪', description: '与鹿蜀完成一次遭遇。' },
      { title: '丰年之祝', description: '收集 3 只南山经神兽。' },
    ],
  },
  {
    name: '芒种',
    date: '06-06',
    creatureIds: ['gu-diao'],
    creatureName: '蛊雕',
    description: '芒种鹰击长空，蛊雕如雕而角，鸣如婴儿之音。',
    eventTitle: '芒种 · 鹰击长空',
    eventDescription: '芒种鹰击长空，蛊雕如雕而角，鸣如婴儿之音。',
    boostedCreatures: ['gu-diao'],
    quest: [
      { title: '刈麦观天', description: '在中原省份完成一次探索。' },
      { title: '雕影掠空', description: '与蛊雕完成一次遭遇。' },
      { title: '蛊鸣收魂', description: '收集 3 只雕鸮类神兽。' },
    ],
  },
  {
    name: '夏至',
    date: '06-21',
    creatureIds: ['bi-fang'],
    creatureName: '毕方',
    description: '夏至火鸟现，毕方一足赤喙，见则其邑有讹火。',
    eventTitle: '夏至 · 毕方一足',
    eventDescription: '夏至火鸟现，毕方一足赤喙，见则其邑有讹火。',
    boostedCreatures: ['bi-fang'],
    quest: [
      { title: '日北至', description: '在夏至当日完成一次探索。' },
      { title: '火鸟临城', description: '与毕方完成一次遭遇。' },
      { title: '夏至真火', description: '收集 3 只火属神兽。' },
    ],
  },
  {
    name: '小暑',
    date: '07-07',
    creatureIds: ['xuan-gui'],
    creatureName: '旋龟',
    description: '小暑伏热，旋龟伏于暑气之中，其音如判木。',
    eventTitle: '小暑 · 旋龟伏暑',
    eventDescription: '小暑伏热，旋龟伏于暑气之中，其音如判木。',
    boostedCreatures: ['xuan-gui'],
    quest: [
      { title: '暑气初蒸', description: '在南方水域省份完成一次探索。' },
      { title: '龟息判木', description: '与旋龟完成一次遭遇。' },
      { title: '灵泉消暑', description: '收集 3 只龟蛇类神兽。' },
    ],
  },
  {
    name: '大暑',
    date: '07-23',
    creatureIds: ['han-ba'],
    creatureName: '旱魃',
    description: '大暑酷热，旱神旱魃所过赤地千里，烈日炎炎。',
    eventTitle: '大暑 · 旱魃行野',
    eventDescription: '大暑酷热，旱神旱魃所过赤地千里，烈日炎炎。',
    boostedCreatures: ['han-ba'],
    quest: [
      { title: '赤地千里', description: '在干旱省份完成一次探索。' },
      { title: '旱神之影', description: '与旱魃完成一次遭遇。' },
      { title: '祈雨安民', description: '收集 3 只北山经神兽。' },
    ],
  },
  {
    name: '立秋',
    date: '08-08',
    creatureIds: ['bai-hu'],
    creatureName: '白虎',
    description: '立秋西风至，白虎司西方秋神，金气肃杀而降。',
    eventTitle: '立秋 · 白虎肃秋',
    eventDescription: '立秋西风至，白虎司西方秋神，金气肃杀而降。',
    boostedCreatures: ['bai-hu'],
    quest: [
      { title: '西风起', description: '在西方省份完成一次探索。' },
      { title: '虎啸秋林', description: '与白虎完成一次遭遇。' },
      { title: '金神之印', description: '收集 3 只西山经神兽。' },
    ],
  },
  {
    name: '处暑',
    date: '08-23',
    creatureIds: ['zheng'],
    creatureName: '狰',
    description: '处暑暑止，狰如豹五尾一角，伏于章莪之山。',
    eventTitle: '处暑 · 狰伏章莪',
    eventDescription: '处暑暑止，狰如豹五尾一角，伏于章莪之山。',
    boostedCreatures: ['zheng'],
    quest: [
      { title: '暑退山行', description: '在西方山地省份完成一次探索。' },
      { title: '五尾狰影', description: '与狰完成一次遭遇。' },
      { title: '章莪之封', description: '收集 3 只西山经神兽。' },
    ],
  },
  {
    name: '白露',
    date: '09-08',
    creatureIds: ['jing-wei'],
    creatureName: '精卫',
    description: '白露凝霜，精卫衔西山木石以堙东海，鸟鸣露寒。',
    eventTitle: '白露 · 精卫衔木',
    eventDescription: '白露凝霜，精卫衔西山木石以堙东海，鸟鸣露寒。',
    boostedCreatures: ['jing-wei'],
    quest: [
      { title: '露结为霜', description: '在沿海省份完成一次探索。' },
      { title: '西山取木', description: '与精卫完成一次遭遇。' },
      { title: '填海之志', description: '收集 3 只鸟形神兽。' },
    ],
  },
  {
    name: '秋分',
    date: '09-23',
    creatureIds: ['xuan-wu'],
    creatureName: '玄武',
    description: '秋分昼夜平，玄武司北方水神，龟蛇合体主水。',
    eventTitle: '秋分 · 玄龟镇北',
    eventDescription: '秋分昼夜平，玄武司北方水神，龟蛇合体主水。',
    boostedCreatures: ['xuan-wu'],
    quest: [
      { title: '昼夜均', description: '在北方省份完成一次探索。' },
      { title: '北冥观潮', description: '与玄武完成一次遭遇。' },
      { title: '玄武镇水', description: '收集 3 只北山经神兽。' },
    ],
  },
  {
    name: '寒露',
    date: '10-08',
    creatureIds: ['jiao-ren'],
    creatureName: '鲛人',
    description: '寒露水冷，鲛人泣珠于海，泪化明珠寒露同辉。',
    eventTitle: '寒露 · 鲛人泣珠',
    eventDescription: '寒露水冷，鲛人泣珠于海，泪化明珠寒露同辉。',
    boostedCreatures: ['jiao-ren'],
    quest: [
      { title: '海雾生寒', description: '在沿海省份完成一次探索。' },
      { title: '鲛歌夜哭', description: '与鲛人完成一次遭遇。' },
      { title: '明珠有泪', description: '收集 3 只海外大荒神兽。' },
    ],
  },
  {
    name: '霜降',
    date: '10-23',
    creatureIds: ['bing-can'],
    creatureName: '冰蚕',
    description: '霜降百草枯，冰蚕伏于霜降之寒，蚕丝冰雪凝成。',
    eventTitle: '霜降 · 冰蚕凝丝',
    eventDescription: '霜降百草枯，冰蚕伏于霜降之寒，蚕丝冰雪凝成。',
    boostedCreatures: ['bing-can'],
    quest: [
      { title: '霜落百草', description: '在北方省份完成一次探索。' },
      { title: '冰蚕吐丝', description: '与冰蚕完成一次遭遇。' },
      { title: '寒衣成茧', description: '收集 3 只北山经神兽。' },
    ],
  },
  {
    name: '立冬',
    date: '11-07',
    creatureIds: ['kun-peng'],
    creatureName: '鲲鹏',
    description: '立冬水始冰，鲲鹏化而南徙，北冥飞鹏击水千里。',
    eventTitle: '立冬 · 鲲鹏击水',
    eventDescription: '立冬水始冰，鲲鹏化而南徙，北冥飞鹏击水千里。',
    boostedCreatures: ['kun-peng'],
    quest: [
      { title: '水始冰', description: '在北方水域省份完成一次探索。' },
      { title: '北冥观鲲', description: '与鲲鹏完成一次遭遇。' },
      { title: '鹏徙南溟', description: '收集 3 只海外大荒神兽。' },
    ],
  },
  {
    name: '小雪',
    date: '11-22',
    creatureIds: ['fu-zhu'],
    creatureName: '夫诸',
    description: '小雪飘零，夫诸如白鹿四角，见则其邑大水飘雪。',
    eventTitle: '小雪 · 夫诸踏雪',
    eventDescription: '小雪飘零，夫诸如白鹿四角，见则其邑大水飘雪。',
    boostedCreatures: ['fu-zhu'],
    quest: [
      { title: '初雪飘零', description: '在北方省份完成一次探索。' },
      { title: '白鹿四角', description: '与夫诸完成一次遭遇。' },
      { title: '水雪之祭', description: '收集 3 只北山经神兽。' },
    ],
  },
  {
    name: '大雪',
    date: '12-07',
    creatureIds: ['di-jiang'],
    creatureName: '帝江',
    description: '大雪纷飞，帝江无面六足四翼，识歌舞而飞雪中。',
    eventTitle: '大雪 · 帝江舞雪',
    eventDescription: '大雪纷飞，帝江无面六足四翼，识歌舞而飞雪中。',
    boostedCreatures: ['di-jiang'],
    quest: [
      { title: '雪落无声', description: '在北方雪原省份完成一次探索。' },
      { title: '混沌歌舞', description: '与帝江完成一次遭遇。' },
      { title: '六足踏雪', description: '收集 3 只海外大荒神兽。' },
    ],
  },
  {
    name: '冬至',
    date: '12-22',
    creatureIds: ['chu-shuo'],
    creatureName: '烛龙',
    description: '冬至夜最长，阴极阳生，烛龙昼夜极变，夜行神兽出没。',
    eventTitle: '冬至 · 烛龙昼夜',
    eventDescription: '冬至夜最长，阴极阳生，烛龙昼夜极变，夜行神兽出没。',
    boostedCreatures: ['chu-shuo'],
    quest: [
      { title: '日南至', description: '在冬至当日完成一次探索。' },
      { title: '长夜明灯', description: '与烛龙完成一次遭遇。' },
      { title: '烛龙开目', description: '收集 3 只海外大荒神兽。' },
    ],
  },
]

/** 形如 "MM-DD" → 一年中以 1 月 1 日为起点的累积日序（用于排序比较）。 */
function monthDayToOrdinal(md: string): number {
  const [m, d] = md.split('-').map(Number)
  // 粗略累积日序，仅用于同序比较，无需精确
  const daysBeforeMonth = [0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  return daysBeforeMonth[m] + d
}

/** 按时间先后排序的节气表（小寒→…→冬至）。 */
const SORTED_TERMS = [...SOLAR_TERMS].sort((a, b) => monthDayToOrdinal(a.date) - monthDayToOrdinal(b.date))

/**
 * 根据给定 Date 返回当前所处节气。
 * 算法：把 24 节气按时间排序（小寒→…→冬至，跨年衔接），
 * 找到「最后一个近似日期 <= 当日日序」的节气。
 * 因节气跨年，需把当年冬至之后（12-22~12-31）与次年小寒之前（1-1~1-5）
 * 都判为「冬至」段，故将列表环形处理。
 */
export function getCurrentSolarTerm(date: Date = new Date()): SolarTerm {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const todayOrd = monthDayToOrdinal(mmdd)

  // 若今日在小寒之前（1-1 ~ 1-5），则仍属上一年的「冬至」
  if (todayOrd < monthDayToOrdinal(SORTED_TERMS[0].date)) {
    return SORTED_TERMS[SORTED_TERMS.length - 1]
  }

  // 否则找到最后一个 date <= today 的节气
  let current = SORTED_TERMS[0]
  for (const term of SORTED_TERMS) {
    if (monthDayToOrdinal(term.date) <= todayOrd) {
      current = term
    } else {
      break
    }
  }
  return current
}

/** 获取当前节气在排序表中的索引。 */
function getCurrentSolarTermIndex(date: Date = new Date()): number {
  const term = getCurrentSolarTerm(date)
  return SORTED_TERMS.findIndex((t) => t.name === term.name)
}

/** 获取下一个节气（用于倒计时）。 */
export function getNextSolarTerm(date: Date = new Date()): SolarTerm {
  const idx = getCurrentSolarTermIndex(date)
  return SORTED_TERMS[(idx + 1) % SORTED_TERMS.length]
}

/** 计算下一个节气的公历日期（Date 对象，已处理跨年）。 */
export function getNextSolarTermDate(date: Date = new Date()): Date {
  const next = getNextSolarTerm(date)
  const [m, d] = next.date.split('-').map(Number)
  const candidate = new Date(date.getFullYear(), m - 1, d)
  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (candidate <= startOfToday) {
    candidate.setFullYear(date.getFullYear() + 1)
  }
  return candidate
}

/** 距离下一个节气还有几天（向上取整）。 */
export function getDaysUntilNextSolarTerm(date: Date = new Date()): number {
  const nextDate = getNextSolarTermDate(date)
  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = nextDate.getTime() - startOfToday.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/** 判断给定年份是否为闰年。 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * 距离下一个「指定节气」还有几天（向上取整，已处理跨年）。
 * 用于时令门倒计时：传入目标节气名（如 "冬至"），返回距其下一次到来剩余的天数；
 * 若当日恰为该节气则返回 0。
 */
export function getDaysUntilSolarTerm(termName: string, date: Date = new Date()): number {
  const term = SOLAR_TERMS.find((t) => t.name === termName)
  if (!term) return 0
  const [m, d] = term.date.split('-').map(Number)
  const candidate = new Date(date.getFullYear(), m - 1, d)
  const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (candidate < startOfToday) {
    candidate.setFullYear(date.getFullYear() + 1)
  }
  const diff = candidate.getTime() - startOfToday.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * 判断当前日期是否落在「指定节气」的前后 windowDays 天窗口内。
 * 用于时令门放宽判定：节气前后数日内均可解锁，而非仅节气当日。
 */
export function isWithinSolarTermWindow(
  termName: string,
  windowDays: number,
  date: Date = new Date()
): boolean {
  const term = SOLAR_TERMS.find((t) => t.name === termName)
  if (!term) return false
  const daysUntil = getDaysUntilSolarTerm(termName, date)
  // daysUntil = 0 表示当日即该节气；<= windowDays 表示即将到来或当日
  if (daysUntil <= windowDays) return true
  // 距上一个该节气过去的天数 ≈ 全年天数 - daysUntil
  const yearLen = isLeapYear(date.getFullYear()) ? 366 : 365
  const daysSince = yearLen - daysUntil
  return daysSince <= windowDays
}

/** 该神兽是否在当前节气可遇（即其 id 属于当前节气对应神兽）。 */
export function isCreatureInSeason(creatureId: string, date: Date = new Date()): boolean {
  return getCurrentSolarTerm(date).creatureIds.includes(creatureId)
}

/** 返回当前节气对应的所有神兽 id（便于图鉴高亮）。 */
export function getCurrentSeasonCreatureIds(date: Date = new Date()): string[] {
  return getCurrentSolarTerm(date).creatureIds
}

/** 返回当前节气处于「限时提升」状态的神兽 id 列表。 */
export function getBoostedCreatureIds(date: Date = new Date()): string[] {
  return getCurrentSolarTerm(date).boostedCreatures
}

/** 判断某只神兽是否在当前节气处于「限时提升」状态。 */
export function isCreatureBoosted(creatureId: string, date: Date = new Date()): boolean {
  return getBoostedCreatureIds(date).includes(creatureId)
}
