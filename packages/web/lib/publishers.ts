/** 发布者数据层。真实数据从 catalog 派生(allSkills / 安装数)。
 *  社区 / 评价 / 评测挑战等演示层已随 ADR 0017 下线(不装活红线);真实社区将来自 DB。
 *  仅服务端使用(依赖 data.ts 的 fs 读取)。 */
import { allSkills } from "./data";
import { toCard, type SkillCard } from "./store";

export interface PublisherView {
  pub: string;
  /** 作品集只带瘦卡 —— 列表行所需字段面,别把全量 Skill 序列化给客户端组件(ADR 0007) */
  works: SkillCard[];
}

export function listPublishers(): string[] {
  return [...new Set(allSkills().map((s) => s.publisher))];
}

export function getPublisherView(pub: string): PublisherView | null {
  const works = allSkills()
    .filter((s) => s.publisher === pub)
    .sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0))
    .map(toCard);
  if (!works.length) return null;
  return { pub, works };
}
