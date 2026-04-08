# Money Flow Planner - TODO

## P0: Bug / 정확성

- [x] `totalIn` 계산이 `income-salary` ID에 300만원 하드코딩 — 모든 수입 노드의 `amount` 합산으로 수정
- [x] 노드 ID 생성이 `nodes.length + 1` 기반 — 삭제 후 재추가 시 ID 충돌 (crypto.randomUUID로 교체)
- [x] `FlowEdge`, `EdgeLabel` 컴포넌트 미사용 — 삭제 완료

- [x] 엣지 비율이 비정상적으로 높게 표시되는 케이스 (927%) — 역방향 연결 시 방향 정규화로 수정

## P1: UX 개선

- [x] DetailPanel 입력 후 "확인" 버튼 필요 — 실시간 반영(onChange)으로 전환
- [x] 엣지에 비율(%)만 표시 — 원화 금액도 함께 표시
- [x] Undo/Redo 미지원 — Ctrl+Z / Ctrl+Shift+Z 단축키 지원 (히스토리 스택 50개)
- [x] 엣지 금액 편집: 선택 → 클릭 2단계 필요 — 더블클릭으로 바로 편집 모드 진입
- [x] 노드 추가 후 바로 이름 편집 모드로 진입
- [x] 키보드 단축키 (Delete/Backspace로 노드·엣지 삭제)

## P2: 성능

- [x] `App.tsx`에 모든 상태 집중 — Zustand 스토어 도입으로 컴포넌트별 선택적 구독
- [x] `FlowCanvas` useEffect에서 매번 전체 노드 배열 재생성 — 변경된 노드만 업데이트 (prevMap 비교)
- [x] `onAddNodeAround` 내부에서 `setEdges`를 `setNodes` 콜백 안에서 호출 — Zustand 단일 set()으로 배치 업데이트

## P3: 디자인

- [x] 노드 색상 고정 — 편집 모드에서 8색 컬러 피커 지원
- [x] 수입/목적지 노드 시각적 구분 — 방향 아이콘(↑↓) + 좌측 색상 바
- [x] 다크모드 — prefers-color-scheme 미디어쿼리 기반 자동 전환
- [x] 빈 상태(노드 0개) 온보딩/가이드 — EmptyState 컴포넌트로 안내

## P4: 데이터 저장 개선

- [x] localStorage 단일 키 → 시나리오별 × 월별 키 분리 저장 구조로 전환 (`mf:{scenarioId}:{month}`)
- [ ] IndexedDB 전환 (localStorage 5MB 제한 해소)
- [x] 다중 시나리오 저장/전환/비교 UI — 시나리오 드롭다운으로 생성/전환/삭제 + 이름 더블클릭 편집
- [x] JSON export/import (백업/복원) — Header에 ↓↑ 버튼으로 내보내기/가져오기

## P5: 기능 확장

- [ ] 비정기 수입/지출 (보너스, 연납 보험 등) 모델링
- [ ] 목적지별 목표 금액 대비 달성률 시각화
