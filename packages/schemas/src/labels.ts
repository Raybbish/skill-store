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
      r('architecture', 3), r('browser automation', 3), r('skill.?creator', 3),
      r('\\bcli\\b', 2), r('\\bgit\\b', 2), r('framework', 2), r('\\bcode\\b', 2), r('coding', 2),
      r('\\brepo\\b', 2), r('\\bissue', 2), r('\\bprd\\b', 2), r('backend', 2), r('template', 2),
      r('composition', 2), r('optimiz', 2), r('best practice', 2), r('engineering', 2), r('pull request', 2),
    ],
  },
  {
    slug: 'media', label_zh: '媒体生成', label_en: 'Media', featured: true, order: 2, promote: DEFAULT_PROMOTE,
    rules: [
      r('\\bvideo', 3), r('\\bmusic', 3), r('\\baudio', 3), r('\\bimage', 3), r('\\bgif\\b', 3),
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
      r('\\bcontact', 2), r('workflow', 2), r('\\btask', 2), r('monitor', 2),
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
];

// ---------- 便捷访问器 ----------
export const labelBySlug = (slug: string): LabelDef | undefined => LABELS.find((l) => l.slug === slug);
export const featuredLabels = (): LabelDef[] => LABELS.filter((l) => l.featured).sort((a, b) => a.order - b.order);
export const tagLabels = (): LabelDef[] => LABELS.filter((l) => !l.featured);
export const allSlugs = (): string[] => LABELS.map((l) => l.slug);
export const labelZh = (slug: string): string => labelBySlug(slug)?.label_zh ?? slug;
