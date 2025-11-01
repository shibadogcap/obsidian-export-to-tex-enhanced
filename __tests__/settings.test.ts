import { ensureSettings } from '../src/plugin/settings';

describe('ensureRequiredPackages', () => {
  test('should add missing packages to old preamble', () => {
    const oldPreamble = `\\documentclass[paper=a4]{jlreq}
\\usepackage{amsmath}
\\usepackage{graphicx}
%% Old template without float, lscape, adjustbox, tabularx, booktabs

\\begin{document}
`;

    const settings = ensureSettings({
      defaultExportDirectory: '/tmp',
      preamble: oldPreamble,
    });

    // Check that required packages were added
    expect(settings.preamble).toContain('\\usepackage{float}');
    expect(settings.preamble).toContain('\\usepackage{lscape}');
    expect(settings.preamble).toContain('\\usepackage{adjustbox}');
    expect(settings.preamble).toContain('\\usepackage{tabularx}');
    expect(settings.preamble).toContain('\\usepackage{booktabs}');
  });

  test('should not duplicate packages that already exist', () => {
    const preamble = `\\documentclass[paper=a4]{jlreq}
\\usepackage{amsmath}
\\usepackage{float}
\\usepackage{adjustbox}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{lscape}

\\begin{document}
`;

    const settings = ensureSettings({
      defaultExportDirectory: '/tmp',
      preamble,
    });

    // Count occurrences - should be same as input
    const floatCount = (settings.preamble.match(/\\usepackage\{float\}/g) || [])
      .length;
    const lscapeCount = (
      settings.preamble.match(/\\usepackage\{lscape\}/g) || []
    ).length;

    expect(floatCount).toBe(1);
    expect(lscapeCount).toBe(1);
  });

  test('should handle packages with options', () => {
    const preamble = `\\documentclass[paper=a4]{jlreq}
\\usepackage[separate-uncertainty]{siunitx}
\\usepackage[utf8]{inputenc}

\\begin{document}
`;

    const settings = ensureSettings({
      defaultExportDirectory: '/tmp',
      preamble,
    });

    // Required packages should be added
    expect(settings.preamble).toContain('\\usepackage{float}');
    expect(settings.preamble).toContain('\\usepackage{lscape}');
    expect(settings.preamble).toContain('\\usepackage{adjustbox}');

    // Existing packages with options should remain unchanged
    expect(settings.preamble).toContain(
      '\\usepackage[separate-uncertainty]{siunitx}',
    );
  });

  test('should add auto-added comment when packages are added', () => {
    const oldPreamble = `\\documentclass[paper=a4]{jlreq}
\\usepackage{amsmath}

\\begin{document}
`;

    const settings = ensureSettings({
      defaultExportDirectory: '/tmp',
      preamble: oldPreamble,
    });

    // Should have a comment line indicating auto-added packages
    expect(settings.preamble).toContain('Auto-added required packages:');
  });

  test('should handle completely empty preamble', () => {
    const settings = ensureSettings({
      defaultExportDirectory: '/tmp',
      preamble: '',
    });

    // Default preamble should be used when empty
    expect(settings.preamble).toContain('\\documentclass');
    expect(settings.preamble).toContain('\\usepackage{float}');
    expect(settings.preamble).toContain('\\usepackage{lscape}');
  });
});
