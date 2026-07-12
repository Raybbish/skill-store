import Link from "next/link";

export const metadata = { title: "页面不存在 · oh-my-skill" };

/** 自定义 404(静态导出生成 404.html,由托管平台兜底)。
 *  与退市墓碑页(ADR 0020)分工:墓碑 = 曾收录、有事实可陈述;这里 = 地址本身无对应页。
 *  共享页无 locale 上下文,双语并陈,只写事实。 */
export default function NotFound() {
  return (
    <section className="hero">
      <div className="eyebrow">404</div>
      <h1 className="small">这个地址没有对应的页面</h1>
      <p className="lede">
        链接可能拼写有误,或该内容从未收录。
        <br />
        This address does not match any page.
      </p>
      <p style={{ marginTop: 20 }}>
        <Link href="/" className="back">← 返回首页搜索 / Back to search</Link>
      </p>
    </section>
  );
}
