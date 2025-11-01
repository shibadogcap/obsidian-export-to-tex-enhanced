import { MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { TeXPrinter } from './texPrinter';
import { ensureSettings, ExportToTexSettings } from './plugin/settings';
import { ExportToTeXSettingTab } from './plugin/settingsTabs';
import { exportAstToConsole, exportModifiedAstToConsole } from './debug/ast';
import { ObsidianVFile, toVFile, vfileFromSelection } from './file';
import { FrontmatterCheckModal } from './modals/frontmatterModal';
import { CaptionInputModal, TableOrFigureInfo } from './modals/captionModal';

export default class ExportToTeXPlugin extends Plugin {
  settings: ExportToTexSettings = new ExportToTexSettings();

  public async onload(): Promise<void> {
    const settings = await this.loadData();
    if (settings !== null) {
      this.settings = ensureSettings(settings);
    }
    this.addCommands();
    this.addRibbonButtons();

    if (DEBUG) {
      this.addDebugCommands();
    }

    this.addSettingTab(new ExportToTeXSettingTab(this.app, this));
  }

  private addCommands() {
    // Note we use arrow functions here to make sure we're always getting the currently
    // defined versions of things
    this.addExportCommand(
      'export-to-tex',
      'Export To TeX',
      () => this.app.workspace.getActiveFile(),
      (x) => this.exportFileToFile(x),
    );

    this.addExportCommand(
      'export-tex-to-clipboard',
      'Export To Clipboard',
      () => this.app.workspace.getActiveFile(),
      (x) => this.exportFileToClipboard(x),
    );

    this.addExportCommand(
      'export-selection-to-tex',
      'Export Selection To TeX',
      () => this.app.workspace.getActiveViewOfType(MarkdownView),
      (x) => this.exportSelectionToFile(x),
    );

    this.addExportCommand(
      'export-selection-tex-to-clipboard',
      'Export Selection To Clipboard',
      () => this.app.workspace.getActiveViewOfType(MarkdownView),
      (x) => this.exportSelectionToClipboard(x),
    );
  }

  private addDebugCommands() {
    this.addExportCommand(
      'export-ast-to-console',
      'Show AST',
      () => this.app.workspace.getActiveFile(),
      exportAstToConsole,
    );

    this.addExportCommand(
      'export-modified-ast-to-console',
      'Show modified AST',
      () => this.app.workspace.getActiveFile(),
      (file) =>
        exportModifiedAstToConsole(file, this.settings, this.app.metadataCache),
    );
  }

  private addExportCommand<TFileOrView>(
    id: string,
    name: string,
    getFileOrView: () => TFileOrView | null,
    doExport: (x: TFileOrView) => Promise<void>,
  ) {
    this.addCommand({
      id,
      name,
      checkCallback: (checking: boolean) => {
        const fileOrView = getFileOrView();
        if (fileOrView !== null) {
          if (!checking) {
            doExport(fileOrView).catch(this.onExportError);
          }
          return true;
        }
        return false;
      },
    });
  }

  private addRibbonButtons() {
    // ファイル書き出しボタン
    this.addRibbonIcon('save', 'Export current file to TeX', async () => {
      const file = this.app.workspace.getActiveFile();
      if (file) {
        await this.exportFileToFile(file).catch(this.onExportError.bind(this));
      }
    });

    // クリップボード書き出しボタン
    this.addRibbonIcon('copy', 'Export current file to clipboard', async () => {
      const file = this.app.workspace.getActiveFile();
      if (file) {
        await this.exportFileToClipboard(file).catch(
          this.onExportError.bind(this),
        );
      }
    });
  }

  /**
   * フロントマター確認処理（共通）
   */
  private async confirmFrontmatter(
    printer: TeXPrinter,
    file: TFile,
    currentFrontmatter: any,
  ): Promise<{ [key: string]: string } | null> {
    if (!this.settings.askForFrontmatter) {
      return currentFrontmatter;
    }

    const templateKeys = printer.extractTemplateKeys(
      this.settings.preamble + '\n' + this.settings.postamble,
    );

    const result = await new Promise<any>((resolve) => {
      const modal = new FrontmatterCheckModal(
        this.app,
        currentFrontmatter,
        (data) => {
          resolve(data);
        },
        templateKeys,
      );
      modal.open();
    });

    if (!result) {
      // ユーザーがキャンセル
      return null;
    }

    const finalFrontmatter = { ...currentFrontmatter, ...result.data };

    if (result.saveToMarkdown) {
      await this.updateFrontmatterInMarkdown(file, finalFrontmatter);
    }

    return finalFrontmatter;
  }

  /**
   * キャプション確認処理（共通）
   */
  private async confirmCaptions(
    printer: TeXPrinter,
    vfile: ObsidianVFile,
  ): Promise<{ [index: number]: string } | null> {
    if (!this.settings.askForCaptions || !this.settings.generateCaptions) {
      return {};
    }

    const { itemsInOrder } = printer.getTablesAndFigures(vfile);
    const items: TableOrFigureInfo[] = [];

    for (let i = 0; i < itemsInOrder.length; i++) {
      const item = itemsInOrder[i];
      items.push({
        index: i,
        type: item.type,
        rows: item.data?.rows,
        cols: item.data?.cols,
        alt: item.data?.alt,
        source: item.data?.source,
        filePath: vfile.path, // ファイルパスを追加
        preview:
          item.type === 'table'
            ? `Table with ${item.data?.rows} rows and ${item.data?.cols} columns`
            : item.data?.alt || item.data?.title || '(no alt text)',
      });
    }

    if (items.length === 0) {
      return {};
    }

    const captionData = await new Promise<any>((resolve) => {
      const modal = new CaptionInputModal(this.app, items, (captions) => {
        resolve(captions);
      });
      modal.open();
    });

    return captionData; // null or caption data
  }

  async exportFileToFile(file: TFile): Promise<void> {
    await this.exportToFile(await toVFile(file));
  }

  async exportSelectionToFile(view: MarkdownView): Promise<void> {
    await this.exportToFile(vfileFromSelection(view));
  }

  async exportToFile(vfile: ObsidianVFile): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(vfile.path) as TFile;
    const printer = new TeXPrinter(this.app, this.settings);

    // フロントマター取得
    const currentFrontmatter =
      (this.app.metadataCache.getFileCache(file)?.frontmatter as any) || {};

    // フロントマター確認
    const finalFrontmatter = await this.confirmFrontmatter(
      printer,
      file,
      currentFrontmatter,
    );
    if (finalFrontmatter === null) {
      return; // キャンセル
    }

    // TeXPrinter にフロントマターを渡して出力を生成
    let contents = await printer.toTexWithFrontmatter(vfile, finalFrontmatter);

    // キャプション確認
    const captionData = await this.confirmCaptions(printer, vfile);
    if (captionData === null) {
      return; // キャンセル
    }

    if (Object.keys(captionData).length > 0) {
      const { tables, figures } = printer.getTablesAndFigures(vfile);
      contents = this.applyCaptions(contents, captionData, tables, figures);
    }

    if (typeof window.showSaveFilePicker !== 'function') {
      // Mobile or unsupported: save to same directory with {basename}_{date_time}.tex
      const now = new Date();
      const dateStr =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        '-' +
        String(now.getMinutes()).padStart(2, '0') +
        '-' +
        String(now.getSeconds()).padStart(2, '0');
      const newName = `${file.basename}_${dateStr}.tex`;
      const newPath = `${file.parent?.path || ''}/${newName}`;
      await this.app.vault.create(newPath, contents);
      new Notice(`Tex exported to ${newName}`);
    } else {
      // Desktop: check if should ask for path
      if (this.settings.askForExportPath) {
        // Ask for export path
        try {
          const fileHandle = await window.showSaveFilePicker({
            types: [
              {
                description: 'LaTeX',
                accept: {
                  'application/x-tex': ['.tex'],
                },
              },
            ],
          });

          const writeable = await fileHandle.createWritable();
          await writeable.write(contents);
          writeable.close();

          // eslint-disable-next-line no-new
          new Notice(`Tex exported to ${fileHandle.name}`);
        } catch (AbortError) {
          return;
        }
      } else {
        // Save to same directory as markdown with {basename}_{date}.tex
        const now = new Date();
        const dateStr =
          now.getFullYear() +
          '-' +
          String(now.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(now.getDate()).padStart(2, '0');
        const newName = `${file.basename}_${dateStr}.tex`;
        const newPath = `${file.parent?.path || ''}/${newName}`;
        await this.app.vault.create(newPath, contents);
        new Notice(`Tex exported to ${newName}`);
      }
    }
  }

  /**
   * キャプション情報を TeX 出力に反映させる
   * 表/図ごとのインデックスに基づいて正確に置換
   */
  private applyCaptions(
    contents: string,
    captions: { [index: number]: string },
    tables: Array<{
      index: number;
      rows: number;
      cols: number;
      source?: string;
    }>,
    figures: Array<{
      index: number;
      alt: string;
      title?: string;
      source?: string;
    }>,
  ): string {
    let result = contents;

    // 全表/図を統合してソート（ドキュメント内の出現順）
    const allItems: Array<{ index: number; type: 'table' | 'figure' }> = [];
    for (const table of tables) {
      allItems.push({ index: table.index, type: 'table' });
    }
    for (const figure of figures) {
      allItems.push({ index: figure.index, type: 'figure' });
    }
    // ソート（Visitor で記録された順序を保証）
    allItems.sort((a, b) => a.index - b.index);

    // 各キャプション環境を正確に検出・置換
    let captionIndex = 0;
    result = result.replace(/\\caption\{([^}]*)\}/g, (match) => {
      // キャプション環境の登場順に対応する表/図を特定
      if (captionIndex < allItems.length) {
        const item = allItems[captionIndex];
        const captionText = captions[captionIndex];
        captionIndex++;

        if (captionText) {
          return `\\caption{${captionText}}`;
        }
      }
      return match;
    });

    return result;
  }

  async exportFileToClipboard(file: TFile): Promise<void> {
    await this.exportToClipboard(await toVFile(file));
  }

  async exportSelectionToClipboard(view: MarkdownView): Promise<void> {
    await this.exportToClipboard(vfileFromSelection(view));
  }

  async exportToClipboard(vfile: ObsidianVFile): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(vfile.path) as TFile;
    const printer = new TeXPrinter(this.app, this.settings);

    // フロントマター取得
    const currentFrontmatter =
      (this.app.metadataCache.getFileCache(file)?.frontmatter as any) || {};

    // フロントマター確認
    const finalFrontmatter = await this.confirmFrontmatter(
      printer,
      file,
      currentFrontmatter,
    );
    if (finalFrontmatter === null) {
      return; // キャンセル
    }

    // TeXPrinter にフロントマターを渡して出力を生成
    let contents = await printer.toTexWithFrontmatter(vfile, finalFrontmatter);

    // キャプション確認
    const captionData = await this.confirmCaptions(printer, vfile);
    if (captionData === null) {
      return; // キャンセル
    }

    if (Object.keys(captionData).length > 0) {
      const { tables, figures } = printer.getTablesAndFigures(vfile);
      contents = this.applyCaptions(contents, captionData, tables, figures);
    }

    await navigator.clipboard.writeText(contents);
    // eslint-disable-next-line no-new
    new Notice(`Tex exported to clipboard`);
  }

  onExportError(e: Error): void {
    console.log(e);
    // eslint-disable-next-line no-new
    new Notice(
      `Error of type "${e.name}" occurred on export. See console for details.`,
    );
  }

  /**
   * Markdown ファイルのフロントマターを更新
   */
  private async updateFrontmatterInMarkdown(
    file: TFile,
    frontmatter: any,
  ): Promise<void> {
    try {
      let fileContent = await this.app.vault.read(file);

      // フロントマターの開始と終了を検出
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
      const match = fileContent.match(frontmatterRegex);

      if (match) {
        // 既存のフロントマターを新しいものに置き換え
        const newFrontmatterYaml = this.objectToYaml(frontmatter);
        const newContent = fileContent.replace(
          frontmatterRegex,
          `---\n${newFrontmatterYaml}\n---\n`,
        );
        await this.app.vault.modify(file, newContent);
        // eslint-disable-next-line no-new
        new Notice('Frontmatter updated in Markdown file');
      } else {
        // フロントマターがない場合は、先頭に追加
        const newFrontmatterYaml = this.objectToYaml(frontmatter);
        const newContent = `---\n${newFrontmatterYaml}\n---\n${fileContent}`;
        await this.app.vault.modify(file, newContent);
        // eslint-disable-next-line no-new
        new Notice('Frontmatter added to Markdown file');
      }
    } catch (error) {
      console.error('Failed to update frontmatter:', error);
      // eslint-disable-next-line no-new
      new Notice('Failed to update frontmatter in Markdown file');
    }
  }

  /**
   * オブジェクトを YAML 形式に変換
   */
  private objectToYaml(obj: any): string {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      // 値に特殊文字が含まれている場合はシングルクォートで囲む
      const stringValue = String(value);
      if (stringValue.includes(':') || stringValue.includes('\n')) {
        lines.push(`${key}: '${stringValue.replace(/'/g, "''")}'`);
      } else {
        lines.push(`${key}: ${stringValue}`);
      }
    }
    return lines.join('\n');
  }
}
