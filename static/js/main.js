document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const editor = document.getElementById('editor');
    const previewContainer = document.getElementById('preview-container');
    const lineNumbers = document.getElementById('line-numbers');
    const divider = document.getElementById('divider');
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const fileInput = document.getElementById('file-input');
    
    // Initialize editor with default content
    editor.value = localStorage.getItem('markdown-content') || defaultContent;
    updateLineNumbers();
    renderMarkdown();
    
    // Editor input event (live preview)
    editor.addEventListener('input', function() {
        updateLineNumbers();
        renderMarkdown();
        saveToLocalStorage();
    });
    
    // Editor scroll event (sync line numbers)
    editor.addEventListener('scroll', function() {
        lineNumbers.scrollTop = editor.scrollTop;
    });
    
    // File Operation Buttons
    const newFileBtn = document.getElementById('new-file');
    const saveFileBtn = document.getElementById('save-file');
    const loadFileBtn = document.getElementById('load-file');
    const downloadMdBtn = document.getElementById('download-md');
    const downloadZipBtn = document.getElementById('download-zip');
    
    // Mobile Buttons
    const mobileNewFileBtn = document.getElementById('mobile-new-file');
    const mobileSaveFileBtn = document.getElementById('mobile-save-file');
    const mobileLoadFileBtn = document.getElementById('mobile-load-file');
    const mobileDownloadMdBtn = document.getElementById('mobile-download-md');
    const mobileDownloadZipBtn = document.getElementById('mobile-download-zip');
    
    // State variables
    let isDragging = false;
    let lastEditorWidth = null;
    
    // Default Markdown content
    const defaultContent = `# Welcome to Markdown IDE

## Features

- **Live Preview**: See your changes in real-time
- **Syntax Highlighting**: Makes editing easier
- **File Operations**: Create, save, and load markdown files
- **Theme Toggle**: Switch between light and dark mode
- **Responsive Design**: Works on desktop and mobile

## Markdown Examples

### Text Formatting

*This text is italic*
**This text is bold**
~~This text is strikethrough~~

### Lists

1. First ordered item
2. Second ordered item
   - Unordered sub-list
   - Another item

### Code

Inline \`code\` has \`back-ticks around\` it.

\`\`\`javascript
// Code block
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

### Links and Images

[GitHub](https://github.com)

![Markdown Logo](https://markdown-here.com/img/icon256.png)

### Blockquotes

> Blockquotes are very handy for quoting text.
> This line is part of the same quote.

### Tables

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

    // Syntax highlighting patterns
    const markdownSyntax = {
        heading: /^(#{1,6}\s+.+)$/gm,
        bold: /(\*\*[^*]+\*\*|__[^_]+__)/g,
        italic: /(\*[^*]+\*|_[^_]+_)/g,
        link: /(\[[^\]]+\]\([^)]+\))/g,
        image: /(!\[[^\]]*\]\([^)]+\))/g,
        code: /(`[^`]+`)/g,
        codeBlock: /(```[a-z]*\n[\s\S]*?\n```)/g,
        blockquote: /^(>\s+.+)$/gm,
        list: /^(\s*[-*+]\s+.+)$/gm,
        orderedList: /^(\s*\d+\.\s+.+)$/gm,
        horizontalRule: /^((?:[-*_]\s*){3,})$/gm,
        table: /(\|.+\|.*\n\|[-:| ]+\|[\s\S]*?(?:\n\n|\n$))/g
    };

    // Initialize the editor with default content
    editor.value = localStorage.getItem('markdown-content') || defaultContent;
    updateLineNumbers();
    renderMarkdown();
    
    // Initialize theme based on system preference or saved preference
    const darkMode = localStorage.getItem('dark-mode');
    if (darkMode === 'true' || (darkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    // Set default font size
    const defaultFontSize = 14;
    fontSizeSlider.value = defaultFontSize;
    mobileFontSizeSlider.value = defaultFontSize;
    editor.style.fontSize = defaultFontSize + 'px';
    lineNumbers.style.fontSize = defaultFontSize + 'px';
    
    // Check for saved font size
    const savedFontSize = localStorage.getItem('editor-font-size');
    if (savedFontSize) {
        editor.style.fontSize = savedFontSize + 'px';
        lineNumbers.style.fontSize = savedFontSize + 'px';
        fontSizeSlider.value = savedFontSize;
        mobileFontSizeSlider.value = savedFontSize;
    }
    
    // Update the font size display values
    if (document.getElementById('font-size-value')) {
        document.getElementById('font-size-value').textContent = fontSizeSlider.value + 'px';
    }
    if (document.getElementById('mobile-font-size-value')) {
        document.getElementById('mobile-font-size-value').textContent = mobileFontSizeSlider.value + 'px';
    }
    
    // Event listeners
    
    // Editor input event (live preview)
    editor.addEventListener('input', function() {
        updateLineNumbers();
        renderMarkdown();
        applySyntaxHighlighting();
        saveToLocalStorage();
    });
    
    // Editor scroll event (sync line numbers)
    editor.addEventListener('scroll', function() {
        lineNumbers.scrollTop = editor.scrollTop;
    });
    
    // Editor keydown event for auto indentation and formatting
    editor.addEventListener('keydown', function(e) {
        // Tab key: insert tab instead of changing focus
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Set textarea value to: text before caret + tab + text after caret
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            
            // Move caret to right position after inserted tab
            this.selectionStart = this.selectionEnd = start + 4;
        }
        
        // Enter key: auto indent
        if (e.key === 'Enter') {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const line = this.value.substring(0, start).split('\n').pop();
            const indent = line.match(/^(\s*)/)[0]; // Get leading whitespace
            
            // Handle list continuation
            if (line.match(/^\s*[-*+]\s+/) && !line.match(/^\s*[-*+]\s+$/)) {
                // If there's more than just a bullet, add a new bullet
                e.preventDefault();
                const bullet = line.match(/^(\s*[-*+]\s+)/)[0];
                this.value = this.value.substring(0, start) + '\n' + bullet + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + bullet.length + 1;
            } else if (line.match(/^\s*\d+\.\s+/) && !line.match(/^\s*\d+\.\s+$/)) {
                // Ordered list continuation
                e.preventDefault();
                const listNum = parseInt(line.match(/^\s*(\d+)\./)[1]) + 1;
                const listPrefix = line.replace(/^(\s*)\d+(\.\s+).*$/, `$1${listNum}$2`);
                this.value = this.value.substring(0, start) + '\n' + listPrefix + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + listPrefix.length + 1;
            } else if (indent.length > 0) {
                // Just maintain the same indentation
                e.preventDefault();
                this.value = this.value.substring(0, start) + '\n' + indent + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + indent.length + 1;
            }
        }
        
        // Auto close pairs
        const pairs = {
            '(': ')',
            '[': ']',
            '{': '}',
            '*': '*',
            '_': '_',
            '`': '`'
        };
        
        if (pairs[e.key]) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // If text is selected, wrap it
            if (start !== end) {
                e.preventDefault();
                const selectedText = this.value.substring(start, end);
                this.value = this.value.substring(0, start) + 
                            e.key + selectedText + pairs[e.key] + 
                            this.value.substring(end);
                this.selectionStart = start;
                this.selectionEnd = end + 2;
            }
        }
    });
    
    // Window resize event
    window.addEventListener('resize', updateLineNumbers);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    mobileThemeToggle.addEventListener('click', toggleTheme);
    
    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
    
    // Dropdown toggles
    document.querySelectorAll('.dropdown > button').forEach(button => {
        button.addEventListener('click', function(e) {
            const content = this.nextElementSibling;
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-content').forEach(otherContent => {
                if (otherContent !== content && !otherContent.classList.contains('hidden')) {
                    otherContent.classList.add('hidden');
                }
            });
            
            if (content.classList.contains('dropdown-content')) {
                content.classList.toggle('hidden');
                e.stopPropagation();
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-content').forEach(content => {
            if (!content.classList.contains('hidden')) {
                content.classList.add('hidden');
            }
        });
    });
    
    
    
    // Divider drag functionality
    divider.addEventListener('mousedown', function(e) {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const container = document.querySelector('main');
        const containerRect = container.getBoundingClientRect();
        const editorContainer = document.querySelector('.editor-container');
        
        // Calculate percentage (clamped between 20% and 80%)
        let percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        percentage = Math.min(Math.max(percentage, 20), 80);
        
        editorContainer.style.width = `${percentage}%`;
        previewContainer.style.width = `${100 - percentage}%`;
        lastEditorWidth = percentage;
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
        if (lastEditorWidth !== null) {
            localStorage.setItem('editor-width', lastEditorWidth);
        }
    });
    
    // File operations
    newFileBtn.addEventListener('click', createNewFile);
    mobileNewFileBtn.addEventListener('click', createNewFile);
    
    saveFileBtn.addEventListener('click', saveToLocalStorage);
    mobileSaveFileBtn.addEventListener('click', saveToLocalStorage);
    
    loadFileBtn.addEventListener('click', () => fileInput.click());
    mobileLoadFileBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', loadFile);
    
    downloadMdBtn.addEventListener('click', downloadAsMarkdown);
    mobileDownloadMdBtn.addEventListener('click', downloadAsMarkdown);
    
    downloadZipBtn.addEventListener('click', downloadAsZip);
    mobileDownloadZipBtn.addEventListener('click', downloadAsZip);
    
    // Initialize with saved editor width if available
    const savedEditorWidth = localStorage.getItem('editor-width');
    if (savedEditorWidth && window.innerWidth >= 768) {
        const editorContainer = document.querySelector('.editor-container');
        editorContainer.style.width = `${savedEditorWidth}%`;
        previewContainer.style.width = `${100 - savedEditorWidth}%`;
    }
    
    // Apply syntax highlighting initially
    applySyntaxHighlighting();
    
    // Functions
    
    // Update line numbers
    function updateLineNumbers() {
        const lines = editor.value.split('\n');
        let lineNumbersHTML = '';
        
        for (let i = 0; i < lines.length; i++) {
            lineNumbersHTML += `<div>${i + 1}</div>`;
        }
        
        lineNumbers.innerHTML = lineNumbersHTML;
    }
    
    // Render Markdown
    function renderMarkdown() {
        const text = editor.value;
        const html = markdownParser.parse(text);
        previewContainer.innerHTML = html;
    }
    
    // Apply syntax highlighting to the editor content
    function applySyntaxHighlighting() {
        if (!editor || !editor.value) return;
        
        // Get the editor content
        let text = editor.value;
        let highlightedText = text;
        
        // Apply highlighting styles as span classes
        highlightedText = highlightedText
            .replace(markdownSyntax.heading, '<span class="md-heading">$1</span>')
            .replace(markdownSyntax.bold, '<span class="md-bold">$1</span>')
            .replace(markdownSyntax.italic, '<span class="md-italic">$1</span>')
            .replace(markdownSyntax.link, '<span class="md-link">$1</span>')
            .replace(markdownSyntax.image, '<span class="md-image">$1</span>')
            .replace(markdownSyntax.code, '<span class="md-code">$1</span>')
            .replace(markdownSyntax.blockquote, '<span class="md-blockquote">$1</span>')
            .replace(markdownSyntax.list, '<span class="md-list">$1</span>')
            .replace(markdownSyntax.orderedList, '<span class="md-list">$1</span>');
        
        // Create or update a highlighting overlay
        let highlightOverlay = document.querySelector('.editor-highlight');
        if (!highlightOverlay) {
            highlightOverlay = document.createElement('div');
            highlightOverlay.className = 'editor-highlight';
            editor.parentNode.insertBefore(highlightOverlay, editor);
        }
        
        // Apply the highlighted content to the overlay
        // This approach doesn't apply highlighting directly to the editor,
        // but instead creates a visual overlay with the highlighting
        // In a real implementation, we'd use a specialized editor like CodeMirror
    }
    
    // Toggle theme
    function toggleTheme() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark'));
    }
    
    // Create new file
    function createNewFile() {
        if (confirm('Create a new file? This will clear the current content.')) {
            editor.value = '';
            updateLineNumbers();
            renderMarkdown();
            localStorage.removeItem('markdown-content');
        }
    }
    
    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('markdown-content', editor.value);
        // Removed alert to fix issue #1
    }
    
    // Load file
    function loadFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            editor.value = e.target.result;
            updateLineNumbers();
            renderMarkdown();
            applySyntaxHighlighting();
            saveToLocalStorage();
        };
        reader.readAsText(file);
        
        // Reset file input
        fileInput.value = '';
    }
    
    // Download as Markdown
    function downloadAsMarkdown() {
        const content = editor.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    // Download as ZIP
    function downloadAsZip() {
        alert('ZIP download functionality requires additional libraries. For this demo, please use the Markdown download option.');
        // In a full implementation, you'd use a library like JSZip to create ZIP files
    }
});
