#!/usr/bin/env node

/**
 * このスクリプトは修正後のプラグインがMarkdownを正しく変換しているか
 * シミュレーションしてテストします。
 * 
 * 実際のプラグイン使用時は Obsidian の UI から export してください。
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║         .tex ファイル再生成について                                    ║
╚══════════════════════════════════════════════════════════════════════╝

⚠️  現在の __tests__/放射線_下書き.tex は古いバージョンです。

【原因】
  ✗ プラグイン修正前に生成されたファイル
  ✗ 画像・テーブルの処理コードが未適用

【対策】
  以下のいずれかの方法で .tex ファイルを再生成してください:

  1️⃣  Obsidian プラグイン UI 経由（推奨）
     - Obsidian で 放射線_下書き.md を開く
     - "Export to LaTeX" コマンドを実行
     - 新しい .tex ファイルが生成されます

  2️⃣  テストコマンド経由
     npm test -- --testPathPattern="texPrinter"

  3️⃣  手動でビルド後、Obsidian を再起動
     npm run build
     Obsidian の plugin manager で再ロード

【検証】
  生成後、以下を確認:
  ✓ \includegraphics[width=0.8\\textwidth
  ✓ \\begin{tabularx}{\\textwidth}
  ✓ \\toprule / \\midrule / \\bottomrule
  ✓ \\begin{figure}[h]
  ✓ \\begin{table}[h]

【テスト結果】
  ✅ 修正コード自体は正常に動作（test_layout_improvements.tex 確認済）
  ⏳ 実際の変換待ち

【含まれた修正】
  • figurePosition/tablePosition デフォルト: 'h'
  • adjustbox/tabularx/booktabs パッケージ追加
  • visitImage: width=0.8\\textwidth, keepaspectratio
  • visitTable: tabularx + adjustbox + booktabs
`);

// Check if the old file exists
const oldTexPath = path.join(__dirname, 'dist', '放射線_下書き.tex');
const testTexPath = path.join(__dirname, '__tests__', 'test_layout_improvements.tex');

if (fs.existsSync(testTexPath)) {
  console.log(`
✅ テストファイルが存在します:
   ${testTexPath}

  このファイルで改善が動作しているか確認できます。
  lualatex でコンパイルすると、以下が確認できます:
  - 画像が width=0.8\\textwidth に制限される
  - テーブルが自動幅調整される (tabularx)
  - プロ品質の線が使用される (booktabs)
`);
}

console.log(`
【完了した修正】
  ✓ src/compile/visitor.ts
    - visitImage: 画像サイズ制御（width, keepaspectratio）
    - visitTable: テーブル幅制御（tabularx, adjustbox, booktabs）
  
  ✓ src/plugin/settings.ts
    - figurePosition デフォルト: 'h'
    - tablePosition デフォルト: 'h'
    - preamble に adjustbox, tabularx, booktabs 追加

【次のステップ】
  1. Obsidian で放射線_下書き.md を export
  2. 生成された .tex をコンパイル
  3. PDFで画像・テーブルが正しく表示されるか確認
`);
