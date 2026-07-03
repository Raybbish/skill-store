/** 纯静态导出:构建时从 ../../catalog 读数据,产物可部署到任何静态托管 */
export default {
  output: "export",
  trailingSlash: true,
  // 让前端能直接 import @skill-store/schemas 的标签词表(labels.ts,单一来源)
  transpilePackages: ["@skill-store/schemas"],
};
