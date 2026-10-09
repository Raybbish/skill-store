---
name: mc_cli_place_blocks
description: CLI版 mc-cli place-blocks コマンドの引数形式、PlaceRequest、フェーズ配列、connects/attaches の使い方。ブロック配置前に必ず読む。
---

# Minecraft ブロック配置 Skill

このスキルは、Minecraft サーバー（Fabric）の HTTP API を使用して、指定した座標にブロックを一括で配置するためのものです。

## 使用方法

`mc-cli` ツールを使用して、以下のコマンドを実行します。

```bash
mc-cli place-blocks --blocks '<JSON文字列>'
```

または、ファイルを指定して配置します。

```bash
mc-cli place-blocks --blocks '@path/to/blocks.json'
```

### 引数
- `--blocks`: 配置するブロック情報を含む JSON 文字列。または、`@` を付けたファイルパス。
- `--url`: (任意) サーバーの URL。デフォルトは `http://localhost:8080`。
- `--allow-direct-facing`: (任意) `blocks` に `minecraft:repeater` / `minecraft:comparator` / `minecraft:observer` を直接配置することを許可する。デフォルトは禁止。

## 入力形式 (JSON)

配置するブロックのデータは、`blocks`, `entities`, `attaches`, `connects`, `fills` のリストを持つオブジェクト（`PlaceRequest` 形式）です。また、**配列 `[ {...}, {...} ]` 形式（フェーズ）**も使用可能です。フェーズを使用すると、ブロック配置を複数の段階に分けて順番に実行でき、レッドストーン回路（ピストンの準接続やオブザーバーの更新検知など）で「配置順序」が重要な場合に有用です。フェーズ間には自動的に1tickの待機が入ります。

> [!IMPORTANT]
> **よくある間違いと構造の厳密化**
> 配置ツールの入力（`blocks`引数またはJSONファイル）は、単なるブロックデータの配列 `[ {x, y, z, block}, ... ]` ではありません。必ず以下のように `PlaceRequest` 形式のオブジェクト（キー名 `blocks` を持つオブジェクト）としてラップするか、またはそのフェーズ配列にしてください。
> 
> **正しい単一フェーズ形式の例:**
> ```json
> {
>   "blocks": [
>     { "x": 10, "y": 64, "z": 10, "block": "minecraft:stone" }
>   ]
> }
> ```
> 
> **正しい複数フェーズ（配列）形式の例:**
> ```json
> [
>   {
>     "blocks": [ { "x": 10, "y": 64, "z": 10, "block": "minecraft:stone" } ]
>   },
>   {
>     "blocks": [ { "x": 10, "y": 65, "z": 10, "block": "minecraft:redstone_wire" } ]
>   }
> ]
> ```

### エンティティの配置
`entities` フィールドを使用すると、ブロックと同時にエンティティをスポーンさせることができます。各エンティティには以下の情報を指定します。

- `uuid`: (任意) エンティティの一意な識別子。未指定時は自動生成されます。
- `type`: エンティティの種類（例: `minecraft:boat`, `minecraft:minecart`）。
- `x`, `y`, `z`: スポーン座標（小数）。
- `yaw`: (任意) 水平方向の向き（度数法）。
- `pitch`: (任意) 垂直方向の向き（度数法）。
- `nbt`: (任意) エンティティに適用するNBTデータ（例: `{"Type": "oak"}`）。

```json
{
  "blocks": [
    { "x": 10, "y": 64, "z": 10, "block": "minecraft:water" }
  ],
  "entities": [
    {
      "type": "minecraft:boat",
      "x": 10.5,
      "y": 64.5,
      "z": 10.5,
      "yaw": 90.0,
      "nbt": { "Type": "oak" }
    }
  ]
}
```

詳細なデータモデルの仕様については、[block_design スキル](../block_design/SKILL.md) を参照してください。


> [!WARNING]
> **repeater / comparator / observer の直接配置禁止**
> これらのブロックは向きを誤る可能性が極めて高いため、`blocks` に直接入れることは原則禁止されています。必ず `connects` の `src`（入力元）と `dst`（出力先）を使用して向きを自動計算させてください。
> 意図的に直接配置する場合のみ `--allow-direct-facing` フラグを指定できます（推奨しません）。

## TIPS
- アタッチするブロックや繋ぐブロックは自動で向きが計算され、API 側に送られるため JSON 内で明示的に指定する必要はありません。
- `connects` の `src`/`dst` は信号の流れる方向を表します。`src` 側が入力、`dst` 側が出力です。
- 既存のブロックを上書きして配置します。
- 配置完了後、設置したすべての座標に対して自動的にブロックアップデートが実行されます。これにより、更新が必要なブロックが即座に同期されます。
- 配置が完了すると、成功メッセージが JSON 形式で出力されます。
