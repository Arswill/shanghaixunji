import { creatures } from '../data/loadCreatures'

/**
 * 卷册收集体系 —— 按《山海经》原书结构将神兽归入五大卷册。
 *
 * 山海经全书分为「山经」与「海经」两大部分：山经含南、西、北、东、中五卷，
 * 海经含海外四经、海内经、大荒四经。本系统将海外、海内、大荒诸经合为一卷
 * 「海外大荒」，另立南、西、北、东四山经各为一卷，共五卷。
 *
 * 说明：数据集中存在「中山经」「海内经」两类 scroll（原书亦有此二经），
 * 为确保每只神兽都能归入某卷而不会在图鉴中遗失，将其一并纳入「海外大荒」
 * 卷册（海内经本属海经；中山经无单独卷册故附此）。
 */

export interface Volume {
  id: string
  name: string        // "南山经"
  subtitle: string    // "南方诸山神兽"
  description: string // 简短描述
  scrolls: string[]   // 匹配的 scroll 字段值
  color: string       // 主题色
  /** 卷宗叙事：集齐全卷后解锁的地理脉络综述 */
  narrative: string
}

export const VOLUMES: Volume[] = [
  {
    id: 'nan-shan',
    name: '南山经',
    subtitle: '南方诸山神兽',
    description: '自招摇之山至南禺之山，凡四十山，万六千三百里。南火之精，多奇鸟异兽。',
    scrolls: ['南山经'],
    color: '#4a7c59',
    narrative:
      '南山经起于招摇之山，终于南禺之山，凡四十山，蜿蜒万六千三百里。其地多赤金玉、多犀兕象犀，林深处九尾狐鸣于青丘，鹿蜀奔于杻阳之阳，旋龟游于杻阳之水。南方属火，神兽多斑斓炽烈之色，鸾凤栖而朱雀鸣，南溟之南，化外之地也。循山而行，可见草木蕃秀、异兽出没，是为山海图卷之始。',
  },
  {
    id: 'xi-shan',
    name: '西山经',
    subtitle: '西方诸山神兽',
    description: '自钱来之山至莱山，凡七十七山，一万七千五百一十七里。西金之气，神兽威猛。',
    scrolls: ['西山经'],
    color: '#b8924a',
    narrative:
      '西山经起于钱来之山，终于莱山，凡七十七山，绵延一万七千五百一十七里，为山经之首。其山多金玉铜铁，昆仑、玉山、钟山皆在其列。西属金，神兽威猛肃杀：白虎司秋，狰豹伏野，陆吾守昆仑之墟，英招巡槐江之山，毕方一足而鸣讹火，麒麟含仁而为毛虫之长。西陲苍茫，神灵所都，乃山海经中神山最密之卷。',
  },
  {
    id: 'bei-shan',
    name: '北山经',
    subtitle: '北方诸山神兽',
    description: '自单狐之山至堤山，凡八十七山，二万三千二百三十里。北水之寒，多幽冥之兽。',
    scrolls: ['北山经'],
    color: '#4a6a8a',
    narrative:
      '北山经起于单狐之山，终于堤山，凡八十七山，凡二万三千二百三十里，山数冠诸经。其地高寒，多马牛羚羊，水多潜怪。北属水，神兽多幽冥沉潜之姿：精卫衔木填东海，饕餮贪食隐钩吾，肥遗见则大旱，诸犍善吒。发鸠之山有炎帝少女化鸟，太行东麓连于渤海，水陆交接，幽冥怪异层出，是为北方苦寒之卷。',
  },
  {
    id: 'dong-shan',
    name: '东山经',
    subtitle: '东方诸山神兽',
    description: '自樕蟊之山至竹山，凡四十六山，一万二千六百里。东木之生，临海多怪。',
    scrolls: ['东山经'],
    color: '#4a8a7a',
    narrative:
      '东山经起于樕蟊之山，终于竹山，凡四十六山，一万二千六百里。其地东濒沧海，多鱼鳖蛟龙之属，草木始生而蕃秀。东属木，神兽多临海腾跃、变幻难测：当康鸣而天下大穰，絜钩见则多疫。东海浩渺，岛屿星罗，水族鳞介错杂其间，潮汐往复，生气蓬勃而怪异时出，是为东方苍莽临海之卷。',
  },
  {
    id: 'hai-wai',
    name: '海外大荒',
    subtitle: '海外海内大荒神兽',
    description: '海外四经、海内诸经、大荒四经，四海八荒之外，殊方异类之所聚。',
    // 海外四经 + 海内诸经（含海内经）+ 大荒四经；另附中山经以纳全集
    scrolls: [
      '海外东经', '海外南经', '海外西经', '海外北经',
      '海内东经', '海内南经', '海内西经', '海内北经', '海内经',
      '大荒东经', '大荒南经', '大荒西经', '大荒北经',
      '中山经',
    ],
    color: '#7a5a8a',
    narrative:
      '海外大荒合海外四经、海内诸经、大荒四经为一卷，兼收中山经以全其数。四海之外有大荒，大荒之外有异国：夸父逐日死于大泽，刑天断首舞干戚于常羊，烛龙瞑晦吹冬呼夏于钟山，鲲鹏化而南徙，蚩尤战于涿鹿，旱魃所过赤地千里。此卷神灵杂处、殊方异类毕集，天地开辟之初象、生死造化之玄机，皆寄于此，乃山海经中最奇诡恢弘之卷。',
  },
]

/** 卷册 id → Volume 的快速索引 */
const VOLUME_BY_ID = new Map(VOLUMES.map((v) => [v.id, v]))

/** scroll → Volume 的快速索引（同一 scroll 不会跨卷，故可缓存） */
const VOLUME_BY_SCROLL = new Map<string, Volume>()
for (const v of VOLUMES) {
  for (const s of v.scrolls) VOLUME_BY_SCROLL.set(s, v)
}

/** 返回神兽所属卷册。scroll 未知时回退到「海外大荒」卷，确保不丢兽。 */
export function getVolumeForCreature(scroll: string): Volume {
  return VOLUME_BY_SCROLL.get(scroll) ?? VOLUMES[VOLUMES.length - 1]
}

/** 根据 volume id 获取卷册 */
export function getVolumeById(id: string): Volume | undefined {
  return VOLUME_BY_ID.get(id)
}

/** 返回某卷下的全部神兽 */
export function getCreaturesInVolume(volume: Volume) {
  return creatures.filter((c) => volume.scrolls.includes(c.scroll))
}

/** 返回某卷已发现 / 总数 的进度 */
export function getVolumeProgress(volume: Volume, discovered: string[]): { found: number; total: number } {
  const inVolume = getCreaturesInVolume(volume)
  const total = inVolume.length
  const found = inVolume.filter((c) => discovered.includes(c.id)).length
  return { found, total }
}

/** 该卷是否已集齐 */
export function isVolumeComplete(volume: Volume, discovered: string[]): boolean {
  const { found, total } = getVolumeProgress(volume, discovered)
  return total > 0 && found >= total
}
