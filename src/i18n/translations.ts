export type Language = 'en' | 'ja';

export interface Translations {
  settings: {
    title: string;
    generateLabels: {
      name: string;
      desc: string;
    };
    refCommand: {
      name: string;
      desc: string;
    };
    numberedSections: {
      name: string;
      desc: string;
    };
    compressNewlines: {
      name: string;
      desc: string;
    };
    preamble: {
      name: string;
      desc: string;
    };
    postamble: {
      name: string;
      desc: string;
    };
    generateCaptions: {
      name: string;
      desc: string;
    };
    figurePosition: {
      name: string;
      desc: string;
    };
    tablePosition: {
      name: string;
      desc: string;
    };
    askForFrontmatter: {
      name: string;
      desc: string;
    };
    askForCaptions: {
      name: string;
      desc: string;
    };
    askForExportPath: {
      name: string;
      desc: string;
    };
    resetButton: string;
    resetConfirm: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    settings: {
      title: 'Settings for exporting to TeX',
      generateLabels: {
        name: 'Generate labels and refs',
        desc: 'Automatically generate TeX labels and refs for blocks and headings?',
      },
      refCommand: {
        name: 'Ref command',
        desc: 'Command to use when converting links to headings/blocks to refs.',
      },
      numberedSections: {
        name: 'Numbered sections',
        desc: 'When enabled emit headers as \\section{...}. When disabled instead use \\section*{...}',
      },
      compressNewlines: {
        name: 'Compress newlines',
        desc: 'Reduce any instance of 2 or more blank lines to a single blank line',
      },
      preamble: {
        name: 'Preamble',
        desc: 'Text to insert at the beginning of the exported TeX file. Use {{key}} to reference frontmatter variables.',
      },
      postamble: {
        name: 'Postamble',
        desc: 'Text to insert at the end of the exported TeX file. Use {{key}} to reference frontmatter variables.',
      },
      generateCaptions: {
        name: 'Generate captions for images and tables',
        desc: 'Automatically generate captions for images and tables',
      },
      figurePosition: {
        name: 'Figure position specifier',
        desc: 'Position specifier for figures (e.g., h, t, b, p, H)',
      },
      tablePosition: {
        name: 'Table position specifier',
        desc: 'Position specifier for tables (e.g., h, t, b, p, H)',
      },
      askForFrontmatter: {
        name: 'Ask for missing frontmatter',
        desc: 'Show a dialog to add missing frontmatter fields before export',
      },
      askForCaptions: {
        name: 'Ask for table/figure captions',
        desc: 'Show a dialog to input captions for tables and figures before export',
      },
      askForExportPath: {
        name: 'Ask for export path (Desktop)',
        desc: 'Prompt to choose export location each time (only on Desktop). When disabled, exports to same directory as markdown file with {filename}_{date}.tex',
      },
      resetButton: 'Reset to default',
      resetConfirm: 'Reset settings to default?',
    },
  },
  ja: {
    settings: {
      title: 'Export to TeX の設定',
      generateLabels: {
        name: 'ラベルと参照を生成する',
        desc: 'ブロックと見出しのTeX ラベルと参照を自動生成します。',
      },
      refCommand: {
        name: '参照コマンド',
        desc: '見出し/ブロックへのリンクを参照に変換する際に使用するコマンドです。',
      },
      numberedSections: {
        name: 'セクション番号付けを有効化',
        desc: '有効にすると\\section{...} として見出しを出力し、無効だと \\section*{...} として出力します。',
      },
      compressNewlines: {
        name: '改行を圧縮する',
        desc: '2行以上の空白行を1行にします。',
      },
      preamble: {
        name: '前方テンプレート',
        desc: 'エクスポートされたTeX ファイルの始まりに挿入するテキストです。{{key}} を使用してフロントマター変数を参照できます。',
      },
      postamble: {
        name: '後方テンプレート',
        desc: 'エクスポートされたTeX ファイルの終わりに挿入するテキストです。{{key}} を使用してフロントマター変数を参照できます。',
      },
      generateCaptions: {
        name: '画像と表のキャプションを生成する',
        desc: '画像と表のキャプションを生成します。有効にすると書き出し時に確認ダイアログが表示されます。',
      },
      figurePosition: {
        name: '図の位置指定子',
        desc: '（例：h, t, b, p, H）',
      },
      tablePosition: {
        name: '表の位置指定子',
        desc: '（例：h, t, b, p, H）',
      },
      askForFrontmatter: {
        name: '不足しているフロントマターを確認する',
        desc: 'エクスポート前に不足しているフロントマター項目を追加するかダイアログで確認します。',
      },
      askForCaptions: {
        name: '表/図のキャプションを確認する',
        desc: 'エクスポート前に表と図のキャプションをダイアログで入力させます。',
      },
      askForExportPath: {
        name: 'ファイル書き出しパスを選択する（デスクトップのみ）',
        desc: 'エクスポート時毎回書き出し先を選択します（デスクトップ のみ）。無効にすると Markdown と同じディレクトリに {ファイル名}_{日付}.tex で保存します。',
      },
      resetButton: 'デフォルトにリセット',
      resetConfirm: '設定をリセットしますか？',
    },
  },
};

/**
 * 言語設定を取得（Obsidian の言語設定に従う）
 */
export function getCurrentLanguage(): Language {
  // Obsidian のグローバル言語設定を参照
  const lang = (window as any).app?.vault?.adapter?.basePath || '';

  // ブラウザの言語設定を参照
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';

  if (browserLang.startsWith('ja')) {
    return 'ja';
  }

  return 'en';
}

/**
 * 翻訳文を取得
 */
export function t(
  key: string,
  language: Language = getCurrentLanguage(),
): string {
  const keys = key.split('.');
  let value: any = translations[language];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // フォールバック: 英語
      value = translations['en'];
      for (const k2 of keys) {
        value = value?.[k2];
      }
      return value ?? key;
    }
  }

  return value ?? key;
}
