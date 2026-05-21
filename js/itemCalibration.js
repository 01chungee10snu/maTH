/* =========================================================================
   누적 응답 기반 문항 난이도 보정

   운영 초기에는 전문가/생성 기준 난이도(design_b)를 기본값으로 쓰고,
   실제 풀이 로그가 쌓인 문항만 낮은 가중치부터 경험 보정값을 반영합니다.
   ========================================================================= */

const ITEM_CALIBRATION_MIN_ATTEMPTS = 5;
const ITEM_CALIBRATION_FULL_WEIGHT_ATTEMPTS = 50;
const ITEM_CALIBRATION_MAX_WEIGHT = 0.8;
const ITEM_CALIBRATION_P_MIN = 0.08;
const ITEM_CALIBRATION_P_MAX = 0.92;
const ITEM_CALIBRATION_B_MIN = -3;
const ITEM_CALIBRATION_B_MAX = 3;

function clampCalibration(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function roundCalibration(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
}

function logitCalibration(p) {
    const clamped = clampCalibration(Number(p), ITEM_CALIBRATION_P_MIN, ITEM_CALIBRATION_P_MAX);
    return Math.log(clamped / (1 - clamped));
}

function getCalibrationItemId(item) {
    return item?.problem_id || item?.problemKey || item?.id || null;
}

function getCalibrationAttemptItemId(record) {
    return record?.item_id || record?.problem_id || record?.problemKey || null;
}

function getCalibrationDesignB(item) {
    const design = Number(item?.irt?.design_b);
    if (Number.isFinite(design)) return clampCalibration(design, ITEM_CALIBRATION_B_MIN, ITEM_CALIBRATION_B_MAX);

    const current = Number(item?.irt?.b);
    if (Number.isFinite(current)) return clampCalibration(current, ITEM_CALIBRATION_B_MIN, ITEM_CALIBRATION_B_MAX);

    const level = Number(item?.level || 5);
    return clampCalibration((level - 5) / 3, ITEM_CALIBRATION_B_MIN, ITEM_CALIBRATION_B_MAX);
}

function getCalibrationTheta(record) {
    const before = Number(record?.theta_before);
    if (Number.isFinite(before)) return before;
    const after = Number(record?.theta_after);
    if (Number.isFinite(after)) return after;
    return 0;
}

function getCalibrationScore(record) {
    const responseScore = Number(record?.response_score);
    if (Number.isFinite(responseScore)) return clampCalibration(responseScore, 0, 1);
    return record?.correct ? 1 : 0;
}

function averageCalibration(values) {
    const finite = values.map(Number).filter(Number.isFinite);
    if (!finite.length) return 0;
    return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function groupCalibrationAttempts(attempts = []) {
    const groups = new Map();
    (Array.isArray(attempts) ? attempts : []).forEach(record => {
        const itemId = getCalibrationAttemptItemId(record);
        if (!itemId) return;
        if (!groups.has(itemId)) groups.set(itemId, []);
        groups.get(itemId).push(record);
    });
    return groups;
}

function getCalibrationConfidence(attemptCount, minAttempts) {
    if (attemptCount < minAttempts) return 'insufficient';
    if (attemptCount < 15) return 'observing';
    if (attemptCount < 50) return 'provisional';
    return 'stable';
}

function buildInsufficientCalibration(item, itemAttempts, options) {
    const designB = getCalibrationDesignB(item);
    return {
        designB,
        calibratedB: null,
        attemptCount: itemAttempts.length,
        confidence: 'insufficient',
        correctRate: itemAttempts.length
            ? Math.round((itemAttempts.filter(record => record.correct).length / itemAttempts.length) * 100)
            : 0,
        averageResponseScore: itemAttempts.length
            ? roundCalibration(averageCalibration(itemAttempts.map(getCalibrationScore)), 2)
            : 0,
        weight: 0,
        minAttempts: options.minAttempts
    };
}

function estimateItemCalibration(item, itemAttempts = [], options = {}) {
    const settings = {
        minAttempts: Number.isFinite(options.minAttempts) ? options.minAttempts : ITEM_CALIBRATION_MIN_ATTEMPTS,
        fullWeightAttempts: Number.isFinite(options.fullWeightAttempts) ? options.fullWeightAttempts : ITEM_CALIBRATION_FULL_WEIGHT_ATTEMPTS,
        maxWeight: Number.isFinite(options.maxWeight) ? options.maxWeight : ITEM_CALIBRATION_MAX_WEIGHT
    };
    const attempts = Array.isArray(itemAttempts) ? itemAttempts : [];
    const designB = getCalibrationDesignB(item);

    if (attempts.length < settings.minAttempts) {
        return buildInsufficientCalibration(item, attempts, settings);
    }

    const averageTheta = averageCalibration(attempts.map(getCalibrationTheta));
    const averageScore = clampCalibration(averageCalibration(attempts.map(getCalibrationScore)), ITEM_CALIBRATION_P_MIN, ITEM_CALIBRATION_P_MAX);
    const empiricalB = clampCalibration(averageTheta - logitCalibration(averageScore), ITEM_CALIBRATION_B_MIN, ITEM_CALIBRATION_B_MAX);
    const rawWeight = attempts.length / Math.max(settings.fullWeightAttempts, settings.minAttempts, 1);
    const weight = clampCalibration(rawWeight, 0, settings.maxWeight);
    const calibratedB = clampCalibration(
        designB * (1 - weight) + empiricalB * weight,
        ITEM_CALIBRATION_B_MIN,
        ITEM_CALIBRATION_B_MAX
    );
    const correctRate = attempts.filter(record => record.correct).length / attempts.length;

    return {
        designB: roundCalibration(designB, 2),
        calibratedB: roundCalibration(calibratedB, 2),
        empiricalB: roundCalibration(empiricalB, 2),
        averageTheta: roundCalibration(averageTheta, 2),
        averageResponseScore: roundCalibration(averageScore, 2),
        correctRate: Math.round(correctRate * 100),
        attemptCount: attempts.length,
        confidence: getCalibrationConfidence(attempts.length, settings.minAttempts),
        weight: roundCalibration(weight, 2),
        minAttempts: settings.minAttempts
    };
}

function applyCalibrationToItem(item, itemAttempts = [], options = {}) {
    if (!item) return null;
    item.irt = item.irt || { model: 'rasch' };
    const estimate = estimateItemCalibration(item, itemAttempts, options);
    item.irt.design_b = estimate.designB;

    if (estimate.confidence === 'insufficient' || estimate.calibratedB === null) {
        delete item.irt.calibrated_b;
        item.irt.calibration = {
            confidence: 'insufficient',
            attemptCount: estimate.attemptCount,
            minAttempts: estimate.minAttempts,
            correctRate: estimate.correctRate,
            averageResponseScore: estimate.averageResponseScore
        };
        return estimate;
    }

    item.irt.calibrated_b = estimate.calibratedB;
    item.irt.calibration = {
        confidence: estimate.confidence,
        attemptCount: estimate.attemptCount,
        correctRate: estimate.correctRate,
        averageResponseScore: estimate.averageResponseScore,
        empiricalB: estimate.empiricalB,
        weight: estimate.weight,
        updatedAt: new Date().toISOString()
    };
    return estimate;
}

function applyCalibrationToBank(itemBank = [], attempts = [], options = {}) {
    const bank = Array.isArray(itemBank) ? itemBank : [];
    const attemptGroups = groupCalibrationAttempts(attempts);
    let usableCount = 0;
    let insufficientCount = 0;
    let stableCount = 0;
    let attemptedItemCount = 0;

    bank.forEach(item => {
        const itemId = getCalibrationItemId(item);
        const itemAttempts = itemId ? (attemptGroups.get(itemId) || []) : [];
        if (itemAttempts.length) attemptedItemCount += 1;
        const estimate = applyCalibrationToItem(item, itemAttempts, options);
        if (!estimate) return;
        if (estimate.confidence === 'insufficient') {
            insufficientCount += 1;
        } else {
            usableCount += 1;
            if (estimate.confidence === 'stable') stableCount += 1;
        }
    });

    return {
        itemCount: bank.length,
        attemptedItemCount,
        usableCount,
        calibratedCount: usableCount,
        insufficientCount,
        stableCount,
        minAttempts: Number.isFinite(options.minAttempts) ? options.minAttempts : ITEM_CALIBRATION_MIN_ATTEMPTS,
        updatedAt: new Date().toISOString()
    };
}

function summarizeCalibration(itemBank = []) {
    const bank = Array.isArray(itemBank) ? itemBank : [];
    const calibrated = bank.filter(item => (
        Number.isFinite(Number(item?.irt?.calibrated_b))
        && item?.irt?.calibration?.confidence
        && item.irt.calibration.confidence !== 'insufficient'
    ));
    const insufficient = bank.filter(item => item?.irt?.calibration?.confidence === 'insufficient');
    const observed = bank.filter(item => Number(item?.irt?.calibration?.attemptCount || 0) > 0);
    const stable = calibrated.filter(item => item?.irt?.calibration?.confidence === 'stable');
    const parentText = calibrated.length
        ? `응답 기록이 충분한 ${calibrated.length}개 문항은 실제 풀이 결과를 반영해 문항 난이도를 보정했습니다. 나머지 문항은 설계 난이도를 함께 사용합니다.`
        : '아직 문항별 응답 기록이 부족해 설계 난이도를 중심으로 맞춤 출제를 진행합니다.';

    return {
        itemCount: bank.length,
        observedItemCount: observed.length,
        calibratedCount: calibrated.length,
        usableCount: calibrated.length,
        insufficientCount: insufficient.length,
        stableCount: stable.length,
        parentText
    };
}

window.ItemCalibration = {
    applyToBank: applyCalibrationToBank,
    applyToItem: applyCalibrationToItem,
    estimate: estimateItemCalibration,
    summarize: summarizeCalibration
};

globalThis.ItemCalibration = window.ItemCalibration;
