import { MetadataCache, App, TFile } from 'obsidian';
import { markdownToTex } from './processor';
import { ObsidianVFile } from './file';
import { VFile } from 'vfile';
import { ExportToTexSettings } from './plugin/settings';
import reporter from 'vfile-reporter';

export class TeXPrinter {
  constructor(
    readonly app: App,
    readonly settings: ExportToTexSettings,
    readonly exportPath?: string,
  ) {}

  /**
   * テンプレート内のキー（{{key}} 形式）をすべて抽出
   */
  extractTemplateKeys(template: string): string[] {
    const keys = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    while ((match = regex.exec(template)) !== null) {
      keys.add(match[1]);
    }
    return Array.from(keys);
  }

  private replaceTemplate(template: string, frontmatter: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = frontmatter[key];
      if (value !== undefined) {
        // LaTeXの特殊文字をエスケープして安全に
        return value
          .toString()
          .replace(/[&%$#_{}[\]]/g, '\\$&')
          .replace(/\\/g, '\\textbackslash{}');
      }
      // 日付以外はerror
      if (key === 'date') {
        return new Date().toISOString().split('T')[0];
      } else {
        return 'undefined';
      }
    });
  }

  async process(vfile: VFile): Promise<string> {
    const output = await markdownToTex()
      .data('settings', {
        exportToTex: this.settings,
      })
      .data('metadata', this.app.metadataCache)
      .process(vfile);
    return output.toString();
  }

  /**
   * VFile の data から Visitor 情報を取得
   * 表と図のリスト + 出現順を返す
   */
  getTablesAndFigures(vfile: VFile): {
    tables: Array<{
      index: number;
      rows: number;
      cols: number;
      source?: string;
    }>;
    figures: Array<{
      index: number;
      alt: string;
      title?: string;
      source?: string;
    }>;
    itemsInOrder: Array<{
      type: 'table' | 'figure';
      displayIndex: number;
      data: any;
    }>;
  } {
    const visitor = (vfile.data as any)?.visitor;
    if (!visitor) {
      return { tables: [], figures: [], itemsInOrder: [] };
    }
    return {
      tables: visitor.getTables(),
      figures: visitor.getFigures(),
      itemsInOrder: visitor.getItemsInOrder(),
    };
  }

  async toTex(vfile: ObsidianVFile): Promise<string> {
    return this.toTexWithFrontmatter(vfile, {});
  }

  async toTexWithFrontmatter(
    vfile: ObsidianVFile,
    overrideFrontmatter?: any,
  ): Promise<string> {
    console.groupCollapsed('export-to-tex');
    let tex = await this.process(vfile);
    console.log(reporter(vfile));
    if (this.settings.compressNewlines) {
      console.log('Compressing newlines');
      tex = TeXPrinter.compressNewlines(tex);
    }
    const frontmatter =
      (this.app.metadataCache.getFileCache(
        this.app.vault.getAbstractFileByPath(vfile.path) as TFile,
      )?.frontmatter as any) || {};
    const fileName =
      vfile.path.split('/').pop()?.replace(/\.md$/, '') || 'Untitled';
    frontmatter.title = frontmatter.title || fileName;

    // オーバーライドフロントマターをマージ
    if (overrideFrontmatter) {
      Object.assign(frontmatter, overrideFrontmatter);
    }

    let preamble = this.settings.preamble;
    let postamble = this.settings.postamble;
    // preambleが\documentclassを含まない場合、デフォルトを追加
    if (!preamble.includes('\\documentclass')) {
      preamble = '\\documentclass{article}\n' + preamble;
    }
    if (this.settings.generateCaptions) {
      let packages = '';
      if (
        (this.settings.figurePosition.includes('H') ||
          this.settings.figurePosition.includes('h') ||
          this.settings.tablePosition.includes('H') ||
          this.settings.tablePosition.includes('h')) &&
        !preamble.includes('\\usepackage{float}')
      ) {
        packages += '\\usepackage{float}\n';
      }
      if (
        (this.settings.figurePosition.includes('!') ||
          this.settings.tablePosition.includes('!')) &&
        !preamble.includes('\\usepackage{here}')
      ) {
        packages += '\\usepackage{here}\n';
      }
      // preambleにpackagesを挿入（\documentclass の後に）
      if (packages) {
        const docClassMatch = preamble.match(/^(\\documentclass[^}]*}\s*)/);
        if (docClassMatch) {
          preamble =
            docClassMatch[1] +
            packages +
            preamble.slice(docClassMatch[1].length);
        } else {
          preamble = packages + preamble;
        }
      }
    }
    preamble = this.replaceTemplate(preamble, frontmatter);
    if (
      frontmatter &&
      frontmatter.title &&
      typeof frontmatter.title === 'string' &&
      frontmatter.title.trim()
    ) {
      preamble += '\n\\maketitle';
    }
    tex = preamble + tex + this.replaceTemplate(postamble, frontmatter);
    console.groupEnd();
    return tex;
  }

  private static compressNewlines(tex: string): string {
    const lines = tex.split('\n');
    const output = [];
    let wasEmpty = false;
    for (const line of lines) {
      if (line === '') {
        wasEmpty = true;
        continue;
      }

      if (wasEmpty) {
        output.push('');
        wasEmpty = false;
      }
      output.push(line);
    }

    return output.join('\n');
  }
}
