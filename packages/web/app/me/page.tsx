import { BackHome } from "@/components/Chrome";
import MeClient from "./MeClient";

export const metadata = {
  title: "我的 · oh-my-skill",
  description: "登录与账号:邮箱验证码或 GitHub。",
};

/** 「我的」(一页两态,ADR 0023 追记):未登录 = 登录页(邮箱 OTP + GitHub 双轨);
 *  已登录 = 身份 + 退出 + 作者入口。延迟注册不破——动作时刻的内联登录照旧,这里只是账号的落点。
 *  单路由共享页,chrome 客户端按偏好切语言。名下内容(短评/回执/认领/提交)留 M2。 */
export default function MePage() {
  return (
    <>
      <BackHome />
      <MeClient />
    </>
  );
}
