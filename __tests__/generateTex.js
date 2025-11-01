const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Simple test to generate .tex from .md
// Read the markdown file
const mdPath = path.join(__dirname, '放射線_下書き.md');
const texPath = path.join(__dirname, '放射線_下書き.tex');

const mdContent = fs.readFileSync(mdPath, 'utf8');

// Extract frontmatter
const frontmatterMatch = mdContent.match(/^---\n([\s\S]*?)\n---\n/);
let frontmatter = {};
if (frontmatterMatch) {
  const fmLines = frontmatterMatch[1].split('\n');
  fmLines.forEach(line => {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  });
}

// Simple preamble
let preamble = `\\documentclass[paper=a4]{jlreq}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsthm}
\\usepackage{amsfonts}
\\usepackage{mathtools}
\\usepackage{graphicx}
\\usepackage{multirow}
\\usepackage{hyperref}
\\usepackage{diffcoeff}
\\usepackage{comment}
\\usepackage{mhchem}
\\usepackage[separate-uncertainty]{siunitx}
\\usepackage[math-style=ISO,warnings-off={mathtools-colon,mathtools-overbracket}]{unicode-math}
\\usepackage{newunicodechar}
\\usepackage{listings}
\\usepackage{float}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\\newunicodechar{、}{，}
\\newunicodechar{。}{．}
\\NewDocumentCommand\\、{}{{\\char"3001}}
\\NewDocumentCommand\\。{}{{\\char"3002}}
\\NewDocumentCommand\\degC{}{\\ensuremath{^\\circ\\symup{C}}}
\\NewDocumentCommand\\abs{m}{\\left|#1\\right|}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\\jlreqsetup{
    appendix_counter={
        section={
            value=0,
            the={\\Alph{section}}
        },
        table={
            value=0,
            the={\\Alph{section}\\arabic{table}}
        },
        figure={
            value=0,
            the={\\Alph{section}\\arabic{figure}}
        }
    },
    appendix_heading={
        section={
            label_format={付録\\thesection:}
        }
    }
}

\\title{${frontmatter.title || 'Untitled'}}
\\author{${frontmatter.affiliation || ''} \\\\ ${frontmatter.student_id || ''} ${frontmatter.name || ''}}
\\date{${frontmatter.date || ''}}

\\begin{document}
\\maketitle
`;

// Remove frontmatter from content
let body = mdContent.replace(/^---\n[\s\S]*?\n---\n/, '');

// Simple markdown to tex conversion (very basic)
body = body.replace(/^# (.+)$/gm, '\\section{$1}');
body = body.replace(/^## (.+)$/gm, '\\subsection{$1}');
body = body.replace(/^### (.+)$/gm, '\\subsubsection{$1}');
body = body.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
body = body.replace(/\*(.+?)\*/g, '\\textit{$1}');
body = body.replace(/`(.+?)`/g, '\\texttt{$1}');
body = body.replace(/!\[(.+?)\]\((.+?)\)/g, '\\begin{figure}[H]\n\\centering\n\\includegraphics{$2}\n\\caption{$1}\n\\end{figure}');
body = body.replace(/\[(.+?)\]\((.+?)\)/g, '\\href{$2}{$1}');

// Add a test figure
// body += '\n\\begin{figure}[H]\n\\centering\n\\includegraphics{test.png}\n\\caption{Test figure}\n\\end{figure}\n';

// Math blocks
body = body.replace(/\$\$([\s\S]+?)\$\$/g, '$$\n$1\n$$');

// Inline math
// Already in $

// Greek letters (basic)
body = body.replace(/α/g, '\\alpha');
body = body.replace(/β/g, '\\beta');
body = body.replace(/γ/g, '\\gamma');
// Add more if needed

const texContent = preamble + body + '\n\\end{document}';

fs.writeFileSync(texPath, texContent, 'utf8');

console.log('Generated .tex file at', texPath);

// Try to compile with lualatex
exec(`lualatex --interaction=nonstopmode ${texPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error('Compilation failed:', error.message);
    console.error('stdout:', stdout);
    console.error('stderr:', stderr);
  } else {
    console.log('Compilation successful');
    console.log('stdout:', stdout);
  }
});