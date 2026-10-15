export const DIRECTIONS = [
  { id: 'agentic', name: 'Agentic AI', label: '智能体与企业应用', terms: ['agent', '智能体', '企业ai', '企业 ai', '工作流', '办公', 'copilot', 'ai员工', 'ai 员工', '编程', '客服'] },
  { id: 'physical', name: 'Physical AI', label: '物理世界与智能硬件', terms: ['硬件', '机器人', '机器狗', '具身', '物理ai', '物理 ai', '可穿戴', '无人机', '自动驾驶', 'ai玩具', 'ai 玩具', '智能眼镜'] },
  { id: 'entertainment', name: 'Entertainment AI', label: '内容、创作与文娱', terms: ['文娱', '短剧', '漫剧', '影视', '游戏', '音乐', '视频生成', 'ai视频', 'ai 视频', '创作者', '动画', '虚拟人', '情感陪伴', 'aigc'] },
  { id: 'industry', name: '产业与商业', label: '产业趋势与商业研究', terms: ['大模型', '融资', '投资', '榜单', '收入', '流量', '出海'] },
]
export const ARTICLE_TYPES = [
  { id: 'insight', label: '研究与观点' }, { id: 'interview', label: '访谈与对话' },
  { id: 'ranking', label: '榜单与数据' }, { id: 'company', label: '公司与融资' },
  { id: 'recap', label: '活动回顾' }, { id: 'event', label: '活动与公告' },
]
export const TAG_RULES = [
  ['AI Agent', 'agent', '智能体'], ['企业应用', '企业ai', '企业 ai', 'tob', 'to b', 'enterprise'],
  ['智能硬件', '硬件', '智能眼镜', '可穿戴'], ['具身智能', '具身', '机器人', '机器狗'],
  ['AI 玩具', 'ai玩具', 'ai 玩具'], ['自动驾驶', '自动驾驶', '无人驾驶'],
  ['内容创作', '内容生产', '内容创作', '创作者', 'aigc'], ['AI 视频', 'ai视频', 'ai 视频', '视频生成', '视频agent', '视频 agent'],
  ['短剧与漫剧', '短剧', '漫剧'], ['游戏', '游戏'], ['AI 音乐', '音乐', 'suno'],
  ['影视动画', '影视', '动画', '导演'], ['IP 与版权', '版权', ' ip', 'ip '],
  ['情感陪伴', '情感', '陪伴'], ['AI 教育', '教育', '教辅'], ['AI 医疗', '医疗', '医生', '养老'],
  ['智能制造', '制造业', '工厂', '工业生产'], ['物流与供应链', '物流', '供应链', '货代'],
  ['营销增长', '营销', '增长', '获客', '买量'], ['电商零售', '电商', '零售', '选品'],
  ['销售与客服', '客服', '售前', '销售'], ['市场调研', '市场调研', '消费者研究', '用户研究'],
  ['AI 编程', '编程', 'coding', 'cursor', '代码'], ['办公协作', '办公', 'ppt', '文档', '协作'],
  ['一人公司', '一人公司', 'opc', '超级个体'], ['组织转型', '组织', '转型'],
  ['工作流', '工作流', 'workflow'], ['多智能体', 'multi-agent', 'multi agent', '多智能体'],
  ['记忆与上下文', '记忆', '上下文', 'context'], ['模型与基础设施', '大模型', '推理', '算力', 'runtime'],
  ['开源与本地部署', '开源', '本地部署', '断网', '本地 ai', '本地ai'],
  ['商业化', '商业化', '盈利', '利润', 'roi', '营收'], ['收入与 ARR', '收入', 'arr', '营收'],
  ['流量与用户增长', '流量', '月活', 'dau', 'mau', 'similarweb'],
  ['融资与投资', '融资', '投资', '估值'], ['全球化出海', '出海', '全球化', '海外'],
  ['企业服务 SaaS', 'saas', '企业服务'], ['客户体验', 'cem', '客户体验', '体验管理'],
  ['非凡奖', '非凡奖'], ['非凡大赏', '非凡大赏'], ['OpenDay', 'openday'],
  ['OpenAI', 'openai', 'chatgpt'], ['Anthropic', 'anthropic', 'claude'],
  ['DeepSeek', 'deepseek'], ['Google', 'google', 'gemini'], ['字节跳动', '字节', '豆包'],
  ['腾讯', '腾讯', 'workbuddy'], ['阿里巴巴', '阿里', '通义', 'qwen'],
  ['Manus', 'manus'], ['OpenClaw', 'openclaw'], ['Kimi', 'kimi'], ['Plaud', 'plaud'],
]

export function normalize(value = '') { return String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim() }
function includes(text, term) {
  const needle = normalize(term)
  if (/^[a-z0-9-]+$/.test(needle)) return new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[-]/g, '\\-')}(?:s|ic)?(?:$|[^a-z0-9])`, 'i').test(text)
  return text.includes(needle)
}
function score(terms, title, lead, body) {
  return terms.reduce((sum, term) => sum + (includes(title, term) ? 12 : includes(lead, term) ? 3 : includes(body, term) ? 1 : 0), 0)
}
export function classifyArticle(article) {
  const title = normalize(article.title), lead = normalize(article.text?.slice(0, 900)), body = normalize(article.text)
  const scores = DIRECTIONS.slice(0, 3).map(d => ({ id: d.id, score: score(d.terms, title, lead, body) })).sort((a, b) => b.score - a.score)
  const topic = scores[0].score >= 6 ? scores[0].id : 'industry'
  const topics = scores.filter(s => s.score >= 12 && s.score >= scores[0].score * .55).map(s => s.id)
  if (!topics.includes(topic)) topics.unshift(topic)
  let type = 'insight'
  if (/回顾|圆满|收官|成功举办|精彩回放/.test(title)) type = 'recap'
  else if (/报名|申报|倒计时|参会指南|议程|正式启动|全攻略|邀[您你]|活动预告|门票|峰会.*开启|大会[｜丨|]|openday活动|openday\s*[｜丨|]/i.test(title)) type = 'event'
  else if (/榜单|百强|100强|30强|\btop\s*\d|\bai\s*(100|30)\b|非凡奖.*揭晓|流量|月活|应用数据|web.*数据|数据.*ai|ai.*数据告诉/i.test(title)) type = 'ranking'
  else if (/融资|获.*投资|完成.*轮|收购|上市/.test(title)) type = 'company'
  else if (/访谈|对话|圆桌|专访|panel|大佬.*拆解|位.*[聊说]|四个.*[说账]/i.test(title) || /本[期次].{0,12}访谈|以下.{0,12}(对话|访谈)|圆桌|主持人[：:]/.test(lead)) type = 'interview'
  const tags = TAG_RULES.map(([label, ...terms]) => ({ label, score: score(terms, title, lead, body) })).filter(t => t.score >= 3).sort((a, b) => b.score - a.score).slice(0, 8).map(t => t.label)
  if (!tags.length) tags.push('产业观察')
  return { topic, topics, type, tags, classification: { version: 1, method: 'weighted-keyword-rules', needsReview: tags[0] === '产业观察' || (scores[0].score >= 6 && scores[0].score < 12 && scores[0].score === scores[1].score), scores } }
}

const SYNONYMS = [['智能体', 'agent'], ['机器人', '具身'], ['出海', '全球化'], ['融资', '投资'], ['chatgpt', 'openai'], ['claude', 'anthropic']]
const normalizedDocuments = new WeakMap()
export function searchArticles(articles, { q = '', topic = '', type = '', tag = '', year = '', sort = 'newest' } = {}) {
  const terms = normalize(q).split(' ').filter(Boolean)
  return articles.filter(a => {
    if (topic && topic !== 'all' && !(a.topics || [a.topic]).includes(topic)) return false
    if (type && a.type !== type) return false
    if (tag && !a.tags.includes(tag)) return false
    if (year && !a.publishedAt.startsWith(year)) return false
    if (!terms.length) return true
    let text = normalizedDocuments.get(a)
    if (text === undefined) {
      text = normalize([a.title, a.text, a.author, ...a.tags, ...DIRECTIONS.filter(d => a.topics?.includes(d.id)).map(d => `${d.name} ${d.label}`)].join(' '))
      normalizedDocuments.set(a, text)
    }
    return terms.every(term => (SYNONYMS.find(group => group.includes(term)) || [term]).some(word => text.includes(word)))
  }).sort((a, b) => sort === 'oldest' ? a.publishedAt.localeCompare(b.publishedAt) || a.id.localeCompare(b.id) : b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))
}
