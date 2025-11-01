import { Visitor } from '../src/compile/visitor';
import { ExportToTexSettings } from '../src/plugin/settings';
import { VFile } from 'vfile';
import { Table, TableRow, TableCell, Text } from 'mdast';

describe('Visitor', () => {
  let settings: ExportToTexSettings;
  let file: VFile;

  beforeEach(() => {
    settings = new ExportToTexSettings();
    file = new VFile();
  });

  describe('visitTable', () => {
    it('should handle table with cell containing newline', () => {
      const table: Table = {
        type: 'table',
        children: [
          {
            type: 'tableRow',
            children: [
              {
                type: 'tableCell',
                children: [{ type: 'text', value: 'Cell 1\nwith newline' }],
              },
              {
                type: 'tableCell',
                children: [{ type: 'text', value: 'Cell 2' }],
              },
            ],
          },
        ],
      };

      const visitor = new Visitor(settings, file);
      visitor.visit(table);
      const output = visitor.toString();

      // 改行がスペースに置き換えられていることを確認
      expect(output).toContain('Cell 1 with newline');
      expect(output).not.toContain('Cell 1\nwith newline');
    });

    it('should handle large table', () => {
      const rows: TableRow[] = [];
      for (let i = 0; i < 100; i++) {
        const cells: TableCell[] = [];
        for (let j = 0; j < 10; j++) {
          cells.push({
            type: 'tableCell',
            children: [{ type: 'text', value: `Cell ${i}-${j}` }],
          });
        }
        rows.push({
          type: 'tableRow',
          children: cells,
        });
      }

      const table: Table = {
        type: 'table',
        children: rows,
      };

      const visitor = new Visitor(settings, file);
      visitor.visit(table);
      const output = visitor.toString();

      // 大きな表が処理されることを確認
      expect(output).toContain('\\begin{longtable}[c]');
      expect(output).toContain('\\end{longtable}');
      expect(output).toContain('Cell 0-0');
      expect(output).toContain('Cell 99-9');
    });
  });
});
