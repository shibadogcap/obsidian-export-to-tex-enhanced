import {
  App,
  Modal,
  Setting,
  TFile,
  TFolder,
  MarkdownRenderer,
} from 'obsidian';

export interface CaptionData {
  [index: number]: string;
}

export interface TableOrFigureInfo {
  index: number;
  type: 'table' | 'figure';
  preview: string;
  source?: string;
  rows?: number;
  cols?: number;
  alt?: string;
  filePath?: string; // 現在のファイルパス（画像相対パス解決用）
}

// LocalStorage キー
const RECENT_CAPTIONS_KEY = 'obsidian-export-tex-recent-captions';

/**
 * 表と図のキャプション入力モーダル（v2）
 * - ドキュメント出現順を保持
 * - Markdown 表をプレビュー（HTML レンダリング）
 * - 最近使ったキャプション表示
 * - Obsidian ネイティブコンポーネント使用
 */
export class CaptionInputModal extends Modal {
  private items: TableOrFigureInfo[];
  private captions: CaptionData = {};
  private resolve: (data: CaptionData | null) => void;
  private currentItemIndex: number = 0;
  private recentCaptions: string[] = [];
  private tableCounter: number = 0;
  private figureCounter: number = 0;

  constructor(
    app: App,
    items: TableOrFigureInfo[],
    resolve: (data: CaptionData | null) => void,
  ) {
    super(app);
    this.items = items;
    this.resolve = resolve;

    // キャプション初期化
    for (let i = 0; i < items.length; i++) {
      this.captions[i] = '';
    }

    // 表と図のカウンタを初期化
    for (const item of items) {
      if (item.type === 'table') {
        this.tableCounter++;
      } else {
        this.figureCounter++;
      }
    }

    // 最近使ったキャプションを読み込み
    this.loadRecentCaptions();
  }

  private loadRecentCaptions(): void {
    try {
      const stored = localStorage.getItem(RECENT_CAPTIONS_KEY);
      if (stored) {
        this.recentCaptions = JSON.parse(stored).slice(0, 5); // 最新 5 件
      }
    } catch (e) {
      console.error('Failed to load recent captions:', e);
      this.recentCaptions = [];
    }
  }

  private saveRecentCaptions(): void {
    try {
      const allCaptions = Object.values(this.captions).filter(
        (c) => c && c.trim(),
      );
      const newRecent = Array.from(
        new Set([...allCaptions, ...this.recentCaptions]),
      ).slice(0, 10);
      localStorage.setItem(RECENT_CAPTIONS_KEY, JSON.stringify(newRecent));
    } catch (e) {
      console.error('Failed to save recent captions:', e);
    }
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.style.maxWidth = '900px';
    contentEl.style.maxHeight = '90vh';
    contentEl.style.overflow = 'auto';

    // タイトル
    contentEl.createEl('h2', { text: 'Add Captions' });

    if (this.items.length === 0) {
      contentEl.createEl('p', { text: 'No tables or figures found.' });
      return;
    }

    // メインコンテナ
    const mainContainer = contentEl.createEl('div', {
      attr: { style: 'display: flex; gap: 16px; height: 65vh;' },
    });

    // 左パネル：リスト
    const listPanel = mainContainer.createEl('div', {
      attr: {
        style:
          'flex: 0 0 160px; border-right: 1px solid var(--divider-color); overflow-y: auto; padding-right: 12px;',
      },
    });

    listPanel.createEl('p', {
      text: 'Items',
      attr: { style: 'margin: 0 0 8px 0; font-weight: bold; font-size: 12px;' },
    });

    const listContainer = listPanel.createEl('div', {
      attr: { style: 'display: flex; flex-direction: column; gap: 4px;' },
    });

    // リストボタン
    let tableIndex = 1;
    let figureIndex = 1;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const label =
        item.type === 'table'
          ? `Table ${tableIndex++}`
          : `Figure ${figureIndex++}`;

      const btn = listContainer.createEl('button', {
        text: label,
        attr: {
          style: `padding: 8px 12px; text-align: left; border-radius: 4px; border: 1px solid transparent; cursor: pointer; font-size: 13px; transition: all 0.2s; ${
            i === 0
              ? 'background-color: var(--interactive-accent); color: white;'
              : 'background-color: var(--background-secondary); color: var(--text-normal);'
          }`,
        },
      });

      btn.addEventListener('click', () => {
        this.currentItemIndex = i;
        this.updateEditorPanel(editorPanel);

        // ボタンスタイル更新
        listContainer.querySelectorAll('button').forEach((b, idx) => {
          if (idx === i) {
            b.style.backgroundColor = 'var(--interactive-accent)';
            b.style.color = 'white';
          } else {
            b.style.backgroundColor = 'var(--background-secondary)';
            b.style.color = 'var(--text-normal)';
          }
        });
      });
    }

    // 右パネル：エディタ
    const editorPanel = mainContainer.createEl('div', {
      attr: {
        style:
          'flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;',
      },
    });

    // 最初のアイテムを表示
    this.updateEditorPanel(editorPanel);

    // ボタンコンテナ
    const buttonContainer = contentEl.createEl('div', {
      attr: {
        style:
          'display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; border-top: 1px solid var(--divider-color); padding-top: 12px;',
      },
    });

    const okBtn = buttonContainer.createEl('button', {
      text: 'OK',
      attr: {
        style:
          'padding: 8px 16px; background-color: var(--interactive-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;',
      },
    });
    okBtn.addEventListener('click', () => {
      this.saveRecentCaptions();
      this.close();
      this.resolve(this.captions);
    });

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      attr: {
        style:
          'padding: 8px 16px; background-color: var(--background-secondary); color: var(--text-normal); border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer;',
      },
    });
    cancelBtn.addEventListener('click', () => {
      this.close();
      this.resolve(null);
    });
  }

  private updateEditorPanel(editorPanel: HTMLElement) {
    editorPanel.empty();

    const item = this.items[this.currentItemIndex];

    // 表/図ごとの番号を計算
    let label: string;
    if (item.type === 'table') {
      const tableNum =
        this.items
          .slice(0, this.currentItemIndex)
          .filter((i) => i.type === 'table').length + 1;
      label = `Table ${tableNum}`;
    } else {
      const figNum =
        this.items
          .slice(0, this.currentItemIndex)
          .filter((i) => i.type === 'figure').length + 1;
      label = `Figure ${figNum}`;
    }

    // タイトル
    editorPanel.createEl('h3', {
      text: label,
      attr: { style: 'margin: 0 0 12px 0;' },
    });

    // プレビューセクション
    const previewSection = editorPanel.createEl('div');
    previewSection.createEl('p', {
      text: 'Preview:',
      attr: {
        style:
          'margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: var(--text-muted);',
      },
    });

    const previewContainer = previewSection.createEl('div', {
      attr: {
        style:
          'background-color: var(--background-secondary); padding: 12px; border-radius: 4px; max-height: 250px; overflow-y: auto; border: 1px solid var(--divider-color); font-size: 12px;',
      },
    });

    // Markdown ソースを表示（表の場合は簡易レンダリング）
    if (item.source) {
      if (item.type === 'table') {
        // 表を簡易 HTML としてレンダリング（非同期）
        this.renderMarkdownTable(item.source, previewContainer).catch(
          console.error,
        );
      } else {
        // 図はプレビュー画像と情報を表示
        const imagePath = this.extractImagePath(item.source);

        // 画像プレビューを非同期でレンダリング
        if (imagePath && item.filePath) {
          this.renderImagePreview(imagePath, item.filePath, previewContainer);
        }

        // 画像情報を表示
        const infoDiv = previewContainer.createEl('div', {
          attr: {
            style:
              'padding: 8px 0; margin-top: 12px; border-top: 1px solid var(--divider-color); padding-top: 8px;',
          },
        });
        infoDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">Image Info:</div>
          <div style="word-break: break-word; font-family: monospace; font-size: 11px;">
            ${
              imagePath
                ? `<div><strong>Path:</strong> ${this.escapeHtml(
                    imagePath,
                  )}</div>`
                : '<div><em>No image path</em></div>'
            }
            ${
              item.alt
                ? `<div style="margin-top: 4px;"><strong>Alt text:</strong> ${this.escapeHtml(
                    item.alt,
                  )}</div>`
                : ''
            }
          </div>
        `;
      }
    } else {
      previewContainer.createEl('p', {
        text:
          item.type === 'table'
            ? `${item.rows} rows × ${item.cols} columns`
            : `Figure${item.alt ? ` (${item.alt})` : ''}`,
      });
    }

    // メタデータ
    const metaContainer = editorPanel.createEl('div', {
      attr: { style: 'font-size: 12px; color: var(--text-muted);' },
    });
    if (item.type === 'table') {
      metaContainer.createEl('p', {
        text: `${item.rows} rows × ${item.cols} columns`,
        attr: { style: 'margin: 4px 0;' },
      });
    } else if (item.alt) {
      metaContainer.createEl('p', {
        text: `Alt: ${item.alt}`,
        attr: { style: 'margin: 4px 0;' },
      });
    }

    // キャプション入力フィールド
    let textInput: any;
    new Setting(editorPanel).setName('Caption').addText((text) => {
      textInput = text
        .setPlaceholder(`E.g., "Comparison of results"`)
        .setValue(this.captions[this.currentItemIndex] || '')
        .onChange((value) => {
          this.captions[this.currentItemIndex] = value;
        });
    });

    // 最近使ったキャプション表示
    if (this.recentCaptions.length > 0) {
      editorPanel.createEl('p', {
        text: 'Recent captions:',
        attr: {
          style:
            'margin: 12px 0 8px 0; font-size: 12px; font-weight: bold; color: var(--text-muted);',
        },
      });

      const recentContainer = editorPanel.createEl('div', {
        attr: { style: 'display: flex; flex-wrap: wrap; gap: 6px;' },
      });

      for (const caption of this.recentCaptions) {
        const btn = recentContainer.createEl('button', {
          text: caption,
          attr: {
            style:
              'padding: 6px 10px; font-size: 11px; background-color: var(--background-tertiary); border: 1px solid var(--background-modifier-border); border-radius: 3px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;',
            title: caption,
          },
        });

        btn.addEventListener('click', () => {
          this.captions[this.currentItemIndex] = caption;
          textInput.setValue(caption);
        });
      }
    }
  }

  /**
   * Markdown テーブルを簡易 HTML としてレンダリング
   */
  private async renderMarkdownTable(
    markdownSource: string,
    container: HTMLElement,
  ): Promise<void> {
    const lines = markdownSource.trim().split('\n');
    if (lines.length < 2) {
      container.createEl('code', { text: markdownSource });
      return;
    }

    // 最初の行：ヘッダ
    const headerLine = lines[0];
    const separatorLine = lines[1];
    const bodyLines = lines.slice(2);

    // セパレータから列数を判定
    const colCount = (separatorLine.match(/\|/g) || []).length - 1;

    // テーブル要素を作成
    const table = container.createEl('table', {
      attr: {
        style:
          'border-collapse: collapse; width: 100%; font-size: 11px; border: 1px solid var(--divider-color);',
      },
    });

    // ヘッダ行
    const headerCells = this.parseCells(headerLine);
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    for (const cell of headerCells) {
      const th = headerRow.createEl('th', {
        attr: {
          style:
            'border: 1px solid var(--divider-color); padding: 4px; background-color: var(--background-tertiary); font-weight: bold; text-align: left;',
        },
      });
      // Obsidian の MarkdownRenderer を使用してセルをレンダリング
      await (MarkdownRenderer as any).renderMarkdown(cell.trim(), th, '', this);
    }

    // ボディ行
    const tbody = table.createEl('tbody');
    for (const line of bodyLines) {
      if (!line.trim()) continue;
      const cells = this.parseCells(line);
      const row = tbody.createEl('tr');
      for (const cell of cells) {
        const td = row.createEl('td', {
          attr: {
            style:
              'border: 1px solid var(--divider-color); padding: 4px; text-align: left;',
          },
        });
        // Obsidian の MarkdownRenderer を使用してセルをレンダリング
        await (MarkdownRenderer as any).renderMarkdown(
          cell.trim(),
          td,
          '',
          this,
        );
      }
    }
  }
  /**
   * Markdown テーブル行をセルに分割
   */
  private parseCells(line: string): string[] {
    return line
      .split('|')
      .slice(1, -1) // 最初と最後の空要素を除外
      .map((cell) => cell.trim());
  }

  /**
   * Markdown 画像記法から画像パスを抽出
   * 例：![alt](path/to/image.png) → path/to/image.png
   */
  private extractImagePath(markdownSource: string): string | null {
    const match = markdownSource.match(/!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
  }

  /**
   * 画像をプレビューとしてレンダリング
   */
  private async renderImagePreview(
    imagePath: string,
    filePath: string,
    container: HTMLElement,
  ): Promise<void> {
    try {
      // 相対パスを解決
      const absolutePath = this.resolveImagePath(imagePath, filePath);

      // ファイルが存在するか確認
      const imageFile = this.app.vault.getAbstractFileByPath(absolutePath);
      if (!imageFile || imageFile instanceof TFolder) {
        return;
      }

      // バイナリデータを読み込み
      const data = await this.app.vault.readBinary(imageFile as TFile);

      // Data URL に変換
      const blob = new Blob([data]);
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // 画像要素を作成
      const imgContainer = container.createEl('div', {
        attr: {
          style: 'margin-bottom: 12px; text-align: center;',
        },
      });

      const img = imgContainer.createEl('img', {
        attr: {
          src: dataUrl,
          style:
            'max-width: 100%; max-height: 200px; border-radius: 4px; border: 1px solid var(--divider-color);',
        },
      });
    } catch (error) {
      // 画像読み込み失敗時は無視（情報表示のみで継続）
      console.error('Failed to load image preview:', error);
    }
  }

  /**
   * 相対パスを絶対パスに解決
   */
  private resolveImagePath(imagePath: string, filePath: string): string {
    // URL エンコーディングを解除
    const decodedPath = decodeURI(imagePath);

    // 絶対パスの場合はそのまま返す
    if (decodedPath.startsWith('/')) {
      return decodedPath;
    }

    // 相対パスの場合は、現在のファイルのディレクトリからの相対パスに変換
    const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (fileDir) {
      return fileDir + '/' + decodedPath;
    }

    return decodedPath;
  }

  /**
   * HTML 特殊文字をエスケープ
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
