/**
 * labels.ts —— taxonomy 的单一来源(四端共享)。
 *
 * 长期最优设计:分类与标签共用**同一套标签词表**,区别只在 `featured` 开关:
 *   - featured: true  → 顶级分类(进导航 / SEO 落地页,URL 稳定,少动)
 *   - featured: false → 仅标签(桶内二级筛选;冒头的新聚类先待在这里)
 *
 * 于是「升一个分类 / 降一个分类」= 翻一个 flag,不改代码、不动 URL(见 pipeline/jobs/promote.ts)。
 * 加/调标签 = 改这份数据,分类引擎(pipeline/categorize.ts)不用动。
 *
 * `rules` 是启发式匹配规则(正则源串,引擎以 flags:"i" 编译),与词表同源。
 * 权重:4=文件类型级决定性 · 3=品类专有 · 2=中 · 1=弱。
 */

export interface LabelRule {
  pattern: string;
  weight: number;
}

/** 晋级 / 降级策略(promote.ts 用)。阈值用相对占比抗规模漂移,叠加绝对量与防抖周期。 */
export interface PromotePolicy {
  /** 目录占比阈值 */
  minShare: number;
  /** 绝对量下限 */
  minCount: number;
  /** 连续达标 / 失守的同步周期数(防抖) */
  minCycles: number;
  /**
   * 语义独立性闸:该标签成员中,**已被现有 featured 分类收纳**(主分类非 uncategorized)的占比上限。
   * 高 = 只是现有大类的横切面(如 frontend 的成员几乎都已在 dev/design 有家)→ **永不自动升顶级**,只当标签。
   * 低 = 成员当前大多"无家可归"(uncategorized)→ 是块新地盘,量够了就该升顶级给它们安家(如未来的 marketing / finance)。
   */
  maxOverlap: number;
}

export interface LabelDef {
  slug: string;
  label_zh: string;
  label_en: string;
  /** true=顶级分类;false=仅标签 */
  featured: boolean;
  /** 导航显示顺序(越小越靠前);utility 类残余项放最后 */
  order: number;
  promote: PromotePolicy;
  rules: LabelRule[];
}

const DEFAULT_PROMOTE: PromotePolicy = { minShare: 0.05, minCount: 8, minCycles: 3, maxOverlap: 0.6 };

/** 分类判定:featured 标签得分 ≥ 此值才可当主分类 */
export const CATEGORY_THRESHOLD = 3;
/** 标签判定:任一标签得分 ≥ 此值即打上该标签 */
export const TAG_THRESHOLD = 1;

const r = (pattern: string, weight: number): LabelRule => ({ pattern, weight });

/**
 * 词表本体。featured 的初始集只是「当前有持久供给」的种子状态,
 * 之后由 promote.ts 依数据自动提议增删——不要手工长期维护这张表的 featured。
 */
export const LABELS: LabelDef[] = [
  // ---------- featured:true(顶级分类)----------
  {
    slug: 'dev', label_zh: '开发工程', label_en: 'Development', featured: true, order: 1, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bapi\\b', 3), r('\\bsdk\\b', 3), r('\\bmcp\\b', 3), r('\\btdd\\b', 3), r('\\btest(ing)?\\b', 3),
      r('deploy', 3), r('github action', 3), r('\\breact\\b', 3), r('next\\.?js', 3), r('codebase', 3),
      r('refactor', 3), r('postgres', 3), r('\\bsql\\b', 3), r('webapp', 3), r('prototyp', 3),
      r('software architecture', 3), r('system design', 3), r('architecture', 2), r('browser automation', 3), r('skill.?creator', 3),
      r('\\bcli\\b', 2), r('\\bgit\\b', 2), r('framework', 2), r('\\bcode\\b', 2), r('coding', 2),
      r('\\brepo\\b', 2), r('\\bissue', 2), r('\\bprd\\b', 2), r('backend', 2), r('template', 2),
      r('composition', 2), r('optimiz', 2), r('best practice', 2), r('engineering', 2), r('pull request', 2),
    ],
  },
  {
    slug: 'media', label_zh: '媒体生成', label_en: 'Media', featured: true, order: 2, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bvideo', 3), r('\\bmusic', 3), r('\\baudio', 3), r('\\bgif\\b', 3),
      r('text.?to.?image', 3), r('image (generat|editing|edit|upscal)', 3), r('\\bimage', 2),
      r('animation', 3), r('\\brender', 3), r('remotion', 3), r('kling', 3), r('comfy', 3),
      r('inpaint', 3), r('outpaint', 3),
    ],
  },
  {
    slug: 'design', label_zh: '设计创意', label_en: 'Design', featured: true, order: 3, promote: DEFAULT_PROMOTE,
    rules: [
      r('brand', 3), r('theme', 3), r('canvas', 3), r('p5\\.?js', 3), r('\\bart\\b', 3), r('typography', 3),
      r('\\bdesign', 2), r('\\bui\\b', 2), r('visual', 2), r('styling', 2), r('screens', 2),
    ],
  },
  {
    slug: 'docs', label_zh: '文档办公', label_en: 'Documents', featured: true, order: 4, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bdocx\\b', 4), r('\\bpptx\\b', 4), r('\\bxlsx\\b', 4), r('\\bpdf\\b', 4),
      r('powerpoint', 3), r('spreadsheet', 3), r('word document', 3), r('co-?author', 3), r('internal comm', 3),
      r('\\bslide', 2), r('document', 2), r('presentation', 2), r('\\bwriting\\b', 2), r('prose', 2),
      r('\\bmemo\\b', 2), r('\\bletter\\b', 2), r('\\breport\\b', 1), r('\\bemail', 1),
    ],
  },
  {
    slug: 'productivity', label_zh: '协作生产力', label_en: 'Productivity', featured: true, order: 5, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\blark', 3), r('feishu', 3), r('飞书', 3), r('approval', 3), r('calendar', 3),
      r('meeting', 3), r('standup', 3), r('agenda', 3), r('notion', 3),
      r('\\bcontact', 2), r('workflow', 2), r('\\btask', 1), r('monitor', 1),
    ],
  },
  {
    slug: 'cloud', label_zh: '云与基础设施', label_en: 'Cloud & Infra', featured: true, order: 6, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bazure', 3), r('\\baws\\b', 3), r('\\bgcp\\b', 3), r('\\bcloud', 3), r('infrastructure', 3),
      r('\\bvm\\b', 3), r('vmss', 3), r('\\bcompute\\b', 3), r('quota', 3), r('foundry', 3),
      r('self-?host', 3), r('harden', 3), r('devops', 3), r('provision', 2), r('\\bserver', 2), r('migrat', 2),
    ],
  },
  {
    slug: 'data-ai', label_zh: '数据与 AI', label_en: 'Data & AI', featured: true, order: 7, promote: DEFAULT_PROMOTE,
    rules: [
      r('machine learning', 3), r('data science', 3), r('\\bdataset', 3), r('\\banalytics\\b', 3), r('\\betl\\b', 3),
      r('\\bllm\\b', 3), r('\\brag\\b', 3), r('embedding', 3), r('fine.?tun', 3), r('\\bneural', 3),
      r('data pipeline', 3), r('data engineer', 3), r('\\bpandas\\b', 3), r('jupyter', 3), r('data analysis', 3),
      r('classifier', 3), r('feature engineering', 3), r('vector (db|database|store|search)', 3), r('model training', 3),
      r('\\bdata\\b', 1), r('\\bml\\b', 2), r('statistic', 2), r('forecast', 2), r('prediction', 2), r('\\bai\\b', 1),
    ],
  },
  {
    slug: 'writing', label_zh: '写作内容', label_en: 'Writing', featured: true, order: 8, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bblog', 3), r('copywrit', 3), r('storytell', 3), r('\\bnovel\\b', 3), r('screenplay', 3),
      r('ghostwrit', 3), r('proofread', 3), r('content writing', 3), r('\\barticle', 3), r('\\bessay', 3), r('\\bnarrat', 3),
      r('\\bwriting\\b', 2), r('\\bwriter\\b', 2), r('\\bcontent\\b', 2), r('\\bedit(ing|or)\\b', 2),
      r('\\bprose\\b', 2), r('\\bstory\\b', 2), r('\\bdraft', 2),
    ],
  },
  {
    slug: 'marketing', label_zh: '市场营销', label_en: 'Marketing', featured: true, order: 9, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bmarketing\\b', 3), r('\\bseo\\b', 3), r('advertis', 3), r('\\bcampaign', 3), r('social media', 3),
      r('\\bnewsletter', 3), r('email marketing', 3), r('content marketing', 3), r('go-?to-?market', 3),
      r('\\bgtm\\b', 3), r('growth hack', 3), r('brand strateg', 3), r('brand voice', 3),
      r('\\bads?\\b', 2), r('\\baudience', 2), r('\\bengagement', 2), r('conversion', 2), r('\\bfunnel', 2), r('\\bpromot', 2),
    ],
  },
  {
    slug: 'science', label_zh: '科研学术', label_en: 'Science', featured: true, order: 10, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bresearch\\b', 1), r('academic', 3), r('scientific', 3), r('\\bbiolog', 3), r('chemistry', 3),
      r('\\bphysics\\b', 3), r('\\bgenom', 3), r('\\bprotein\\b', 3), r('clinical', 3), r('laborator', 3),
      r('\\bexperiment', 3), r('hypothesis', 3), r('\\bthesis\\b', 3), r('literature review', 3), r('\\bcitation', 3),
      r('peer.?review', 3),
      r('\\bstud(y|ies)\\b', 2), r('\\bscholar', 2), r('\\bjournal\\b', 2), r('\\blab\\b', 2), r('\\bpaper\\b', 2),
    ],
  },
  {
    slug: 'product', label_zh: '产品管理', label_en: 'Product', featured: true, order: 11, promote: DEFAULT_PROMOTE,
    rules: [
      r('product manager', 3), r('product management', 3), r('\\bprd\\b', 3), r('roadmap', 3), r('user stor', 3),
      r('product spec', 3), r('product requirement', 3), r('\\bbacklog', 3), r('product discovery', 3), r('feature prioriti', 3),
      r('\\bpm\\b', 2), r('\\bsprint', 2), r('\\bstakeholder', 2), r('\\bmvp\\b', 2), r('\\bpersona', 2), r('\\bepic\\b', 2),
    ],
  },
  {
    slug: 'legal', label_zh: '法律合规', label_en: 'Legal', featured: true, order: 12, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\blegal\\b', 3), r('\\blaw\\b', 3), r('\\blawyer', 3), r('\\bcontract', 3), r('compliance', 3),
      r('\\bgdpr\\b', 3), r('regulat', 3), r('\\battorney', 3), r('litigation', 3), r('\\bpatent', 3),
      r('\\brecht\\b', 3), r('terms of service', 3), r('privacy polic', 3), r('\\bnda\\b', 3),
      r('\\bpolicy\\b', 2), r('\\bclause', 2), r('jurisdiction', 2), r('\\bstatut', 2),
    ],
  },
  {
    slug: 'finance', label_zh: '金融财务', label_en: 'Finance', featured: true, order: 13, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bfinanc', 3), r('\\btrading\\b', 3), r('\\binvest(ing|ment|or|ors)?\\b', 3), r('stock market', 3), r('\\bequit(y|ies)\\b', 3),
      r('portfolio', 3), r('\\bhedge', 3), r('\\bcrypto', 3), r('\\bdefi\\b', 3), r('accounting', 3),
      r('bookkeep', 3), r('\\btax\\b', 3), r('\\bvaluation\\b', 3), r('fintech', 3), r('\\bbanking\\b', 3), r('\\bledger', 3),
      r('\\brevenue', 2), r('\\bpricing', 2), r('\\bpayment', 2), r('\\bfund(ing|s)?\\b', 2),
    ],
  },
  {
    // 残余 catch-all:featured 但排最后(order 高)。长期若膨胀成垃圾桶,由 promote 提议拆分。
    slug: 'utility', label_zh: '通用工具', label_en: 'Utility', featured: true, order: 90, promote: DEFAULT_PROMOTE,
    rules: [
      r('archive', 3), r('compress', 3), r('\\btar\\b', 3), r('\\bzip\\b', 3), r('file transfer', 3),
      r('token usage', 3), r('communication mode', 3),
      r('\\burl', 2), r('rewrit', 2), r('download', 2), r('fetch files', 2), r('\\bdiscover', 1),
    ],
  },

  // ---------- featured:false(仅标签,达阈值 + 独立性后由 promote 自动扶正)----------
  {
    // 元类:造/管/找 skill 与 agent 扩展工具。对「skill 商店」很切题,供给一定会涨 → 待自动晋级。
    slug: 'skill-tooling', label_zh: 'Skills 工具', label_en: 'Skill Tooling', featured: false, order: 20, promote: DEFAULT_PROMOTE,
    rules: [
      r('skill.?creator', 4), r('skill.?maker', 4), r('template.?skill', 4), r('mcp.?builder', 4),
      r('find.?skills?\\b', 3), r('discover and install', 3), r('create new skill', 3), r('modify and improve', 2),
      r('agent skill', 2),
    ],
  },
  {
    // dev 子面:高量(~23%)但基本 ⊂ dev → maxOverlap 会挡住升顶级,长期就当标签。
    slug: 'frontend', label_zh: '前端', label_en: 'Frontend', featured: false, order: 21, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\breact\\b', 1), r('next\\.?js', 1), r('\\bvue\\b', 1), r('\\bcss\\b', 1), r('tailwind', 1),
      r('\\bui\\b', 1), r('frontend', 1), r('view transition', 1), r('composition', 1), r('web artifact', 1), r('\\bbrowser\\b', 1),
    ],
  },
  {
    slug: 'code-qa', label_zh: '代码质检', label_en: 'Code QA', featured: false, order: 22, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\btest(ing)?\\b', 1), r('\\btdd\\b', 1), r('\\breview', 1), r('\\blint', 1), r('\\bquality\\b', 1),
      r('best practice', 1), r('\\baudit', 1), r('coverage', 1), r('\\bqa\\b', 1),
    ],
  },
  {
    slug: 'mobile', label_zh: '移动开发', label_en: 'Mobile', featured: false, order: 23, promote: DEFAULT_PROMOTE,
    rules: [r('react native', 1), r('\\bexpo\\b', 1), r('\\bmobile\\b', 1), r('\\bios\\b', 1), r('android', 1)],
  },
  {
    slug: 'devops', label_zh: '运维部署', label_en: 'DevOps', featured: false, order: 24, promote: DEFAULT_PROMOTE,
    rules: [r('devops', 1), r('kubernetes', 1), r('\\bk8s\\b', 1), r('\\bdocker', 1), r('terraform', 1), r('ci/?cd', 1), r('ansible', 1), r('\\bhelm\\b', 1), r('observability', 1), r('\\bsre\\b', 1)],
  },
  {
    slug: 'database', label_zh: '数据库', label_en: 'Database', featured: false, order: 25, promote: DEFAULT_PROMOTE,
    rules: [r('database', 1), r('\\bsql\\b', 1), r('postgres', 1), r('mysql', 1), r('mongo', 1), r('\\bredis\\b', 1), r('supabase', 1), r('prisma', 1), r('\\bschema\\b', 1)],
  },
  {
    slug: 'security', label_zh: '安全', label_en: 'Security', featured: true, order: 16, promote: DEFAULT_PROMOTE,
    rules: [
      r('pentest', 3), r('penetration test', 3), r('\\bexploit', 3), r('\\bmalware', 3), r('\\bforensic', 3),
      r('owasp', 3), r('\\bcve\\b', 3), r('infosec', 3), r('shellcode', 3), r('dcsync', 3), r('\\bransomware', 3),
      r('red.?team', 3), r('threat (detection|model|hunt|intel)', 3), r('\\bfuzz(ing|er)?\\b', 3), r('\\bmalicious', 3),
      r('vulnerab', 3), r('\\bcyber', 3), r('reverse engineer', 3),
      r('\\bsecurity\\b', 2), r('encryption', 2), r('\\bhardening', 2),
    ],
  },
  {
    slug: 'sales', label_zh: '销售', label_en: 'Sales', featured: false, order: 27, promote: DEFAULT_PROMOTE,
    rules: [r('\\bsales\\b', 1), r('\\bcrm\\b', 1), r('salesforce', 1), r('hubspot', 1), r('lead gen', 1), r('outreach', 1), r('prospect', 1)],
  },
  {
    slug: 'ecommerce', label_zh: '电商', label_en: 'E-commerce', featured: true, order: 14, promote: DEFAULT_PROMOTE,
    rules: [
      r('e-?commerce', 3), r('shopify', 3), r('\\bcheckout', 3), r('\\bmerchant', 3), r('\\bfba\\b', 3),
      r('product listing', 3), r('storefront', 3), r('woocommerce', 3), r('magento', 3), r('dropship', 3),
      r('\\binventory', 2), r('\\bretail', 2), r('\\bshop\\b', 2), r('\\bamazon\\b', 1),
    ],
  },
  {
    slug: 'hr', label_zh: '人力资源', label_en: 'HR', featured: false, order: 29, promote: DEFAULT_PROMOTE,
    rules: [r('recruit', 1), r('hiring', 1), r('\\bhr\\b', 1), r('\\bresume\\b', 1), r('\\bcv\\b', 1), r('interview', 1), r('onboarding', 1), r('payroll', 1), r('\\btalent', 1)],
  },
  {
    slug: 'i18n', label_zh: '本地化', label_en: 'i18n', featured: false, order: 30, promote: DEFAULT_PROMOTE,
    rules: [r('translat', 1), r('localiz', 1), r('localis', 1), r('i18n', 1), r('multilingual', 1), r('\\bthai\\b', 1), r('japanese', 1), r('chinese', 1), r('korean', 1), r('spanish', 1)],
  },
  {
    slug: 'healthcare', label_zh: '医疗健康', label_en: 'Healthcare', featured: true, order: 15, promote: DEFAULT_PROMOTE,
    rules: [
      r('healthcare', 3), r('\\bpatient', 3), r('diagnos', 3), r('\\btherap(y|ist|eutic)', 3), r('\\bwellness', 3),
      r('\\bnutrition', 3), r('mental health', 3), r('medication', 3),
      r('\\bclinic', 2), r('\\bmedical\\b', 2), r('\\bhealth\\b', 2), r('fitness', 2),
    ],
  },
  {
    slug: 'education', label_zh: '教育', label_en: 'Education', featured: false, order: 32, promote: DEFAULT_PROMOTE,
    rules: [r('\\blearn', 1), r('\\bteach', 1), r('\\btutor', 1), r('education', 1), r('\\bcourse', 1), r('\\bstudent', 1), r('\\bexam\\b', 1), r('\\bquiz\\b', 1), r('curriculum', 1), r('k12', 1)],
  },
  {
    slug: 'web3', label_zh: 'Web3', label_en: 'Web3', featured: false, order: 33, promote: DEFAULT_PROMOTE,
    rules: [r('blockchain', 1), r('web3', 1), r('solidity', 1), r('smart contract', 1), r('ethereum', 1), r('\\bnft\\b', 1), r('\\bwallet\\b', 1)],
  },
  {
    slug: 'agent-ops', label_zh: '智能体编排', label_en: 'Agent Ops', featured: false, order: 34, promote: DEFAULT_PROMOTE,
    rules: [r('orchestrat', 1), r('multi-?agent', 1), r('\\bmemory\\b', 1), r('subagent', 1), r('agent framework', 1), r('\\bhandoff', 1), r('context management', 1)],
  },
];

// ---------- 便捷访问器 ----------
export const labelBySlug = (slug: string): LabelDef | undefined => LABELS.find((l) => l.slug === slug);
export const featuredLabels = (): LabelDef[] => LABELS.filter((l) => l.featured).sort((a, b) => a.order - b.order);
export const tagLabels = (): LabelDef[] => LABELS.filter((l) => !l.featured);
export const allSlugs = (): string[] => LABELS.map((l) => l.slug);
export const labelZh = (slug: string): string => labelBySlug(slug)?.label_zh ?? slug;
