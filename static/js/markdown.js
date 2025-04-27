/**
 * Enhanced Markdown parser
 * This is a lightweight parser for basic Markdown syntax with improved formatting
 */
class MarkdownParser {
    constructor() {
        // Regular expressions for Markdown syntax
        this.rules = [
            // Headers
            { pattern: /^#{1,6}\s+(.*?)$/gm, replace: this.headerReplacer },
            // Bold
            { pattern: /\*\*(.*?)\*\*/g, replace: '<strong>$1</strong>' },
            { pattern: /__([^_]+)__/g, replace: '<strong>$1</strong>' },
            // Italic
            { pattern: /\*([^\*]+)\*/g, replace: '<em>$1</em>' },
            { pattern: /_([^_]+)_/g, replace: '<em>$1</em>' },
            // Strikethrough
            { pattern: /~~(.*?)~~/g, replace: '<del>$1</del>' },
            // Code blocks with language
            { pattern: /```([a-z]*)\n([\s\S]*?)\n```/g, replace: '<pre><code class="language-$1">$2</code></pre>' },
            // Code blocks without language
            { pattern: /```\n([\s\S]*?)\n```/g, replace: '<pre><code>$1</code></pre>' },
            // Inline code
            { pattern: /`([^`]+)`/g, replace: '<code>$1</code>' },
            // Blockquotes
            { pattern: /^>\s+(.*?)$/gm, replace: '<blockquote>$1</blockquote>' },
            // Unordered lists
            { pattern: /^[\*\-\+]\s+(.*?)$/gm, replace: this.listReplacer },
            // Ordered lists
            { pattern: /^\d+\.\s+(.*?)$/gm, replace: this.orderedListReplacer },
            // Horizontal rule
            { pattern: /^(?:[-*_]\s*){3,}$/gm, replace: '<hr>' },
            // Links
            { pattern: /\[(.*?)\]\((.*?)\)/g, replace: '<a href="$2" target="_blank">$1</a>' },
            // Images
            { pattern: /!\[(.*?)\]\((.*?)\)/g, replace: '<img src="$2" alt="$1">' },
            // Paragraphs
            { pattern: /^(?!<[a-z][a-z0-9]*>)(.+)$/gm, replace: this.paragraphReplacer },
            // Tables
            { pattern: /^\|(.+)\|$/gm, replace: this.tableReplacer },
            // Line breaks
            { pattern: /  $/gm, replace: '<br>' }
        ];
    }

    headerReplacer(match, p1, offset, string) {
        const level = match.trim().indexOf(' ');
        return `<h${level}>${p1}</h${level}>`;
    }

    paragraphReplacer(match, p1) {
        // Don't wrap lines that are part of other elements
        if (
            /^<\/?(h[1-6]|ul|ol|li|blockquote|pre|table|tr|th|td)/.test(p1) ||
            p1.trim() === ""
        ) {
            return p1;
        }
        return `<p>${p1}</p>`;
    }

    listReplacer(match, p1) {
        return `<li>${p1}</li>`;
    }

    orderedListReplacer(match, p1) {
        return `<li>${p1}</li>`;
    }

    tableReplacer(match, p1) {
        const cells = p1.split('|').map(cell => cell.trim());
        const isHeader = cells.every(cell => cell.startsWith('-') && cell.endsWith('-'));
        
        if (isHeader) {
            return '';
        }
        
        const cellTag = match.trim().startsWith('|--') ? 'th' : 'td';
        return `<tr>${cells.map(cell => `<${cellTag}>${cell}</${cellTag}>`).join('')}</tr>`;
    }

    // Process the Markdown text
    parse(text) {
        if (!text) return '';
        
        // Pre-process to handle lists and tables
        text = this.preprocessLists(text);
        text = this.preprocessTables(text);
        
        // Process code blocks first to prevent interference
        text = text.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Process inline code
        text = text.replace(/`([^`]+)`/g, (match, code) => {
            return `<code>${this.escapeHtml(code)}</code>`;
        });
        
        // Handle images with proper rendering
        text = text.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
            if (url.endsWith('.svg')) {
                return `<img src="${url}" alt="${alt}" class="inline-svg">`;
            }
            return `<img src="${url}" alt="${alt}" class="content-image">`;
        });
        
        // Apply remaining rules
        this.rules.forEach(rule => {
            if (!rule.pattern.toString().includes('```') && 
                !rule.pattern.toString().includes('`') && 
                !rule.pattern.toString().includes('!\\[')) {
                text = text.replace(rule.pattern, rule.replace);
            }
        });
        
        return text;
    }
    
    escapeHtml(text) {
        const htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => htmlEntities[char]);
    }
    
    postProcessProfileLayout(text) {
        // Check if this looks like a profile README
        if (text.includes('Hi, I\'m Deo aka Chai') || text.includes('GitHub Stats')) {
            
            // Wrap social buttons in a container for horizontal display
            const socialButtonsRegex = /<a href="[^"]*" target="_blank">([^<]*FACEBOOK[^<]*)<\/a>[\s\n]*<a href="[^"]*" target="_blank">([^<]*LINKEDIN[^<]*)<\/a>[\s\n]*<a href="[^"]*" target="_blank">([^<]*INSTAGRAM[^<]*)<\/a>/;
            text = text.replace(socialButtonsRegex, '<div class="social-buttons"><a href="#" target="_blank">$1</a><a href="#" target="_blank">$2</a><a href="#" target="_blank">$3</a></div>');
            
            // Group all badges/labels into a container for horizontal display
            const badgeLineRegex = /<p>(.*College Student.*Aspiring Front-End Developer.*Graphic Designer.*)<\/p>/;
            text = text.replace(badgeLineRegex, '<div class="badge-line">$1</div>');
            
            // Format Stats section to display cards in a row
            const statsRegex = /<h2>Stats<\/h2>[\s\S]*?<ul>([\s\S]*?)<\/ul>/g;
            const topLanguagesRegex = /<h2>Top Languages by Repo<\/h2>[\s\S]*?<ul>([\s\S]*?)<\/ul>/g;
            
            let matches = text.match(statsRegex);
            if (matches) {
                // Extract the stats section
                let statsSection = matches[0];
                // Create the stats card with the content
                let statsReplacement = statsSection.replace(/<h2>Stats<\/h2>[\s\S]*?<ul>([\s\S]*?)<\/ul>/, 
                    '<h2>Stats</h2><div class="stats-row"><div class="stats-card"><ul>$1</ul></div>');
                
                // If there's a Top Languages section, add it as a second card
                let topLanguagesMatch = text.match(topLanguagesRegex);
                if (topLanguagesMatch) {
                    let topLanguagesSection = topLanguagesMatch[0];
                    let content = topLanguagesSection.match(/<ul>([\s\S]*?)<\/ul>/)[1];
                    statsReplacement = statsReplacement.replace('</div>', '</div><div class="stats-card"><h2>Top Languages by Repo</h2><ul>' + content + '</ul></div>');
                }
                
                statsReplacement += '</div>'; // Close the stats-row div
                
                // Replace the stats section in the text
                text = text.replace(statsRegex, statsReplacement);
                
                // Remove the Top Languages section if it exists since we already included it
                if (topLanguagesMatch) {
                    text = text.replace(topLanguagesRegex, '');
                }
            }
        }
        
        return text;
    }
    
    preprocessLists(text) {
        // Group list items and handle nested lists better
        let inList = false;
        let listType = '';
        let listIndentation = 0;
        let result = '';
        let lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(/^(\s*)[\*\-\+]\s+/);
            const orderedMatch = line.match(/^(\s*)\d+\.\s+/);
            
            if (unorderedMatch || orderedMatch) {
                const indentation = unorderedMatch ? unorderedMatch[1].length : (orderedMatch ? orderedMatch[1].length : 0);
                const newListType = unorderedMatch ? 'ul' : 'ol';
                
                if (!inList) {
                    // Starting a new list
                    result += `<${newListType}>\n`;
                    inList = true;
                    listType = newListType;
                    listIndentation = indentation;
                } else if (indentation > listIndentation) {
                    // Nested list
                    result += `<${newListType}>\n`;
                    listIndentation = indentation;
                    listType = newListType;
                } else if (indentation < listIndentation) {
                    // End of nested list
                    result += `</${listType}>\n`;
                    listIndentation = indentation;
                    listType = newListType;
                } else if (listType !== newListType) {
                    // Switching list types at same level
                    result += `</${listType}>\n<${newListType}>\n`;
                    listType = newListType;
                }
                
                result += line + '\n';
            } else {
                if (inList) {
                    result += `</${listType}>\n`;
                    inList = false;
                }
                result += line + '\n';
            }
        }
        
        if (inList) {
            result += `</${listType}>\n`;
        }
        
        return result;
    }
    
    preprocessTables(text) {
        // Process tables with better formatting
        const lines = text.split('\n');
        let inTable = false;
        let result = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    result.push('<table>');
                    inTable = true;
                    
                    // Check if next line is a separator
                    if (i + 1 < lines.length && lines[i + 1].includes('|-')) {
                        result.push('<thead>');
                        result.push('<tr>');
                        
                        // Process header cells
                        const headerCells = line.substring(1, line.length - 1).split('|');
                        headerCells.forEach(cell => {
                            result.push(`<th>${cell.trim()}</th>`);
                        });
                        
                        result.push('</tr>');
                        result.push('</thead>');
                        result.push('<tbody>');
                        i++; // Skip the separator line
                    } else {
                        result.push('<tbody>');
                        
                        // Process regular cells if no header
                        const cells = line.substring(1, line.length - 1).split('|');
                        result.push('<tr>');
                        cells.forEach(cell => {
                            result.push(`<td>${cell.trim()}</td>`);
                        });
                        result.push('</tr>');
                    }
                } else {
                    // Process regular row cells
                    const cells = line.substring(1, line.length - 1).split('|');
                    result.push('<tr>');
                    cells.forEach(cell => {
                        result.push(`<td>${cell.trim()}</td>`);
                    });
                    result.push('</tr>');
                }
            } else if (inTable) {
                // End of table
                result.push('</tbody>');
                result.push('</table>');
                inTable = false;
                result.push(lines[i]);
            } else {
                result.push(lines[i]);
            }
        }
        
        if (inTable) {
            result.push('</tbody>');
            result.push('</table>');
        }
        
        return result.join('\n');
    }
}

// Export the parser
const markdownParser = new MarkdownParser();
