import TalkBoard from "@/components/TalkBoard";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "讨论 · oh-my-skill",
  description: "公海:求推荐、提问、反馈。登录即可发言。",
};

/** 公海讨论区(ADR 0021):静态壳 + 客户端板(列表匿名读,发言走邮箱 OTP)。 */
export default function TalkPage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t("zh", "talk.eyebrow")}</div>
        <h1 className="small">{t("zh", "talk.h1")}</h1>
      </section>
      <TalkBoard />
    </>
  );
}
