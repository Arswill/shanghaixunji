import fs from 'node:fs'
import old from '../shanhaijing-creatures.json' with { type: 'json' }

function deriveConfidence(confidenceStr: string): 'high' | 'medium' | 'creative' {
  const s = confidenceStr || ''
  if (s.includes('谭其骧') && (s.includes('袁珂') || s.includes('郝懿行'))) return 'high'
  if (s.includes('通志') || s.includes('水经注') || s.includes('郭璞') || s.includes('蒙文通') || s.includes('现代生物学')) return 'medium'
  return 'creative'
}

const SCROLL_BY_PROVINCE: Record<string, string> = {
  '陕西': '西山经',
  '山西': '北山经',
  '河南': '中山经',
  '四川': '西山经',
  '湖南': '南山经',
  '广东': '南山经',
  '山东': '东山经',
  '甘肃': '西山经',
  '湖北': '西山经',
  '江苏': '西山经',
  '两广': '南山经',
}

const ART_DESCRIPTION: Record<string, string> = {
  'bi-fang': 'one-legged crane-like bird, blue body with white markings, red beak',
  'qi-lin': 'deer-bodied creature with ox tail, yellow hair, round hooves, fleshy horn',
  'fei-fei': 'snake with six legs and four wings',
  'chu-shuo': 'giant serpent dragon, red body, human face, thousand-mile length',
  'jiu-wei-hu': 'nine-tailed fox with baby-like cry',
  'jian': 'giant dark hairy human-faced creature with long lips',
  'qiong-qi': 'ox-like beast with hedgehog quills, dog-like howl',
  'tao-tie': 'sheep-bodied creature with human face, eyes under arms, tiger teeth',
  'ying-long': 'winged dragon',
  'bai-ze': 'white divine beast, lion-like, can speak',
  'pi-xiu': 'leopard-bodied beast with human head, ox ears, one eye',
  'suan-ni': 'deer-like beast with fleshy growth on tail',
  'xie-zhi': 'sheep-like beast with single horn, green fur',
  'tao-wu': 'tiger-like beast with dog fur, human face, pig teeth, long tail',
  'hun-dun': 'dog-like beast with long fur, bear-like, blind and deaf',
  'zhu-yan': 'ape-like creature with white head and red feet',
  'zheng': 'red leopard with five tails and one horn',
  'tian-gou': 'cat-like beast with white head',
  'xuan-gui': 'turtle with bird head and snake tail',
  'luo-yu': 'fish with bird wings, carp body, blue markings, white head, red beak',
  'luan-niao': 'pheasant-like bird with five-colored plumage',
  'wen-yao-yu': 'flying fish with carp body, bird wings, blue markings, white head, red beak',
}

const out = (old as Array<Record<string, unknown>>).map((c) => ({
  id: c.id,
  name: c.name,
  pinyin: c.pinyin,
  province: c.province,
  original_text: c.original_text,
  source: c.source,
  translation: c.translation,
  modern_location: c.modern_location,
  confidence: deriveConfidence(c.confidence as string),
  confidence_notes: (c.confidence as string) || '',
  description: c.description,
  scroll: SCROLL_BY_PROVINCE[c.province as string] ?? '中山经',
  art_description: ART_DESCRIPTION[c.id as string] ?? '',
}))

fs.writeFileSync('data/verified/creatures_verified.json', JSON.stringify(out, null, 2))
console.log(`Migrated ${out.length} creatures to data/verified/creatures_verified.json`)
