/**
 * OpenAI 兼容真实 runner:最小 agent 循环(chat + function calling),
 * 装/不装 skill 的唯一差异 = system 消息是否注入 SKILL.md 正文。
 *
 * 产物写入通过两个工具:
 *   - write_text_file:文本产物
 *   - write_ooxml:模型产出 XML parts,runner 用 ooxml.zip() 确定性打包成 docx/xlsx/pptx
 *     (纯文本模型无法直接输出二进制 zip;打包容器是死的,测的是 parts 内容对不对——
 *      样式/TOC/公式这些恰是 skill 应教会 agent 的知识)
 *
 * SKILL.md 来源:本地 catalog mirror 优先,回落上游 raw.githubusercontent。
 * 环境:LLM_BASE_URL / LLM_API_KEY / LLM_MODEL(与 L3 审查共用);EVAL_MAX_TURNS(默认 8)。
 * 用法:npm run eval -- --category doc-generation --runner openai
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { zip } from "../ooxml.ts";
import { entryDir } from "../../catalog.ts";
import type { EvalRunner } from "../types.ts";

const BASE = (process.env.LLM_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
const KEY = process.env.LLM_API_KEY;
const MODEL = process.env.LLM_MODEL ?? "deepseek-chat";
const MAX_TURNS = Number(process.env.EVAL_MAX_TURNS) || 8;

interface ToolCall { id: string; function: { name: string; arguments: string } }
interface ChatMsg { role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string }

/** 取 SKILL.md 正文:本地 mirror → 上游 raw;都失败返回 null(该 skill 记 0 分更诚实,但先报错让人看见) */
async function skillBody(skillId: string): Promise<string | null> {
  try { return await readFile(join(entryDir(skillId), "mirror", "SKILL.md"), "utf8"); } catch { /* 无 mirror */ }
  try {
    const rep = JSON.parse(await readFile(join(entryDir(skillId), "skill-report.json"), "utf8")) as
      { meta: { upstream: string } };
    const m = rep.meta.upstream.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/?(.*)$/);
    if (!m) return null;
    const url = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4] ? m[4] + "/" : ""}SKILL.md`;
    const res = await fetch(url, { headers: { "user-agent": "oh-my-skill-eval" } });
    if (res.ok) return await res.text();
  } catch { /* fallthrough */ }
  return null;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "write_text_file",
      description: "写一个文本文件到工作目录",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_ooxml",
      description:
        "把一组 XML parts 打包成 OOXML 文档(docx/xlsx/pptx)写到工作目录。parts 为 zip 内条目,须包含 [Content_Types].xml、_rels/.rels 及主文档部件(如 word/document.xml)",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          parts: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, content: { type: "string" } },
              required: ["name", "content"],
            },
          },
        },
        required: ["path", "parts"],
      },
    },
  },
];

async function chat(messages: ChatMsg[]): Promise<ChatMsg> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, temperature: 0 }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices: { message: ChatMsg }[] };
  return data.choices[0].message;
}

/** 防路径逃逸:去掉开头斜杠与 .. 段 */
function safeRel(p: string): string {
  return p.split("/").filter((s) => s && s !== "..").join("/");
}

export const openaiRunner: EvalRunner = {
  name: `openai:${MODEL}`,
  model: MODEL,
  async run({ skillId, task, prompt, inputsDir, workDir, condition }) {
    if (!KEY) throw new Error("需 LLM_API_KEY(OpenAI 兼容端点;LLM_BASE_URL/LLM_MODEL 可配)");
    await mkdir(workDir, { recursive: true });

    // 输入文件内联(评测任务输入都是小文本:md/csv)
    let inputsBlock = "";
    try {
      for (const f of await readdir(inputsDir)) {
        inputsBlock += `\n--- inputs/${f} ---\n${await readFile(join(inputsDir, f), "utf8")}\n`;
      }
    } catch { /* 无输入 */ }

    const ENV_NOTE =
      "环境约束:本环境只有 write_text_file 和 write_ooxml 两个工具,没有 shell/python/node,无法执行任何脚本或安装依赖。产出 docx/xlsx/pptx 的唯一方式是调用 write_ooxml 直接给出 XML parts。";
    let sys = `你是一个通用 agent,用工具完成用户任务。${ENV_NOTE}`;
    if (condition === "with_skill") {
      const body = await skillBody(skillId);
      if (!body) throw new Error(`无法获取 ${skillId} 的 SKILL.md(本地 mirror 与上游 raw 均失败)`);
      sys = `你是一个通用 agent,用工具完成用户任务。${ENV_NOTE}\n\n用户已安装 skill「${skillId}」,其内容如下。请吸收其中的格式与领域知识来提升产出质量;若其建议的执行方式(如运行脚本)在本环境不可用,改用本环境的工具达成同等效果:\n\n<skill>\n${body}\n</skill>`;
    }

    const messages: ChatMsg[] = [
      { role: "system", content: sys },
      {
        role: "user",
        content: `${prompt}\n\n输入文件:${inputsBlock || "(无)"}\n\n要求:把最终产物写到 ${task.artifact}(OOXML 文档用 write_ooxml,文本用 write_text_file)。写完后直接回复 DONE,不要再调用工具。`,
      },
    ];

    let artifactPath: string | null = null;
    let turns = 0;
    const toolLog: string[] = [];
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      turns++;
      const msg = await chat(messages);
      messages.push(msg);
      if (!msg.tool_calls?.length) break; // 模型自认完成
      for (const tc of msg.tool_calls) {
        let result = "ok";
        try {
          const args = JSON.parse(tc.function.arguments || "{}") as {
            path?: string; content?: string; parts?: { name: string; content: string }[];
          };
          const rel = safeRel(String(args.path ?? task.artifact));
          const p = join(workDir, rel);
          await mkdir(dirname(p), { recursive: true });
          if (tc.function.name === "write_text_file") {
            await writeFile(p, String(args.content ?? ""));
            // 环境反馈:写脚本/依赖清单时明确告知无法执行(真实环境会在执行时报错,这里前置)
            if (/\.(sh|bash|js|mjs|cjs|ts|py|rb)$/.test(rel) || /(^|\/)package\.json$/.test(rel))
              result = "文件已写入,但注意:本环境没有 shell/python/node,该脚本不会被执行,依赖也无法安装。请改用 write_ooxml 直接产出文档。";
          } else if (tc.function.name === "write_ooxml") {
            if (!Array.isArray(args.parts) || !args.parts.length) throw new Error("parts 为空");
            await writeFile(p, zip(args.parts.map((x) => ({ name: safeRel(x.name), data: x.content }))));
          } else {
            result = `未知工具 ${tc.function.name}`;
          }
          if (rel === task.artifact) artifactPath = p;
          toolLog.push(`${tc.function.name}(${rel}) → ${result}`);
        } catch (e) {
          result = `error: ${(e as Error).message}`;
          toolLog.push(`${tc.function.name} → ${result}`);
        }
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    }

    // 诊断:产物缺失始终告警;EVAL_DEBUG=1 时完整对话落盘 /tmp 供排查
    if (!artifactPath)
      console.warn(`    ⚠ [${task.id}/${condition}] ${turns} 轮未产出 ${task.artifact};工具调用: ${toolLog.join("; ") || "(无)"}`);
    if (process.env.EVAL_DEBUG === "1") {
      const f = join(tmpdir(), `eval-debug-${task.id}-${condition}-${Date.now()}.json`);
      await writeFile(f, JSON.stringify({ skillId, condition, turns, toolLog, artifact: !!artifactPath, messages }, null, 2));
      console.warn(`    [debug] ${f}`);
    }
    return { artifactPath };
  },
};
