# Money Flow Planner (mmflow)

## 제품 비전
가구 경제를 꾸리는 가계부 및 경제 생활 플래닝 도구.
수입-지출 흐름을 노드-엣지 그래프로 시각화하여 자금 흐름을 직관적으로 설계한다.

## 비즈니스 모델
- 구글 애드센스를 통한 광고 수익화
- 서버 기반 서비스 (회원/인증 필요)

## 기술 스택
- Frontend: React 19 + TypeScript + Vite 7 (SWC)
- 상태관리: Zustand
- 캔버스: @xyflow/react (React Flow)
- 저장: localStorage (시나리오별 x 월별 키 분리, 향후 서버 이전 예정)
- 폰트: Pretendard Variable

## 회의체
이 제품의 개선 방향은 아래 구성원으로 이루어진 가상 회의체를 통해 도출한다.

| 역할 | 책임 |
|------|------|
| PO (Product Owner) | 제품 전략, 비즈니스 가치, 우선순위 결정 |
| PM (Product Manager) | 실행 계획, 스펙 정의, 일정/리소스 관리 |
| UX/UI 디자이너 | 사용자 경험, 인터페이스 설계 |
| 프로덕트 디자이너 | 제품 구조, 정보 설계, 기능 흐름 |

### 회의 원칙
- 각자 고유 전문 분야에 기반한 생산적 + 비판적 의견을 낸다
- 회의 종료 시 항상 통일된 의견과 액션 아이템을 도출한다

## 로드맵 (2026-04-08 킥오프 확정)

### Phase 1: 런칭 MVP
1. 서버 구축 + API 설계
2. 회원가입/로그인 (소셜: Google, Kakao)
3. 클라우드 저장 (localStorage → DB)
4. 랜딩페이지
5. 기본 템플릿 2~3개
6. 애드센스 광고 배치

### Phase 2: 제품 고도화
계획 vs 실적 비교 / 대시보드·차트 / 알림 / 온보딩 튜토리얼 / 비정기 수입·지출 / 목표 달성률

### Phase 3: 확장
모바일 전용 뷰 / 템플릿 공유 갤러리 / 오픈뱅킹 연동 / 다중 가구원 협업 / PWA

## 작업 관리
- TODO.md로 개선 항목 관리 (P0~P5 우선순위)
- meetings/ 폴더에 회의록 관리
- Git 브랜치: read-project-code
- Remote: origin (GitHub: SYMist/mmflow)
