#!/usr/bin/env python3
"""Analyze subagent transcripts from a deep-research-team session.

Extracts MCP tool call parameters from researcher subagent JSONL transcripts
to verify guidance compliance and understand search patterns.

Usage:
    # Auto-detect: finds sessions with subagents matching a keyword
    python3 analyze-transcripts.py "intermittent fasting"

    # Explicit session ID
    python3 analyze-transcripts.py --session <session-id>

    # List recent sessions that have subagents
    python3 analyze-transcripts.py --list

Output: Per-researcher summary of all MCP tool calls grouped by server, plus
an aggregate compliance report for the Exa summary pattern.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path


# MCP tool name pattern: mcp__1mcp__{server}_1mcp_{tool}
# After ToolSearch loading, tools appear as: mcp__1mcp__{server}_1mcp_{tool}
MCP_PATTERN = re.compile(r"(?:mcp__1mcp__)?(\w+?)_1mcp_(\w+)")


def parse_mcp_tool_name(name):
    """Extract server and tool from an MCP tool name.

    Returns (server, tool) or None if not an MCP tool.
    """
    m = MCP_PATTERN.match(name)
    if m:
        return m.group(1), m.group(2)
    return None


def find_project_dir(path=None):
    """Find the Claude project directory.

    Args:
        path: Optional path override. Accepts either:
            - A filesystem path (e.g., /Users/malo/.config/nix-config) which
              gets converted to the ~/.claude/projects/{slug} format
            - A direct ~/.claude/projects/{slug} path (used as-is if it exists)
            - None to auto-detect from cwd
    """
    base = Path.home() / ".claude" / "projects"

    if path:
        p = Path(path).expanduser().resolve()
        # If it's already a valid project dir, use it directly
        if p.exists() and p.parent == base:
            return p
        # Otherwise treat it as a filesystem path and convert to slug
        source = str(p)
    else:
        source = os.getcwd()

    # Claude Code slugs: replace all non-alphanumeric characters with dashes
    slug = re.sub(r"[^a-zA-Z0-9]", "-", source)
    candidates = list(base.glob(f"{slug}*"))
    if len(candidates) == 1:
        return candidates[0]
    elif len(candidates) > 1:
        # Pick the one matching most closely
        for c in candidates:
            if c.name == slug:
                return c
        return candidates[0]
    return None


def list_sessions(project_dir):
    """List sessions that have subagent directories, sorted by recency."""
    sessions = []
    for d in project_dir.iterdir():
        if d.is_dir() and (d / "subagents").is_dir():
            subagent_count = len(list((d / "subagents").glob("agent-*.jsonl")))
            if subagent_count > 0:
                mtime = max(f.stat().st_mtime for f in (d / "subagents").glob("*.jsonl"))
                sessions.append((d.name, subagent_count, mtime))
    sessions.sort(key=lambda x: x[2], reverse=True)
    return sessions


def find_session_by_keyword(project_dir, keyword):
    """Find sessions whose subagents mention a keyword in their spawn message."""
    matches = []
    for d in project_dir.iterdir():
        subdir = d / "subagents"
        if not d.is_dir() or not subdir.is_dir():
            continue
        for f in subdir.glob("agent-*.jsonl"):
            if "compact" in f.name:
                continue
            try:
                with open(f) as fh:
                    first = json.loads(fh.readline())
                    content = str(first.get("message", {}).get("content", ""))
                    if keyword.lower() in content.lower():
                        matches.append(d.name)
                        break
            except (json.JSONDecodeError, OSError):
                continue
    return list(set(matches))


def parse_subagent(path):
    """Parse a subagent JSONL file, extracting identity and tool calls."""
    researcher = None
    task_subject = None
    question_type = None
    # mcp_calls: {server: [{tool, params}]}
    mcp_calls = {}

    with open(path) as f:
        for line in f:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue

            msg = d.get("message", {})
            content = msg.get("content", "")

            # Extract identity from spawn message or follow-up context
            if isinstance(content, str):
                m = re.search(r"researcher letter: (\w)", content, re.IGNORECASE)
                if m:
                    researcher = m.group(1).upper()
                m2 = re.search(r'task is #\d+: "([^"]+)"', content)
                if m2:
                    task_subject = m2.group(1)
                # Follow-up tasks have the subject in a different format
                if not task_subject:
                    m2b = re.search(r'#\d+ -- "([^"]+)"', content)
                    if m2b:
                        task_subject = m2b.group(1)
                m3 = re.search(r"Question type: (\w+)", content)
                if m3:
                    question_type = m3.group(1)

            # Extract identity from Write calls (follow-up agents write
            # to researcher-{letter}-findings-{id}.md)
            if isinstance(content, list):
                for block in content:
                    if (
                        isinstance(block, dict)
                        and block.get("type") == "tool_use"
                        and block.get("name") == "Write"
                        and not researcher
                    ):
                        fp = block.get("input", {}).get("file_path", "")
                        m = re.search(r"researcher-([a-z])-findings", fp)
                        if m:
                            researcher = m.group(1).upper()

            # Extract MCP tool calls
            if isinstance(content, list):
                for block in content:
                    if not isinstance(block, dict) or block.get("type") != "tool_use":
                        continue
                    name = block.get("name", "")
                    inp = block.get("input", {})

                    parsed = parse_mcp_tool_name(name)
                    if not parsed:
                        continue
                    server, tool = parsed
                    mcp_calls.setdefault(server, []).append(
                        {"tool": tool, "params": dict(inp)}
                    )

    return {
        "researcher": researcher,
        "task": task_subject,
        "question_type": question_type,
        "mcp_calls": mcp_calls,
    }


def format_exa_call(call):
    """Format an Exa call with compliance checking."""
    p = call["params"]
    q = p.get("query", "")[:80]

    has_summary = p.get("enableSummary") is True
    has_text_max = p.get("textMaxCharacters") == 1
    has_ctx_max = "contextMaxCharacters" in p

    compliance = ""
    if has_summary and has_text_max and not has_ctx_max:
        compliance = " [COMPLIANT]"
    elif not has_summary or not has_text_max:
        compliance = " [NON-COMPLIANT]"
    if has_ctx_max:
        compliance += " [ctxMaxChars SET - BAD]"

    interesting = {
        k: v for k, v in p.items() if v and k not in ("query", "type")
    }
    param_str = f"     {interesting}" if interesting else "     (no params)"
    return f"  Q: {q}\n{param_str}{compliance}"


def format_firecrawl_call(call):
    """Format a Firecrawl call."""
    url = call["params"].get("url", "")[:80]
    return f"  {call['tool']}: {url}"


def format_reddit_call(call):
    """Format a Reddit call."""
    p = call["params"]
    tool = call["tool"]
    if tool == "get_top_posts":
        sub = p.get("subreddit", "?")
        time = p.get("time_filter", "all")
        return f"  {tool}: r/{sub} ({time})"
    elif tool == "get_post_comments":
        post = p.get("post_id", p.get("url", "?"))
        depth = p.get("depth", "?")
        return f"  {tool}: {post} (depth={depth})"
    elif tool in ("get_reddit_post", "get_subreddit_info"):
        target = p.get("post_id", p.get("url", p.get("subreddit", "?")))
        return f"  {tool}: {target}"
    elif tool == "search_reddit":
        q = p.get("query", "")[:60]
        sub = p.get("subreddit", "")
        suffix = f" in r/{sub}" if sub else ""
        return f"  {tool}: \"{q}\"{suffix}"
    else:
        return f"  {tool}: {json.dumps(p, default=str)[:80]}"


def format_generic_call(call):
    """Format a generic MCP call."""
    p = call["params"]
    summary = json.dumps(p, default=str)
    if len(summary) > 80:
        summary = summary[:77] + "..."
    return f"  {call['tool']}: {summary}"


SERVER_FORMATTERS = {
    "exa": format_exa_call,
    "firecrawl": format_firecrawl_call,
    "reddit": format_reddit_call,
}


def print_report(agents):
    """Print a formatted report of tool usage across all researchers."""
    researchers = [a for a in agents if a["mcp_calls"]]
    if not researchers:
        print("No researcher MCP tool calls found in this session's subagents.")
        return

    # Collect all servers seen
    all_servers = set()
    for r in researchers:
        all_servers.update(r["mcp_calls"].keys())

    # Per-researcher detail
    for r in researchers:
        letter = r["researcher"] or "?"
        task = r["task"] or "(follow-up or unidentified)"
        print(f"\n{'='*70}")
        print(f"Researcher {letter}: {task}")
        if r["question_type"]:
            print(f"Question type: {r['question_type']}")
        print(f"{'='*70}")

        for server in sorted(r["mcp_calls"].keys()):
            calls = r["mcp_calls"][server]
            print(f"\n{server} calls: {len(calls)}")
            formatter = SERVER_FORMATTERS.get(server, format_generic_call)
            for call in calls:
                print(formatter(call))

    # Aggregate report
    print(f"\n{'='*70}")
    print("AGGREGATE REPORT")
    print(f"{'='*70}")

    # Per-server totals
    server_totals = {}
    server_tools = {}
    for r in researchers:
        for server, calls in r["mcp_calls"].items():
            server_totals[server] = server_totals.get(server, 0) + len(calls)
            for c in calls:
                key = f"{server}.{c['tool']}"
                server_tools[key] = server_tools.get(key, 0) + 1

    print("\nTool calls by server:")
    for server in sorted(server_totals, key=lambda s: -server_totals[s]):
        print(f"  {server}: {server_totals[server]}")

    print("\nTool calls by endpoint:")
    for key in sorted(server_tools, key=lambda k: -server_tools[k]):
        print(f"  {key}: {server_tools[key]}")

    # Exa compliance section
    exa_calls = [
        c
        for r in researchers
        for c in r["mcp_calls"].get("exa", [])
    ]
    if exa_calls:
        total = len(exa_calls)
        summary_ok = sum(1 for c in exa_calls if c["params"].get("enableSummary") is True)
        text_max_ok = sum(1 for c in exa_calls if c["params"].get("textMaxCharacters") == 1)
        ctx_max_bad = sum(1 for c in exa_calls if "contextMaxCharacters" in c["params"])
        full_ok = sum(
            1 for c in exa_calls
            if c["params"].get("enableSummary") is True
            and c["params"].get("textMaxCharacters") == 1
            and "contextMaxCharacters" not in c["params"]
        )
        pct = lambda n: f"{100*n//total}%" if total else "0%"

        print(f"\nExa compliance ({total} calls):")
        print(f"  enableSummary: true    {summary_ok}/{total} ({pct(summary_ok)})")
        print(f"  textMaxCharacters: 1   {text_max_ok}/{total} ({pct(text_max_ok)})")
        print(f"  contextMaxCharacters:  {ctx_max_bad} violations (should be 0)")
        print(f"  Full compliance:       {full_ok}/{total} ({pct(full_ok)})")

        categories = {}
        domains = {}
        for c in exa_calls:
            cat = c["params"].get("category")
            if cat:
                categories[cat] = categories.get(cat, 0) + 1
            for dom in c["params"].get("includeDomains", []):
                domains[dom] = domains.get(dom, 0) + 1

        if categories:
            print(f"\n  Categories used:")
            for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
                print(f"    {cat}: {count}")
        if domains:
            print(f"\n  includeDomains used:")
            for dom, count in sorted(domains.items(), key=lambda x: -x[1]):
                print(f"    {dom}: {count}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("keyword", nargs="?", help="Keyword to find in subagent spawn messages")
    parser.add_argument("--session", help="Explicit session ID")
    parser.add_argument("--list", action="store_true", help="List recent sessions with subagents")
    parser.add_argument("--project-dir", help="Override project directory path (filesystem or slug)")
    args = parser.parse_args()

    project_dir = find_project_dir(args.project_dir)

    if not project_dir or not project_dir.exists():
        print("Could not find Claude project directory. Use --project-dir.", file=sys.stderr)
        sys.exit(1)

    if args.list:
        sessions = list_sessions(project_dir)
        if not sessions:
            print("No sessions with subagents found.")
            return
        print(f"Sessions with subagents in {project_dir.name}:\n")
        for sid, count, _ in sessions:
            print(f"  {sid}  ({count} subagents)")
        return

    if args.session:
        session_dir = project_dir / args.session
        if not (session_dir / "subagents").is_dir():
            print(f"No subagents directory in session {args.session}", file=sys.stderr)
            sys.exit(1)
        session_ids = [args.session]
    elif args.keyword:
        session_ids = find_session_by_keyword(project_dir, args.keyword)
        if not session_ids:
            print(f"No sessions found matching '{args.keyword}'", file=sys.stderr)
            sys.exit(1)
        if len(session_ids) > 1:
            print(f"Multiple sessions match '{args.keyword}':")
            for sid in session_ids:
                print(f"  {sid}")
            print("\nUse --session to pick one.")
            return
    else:
        parser.print_help()
        return

    for session_id in session_ids:
        subdir = project_dir / session_id / "subagents"
        print(f"Session: {session_id}")
        print(f"Path: {subdir}\n")

        agents = []
        for f in sorted(subdir.glob("agent-*.jsonl")):
            if "compact" in f.name:
                continue
            if f.stat().st_size < 5000:
                continue  # Skip tiny files (shutdown messages, nudges)
            result = parse_subagent(f)
            if result["mcp_calls"]:
                agents.append(result)

        print_report(agents)


if __name__ == "__main__":
    main()
