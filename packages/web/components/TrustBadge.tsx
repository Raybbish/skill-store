import type { SkillCard } from "@/lib/store";

/**
 * 信任披露开关组件(ADR 0012 步骤④):skill.verdict 存在才渲染。
 * 该字段由 build-index 在 TRUST_DISPLAY=1 且 policy 定稿时注入——当前恒缺省,本组件恒 null,
 * 所以「重新上架 = 只开 flag」。视觉与弹窗语义(认证 vs 披露)是 policy v1 阶段的设计议题,
 * 这里刻意只做最小披露:状态 + 口径版本 + 「披露非背书」。
 */
export default function TrustBadge({ skill }: { skill: SkillCard }) {
  const v = skill.verdict;
  if (!v) return null;
  const ok = v.status === "pass";
  return (
    <span
      className={`trust ${ok ? "" : "rev"}`}
      title={`已扫描 · ${v.status} · policy ${v.policy} —— 披露非背书`}
      aria-label={`判定 ${v.status}(policy ${v.policy}),披露非背书`}
    >
      {ok ? "✓" : "⚠"}
    </span>
  );
}
