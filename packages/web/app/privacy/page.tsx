import { BackHome } from "@/components/Chrome";
import { L } from "@/lib/i18n/client";

export const metadata = {
  title: "隐私 · oh-my-skill",
  description: "本站收集什么、存在哪、怎么删,一页说清。",
};

/** 隐私页(共享单路由,chrome 客户端切换语言)。只写事实,与代码行为一一对应:
 *  analytics.ts(匿名事件)/ receipts.ts(匿名回执)/ auth.ts(邮箱 OTP)。改行为须同步改这页。 */
export default function PrivacyPage() {
  const H = ({ zh, en }: { zh: string; en: string }) => (
    <h2 style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 700, marginTop: 28 }}><L zh={zh} en={en} /></h2>
  );
  const P = ({ zh, en }: { zh: string; en: string }) => (
    <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.9, marginTop: 8, maxWidth: "64ch" }}><L zh={zh} en={en} /></p>
  );
  return (
    <>
      <BackHome />
      <section className="hero">
        <div className="eyebrow"><L zh="隐私" en="Privacy" /></div>
        <h1 className="small"><L zh="收集什么、存在哪、怎么删" en="What we collect, where it lives, how to delete it" /></h1>
      </section>

      <P
        zh="浏览本站不需要账号。站点是静态页面,没有第三方广告或跟踪脚本。"
        en="Browsing requires no account. The site is static pages, with no third-party ads or tracking scripts."
      />

      <H zh="匿名使用事件" en="Anonymous usage events" />
      <P
        zh="搜索词、结果点击、复制安装命令与下载动作会作为匿名事件记录,带一个仅存于本浏览器会话的随机 id(sessionStorage),不含任何身份信息。用途:改进搜索与货架排序。"
        en="Search terms, result clicks, copied install commands and downloads are logged as anonymous events with a random per-session id (sessionStorage). No identity attached. Used to improve search and shelf ranking."
      />

      <H zh="匿名安装回执" en="Anonymous install receipts" />
      <P
        zh="下载 .skill/.zip 或用带 --t 参数的命令安装时,会留下一条匿名回执(随机 id 存于 localStorage),用于「从本店安装」的真实性验证。回执匿名可写、不可公开读取。"
        en="Downloading a .skill/.zip or installing with a --t token leaves an anonymous receipt (random id in localStorage), used to verify installs from this store. Receipts are write-only for the public."
      />

      <H zh="账号与内容" en="Account and content" />
      <P
        zh="只有在讨论区发言或给 skill 写短评时才需要登录,方式是邮箱验证码(经 Resend 发送)。我们存储:你的邮箱、你发布的内容。两者存于 Supabase。"
        en="Sign-in (email one-time code, sent via Resend) is only needed to post in Talk or review a skill. We store your email address and the content you post, in Supabase."
      />

      <H zh="删除" en="Deletion" />
      <P
        zh="要删除账号、邮箱或发布过的内容,联系我们:(联系方式待补)。清浏览器存储即可重置本机的匿名 id。"
        en="To delete your account, email or posted content, contact us: (contact to be added). Clearing browser storage resets the anonymous ids on this device."
      />
    </>
  );
}
