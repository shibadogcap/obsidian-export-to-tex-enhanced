# obsidian-export-to-tex-enhanced

[![](https://img.shields.io/github/v/release/shibadogcap/obsidian-export-to-tex-enhanced?style=for-the-badge)](https://github.com/shibadogcap/obsidian-export-to-tex-enhanced/releases/latest)
![](https://img.shields.io/github/commits-since/shibadogcap/obsidian-export-to-tex-enhanced/latest?style=for-the-badge)
![](https://img.shields.io/github/manifest-json/minAppVersion/shibadogcap/obsidian-export-to-tex-enhanced?color=red&label=Min%20Obsidian%20Version&style=for-the-badge)
![](https://img.shields.io/github/downloads/shibadogcap/obsidian-export-to-tex-enhanced/total?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#license)

> ObsidianでmarkdownファイルををLaTeX形式にエクスポートします。

## このプラグインについて

これは、Zach Raines氏によるオリジナルの[obsidian-export-to-tex](https://github.com/raineszm/obsidian-export-to-tex)プラグインの拡張フォークです。

### ✨ 拡張機能
- 🇯🇵 **日本語ローカライズ**: 日本語UI対応
- 🎯 **インテリジェントなテーブル処理**: 自動longtable対応
- 🖼️ **強化された画像処理**: 改善された画像パス解決
- 📝 **モーダルベースのワークフロー**: 使いやすいエクスポート設定ダイアログ

![](https://raw.githubusercontent.com/raineszm/obsidian-export-to-tex/master/images/export-to-clipboard.gif)

## インストール

> **注意**: このプラグインはまだObsidianコミュニティプラグインとして利用できません。手動でインストールする必要があります。

Obsidianバージョン0.9.8以上の場合：

### 手動インストール
1. [最新のGitHubリリース](https://github.com/shibadogcap/obsidian-export-to-tex-enhanced/releases/latest)から最新の`zip`をダウンロード
2. 内容をvaultの`.plugins/obsidian-export-to-tex-enhanced`サブディレクトリに解凍
3. Obsidianを再起動
4. 設定 > サードパーティプラグインに移動し、`obsidian-export-to-tex-enhanced`を有効化

詳細は[フォーラム](https://forum.obsidian.md/t/plugins-mini-faq/7737)を参照してください。

## 使用方法

このプラグインは.mdファイルをTeX形式にエクスポートできます。
エクスポート時：
- 他のファイルへのWikiLinkは除去されます
- デフォルトで、見出しとブロックにラベルが関連付けられます

### コマンド
Export to TeX Enhancedは2つのコマンドで利用可能です。

#### Export to TeX

現在のファイルの内容がTeXに変換され、そのファイルに保存されます。

#### Export to TeX and Copy to Clipboard

現在のファイルの内容をTeXに変換し、クリップボードにコピーします。

## 設定

設定ペインで以下のオプションを設定できます：

- **図の位置**: 図の配置位置を指定
- **表の位置**: 表の配置位置を指定
- **デフォルトのキャプション**: エクスポート時のデフォルトキャプション
- **フロントマターの使用**: エクスポート時にフロントマターを含めるかどうか

## 開発

このプラグインはTypeScriptで開発されています。

### ビルド

```bash
npm install
npm run build
```

### コントリビューション

バグレポートや機能リクエストは[GitHub Issues](https://github.com/shibadogcap/obsidian-export-to-tex-enhanced/issues)でお願いします。

## ライセンス

MITライセンスの下で公開されています。