/* =========================================================================
   Canvas text and compact layout helpers
   ========================================================================= */

function getCanvasTextFont(size, options = {}) {
    const weight = options.weight || 'bold';
    const family = options.family || 'Jua, sans-serif';
    return `${weight} ${Math.round(size)}px ${family}`;
}

function setCanvasTextFont(ctx, size, options = {}) {
    ctx.font = getCanvasTextFont(size, options);
}

function fitFontSize(ctx, text, maxWidth, options = {}) {
    const initialSize = Number(options.initialSize || options.size || 18);
    const minSize = Number(options.minSize || 11);
    let size = initialSize;

    while (size > minSize) {
        setCanvasTextFont(ctx, size, options);
        if (ctx.measureText(String(text || '')).width <= maxWidth) return size;
        size -= 1;
    }

    setCanvasTextFont(ctx, minSize, options);
    return minSize;
}

function splitLongToken(ctx, token, maxWidth) {
    const parts = [];
    let current = '';
    String(token || '').split('').forEach(char => {
        const next = current + char;
        if (current && ctx.measureText(next).width > maxWidth) {
            parts.push(current);
            current = char;
        } else {
            current = next;
        }
    });
    if (current) parts.push(current);
    return parts;
}

function wrapText(ctx, text, maxWidth, options = {}) {
    const maxLines = Number(options.maxLines || 99);
    const rawLines = String(text || '').split(/\n+/);
    const lines = [];

    rawLines.forEach(rawLine => {
        const tokens = rawLine.trim().split(/\s+/).filter(Boolean);
        const normalizedTokens = tokens.length ? tokens : [rawLine.trim()];
        let line = '';

        normalizedTokens.forEach(token => {
            const pieces = ctx.measureText(token).width > maxWidth
                ? splitLongToken(ctx, token, maxWidth)
                : [token];

            pieces.forEach(piece => {
                const joiner = line ? ' ' : '';
                const next = line + joiner + piece;
                if (line && ctx.measureText(next).width > maxWidth) {
                    lines.push(line);
                    line = piece;
                } else {
                    line = next;
                }
            });
        });

        if (line) lines.push(line);
    });

    if (lines.length <= maxLines) return lines;

    const clipped = lines.slice(0, maxLines);
    let last = clipped[clipped.length - 1] || '';
    while (last && ctx.measureText(`${last}...`).width > maxWidth) {
        last = last.slice(0, -1);
    }
    clipped[clipped.length - 1] = `${last}...`;
    return clipped;
}

function drawFittedText(ctx, text, x, y, maxWidth, options = {}) {
    const size = fitFontSize(ctx, text, maxWidth, options);
    ctx.textAlign = options.align || 'center';
    ctx.textBaseline = options.baseline || 'middle';
    ctx.fillText(String(text || ''), x, y);
    ctx.textBaseline = 'alphabetic';
    return size;
}

function getWrappedTabLayout(tabs, options = {}) {
    const x = Number(options.x || 0);
    const y = Number(options.y || 0);
    const width = Math.max(1, Number(options.width || 1));
    const minTabWidth = Math.max(1, Number(options.minTabWidth || 88));
    const tabHeight = Math.max(1, Number(options.tabHeight || 44));
    const gap = Math.max(0, Number(options.gap || 8));
    const count = Math.max(1, tabs.length);
    const cols = Math.max(1, Math.min(count, Math.floor((width + gap) / (minTabWidth + gap))));
    const rows = Math.ceil(count / cols);
    const tabWidth = Math.floor((width - (cols - 1) * gap) / cols);

    return {
        x,
        y,
        width,
        cols,
        rows,
        tabWidth,
        tabHeight,
        gap,
        height: rows * tabHeight + (rows - 1) * gap,
        tabs: tabs.map((label, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            return {
                label,
                x: x + col * (tabWidth + gap),
                y: y + row * (tabHeight + gap),
                w: tabWidth,
                h: tabHeight,
                row,
                col
            };
        })
    };
}

window.CanvasText = {
    getFont: getCanvasTextFont,
    fitFontSize,
    wrapText,
    drawFittedText,
    getWrappedTabLayout
};

globalThis.CanvasText = window.CanvasText;
