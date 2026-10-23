---
name: mc_cli_test
description: CLI版 mc-cli test コマンドと YAML テストファイルの書き方。回路の自動テストを作成・実行する前に必ず読む。
---

# Minecraft テスト実行 Skill

このスキルは、`*_test.yaml` / `*_test.yml` 形式のテストファイルを実行し、
Minecraft内のレッドストーン回路やブロックの動作を自動検証するためのものです。

## 使用方法

テスト実行前に、必ず `start-session` でセッションを開始してください。\
`start-session` はシステム側でUUIDを自動生成し、レスポンスの `session_id` で返します。\
その後、`test` コマンドを実行する際は、返された `session_id` を `--session-id` に指定してください。

### 1. セッション開始

```bash
mc-cli start-session [--task-name <task_name>]
```

#### 引数
- `--task-name`: (任意) タスク名。

#### 例
```bash
mc-cli start-session --task-name xor_gate_fix
```

#### 出力例
```json
{
  "success": true,
  "message": "セッション '550e8400-e29b-41d4-a716-446655440000' を開始しました",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_name": "xor_gate_fix"
}
```
以降の `test` コマンドでは、この出力の `session_id` を `--session-id` に指定してください。

### 2. テスト実行

```bash
# 単一ファイルを指定
mc-cli test --session-id <session_id> path/to/circuit_test.yaml

# ディレクトリを指定（*_test.yaml / *_test.yml を自動スキャン）
mc-cli test --session-id <session_id> ./tests/
```

#### 引数
- `<file_or_dir>`: テストYAMLファイルのパス、またはテストファイルを含むディレクトリのパス。
- `--session-id`: (必須) `start-session` が返したセッションID。
- `--url`: (任意) サーバーの URL。デフォルトは `http://localhost:8080`。

### 3. 実行上限に達した場合

1セッションあたり `test` は最大5回まで実行可能です。\
6回目以降の `test` 実行では、以下のようなJSONが標準出力に出力され、終了コードは `0` になります。

```json
{
  "status": "test_limit_reached",
  "session_id": "550e8400-...",
  "test_count": 5,
  "max_count": 5,
  "message": "このセッションでの test 実行上限（5回）に達しました。修正を終了し、現状を報告してください。"
}
```

**この応答を受け取ったら、直ちに修正作業を終了し、親エージェントに現状を報告してください。**\
これ以上のテスト実行、ブロック再配置、ファイル変更を行わないでください。

---

## テストファイルの記述仕様

### ファイル命名規則

`*_test.yaml` または `*_test.yml` のいずれかで命名してください。

### トップレベル構造

```yaml
name: "テストスイート名"
description: "説明（省略可）"

tests:
  - name: "テストケース1"
    setup: ...
    steps: ...
    assert: ...
```

---

## `setup` — 回路の配置

テストケースごとに毎回回路を配置し直します。これによりテスト間の干渉を防ぎます。

```yaml
setup:
  # ファイルパス（place-blocksで使用するPlaceRequest形式のJSONファイル）
  # 単一オブジェクトの他、フェーズ配列 [ {...}, {...} ] も利用可能
  blocks_file: "./and_gate.json"

  # または、インラインでJSON構造を直接記述（どちらか一方）
  # 単一オブジェクト形式:
  blocks:
    blocks:
      - { x: 10, y: 64, z: 10, block: "minecraft:stone" }
    entities:
      - { type: "minecraft:boat", x: 10.5, y: 64.5, z: 10.5, yaw: 90.0 }
    attaches: []
    connects: []
  # フェーズ（配列）形式:
  # blocks:
  #   - blocks:
  #       - { x: 10, y: 64, z: 10, block: "minecraft:stone" }
  #   - attaches:
  #       - { pos: [10, 65, 10], component: "minecraft:lever", base: [10, 64, 10] }
```

---

## `steps` — 操作ステップ

### `interact_block` — ブロックをインタラクト

レバー・ボタンなどをインタラクトします。
`target_state` を指定した場合は現在の状態を確認し、**既に目標状態であれば何もしません**。
これにより、レバーの状態を「ONにする」という意図を確実に実行できます。

- **`target_state`**:
  - レバー (`lever`): `{"powered": "true"}` or `"false"`
  - 各種ボタン: `{"powered": "true"}` (※ボタンは一定時間で自動的に false に戻るため、ON状態の確認用)

```yaml
steps:
  - action: interact_block
    x: 10
    y: 64
    z: 10
    target_state:           # 省略可。省略時は無条件にインタラクトする
      powered: "true"       # この状態になっていることを目標とする
```

### `wait` — 待機

CLIプロセスを指定ミリ秒スリープします。リピーターなど遅延回路の信号伝播を待つ際に使います。

```yaml
steps:
  - action: wait
    ms: 500    # ミリ秒（例: 500ms ≒ 10tick）
```

### `place_blocks` — 途中配置

テストの途中でブロックを追加配置したい場合に使用します。`blocks` フィールドには単一オブジェクトまたはフェーズ配列のいずれかを指定できます。

```yaml
steps:
  - action: place_blocks
    blocks_file: "./extra.json"

  # インライン単一オブジェクト
  - action: place_blocks
    blocks:
      blocks:
        - { x: 10, y: 64, z: 10, block: "minecraft:stone" }

  # インライン配列（フェーズ）
  - action: place_blocks
    blocks:
      - blocks:
          - { x: 10, y: 64, z: 10, block: "minecraft:stone" }
      - attaches:
          - { pos: [10, 65, 10], component: "minecraft:lever", base: [10, 64, 10] }
```

### `fill` — 範囲を埋める

指定した範囲（**両端の座標を含む**）を特定のブロックで埋めます。回路のリセット（airで消去）等に使います。

```yaml
steps:
  - action: fill
    x1: 10  y1: 63  z1: 10
    x2: 20  y2: 65  z2: 20
    block: "minecraft:air"
```

### `kill_entities` — エンティティを削除

指定した範囲内のエンティティを削除します。オプションでエンティティタイプを指定できます。

```yaml
steps:
  - action: kill_entities
    x1: 10  y1: 63  z1: 10
    x2: 20  y2: 65  z2: 20
    type: "minecraft:boat"   # 省略可。省略時はすべてのエンティティを対象とする
```

---

## `assert` — アサーション（検証）

テストの最終的な状態を検証します。**部分一致**のため、指定したキーのみ確認します。

```yaml
assert:
  - x: 15
    y: 64
    z: 10
    block: "minecraft:redstone_lamp"   # 省略可（IDのチェックをスキップ）
    state:
      lit: "true"                      # 指定したキーのみ検証（他は無視）

  # 複数座標をリストで並べられる。すべて合格で初めてテスト合格
  - x: 16
    y: 64
    z: 10
    block: "minecraft:air"             # 空気（ブロックなし）を期待
```

---

## テストファイルの完全な例

```yaml
name: "ANDゲート 真理値表テスト"
description: "2入力ANDゲートの全入力パターンを検証する"

tests:
  - name: "A=OFF, B=OFF → 出力=OFF"
    setup:
      blocks_file: "./and_gate.json"
    steps:
      - action: interact_block
        x: 10  y: 64  z: 10
        target_state: { powered: "false" }
      - action: interact_block
        x: 12  y: 64  z: 10
        target_state: { powered: "false" }
      - action: wait
        ms: 200
    assert:
      - x: 15  y: 64  z: 10
        block: "minecraft:redstone_lamp"
        state: { lit: "false" }

  - name: "A=ON, B=ON → 出力=ON"
    setup:
      blocks_file: "./and_gate.json"
    steps:
      - action: interact_block
        x: 10  y: 64  z: 10
        target_state: { powered: "true" }
      - action: interact_block
        x: 12  y: 64  z: 10
        target_state: { powered: "true" }
      - action: wait
        ms: 200
    assert:
      - x: 15  y: 64  z: 10
        block: "minecraft:redstone_lamp"
        state: { lit: "true" }
```

---

## 出力サマリ

### 全合格時
```
=== テスト結果 ===
ファイル: and_gate_test.yaml

  ✅ A=OFF, B=OFF → 出力=OFF
  ✅ A=ON,  B=ON  → 出力=ON

2件中 2件合格 (失敗: 0件, エラー: 0件)
```

### 失敗時
```
  ❌ A=ON, B=ON → 出力=ON
     アサーション失敗: (15, 64, 10)
       期待 block: minecraft:redstone_lamp
       期待 state.lit: true
       実際 block: minecraft:redstone_lamp
       実際 state.lit: false
       理由: ブロック状態が一致しません
```

## TIPS

- テストファイルは **セッションごとの一時ディレクトリ** 内の適切なサブディレクトリに保存するか、回路JSONと同じディレクトリに置くのが推奨です。
- `setup.blocks_file` には `place-blocks` コマンドで使用するのと同じ PlaceRequest 形式のJSON（単一オブジェクトまたはフェーズ配列）を指定できます。
- `wait` の時間の目安: リピーター1段 ≒ 50〜100ms、複数段の場合は段数 × 100ms 程度が安全です。
- 失敗やエラーが1件でもあった場合、終了コードが `1` になります（CI/CD連携に利用可能）。
