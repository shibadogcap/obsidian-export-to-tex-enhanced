import { Node, Parent } from 'unist';
import {
  Blockquote,
  Code,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast';
import { ExportToTexSettings } from '../plugin/settings';
import { VFile } from 'vfile';
import { LabeledNode } from '../transform/labels/label';
import { getLabel, getRef } from './getRef';
import type { InlineMath, Math } from 'mdast-util-math';
import { displayMath } from './types/math';
import { WikiLink } from 'remark-wiki-link';
import { Literal } from 'hast';
import { is } from 'unist-util-is';
import { isParent } from '../nodeTypeHelpers';

const headingNames = [
  'section',
  'subsection',
  'subsubsection',
  'paragraph',
  'subparagraph',
];

export class Visitor {
  private _output: string[];
  private readonly _settings: ExportToTexSettings;
  private readonly _file: VFile;
  private _commenting: boolean = false;
  private _footnotes: Map<string, any> = new Map();

  private readonly greekMap: { [key: string]: string } = {
    α: '\\alpha',
    β: '\\beta',
    γ: '\\gamma',
    δ: '\\delta',
    ε: '\\epsilon',
    ζ: '\\zeta',
    η: '\\eta',
    θ: '\\theta',
    ι: '\\iota',
    κ: '\\kappa',
    λ: '\\lambda',
    μ: '\\mu',
    ν: '\\nu',
    ξ: '\\xi',
    ο: '\\omicron',
    π: '\\pi',
    ρ: '\\rho',
    σ: '\\sigma',
    τ: '\\tau',
    υ: '\\upsilon',
    φ: '\\phi',
    χ: '\\chi',
    ψ: '\\psi',
    ω: '\\omega',
    Α: '\\Alpha',
    Β: '\\Beta',
    Γ: '\\Gamma',
    Δ: '\\Delta',
    Ε: '\\Epsilon',
    Ζ: '\\Zeta',
    Η: '\\Eta',
    Θ: '\\Theta',
    Ι: '\\Iota',
    Κ: '\\Kappa',
    Λ: '\\Lambda',
    Μ: '\\Mu',
    Ν: '\\Nu',
    Ξ: '\\Xi',
    Ο: '\\Omicron',
    Π: '\\Pi',
    Ρ: '\\Rho',
    Σ: '\\Sigma',
    Τ: '\\Tau',
    Υ: '\\Upsilon',
    Φ: '\\Phi',
    Χ: '\\Chi',
    Ψ: '\\Psi',
    Ω: '\\Omega',
  };

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private readonly symbolMap: { [key: string]: string } = {
    '≤': '\\leq',
    '≥': '\\geq',
    '≠': '\\neq',
    '≈': '\\approx',
    '≡': '\\equiv',
    '∞': '\\infty',
    '∑': '\\sum',
    '∏': '\\prod',
    '∫': '\\int',
    '∮': '\\oint',
    '√': '\\sqrt',
    '∂': '\\partial',
    '∇': '\\nabla',
    '∆': '\\Delta',
    '∈': '\\in',
    '∉': '\\notin',
    '⊂': '\\subset',
    '⊆': '\\subseteq',
    '⊃': '\\supset',
    '⊇': '\\supseteq',
    '∩': '\\cap',
    '∪': '\\cup',
    '∧': '\\wedge',
    '∨': '\\vee',
    '¬': '\\neg',
    '∀': '\\forall',
    '∃': '\\exists',
    '⇒': '\\implies',
    '⇔': '\\iff',
    '→': '\\to',
    '←': '\\leftarrow',
    '↑': '\\uparrow',
    '↓': '\\downarrow',
    '↔': '\\leftrightarrow',
    '±': '\\pm',
    '×': '\\times',
    '÷': '\\div',
    '⋅': '\\cdot',
    '°': '\\degree',
    '′': '\\prime',
    '″': '\\dprime',
    '‴': '\\trprime',
  };

  // 表と図の情報を記録するための配列
  private _tables: Array<{
    index: number;
    rows: number;
    cols: number;
    source?: string;
  }> = [];
  private _figures: Array<{
    index: number;
    alt: string;
    title?: string;
    source?: string;
  }> = [];
  private _markdownSource: string = ''; // Markdown ソース全体

  // 表と図の出現順を保持する統合配列
  private _itemsInOrder: Array<{
    type: 'table' | 'figure';
    displayIndex: number;
  }> = [];
  private _tableCounter: number = 0; // 表の出現数
  private _figureCounter: number = 0; // 図の出現数

  constructor(settings: ExportToTexSettings, file: VFile) {
    this._output = [];
    this._settings = settings;
    this._file = file;
    // Markdown ソースを保存
    this._markdownSource = file.value as string;
  }

  /**
   * 検出された表の情報を取得
   */
  getTables(): Array<{
    index: number;
    rows: number;
    cols: number;
    source?: string;
  }> {
    return this._tables;
  }

  /**
   * 検出された図の情報を取得
   */
  getFigures(): Array<{
    index: number;
    alt: string;
    title?: string;
    source?: string;
  }> {
    return this._figures;
  }

  /**
   * 表と図の出現順を取得（ドキュメント内の順序）
   */
  getItemsInOrder(): Array<{
    type: 'table' | 'figure';
    displayIndex: number;
    data: any;
  }> {
    return this._itemsInOrder.map((item) => ({
      type: item.type,
      displayIndex: item.displayIndex,
      data:
        item.type === 'table'
          ? this._tables[item.displayIndex]
          : this._figures[item.displayIndex],
    }));
  }

  /**
   * Node の位置情報から Markdown ソースを抽出
   */
  private extractNodeSource(node: any): string {
    if (!node.position || !node.position.start || !node.position.end) {
      return '';
    }

    const { start, end } = node.position;
    const sourceLines = this._markdownSource.split('\n');

    // 行番号は 1-indexed のため、0-indexed に変換
    const startLine = start.line - 1;
    const endLine = end.line - 1;
    const startCol = start.column - 1;
    const endCol = end.column - 1;

    let result = '';

    if (startLine === endLine) {
      // 同一行の場合
      result = sourceLines[startLine]?.substring(startCol, endCol) || '';
    } else {
      // 複数行の場合
      result = sourceLines[startLine]?.substring(startCol) || '';
      for (let i = startLine + 1; i < endLine; i++) {
        result += '\n' + (sourceLines[i] || '');
      }
      result += '\n' + (sourceLines[endLine]?.substring(0, endCol) || '');
    }

    return result.trim();
  }

  toString(): string {
    return this._output.join('');
  }

  visit(node: Node): void {
    switch (node.type) {
      case 'root':
        this.visitChildren(node as Root);
        break;
      case 'heading':
        this.visitHeading(node as Heading);
        break;
      case 'blockquote':
        this.visitBlockquote(node as Blockquote);
        break;
      case 'paragraph':
        this.visitParagraph(node as Paragraph);
        break;
      case 'image':
        this.visitImage(node as Image);
        break;
      case 'table':
        this.visitTable(node as Table);
        break;
      case 'tableCell':
        this.visitTableCell(node as TableCell);
        break;
      case 'inlineMath':
        this.emit(`$${(node as InlineMath).value}$`);
        break;
      case 'math':
        this.visitMath(node as Math);
        break;
      case 'inlineCode':
        this.emit(`\\verb{${(node as InlineCode).value}}`);
        break;
      case 'code':
        this.visitCode(node as Code);
        break;
      case 'list':
        this.visitList(node as List);
        break;
      case 'listItem':
        this.visitListItem(node as ListItem);
        break;
      case 'wikiLink':
        this.visitWikiLink(node as WikiLink);
        break;
      case 'link':
        this.visitLink(node as Link);
        break;
      case 'emphasis':
        this.commandChildren('emph', node as Emphasis);
        break;
      case 'strong':
        this.commandChildren('textbf', node as Strong);
        break;
      case 'text':
        this.visitText(node as Text);
        break;
      case 'break':
        this.emit('\\\\\n');
        break;
      case 'thematicBreak':
        this.emit('\n\\hrulefill\n');
        break;
      case 'footnoteDefinition':
        this.visitFootnoteDefinition(node);
        break;
      case 'footnoteReference':
        this.visitFootnoteReference(node);
        break;
      case 'html':
        this.visitHtml(node);
        break;
      case 'yaml':
        break;
      default:
        this.visitUnknown(node);
    }
  }

  visitHeading(heading: Heading): void {
    if (heading.depth > 5) {
      return;
    }
    const cmd =
      headingNames[heading.depth - 1] +
      (this._settings.numberedSections ? '' : '*');
    this.commandChildren(cmd, heading);
    this.label(heading as LabeledNode);
  }

  visitBlockquote(blockquote: Blockquote): void {
    this.begin('blockquote');
    this.visitChildren(blockquote);
    this.end('blockquote');
  }

  visitParagraph(paragraph: Paragraph): void {
    this.emit('\n');
    this.visitChildren(paragraph);
    this.emit('\n');
  }

  visitImage(image: Image): void {
    // 図の情報を記録
    const figureIndex = this._figures.length;
    const caption = image.alt || image.title || 'Figure';

    // 図のMarkdown ソースを抽出
    const imageSource = this.extractNodeSource(image);

    this._figures.push({
      index: figureIndex,
      alt: image.alt || '',
      title: image.title || undefined,
      source: imageSource,
    });

    // 出現順を記録
    this._itemsInOrder.push({
      type: 'figure',
      displayIndex: this._figureCounter++,
    });

    if (this._settings.generateCaptions) {
      // 正しい \begin{figure}[pos] 形式で出力
      this.emit(`\\begin{figure}[${this._settings.figurePosition}]\n`);
      this.emit('\\centering\n');
      // 画像幅をテキスト幅の80%に制限して自動スケール
      this.emit('\\includegraphics[width=0.8\\textwidth,keepaspectratio]{');
      this.emit(image.url);
      this.emit('}\n');
      this.emit(`\\caption{\\sffamily ${caption}}\n`);
      this.label(image as LabeledNode);
      this.emit('\\end{figure}\n');
    } else {
      this.begin('center');
      // 画像幅をテキスト幅の90%に制限して自動スケール
      this.emit('\\includegraphics[width=0.9\\textwidth,keepaspectratio]{');
      this.emit(image.url);
      this.emit('}\n');
      if (image.title || image.alt) {
        this.emit(
          `\\captionof{figure}{\\sffamily ${image.title || ''} ${
            image.alt || ''
          }}`,
        );
        this.label(image as LabeledNode);
        this.emit('\n');
      }
      this.end('center');
    }
  }

  visitTable(table: Table): void {
    const columns = table.children[0].children.length;
    const rows = table.children.length;

    // 表のMarkdown ソースを抽出
    const tableSource = this.extractNodeSource(table);

    // 表の情報を記録
    const tableIndex = this._tables.length;
    this._tables.push({
      index: tableIndex,
      rows: rows,
      cols: columns,
      source: tableSource,
    });

    // 出現順を記録
    this._itemsInOrder.push({
      type: 'table',
      displayIndex: this._tableCounter++,
    });

    if (rows > 50) {
      this._file.message(
        `Large table detected (${rows} rows). Export may be slow or cause freezing.`,
        table,
      );
    }

    // ステップ1: 縦チェック（30行以上）→ longtable 対象判定
    const useLongtable = rows > 30;

    // ステップ2: 横チェック（6列以上）→ \small + 余白調整
    const useSmallFont = columns >= 6;

    if (useLongtable) {
      // 縦に細長い表（50行以上 AND 4列以内）を2段組で横に並べる
      // 条件：行数 > 50 AND 列数 <= 4
      if (rows > 50 && columns <= 4) {
        // minipage 2段組ブロックの最初に改ページを入れる
        this.emit('\\clearpage\n');

        // 各分割表は30行以下に制限
        const rowsPerTable = 30;
        let currentIndex = 1; // ヘッダー行をスキップ

        // minipage 2段組ブロックの開始（フォント調整）
        if (useSmallFont) {
          this.emit('{\\small\n');
          this.emit('\\setlength{\\tabcolsep}{2pt}\n');
        }

        // 2段組固定（3段組は改ページの問題があるため）
        const columnLayout = 2;
        const minipageWidth = 0.48;

        // ページ高さから上下マージンを除いた実効高さを計算
        // jlreq のデフォルトページ高さ約 254mm、マージン考慮して 230mm を2分割
        const minipageHeightMm = 115;

        // 段組処理用のカウンタ
        let rowCounter = 0;

        while (currentIndex < rows) {
          // 段組行の開始
          if (rowCounter % columnLayout === 0) {
            this.emit('\\noindent\n');
          }

          // 現在の分割表を作成
          const endIndex = Math.min(currentIndex + rowsPerTable, rows);
          const subtable: Table = {
            type: 'table',
            children: [
              table.children[0], // ヘッダー行
              ...table.children.slice(currentIndex, endIndex),
            ],
          };

          const subcolumns = subtable.children[0].children.length;
          const colSpec = 'l '.repeat(subcolumns).trim();

          // minipage を出力
          this.emit(
            `\\begin{minipage}[t][${minipageHeightMm}mm][t]{${minipageWidth}\\textwidth}\n`,
          );
          // minipage 内での行間隔をさらに縮小
          this.emit('\\setlength{\\parskip}{0pt}\n');
          this.emit('\\setlength{\\baselineskip}{10pt}\n');
          this.emit(`\\begin{longtable}[c]{${colSpec}}\n`);

          // キャプション（最初の分割表にのみ付与、ゴシック体で統一）
          if (rowCounter === 0 && this._settings.generateCaptions) {
            this.emit('\\caption{\\sffamily Table}\\\\\n');
            this.label(table as LabeledNode);
          }

          this.emit('\\toprule\n');
          subtable.children.forEach((row, index) => {
            this.visitTableRowWithSummaryDetection(
              row,
              index,
              subtable.children.length,
              true,
            );
            this.emit('\\\\\n');
            if (index === 0) {
              this.emit('\\midrule\n');
              this.emit('\\endhead\n');
            }
          });
          this.emit('\\bottomrule\n');
          this.emit('\\end{longtable}\n');
          this.emit('\\end{minipage}\n');

          // 段組内での区切り
          const isLastInRow = (rowCounter + 1) % columnLayout === 0;
          const isLastTable = endIndex >= rows;

          if (isLastInRow && !isLastTable) {
            // 行の終了：改ページ
            this.emit('\\par\\vspace{1em}\n');
          } else if (!isLastInRow) {
            // 列の区切り：同じ行内で並べる
            this.emit('\\hfill\n');
          }

          currentIndex = endIndex;
          rowCounter++;
        }

        if (useSmallFont) {
          this.emit('}\n'); // {\small の終了
        }
        return;
      }

      // longtable では tabularx の X 指定子は使えないため、l を使用（縦罫線なし）
      const colSpec = 'l '.repeat(columns).trim();

      // フォント調整の開始
      if (useSmallFont) {
        this.emit('{\\small\n');
        this.emit('\\setlength{\\tabcolsep}{2pt}\n');
      }

      this.emit(`\\begin{longtable}[c]{${colSpec}}\n`);
      // キャプションは \begin{longtable} の直後に配置（ゴシック体で統一）
      if (this._settings.generateCaptions) {
        this.emit('\\caption{\\sffamily Table}\\\\\n');
        this.label(table as LabeledNode);
      }
      this.emit('\\toprule\n');
      table.children.forEach((row, index) => {
        this.visitTableRowWithSummaryDetection(
          row,
          index,
          table.children.length,
          true,
        );
        this.emit('\\\\\n');
        if (index === 0) {
          this.emit('\\midrule\n');
          this.emit('\\endhead\n'); // ページごとのヘッダー
        }
      });
      this.emit('\\bottomrule\n');
      this.emit('\\end{longtable}\n');

      // フォント調整の終了
      if (useSmallFont) {
        this.emit('}\n');
      }
    } else {
      // 通常の表
      // table 環境で囲む（キャプションがなくても centering のため）
      this.emit(`\\begin{table}[${this._settings.tablePosition}]\n`);
      this.emit('\\centering\n');

      // キャプション（表は上に配置、ゴシック体で統一）
      if (this._settings.generateCaptions) {
        this.emit('\\caption{\\sffamily Table}\n');
        this.label(table as LabeledNode);
      }

      // フォント調整の開始
      if (useSmallFont) {
        this.emit('{\\small\n');
        this.emit('\\setlength{\\tabcolsep}{2pt}\n');
      }

      // useSmallFont の場合は tabularx、そうでない場合は tabular
      if (useSmallFont) {
        // 6列以上：tabularx を使用してページ幅に合わせる
        this.emit(`\\begin{tabularx}{\\textwidth}{${'X'.repeat(columns)}}\n`);
      } else {
        // 6列未満：tabular を使用してコンテンツに合わせたサイズ
        const colSpec = 'l '.repeat(columns).trim();
        this.emit(`\\begin{tabular}{${colSpec}}\n`);
      }

      this.emit('\\toprule\n');
      table.children.forEach((row, index) => {
        this.visitTableRowWithSummaryDetection(
          row,
          index,
          table.children.length,
          false,
        );
        this.emit('\\\\\n');
        if (index === 0) this.emit('\\midrule\n');
      });
      this.emit('\\bottomrule\n');

      if (useSmallFont) {
        this.emit('\\end{tabularx}\n');
      } else {
        this.emit('\\end{tabular}\n');
      }

      // フォント調整の終了
      if (useSmallFont) {
        this.emit('}\n');
      }

      this.emit('\\end{table}\n');
    }
  }

  visitTableRow(row: TableRow): void {
    const cells = row.children.length;
    row.children.forEach((cell, index) => {
      this.visit(cell);
      if (index < cells - 1) this.emit('&');
    });
  }

  visitTableCell(cell: TableCell): void {
    // セル内の改行をスペースに置き換えるため、一時的に出力バッファを変更
    const originalOutput = this._output;
    this._output = [];
    this.visitChildren(cell);
    let content = this._output.join('').replace(/\n/g, ' ');
    // \\ を \\newline に置き換え
    content = content.replace(/\\\\/g, '\\newline');
    this._output = originalOutput;
    this.emit(content);
  }

  visitMath(math: Math): void {
    this.emit(displayMath(this._settings, math));
  }

  visitCode(code: Code): void {
    this.emit(`% ${code.lang} ${code.meta}\n`);
    this.begin('verbatim');
    this.emit(code.value);
    this.emit('\n');
    this.end('verbatim');
  }

  visitList(list: List): void {
    const listEnvironment = list.ordered ? 'enumerate' : 'itemize';
    this.begin(listEnvironment);
    this.visitChildren(list);
    this.end(listEnvironment);
  }

  visitListItem(listItem: ListItem): void {
    this.emit('\\item ');
    this.visitChildren(listItem);
  }

  visitWikiLink(wikiLink: WikiLink): void {
    const { alias } = wikiLink.data;
    const label = (wikiLink as LabeledNode).data.label;
    const fallbackText =
      !wikiLink.value.contains('#') || label === undefined
        ? wikiLink.value
        : '';
    this.emit((alias ?? fallbackText).replaceAll('#', ''));
    this.reference(wikiLink as LabeledNode);
  }

  visitLink(link: Link): void {
    this.emit(`\\href{${link.url}}{`);
    this.visitChildren(link);
    this.emit('}');
  }

  visitText(text: Text): void {
    let value = text.value;
    // 日本語句読点の置換
    value = value.replace(/、/g, '，');
    value = value.replace(/。/g, '．');
    // LaTeX特殊文字のエスケープ（元のテキストにあるバックスラッシュ等を保護する）
    value = value.replace(/\\/g, '\\textbackslash{}');
    value = value.replace(/%/g, '\\%');
    value = value.replace(/~/g, '\\textasciitilde{}');
    value = value.replace(/&/g, '\\&');
    value = value.replace(/_/g, '\\_');
    value = value.replace(/\^/g, '\\textasciicircum{}');
    value = value.replace(/\$/g, '\\$');
    value = value.replace(/#/g, '\\#');
    value = value.replace(/\{/g, '\\{');
    value = value.replace(/\}/g, '\\}');
    // ギリシャ文字の変換（エスケープ後に行うことで、挿入される\\command が再度エスケープされるのを防ぐ）
    for (const [greek, latex] of Object.entries(this.greekMap)) {
      value = value.replace(new RegExp(greek, 'g'), latex + '{}');
    }
    // 数学記号の変換
    for (const [symbol, latex] of Object.entries(this.symbolMap)) {
      value = value.replace(
        new RegExp(this.escapeRegExp(symbol), 'g'),
        latex + '{}',
      );
    }
    this.emit(value);
  }

  visitChildren(node: Parent): void {
    node.children.forEach((node) => this.visit(node));
  }

  visitUnknown(node: Node): void {
    this._file.message(`Encountered unknown node type ${node.type}`, node);
    this.comment(() => {
      this.emit(`Unknown Node :: ${node.type}\n`);
      if (is<Literal>(node, (x): x is Literal => 'value' in x)) {
        this.emit(node.value);
      } else if (isParent(node)) {
        this.visitChildren(node);
      }
    });
  }

  emit(content: string): void {
    if (
      this._commenting &&
      this._output[this._output.length - 1].endsWith('\n')
    )
      this._output.push('%');
    this._output.push(content);
  }

  comment(callback: Function): void {
    const previous = this._commenting;
    this._commenting = true;
    callback();
    this._commenting = previous;
  }
  command(cmd: string, callback: Function): void {
    this.emit(`\\${cmd}{`);
    callback();
    this.emit('}');
  }

  commandChildren(cmd: string, node: Parent): void {
    this.command(cmd, () => this.visitChildren(node));
  }

  begin(name: string): void {
    this.emit(`\\begin{${name}}\n`);
  }

  end(name: string): void {
    this.emit(`\\end{${name}}\n`);
  }

  label(node?: LabeledNode): void {
    if (node?.data?.label === undefined) return;
    this.emit(getLabel(this._settings, node.data.label));
  }

  reference(node: LabeledNode): void {
    if (node.data?.label === undefined) return;
    this.emit(getRef(this._settings, node.data.label));
  }

  visitFootnoteDefinition(node: any): void {
    this._footnotes.set(node.identifier, node);
  }

  visitFootnoteReference(node: any): void {
    const def = this._footnotes.get(node.identifier);
    if (def) {
      this.emit('\\footnote{');
      this.visitChildren(def);
      this.emit('}');
    } else {
      this.emit(`[^${node.identifier}]`);
    }
  }

  visitHtml(node: any): void {
    let html = node.value;
    // <br> タグを LaTeX の改行に変換
    html = html.replace(/<br\s*\/?>/gi, '\\\\');
    // 他のHTMLタグは無視またはエスケープ（ここではシンプルにそのまま出力）
    this.emit(html);
  }

  /**
   * テーブル行の最初のセルのテキストを抽出する
   */
  private extractCellText(cell: TableCell): string {
    const originalOutput = this._output;
    this._output = [];
    this.visitChildren(cell);
    const text = this._output.join('').trim();
    this._output = originalOutput;
    return text;
  }

  /**
   * 集計行かどうかを判定する
   * 合計、平均、小計、計などの日本語キーワードか、
   * total, average, sum, mean などの英語キーワードを含むかチェック
   */
  private isSummaryRow(rowText: string): boolean {
    const summaryKeywords = [
      // 日本語
      '合計',
      '平均',
      '小計',
      '計',
      '総計',
      '総和',
      '合算',
      '平均値',
      '中央値',
      // 英語
      'total',
      'average',
      'sum',
      'mean',
      'subtotal',
      'grand total',
    ];

    const lowerText = rowText.toLowerCase();
    return summaryKeywords.some(
      (keyword) =>
        rowText.includes(keyword) || lowerText.includes(keyword.toLowerCase()),
    );
  }

  /**
   * テーブル行を訪問し、集計行の前に罫線を挿入する
   */
  private visitTableRowWithSummaryDetection(
    row: TableRow,
    rowIndex: number,
    totalRows: number,
    isLongtable: boolean = false,
  ): void {
    // 最初のセルからテキストを抽出
    if (row.children.length > 0) {
      const firstCellText = this.extractCellText(row.children[0]);

      // 集計行かつヘッダー行（index 0）でなければ、その前に罫線を挿入
      if (rowIndex > 0 && this.isSummaryRow(firstCellText)) {
        if (isLongtable) {
          // longtable では \hline で十分
          this.emit('\\hline\n');
        } else {
          // tabular/tabularx では行末に \hline を付ける必要があるため、
          // ここでは \hline を出力
          this.emit('\\hline\n');
        }
      }
    }

    // 通常のセル処理
    const cells = row.children.length;
    row.children.forEach((cell, index) => {
      this.visit(cell);
      if (index < cells - 1) this.emit('&');
    });
  }
}
