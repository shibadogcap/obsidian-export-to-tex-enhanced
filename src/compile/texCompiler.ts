import { Processor } from 'unified';
import { Visitor } from './visitor';
import { TexContext } from '../data';

export function texCompiler(this: Processor): void {
  this.Compiler = (tree, file) => {
    const settings = this.data('settings') as TexContext;
    const visitor = new Visitor(settings.exportToTex, file);
    visitor.visit(tree);

    // Visitor の情報を file に格納（後で export 処理から参照可能に）
    if (!file.data) {
      file.data = {};
    }
    (file.data as any).visitor = visitor;

    return visitor.toString();
  };
}
