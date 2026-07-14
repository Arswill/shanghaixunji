/**
 * 省份邻接关系与战争迷雾解锁门配置
 *
 * 34 个省级行政区的邻接关系图 + 6 种解锁门类型（接壤门/神兽门/谜题门/任务门/节气门/羁绊门）。
 * 用于「省份解锁→随机邂逅」的游戏化机制。
 */

/** 解锁门类型 */
export type DoorType =
  | 'adjacency' // 接壤门：与已解锁省份接壤即可解锁
  | 'creature' // 神兽门：收集指定数量神兽后解锁
  | 'riddle' // 谜题门：回答神兽相关谜题后解锁
  | 'task' // 任务门：完成指定神兽的羁绊任务后解锁
  | 'seasonal' // 节气门：在特定节气期间解锁
  | 'bond' // 羁绊门：与指定神兽羁绊达到 2 级后解锁

/** 解锁门配置 */
export interface UnlockDoor {
  province: string
  type: DoorType
  /** 谜题门：谜语文本 */
  riddle?: string
  /** 谜题门：答案神兽 ID */
  answerCreatureId?: string
  /** 任务门：任务神兽 ID */
  taskCreatureId?: string
  /** 任务门：任务描述 */
  taskDescription?: string
  /** 节气门：所需节气 */
  requiredSolarTerm?: string
  /** 羁绊门：所需羁绊等级 */
  requiredBondLevel?: number
  /** 神兽门：所需神兽数量 */
  requiredCreatureCount?: number
}

/** 门类型标签 */
export const DOOR_LABELS: Record<DoorType, string> = {
  adjacency: '接壤门',
  creature: '神兽门',
  riddle: '谜题门',
  task: '任务门',
  seasonal: '节气门',
  bond: '羁绊门',
}

/** 门类型描述 */
export const DOOR_DESCRIPTIONS: Record<DoorType, string> = {
  adjacency: '与已解锁省份接壤，迷雾自然消散',
  creature: '收集足够数量的神兽，仙力震开迷雾',
  riddle: '解开上古谜题，智慧之光照亮前路',
  task: '完成神兽交付的羁绊任务，获得信物',
  seasonal: '等待特定节气降临，天时开启通道',
  bond: '与指定神兽羁绊深厚，获得引路之恩',
}

/** 全部 34 个省级行政区 */
export const ALL_PROVINCES: string[] = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西',
  '海南', '重庆', '四川', '贵州', '云南',
  '西藏', '陕西', '甘肃', '青海', '宁夏',
  '新疆', '台湾', '香港', '澳门',
]

/** 省份邻接关系（陆地接壤） */
export const PROVINCE_ADJACENCY: Record<string, string[]> = {
  '北京': ['天津', '河北'],
  '天津': ['北京', '河北'],
  '河北': ['北京', '天津', '山西', '内蒙古', '辽宁', '山东', '河南'],
  '山西': ['河北', '内蒙古', '陕西', '河南'],
  '内蒙古': ['甘肃', '宁夏', '陕西', '山西', '河北', '辽宁', '吉林', '黑龙江'],
  '辽宁': ['内蒙古', '吉林', '河北'],
  '吉林': ['内蒙古', '辽宁', '黑龙江'],
  '黑龙江': ['内蒙古', '吉林'],
  '上海': ['江苏', '浙江'],
  '江苏': ['上海', '浙江', '安徽', '山东'],
  '浙江': ['上海', '江苏', '安徽', '江西', '福建'],
  '安徽': ['江苏', '浙江', '江西', '湖北', '河南', '山东'],
  '福建': ['浙江', '江西', '广东'],
  '江西': ['浙江', '安徽', '湖北', '湖南', '广东', '福建'],
  '山东': ['河北', '河南', '安徽', '江苏'],
  '河南': ['河北', '山西', '陕西', '湖北', '安徽', '山东'],
  '湖北': ['陕西', '河南', '安徽', '江西', '湖南', '重庆'],
  '湖南': ['湖北', '江西', '广东', '广西', '贵州', '重庆'],
  '广东': ['福建', '江西', '湖南', '广西', '海南', '香港', '澳门'],
  '广西': ['湖南', '广东', '贵州', '云南'],
  '海南': ['广东'],
  '重庆': ['四川', '贵州', '湖南', '湖北', '陕西'],
  '四川': ['青海', '甘肃', '陕西', '重庆', '贵州', '云南', '西藏'],
  '贵州': ['四川', '云南', '广西', '湖南', '重庆'],
  '云南': ['西藏', '四川', '贵州', '广西'],
  '西藏': ['新疆', '青海', '四川', '云南'],
  '陕西': ['内蒙古', '宁夏', '甘肃', '四川', '重庆', '湖北', '河南', '山西'],
  '甘肃': ['内蒙古', '宁夏', '陕西', '四川', '青海', '新疆'],
  '青海': ['新疆', '甘肃', '四川', '西藏'],
  '宁夏': ['内蒙古', '甘肃', '陕西'],
  '新疆': ['西藏', '青海', '甘肃'],
  '台湾': [],
  '香港': ['广东'],
  '澳门': ['广东'],
}

/** 34 个省份的解锁门配置 */
export const UNLOCK_DOORS: UnlockDoor[] = [
  // ── 20 个接壤门 ──
  { province: '天津', type: 'adjacency' },
  { province: '河北', type: 'adjacency' },
  { province: '山西', type: 'adjacency' },
  { province: '内蒙古', type: 'adjacency' },
  { province: '辽宁', type: 'adjacency' },
  { province: '吉林', type: 'adjacency' },
  { province: '黑龙江', type: 'adjacency' },
  { province: '江苏', type: 'adjacency' },
  { province: '浙江', type: 'adjacency' },
  { province: '安徽', type: 'adjacency' },
  { province: '福建', type: 'adjacency' },
  { province: '江西', type: 'adjacency' },
  { province: '山东', type: 'adjacency' },
  { province: '河南', type: 'adjacency' },
  { province: '湖北', type: 'adjacency' },
  { province: '湖南', type: 'adjacency' },
  { province: '广西', type: 'adjacency' },
  { province: '海南', type: 'adjacency' },
  { province: '宁夏', type: 'adjacency' },
  { province: '香港', type: 'adjacency' },

  // ── 4 个神兽门 ──
  { province: '陕西', type: 'creature', requiredCreatureCount: 5 },
  { province: '四川', type: 'creature', requiredCreatureCount: 8 },
  { province: '云南', type: 'creature', requiredCreatureCount: 12 },
  { province: '甘肃', type: 'creature', requiredCreatureCount: 15 },

  // ── 4 个谜题门 ──
  {
    province: '贵州',
    type: 'riddle',
    riddle: '身披五彩，声如钟磬，见则天下大旱。何兽？',
    answerCreatureId: 'bi-fang',
  },
  {
    province: '重庆',
    type: 'riddle',
    riddle: '状如黄囊，赤如丹火，六足四翼，浑敦无面。何兽？',
    answerCreatureId: 'di-jiang',
  },
  {
    province: '青海',
    type: 'riddle',
    riddle: '其状如羊，九尾四耳，其目在背。何兽？',
    answerCreatureId: 'bo-yi',
  },
  {
    province: '新疆',
    type: 'riddle',
    riddle: '状如虎而犬毛，有角，声如犬吠。何兽？',
    answerCreatureId: 'qiong-qi',
  },

  // ── 2 个任务门 ──
  {
    province: '西藏',
    type: 'task',
    taskCreatureId: 'xue-yu',
    taskDescription: '与雪域守护神「雪羽」结契，完成三节气的考验',
  },
  {
    province: '澳门',
    type: 'task',
    taskCreatureId: 'hai-shen',
    taskDescription: '协助海神「海若」平息南海风浪，收集三件海灵信物',
  },

  // ── 2 个节气门 ──
  { province: '台湾', type: 'seasonal', requiredSolarTerm: '春分' },
  { province: '广东', type: 'seasonal', requiredSolarTerm: '夏至' },

  // ── 2 个羁绊门 ──
  { province: '上海', type: 'bond', requiredBondLevel: 2 },
  { province: '北京', type: 'bond', requiredBondLevel: 2 },
]

/** 获取指定省份的邻接省份列表 */
export function getAdjacentProvinces(province: string): string[] {
  return PROVINCE_ADJACENCY[province] ?? []
}

/** 获取指定省份的解锁门配置 */
export function getDoorForProvince(province: string): UnlockDoor | undefined {
  return UNLOCK_DOORS.find((d) => d.province === province)
}
