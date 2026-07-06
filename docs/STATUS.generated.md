<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 2026-07-06 04:33 UTC · 分支 `fix/sync-maxbuffer` · 未提交改动 21 处_

## Catalog
- **skill 总数:6177**
- verdict 账本(catalog/verdicts,ADR 0012;扫描停摆中,现存均为 legacy 历史判定):有判定 **55** —— pass 52 · flagged 3
- 托管:mirrored 4941 · indexed 1236
- 已评测:**0** · 发布者:**414**

## 最近提交
```
160ce0948 fix(sync): 放大 git 调用 maxBuffer,解 catalog 规模下 stdout 溢出
6c740cea5 fix(ingest): mirror 加单文件大小闸(默认2MB),挡编译产物/大blob进git;清 71MB pomodoro 二进制
a5926c192 data(microcopy): 全量 copy 块 + scene:renorm 归一(5,816 条 ~95% tagline;ADR 0013)
d3ece6c63 docs(status): 同步微文案全链路——全量已跑+复核工具+.mts/缓存击穿两修复;下一步收敛为用户端 3 步
0eb127b5d fix(web): idx 取数缓存击穿——meta no-store + docs/分片按 generatedAt 版本键
c22b03b10 fix(web): build-index 改名 .mts 修顶层-await/cjs 阻塞 + 全量微文案实测
49577579c feat(microcopy): scene:renorm 复核工具 + 全量后词表复核
77553b72c docs: 微文案真机金标已过(tag 90.5% / 微文案 96%),下一步只剩全量
```
