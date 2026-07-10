import ChangelogView from "./ChangelogView";

export const metadata = {
  title: "动态 · oh-my-skill",
  description: "商店周报:本周新增、上线与下线,一页看全。",
};

export default function Changelog() {
  return <ChangelogView locale="zh" />;
}
