import { BackHome } from "@/components/Chrome";
import { readIdxMeta } from "@/lib/store-server";
import { featuredLabels } from "@skill-store/schemas";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "登录 · oh-my-skill",
  description: "登录 oh-my-skill:邮箱验证码或用 GitHub。浏览与下载无需账号。",
};

/** 登录页(ADR 0023 追记三):独立 /login,双栏外壳。计数构建期从 meta.json 注入。
 *  /me 未登录 → 重定向到这里;登录成功 → 回 /me。单路由共享页,chrome 客户端切语言。 */
export default function LoginPage() {
  const meta = readIdxMeta();
  return (
    <>
      <BackHome />
      <LoginClient total={meta.total} cats={featuredLabels().length} />
    </>
  );
}
