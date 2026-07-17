import { BackHome } from "@/components/Chrome";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "登录 · oh-my-skill",
  description: "登录 oh-my-skill:邮箱验证码或用 GitHub。浏览与下载无需账号。",
};

/** 登录页(ADR 0023 追记三;07-16 用户裁决改单栏方向 A):独立 /login,窄栏双居中。
 *  /me 未登录 → 重定向到这里;登录成功 → 回 /me。单路由共享页,chrome 客户端切语言。 */
export default function LoginPage() {
  return (
    <>
      <BackHome />
      <LoginClient />
    </>
  );
}
