/* =========================================================================
   게임 로직 및 렌더링
   ========================================================================= */

if (ERROR_BOX) {
    ERROR_BOX.setAttribute('aria-hidden', 'true');
}

function extractErrorMessage(error) {
    if (error == null) return '알 수 없는 오류가 발생했어요.';
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string' && error.message.trim()) return error.message;
    if (typeof error.status !== 'undefined' && error?.url) {
        return `${error.status} ${error.url}`;
    }
    try {
        return JSON.stringify(error);
    } catch (_) {
        return String(error);
    }
}

function showGlobalError(error) {
    if (!ERROR_BOX) return;
    const message = extractErrorMessage(error);
    if (!message || shownErrorMessages.has(message)) return;
    shownErrorMessages.add(message);
    ERROR_BOX.textContent = `[오류] ${message}`;
    ERROR_BOX.style.display = 'block';
    ERROR_BOX.setAttribute('aria-hidden', 'false');
    console.error(error);
}

window.addEventListener('error', evt => {
    const err = evt?.error || evt?.message || evt;
    showGlobalError(err);
});

window.addEventListener('unhandledrejection', evt => {
    const reason = evt?.reason || '비동기 처리 중 알 수 없는 오류가 발생했어요.';
    showGlobalError(reason);
});

function getHomeLayout(width) {
    const titleY = Math.round(60 * SCALE);
    const subtitleY = Math.round(90 * SCALE);
    const startY = Math.round(120 * SCALE);
    const gap = Math.max(8, Math.round(12 * SCALE));
    const cardPadding = Math.round(20 * SCALE);
    const cardMargin = Math.round(20 * SCALE);
    const availableWidth = Math.max(160, width - cardMargin * 2);
    const maxCols = Math.min(7, TINIPINGS.length);
    const minTileSize = Math.max(48, Math.round(56 * SCALE));
    const maxTileSize = Math.round(88 * SCALE);

    let cols = Math.max(1, Math.min(maxCols, Math.floor((availableWidth + gap) / (minTileSize + gap))));
    let tileSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    while (cols > 1 && tileSize < minTileSize) {
        cols -= 1;
        tileSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    }
    tileSize = Math.min(maxTileSize, tileSize);

    const rows = Math.ceil(TINIPINGS.length / cols);
    const gridWidth = cols * (tileSize + gap) - gap + cardPadding * 2;
    const gridHeight = rows * (tileSize + gap) - gap + cardPadding * 2;
    const cardX = (width - gridWidth) / 2;
    const btnW = Math.round(200 * SCALE);
    const btnH = Math.max(48, Math.round(50 * SCALE));
    const btnY = startY + gridHeight + Math.round(40 * SCALE);
    const totalHeight = btnY + btnH + Math.round(80 * SCALE);

    return {
        titleY, subtitleY, startY, gap, cardPadding, cardX,
        cols, rows, tileSize, gridWidth, gridHeight,
        btnW, btnH, btnY, totalHeight,
    };
}

function setHiDPI() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const cssW = Math.max(280, Math.min(viewportW - 24, 720));
    const baseW = 720;
    const widthScale = cssW / baseW;
    SCALE = Math.max(0.7, Math.min(1.5, widthScale));

    let cssH = Math.round(cssW * (16 / 9));
    const isHome = typeof STATE !== 'undefined' && STATE.mode === 'home';
    if (isHome) {
        const layout = getHomeLayout(cssW);
        cssH = Math.max(cssH, layout.totalHeight);
    } else if (viewportH > viewportW) {
        cssH = Math.max(cssH, viewportH - 48);
    }

    if (lastCssW === cssW && lastCssH === cssH) {
        return;
    }

    CANVAS.style.width = cssW + 'px';
    CANVAS.style.height = cssH + 'px';
    CANVAS.width = Math.round(cssW * DPR);
    CANVAS.height = Math.round(cssH * DPR);
    CTX.setTransform(DPR, 0, 0, DPR, 0, 0);

    lastCssW = cssW;
    lastCssH = cssH;
}
setHiDPI();
window.addEventListener('resize', () => {
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
});

function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}
function fillTextWrap(ctx, text, x, y, maxWidth, lineHeight) {
    const words = (text || '').toString().split(/\s+/);
    let line = '', outY = y;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const m = ctx.measureText(testLine);
        if (m.width > maxWidth && n > 0) {
            ctx.fillText(line, x, outY);
            line = words[n] + ' ';
            outY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, outY);
    return outY;
}

function buildExplanation(dividend, divisor, quotient, answer) {
    const patterns = [
        [`🎯 태희야, 같이 생각해볼까?`, `${dividend}개를 ${divisor}명에게 똑같이 나누면...`, `한 명당 ${quotient}개씩 받을 수 있어!`, `✨ 검산: ${quotient} × ${divisor} = ${dividend} (딱 맞네!)`],
        [`💡 거꾸로 생각해보자!`, `${divisor} × ${quotient} = ${dividend}이니까`, `반대로 ${dividend} ÷ ${divisor} = ${quotient}이지!`, `곱셈과 나눗셈은 친구야! 잘했어! 👍`],
        [`🍰 케이크로 생각해보자!`, `케이크 ${dividend}조각을 ${divisor}명이 나눠 먹으면`, `한 명이 ${quotient}조각씩 먹을 수 있어!`, `간단하지? 멋지게 풀었어! 🎉`]
    ];
    const selected = patterns[Math.floor(Math.random() * patterns.length)];
    return `${selected.join('\n')}\n\n💖 정답은 ${answer}이야!`;
}

function buildSimpleExplanation(a, b, op, ans) {
    return `정답은 ${ans}이야!\n${a} ${op} ${b} = ${ans}`;
}

function saveState() {
    const s = {
        questionIndex: STATE.questionIndex,
        totalQuestions: STATE.totalQuestions,
        score: STATE.score,
        difficulty: STATE.difficulty,
        consecutiveCorrect: STATE.consecutiveCorrect,
        caughtIds: STATE.caughtIds,
        usedProblems: STATE.usedProblems
    };
    localStorage.setItem(LS_KEY, JSON.stringify(s));
}

function loadState() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
        const s = JSON.parse(raw);
        STATE.questionIndex = s.questionIndex || 0;
        STATE.totalQuestions = s.totalQuestions || 0;
        STATE.score = s.score || 0;
        STATE.difficulty = s.difficulty || 2;
        STATE.caughtIds = s.caughtIds || [];
        STATE.consecutiveCorrect = s.consecutiveCorrect || 0;
        STATE.usedProblems = s.usedProblems || [];

        // 홈 모드인 경우 맵 모드로 강제 전환 (메인 페이지 변경)
        if (STATE.mode === 'home') {
            STATE.mode = 'map';
        }
    } catch (e) { }
}

function genProblem(diff) {
    const topic = STATE.currentCurriculum || 'division';

    if (topic.includes('덧셈') || topic.includes('합')) return genAdditionProblem(diff);
    if (topic.includes('뺄셈') || topic.includes('차')) return genSubtractionProblem(diff);
    if (topic.includes('곱셈') || topic.includes('구구')) return genMultiplicationProblem(diff);
    if (topic.includes('나눗셈') || topic.includes('나머지') || topic === 'division') return genDivisionProblem(diff);
    if (topic.includes('분수')) return genFractionProblem(diff);
    if (topic.includes('도형') || topic.includes('모양') || topic.includes('삼각형') || topic.includes('사각형')) return genGeometryProblem(diff);
    if (topic.includes('시계') || topic.includes('시각') || topic.includes('시간')) return genMeasurementProblem(diff);
    if (topic.includes('규칙') || topic.includes('수열')) return genPatternProblem(diff);
    if (topic.includes('길이')) return genLengthProblem(diff);
    if (topic.includes('자료') || topic.includes('그래프') || topic.includes('표') || topic.includes('분류')) return genGraphProblem(diff);
    if (topic.includes('수') && !topic.includes('수열')) return genNumberProblem(diff);
    if (topic.includes('창의') || topic.includes('영재') || topic.includes('사고력')) return genCreativeProblem(diff);

    // 난이도가 높으면(15 이상) 20% 확률로 창의력 문제 출제
    if (diff >= 15 && Math.random() < 0.2) return genCreativeProblem(diff);

    // 기본값: 덧셈
    return genAdditionProblem(diff);
}

function genNumberProblem(diff) {
    // 수의 개념 (크기 비교, 수 읽기, 자릿수)
    const type = Math.floor(Math.random() * 3);
    let question, answer, explanation;
    const wrongs = new Set();

    if (type === 0) {
        // 크기 비교
        const a = Math.floor(Math.random() * 90) + 10;
        const b = Math.floor(Math.random() * 90) + 10;
        if (a === b) return genNumberProblem(diff); // 재귀 호출로 다시 생성

        const isBigger = a > b;
        question = `${a}와 ${b} 중에서 더 큰 수는?`;
        answer = String(Math.max(a, b));
        explanation = `${a}와 ${b}를 비교하면 ${answer}가 더 커!`;

        wrongs.add(String(Math.min(a, b)));
        wrongs.add(String(Math.max(a, b) + 1));
        wrongs.add(String(Math.max(a, b) + 10));
    } else if (type === 1) {
        // 수 읽기 (일, 십, 백)
        const num = Math.floor(Math.random() * 900) + 100; // 100~999
        const digit = Math.floor(Math.random() * 3); // 0:일, 1:십, 2:백
        const place = ['일', '십', '백'][digit];
        const val = String(num)[2 - digit];

        question = `${num}에서 ${place}의 자리 숫자는?`;
        answer = val;
        explanation = `${num}을 자릿수대로 쓰면 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}야.`;

        while (wrongs.size < 3) {
            const w = Math.floor(Math.random() * 10);
            if (String(w) !== answer) wrongs.add(String(w));
        }
    } else {
        // 뛰어 세기
        const start = Math.floor(Math.random() * 50) + 1;
        const step = [2, 5, 10][Math.floor(Math.random() * 3)];
        const targetIdx = 3; // 4번째 수 묻기

        const seq = [];
        for (let i = 0; i < 5; i++) seq.push(start + i * step);

        question = `${start}부터 ${step}씩 뛰어 세면 네 번째 수는?`;
        answer = String(seq[targetIdx]);
        explanation = `${start} - ${seq[1]} - ${seq[2]} - ${seq[3]}... ${step}씩 커지니까 네 번째는 ${answer}야!`;

        wrongs.add(String(seq[targetIdx] - step));
        wrongs.add(String(seq[targetIdx] + step));
        wrongs.add(String(seq[targetIdx] + step * 2));
    }

    return {
        question,
        options: [answer, ...Array.from(wrongs)].slice(0, 4).sort(() => Math.random() - 0.5),
        answer,
        explanation,
        problemKey: `number-${type}-${Math.random()}`
    };
}

function genAdditionProblem(diff) {
    const max = diff * 10;
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    const answer = a + b;
    const question = `${a} + ${b} = ( )`;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 0) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);

    return {
        question,
        options,
        answer,
        explanation: buildSimpleExplanation(a, b, '+', answer),
        problemKey: `add-${a}-${b}`
    };
}

function genSubtractionProblem(diff) {
    const max = diff * 10;
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    if (a < b) [a, b] = [b, a]; // 음수 방지

    const answer = a - b;
    const question = `${a} - ${b} = ( )`;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 0) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);

    return {
        question,
        options,
        answer,
        explanation: buildSimpleExplanation(a, b, '-', answer),
        problemKey: `sub-${a}-${b}`
    };
}

function genMultiplicationProblem(diff) {
    const dan = Math.max(2, Math.min(19, diff));
    const a = dan;
    const b = Math.floor(Math.random() * 9) + 1;
    const answer = a * b;
    const question = `${a} × ${b} = ( )`;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 1) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);

    return {
        question,
        options,
        answer,
        explanation: buildSimpleExplanation(a, b, '×', answer),
        problemKey: `mul-${a}-${b}`
    };
}

function genDivisionProblem(diff) {
    const dan = Math.max(2, Math.min(19, diff));
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
        attempts++;
        const divisor = dan;
        const quotient = Math.floor(Math.random() * 9) + 1;
        const dividend = divisor * quotient;
        const problemKey = `${dividend}-${divisor}-${quotient}`;

        if (STATE.usedProblems.includes(problemKey)) continue;

        const isFillBlank = Math.random() < 0.5;
        let question, answer;

        if (isFillBlank) {
            const pos = Math.floor(Math.random() * 3);
            if (pos === 0) { question = `( ) ÷ ${divisor} = ${quotient}`; answer = dividend; }
            else if (pos === 1) { question = `${dividend} ÷ ( ) = ${quotient}`; answer = divisor; }
            else { question = `${dividend} ÷ ${divisor} = ( )`; answer = quotient; }
        } else {
            const templates = [
                `태희야, 케이크 ${dividend}개를 ${divisor}명에게 똑같이 나누어 주면 한 명은 몇 개를 받을까?`,
                `태희야, 티니핑 스티커 ${dividend}개를 ${divisor}개씩 묶으면 몇 묶음이 될까?`,
                `태희야, 색연필 ${dividend}자루를 ${divisor}명이 똑같이 나누면 한 명은 몇 자루를 받을까?`
            ];
            question = templates[Math.floor(Math.random() * templates.length)];
            answer = quotient;
        }

        const wrongs = new Set();
        while (wrongs.size < 4) {
            let w = answer + Math.floor(Math.random() * 10) - 5;
            if (w < 1) w = answer + wrongs.size + 1;
            if (w !== answer) wrongs.add(w);
        }
        const options = [answer, ...[...wrongs]].sort(() => Math.random() - 0.5);
        const explanation = buildExplanation(dividend, divisor, quotient, answer);

        STATE.usedProblems.push(problemKey);
        return { question, options, answer, explanation, problemKey };
    }

    // Fallback
    const divisor = dan;
    const quotient = Math.floor(Math.random() * 9) + 1;
    const dividend = divisor * quotient;
    const question = `${dividend} ÷ ${divisor} = ( )`;
    const answer = quotient;
    const options = [answer, answer + 1, answer - 1, answer + 2, answer - 2].filter(n => n > 0).slice(0, 5).sort(() => Math.random() - 0.5);
    return { question, options, answer, explanation: `정답은 ${answer}이야!` };
}

function genFractionProblem(diff) {
    // 분모가 같은 분수의 덧셈/뺄셈
    const denom = Math.floor(Math.random() * 8) + 2; // 2~9
    const num1 = Math.floor(Math.random() * (denom - 1)) + 1;
    const num2 = Math.floor(Math.random() * (denom - num1)) + 1;

    const isAdd = Math.random() < 0.5;
    let question, answerStr, explanation;

    if (isAdd) {
        const sumNum = num1 + num2;
        question = `${num1}/${denom} + ${num2}/${denom} = ?`;
        answerStr = `${sumNum}/${denom}`;
        explanation = `분모가 같은 분수의 덧셈은 분자끼리 더해!\n${num1} + ${num2} = ${sumNum}이니까 정답은 ${sumNum}/${denom}이야.`;
    } else {
        // 뺄셈 (큰 수에서 작은 수 빼기)
        const big = Math.max(num1, num2);
        const small = Math.min(num1, num2);
        const diffNum = big - small;
        question = `${big}/${denom} - ${small}/${denom} = ?`;
        answerStr = `${diffNum}/${denom}`;
        explanation = `분모가 같은 분수의 뺄셈은 분자끼리 빼!\n${big} - ${small} = ${diffNum}이니까 정답은 ${diffNum}/${denom}이야.`;
    }

    // 오답 생성
    const wrongs = new Set();
    while (wrongs.size < 4) {
        const wNum = Math.floor(Math.random() * denom) + 1;
        const wDenom = Math.random() < 0.3 ? denom + 1 : denom;
        const wStr = `${wNum}/${wDenom}`;
        if (wStr !== answerStr) wrongs.add(wStr);
    }

    return {
        question,
        options: [answerStr, ...wrongs].sort(() => Math.random() - 0.5),
        answer: answerStr,
        explanation,
        problemKey: `frac-${question}`
    };
}

function genGeometryProblem(diff) {
    let quizzes = [];

    // 난이도 1-5: 기본 도형 이름 맞추기
    if (diff <= 5) {
        quizzes = [
            { q: "이 도형의 이름은?", a: "삼각형", type: "triangle", wrong: ["사각형", "원", "오각형", "육각형"] },
            { q: "이 도형의 이름은?", a: "사각형", type: "rectangle", wrong: ["삼각형", "원", "오각형", "육각형"] },
            { q: "이 도형의 이름은?", a: "원", type: "circle", wrong: ["삼각형", "사각형", "오각형", "육각형"] },
            { q: "변이 3개인 도형은?", a: "삼각형", type: "triangle", wrong: ["사각형", "원", "오각형"] },
            { q: "변이 4개인 도형은?", a: "사각형", type: "rectangle", wrong: ["삼각형", "원", "오각형"] }
        ];
    }
    // 난이도 6-10: 도형의 성질 (변, 꼭짓점)
    else if (diff <= 10) {
        quizzes = [
            { q: "삼각형의 변의 개수는?", a: "3개", type: "triangle", wrong: ["4개", "5개", "6개", "0개"] },
            { q: "사각형의 꼭짓점의 개수는?", a: "4개", type: "rectangle", wrong: ["3개", "5개", "6개", "0개"] },
            { q: "육각형의 변의 개수는?", a: "6개", type: "hexagon", wrong: ["4개", "5개", "8개", "10개"] },
            { q: "오각형의 꼭짓점의 개수는?", a: "5개", type: "pentagon", wrong: ["4개", "6개", "8개", "3개"] }
        ];
    }
    // 난이도 11+: 심화 (내각, 대각선, 특수 사각형)
    else {
        quizzes = [
            { q: "삼각형의 세 내각의 합은?", a: "180도", type: "triangle", wrong: ["360도", "90도", "270도", "540도"] },
            { q: "사각형의 네 내각의 합은?", a: "360도", type: "rectangle", wrong: ["180도", "540도", "720도", "90도"] },
            { q: "오각형의 대각선 개수는?", a: "5개", type: "pentagon", wrong: ["2개", "9개", "14개", "0개"] },
            { q: "육각형의 대각선 개수는?", a: "9개", type: "hexagon", wrong: ["5개", "14개", "20개", "6개"] },
            { q: "네 변의 길이가 같고 네 각이 직각인 사각형은?", a: "정사각형", type: "square", wrong: ["직사각형", "마름모", "평행사변형", "사다리꼴"] },
            { q: "네 변의 길이가 모두 같은 사각형은?", a: "마름모", type: "rhombus", wrong: ["직사각형", "사다리꼴", "평행사변형", "등변사다리꼴"] }
        ];
    }

    // Fallback if quizzes is empty
    if (quizzes.length === 0) {
        quizzes = [{ q: "이 도형의 이름은?", a: "삼각형", type: "triangle", wrong: ["사각형", "원", "오각형", "육각형"] }];
    }

    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    const options = [quiz.a, ...quiz.wrong.slice(0, 4)].sort(() => Math.random() - 0.5);

    return {
        question: quiz.q,
        options,
        answer: quiz.a,
        explanation: `정답은 ${quiz.a}이야!`,
        problemKey: `geo-${quiz.q}-${quiz.type}`,
        shapeType: quiz.type
    };
}

function genMeasurementProblem(diff) {
    // 시계 보기 문제
    let h, m;

    if (diff <= 3) {
        // 정각
        h = Math.floor(Math.random() * 12) + 1;
        m = 0;
    } else if (diff <= 6) {
        // 30분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.random() < 0.5 ? 0 : 30;
    } else if (diff <= 10) {
        // 5분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.floor(Math.random() * 12) * 5;
    } else {
        // 1분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.floor(Math.random() * 60);
    }

    const answer = `${h}시` + (m > 0 ? ` ${m}분` : '');
    const question = "이 시계는 몇 시 몇 분을 가리키고 있나요?";

    // 오답 생성
    const wrongs = new Set();
    while (wrongs.size < 4) {
        let wh = h + Math.floor(Math.random() * 5) - 2;
        if (wh < 1) wh += 12;
        if (wh > 12) wh -= 12;

        let wm = m + Math.floor(Math.random() * 6) * 5 - 15; // 5분 단위 오차
        if (wm < 0) wm += 60;
        if (wm >= 60) wm -= 60;

        // 난이도 높으면 분침을 헷갈리게 (예: 55분을 11분으로 착각)
        if (diff > 8 && Math.random() < 0.3) {
            const fakeM = Math.floor(m / 5);
            if (fakeM > 0) wm = fakeM;
        }

        const wStr = `${wh}시` + (wm > 0 ? ` ${wm}분` : '');
        if (wStr !== answer) wrongs.add(wStr);
    }

    return {
        question,
        options: [answer, ...wrongs].sort(() => Math.random() - 0.5),
        answer,
        explanation: `짧은 바늘이 ${h} 근처, 긴 바늘이 ${m}분을 가리키고 있어!\n정답은 ${answer}이야.`,
        problemKey: `clock-${h}-${m}`,
        clockTime: { h, m }
    };
}

function genPatternProblem(diff) {
    // 등차수열 규칙 찾기
    const start = Math.floor(Math.random() * 20) + 1;
    const step = Math.floor(Math.random() * Math.min(diff, 10)) + 1;
    const length = 5;
    const seq = [];

    for (let i = 0; i < length; i++) {
        seq.push(start + i * step);
    }

    const blankIdx = Math.floor(Math.random() * length);
    const answer = seq[blankIdx];
    seq[blankIdx] = '( )';

    const question = `규칙을 찾아 빈칸에 알맞은 수는?\n${seq.join(', ')}`;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 0) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }

    return {
        question,
        options: [answer, ...wrongs].sort(() => Math.random() - 0.5),
        answer,
        explanation: `숫자가 ${step}씩 커지는 규칙이야!\n${answer - step} 다음은 ${answer}이지.`,
        problemKey: `pattern-${start}-${step}-${blankIdx}`
    };
}

function genLengthProblem(diff) {
    // 길이 재기 (자 눈금 읽기)
    const length = Math.floor(Math.random() * 8) + 2; // 2~9cm
    const start = Math.floor(Math.random() * 3); // 0, 1, 2cm에서 시작 (난이도)

    const answer = `${length}cm`;
    const question = "연필의 길이는 몇 cm일까요?";

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = length + Math.floor(Math.random() * 5) - 2;
        if (w < 1) w = length + 1;
        if (w !== length) wrongs.add(`${w}cm`);
    }

    // 시작점이 0이 아닐 때 헷갈리는 오답 (끝 눈금만 읽은 경우)
    if (start > 0) {
        wrongs.add(`${start + length}cm`);
    }

    return {
        question,
        options: [answer, ...Array.from(wrongs)].slice(0, 4).sort(() => Math.random() - 0.5),
        answer,
        explanation: `물건의 한쪽 끝을 눈금 ${start}에 맞췄으니까,\n끝 눈금 ${start + length}에서 시작 눈금 ${start}을 빼면 ${length}cm야!`,
        problemKey: `length-${length}-${start}`,
        rulerData: { length, start }
    };
}

function genGraphProblem(diff) {
    // 막대그래프 해석
    const items = ['사과', '바나나', '포도', '귤'];
    const counts = items.map(() => Math.floor(Math.random() * 8) + 2); // 2~9개

    // 질문 유형 랜덤 선택
    const qType = Math.floor(Math.random() * 3);
    let question, answer, explanation;

    if (qType === 0) {
        // 가장 많은 것 찾기
        const maxVal = Math.max(...counts);
        const maxItems = items.filter((_, i) => counts[i] === maxVal);
        question = "가장 많은 과일은 무엇인가요?";
        answer = maxItems[0]; // 복수 정답 방지 위해 하나만
        explanation = `${answer}가 ${maxVal}개로 가장 많아!`;
    } else if (qType === 1) {
        // 특정 항목 개수 묻기
        const targetIdx = Math.floor(Math.random() * items.length);
        question = `${items[targetIdx]}는 몇 개일까요?`;
        answer = `${counts[targetIdx]}개`;
        explanation = `그래프의 막대 높이를 보면 ${items[targetIdx]}는 ${counts[targetIdx]}개야.`;
    } else {
        // 전체 개수 묻기
        const total = counts.reduce((a, b) => a + b, 0);
        question = "과일은 모두 몇 개일까요?";
        answer = `${total}개`;
        explanation = `모든 막대의 수를 더하면 ${counts.join(' + ')} = ${total}개야.`;
    }

    const wrongs = new Set();
    if (qType === 0) {
        items.forEach(it => { if (it !== answer) wrongs.add(it); });
    } else {
        while (wrongs.size < 4) {
            let wVal = parseInt(answer) + Math.floor(Math.random() * 7) - 3;
            if (wVal < 1) wVal = 1;
            const wStr = `${wVal}개`;
            if (wStr !== answer) wrongs.add(wStr);
        }
    }

    return {
        question,
        options: [answer, ...Array.from(wrongs)].slice(0, 4).sort(() => Math.random() - 0.5),
        answer,
        explanation,
        return {
            question,
            options: [answer, ...Array.from(wrongs)].slice(0, 4).sort(() => Math.random() - 0.5),
            answer,
            explanation,
            problemKey: `graph-${qType}-${counts.join('-')}`,
            graphData: { items, counts }
        };
    }

    function genCreativeProblem(diff) {
        // 영재/사고력 수학 문제 (복면산, 논리 등)
        const type = Math.floor(Math.random() * 2);
        let question, answer, explanation;
        const wrongs = new Set();

        if (type === 0) {
            // 간단한 복면산 (모양으로 수 찾기)
            // ★ + ★ = 10, ★ = ?
            const val = Math.floor(Math.random() * 9) + 1;
            const sum = val * 2;
            const symbol = ['★', '♥', '●', '■'][Math.floor(Math.random() * 4)];

            question = `${symbol} + ${symbol} = ${sum}일 때,\n${symbol}이 나타내는 수는?`;
            answer = String(val);
            explanation = `${symbol}이 두 번 더해져서 ${sum}이 되었으니,\n${symbol}은 ${sum}의 절반인 ${val}이야.`;

            while (wrongs.size < 3) {
                const w = Math.floor(Math.random() * 10);
                if (String(w) !== answer && w > 0) wrongs.add(String(w));
            }
        } else {
            // 논리 퀴즈 (나이 비교)
            // A는 B보다 2살 많고, B는 5살이야. A는 몇 살?
            const ageB = Math.floor(Math.random() * 5) + 5; // 5~9살
            const diffAge = Math.floor(Math.random() * 3) + 1; // 1~3살 차이
            const ageA = ageB + diffAge;

            const names = ['하츄핑', '바로핑', '아자핑', '차차핑'];
            const nameA = names[Math.floor(Math.random() * names.length)];
            let nameB = names[Math.floor(Math.random() * names.length)];
            while (nameA === nameB) nameB = names[Math.floor(Math.random() * names.length)];

            question = `${nameA}은(는) ${nameB}보다 ${diffAge}살 많아.\n${nameB}이(가) ${ageB}살이라면, ${nameA}은(는) 몇 살일까?`;
            answer = `${ageA}살`;
            explanation = `${nameB}가 ${ageB}살이고, ${nameA}은 ${diffAge}살 더 많으니까\n${ageB} + ${diffAge} = ${ageA}살이야.`;

            wrongs.add(`${ageB}살`);
            wrongs.add(`${ageB - diffAge}살`);
            wrongs.add(`${ageA + 1}살`);
        }

        return {
            question,
            options: [answer, ...Array.from(wrongs)].slice(0, 4).sort(() => Math.random() - 0.5),
            answer,
            explanation,
            problemKey: `creative-${type}-${Math.random()}`
        };
    }

    function clear() {
        const W = CANVAS.width / DPR;
        const H = CANVAS.height / DPR;
        const g = CTX.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#fff0f6');
        g.addColorStop(1, '#eef6ff');
        CTX.fillStyle = g;
        CTX.fillRect(0, 0, W, H);
        STATE.hitboxes = [];
        return { W, H };
    }

    function drawHeader(W, H) {
        CTX.save();
        roundRect(CTX, 16, 12, W - 32, 80, 16);
        CTX.fillStyle = '#ffffff';
        CTX.fill();
        CTX.shadowColor = 'rgba(0,0,0,0.06)';
        CTX.shadowBlur = 10;
        CTX.restore();

        CTX.fillStyle = '#ec4899';
        CTX.font = 'bold 28px Jua, sans-serif, Segoe UI, Roboto';
        CTX.textAlign = 'center';
        const title = STATE.currentCurriculum === 'division' ? '태희의 도전! 수학꾸러기' : `태희의 ${STATE.currentCurriculum} 도전!`;
        CTX.fillText(title, W / 2, 42);
        CTX.textAlign = 'left';

        CTX.fillStyle = '#374151';
        CTX.font = '18px Jua, sans-serif, Segoe UI, Roboto';
        CTX.fillText(`문제 ${STATE.totalQuestions + 1}/100`, 32, 72);

        const scoreTxt = `점수 ${STATE.score}`;
        const diffTxt = `${STATE.difficulty}단`;
        CTX.textAlign = 'right';
        CTX.fillText(diffTxt, W - 32, 42);
        CTX.fillText(scoreTxt, W - 32, 72);
        CTX.textAlign = 'left';
    }

    function drawCollectionButton(W, H) {
        const bw = 140, bh = 50;
        const bx = W - bw - 20;
        const by = H - bh - 20;

        CTX.save();
        roundRect(CTX, bx, by, bw, bh, 12);
        CTX.fillStyle = '#a855f7';
        CTX.shadowColor = 'rgba(168, 85, 247, 0.4)';
        CTX.shadowBlur = 12;
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.font = 'bold 18px Jua, sans-serif';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('📚 컬렉션', bx + bw / 2, by + bh / 2);
        CTX.textBaseline = 'alphabetic';
        CTX.textAlign = 'left';

        STATE.hitboxes.push({ id: 'btn_collection', x: bx, y: by, w: bw, h: bh });
    }

    function drawBackgroundTiles(W, H, opacity = 0.15) {
        const tileSize = 60;
        const gap = 10;
        const cols = Math.floor(W / (tileSize + gap)) + 1;
        const rows = Math.floor(H / (tileSize + gap)) + 1;

        CTX.globalAlpha = opacity;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const idx = (row * cols + col) % TINIPINGS.length;
                const tp = TINIPINGS[idx];
                const x = col * (tileSize + gap);
                const y = row * (tileSize + gap);

                CTX.save();
                roundRect(CTX, x, y, tileSize, tileSize, 10);
                const g = CTX.createLinearGradient(x, y, x + tileSize, y + tileSize);
                if (tp.type === '로열') { g.addColorStop(0, '#fce7f3'); g.addColorStop(1, '#fbcfe8'); }
                else if (tp.type === '전설') { g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#fde68a'); }
                else if (tp.type === '서포팅') { g.addColorStop(0, '#ddd6fe'); g.addColorStop(1, '#c4b5fd'); }
                else { g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#bae6fd'); }
                CTX.fillStyle = g;
                CTX.fill();
                CTX.restore();

                if (tp.imageObj) {
                    const imgSize = tileSize * 0.7;
                    CTX.drawImage(tp.imageObj, x + (tileSize - imgSize) / 2, y + (tileSize - imgSize) / 2, imgSize, imgSize);
                }
            }
        }
        CTX.globalAlpha = 1.0;
    }

    function drawMap() {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.1);

        // 상단 헤더 (홈 버튼 포함)
        CTX.save();
        roundRect(CTX, 16, 12, W - 32, 60, 16);
        CTX.fillStyle = '#ffffff';
        CTX.fill();
        CTX.shadowColor = 'rgba(0,0,0,0.06)';
        CTX.shadowBlur = 10;
        CTX.restore();

        CTX.fillStyle = '#ec4899';
        CTX.font = 'bold 24px Jua, sans-serif';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('수학 탐험 지도', W / 2, 42);

        // 홈 버튼 (맵 초기화)
        const homeBtnW = 80;
        const homeBtnH = 40;
        const homeBtnX = 30;
        const homeBtnY = 22;

        CTX.save();
        roundRect(CTX, homeBtnX, homeBtnY, homeBtnW, homeBtnH, 8);
        CTX.fillStyle = '#fce7f3';
        CTX.fill();
        CTX.strokeStyle = '#ec4899';
        CTX.lineWidth = 2;
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = '#db2777';
        CTX.font = 'bold 16px Jua, sans-serif';
        CTX.fillText('처음으로', homeBtnX + homeBtnW / 2, homeBtnY + homeBtnH / 2);
        STATE.hitboxes.push({ id: 'btn_map_home', x: homeBtnX, y: homeBtnY, w: homeBtnW, h: homeBtnH });

        CTX.textAlign = 'left';
        CTX.textBaseline = 'alphabetic';

        const contentY = 100;
        const contentH = H - contentY - 20;

        if (!STATE.mapSelection.grade) {
            // 1단계: 학교급 선택 (초등학교, 중학교, 고등학교)
            const levels = [
                { id: 'elementary_school', label: '초등학교', color: '#fca5a5' },
                { id: 'middle_school', label: '중학교', color: '#86efac' },
                { id: 'high_school', label: '고등학교', color: '#93c5fd' }
            ];

            const btnW = Math.min(300, W - 60);
            const btnH = 80;
            const gap = 30;
            const totalH = levels.length * btnH + (levels.length - 1) * gap;
            let startY = contentY + (contentH - totalH) / 2;

            levels.forEach(lvl => {
                const bx = (W - btnW) / 2;
                const by = startY;

                CTX.save();
                roundRect(CTX, bx, by, btnW, btnH, 20);
                CTX.fillStyle = lvl.color;
                CTX.shadowColor = 'rgba(0,0,0,0.1)';
                CTX.shadowBlur = 10;
                CTX.fill();
                CTX.restore();

                CTX.fillStyle = '#ffffff';
                CTX.font = 'bold 30px Jua, sans-serif';
                CTX.textAlign = 'center';
                CTX.textBaseline = 'middle';
                CTX.fillText(lvl.label, bx + btnW / 2, by + btnH / 2);

                STATE.hitboxes.push({ id: `grade_${lvl.id}`, x: bx, y: by, w: btnW, h: btnH });
                startY += btnH + gap;
            });

        } else if (!STATE.mapSelection.subGrade) {
            // 2단계: 학년군/학년 선택
            if (!CURRICULUM_DATA) {
                console.error('커리큘럼 데이터가 로드되지 않았습니다.');
                return;
            }
            const gradeData = CURRICULUM_DATA[STATE.mapSelection.grade];
            if (!gradeData) {
                console.error(`해당 학년급(${STATE.mapSelection.grade}) 데이터를 찾을 수 없습니다.`);
                return;
            }

            const subGrades = Object.keys(gradeData);
            const btnW = Math.min(280, W - 60);
            const btnH = 60;
            const gap = 20;

            let startY = contentY + 20;

            CTX.fillStyle = '#1f2937';
            CTX.font = 'bold 24px Jua, sans-serif';
            CTX.textAlign = 'center';
            CTX.fillText('학년을 선택해줘!', W / 2, startY);
            startY += 50;

            subGrades.forEach(sub => {
                const bx = (W - btnW) / 2;
                const by = startY;

                CTX.save();
                roundRect(CTX, bx, by, btnW, btnH, 15);
                CTX.fillStyle = '#c4b5fd';
                CTX.fill();
                CTX.restore();

                CTX.fillStyle = '#ffffff';
                CTX.font = 'bold 22px Jua, sans-serif';
                CTX.textAlign = 'center';
                CTX.textBaseline = 'middle';
                CTX.fillText(sub, bx + btnW / 2, by + btnH / 2);

                STATE.hitboxes.push({ id: `subgrade_${sub}`, x: bx, y: by, w: btnW, h: btnH });
                startY += btnH + gap;
            });

        } else {
            // 3단계: 영역 및 주제 선택
            if (!CURRICULUM_DATA || !CURRICULUM_DATA[STATE.mapSelection.grade]) return;

            const domainData = CURRICULUM_DATA[STATE.mapSelection.grade][STATE.mapSelection.subGrade];
            if (!domainData) {
                console.error(`해당 학년(${STATE.mapSelection.subGrade}) 데이터를 찾을 수 없습니다.`);
                return;
            }

            const domains = Object.keys(domainData);
            let startY = contentY + 10;

            domains.forEach(dom => {
                // 영역 제목
                CTX.fillStyle = '#374151';
                CTX.font = 'bold 20px Jua, sans-serif';
                CTX.textAlign = 'left';
                CTX.fillText(dom, 30, startY);
                startY += 30;

                // 주제 버튼들
                const topics = domainData[dom];
                const btnH = 40;
                const gap = 10;
                const colCount = Math.floor((W - 60) / 160); // 버튼 최소 너비 고려
                const btnW = (W - 60 - (colCount - 1) * gap) / colCount;

                topics.forEach((topic, idx) => {
                    const row = Math.floor(idx / colCount);
                    const col = idx % colCount;
                    const bx = 30 + col * (btnW + gap);
                    const by = startY + row * (btnH + gap);

                    CTX.save();
                    roundRect(CTX, bx, by, btnW, btnH, 10);
                    CTX.fillStyle = '#f0f9ff';
                    CTX.fill();
                    CTX.strokeStyle = '#bae6fd';
                    CTX.lineWidth = 1;
                    CTX.stroke();
                    CTX.restore();

                    CTX.fillStyle = '#0369a1';
                    CTX.font = '16px Jua, sans-serif';
                    CTX.textAlign = 'center';
                    CTX.textBaseline = 'middle';

                    // 텍스트 길이 조절
                    let displayTopic = topic;
                    if (topic.length > 8) displayTopic = topic.substring(0, 8) + '..';

                    CTX.fillText(displayTopic, bx + btnW / 2, by + btnH / 2);

                    STATE.hitboxes.push({ id: `topic_${topic}`, x: bx, y: by, w: btnW, h: btnH });
                });

                const rows = Math.ceil(topics.length / colCount);
                startY += rows * (btnH + gap) + 20;
            });
        }
    }

    function drawHome() {
        const { W } = clear();
        const layout = getHomeLayout(W);

        CTX.fillStyle = '#ec4899';
        CTX.font = `bold ${Math.round(36 * SCALE)}px Jua, sans-serif, Segoe UI, Roboto`;
        CTX.textAlign = 'center';
        CTX.fillText('태희의 도전! 수학꾸러기', W / 2, layout.titleY);
        CTX.textAlign = 'left';

        CTX.fillStyle = '#6b7280';
        CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif, Segoe UI, Roboto`;
        CTX.textAlign = 'center';
        CTX.fillText('나눗셈 문제를 풀고 귀여운 티니핑들을 모아보세요!', W / 2, layout.subtitleY);
        CTX.textAlign = 'left';

        const cardRadius = Math.round(20 * SCALE);
        const cardShadow = Math.round(12 * SCALE);
        CTX.save();
        CTX.shadowColor = 'rgba(0,0,0,0.08)';
        CTX.shadowBlur = cardShadow;
        roundRect(CTX, layout.cardX, layout.startY - Math.round(10 * SCALE), layout.gridWidth, layout.gridHeight + Math.round(20 * SCALE), cardRadius);
        CTX.fillStyle = '#ffffff';
        CTX.fill();
        CTX.restore();

        const tileStartX = layout.cardX + layout.cardPadding;
        const tileStartY = layout.startY;

        for (let i = 0; i < TINIPINGS.length; i++) {
            const row = Math.floor(i / layout.cols);
            const col = i % layout.cols;
            const x = tileStartX + col * (layout.tileSize + layout.gap);
            const y = tileStartY + row * (layout.tileSize + layout.gap);
            const tp = TINIPINGS[i];

            CTX.save();
            roundRect(CTX, x, y, layout.tileSize, layout.tileSize, Math.round(12 * SCALE));
            const g = CTX.createLinearGradient(x, y, x + layout.tileSize, y + layout.tileSize);
            if (tp.type === '로열') { g.addColorStop(0, '#fce7f3'); g.addColorStop(1, '#fbcfe8'); }
            else if (tp.type === '전설') { g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#fde68a'); }
            else if (tp.type === '서포팅') { g.addColorStop(0, '#ddd6fe'); g.addColorStop(1, '#c4b5fd'); }
            else { g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#bae6fd'); }
            CTX.fillStyle = g;
            CTX.fill();
            CTX.strokeStyle = '#e5e7eb';
            CTX.lineWidth = Math.max(1, Math.round(2 * SCALE));
            CTX.stroke();
            CTX.restore();

            if (tp.imageObj) {
                const imgSize = layout.tileSize * 0.65;
                CTX.drawImage(tp.imageObj, x + (layout.tileSize - imgSize) / 2, y + Math.round(8 * SCALE), imgSize, imgSize);
            }

            CTX.fillStyle = '#111827';
            CTX.font = `bold ${Math.max(10, Math.round(11 * SCALE))}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.fillText(tp.name, x + layout.tileSize / 2, y + layout.tileSize - Math.round(8 * SCALE));
            CTX.textAlign = 'left';
        }

        const btnX = (W - layout.btnW) / 2;
        CTX.save();
        CTX.shadowColor = 'rgba(236,72,153,0.4)';
        CTX.shadowBlur = Math.round(10 * SCALE);
        roundRect(CTX, btnX, layout.btnY, layout.btnW, layout.btnH, Math.round(12 * SCALE));
        const btnG = CTX.createLinearGradient(btnX, layout.btnY, btnX, layout.btnY + layout.btnH);
        btnG.addColorStop(0, '#ec4899');
        btnG.addColorStop(1, '#db2777');
        CTX.fillStyle = btnG;
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('게임 시작하기', btnX + layout.btnW / 2, layout.btnY + layout.btnH / 2);
        CTX.textAlign = 'left';
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: 'btn_start_game', x: btnX, y: layout.btnY, w: layout.btnW, h: layout.btnH });
    }

    function drawQuiz() {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.15);
        drawHeader(W, H);
        drawCollectionButton(W, H);

        const cardX = 24, cardY = 110, cardW = W - 48, cardH = H - 180;
        CTX.save();
        roundRect(CTX, cardX, cardY, cardW, cardH, 24);
        CTX.fillStyle = '#ffffff';
        CTX.fill();
        CTX.shadowColor = 'rgba(0,0,0,0.06)';
        CTX.shadowBlur = 10;
        CTX.restore();

        if (!STATE.problem) return;

        const { question, options } = STATE.problem;

        // 문제 텍스트
        CTX.fillStyle = '#111827';
        CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';

        // 긴 텍스트 줄바꿈 처리
        const textX = cardX + cardW / 2;
        const textY = cardY + Math.round(50 * SCALE);
        const maxWidth = cardW - 40;
        const lineHeight = Math.round(36 * SCALE);

        const lines = getLines(CTX, question, maxWidth);
        let currentY = textY;
        lines.forEach(line => {
            CTX.fillText(line, textX, currentY);
            currentY += lineHeight;
        });

        // 시각화 요소 (도형, 시계, 자, 그래프 등)
        let nextY = currentY + 20;
        if (STATE.problem.shapeType) {
            drawGeometryShape(CTX, STATE.problem.shapeType, cardX + cardW / 2, nextY + 60, 100);
            nextY += 140;
        } else if (STATE.problem.clockTime) {
            drawClock(CTX, cardX + cardW / 2, nextY + 80, 70, STATE.problem.clockTime.h, STATE.problem.clockTime.m);
            nextY += 180;
        } else if (STATE.problem.rulerData) {
            drawRuler(CTX, cardX + cardW / 2, nextY + 60, STATE.problem.rulerData);
            nextY += 140;
        } else if (STATE.problem.graphData) {
            drawBarGraph(CTX, cardX + cardW / 2, nextY + 90, STATE.problem.graphData);
            nextY += 200;
        }

        // 옵션 버튼 영역 계산
        const optionsAreaY = nextY + 20;
        const optionsAreaH = cardY + cardH - optionsAreaY - 80; // 하단 여백 확보
        const optionsAreaW = cardW - 40;
        const optionsAreaX = cardX + 20;

        const numOptions = options.length;
        const buttonGap = Math.round(12 * SCALE);
        let cols = numOptions;
        let rows = 1;
        let buttonW = Math.floor((optionsAreaW - (cols - 1) * buttonGap) / cols);

        // 버튼이 너무 작으면 2줄로 배치
        if (buttonW < 100 && numOptions > 2) {
            cols = Math.ceil(numOptions / 2);
            rows = Math.ceil(numOptions / cols);
            buttonW = Math.floor((optionsAreaW - (cols - 1) * buttonGap) / cols);
        }

        const buttonH = Math.max(52, Math.round(58 * SCALE));
        let lastOptionY = optionsAreaY;

        for (let i = 0; i < options.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            // 마지막 줄 중앙 정렬
            const itemsInRow = (row === rows - 1) ? (numOptions - row * cols) : cols;
            const rowWidth = itemsInRow * buttonW + (itemsInRow - 1) * buttonGap;
            const rowStartX = optionsAreaX + (optionsAreaW - rowWidth) / 2;

            const ox = rowStartX + col * (buttonW + buttonGap);
            const oy = optionsAreaY + row * (buttonH + buttonGap);
            lastOptionY = oy + buttonH;

            roundRect(CTX, ox, oy, buttonW, buttonH, Math.round(12 * SCALE));
            const selected = STATE.selected === options[i];

            if (selected) {
                const g = CTX.createLinearGradient(ox, oy, ox + buttonW, oy + buttonH);
                g.addColorStop(0, '#f472b6');
                g.addColorStop(1, '#60a5fa');
                CTX.fillStyle = g;
                CTX.fill();
                CTX.fillStyle = '#ffffff';
                CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
            } else {
                CTX.fillStyle = '#fdf2f8';
                CTX.fill();
                CTX.strokeStyle = '#f5c2e7';
                CTX.lineWidth = Math.max(1.5, Math.round(2 * SCALE));
                CTX.stroke();
                CTX.fillStyle = '#111827';
                CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
            }

            CTX.textAlign = 'center';
            CTX.textBaseline = 'middle';
            const displayText = buttonW < 80 ? `${options[i]}` : `${i + 1}. ${options[i]}`;
            CTX.fillText(displayText, ox + buttonW / 2, oy + buttonH / 2);
            CTX.textBaseline = 'alphabetic';

            STATE.hitboxes.push({ id: `opt_${i}`, x: ox, y: oy, w: buttonW, h: buttonH, value: options[i] });
        }

        const btnW = Math.max(200, Math.min(Math.round(240 * SCALE), optionsAreaW * 0.7));
        const btnH = Math.max(50, Math.round(56 * SCALE));
        const btnX = cardX + (cardW - btnW) / 2;
        const btnY = lastOptionY + Math.round(24 * SCALE);

        CTX.save();
        roundRect(CTX, btnX, btnY, btnW, btnH, Math.round(14 * SCALE));
        if (STATE.selected == null) {
            CTX.fillStyle = '#d1d5db';
        } else {
            const gg = CTX.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
            gg.addColorStop(0, '#fb7185');
            gg.addColorStop(1, '#60a5fa');
            CTX.fillStyle = gg;
            CTX.shadowColor = 'rgba(251, 113, 133, 0.3)';
            CTX.shadowBlur = Math.round(8 * SCALE);
        }
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
        CTX.fillText('정답 확인', btnX + btnW / 2, btnY + btnH / 2);
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: 'btn_check', x: btnX, y: btnY, w: btnW, h: btnH, disabled: STATE.selected == null });
    }

    function drawExplain() {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.12);
        drawHeader(W, H);
        drawCollectionButton(W, H);

        const cardX = 24, cardY = 110, cardW = W - 48, cardH = H - 180;
        CTX.save();
        roundRect(CTX, cardX, cardY, cardW, cardH, 24);
        CTX.fillStyle = '#ffffff';
        CTX.fill();
        CTX.restore();

        CTX.textAlign = 'left';
        CTX.fillStyle = STATE.isCorrect ? '#065f46' : '#7f1d1d';
        CTX.font = `bold ${Math.round(26 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(STATE.isCorrect ? '태희야, 정답이야!' : '태희야, 다시 생각해봐!', cardX + 24, cardY + 42);

        CTX.fillStyle = '#111827';
        CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`정답: ${STATE.problem.answer}`, cardX + 24, cardY + 72);

        const exX = cardX + 24, exY = cardY + 96;
        const exW = cardW - 48;
        const exH = Math.max(120, Math.round(140 * SCALE));
        roundRect(CTX, exX, exY, exW, exH, Math.round(14 * SCALE));
        CTX.fillStyle = '#eff6ff';
        CTX.fill();

        CTX.fillStyle = '#1f2937';
        CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
        fillTextWrap(CTX, STATE.problem.explanation, exX + 14, exY + 28, exW - 28, Math.round(24 * SCALE));

        const confirmY = exY + exH + Math.round(36 * SCALE);
        CTX.fillStyle = '#92400e';
        CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
        CTX.fillText('해설대로 풀었나요?', exX, confirmY);

        const btnGap = Math.round(16 * SCALE);
        const ynW = Math.max(100, Math.round((exW - btnGap) / 2));
        const ynH = Math.max(48, Math.round(50 * SCALE));
        const ynY = confirmY + Math.round(16 * SCALE);

        const yes = { x: exX, y: ynY, w: ynW, h: ynH, id: 'confirm_yes' };
        const no = { x: exX + ynW + btnGap, y: ynY, w: ynW, h: ynH, id: 'confirm_no' };

        CTX.save();
        roundRect(CTX, yes.x, yes.y, yes.w, yes.h, Math.round(12 * SCALE));
        CTX.fillStyle = STATE.confirmed === true ? '#10b981' : '#ffffff';
        CTX.fill();
        CTX.strokeStyle = '#10b981';
        CTX.lineWidth = Math.max(1.5, Math.round(2 * SCALE));
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = STATE.confirmed === true ? '#ffffff' : '#065f46';
        CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('예', yes.x + yes.w / 2, yes.y + yes.h / 2);
        STATE.hitboxes.push(yes);

        CTX.save();
        roundRect(CTX, no.x, no.y, no.w, no.h, Math.round(12 * SCALE));
        CTX.fillStyle = STATE.confirmed === false ? '#fb923c' : '#ffffff';
        CTX.fill();
        CTX.strokeStyle = '#fb923c';
        CTX.lineWidth = Math.max(1.5, Math.round(2 * SCALE));
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = STATE.confirmed === false ? '#ffffff' : '#7c2d12';
        CTX.fillText('아니요', no.x + no.w / 2, no.y + no.h / 2);
        CTX.textBaseline = 'alphabetic';
        STATE.hitboxes.push(no);

        const nxW = Math.max(200, Math.min(Math.round(240 * SCALE), cardW * 0.7));
        const nxH = Math.max(50, Math.round(56 * SCALE));
        const nxX = cardX + (cardW - nxW) / 2;
        const nxY = cardY + cardH - nxH - Math.round(16 * SCALE);

        CTX.save();
        roundRect(CTX, nxX, nxY, nxW, nxH, Math.round(14 * SCALE));
        const canNext = (STATE.confirmed !== null);
        if (canNext) {
            CTX.fillStyle = '#8b5cf6';
            CTX.shadowColor = 'rgba(139, 92, 246, 0.3)';
            CTX.shadowBlur = Math.round(8 * SCALE);
        } else {
            CTX.fillStyle = '#d1d5db';
        }
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('태희야, 다음 문제로!', nxX + nxW / 2, nxY + nxH / 2);
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: 'btn_next', x: nxX, y: nxY, w: nxW, h: nxH, disabled: !canNext });
    }

    function drawEncyclopediaCard(cx, startY, tiniping) {
        const encyclopedia = ENCYCLOPEDIA.find(e => e.id === tiniping.id);
        if (!encyclopedia) return;

        const typeColors = {
            '로열': { bg: '#fce7f3', border: '#ec4899', text: '#9f1239' },
            '전설': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
            '서포팅': { bg: '#ddd6fe', border: '#8b5cf6', text: '#5b21b6' },
            '일반': { bg: '#e0f2fe', border: '#0ea5e9', text: '#075985' }
        };
        const colors = typeColors[encyclopedia.type] || typeColors['일반'];

        const cardW = Math.min(360, Math.round(400 * SCALE));
        const cardH = Math.round(280 * SCALE);
        const cardX = cx - cardW / 2;
        const cardY = startY;
        const padding = Math.round(16 * SCALE);

        CTX.save();
        roundRect(CTX, cardX, cardY, cardW, cardH, Math.round(12 * SCALE));
        CTX.fillStyle = colors.bg;
        CTX.fill();
        CTX.strokeStyle = colors.border;
        CTX.lineWidth = Math.round(3 * SCALE);
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = colors.text;
        CTX.textAlign = 'left';
        let textY = cardY + padding;

        CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`${encyclopedia.name}`, cardX + padding, textY);

        const typeBadgeX = cardX + cardW - padding - Math.round(60 * SCALE);
        CTX.save();
        roundRect(CTX, typeBadgeX, textY - Math.round(16 * SCALE), Math.round(60 * SCALE), Math.round(24 * SCALE), Math.round(12 * SCALE));
        CTX.fillStyle = colors.border;
        CTX.fill();
        CTX.restore();
        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(12 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.fillText(encyclopedia.type, typeBadgeX + Math.round(30 * SCALE), textY - Math.round(3 * SCALE));

        textY += Math.round(32 * SCALE);
        CTX.textAlign = 'left';

        CTX.fillStyle = colors.text;
        CTX.font = `${Math.round(14 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`✨ ${encyclopedia.subtitle}`, cardX + padding, textY);
        textY += Math.round(24 * SCALE);

        CTX.strokeStyle = colors.border;
        CTX.lineWidth = Math.round(1 * SCALE);
        CTX.beginPath();
        CTX.moveTo(cardX + padding, textY);
        CTX.lineTo(cardX + cardW - padding, textY);
        CTX.stroke();
        textY += Math.round(16 * SCALE);

        CTX.font = `${Math.round(12 * SCALE)}px Jua, sans-serif`;
        const personalityShort = encyclopedia.personality.substring(0, 30) + (encyclopedia.personality.length > 30 ? '...' : '');
        CTX.fillText(`🎭 ${personalityShort}`, cardX + padding, textY);
        textY += Math.round(22 * SCALE);

        if (encyclopedia.magic) {
            const magicShort = encyclopedia.magic.substring(0, 35) + (encyclopedia.magic.length > 35 ? '...' : '');
            CTX.fillText(`✨ ${magicShort}`, cardX + padding, textY);
            textY += Math.round(22 * SCALE);
        }

        if (encyclopedia.item) {
            CTX.fillText(`🔮 아이템: ${encyclopedia.item}`, cardX + padding, textY);
            textY += Math.round(22 * SCALE);
        }

        if (encyclopedia.likes) {
            const likesShort = encyclopedia.likes.substring(0, 25) + (encyclopedia.likes.length > 25 ? '...' : '');
            CTX.fillText(`💖 좋아요: ${likesShort}`, cardX + padding, textY);
            textY += Math.round(22 * SCALE);
        }

        if (encyclopedia.dislikes) {
            const dislikesShort = encyclopedia.dislikes.substring(0, 25) + (encyclopedia.dislikes.length > 25 ? '...' : '');
            CTX.fillText(`💔 싫어요: ${dislikesShort}`, cardX + padding, textY);
        }

        CTX.fillStyle = colors.border;
        CTX.font = `bold ${Math.round(10 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'right';
        CTX.fillText(`No. ${String(encyclopedia.id).padStart(3, '0')}`, cardX + cardW - padding, cardY + cardH - Math.round(12 * SCALE));
    }

    function drawGeometryShape(ctx, shapeType, cx, cy, size) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.fillStyle = '#fdf2f8';
        ctx.lineWidth = 3;

        switch (shapeType) {
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx - size / 2, cy + size / 2);
                ctx.lineTo(cx + size / 2, cy + size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'rectangle':
            case 'square':
                ctx.beginPath();
                ctx.rect(cx - size / 2, cy - size / 3, size, size * 0.66);
                ctx.fill();
                ctx.stroke();
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case 'pentagon':
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                    const x = cx + (size / 2) * Math.cos(angle);
                    const y = cy + (size / 2) * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'hexagon':
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
                    const x = cx + (size / 2) * Math.cos(angle);
                    const y = cy + (size / 2) * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'rhombus':
                ctx.beginPath();
                ctx.moveTo(cx, cy - size / 2);
                ctx.lineTo(cx + size / 2, cy);
                ctx.lineTo(cx, cy + size / 2);
                ctx.lineTo(cx - size / 2, cy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            default:
                ctx.beginPath();
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
        }
        ctx.restore();
    }

    function drawRuler(ctx, cx, cy, data) {
        const { length, start } = data;
        const rulerW = 280;
        const rulerH = 50;
        const scale = rulerW / 12; // 12cm 자

        ctx.save();
        ctx.translate(cx - rulerW / 2, cy);

        // 자 본체
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.fillRect(0, 0, rulerW, rulerH);
        ctx.strokeRect(0, 0, rulerW, rulerH);

        // 눈금
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.font = '12px sans-serif';

        for (let i = 0; i <= 12; i++) {
            const x = i * scale;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 15);
            ctx.stroke();
            ctx.fillText(i, x, 28);
        }

        // 물체 (연필)
        const objStart = start * scale;
        const objW = length * scale;
        const objY = -20;

        ctx.fillStyle = '#ef4444';
        roundRect(ctx, objStart, objY, objW, 10, 4);
        ctx.fill();

        ctx.restore();
    }

    function drawBarGraph(ctx, cx, cy, data) {
        const { items, counts } = data;
        const maxVal = 10;
        const w = 260;
        const h = 140;
        const barW = 30;
        const gap = (w - (items.length * barW)) / (items.length + 1);

        ctx.save();
        ctx.translate(cx - w / 2, cy - h / 2);

        // 축
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, h);
        ctx.lineTo(w, h);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 눈금선
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 1; i <= maxVal; i++) {
            const y = h - (i / maxVal) * h;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // 막대
        items.forEach((item, i) => {
            const val = counts[i];
            const barH = (val / maxVal) * h;
            const x = gap + i * (barW + gap);
            const y = h - barH;

            ctx.fillStyle = ['#fca5a5', '#fdba74', '#86efac', '#93c5fd'][i % 4];
            ctx.fillRect(x, y, barW, barH);

            // 항목 이름
            ctx.fillStyle = '#374151';
            ctx.textAlign = 'center';
            ctx.font = '14px Jua, sans-serif';
            ctx.fillText(item, x + barW / 2, h + 20);

            // 값 표시
            ctx.fillText(val, x + barW / 2, y - 5);
        });

        ctx.restore();
    }

    function drawClock(ctx, cx, cy, radius, h, m) {
        ctx.save();
        ctx.translate(cx, cy);

        // 시계 판
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 눈금 및 숫자
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(radius * 0.15)}px Jua, sans-serif`;

        for (let num = 1; num <= 12; num++) {
            const ang = num * Math.PI / 6;
            ctx.rotate(ang);
            ctx.translate(0, -radius * 0.85);
            ctx.rotate(-ang);
            ctx.fillText(num.toString(), 0, 0);
            ctx.rotate(ang);
            ctx.translate(0, radius * 0.85);
            ctx.rotate(-ang);
        }

        // 시침 (hour hand)
        const hourAngle = (h % 12 + m / 60) * Math.PI / 6;
        ctx.save();
        ctx.rotate(hourAngle);
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -radius * 0.5);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ef4444'; // 빨간색
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // 분침 (minute hand)
        const minuteAngle = (m * Math.PI / 30);
        ctx.save();
        ctx.rotate(minuteAngle);
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -radius * 0.75);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#3b82f6'; // 파란색
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // 중심점
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#374151';
        ctx.fill();

        ctx.restore();
    }

    function drawCatch(ts) {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.1);
        const t0 = STATE.catchStart || (STATE.catchStart = ts);
        const totalElapsed = ts - t0;

        const tgt = STATE.newTiniping;
        if (!tgt) return;

        // 3단계 애니메이션
        const stage1Duration = 1200;
        const stage2Duration = 800;
        const stage2Start = stage1Duration;
        const stage3Start = stage1Duration + stage2Duration;

        let stage = 1;
        let stageProgress = 0;

        if (totalElapsed < stage1Duration) {
            stage = 1;
            stageProgress = totalElapsed / stage1Duration;
        } else if (totalElapsed < stage3Start) {
            stage = 2;
            stageProgress = (totalElapsed - stage2Start) / stage2Duration;
        } else {
            stage = 3;
            stageProgress = 1;
        }

        const cx = W / 2;
        const baseR = 120;
        let cy, imageSize;

        if (stage === 1) {
            cy = H / 2 - 20;
            const scale = 0.6 + 0.4 * stageProgress;
            imageSize = Math.round(200 * scale * SCALE);

            CTX.save();
            CTX.translate(cx, cy);
            CTX.beginPath();
            CTX.arc(0, 0, baseR * scale + 10 * Math.sin(stageProgress * 8), 0, Math.PI * 2);
            CTX.fillStyle = '#ffffff';
            CTX.shadowColor = 'rgba(255,120,200,0.6)';
            CTX.shadowBlur = 30;
            CTX.fill();
            CTX.restore();

            if (tgt.imageObj) {
                CTX.drawImage(tgt.imageObj, cx - imageSize / 2, cy - imageSize / 2, imageSize, imageSize);
            }

            CTX.fillStyle = '#9333ea';
            CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.globalAlpha = stageProgress;
            CTX.fillText('태희가 캐치 성공!', cx, H - Math.round(100 * SCALE));
            CTX.globalAlpha = 1;

        } else if (stage === 2) {
            const startY = H / 2 - 20;
            const endY = Math.round(180 * SCALE);
            const easeProgress = 1 - Math.pow(1 - stageProgress, 3);
            cy = startY + (endY - startY) * easeProgress;
            imageSize = Math.round(200 * SCALE);

            CTX.save();
            CTX.translate(cx, cy);
            CTX.beginPath();
            CTX.arc(0, 0, baseR, 0, Math.PI * 2);
            CTX.fillStyle = '#ffffff';
            CTX.shadowColor = 'rgba(255,120,200,0.6)';
            CTX.shadowBlur = 30;
            CTX.fill();
            CTX.restore();

            if (tgt.imageObj) {
                CTX.drawImage(tgt.imageObj, cx - imageSize / 2, cy - imageSize / 2, imageSize, imageSize);
            }

        } else {
            cy = Math.round(180 * SCALE);
            imageSize = Math.round(200 * SCALE);

            CTX.save();
            CTX.translate(cx, cy);
            CTX.beginPath();
            CTX.arc(0, 0, baseR, 0, Math.PI * 2);
            CTX.fillStyle = '#ffffff';
            CTX.shadowColor = 'rgba(255,120,200,0.4)';
            CTX.shadowBlur = 20;
            CTX.fill();
            CTX.restore();

            if (tgt.imageObj) {
                CTX.drawImage(tgt.imageObj, cx - imageSize / 2, cy - imageSize / 2, imageSize, imageSize);
            }

            drawEncyclopediaCard(cx, cy + baseR + 20, tgt);

            const bw = Math.max(200, Math.round(240 * SCALE));
            const bh = Math.max(50, Math.round(56 * SCALE));
            const bx = cx - bw / 2;
            const by = H - Math.round(80 * SCALE);

            CTX.save();
            roundRect(CTX, bx, by, bw, bh, Math.round(14 * SCALE));
            const gr = CTX.createLinearGradient(bx, by, bx + bw, by + bh);
            gr.addColorStop(0, '#f472b6');
            gr.addColorStop(1, '#8b5cf6');
            CTX.fillStyle = gr;
            CTX.shadowColor = 'rgba(244, 114, 182, 0.3)';
            CTX.shadowBlur = Math.round(10 * SCALE);
            CTX.fill();
            CTX.restore();

            CTX.fillStyle = '#ffffff';
            CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.textBaseline = 'middle';
            CTX.fillText('컬렉션에 담기', cx, by + bh / 2);
            CTX.textBaseline = 'alphabetic';
            STATE.hitboxes.push({ id: 'btn_catch_ok', x: bx, y: by, w: bw, h: bh });
        }
    }

    function drawCollection() {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.1);

        CTX.fillStyle = '#ec4899';
        CTX.font = `bold ${Math.round(26 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'left';
        CTX.fillText('태희의 티니핑 컬렉션', Math.round(24 * SCALE), Math.round(46 * SCALE));

        CTX.fillStyle = '#6b7280';
        CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`수집: ${STATE.caughtIds.length} / ${TINIPINGS.length}`, Math.round(24 * SCALE), Math.round(70 * SCALE));

        // 닫기 버튼
        const bw = Math.max(90, Math.round(110 * SCALE));
        const bh = Math.max(40, Math.round(48 * SCALE));
        const bx = W - bw - Math.round(24 * SCALE);
        const by = Math.round(24 * SCALE);

        CTX.save();
        roundRect(CTX, bx, by, bw, bh, Math.round(10 * SCALE));
        CTX.fillStyle = '#e5e7eb';
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#111827';
        CTX.font = `bold ${Math.round(18 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('닫기', bx + bw / 2, by + bh / 2);
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: 'btn_close_collection', x: bx, y: by, w: bw, h: bh });

        // 탭 버튼 영역
        const tabs = ['전체', '수와 연산', '도형과 측정', '규칙성', '자료와 가능성'];
        const tabY = Math.round(90 * SCALE);
        const tabH = Math.round(40 * SCALE);
        const tabGap = Math.round(8 * SCALE);
        const totalTabW = W - Math.round(48 * SCALE);
        const tabW = (totalTabW - (tabs.length - 1) * tabGap) / tabs.length;

        tabs.forEach((tab, i) => {
            const tx = Math.round(24 * SCALE) + i * (tabW + tabGap);
            const isSelected = (STATE.collectionTab || '전체') === tab;

            CTX.save();
            roundRect(CTX, tx, tabY, tabW, tabH, 10);
            CTX.fillStyle = isSelected ? '#ec4899' : '#f3f4f6';
            CTX.fill();
            if (!isSelected) {
                CTX.strokeStyle = '#e5e7eb';
                CTX.lineWidth = 1;
                CTX.stroke();
            }
            CTX.restore();

            CTX.fillStyle = isSelected ? '#ffffff' : '#4b5563';
            CTX.font = `bold ${Math.round(14 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.textBaseline = 'middle';
            CTX.fillText(tab, tx + tabW / 2, tabY + tabH / 2);
            CTX.textBaseline = 'alphabetic';

            STATE.hitboxes.push({ id: `tab_${tab}`, x: tx, y: tabY, w: tabW, h: tabH });
        });

        // 그리드 영역
        const gridX = Math.round(24 * SCALE);
        const gridY = tabY + tabH + Math.round(20 * SCALE);
        const minCellW = Math.max(70, Math.round(80 * SCALE));
        const cols = Math.max(3, Math.min(8, Math.floor((W - Math.round(48 * SCALE)) / minCellW)));
        const cellW = Math.floor((W - Math.round(48 * SCALE)) / cols);
        const cellH = Math.max(100, Math.round(120 * SCALE));
        const pad = Math.round(10 * SCALE);

        // 필터링된 티니핑 목록
        const targetTab = STATE.collectionTab || '전체';
        const filteredTinipings = targetTab === '전체'
            ? TINIPINGS
            : TINIPINGS.filter(t => t.domain === targetTab);

        CTX.textAlign = 'center';

        filteredTinipings.forEach((tp, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const cx = gridX + col * cellW;
            const cy = gridY + row * cellH;

            const isCaught = STATE.caughtIds.includes(tp.id);

            CTX.save();
            roundRect(CTX, cx + pad, cy + pad, cellW - pad * 2, cellH - pad * 2, Math.round(10 * SCALE));
            if (isCaught) {
                CTX.fillStyle = '#ffffff';
                CTX.shadowColor = 'rgba(0,0,0,0.05)';
                CTX.shadowBlur = 4;
            } else {
                CTX.fillStyle = '#f3f4f6';
            }
            CTX.fill();
            CTX.restore();

            const imgSize = Math.min(cellW, cellH) * 0.5;
            const imgX = cx + cellW / 2 - imgSize / 2;
            const imgY = cy + pad * 2;

            if (isCaught && tp.imageObj) {
                CTX.drawImage(tp.imageObj, imgX, imgY, imgSize, imgSize);
            } else {
                // 미획득 시 실루엣 또는 물음표
                CTX.fillStyle = '#d1d5db';
                CTX.beginPath();
                CTX.arc(cx + cellW / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
                CTX.fill();
                CTX.fillStyle = '#9ca3af';
                CTX.font = `bold ${Math.round(24 * SCALE)}px sans-serif`;
                CTX.fillText('?', cx + cellW / 2, imgY + imgSize / 2 + Math.round(8 * SCALE));
            }

            CTX.fillStyle = isCaught ? '#1f2937' : '#9ca3af';
            CTX.font = `${Math.round(12 * SCALE)}px Jua, sans-serif`;
            CTX.fillText(tp.name, cx + cellW / 2, cy + cellH - pad * 2);
        });
    }

    function drawComplete() {
        const { W, H } = clear();
        drawBackgroundTiles(W, H, 0.1);

        const cw = Math.min(Math.round(600 * SCALE), W - Math.round(48 * SCALE));
        const ch = Math.max(280, Math.round(320 * SCALE));
        const cx = (W - cw) / 2;
        const cy = (H - ch) / 2;

        CTX.save();
        roundRect(CTX, cx, cy, cw, ch, Math.round(24 * SCALE));
        CTX.fillStyle = '#ffffff';
        CTX.shadowColor = 'rgba(0, 0, 0, 0.1)';
        CTX.shadowBlur = Math.round(20 * SCALE);
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#10b981';
        CTX.font = `bold ${Math.round(32 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.fillText('축하해 태희야! 100문제 완료!', cx + cw / 2, cy + Math.round(60 * SCALE));

        CTX.fillStyle = '#111827';
        CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`태희의 최종 점수: ${STATE.score}점`, cx + cw / 2, cy + Math.round(110 * SCALE));
        CTX.fillText(`태희가 획득한 티니핑: ${STATE.caughtIds.length}개`, cx + cw / 2, cy + Math.round(146 * SCALE));

        const bw = Math.max(200, Math.min(Math.round(280 * SCALE), cw * 0.8));
        const bh = Math.max(50, Math.round(56 * SCALE));
        const bx = cx + (cw - bw) / 2;
        const by = cy + ch - Math.round(84 * SCALE);

        CTX.save();
        roundRect(CTX, bx, by, bw, bh, Math.round(14 * SCALE));
        CTX.fillStyle = '#ef4444';
        CTX.shadowColor = 'rgba(239, 68, 68, 0.3)';
        CTX.shadowBlur = Math.round(10 * SCALE);
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
        CTX.textBaseline = 'middle';
        CTX.fillText('태희야, 처음부터 다시 도전!', bx + bw / 2, by + bh / 2);
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: 'btn_reset', x: bx, y: by, w: bw, h: bh });
    }

    /* =========================================================================
       상태 천이 & 로직
       ========================================================================= */
    function ensureProblem() {
        if (!STATE.problem) STATE.problem = genProblem(STATE.difficulty);
    }

    function checkAnswer() {
        if (STATE.selected == null) return;
        const correct = STATE.selected === STATE.problem.answer;
        STATE.isCorrect = correct;
        STATE.mode = 'explain';
        if (correct) {
            STATE.score += 1;
            STATE.consecutiveCorrect += 1;
            const threshold = Math.floor((STATE.caughtIds.length + 1) * 3.5);
            const canCatchMore = STATE.caughtIds.length < TINIPINGS.length;

            if (STATE.score >= threshold && canCatchMore) {
                // 현재 문제의 영역에 맞는 티니핑 필터링
                let targetDomain = '수와 연산'; // 기본값
                const topic = STATE.currentCurriculum;

                if (topic.includes('도형') || topic.includes('측정') || topic.includes('시계') || topic.includes('길이')) targetDomain = '도형과 측정';
                else if (topic.includes('규칙') || topic.includes('수열')) targetDomain = '규칙성';
                else if (topic.includes('자료') || topic.includes('그래프') || topic.includes('표')) targetDomain = '자료와 가능성';

                // 해당 영역의 미획득 티니핑 찾기
                let avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id) && t.domain === targetDomain);

                // 만약 해당 영역 티니핑을 다 모았으면 다른 영역에서 찾기
                if (avail.length === 0) {
                    avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id));
                }

                if (avail.length > 0) {
                    // 랜덤 선택
                    STATE.newTiniping = avail[Math.floor(Math.random() * avail.length)];
                }
            } else {
                STATE.newTiniping = null;
            }
        } else {
            STATE.consecutiveCorrect = 0;
            STATE.newTiniping = null;
        }
        saveState();
    }

    function afterExplainNext() {
        if (STATE.confirmed === false) {
            STATE.selected = null;
            STATE.isCorrect = null;
            STATE.confirmed = null;
            STATE.mode = 'quiz';
            saveState();
            return;
        }

        if (STATE.isCorrect) {
            if (STATE.difficulty < 19) STATE.difficulty += 1;
        } else {
            if (STATE.difficulty > 2) STATE.difficulty -= 1;
        }

        if (STATE.newTiniping) {
            STATE.mode = 'catch';
            STATE.catchStart = 0;
        } else {
            gotoNextQuestion();
        }
        saveState();
    }

    function gotoNextQuestion() {
        STATE.totalQuestions += 1;
        if (STATE.totalQuestions >= 100) {
            STATE.mode = 'complete';
            saveState();
            return;
        }
        STATE.questionIndex += 1;
        STATE.problem = genProblem(STATE.difficulty);
        STATE.selected = null;
        STATE.isCorrect = null;
        STATE.confirmed = null;
        STATE.mode = 'quiz';
        saveState();
    }

    function confirmSolve(val) {
        STATE.confirmed = val;
    }

    function catchConfirm() {
        if (STATE.newTiniping) {
            STATE.caughtIds.push(STATE.newTiniping.id);
            saveTinipingToDB(STATE.newTiniping.id, STATE.newTiniping.name);
        }
        STATE.newTiniping = null;
        gotoNextQuestion();
    }

    function resetAll() {
        localStorage.removeItem(LS_KEY);
        STATE = {
            mode: 'map',
            questionIndex: 0,
            totalQuestions: 0,
            score: 0,
            difficulty: 2,
            consecutiveCorrect: 0,
            caughtIds: [],
            usedProblems: [],
            problem: null,
            selected: null,
            isCorrect: null,
            confirmed: null,
            catchStart: 0,
            newTiniping: null,
            hitboxes: [],
            currentCurriculum: 'division',
            mapSelection: { grade: null, subGrade: null, domain: null },
            collectionTab: '전체'
        };
        saveState();
    }

    /* =========================================================================
       입력 처리(클릭/터치)
       ========================================================================= */
    function getCanvasPos(evt) {
        const rect = CANVAS.getBoundingClientRect();
        const x = (evt.clientX - rect.left);
        const y = (evt.clientY - rect.top);
        const scaleX = CANVAS.width / rect.width / DPR;
        const scaleY = CANVAS.height / rect.height / DPR;
        return { x: x * scaleX, y: y * scaleY };
    }

    function hit(x, y, box) {
        return x >= box.x && y >= box.y && x <= box.x + box.w && y <= box.y + box.h;
    }

    function onPointer(evt) {
        const { x, y } = getCanvasPos(evt);
        for (const b of STATE.hitboxes) {
            if (hit(x, y, b)) {
                if (b.disabled) return;
                switch (b.id) {
                    case 'btn_map_home':
                        STATE.mapSelection = { grade: null, subGrade: null, domain: null };
                        break;
                    case 'btn_start_game':
                        STATE.mode = 'map';
                        break;
                    case 'btn_collection':
                        STATE.mode = 'collection';
                        break;
                    case 'btn_close_collection':
                        STATE.mode = STATE.problem ? 'quiz' : 'map';
                        break;
                    case 'btn_check':
                        checkAnswer();
                        break;
                    case 'btn_next':
                        afterExplainNext();
                        break;
                    case 'confirm_yes':
                        confirmSolve(true);
                        break;
                    case 'confirm_no':
                        confirmSolve(false);
                        break;
                    case 'btn_catch_ok':
                        catchConfirm();
                        break;
                    case 'btn_reset':
                        resetAll();
                        break;
                    default:
                        if (b.id.startsWith('grade_')) {
                            STATE.mapSelection.grade = b.id.replace('grade_', '');
                        } else if (b.id.startsWith('subgrade_')) {
                            STATE.mapSelection.subGrade = b.id.replace('subgrade_', '');
                        } else if (b.id.startsWith('topic_')) {
                            const topic = b.id.replace('topic_', '');
                            console.log('선택된 토픽:', topic);
                            STATE.currentCurriculum = topic;
                            STATE.mode = 'quiz';
                            STATE.questionIndex = 0;
                            STATE.score = 0;
                            STATE.caughtIds = [];
                            ensureProblem();
                        } else if (b.id.startsWith('opt_')) {
                            STATE.selected = b.value;
                        } else if (b.id.startsWith('tab_')) {
                            STATE.collectionTab = b.id.replace('tab_', '');
                        }
                }
                break;
            }
        }
    }

    function onTouch(evt) {
        evt.preventDefault();
        if (evt.type === 'touchend' && evt.changedTouches.length > 0) {
            const touch = evt.changedTouches[0];
            const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY };
            onPointer(fakeEvt);
        }
    }

    CANVAS.addEventListener('click', onPointer);
    CANVAS.addEventListener('touchend', onTouch);

    /* =========================================================================
       게임 루프
       ========================================================================= */
    let lastMode = null;

    function frame(ts) {
        setHiDPI();

        if (lastMode !== STATE.mode) {
            window.scrollTo(0, 0);
            lastMode = STATE.mode;
        }

        if (!STATE.problem && STATE.mode === 'quiz') ensureProblem();

        if (STATE.mode === 'home') drawHome();
        else if (STATE.mode === 'map') drawMap();
        else if (STATE.mode === 'quiz') drawQuiz();
        else if (STATE.mode === 'explain') drawExplain();
        else if (STATE.mode === 'catch') drawCatch(ts);
        else if (STATE.mode === 'collection') drawCollection();
        else if (STATE.mode === 'complete') drawComplete();

        requestAnimationFrame(frame);
    }

    /* =========================================================================
       초기화
       ========================================================================= */
    loadState();

    Promise.all([
        document.fonts.ready,
        loadTinipingImages(),
        loadCurriculumData()
    ]).then(() => {
        console.log('모든 리소스 로드 완료');
        loadEncyclopedia();
        window.scrollTo(0, 0);
        requestAnimationFrame(frame);
    }).catch(err => {
        console.error('초기화 실패:', err);
        window.scrollTo(0, 0);
        requestAnimationFrame(frame);
    });
