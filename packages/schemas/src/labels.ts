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
 * 标签层为**分面(faceted)**设计(2026-07 定稿,见 Desktop 的 skill-store-标签设计.html + ADR 0010):
 *   - 每个标签归属一个 facet(activity/surface/language/tech/meta),面间正交;
 *   - `appliesTo` 分域:标签只在其适用分类的桶内出现/被 LLM 看到;
 *   - activity/surface/meta 每 skill 单值,language/tech ≤2(防随机仲裁与召回损失);
 *   - 三轴分工:本词表只管用途轴;信任轴=审核管线+CertBadge(cert_status);兼容轴=metadata;
 *   - 供给门槛 ≈1%:季度复核,≥1% 准入、连续两季 <0.7% 退出进候补名单(文件末尾)。
 *
 * `rules` 是启发式匹配规则(正则源串,引擎以 flags:"i" 编译),与词表同源——仅做 ingest 廉价初判;
 * `definition` + 正反例是 LLM(categorize:llm)权威判定的判据,**prompt 由词表生成**,只维护这一处。
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
   * 高 = 只是现有大类的横切面(如 testing 的成员几乎都已在 dev 有家)→ **永不自动升顶级**,只当标签。
   * 低 = 成员当前大多"无家可归"(uncategorized)→ 是块新地盘,量够了就该升顶级给它们安家。
   */
  maxOverlap: number;
}

/** 标签分面:每面回答一个正交问题(做什么动作 / 什么形态 / 什么语言 / 什么栈 / 是否元工具)。 */
export type Facet = 'activity' | 'surface' | 'language' | 'tech' | 'meta';

export interface FacetDef {
  id: Facet;
  zh: string;
  en: string;
  /** 每个 skill 在该面最多打几个标签(ADR 0010:language/tech ≤2,其余单值) */
  maxPerSkill: 1 | 2;
}

export const FACETS: FacetDef[] = [
  { id: 'activity', zh: '动作', en: 'Activity', maxPerSkill: 1 },
  { id: 'surface', zh: '形态', en: 'Surface', maxPerSkill: 1 },
  { id: 'language', zh: '语言', en: 'Language', maxPerSkill: 2 },
  { id: 'tech', zh: '技术栈', en: 'Tech', maxPerSkill: 2 },
  { id: 'meta', zh: '元能力', en: 'Meta', maxPerSkill: 1 },
];

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
  // ---- 以下仅标签(featured:false)携带 ----
  /** 归属分面 */
  facet?: Facet;
  /** 适用分类(featured slug 列表),或 'universal' = 全分类可用 */
  appliesTo?: string[] | 'universal';
  /** 一句判据:LLM prompt 由此生成,判据只维护这一处(勿在 prompt 里另写一份) */
  definition?: string;
  /** 正例(名字或一句话描述),易混标签必填 */
  positiveExamples?: string[];
  /** 反例:看着像但不该打此标签的情况,易混标签必填 */
  negativeExamples?: string[];
}

const DEFAULT_PROMOTE: PromotePolicy = { minShare: 0.05, minCount: 8, minCycles: 3, maxOverlap: 0.6 };

/** 分类判定:featured 标签得分 ≥ 此值才可当主分类 */
export const CATEGORY_THRESHOLD = 3;
/** 标签判定:任一标签得分 ≥ 此值即打上该标签 */
export const TAG_THRESHOLD = 1;

const r = (pattern: string, weight: number): LabelRule => ({ pattern, weight });

/** 技术集群:language/tech/技术动作/surface 四个面共享这一套适用域 */
const TECH_CLUSTER = ['dev', 'data-ai', 'security', 'cloud'];

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
    slug: 'ecommerce', label_zh: '电商', label_en: 'E-commerce', featured: true, order: 14, promote: DEFAULT_PROMOTE,
    rules: [
      r('e-?commerce', 3), r('shopify', 3), r('\\bcheckout', 3), r('\\bmerchant', 3), r('\\bfba\\b', 3),
      r('product listing', 3), r('storefront', 3), r('woocommerce', 3), r('magento', 3), r('dropship', 3),
      r('\\binventory', 2), r('\\bretail', 2), r('\\bshop\\b', 2), r('\\bamazon\\b', 1),
    ],
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
    // 残余 catch-all:featured 但排最后(order 高)。长期若膨胀成垃圾桶,由 promote 提议拆分。
    slug: 'utility', label_zh: '通用工具', label_en: 'Utility', featured: true, order: 90, promote: DEFAULT_PROMOTE,
    rules: [
      r('archive', 3), r('compress', 3), r('\\btar\\b', 3), r('\\bzip\\b', 3), r('file transfer', 3),
      r('token usage', 3), r('communication mode', 3),
      r('\\burl', 2), r('rewrit', 2), r('download', 2), r('fetch files', 2), r('\\bdiscover', 1),
    ],
  },

  // ==================================================================
  // featured:false —— 分面标签(2026-07 定稿)
  // 面间正交;activity/surface/meta 单值,language/tech ≤2;appliesTo 分域。
  // 已下线:sales/hr(与分类重叠)、web3/education(供给<门槛)、
  //        frontend(拆成 语言 ts/js + 形态 web)、code-qa(拆 testing/code-review)、
  //        devops(拆 deployment/monitoring)、database(头部并入 sql/语言面,长尾归搜索)、
  //        i18n(改名 localization 入通用动作)。
  // ==================================================================

  // ---------- A · 动作 Activity(技术集群) ----------
  {
    slug: 'testing', label_zh: '测试', label_en: 'Testing', featured: false, order: 20, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '编写、生成或运行测试(单测/集成/E2E/TDD),或提升测试覆盖与质量',
    rules: [r('\\btest(ing|s)?\\b', 1), r('\\btdd\\b', 2), r('unit test', 2), r('\\be2e\\b', 2), r('playwright', 1), r('\\bjest\\b', 1), r('pytest', 1), r('coverage', 1), r('\\bqa\\b', 1)],
  },
  {
    slug: 'code-review', label_zh: '代码审查', label_en: 'Code Review', featured: false, order: 21, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '审查代码质量:review PR/diff、静态检查、规范与最佳实践把关',
    negativeExamples: ['写测试用例的工具(→ testing)', '审计安全漏洞(→ 主分类 security)'],
    rules: [r('code review', 2), r('\\blint', 1), r('static analysis', 2), r('pull request review', 2), r('best practice', 1), r('code quality', 1)],
  },
  {
    slug: 'debugging', label_zh: '调试', label_en: 'Debugging', featured: false, order: 22, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '定位并修复运行时问题:排错、根因分析、读栈追踪',
    rules: [r('\\bdebug', 1), r('troubleshoot', 1), r('root cause', 2), r('stack trace', 2), r('\\bfix(ing)? bug', 1)],
  },
  {
    slug: 'refactoring', label_zh: '重构', label_en: 'Refactoring', featured: false, order: 23, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '在不改行为的前提下改善既有代码结构:重构、去坏味道、模块化',
    rules: [r('refactor', 2), r('code smell', 2), r('technical debt', 1), r('clean.?up', 1), r('modulariz', 1)],
  },
  {
    slug: 'deployment', label_zh: '部署', label_en: 'Deployment', featured: false, order: 24, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '把软件发布到运行环境:部署、发版、CI/CD 流水线、rollout',
    rules: [
      r('deploy', 1), r('release', 1), r('rollout', 1), r('github action', 1), r('\\bship(ping)?\\b', 1),
      // cicd 是 deployment 的别名(alias):不单独成标签,规则并入这里兜供给
      r('ci/?cd', 1), r('continuous (integration|deliver|deploy)', 1),
    ],
  },
  {
    slug: 'monitoring', label_zh: '监控', label_en: 'Monitoring', featured: false, order: 25, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '观测运行中的系统:监控、告警、日志、指标、tracing、可观测性',
    rules: [r('monitor', 1), r('observab', 2), r('alert', 1), r('\\bmetrics\\b', 1), r('\\btracing\\b', 1), r('telemetry', 1), r('\\blogging\\b', 1)],
  },
  {
    slug: 'migration', label_zh: '迁移', label_en: 'Migration', featured: false, order: 26, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '在系统/版本/平台之间搬迁:代码迁移、升级、数据迁移、legacy 现代化',
    rules: [r('migrat', 1), r('upgrad', 1), r('\\blegacy\\b', 1), r('moderniz', 1), r('port(ing)? (from|to)', 2)],
  },
  {
    slug: 'scaffolding', label_zh: '脚手架', label_en: 'Scaffolding', featured: false, order: 27, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: TECH_CLUSTER,
    definition: '从零生成项目/模块骨架:脚手架、boilerplate、starter、项目模板',
    negativeExamples: ['生成 skill 本身的模板工具(→ meta: skill-tooling)'],
    rules: [r('scaffold', 2), r('boilerplate', 2), r('\\bstarter\\b', 1), r('project template', 2), r('generate (a )?(new )?(project|app)', 2)],
  },

  // ---------- A′ · 动作 Activity(通用层:所有分类可叠加) ----------
  {
    slug: 'automation', label_zh: '自动化', label_en: 'Automation', featured: false, order: 28, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: 'universal',
    definition: '把重复流程自动化:定时任务、批处理、工作流编排(不限技术领域)',
    rules: [r('automat', 1), r('\\bcron\\b', 1), r('scheduled? (task|job)', 2), r('\\bbatch\\b', 1), r('workflow', 1)],
  },
  {
    slug: 'optimization', label_zh: '优化', label_en: 'Optimization', featured: false, order: 29, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: 'universal',
    definition: '让既有东西更快/更省/更好:性能调优、成本优化、转化优化(语义随所在分类而定)',
    rules: [r('optimi[sz]', 1), r('performance', 1), r('speed.?up', 1), r('efficien', 1), r('\\bperf\\b', 1)],
  },
  {
    slug: 'documentation', label_zh: '文档化', label_en: 'Documentation', featured: false, order: 30, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: 'universal',
    definition: '为已有东西写说明:README、API 文档、注释、changelog、知识沉淀',
    negativeExamples: ['生成 Word/PPT/PDF 办公文件(→ 主分类 docs)'],
    rules: [r('documentation', 2), r('\\breadme\\b', 2), r('docstring', 2), r('changelog', 1), r('api docs?', 2), r('document(ing)? (code|api)', 2)],
  },
  {
    slug: 'localization', label_zh: '本地化', label_en: 'Localization', featured: false, order: 31, promote: DEFAULT_PROMOTE,
    facet: 'activity', appliesTo: 'universal',
    definition: '翻译与本地化:多语言、i18n/l10n、跨语言内容适配(原 i18n 标签改名并入)',
    rules: [r('translat', 1), r('localiz', 1), r('localis', 1), r('i18n', 1), r('l10n', 1), r('multilingual', 1), r('japanese', 1), r('chinese', 1), r('korean', 1), r('spanish', 1)],
  },

  // ---------- B · 形态 Surface(它以什么形式交付/运行) ----------
  {
    slug: 'api', label_zh: 'API', label_en: 'API', featured: false, order: 40, promote: DEFAULT_PROMOTE,
    facet: 'surface', appliesTo: TECH_CLUSTER,
    definition: '围绕 API 交付:构建/调用/集成 REST/GraphQL/webhook 接口',
    rules: [r('\\bapi\\b', 1), r('\\brest(ful)?\\b', 1), r('graphql', 1), r('endpoint', 1), r('webhook', 1)],
  },
  {
    slug: 'web', label_zh: 'Web', label_en: 'Web', featured: false, order: 41, promote: DEFAULT_PROMOTE,
    facet: 'surface', appliesTo: TECH_CLUSTER,
    definition: '以网页/网站/浏览器为载体交付(原 frontend 标签的形态半边)',
    rules: [r('\\bweb ?(app|site|page)', 1), r('\\bhtml\\b', 1), r('\\bcss\\b', 1), r('\\bbrowser\\b', 1), r('tailwind', 1), r('frontend', 1)],
  },
  {
    slug: 'cli', label_zh: '命令行', label_en: 'CLI', featured: false, order: 42, promote: DEFAULT_PROMOTE,
    facet: 'surface', appliesTo: TECH_CLUSTER,
    definition: '以命令行/终端工具形态交付',
    rules: [r('\\bcli\\b', 1), r('command.?line', 1), r('terminal', 1), r('shell (tool|command)', 1)],
  },
  {
    slug: 'mcp', label_zh: 'MCP', label_en: 'MCP', featured: false, order: 43, promote: DEFAULT_PROMOTE,
    facet: 'surface', appliesTo: TECH_CLUSTER,
    definition: '本体在运行时作为 MCP server/client 交付能力——用户装它是为了「通过 MCP 用某能力」',
    positiveExamples: ['notion MCP 连接器', '浏览器控制 MCP'],
    negativeExamples: ['生成/调试/管理 MCP server 的工具(→ meta: mcp-server;双命中时 meta 优先)'],
    rules: [r('\\bmcp\\b', 1), r('model context protocol', 2)],
  },
  {
    slug: 'mobile', label_zh: '移动端', label_en: 'Mobile', featured: false, order: 44, promote: DEFAULT_PROMOTE,
    facet: 'surface', appliesTo: TECH_CLUSTER,
    definition: '面向移动平台交付:iOS/Android/React Native/Flutter',
    rules: [r('react native', 2), r('\\bexpo\\b', 1), r('\\bmobile\\b', 1), r('\\bios\\b', 1), r('android', 1), r('flutter', 1), r('\\bswift(ui)?\\b', 1), r('kotlin', 1)],
  },

  // ---------- C · 语言 Language(≤2;仅技术集群) ----------
  {
    slug: 'python', label_zh: 'Python', label_en: 'Python', featured: false, order: 50, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Python',
    rules: [r('\\bpython\\b', 1), r('django', 1), r('flask', 1), r('fastapi', 1)],
  },
  {
    slug: 'typescript', label_zh: 'TypeScript', label_en: 'TypeScript', featured: false, order: 51, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 TypeScript(原 frontend 标签的语言半边)',
    rules: [r('typescript', 1), r('\\btsx?\\b', 1)],
  },
  {
    slug: 'javascript', label_zh: 'JavaScript', label_en: 'JavaScript', featured: false, order: 52, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 JavaScript / Node.js',
    rules: [r('javascript', 1), r('node\\.?js', 1), r('\\bnpm\\b', 1)],
  },
  {
    slug: 'go', label_zh: 'Go', label_en: 'Go', featured: false, order: 53, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Go',
    rules: [r('\\bgolang\\b', 2), r('goroutine', 2), r('go module', 2)],
  },
  {
    slug: 'java', label_zh: 'Java', label_en: 'Java', featured: false, order: 54, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Java / JVM 生态',
    rules: [r('\\bjava\\b(?!script)', 1), r('spring boot', 2), r('\\bmaven\\b', 1), r('\\bkotlin\\b', 1)],
  },
  {
    slug: 'rust', label_zh: 'Rust', label_en: 'Rust', featured: false, order: 55, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Rust',
    rules: [r('\\brust\\b', 1), r('\\bcargo\\b', 1)],
  },
  {
    slug: 'ruby', label_zh: 'Ruby', label_en: 'Ruby', featured: false, order: 56, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Ruby',
    rules: [r('\\bruby\\b', 1), r('\\brails\\b', 1)],
  },
  {
    slug: 'php', label_zh: 'PHP', label_en: 'PHP', featured: false, order: 57, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 PHP',
    rules: [r('\\bphp\\b', 1), r('laravel', 1), r('wordpress plugin', 1)],
  },
  {
    slug: 'elixir', label_zh: 'Elixir', label_en: 'Elixir', featured: false, order: 58, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Elixir',
    rules: [r('elixir', 1), r('phoenix framework', 2), r('\\becto\\b', 1)],
  },
  {
    slug: 'sql', label_zh: 'SQL', label_en: 'SQL', featured: false, order: 59, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要围绕 SQL/数据库查询工作(原 database 标签的头部供给并入此面)',
    rules: [r('\\bsql\\b', 1), r('postgres', 1), r('mysql', 1), r('database quer', 1), r('\\bschema\\b', 1)],
  },
  {
    slug: 'bash', label_zh: 'Bash', label_en: 'Bash', featured: false, order: 60, promote: DEFAULT_PROMOTE,
    facet: 'language', appliesTo: TECH_CLUSTER,
    definition: '主要工作语言是 Bash / shell 脚本',
    rules: [r('\\bbash\\b', 1), r('shell script', 2), r('\\bzsh\\b', 1)],
  },

  // ---------- D · 技术栈 Tech(≤2;只做头部,长尾归搜索/SEO tag 页,见 ADR 0009) ----------
  {
    slug: 'github', label_zh: 'GitHub', label_en: 'GitHub', featured: false, order: 70, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '深度集成 GitHub:actions、PR/issue 工作流、repo 管理',
    rules: [r('github', 1), r('pull request', 1), r('\\bgist\\b', 1)],
  },
  {
    slug: 'aws', label_zh: 'AWS', label_en: 'AWS', featured: false, order: 71, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '深度依赖 AWS 服务(S3/Lambda/EC2 等)',
    rules: [r('\\baws\\b', 1), r('amazon web services', 2), r('\\bs3\\b', 1), r('\\blambda\\b', 1), r('\\bec2\\b', 1)],
  },
  {
    slug: 'docker', label_zh: 'Docker', label_en: 'Docker', featured: false, order: 72, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '围绕容器工作:Dockerfile、镜像、容器化',
    rules: [r('\\bdocker', 1), r('container(iz)?', 1), r('dockerfile', 2)],
  },
  {
    slug: 'kubernetes', label_zh: 'Kubernetes', label_en: 'Kubernetes', featured: false, order: 73, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '围绕 K8s 工作:集群、helm、operator',
    rules: [r('kubernetes', 1), r('\\bk8s\\b', 1), r('\\bhelm\\b', 1), r('\\bkubectl\\b', 1)],
  },
  {
    slug: 'react', label_zh: 'React', label_en: 'React', featured: false, order: 74, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '深度绑定 React 生态(含 Next.js)',
    negativeExamples: ['React Native 移动开发(→ surface: mobile)'],
    rules: [r('\\breact\\b(?! native)', 1), r('next\\.?js', 1), r('\\bhooks?\\b', 1)],
  },
  {
    slug: 'openai', label_zh: 'OpenAI', label_en: 'OpenAI', featured: false, order: 75, promote: DEFAULT_PROMOTE,
    facet: 'tech', appliesTo: TECH_CLUSTER,
    definition: '深度依赖 OpenAI API(GPT/DALL·E/Whisper)',
    rules: [r('openai', 1), r('\\bgpt-?[45o]', 1), r('dall.?e', 1), r('whisper', 1)],
  },

  // ---------- E · 元能力 Meta(造/管 skill、agent、MCP 本身;本生态特有) ----------
  {
    // ⚠ 历史教训:定义一模糊就被打花(名义 1,248 条,真实约一两百)。判据从严。
    slug: 'skill-tooling', label_zh: 'Skills 工具', label_en: 'Skill Tooling', featured: false, order: 80, promote: DEFAULT_PROMOTE,
    facet: 'meta', appliesTo: ['dev'],
    definition: '服务 skill/agent 系统**本身**的元工具:创建、打包、测试、分发、发现 skill。「本身是个 skill」不算',
    positiveExamples: ['skill-creator(生成新 skill 的脚手架)', 'skillify(把仓库打包成 skill)', 'skill 市场搜索器'],
    negativeExamples: ['调试 Python 的 skill(它只是「是个 skill」,不服务 skill 系统)', '抓取网页评论的 skill', '视频转字幕的 skill'],
    rules: [
      r('skill.?creator', 4), r('skill.?maker', 4), r('template.?skill', 4),
      r('find.?skills?\\b', 3), r('discover and install', 3), r('create new skill', 3), r('package.+skill', 2),
    ],
  },
  {
    slug: 'agent-ops', label_zh: '智能体编排', label_en: 'Agent Ops', featured: false, order: 81, promote: DEFAULT_PROMOTE,
    facet: 'meta', appliesTo: ['dev'],
    definition: '编排/管理 agent 本身:多 agent 协作、subagent、handoff、agent 记忆与上下文管理',
    positiveExamples: ['多 agent 任务分发框架', 'agent 会话记忆管理器'],
    negativeExamples: ['用 agent 完成某业务任务的 skill(看业务归类,不进 meta)'],
    rules: [r('orchestrat', 1), r('multi-?agent', 2), r('subagent', 2), r('agent framework', 2), r('\\bhandoff', 1), r('context management', 1), r('agent memory', 2)],
  },
  {
    slug: 'mcp-server', label_zh: 'MCP 构建', label_en: 'MCP Server Tooling', featured: false, order: 82, promote: DEFAULT_PROMOTE,
    facet: 'meta', appliesTo: ['dev'],
    definition: '工作对象是 MCP server 本身:生成、调试、部署、管理它们——用户装它是为了「造/管 MCP」',
    positiveExamples: ['mcp-inspector(调试 MCP server)', 'create-mcp-app(脚手架)'],
    negativeExamples: ['本体作为 MCP server 运行的连接器(→ surface: mcp;双命中时本标签优先)'],
    rules: [r('mcp.?(server|builder|inspector)', 2), r('create.?mcp', 2), r('(build|generat|scaffold).{0,20}mcp', 2)],
  },

  // ------------------------------------------------------------------
  // 候补名单(watchlist)—— 不占筛选位,过线由季度复核自动放行。
  // 准入线 = 全语料 1%(2026-07 约 58 条);连续两季 <0.7% 的在表标签退回这里。
  //   browser-ext / desktop     (形态面候补,2026-07 供给不足)
  //   postgres 24 / vue 7 / svelte 4 / supabase 4(技术栈长尾,由搜索 + SEO tag 页兜,ADR 0009)
  //   域面候选(§05 的 marketing 渠道/漏斗、science 学科/方法、writing 类型、product 阶段、
  //   data-ai/security/cloud 方向面)——设计已备,但**未做语料供给测量**,按门槛原则先不入表,
  //   测量 ≥1% 再逐个启用。
  // ------------------------------------------------------------------
];

// ---------- 便捷访问器 ----------
export const labelBySlug = (slug: string): LabelDef | undefined => LABELS.find((l) => l.slug === slug);
export const featuredLabels = (): LabelDef[] => LABELS.filter((l) => l.featured).sort((a, b) => a.order - b.order);
export const tagLabels = (): LabelDef[] => LABELS.filter((l) => !l.featured);
export const allSlugs = (): string[] => LABELS.map((l) => l.slug);
export const labelZh = (slug: string): string => labelBySlug(slug)?.label_zh ?? slug;

/** 某分类桶内适用的标签(appliesTo 分域;categorize:llm 只把这些递给模型) */
export const tagsForCategory = (category: string): LabelDef[] =>
  tagLabels().filter((t) => t.appliesTo === 'universal' || (Array.isArray(t.appliesTo) && t.appliesTo.includes(category)));

/** 按分面取标签(BrowseClient 分面筛选组用) */
export const tagsByFacet = (facet: Facet): LabelDef[] => tagLabels().filter((t) => t.facet === facet);
export const facetById = (id: Facet): FacetDef | undefined => FACETS.find((f) => f.id === id);
