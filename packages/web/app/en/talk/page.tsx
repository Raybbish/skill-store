import TalkBoard from "@/components/TalkBoard";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Talk · oh-my-skill",
  description: "Open floor: requests, questions, feedback. Sign in to post.",
};

export default function TalkPageEn() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t("en", "talk.eyebrow")}</div>
        <h1 className="small">{t("en", "talk.h1")}</h1>
      </section>
      <TalkBoard />
    </>
  );
}
