const fs = require('fs');
const content = fs.readFileSync('d:/Downloads/token/queue-system/src/pages/Queue.jsx', 'utf8');

function checkBalance(text) {
    let openTags = [];
    let regex = /<(\/?[a-zA-Z0-9\.]+)([^>]*)>/g;
    let match;
    let line = 1;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        let tag = match[1];
        let fullMatch = match[0];
        
        // Count lines
        let segment = text.substring(lastIndex, match.index);
        line += (segment.match(/\n/g) || []).length;
        lastIndex = match.index;

        if (fullMatch.endsWith('/>')) continue; // Self-closing

        if (tag.startsWith('/')) {
            let tagName = tag.substring(1);
            if (openTags.length === 0) {
                console.log(`Error: Unexpected closing tag </${tagName}> at line ${line}`);
            } else {
                let lastOpen = openTags.pop();
                if (lastOpen.name !== tagName) {
                    console.log(`Error: Tag mismatch. Expected </${lastOpen.name}> but found </${tagName}> at line ${line}. Opening tag was at line ${lastOpen.line}`);
                }
            }
        } else {
            openTags.push({ name: tag, line: line });
        }
    }

    if (openTags.length > 0) {
        openTags.forEach(t => {
            console.log(`Error: Unterminated tag <${t.name}> opened at line ${t.line}`);
        });
    } else {
        console.log('All tags are balanced.');
    }

    // Check braces
    let braces = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') braces++;
        if (text[i] === '}') braces--;
    }
    console.log(`Brace balance: ${braces}`);
}

checkBalance(content);
