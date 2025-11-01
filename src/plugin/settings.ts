import { merge } from 'merge-anything';
export enum ImagePathSettings {
  RelativeToRoot,
  FullPath,
  BaseName,
  RelativeToExport,
}

export class ExportToTexSettings {
  refCommand: string = 'cref';
  defaultToEquation: boolean = false;
  additionalMathEnvironments: string[] = [];
  generateLabels: boolean = true;
  compressNewlines: boolean = false;
  imagePathSettings: ImagePathSettings = ImagePathSettings.RelativeToRoot;
  numberedSections: boolean = true;
  preamble: string =
    '\\documentclass[paper=a4]{jlreq}\n' +
    '\\usepackage{amsmath}\n' +
    '\\usepackage{amssymb}\n' +
    '\\usepackage{amsthm}\n' +
    '\\usepackage{amsfonts}\n' +
    '\\usepackage{mathtools}\n' +
    '\\usepackage{graphicx}\n' +
    '\\usepackage{multirow}\n' +
    '\\usepackage{hyperref}\n' +
    '\\usepackage{diffcoeff}\n' +
    '\\usepackage{comment}\n' +
    '\\usepackage{mhchem}\n' +
    '\\usepackage[separate-uncertainty]{siunitx}\n' +
    '\\usepackage{newunicodechar}\n' +
    '\\usepackage{listings}\n' +
    '\\usepackage{float}\n' +
    '\\usepackage{lscape}\n' +
    '\\usepackage{adjustbox}\n' +
    '\\usepackage{tabularx}\n' +
    '\\usepackage{booktabs}\n' +
    '\\usepackage{longtable}\n' +
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n' +
    '\\NewDocumentCommand\\degC{}{\\ensuremath{^\\circ\\symup{C}}}\n' +
    '\\NewDocumentCommand\\abs{m}{\\left|#1\\right|}\n' +
    '%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n' +
    '\\jlreqsetup{\n' +
    '    appendix_counter={\n' +
    '        section={\n' +
    '            value=0,\n' +
    '            the={\\Alph{section}}\n' +
    '        },\n' +
    '        table={\n' +
    '            value=0,\n' +
    '            the={\\Alph{section}\\arabic{table}}\n' +
    '        },\n' +
    '        figure={\n' +
    '            value=0,\n' +
    '            the={\\Alph{section}\\arabic{figure}}\n' +
    '        }\n' +
    '    },\n' +
    '    appendix_heading={\n' +
    '        section={\n' +
    '            label_format={付録\\thesection:}\n' +
    '        }\n' +
    '    }\n' +
    '}\n' +
    '\n' +
    '\\title{{{title}}}\n' +
    '\\author{{{affiliation}} \\\\ {{student_id}} {{name}}}\n' +
    '\\date{{{date}}}\n' +
    '\n' +
    '\n\\begin{document}\n';
  postamble: string = '\n\\end{document}';
  generateCaptions: boolean = true;
  figurePosition: string = 'h';
  tablePosition: string = 'H';
  askForFrontmatter: boolean = true;
  askForCaptions: boolean = true;
  askForExportPath: boolean = false; // Desktop 用：出力先を毎回選択
}

export type PartialSettings = Partial<ExportToTexSettings> & {
  // Deprecated options
  fullImagePath?: boolean;
  defaultExportDirectory: string;
};

/**
 * テンプレートの構造を検証・補正する
 * 最低限必要なLaTeX要素を確保する
 */
function ensureValidTemplate(template: string): string {
  let result = template;

  // \documentclass がない場合は追加
  if (!result.match(/\\documentclass/)) {
    result = '\\documentclass[paper=a4]{jlreq}\n' + result;
  }

  // \usepackage{amsmath} がない場合は追加
  if (!result.match(/\\usepackage\{amsmath\}/)) {
    const docClassMatch = result.match(/\\documentclass[^\n]*\n/);
    if (docClassMatch) {
      const insertIndex =
        result.indexOf(docClassMatch[0]) + docClassMatch[0].length;
      result =
        result.substring(0, insertIndex) +
        '\\usepackage{amsmath}\n' +
        result.substring(insertIndex);
    }
  }

  // \begin{document} がない場合は追加
  if (!result.match(/\\begin\{document\}/)) {
    // \begin{document} が無い場合は、postamble と結合する前に追加する必要がある
    // ここでは preamble に追加
    if (!result.endsWith('\n')) {
      result += '\n';
    }
    result += '\\begin{document}\n';
  }

  return result;
}

/**
 * ポストアンブルを検証・補正する
 */
function ensureValidPostamble(postamble: string): string {
  let result = postamble;

  // \end{document} がない場合は追加
  if (!result.match(/\\end\{document\}/)) {
    if (!result.endsWith('\n')) {
      result += '\n';
    }
    result += '\\end{document}\n';
  }

  return result;
}

function ensureRequiredPackages(preamble: string): string {
  const requiredPackages = [
    { name: 'float', description: 'Float positioning (table/figure)' },
    { name: 'lscape', description: 'Landscape page orientation' },
    { name: 'adjustbox', description: 'Adjust box sizing' },
    { name: 'tabularx', description: 'Flexible table columns' },
    { name: 'booktabs', description: 'Professional table formatting' },
    { name: 'longtable', description: 'Multi-page tables' },
  ];

  let updated = preamble;
  const addedPackages: string[] = [];

  for (const pkg of requiredPackages) {
    // Check if package already exists (with or without options)
    // Matches: \usepackage{name}, \usepackage[options]{name}
    const pattern = new RegExp(
      `\\\\usepackage(?:\\[[^\\]]*\\])?\\{${pkg.name}\\}`,
    );
    if (!pattern.test(updated)) {
      // Try multiple insertion points in order of preference
      let insertPoint = -1;
      const candidates = [
        /\\usepackage\{float\}\n/, // After float
        /\\usepackage\{booktabs\}\n/, // After booktabs
        /\\usepackage\{longtable\}\n/, // After longtable
        /\\usepackage\{adjustbox\}\n/, // After adjustbox
        /\\usepackage\{tabularx\}\n/, // After tabularx
        /\\usepackage\{lscape\}\n/, // After lscape
        /\\usepackage\{listings\}\n/, // After listings
        /\\usepackage\{newunicodechar\}\n/, // After newunicodechar
      ];

      for (const pattern of candidates) {
        const match = updated.match(pattern);
        if (match) {
          insertPoint = updated.indexOf(match[0]) + match[0].length;
          break;
        }
      }

      // If no good insertion point found, insert before comment section
      if (insertPoint < 0) {
        const commentMatch = updated.match(/\n%+\n/);
        if (commentMatch) {
          insertPoint = updated.indexOf(commentMatch[0]);
        }
      }

      // Finally, insert at the end of usepackage section
      if (insertPoint < 0) {
        const lastUsepkgMatch = updated.match(/\\usepackage[^\n]*\n/g);
        if (lastUsepkgMatch && lastUsepkgMatch.length > 0) {
          const lastMatch = lastUsepkgMatch[lastUsepkgMatch.length - 1];
          insertPoint = updated.lastIndexOf(lastMatch) + lastMatch.length;
        }
      }

      if (insertPoint > 0) {
        updated =
          updated.substring(0, insertPoint) +
          `\\usepackage{${pkg.name}}\n` +
          updated.substring(insertPoint);
        addedPackages.push(pkg.name);
      }
    }
  }

  // If packages were added, add a comment for user awareness
  if (addedPackages.length > 0) {
    const commentLine = `% Auto-added required packages: ${addedPackages.join(
      ', ',
    )}\n`;
    // Insert comment after documentclass
    const docClassMatch = updated.match(/\\documentclass[^\n]*\n/);
    if (docClassMatch) {
      const insertIndex =
        updated.indexOf(docClassMatch[0]) + docClassMatch[0].length;
      updated =
        updated.substring(0, insertIndex) +
        commentLine +
        updated.substring(insertIndex);
    }
  }

  return updated;
}

export function ensureSettings(partial: PartialSettings): ExportToTexSettings {
  const settings = merge(
    new ExportToTexSettings(),
    partial as Partial<ExportToTexSettings>,
  );

  // Ensure valid template structure (add missing \documentclass, \begin{document}, \end{document})
  // If preamble is empty or undefined, use default
  if (!settings.preamble || settings.preamble.trim() === '') {
    settings.preamble = new ExportToTexSettings().preamble;
  } else {
    settings.preamble = ensureValidTemplate(settings.preamble);
  }

  // Ensure required packages are present in preamble
  if (settings.preamble) {
    settings.preamble = ensureRequiredPackages(settings.preamble);
  }

  // Ensure valid postamble structure (add missing \end{document})
  if (settings.postamble) {
    settings.postamble = ensureValidPostamble(settings.postamble);
  }

  // Convert deprecated settings
  if (
    settings.imagePathSettings === undefined &&
    partial.fullImagePath !== undefined
  ) {
    settings.imagePathSettings = partial.fullImagePath
      ? ImagePathSettings.FullPath
      : ImagePathSettings.RelativeToRoot;
  }

  return settings as ExportToTexSettings;
}
