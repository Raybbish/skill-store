import { PERMISSIVE_LICENSES, type Hosting } from "@skill-store/schemas";

export interface LicenseVerdict {
  license: string;
  hosting: Hosting;
}

/** 从 LICENSE 文件文本朴素识别常见宽松 licence */
export function sniffLicenseText(text: string): string | null {
  const head = text.slice(0, 600).toLowerCase();
  if (head.includes("mit license") || head.includes("permission is hereby granted, free of charge")) return "MIT";
  if (head.includes("apache license") && head.includes("2.0")) return "Apache-2.0";
  if (head.includes("bsd 3-clause") || head.includes("redistribution and use in source and binary forms")) return "BSD-3-Clause";
  if (head.includes("isc license")) return "ISC";
  if (head.includes("unlicense")) return "Unlicense";
  if (head.includes("creative commons zero") || head.includes("cc0")) return "CC0-1.0";
  return null;
}

/**
 * 许可证分流(设计文档 §4 双轨制):
 * - skill 目录内有自己的 LICENSE:以目录级为准(能识别为宽松 → mirrored;识别不出 → indexed 待人工)
 * - 否则用仓库级 SPDX:宽松 → mirrored;其他/无 → indexed
 */
export function classifyLicense(
  repoSpdx: string | null | undefined,
  localLicenseText: string | null,
): LicenseVerdict {
  if (localLicenseText !== null) {
    const sniffed = sniffLicenseText(localLicenseText);
    if (sniffed && PERMISSIVE_LICENSES.has(sniffed)) return { license: sniffed, hosting: "mirrored" };
    return { license: "local-file(needs-review)", hosting: "indexed" };
  }
  if (repoSpdx && repoSpdx !== "NOASSERTION" && PERMISSIVE_LICENSES.has(repoSpdx)) {
    return { license: repoSpdx, hosting: "mirrored" };
  }
  if (repoSpdx && repoSpdx !== "NOASSERTION") return { license: repoSpdx, hosting: "indexed" };
  return { license: "none(all-rights-reserved)", hosting: "indexed" };
}
