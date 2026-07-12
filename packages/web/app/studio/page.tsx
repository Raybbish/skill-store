import { BackHome } from "@/components/Chrome";
import StudioClient from "./StudioClient";

export const metadata = {
  title: "作者工作台 · oh-my-skill",
  description: "用 GitHub 登录,认领已收录的作品,或提交还没收录的仓库。",
};

/** 作者工作台(ADR 0023):静态壳 + 客户端全体——单路由共享页,chrome 客户端按偏好切语言。
 *  入口跟认领同开关(claims flag):off 时页面只说「尚未开放」,站内也无链接指向这里。 */
export default function StudioPage() {
  return (
    <>
      <BackHome />
      <StudioClient />
    </>
  );
}
