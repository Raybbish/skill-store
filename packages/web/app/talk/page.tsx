import TalkBoard from "@/components/TalkBoard";

export const metadata = {
  title: "讨论 · oh-my-skill",
  description: "公海:求推荐、提问、反馈。登录即可发言。",
};

/** 公海讨论区(ADR 0021):静态壳 + 客户端板(列表匿名读,发言走邮箱 OTP)。 */
export default function TalkPage() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">讨论</div>
        <h1 className="small">公海</h1>
      </section>
      <TalkBoard />
    </>
  );
}
