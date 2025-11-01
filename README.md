# obsidian-export-to-tex-enhanced

[![日本語](https://img.shields.io/badge/日本語-README.ja.md-blue?style=flat-square)](README.ja.md)

[![](https://img.shields.io/github/v/release/shibadogcap/obsidian-export-to-tex-enhanced?style=for-the-badge)](https://github.com/shibadogcap/obsidian-export-to-tex-enhanced/releases/latest)
![](https://img.shields.io/github/commits-since/shibadogcap/obsidian-export-to-tex-enhanced/latest?style=for-the-badge)
![](https://img.shields.io/github/manifest-json/minAppVersion/shibadogcap/obsidian-export-to-tex-enhanced?color=red&label=Min%20Obsidian%20Version&style=for-the-badge)
![](https://img.shields.io/github/downloads/shibadogcap/obsidian-export-to-tex-enhanced/total?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#license)

> Export to obsidian notes to LaTeX format, suitable for pasting into a TeX file.

## About This Plugin

This is an enhanced fork of the original [obsidian-export-to-tex](https://github.com/raineszm/obsidian-export-to-tex) plugin by Zach Raines.

### ✨ Enhanced Features
- 🇯🇵 **Japanese Localization**: Complete Japanese UI support
- 📊 **Advanced Table Rendering**: Smart border detection for summary rows
- 🎯 **Intelligent Table Processing**: Automatic longtable support and vertical line removal
- 🖼️ **Enhanced Image Handling**: Improved image path resolution
- 📝 **Modal-based Workflows**: User-friendly export configuration dialogs

![](https://raw.githubusercontent.com/raineszm/obsidian-export-to-tex/master/images/export-to-clipboard.gif)

## Installation

> **Note**: This plugin is not yet available in the Obsidian Community Plugins. You must install it manually.

If you have Obsidian version 0.9.8 or greater:

### Manual Installation
To manually install:
1. Download the latest `zip` from the [latest GitHub Release](https://github.com/shibadogcap/obsidian-export-to-tex-enhanced/releases/latest)
2. Unzip the contents into the `.plugins/obsidian-export-to-tex-enhanced` subdirectory of your vault
3. Reload Obsidian
4. Go into settings > third party plugins and activate `obsidian-export-to-tex-enhanced`

For details see [the forums](https://forum.obsidian.md/t/plugins-mini-faq/7737).

## Usage

This plugin allows Obsidian files to exported to TeX format.
When doing so:
- WikiLinks to other files are stripped
- Embeds are resolved
- By default, headings and blocks are associated with labels


### Commands
Export to TeX provides two commands

#### Export to TeX

This command will produce a save as dialog. The contents of the current file will be converted to TeX and saved to that file.

#### Export to Clipboard

The contents of the current file will be converted to TeX and copied to the clipboard.

### Settings

### Generate labels and refs

**Default: true**

By default, Export to TeX will auto generate labels for headings and blocks.
Links to these from within the same file will be converted to `\ref` calls.

### Ref command

**Default: '\cref'**

The command to use for generating refs: defaults to `\cref`.

### Additional math environments

**Default: []**

Export to TeX will by default strip the surrounding displaymath delimeters from toplevel math environments such as `equation`.
If there are other environments you which to do this for, they can be added to this list.

### Settings

#### Generate Captions
**Default: true**

Automatically generate captions for tables and figures in the exported LaTeX.

#### Figure Position
**Default: 'h'**

LaTeX positioning parameter for figures. Common values:
- `h`: Here (preferred position)
- `t`: Top of page
- `b`: Bottom of page
- `p`: Separate page for floats
- `H`: Exactly here (requires float package)

#### Table Position
**Default: 'H'**

LaTeX positioning parameter for tables. Same options as figure position.

#### Generate Labels and Refs
**Default: true**

Automatically generate labels for headings and blocks. Links within the same file will be converted to `\ref` calls.

#### Ref Command
**Default: 'cref'**

The LaTeX command to use for cross-references. Defaults to `\cref` (requires cleveref package).

#### Additional Math Environments
**Default: []**

By default, display math delimiters are stripped from top-level math environments like `equation`. Add other environments to this list if you want the same treatment.

#### Default to Equation
**Default: false**

By default, display math environments

```
$$
x^2
$$
```
will be exported as display math
```latex
\[
x^2
\]
```

With this option enabled, they will instead be exported as equation environments:

```latex
\begin{equation}
x^2
\end{equation}
```

#### Compress Newlines
**Default: false**

When enabled, multiple consecutive newlines in the markdown will be compressed to a single newline in the LaTeX output.

#### Image Path Settings
**Default: Relative to Root**

Controls how image paths are handled in the exported LaTeX:
- **Relative to Root**: Paths relative to vault root
- **Full Path**: Absolute file system paths
- **Base Name**: Just the filename
- **Relative to Export**: Relative to export location

#### Numbered Sections
**Default: true**

Whether to number sections, subsections, etc. in the exported LaTeX.



## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

