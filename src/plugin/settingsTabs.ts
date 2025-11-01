import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
import { ExportToTexSettings, ImagePathSettings } from './settings';
import ExportToTeXPlugin from '../main';
import { getCurrentLanguage, translations } from '../i18n/translations';

export class ExportToTeXSettingTab extends PluginSettingTab {
  constructor(app: App, readonly plugin: ExportToTeXPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const lang = getCurrentLanguage();
    const t = (key: string) => {
      const keys = key.split('.');
      let value: any = translations[lang].settings;
      for (const k of keys) {
        value = value?.[k];
      }
      return value ?? key;
    };

    containerEl.empty();

    containerEl.createEl('h2', { text: t('title') });

    new Setting(containerEl)
      .setName(t('generateLabels.name'))
      .setDesc(t('generateLabels.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.generateLabels)
          .onChange(async (value) => {
            this.plugin.settings.generateLabels = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('refCommand.name'))
      .setDesc(t('refCommand.desc'))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.refCommand)
          .onChange(async (value) => {
            this.plugin.settings.refCommand = value;
            await this.plugin.saveData(this.plugin.settings);
          }),
      );

    new Setting(containerEl)
      .setName(t('numberedSections.name'))
      .setDesc(t('numberedSections.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.numberedSections)
          .onChange(async (value) => {
            this.plugin.settings.numberedSections = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('compressNewlines.name'))
      .setDesc(t('compressNewlines.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.compressNewlines)
          .onChange(async (value) => {
            this.plugin.settings.compressNewlines = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('preamble.name'))
      .setDesc(t('preamble.desc'))
      .addTextArea((text) => {
        text.setValue(this.plugin.settings.preamble).onChange(async (value) => {
          this.plugin.settings.preamble = value;
          await this.plugin.saveData(this.plugin.settings);
        });
        // テキストエリアを大きくするためのスタイル設定
        text.inputEl.style.height = '400px';
        text.inputEl.style.fontFamily = 'monospace';
        text.inputEl.style.fontSize = '12px';
      });

    new Setting(containerEl)
      .setName(t('postamble.name'))
      .setDesc(t('postamble.desc'))
      .addTextArea((text) => {
        text
          .setValue(this.plugin.settings.postamble)
          .onChange(async (value) => {
            this.plugin.settings.postamble = value;
            await this.plugin.saveData(this.plugin.settings);
          });
        // テキストエリアを大きくするためのスタイル設定
        text.inputEl.style.height = '200px';
        text.inputEl.style.fontFamily = 'monospace';
        text.inputEl.style.fontSize = '12px';
      });

    new Setting(containerEl)
      .setName(t('generateCaptions.name'))
      .setDesc(t('generateCaptions.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.generateCaptions)
          .onChange(async (value) => {
            this.plugin.settings.generateCaptions = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('figurePosition.name'))
      .setDesc(t('figurePosition.desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.figurePosition);
        text.onChange(async (value) => {
          this.plugin.settings.figurePosition = value;
          await this.plugin.saveData(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName(t('tablePosition.name'))
      .setDesc(t('tablePosition.desc'))
      .addText((text) => {
        text.setValue(this.plugin.settings.tablePosition);
        text.onChange(async (value) => {
          this.plugin.settings.tablePosition = value;
          await this.plugin.saveData(this.plugin.settings);
        });
      });

    new Setting(containerEl)
      .setName(t('askForFrontmatter.name'))
      .setDesc(t('askForFrontmatter.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.askForFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.askForFrontmatter = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('askForCaptions.name'))
      .setDesc(t('askForCaptions.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.askForCaptions)
          .onChange(async (value) => {
            this.plugin.settings.askForCaptions = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new Setting(containerEl)
      .setName(t('askForExportPath.name'))
      .setDesc(t('askForExportPath.desc'))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.askForExportPath)
          .onChange(async (value) => {
            this.plugin.settings.askForExportPath = value;
            await this.plugin.saveData(this.plugin.settings);
          });
      });

    new ButtonComponent(containerEl)
      .setButtonText(t('resetButton'))
      .onClick(async () => {
        if (!window.confirm(t('resetConfirm'))) return;
        this.plugin.settings = new ExportToTexSettings();
        await this.plugin.saveData(this.plugin.settings);
        this.display();
      });
  }
}
