# -*- coding: utf-8 -*-
"""
OCR 결과와 PDF 벡터 요소를 결합하여 계통도 구조 분석
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import fitz  # PyMuPDF
import json
from collections import defaultdict

PDF_PATH = "2024 에듀왕 수학계통도.pdf"
OCR_JSON = "ocr_results.json"
OUTPUT_STRUCTURED = "structured_data.json"

def load_ocr_results():
    """OCR 결과 로드"""
    with open(OCR_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_adjacent_texts(ocr_results, x_threshold=5, y_threshold=3):
    """
    인접한 텍스트들을 병합
    - x_threshold: 같은 줄로 판단하는 X 간격 (PDF 좌표 기준)
    - y_threshold: 같은 줄로 판단하는 Y 허용 오차
    """
    # 신뢰도 50 이상만 필터링
    filtered = [r for r in ocr_results if r["confidence"] > 40]

    # Y 좌표로 정렬 후 그룹화
    filtered.sort(key=lambda x: (round(x["pdf_coords"]["y"] / y_threshold), x["pdf_coords"]["x"]))

    merged_texts = []
    current_line = []
    current_y = None

    for item in filtered:
        y = round(item["pdf_coords"]["y"] / y_threshold)

        if current_y is None or y != current_y:
            # 새 줄 시작
            if current_line:
                merged_texts.append(merge_line(current_line, x_threshold))
            current_line = [item]
            current_y = y
        else:
            current_line.append(item)

    # 마지막 줄 처리
    if current_line:
        merged_texts.append(merge_line(current_line, x_threshold))

    # 2D 리스트를 1D로 펼침
    result = []
    for line in merged_texts:
        result.extend(line)

    return result

def merge_line(line_items, x_threshold):
    """한 줄 내에서 인접한 텍스트 병합"""
    if not line_items:
        return []

    line_items.sort(key=lambda x: x["pdf_coords"]["x"])

    merged = []
    current_group = [line_items[0]]

    for item in line_items[1:]:
        prev = current_group[-1]
        prev_end_x = prev["pdf_coords"]["x"] + prev["pdf_coords"]["width"]
        curr_start_x = item["pdf_coords"]["x"]

        # X 간격이 threshold 이하면 같은 그룹
        if curr_start_x - prev_end_x <= x_threshold:
            current_group.append(item)
        else:
            merged.append(combine_group(current_group))
            current_group = [item]

    # 마지막 그룹 처리
    merged.append(combine_group(current_group))

    return merged

def combine_group(group):
    """그룹 내 텍스트들을 하나로 합침"""
    if len(group) == 1:
        return {
            "text": group[0]["text"],
            "pdf_coords": group[0]["pdf_coords"],
            "confidence": group[0]["confidence"]
        }

    combined_text = "".join(item["text"] for item in group)
    min_x = min(item["pdf_coords"]["x"] for item in group)
    min_y = min(item["pdf_coords"]["y"] for item in group)
    max_x = max(item["pdf_coords"]["x"] + item["pdf_coords"]["width"] for item in group)
    max_y = max(item["pdf_coords"]["y"] + item["pdf_coords"]["height"] for item in group)
    avg_conf = sum(item["confidence"] for item in group) / len(group)

    return {
        "text": combined_text,
        "pdf_coords": {
            "x": min_x,
            "y": min_y,
            "width": max_x - min_x,
            "height": max_y - min_y
        },
        "confidence": avg_conf
    }

def extract_lines_from_pdf(pdf_path):
    """PDF에서 선(line) 요소 추출"""
    doc = fitz.open(pdf_path)
    page = doc[0]

    drawings = page.get_drawings()
    lines = []

    for drawing in drawings:
        for item in drawing.get("items", []):
            if item[0] == 'l':  # line
                start = item[1]
                end = item[2]
                lines.append({
                    "start": {"x": start.x, "y": start.y},
                    "end": {"x": end.x, "y": end.y},
                    "color": drawing.get("color"),
                    "width": drawing.get("width")
                })

    doc.close()
    return lines

def find_connections(texts, lines, threshold=15):
    """
    텍스트와 선의 연결 관계 분석
    threshold: 선의 끝점과 텍스트 박스 사이의 허용 거리
    """
    connections = []

    def point_near_text(point, text_item, threshold):
        """점이 텍스트 박스 근처에 있는지 확인"""
        coords = text_item["pdf_coords"]
        x1, y1 = coords["x"] - threshold, coords["y"] - threshold
        x2, y2 = coords["x"] + coords["width"] + threshold, coords["y"] + coords["height"] + threshold

        return x1 <= point["x"] <= x2 and y1 <= point["y"] <= y2

    def get_center(text_item):
        """텍스트 박스의 중심점"""
        coords = text_item["pdf_coords"]
        return {
            "x": coords["x"] + coords["width"] / 2,
            "y": coords["y"] + coords["height"] / 2
        }

    for line in lines:
        start_texts = []
        end_texts = []

        for text in texts:
            if point_near_text(line["start"], text, threshold):
                start_texts.append(text["text"])
            if point_near_text(line["end"], text, threshold):
                end_texts.append(text["text"])

        # 시작점과 끝점 모두 텍스트와 연결된 경우만 기록
        if start_texts and end_texts:
            # 자기 자신과의 연결 제외
            if set(start_texts) != set(end_texts):
                connections.append({
                    "from": start_texts,
                    "to": end_texts,
                    "line": {
                        "start": line["start"],
                        "end": line["end"]
                    }
                })

    return connections

def categorize_by_area(texts):
    """
    Y 좌표와 X 좌표를 기준으로 영역별 분류
    수학 계통도 구조: 초등(왼쪽) -> 중등 -> 고등(오른쪽)
    """
    # 영역 경계 추정 (PDF 크기 1190 x 841 기준)
    areas = {
        "header": {"y_range": (0, 120)},
        "elementary_1_2": {"x_range": (0, 200), "y_range": (120, 850)},
        "elementary_3_4": {"x_range": (200, 400), "y_range": (120, 850)},
        "elementary_5_6": {"x_range": (400, 600), "y_range": (120, 850)},
        "middle_school": {"x_range": (600, 850), "y_range": (120, 850)},
        "high_school": {"x_range": (850, 1200), "y_range": (120, 850)}
    }

    categorized = defaultdict(list)

    for text in texts:
        x = text["pdf_coords"]["x"]
        y = text["pdf_coords"]["y"]

        if y < 120:
            categorized["header"].append(text)
        elif x < 200:
            categorized["elementary_1_2"].append(text)
        elif x < 400:
            categorized["elementary_3_4"].append(text)
        elif x < 600:
            categorized["elementary_5_6"].append(text)
        elif x < 850:
            categorized["middle_school"].append(text)
        else:
            categorized["high_school"].append(text)

    return dict(categorized)

def main():
    print("=" * 60)
    print("1단계: OCR 결과 로드 및 병합")
    print("=" * 60)

    ocr_results = load_ocr_results()
    print(f"원본 OCR 항목: {len(ocr_results)}개")

    merged_texts = merge_adjacent_texts(ocr_results, x_threshold=8, y_threshold=5)
    print(f"병합 후 항목: {len(merged_texts)}개")

    # 의미있는 텍스트만 필터링 (2자 이상)
    meaningful_texts = [t for t in merged_texts if len(t["text"]) >= 2]
    print(f"의미있는 텍스트 (2자 이상): {len(meaningful_texts)}개")

    print("\n--- 병합된 텍스트 샘플 (처음 50개) ---")
    sorted_texts = sorted(meaningful_texts, key=lambda x: (x["pdf_coords"]["y"], x["pdf_coords"]["x"]))
    for i, item in enumerate(sorted_texts[:50]):
        print(f"[{i+1}] '{item['text']}' 위치:({item['pdf_coords']['x']:.0f}, {item['pdf_coords']['y']:.0f})")

    print("\n" + "=" * 60)
    print("2단계: PDF에서 선(line) 요소 추출")
    print("=" * 60)

    lines = extract_lines_from_pdf(PDF_PATH)
    print(f"총 선 요소: {len(lines)}개")

    print("\n" + "=" * 60)
    print("3단계: 텍스트-선 연결 관계 분석")
    print("=" * 60)

    connections = find_connections(meaningful_texts, lines, threshold=20)
    print(f"발견된 연결 관계: {len(connections)}개")

    # 중복 제거 및 정리
    unique_connections = []
    seen = set()
    for conn in connections:
        key = (tuple(sorted(conn["from"])), tuple(sorted(conn["to"])))
        if key not in seen:
            seen.add(key)
            unique_connections.append({
                "from": conn["from"],
                "to": conn["to"]
            })

    print(f"고유 연결 관계: {len(unique_connections)}개")

    print("\n--- 연결 관계 샘플 (처음 30개) ---")
    for i, conn in enumerate(unique_connections[:30]):
        print(f"  [{i+1}] {conn['from']} --> {conn['to']}")

    print("\n" + "=" * 60)
    print("4단계: 영역별 분류")
    print("=" * 60)

    categorized = categorize_by_area(meaningful_texts)
    for area, items in categorized.items():
        texts = [item["text"] for item in items[:10]]
        print(f"\n[{area}] ({len(items)}개)")
        print(f"  샘플: {', '.join(texts)}")

    # 결과 저장
    output_data = {
        "texts": meaningful_texts,
        "connections": unique_connections,
        "categorized": {k: [{"text": t["text"], "coords": t["pdf_coords"]} for t in v] for k, v in categorized.items()}
    }

    with open(OUTPUT_STRUCTURED, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장 완료: {OUTPUT_STRUCTURED}")

if __name__ == "__main__":
    main()
