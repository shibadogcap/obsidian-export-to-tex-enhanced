import { App, Modal, Setting, TextComponent } from 'obsidian';
import { getCurrentLanguage, translations } from '../i18n/translations';

export interface FrontmatterData {
  [key: string]: string;
}

export interface FrontmatterModalResult {
  data: FrontmatterData;
  saveToMarkdown: boolean;
}

/**
 * フロントマター確認モーダル
 * テンプレートキーと既存フロントマターをユーザーに入力・編集させる
 */
export class FrontmatterCheckModal extends Modal {
  private allFields: Array<{
    key: string;
    label: string;
    placeholder: string;
    value: string;
  }> = [];
  private inputValues: FrontmatterData = {};
  private saveToMarkdown: boolean = false; // ファイル保存フラグ
  private resolve: (data: FrontmatterModalResult | null) => void;
  private templateKeys: string[] = []; // テンプレートから抽出したキー

  constructor(
    app: App,
    currentFrontmatter: any,
    resolve: (data: FrontmatterModalResult | null) => void,
    templateKeys?: string[], // テンプレートキーをオプションで受け取る
  ) {
    super(app);
    this.resolve = resolve;
    this.templateKeys = templateKeys || [];

    // テンプレートキーと標準フィールドを組み合わせてフィールドを構築
    const fieldsToShow = this.buildFieldsToShow(currentFrontmatter);
    this.allFields = fieldsToShow;

    for (const field of this.allFields) {
      this.inputValues[field.key] = field.value;
    }
  }

  /**
   * テンプレートキーと既存フロントマターのキーを組み合わせて表示するフィールドを決定
   */
  private buildFieldsToShow(
    currentFrontmatter: any,
  ): Array<{ key: string; label: string; placeholder: string; value: string }> {
    const fields: Array<{
      key: string;
      label: string;
      placeholder: string;
      value: string;
    }> = [];
    const addedKeys = new Set<string>();

    // テンプレートキーがあれば、それを優先して追加
    if (this.templateKeys.length > 0) {
      for (const key of this.templateKeys) {
        const value = currentFrontmatter[key] || '';
        fields.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1), // キーを自動生成ラベルに
          placeholder: `Enter ${key}`,
          value: String(value),
        });
        addedKeys.add(key);
      }
    }

    // フロントマターに存在するキーがあれば追加
    for (const key in currentFrontmatter) {
      if (!addedKeys.has(key) && currentFrontmatter[key]) {
        fields.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          placeholder: `Enter ${key}`,
          value: String(currentFrontmatter[key]),
        });
        addedKeys.add(key);
      }
    }

    return fields;
  }

  onOpen() {
    const { contentEl } = this;
    const lang = getCurrentLanguage();

    contentEl.createEl('h2', { text: 'Edit Frontmatter Fields' });
    contentEl.createEl('p', {
      text: `Update or add frontmatter fields:`,
    });

    // すべてのフィールドの入力フォームを作成
    for (const field of this.allFields) {
      let inputEl: TextComponent;

      new Setting(contentEl).setName(field.label).addText((text) => {
        inputEl = text
          .setPlaceholder(field.placeholder)
          .setValue(field.value)
          .onChange((value) => {
            this.inputValues[field.key] = value;
          });
      });
    }

    // Markdown ファイルに保存するかのチェックボックス
    new Setting(contentEl)
      .setName('Save to Markdown file')
      .setDesc('Update the frontmatter in the Markdown file')
      .addToggle((toggle) => {
        toggle.setValue(this.saveToMarkdown).onChange((value) => {
          this.saveToMarkdown = value;
        });
      });

    // ボタン
    contentEl.createEl('div', { attr: { style: 'margin-top: 20px;' } });

    const buttonContainer = contentEl.createEl('div', {
      attr: { style: 'display: flex; gap: 10px; justify-content: flex-end;' },
    });

    const submitBtn = buttonContainer.createEl('button', {
      text: 'OK',
      attr: { style: 'padding: 8px 16px; cursor: pointer;' },
    });
    submitBtn.addEventListener('click', () => {
      this.close();
      this.resolve({
        data: this.inputValues,
        saveToMarkdown: this.saveToMarkdown,
      });
    });

    const cancelBtn = buttonContainer.createEl('button', {
      text: 'Cancel',
      attr: { style: 'padding: 8px 16px; cursor: pointer;' },
    });
    cancelBtn.addEventListener('click', () => {
      this.close();
      this.resolve(null);
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
