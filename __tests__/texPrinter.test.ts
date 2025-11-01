import { TeXPrinter } from '../src/texPrinter';
import { ExportToTexSettings } from '../src/plugin/settings';
import { ObsidianVFile } from '../src/file';
import { App, TFile } from 'obsidian';

// Mock Obsidian App
const mockApp = {
  metadataCache: {
    getFileCache: jest.fn(),
  },
  vault: {
    getAbstractFileByPath: jest.fn(),
  },
} as any;

describe('TeXPrinter', () => {
  let settings: ExportToTexSettings;
  let printer: TeXPrinter;

  beforeEach(() => {
    settings = new ExportToTexSettings();
    printer = new TeXPrinter(mockApp, settings);
  });

  it('should process a markdown file with frontmatter', async () => {
    // Mock file
    const mockFile = {
      path: '__tests__/放射線_下書き.md',
      value: `---
title: "Test Title"
author: "Test Author"
date: "2024-10-24"
---
# Test Heading

Some content with math: $E = mc^2$

And Greek: α β γ`,
    } as ObsidianVFile;

    // Mock frontmatter
    mockApp.metadataCache.getFileCache.mockReturnValue({
      frontmatter: {
        title: 'Test Title',
        author: 'Test Author',
        date: '2024-10-24',
      },
    });

    mockApp.vault.getAbstractFileByPath.mockReturnValue({} as TFile);

    const result = await printer.toTex(mockFile);

    expect(result).toContain('\\documentclass');
    expect(result).toContain('\\title{Test Title}');
    expect(result).toContain('\\author{Test Author}');
    expect(result).toContain('\\date{2024-10-24}');
    expect(result).toContain('\\maketitle');
    expect(result).toContain('Test Heading');
    expect(result).toContain('$E = mc^2$');
  });
});
