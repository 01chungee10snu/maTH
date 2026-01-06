# -*- coding: utf-8 -*-
"""
PDF 구조 분석 스크립트
- 페이지 구조, 텍스트 블록, 벡터 그래픽(선) 요소 분석
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import fitz  # PyMuPDF
import json
from collections import defaultdict

PDF_PATH = "2024 에듀왕 수학계통도.pdf"

def analyze_pdf_structure(pdf_path):
    doc = fitz.open(pdf_path)

    print("=" * 60)
    print("PDF 기본 정보")
    print("=" * 60)
    print(f"총 페이지 수: {len(doc)}")
    print(f"메타데이터: {doc.metadata}")
    print()

    # 샘플 페이지 분석 (처음 3페이지)
    sample_pages = min(3, len(doc))

    for page_num in range(sample_pages):
        page = doc[page_num]
        print("=" * 60)
        print(f"페이지 {page_num + 1} 분석")
        print("=" * 60)
        print(f"페이지 크기: {page.rect.width} x {page.rect.height}")

        # 1. 텍스트 블록 분석
        text_dict = page.get_text("dict")
        blocks = text_dict.get("blocks", [])

        text_blocks = [b for b in blocks if b.get("type") == 0]  # type 0 = text
        image_blocks = [b for b in blocks if b.get("type") == 1]  # type 1 = image

        print(f"\n[텍스트 블록]: {len(text_blocks)}개")
        print(f"[이미지 블록]: {len(image_blocks)}개")

        # 텍스트 샘플 출력 (처음 10개)
        print("\n--- 텍스트 블록 샘플 (위치 포함) ---")
        for i, block in enumerate(text_blocks[:10]):
            bbox = block.get("bbox", [])
            lines = block.get("lines", [])
            text_content = ""
            for line in lines:
                for span in line.get("spans", []):
                    text_content += span.get("text", "")
            if text_content.strip():
                print(f"  [{i+1}] 위치: ({bbox[0]:.1f}, {bbox[1]:.1f}) - ({bbox[2]:.1f}, {bbox[3]:.1f})")
                print(f"      내용: {text_content[:80]}")

        # 2. 벡터 그래픽 (선, 곡선) 분석
        print("\n--- 벡터 그래픽 요소 분석 ---")
        drawings = page.get_drawings()
        print(f"총 드로잉 요소: {len(drawings)}개")

        # 드로잉 타입별 분류
        drawing_types = defaultdict(int)
        line_count = 0
        curve_count = 0
        rect_count = 0

        for drawing in drawings:
            items = drawing.get("items", [])
            for item in items:
                item_type = item[0]  # 'l' = line, 'c' = curve, 're' = rect, etc.
                drawing_types[item_type] += 1
                if item_type == 'l':
                    line_count += 1
                elif item_type == 'c':
                    curve_count += 1
                elif item_type == 're':
                    rect_count += 1

        print(f"  - 직선(line): {line_count}개")
        print(f"  - 곡선(curve): {curve_count}개")
        print(f"  - 사각형(rect): {rect_count}개")
        print(f"  - 전체 타입 분포: {dict(drawing_types)}")

        # 선 샘플 출력
        if drawings:
            print("\n--- 선 요소 샘플 (처음 5개) ---")
            line_samples = 0
            for drawing in drawings[:20]:
                if line_samples >= 5:
                    break
                items = drawing.get("items", [])
                for item in items:
                    if item[0] == 'l' and line_samples < 5:
                        # item = ('l', start_point, end_point)
                        print(f"  선 {line_samples+1}: {item[1]} -> {item[2]}")
                        line_samples += 1

        # 3. 전체 텍스트 추출 테스트
        full_text = page.get_text()
        print(f"\n--- 페이지 전체 텍스트 길이: {len(full_text)} 문자 ---")
        print("텍스트 미리보기 (처음 1000자):")
        print(full_text[:1000])
        print("\n")

    doc.close()
    return

def analyze_connections(pdf_path, page_num=0):
    """
    텍스트 블록과 선의 연결 관계 분석
    """
    doc = fitz.open(pdf_path)
    page = doc[page_num]

    print("=" * 60)
    print(f"페이지 {page_num + 1} - 연결 관계 분석")
    print("=" * 60)

    # 텍스트 블록 위치 수집
    text_dict = page.get_text("dict")
    text_blocks = []
    for block in text_dict.get("blocks", []):
        if block.get("type") == 0:
            bbox = block.get("bbox")
            text = ""
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text += span.get("text", "")
            if text.strip():
                text_blocks.append({
                    "bbox": bbox,
                    "center": ((bbox[0] + bbox[2])/2, (bbox[1] + bbox[3])/2),
                    "text": text.strip()[:30]
                })

    # 선 위치 수집
    drawings = page.get_drawings()
    lines = []
    for drawing in drawings:
        for item in drawing.get("items", []):
            if item[0] == 'l':
                lines.append({
                    "start": item[1],
                    "end": item[2]
                })

    print(f"텍스트 블록: {len(text_blocks)}개")
    print(f"선 요소: {len(lines)}개")

    # 선과 텍스트 블록의 근접성 분석 (샘플)
    print("\n--- 선과 텍스트 연결 분석 (샘플) ---")

    def point_near_bbox(point, bbox, threshold=20):
        """점이 bbox 근처에 있는지 확인"""
        x, y = point
        return (bbox[0] - threshold <= x <= bbox[2] + threshold and
                bbox[1] - threshold <= y <= bbox[3] + threshold)

    connection_samples = 0
    for line in lines[:100]:
        if connection_samples >= 15:
            break
        start_near = []
        end_near = []
        for tb in text_blocks:
            if point_near_bbox(line["start"], tb["bbox"]):
                start_near.append(tb["text"])
            if point_near_bbox(line["end"], tb["bbox"]):
                end_near.append(tb["text"])

        if start_near and end_near:
            print(f"  연결: {start_near} <---> {end_near}")
            connection_samples += 1

    doc.close()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("PDF 구조 분석 시작")
    print("=" * 60 + "\n")

    analyze_pdf_structure(PDF_PATH)

    print("\n" + "=" * 60)
    print("연결 관계 분석")
    print("=" * 60 + "\n")

    analyze_connections(PDF_PATH, page_num=0)
