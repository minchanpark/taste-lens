# 취향렌즈(Taste Lens) Product Requirements Document

**Document Type:** Product Requirements Document  
**Product Stage:** Proof of Concept / MVP  
**Primary Environment:** Timely AI Prototype  
**AI Model:** Solar Pro 4  
**Version:** v1.2  
**Status:** Draft for MVP Development

---

# 0. 요약

## 0.1 제품 한 줄 정의

**취향렌즈(Taste Lens)**는 사용자의 음식 취향과 음식을 동일한 **6차원 Taste Space**에 표현한 뒤, 사용자가 지금 먹고 싶어 할 가능성이 높은 **음식 자체를 먼저 추천하고 그다음 해당 음식 중 취향에 가장 가까운 식당을 연결하는 음식 중심 개인화 추천 시스템**이다.

기존 배달 서비스의 대표적인 탐색 흐름이

> 카테고리 → 식당 → 메뉴

라면 취향렌즈는

> **취향 → 음식 → 식당**

이라는 새로운 탐색 경로를 제공한다.

---

## 0.2 해결하려는 핵심 문제

배달앱에서 사용자는 수많은 식당과 메뉴를 볼 수 있지만 실제로 자주 마주치는 첫 번째 문제는

> **“어디에서 주문할까?”**

보다

> **“오늘 뭘 먹지?”**

이다.

현재 배달앱의 음식 탐색은 주로 **평점, 가까운 순, 가격·배달비, 주문량, 인기순** 등 식당이나 거래 조건 중심의 기준으로 이루어진다. 이러한 기준은 사용자가 빠르게 식당을 고르는 데는 유용하지만,

> **“이 음식의 맛이 실제로 내 입맛과 얼마나 잘 맞는가?”**

를 직접 설명하지는 못한다.

예를 들어 평점이 4.9점인 식당이라도 사용자가 단맛이 강한 음식을 싫어한다면 해당 메뉴는 개인에게 좋은 선택이 아닐 수 있다. 반대로 전체 평점이 상대적으로 낮더라도 특정 사용자의 매운맛·감칠맛 선호와 잘 맞는 메뉴라면 개인에게는 더 적합한 선택일 수 있다.

기존 추천 시스템은 사용자의 과거 주문·클릭·식당 이용 이력 등을 활용해 **사용자와 아이템 간 선택 가능성**을 예측하는 데 강점이 있다.

취향렌즈는 이보다 앞단에서

> **사용자는 어떤 맛 강도의 음식을 좋아하는가?**

를 구조화하고 음식 자체의 맛 프로필과 비교한다.

---

## 0.3 핵심 가설

본 제품은 다음 세 가지 가설을 검증한다.

### H1. Taste Representation Hypothesis

사용자와 음식을 동일한 6차원 Taste Space에 표현하면 사용자의 음식 선택을 일정 수준 예측할 수 있다.

### H2. Lightweight Cold Start Hypothesis

약 10회의 음식 Pairwise Choice만으로 초기 개인 취향 벡터를 생성하여 추천을 시작할 수 있다.

### H3. Restaurant Taste Differentiation Hypothesis

같은 음식이라도 리뷰에서 추출한 상대적 맛 표현을 이용하면 식당별 Taste Vector를 차등 조정하고 같은 음식 내 식당을 개인 취향에 따라 재정렬할 수 있다.

---

## 0.4 6차원 Taste Space

모든 Food/User/Restaurant Menu 데이터는 다음 좌표계를 공유한다.

| Dimension | 의미 |
|---|---|
| Sweet | 단맛 |
| Salty | 짠맛 |
| Sour | 신맛 |
| Umami | 감칠맛 |
| Spicy | 매운맛 |
| Nutty | 고소함 |

\[
X=[Sweet,Salty,Sour,Umami,Spicy,Nutty]
\]

각 Dimension은 `0~1` 범위로 정규화한다.

---

## 0.5 MVP 범위

### 구현

| 영역 | MVP |
|---|---|
| Food Vector | 20~30개 대표 음식 수동 Seed Vector |
| 초기 취향 | 약 10회 Pairwise Choice |
| User Vector | 6차원 선호 강도 벡터 |
| 추천 | Distance 기반 Food Ranking |
| Context | 주소지·시간대·날씨 API 정보 |
| User Update | 주문·재주문 기반 Batch Update |
| 리뷰 AI | Solar Pro 4 기반 Taste Evidence Extraction |
| Restaurant Vector | 리뷰 기반 상대 Delta |
| 리뷰 데이터 확보 | 공개 데이터셋/Kaggle → 한국어 변환 → Seed Review → Synthetic Augmentation의 단계적 확보 |
| 식당 추천 | 선택 음식 내 Taste Match 재정렬 |

### 구현하지 않음

| 영역 | 현재 제외 |
|---|---|
| 레시피 크롤링 | 제외 |
| 레시피 → Food Vector 자동 생성 | 제외 |
| 실시간 클릭 스트리밍 | 제외 |
| 실시간 세션 취향 | 제외 |
| 개인 지각함수 | 제외 |
| 대규모 리뷰 실시간 수집 | 제외 |
| Collaborative Filtering | 제외 |
| 플랫폼 규모 ML Serving | 제외 |

MVP의 목적은 **대규모 추천 인프라를 구현하는 것이 아니라 Taste Vector 기반 추천 구조가 실제로 의미 있는가를 검증하는 것**이다.

---

# 1. 제품 정의와 포지셔닝

## 1.1 제품 정의

취향렌즈는 단순한 식당 추천 기능이 아니다.

현재 배달앱에서 흔히 사용되는 **평점순·가까운순·가격순·배달비·인기순** 등의 기준은 식당 또는 거래 조건을 정렬하는 방식이다. 취향렌즈는 이러한 기존 정렬 기준을 대체하지 않고, 그 앞단에 **개인 Taste Fit**이라는 새로운 선택 기준을 추가한다.

즉,

> **“가장 평점이 높은 곳인가?”**

뿐 아니라

> **“내가 좋아하는 맛과 가장 가까운 음식인가?”**

를 함께 판단할 수 있도록 한다.

제품의 핵심 객체를 식당에서 **음식의 맛 프로필**로 이동시킨다.

기존:

\[
User \rightarrow Restaurant
\]

취향렌즈:

\[
User
\rightarrow
Taste
\rightarrow
Food
\rightarrow
Restaurant
\]

---

## 1.2 제품 포지셔닝

### 사용자 관점

> **“뭘 먹을지 모르겠을 때 내 입맛에 맞는 음식부터 골라주는 기능”**

### 배달 플랫폼 관점

> **기존 식당 추천 시스템을 대체하지 않고 의사결정의 앞단에 추가되는 Food Discovery Layer**

### 판매자 관점

> 기존 노출 순위를 제거하는 것이 아니라 특정 메뉴의 맛 특성과 잘 맞는 새로운 고객에게 발견될 수 있는 추가 노출 경로

---

## 1.3 포지셔닝 문장

**For**

먹고 싶은 메뉴가 명확하지 않은 배달앱 사용자에게,

**Taste Lens is**

개인의 맛 취향을 이해하는 Food Discovery Recommendation Layer로,

**Unlike**

주문 이력이나 식당 행동 관계만을 기반으로 식당을 먼저 추천하는 방식과 달리,

**Our Product**

사용자와 음식을 동일한 Taste Space에서 비교하여 음식 선택부터 식당 선택까지 단계적으로 개인화한다.

---

## 1.4 경쟁하지 않는 영역

본 제품은 다음 문제를 직접 해결하려 하지 않는다.

- 가장 빠른 배달
- 가장 저렴한 주문
- 배달비 최적화
- 쿠폰 최적화
- 식당 검색
- 광고 랭킹
- 라이더 배차
- 결제

해당 정보는 향후 최종 랭킹의 Business Constraint가 될 수 있지만 **Taste Match와 별개의 계층**으로 유지한다.

---

# 2. 문제 정의

## 2.1 Problem Statement 1 — Choice Overload

사용자가 메뉴를 정하지 않은 상태에서 배달앱에 진입하면 지나치게 많은

- 카테고리
- 식당
- 메뉴
- 광고
- 프로모션

을 탐색해야 한다.

사용자에게 필요한 것은 더 많은 선택지가 아니라

> **현재 자신에게 적합한 선택지를 빠르게 좁히는 것**

이다.

---

## 2.2 Problem Statement 2 — 기존 정렬 기준은 개인의 입맛을 직접 반영하지 못한다

현재 배달앱의 대표적인 탐색·정렬 기준은 다음과 같다.

- 평점순
- 가까운 순
- 가격 또는 배달비
- 인기순 / 주문 많은 순
- 할인·프로모션
- 배달 예상시간

이러한 기준은

> **“어떤 식당이 일반적으로 좋은가?”**

또는

> **“어떤 식당이 지금 주문하기 편리한가?”**

를 판단하는 데는 유용하다.

그러나 사용자가 실제로 원하는 것은 종종

> **“어떤 음식이 내 입맛에 맞는가?”**

이다.

예를 들어 두 식당의 제육볶음이 모두 높은 평점을 가지고 있어도,

- A식당: 달고 덜 매움
- B식당: 덜 달고 매우 매움

이라면 사용자의 Taste Preference에 따라 더 적합한 선택은 달라질 수 있다.

즉 기존 정렬 기준은 대체로

\[
Restaurant\ Quality
\]

또는

\[
Transaction\ Convenience
\]

를 중심으로 하지만, 취향렌즈는 별도의

\[
Personal\ Taste\ Fit
\]

을 추가한다.

취향렌즈의 목적은 기존 평점·거리·가격 기준을 제거하는 것이 아니라,

> **기존 정렬 기준만으로는 설명하지 못했던 개인 입맛 적합도를 하나의 독립적인 추천 축으로 제공하는 것**

이다.

---

## 2.3 Problem Statement 3 — 행동과 맛의 차이

특정 식당을 여러 번 주문했다는 사실은 알 수 있어도

> 왜 그 음식을 좋아했는지

는 직접적으로 설명하기 어렵다.

예를 들어 사용자가 제육볶음을 반복 주문했다고 해도 이유가

- 단맛
- 매운맛
- 감칠맛
- 가격
- 양
- 배달시간

중 무엇인지는 주문 기록만으로 명확하지 않다.

취향렌즈는 이 중 **Taste Preference를 독립적인 구조화 변수로 분리**한다.

---

## 2.4 Problem Statement 4 — 같은 메뉴도 식당마다 다르다

`제육볶음`이라는 메뉴명이 같아도 실제 음식은 동일하지 않다.

A식당:

> 달고 덜 매움

B식당:

> 짭짤하고 매움

C식당:

> 고소하고 상대적으로 간이 약함

따라서

\[
제육볶음 = 하나의 Vector
\]

만으로는 실제 식당 추천 단계에서 정보가 부족하다.

---

## 2.5 Problem Statement 5 — Cold Start

신규 사용자의 주문 이력이 없는 상태에서는 기존 행동 기반 추천이 충분한 개인화를 제공하기 어렵다.

그러나 사용자가

> “나는 단맛 0.63, 감칠맛 0.81을 좋아한다.”

와 같은 직접 평가를 수행하는 UX 역시 현실적이지 않다.

따라서 음식 자체를 선택하는 자연스러운 Pairwise 방식으로 취향을 역추정해야 한다.

---

## 2.6 Problem Statement 6 — Context

사용자의 취향은 완전히 고정되어 있지 않다.

동일한 사용자도

- 집
- 학교
- 회사
- 점심
- 저녁
- 야식
- 비 오는 날
- 더운 날
- 추운 날

등에서 실제 선택 음식이 달라질 수 있다.

따라서

\[
U_{current}\neq U_{base}
\]

가 될 수 있다.

---

# 3. 시장과 경쟁

## 3.1 시장 구조

배달 플랫폼은 이미 강력한 검색·추천 기술을 보유하고 있다.

따라서 취향렌즈가 경쟁력을 가지려면

> **“우리가 추천 AI를 더 잘 만든다.”**

가 아니라

> **“기존 추천 시스템이 해결하는 문제와 다른 의사결정 단계를 해결한다.”**

라고 정의해야 한다.

---

## 3.2 배달의민족

배민은 실시간 행동 로그, Two-Tower, 벡터 유사도 기반 추천을 공개한 바 있다.

취향렌즈는 이러한 실시간 가게 추천과 직접 경쟁하기보다,

> **행동 → 가게**

보다 앞선

> **취향 → 음식 → 식당**

탐색 레이어를 제공한다.

---

## 3.3 쿠팡이츠

쿠팡이츠 역시 사용자 주문 패턴과 다양한 주문 조건을 활용한 개인화 방향으로 발전하고 있다.

취향렌즈는 가격·속도·거리·평점 같은 기존 정렬 기준과 별도로 **Taste 자체를 명시적인 6차원 구조로 모델링**한다는 방향으로 차별화한다.

즉 경쟁 포인트는 단순히 또 하나의 정렬 옵션을 만드는 것이 아니라,

> **평점·거리·가격 중심 탐색 → 개인 Taste Fit을 포함한 탐색**

으로 추천 기준을 확장하는 것이다.

---

## 3.4 Uber Eats

Uber Eats는 행동, 위치, 시간 등 Context를 활용한 Personalized Ranking 구조를 발전시켜왔다.

취향렌즈의 차이는 Context를 단순 Rank Feature로 사용하는 데서 그치지 않고,

> **주소지·시간대·날씨에 따라 User Taste Vector 자체가 어떻게 이동하는가**

를 설명 가능한 구조로 모델링한다는 점이다.

---

## 3.5 DoorDash

DoorDash는 고비용 LLM 작업을 Offline에서 수행하고 실제 추천 요청에서는 미리 생성된 결과를 활용하는 구조를 공개해 왔다.

본 제품 역시

> **Offline Solar Pro 4 Review Analysis → Stored Restaurant Vector → Online Numeric Ranking**

구조를 사용한다.

---

## 3.6 경쟁 요약

| 서비스 | 핵심 방향 | 취향렌즈의 차이 |
|---|---|---|
| 배민 | 행동 기반 실시간 가게/상품 추천 | Taste-first Food Discovery |
| 쿠팡이츠 | 주문 조건·패턴 개인화 | 6D Taste Representation |
| Uber Eats | 행동·시간·위치 기반 Ranking | Explainable Taste Space |
| DoorDash | Offline LLM + Online Personalization | 리뷰 Taste Evidence에 적용 |
| 취향렌즈 | Taste → Food → Restaurant | 음식 선택 의사결정 자체를 구조화 |

---

# 4. 고객

## 4.1 Business Model 관점

본 제품은 독립 배달앱보다는

\[
B2B2C
\]

모델에 적합하다.

### Customer

배달·예약·로컬 커머스 플랫폼

### User

해당 플랫폼에서 음식을 탐색하고 주문하는 소비자

---

## 4.2 Primary Persona — 결정 피로 사용자

### 상황

배달앱을 켰지만 먹고 싶은 음식이 정해지지 않았다.

### Pain Point

식당을 계속 스크롤하고 다른 카테고리를 반복적으로 탐색한다.

### Need

많은 추천이 아니라 **지금 먹을 만한 음식 몇 개를 빠르게 좁혀주는 것**.

---

## 4.3 Secondary Persona — 취향이 뚜렷한 사용자

예:

> 나는 매운 음식은 좋아하지만 너무 단 양념은 싫다.

기존 `한식`, `분식` 같은 카테고리는 이러한 취향을 충분히 표현하지 못한다.

Need:

> **같은 제육이라도 내 입맛에 더 가까운 가게를 알고 싶다.**

---

## 4.4 Tertiary Persona — 신규 사용자

주문 이력이 거의 없어 개인화 추천 품질이 낮은 사용자.

Need:

> 복잡한 설문 없이 빠르게 개인화를 시작하고 싶다.

---

## 4.5 플랫폼 사업자

Need:

- 메뉴 발견률 증가
- 탐색 시간 감소
- 주문 전환 증가
- Long-tail 식당 발견
- 개인화 서비스 차별화
- 추천 이유 설명 가능성

---

## 4.6 판매자

Need:

단순 광고비 경쟁이 아니라

> **자신의 음식 맛을 좋아할 가능성이 높은 고객에게 노출될 기회**

확보.

---

# 5. 제품 구조

## 5.1 전체 구조

```text
Taste Lens
│
├─ User Intelligence
│   ├─ Pairwise Onboarding
│   ├─ Base Taste Vector
│   ├─ Order Update
│   └─ Context Delta
│
├─ Food Intelligence
│   ├─ Seed Food Vector
│   └─ Food Metadata
│
├─ Restaurant Intelligence
│   ├─ Review Sentence Processing
│   ├─ Solar Pro 4 Extraction
│   ├─ Taste Evidence Aggregation
│   └─ Restaurant Menu Vector
│
├─ Recommendation Engine
│   ├─ Food Matching
│   └─ Restaurant Matching
│
└─ Presentation
    ├─ Taste Profile
    ├─ Recommended Foods
    ├─ Recommendation Reason
    └─ Restaurant Ranking
```

---

## 5.2 추천의 2단계 구조

### Stage 1 — Food Recommendation

\[
User \leftrightarrow Food
\]

목표:

> 무엇을 먹을 것인가?

### Stage 2 — Restaurant Recommendation

\[
User \leftrightarrow RestaurantMenu
\]

목표:

> 그 음식 중 어느 식당이 나에게 가장 맞는가?

---

## 5.3 Food Vector

\[
F_f
=
[sweet,salty,sour,umami,spicy,nutty]
\]

Core MVP에서는 수동 Seed Data이다.

---

## 5.4 Restaurant Menu Vector

\[
F_{r,f}
=
clip(F_f+\Delta_{r,f},0,1)
\]

\(\Delta\)는 리뷰에서 계산한다.

---

## 5.5 User Vector

\[
U_{base}
=
[u_s,u_{sa},u_{so},u_u,u_{sp},u_n]
\]

Pairwise 온보딩 결과에서 추정한다.

---

## 5.6 Context-aware Taste Scoring

추천 요청 시 시스템은 다음 세 가지 Context를 수집한다.

1. **주소지 유형**: 집 / 학교 / 회사 / 기타
2. **현재 시간대**: 아침 / 점심 / 오후 / 저녁 / 야식
3. **현재 날씨**: 날씨 API에서 수신한 기상정보를 정규화한 Context

현재 사용자 취향 벡터는

\[
U_{current}
=
clip(
U_{base}
+
w_a\Delta_{address}
+
w_t\Delta_{time}
+
w_w\Delta_{weather},
0,1)
\]

로 계산한다.

즉 같은 사용자라도 현재가

> 집 + 저녁 + 비

인지,

> 학교 + 점심 + 맑음

인지에 따라 Taste Score가 달라지고 추천 음식 순위 역시 달라질 수 있다.

---

# 6. 사용자 경험

## 6.0 기존 탐색과 취향렌즈 탐색의 차이

### 기존 배달앱 탐색

```text
카테고리 선택
↓
식당 목록
↓
평점 / 거리 / 가격 / 배달비 / 인기 기준 비교
↓
식당 선택
↓
메뉴 선택
```

### 취향렌즈 탐색

```text
내 Taste Preference
↓
현재 주소지 / 시간 / 날씨 Context 반영
↓
내 입맛에 가까운 음식 추천
↓
음식 선택
↓
같은 음식 내 식당별 Taste Fit 비교
↓
평점 / 거리 / 가격 등 기존 조건과 함께 최종 선택
```

따라서 취향렌즈는 기존 필터·정렬을 없애는 기능이 아니라 **기존 주문 의사결정 과정에 개인 Taste Fit을 추가하는 보완적 추천 레이어**이다.

---

## 6.1 신규 사용자 Flow

```text
취향렌즈 진입
↓
"10번만 골라주세요"
↓
음식 A / 음식 B 선택
↓
약 10회 반복
↓
Taste Profile 생성
↓
현재 주소지 유형 확인
↓
현재 시간대 확인
↓
날씨 API에서 현재 날씨 수신
↓
Context-aware User Vector 생성
↓
추천 음식 3~5개
↓
음식 선택
↓
해당 음식 식당 목록
↓
Taste Match 기준 추천
```

---

## 6.2 온보딩 원칙

한 화면에는 최대 두 개 음식만 제시한다.

사용자에게

> 단맛을 1~10점으로 평가하십시오.

와 같은 추상적인 자기 평가를 요구하지 않는다.

질문:

> **“둘 중 지금 더 먹고 싶은 음식은?”**

선택지:

`제육볶음` VS `냉면`

---

## 6.3 Question Design

10문항은

\[
6\ Coverage + 4\ Refinement
\]

를 기본 가설로 한다.

### Coverage

6 Dimension 모두에 대한 정보를 확보한다.

### Refinement

앞선 선택으로 판단이 어려운 Dimension을 추가 확인한다.

Core MVP에서는 완전한 Active Learning 대신 **사전 정의 Branching Rule**을 사용할 수 있다.

---

## 6.4 Returning User

기존 사용자는 온보딩을 다시 하지 않는다.

```text
취향렌즈 진입
↓
기존 User Vector 호출
↓
주소지·시간대·날씨 Context 적용
↓
추천
```

필요할 경우

> **취향 다시 설정하기**

기능을 제공한다.

---

## 6.5 추천 결과 화면

추천 음식 카드는 다음 정보를 제공한다.

**제육볶음**

Taste Match `91%`

> 선호하는 매운맛과 감칠맛 수준이 비슷해요.

버튼:

`이 음식 식당 보기`

---

## 6.6 식당 결과

**제육볶음 맛집**

A식당 — Match 94%

> 다른 제육볶음보다 조금 달고 덜 매운 편이에요.

B식당 — Match 86%

> 짭짤하고 매운맛이 상대적으로 강해요.

---

## 6.7 Context UX

가능하면 자동 조회한다.

- 주소지: 사용자의 현재 선택 주소를 `Home / School / Work / Other`로 매핑
- 시간대: 시스템 시간에서 자동 계산
- 날씨: 날씨 API에서 현재 주소지 기준 기상정보 수신

Prototype에서 실제 외부 API 연동이 제한될 경우 날씨는 Demo Mock State로 대체 가능하다.

---

# 7. 데이터 모델

## 7.1 UserTasteProfile

| Field | Type | 설명 |
|---|---|---|
| user_id | string | 사용자 ID |
| sweet | float | 0~1 |
| salty | float | 0~1 |
| sour | float | 0~1 |
| umami | float | 0~1 |
| spicy | float | 0~1 |
| nutty | float | 0~1 |
| source | enum | onboarding/order/mixed |
| updated_at | datetime | 마지막 업데이트 |

---

## 7.2 Food

| Field | Type |
|---|---|
| food_id | string |
| food_name | string |
| category | string |
| sweet | float |
| salty | float |
| sour | float |
| umami | float |
| spicy | float |
| nutty | float |
| vector_version | string |

---

## 7.3 RestaurantMenuTaste

| Field | Type |
|---|---|
| restaurant_id | string |
| food_id | string |
| sweet | float |
| salty | float |
| sour | float |
| umami | float |
| spicy | float |
| nutty | float |
| evidence_count | int |
| review_version | string |
| updated_at | datetime |

---

## 7.4 OnboardingQuestion

| Field | Type |
|---|---|
| question_id | string |
| food_a | food_id |
| food_b | food_id |
| question_type | coverage/refinement |
| primary_axes | array |
| next_rule | JSON |

---

## 7.5 OnboardingResponse

| Field | Type |
|---|---|
| user_id | string |
| question_id | string |
| selected_food | food_id |
| rejected_food | food_id |
| sequence | int |
| created_at | datetime |

---

## 7.6 ReviewEvidence

| Field | Type |
|---|---|
| evidence_id | string |
| review_id | string |
| restaurant_id | string |
| food_id | string |
| taste_axis | enum |
| level | -2~+2 |
| comparative | boolean |
| evidence_text | string |
| extraction_status | enum |

---

## 7.7 OrderEvent

| Field | Type |
|---|---|
| order_id | string |
| user_id | string |
| food_id | string |
| restaurant_id | string |
| address_type | enum |
| weather_type | enum |
| time_segment | enum |
| repeat_order | boolean |
| created_at | datetime |

---

## 7.8 ContextPreference

| Field | Type |
|---|---|
| user_id | string |
| context_type | address/time/weather |
| context_value | string |
| delta_sweet | float |
| delta_salty | float |
| delta_sour | float |
| delta_umami | float |
| delta_spicy | float |
| delta_nutty | float |
| sample_count | int |

---

## 7.9 RecommendationLog

| Field | Type |
|---|---|
| recommendation_id | string |
| user_id | string |
| recommendation_type | food/restaurant |
| candidate_id | string |
| match_score | float |
| rank | int |
| vector_version | string |
| context_snapshot | JSON |
| created_at | datetime |

---

## 7.10 데이터 확보 전략 (Data Acquisition Strategy)

현재 MVP의 가장 큰 데이터 리스크는 **음식별 6차원 Seed Food Vector와 식당별 맛 차이를 추출할 Review Dataset을 안정적으로 확보하기 어렵다는 점**이다.

따라서 처음부터 실제 배달 플랫폼의 대규모 리뷰 API 확보를 전제로 하지 않고, 데이터 출처를 단계적으로 확장한다.

### Stage A — 공개 Restaurant Review Dataset 확보

우선적으로 Kaggle 등 공개 데이터 저장소에서 사용할 수 있는 **영문 Restaurant/Food Review Dataset**을 탐색한다.

선정 조건은 다음과 같다.

- 음식 또는 식당 리뷰 문장이 포함되어 있을 것
- 원문 리뷰 단위가 유지되어 있을 것
- 가능하면 Restaurant/Menu Category 정보를 포함할 것
- 연구·PoC에 사용할 수 있는 라이선스인지 확인할 것
- 별점만 있고 텍스트가 없는 데이터는 제외할 것
- 단순 서비스 만족도보다 음식 맛 표현이 충분한 데이터셋을 우선할 것

Kaggle 데이터는 본 서비스의 최종 Production Data가 아니라 **Review Intelligence Pipeline의 동작을 검증하기 위한 공개 실험 데이터**로 사용한다.

### Stage B — 한국어 변환 및 정규화

영문 리뷰를 그대로 Solar Pro 4에 넣기보다, 한국어 배달 플랫폼 환경과 가까운 Prototype을 만들기 위해 일부 데이터를 한국어로 번역하여 사용한다.

번역 시 다음 원칙을 유지한다.

- `very spicy`, `slightly sweet`, `not salty`와 같은 **정도·부정 표현을 보존**
- 음식명과 대상 메뉴를 임의로 변경하지 않음
- 원문의 긍정/부정 Sentiment와 Taste Intensity를 분리해 유지
- 번역본과 원문을 모두 저장하여 추적 가능하게 함

예:

```text
Original:
"The noodles were much spicier than I expected, but not very salty."

Translated:
"면은 생각보다 훨씬 매웠지만 많이 짜지는 않았어요."
```

이 문장은 Solar Pro 4가

- Spicy: 강함
- Salty: 약함

으로 추출할 수 있는 테스트 사례가 된다.

### Stage C — 팀 제작 Seed Review Dataset

Kaggle 공개 데이터만으로 국내 배달 리뷰의 표현을 충분히 커버하지 못할 경우, 팀이 직접 **Seed Review**를 작성한다.

Seed Review는 임의의 자연어 문장을 무작위로 만드는 것이 아니라 6개 Taste Axis와 언어적 현상을 고르게 포함하도록 설계한다.

반드시 포함할 Case:

- 정도부사: `조금`, `꽤`, `엄청`, `훨씬`
- 부정: `안 맵다`, `짜지 않다`
- 상대 비교: `다른 곳보다 달다`
- 복합 문장: `달지만 맵지는 않다`
- Sentiment와 Intensity 충돌: `너무 매워서 좋다`, `너무 매워서 싫다`
- Taste와 비Taste 혼재: `달고 양도 많다`
- 메뉴가 여러 개인 리뷰
- Taste Evidence가 전혀 없는 리뷰

Seed Review에는 사람이 직접 Ground Truth Label을 부여한다.

예:

```json
{
  "review": "다른 집보다 꽤 달고 생각보다 안 매워요.",
  "gold_claims": [
    {"axis": "sweet", "level": 2, "comparative": true},
    {"axis": "spicy", "level": -1, "comparative": false}
  ]
}
```

### Stage D — Teacher Model 기반 Synthetic Augmentation

초기 Seed Review가 확보되면 Teacher LLM을 이용해 표현만 다른 Synthetic Review를 추가 생성할 수 있다.

목적은 새로운 사실을 만들어내는 것이 아니라

> **동일한 Taste Label을 다양한 자연어 표현으로 확장하는 것**

이다.

예:

Seed:

> "제육이 다른 곳보다 많이 달아요."

Synthetic:

> "여기는 제육 양념 단맛이 확실히 센 편이에요."  
> "다른 제육집보다 달달하게 느껴졌어요."  
> "단맛이 꽤 강한 제육이에요."

모든 Synthetic Data에는

```text
source_type = synthetic
parent_seed_id = ...
teacher_model = ...
```

을 기록한다.

Synthetic Data는 실제 리뷰와 동일한 신뢰도로 취급하지 않는다. Validation Set은 가능하면 사람이 작성하거나 공개 원문에서 확보한 데이터만 사용한다.

### Stage E — 실제 플랫폼 데이터로 전환

PoC 이후 실제 플랫폼과 연동할 수 있게 되면

- 실제 주문 리뷰
- 메뉴 정보
- 식당 정보
- 주문 메뉴와 연결된 리뷰

를 이용해 공개·Synthetic Dataset을 점진적으로 대체한다.

최종 발전 방향은

\[
Public/Seed/Synthetic
\rightarrow
Real\ Platform\ Review
\]

이다.

---

## 7.11 데이터 출처와 Provenance 관리

모든 Review Data는 출처를 추적할 수 있어야 한다.

### ReviewDatasetSource

| Field | Type | 설명 |
|---|---|---|
| dataset_id | string | 데이터셋 ID |
| source_type | enum | kaggle/public/manual_seed/synthetic/platform |
| source_name | string | 데이터셋 또는 출처명 |
| original_language | string | 원문 언어 |
| translated | boolean | 번역 여부 |
| license_note | string | 라이선스 메모 |
| parent_dataset_id | string/null | 파생 데이터의 원본 |
| teacher_model | string/null | Synthetic 생성 모델 |
| created_at | datetime | 생성 시점 |

ReviewEvidence에도 최소한 다음 필드를 추가한다.

| Field | Type | 설명 |
|---|---|---|
| dataset_id | string | 어떤 Dataset에서 왔는지 |
| is_synthetic | boolean | 합성 데이터 여부 |
| source_review_id | string | 원본 리뷰 ID |
| translation_version | string/null | 번역본 버전 |

이를 통해 추천 결과가 어떤 종류의 데이터에 기반했는지 역추적할 수 있다.

---

## 7.12 MVP 데이터 확보 우선순위

개발 기간 내 우선순위는 다음과 같다.

```text
1. 20~30개 Seed Food Vector 직접 구축
↓
2. Kaggle/공개 영문 Restaurant Review Dataset 확보
↓
3. Taste 표현이 포함된 리뷰만 샘플링
↓
4. 한국어 번역 및 정규화
↓
5. 팀 제작 Seed Review + Human Label
↓
6. 필요 시 Teacher Model Synthetic Augmentation
↓
7. Solar Pro 4 Extraction 성능 검증
↓
8. PoC 이후 실제 플랫폼 리뷰로 교체
```

중요한 원칙은 **데이터를 많이 만드는 것보다 출처와 정답 Label이 명확한 작은 검증용 Dataset을 먼저 확보하는 것**이다.

---

# 8. AI 인텔리전스 파이프라인

## 8.1 전체 Architecture

```text
             ┌──────────────┐
             │ Seed Food DB │
             └──────┬───────┘
                    │
                    ▼
Pairwise ────▶ User Taste Vector
                    │
Orders ──────▶ Continuous Update
                    │
Address ─────▶ Address Delta
Time ────────▶ Time Delta
Weather API ─▶ Weather Delta
                    │
                    ▼
             Current User Vector
                    │
                    ▼
               Food Ranking
                    │
                    ▼
               Food Selected
                    │
                    ▼
        Restaurant Menu Vectors
                    │
                    ▼
           Restaurant Ranking
```

Review Data Acquisition & Restaurant Vector Pipeline:

```text
Kaggle / Public Review Dataset
        +
Manual Seed Review
        +
Optional Synthetic Augmentation
↓
Korean Translation / Normalization
↓
Dataset Provenance 저장
↓
Reviews
↓
Sentence / Clause Split
↓
Taste Candidate Filter
↓
Solar Pro 4
↓
Structured Taste Evidence
↓
Python Aggregation
↓
Within-Food Ranking
↓
Shrinkage
↓
Restaurant Delta
↓
Restaurant Menu Vector
```

---

## 8.2 User Vector Estimation

User Vector는 **맛 요소 중요도 Weight가 아니라 사용자가 선호하는 맛 강도상의 위치**이다.

음식 A와 B에 대해

\[
d(U,F)
=
\sqrt{
\frac{1}{6}
\sum_{k=1}^6(U_k-F_k)^2
}
\]

사용자가 A를 선택할 확률은

\[
P(A>B)
=
\sigma
\{
\beta[d(U,F_B)-d(U,F_A)]
\}
\]

이다.

10개 응답에 대해 Negative Log-Likelihood를 최소화하는 \(U\)를 찾는다.

Regularization:

\[
L(U)=
-\sum \log P(choice_q)
+
\lambda ||U-0.5||^2
\]

모든 값은

\[
0\le U_k\le1
\]

로 제한한다.

---

## 8.3 User Vector 예시 Python

```python
import numpy as np
from scipy.optimize import minimize

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def sq_distance(u, f):
    return np.mean((u - f) ** 2)

def estimate_user_vector(responses, food_vectors, beta=8.0, reg=0.05):
    def loss(u):
        total = 0.0

        for response in responses:
            fa = food_vectors[response["selected"]]
            fb = food_vectors[response["rejected"]]

            da = sq_distance(u, fa)
            db = sq_distance(u, fb)

            p = sigmoid(beta * (db - da))
            total -= np.log(max(p, 1e-8))

        total += reg * np.sum((u - 0.5) ** 2)
        return total

    result = minimize(
        loss,
        x0=np.full(6, 0.5),
        bounds=[(0, 1)] * 6
    )

    return result.x
```

---

## 8.4 Food Recommendation

거리:

\[
d(U,F)
=
\sqrt{\frac{\sum(U_k-F_k)^2}{6}}
\]

Taste Match:

\[
Match(U,F)=1-d(U,F)
\]

퍼센트 UI:

\[
Match\%=100\times Match
\]

---

## 8.5 주문 기반 업데이트

\[
U_{new}
=
(1-\eta)U_{old}
+
\eta F_{order}
\]

초기 Engineering Prior:

일반 주문:

\[
\eta=0.10
\]

재주문:

\[
\eta=0.15\sim0.20
\]

---

## 8.6 Context-aware Taste Scoring Pipeline

사용자의 현재 취향은 기본 취향만으로 결정되지 않는다.

추천 시점마다 시스템은 다음 세 값을 확인한다.

### 1. Address Context

현재 주문 주소를

- Home
- School
- Work
- Other

중 하나로 분류한다.

해당 주소지에서 사용자가 과거 주문한 음식의 평균 Taste Vector와 전체 주문 평균의 차이를

\[
\Delta_{address}
\]

로 저장한다.

### 2. Time Context

현재 시간을

- Breakfast
- Lunch
- Afternoon
- Dinner
- Late Night

로 분류한다.

각 시간대에서 실제 주문한 Food Vector의 차이를

\[
\Delta_{time}
\]

으로 저장한다.

### 3. Weather Context

날씨 API에서 현재 주소지 기준 기상정보를 수신한다.

MVP에서는 과도한 세분화를 피하기 위해 예를 들어

- Normal
- Rain/Snow
- Hot
- Cold

등으로 정규화한다.

각 날씨 상태에서 사용자가 실제로 주문한 Food Vector의 차이를

\[
\Delta_{weather}
\]

로 저장한다.

현재 Taste Vector는

\[
U_{current}
=
clip(
U_{base}
+w_a\Delta_{address}
+w_t\Delta_{time}
+w_w\Delta_{weather},
0,1)
\]

로 계산한다.

따라서 사용자의 기본 취향은 동일하더라도 주소지·현재 날씨·현재 시간대에 따라 **6차원 Taste Score가 달라지고 최종 Food Ranking 역시 달라진다.**

---

## 8.7 Context Preference 계산

전체 주문 평균:

\[
\bar F_{user}
\]

특정 Context 평균:

\[
\bar F_c
\]

Context Delta:

\[
\Delta_c=\bar F_c-\bar F_{user}
\]

예를 들어 사용자의 평소 Spicy 평균이 `0.55`지만 집에서 주문한 음식의 Spicy 평균이 `0.70`이라면,

\[
\Delta_{home,spicy}=+0.15
\]

로 계산한다.

---

## 8.8 Context Confidence

Context 데이터가 적을수록 보정을 약하게 적용한다.

주소지:

\[
w_a
=
0.40
\frac{n_a}{n_a+10}
\]

시간대:

\[
w_t
=
0.30
\frac{n_t}{n_t+12}
\]

날씨:

\[
w_w
=
0.20
\frac{n_w}{n_w+20}
\]

이를 통해 1~2번의 주문만으로 취향이 과도하게 변화하는 것을 방지한다.

---

## 8.9 Restaurant Review Intelligence

Solar Pro 4는 최종 Food Score를 생성하지 않는다.

Solar Pro 4의 역할은

\[
Natural\ Language
\rightarrow
Structured\ Taste\ Evidence
\]

이다.

---

## 8.10 Solar 입력 예시

> 여기 제육은 다른 집보다 꽤 달고 생각보다 많이 맵지는 않아요. 양은 많은 편이에요.

Expected Output:

```json
{
  "menu": "제육볶음",
  "claims": [
    {
      "axis": "sweet",
      "level": 2,
      "comparative": true,
      "evidence": "다른 집보다 꽤 달고"
    },
    {
      "axis": "spicy",
      "level": -1,
      "comparative": false,
      "evidence": "많이 맵지는 않아요"
    }
  ]
}
```

---

## 8.11 Extraction Rules

Taste Level:

\[
l\in\{-2,-1,0,+1,+2\}
\]

| Level | 의미 |
|---:|---|
| -2 | 매우 약함 |
| -1 | 상대적으로 약함 |
| 0 | 기준 수준 / 중립 |
| +1 | 상대적으로 강함 |
| +2 | 매우 강함 |

LLM이 임의의 연속 점수를 생성하지 않도록 한다.

---

## 8.12 Taste Intensity와 Sentiment 분리

> 너무 매워서 너무 좋아요.

와

> 너무 매워서 못 먹겠어요.

두 문장은 Sentiment는 다르지만 Spicy Intensity는 둘 다 높다.

따라서

\[
Taste\ Intensity \neq Sentiment
\]

원칙을 적용한다.

---

## 8.13 Restaurant Evidence Aggregation

Claim \(j\):

\[
E_j=l_jq_j
\]

명시적인 비교:

\[
q_j=1.25
\]

일반 표현:

\[
q_j=1.0
\]

---

## 8.14 Same-Food Ranking

동일 음식 내 식당끼리만 비교한다.

예:

| Restaurant | Sweet Raw |
|---|---:|
| A | 1.30 |
| B | 0.70 |
| C | 0.20 |
| D | -0.30 |

이를 Percentile로 변환한다.

---

## 8.15 Restaurant Delta

\[
\Delta^{raw}_{r,f,k}
=
2(p_{r,f,k}-0.5)\delta_{max}
\]

MVP:

\[
\delta_{max}=0.15
\]

---

## 8.16 Review Shrinkage

\[
\lambda
=
\frac{n}{n+10}
\]

최종:

\[
\Delta=
\lambda\Delta^{raw}
\]

리뷰 Evidence가 적으면 자연스럽게

\[
\Delta\rightarrow0
\]

이 된다.

---

## 8.17 Restaurant Vector

\[
F_{restaurant,food}
=
clip(
F_{base,food}
+
\Delta_{restaurant},
0,1)
\]

---

## 8.18 LLM Prompt Requirement

```text
You are a food taste evidence extraction model.

Extract only taste information explicitly supported by the review.

Allowed axes:
sweet, salty, sour, umami, spicy, nutty.

Do not infer taste from general food knowledge.

"맛있다", "양이 많다", "친절하다" are not taste-axis evidence.

Separate taste intensity from whether the reviewer liked the taste.

If evidence cannot be mapped confidently to one of the six axes,
return no claim.

Return JSON only.
```

---

# 9. 기능 요구사항

## FR-01 취향렌즈 진입
**Priority:** Must

## FR-02 Pairwise Onboarding
**Priority:** Must

## FR-03 User Vector Generation
**Priority:** Must

## FR-04 User Taste Profile
**Priority:** Should

## FR-05 Food Recommendation
**Priority:** Must

## FR-06 Recommendation Explanation
**Priority:** Should

## FR-07 Restaurant Navigation
**Priority:** Must

## FR-08 Restaurant Taste Ranking
**Priority:** Should / Phase 1.5

## FR-09 Review Extraction
**Priority:** Should / Phase 1.5

## FR-10 Review Filtering
**Priority:** Must if FR-09 enabled

## FR-11 Address Context
**Priority:** Must

주소지 유형에 따라 별도의 Context Delta를 적용할 수 있어야 한다.

## FR-12 Time Context
**Priority:** Must

현재 시간을 자동으로 분류하고 해당 시간대의 Taste Delta를 적용해야 한다.

## FR-13 Weather API Context
**Priority:** Should

현재 주소지 기준 날씨 API 정보를 수신해 Weather Context로 변환하고, 해당 사용자의 Weather Taste Delta를 적용해야 한다.

## FR-14 Context Cold Start Fallback
**Priority:** Must

Context 데이터가 부족하면 Base User Vector를 사용해야 한다.

## FR-15 Order Update
**Priority:** Should

## FR-16 Repeat Order
**Priority:** Should

## FR-17 Vector Versioning
**Priority:** Should

## FR-18 Recommendation Logging
**Priority:** Should

---

# 10. 비기능 요구사항

## 10.1 Performance

Core Recommendation Path에는 LLM 호출을 포함하지 않는다.

목표:

\[
p95<500ms
\]

---

## 10.2 Availability

Solar Review Processing 장애가 발생해도 기본 Seed Food Recommendation은 정상 동작해야 한다.

---

## 10.3 Determinism

동일 User Vector, Food Vector, Context, Version이면 동일 Ranking을 반환해야 한다.

---

## 10.4 Explainability

추천 점수는 Dimension Difference로 역추적 가능해야 한다.

---

## 10.5 Auditability

Restaurant Delta가 어떤 Review Evidence에서 생성되었는지 추적할 수 있어야 한다.

---

## 10.6 Privacy

실제 상세 주소 대신 가능한 경우

- Home
- School
- Work
- Other

등 추상화된 주소지 Context만 저장한다.

---

## 10.7 Security

API Key는 Client에 포함하지 않는다.

Solar Pro 4 및 Weather API Key는 Server-side Secret으로 관리한다.

---

## 10.8 Cost

Core User Request당 LLM 호출:

\[
0
\]

Review Batch Processing에서만 LLM 비용이 발생한다.

---

# 11. 성공 지표

## 11.1 North Star Metric

> **Taste Lens Assisted Order Conversion Rate**

\[
\frac{
취향렌즈를 통한 주문완료
}{
취향렌즈 추천 세션
}
\]

---

## 11.2 MVP Algorithm Metrics

### Pairwise Held-out Accuracy

초기 목표:

\[
\ge70\%
\]

### Top-3 Food Acceptance

초기 목표:

\[
\ge75\%
\]

### Taste Profile Agreement

추정 Vector와 사용자 직접 평가 간 일치도 측정.

---

## 11.3 Review AI Metrics

Taste Axis Macro F1:

\[
\ge0.80
\]

Menu Linking Accuracy:

\[
\ge0.90
\]

Unsupported Taste Claim Rate:

\[
<5\%
\]

---

## 11.4 Restaurant Ranking Metric

Spearman Rank Correlation:

\[
\rho>0.5
\]

초기 목표.

---

## 11.5 Taste-fit Value Metrics

기존 평점·거리·가격 기준 대비 Taste Lens가 실제로 추가 가치를 만드는지 확인한다.

### Taste-over-Rating Selection Rate

높은 평점의 기본 추천 후보 대신 Taste Match가 더 높은 다른 후보를 사용자가 선택한 비율.

### Taste Match Preference Lift

동일 음식·유사 가격·유사 거리 조건에서

- 기존 평점순 후보
- Taste Match 후보

를 Blind Comparison하여 Taste Match 후보 선호 비율을 측정한다.

### Decision Confidence

추천 후

> “내 입맛에 맞을 것 같다”

는 사용자 응답 비율을 측정한다.

이 지표는 단순 CTR보다 **취향렌즈가 기존 정렬 기준에 없는 추가 가치를 제공하는지**를 검증하기 위한 지표이다.

---

## 11.6 UX Metrics

- Onboarding Completion Rate
- Time to Complete Onboarding
- Recommendation → Food Click Rate
- Food → Restaurant Click Rate
- Time to First Meaningful Selection

---

## 11.7 Production Business Metrics

- Order Conversion Uplift
- Recommendation CTR
- Repeat Usage
- Time-to-Order 감소
- Restaurant Discovery Rate
- New Restaurant Exposure
- Average Orders/User
- Retention

---

# 12. 수익 모델

## 12.1 B2B Platform License

배달·예약·푸드커머스 플랫폼에 Recommendation Engine 라이선스.

---

## 12.2 Performance-Based Fee

\[
Revenue
=
BaseFee
+
\alpha(IncrementalGMV)
\]

---

## 12.3 Taste Intelligence API

```text
User Preference
+
Context
→
Food Ranking
```

형태의 외부 API 제공.

---

## 12.4 Merchant Taste Insights

예:

> 우리 가게 제육은 주변 제육 대비 Sweet 상위 20%.

등의 익명화된 Taste Analytics 제공.

---

## 12.5 Sponsored Discovery

Taste Match Threshold를 통과한 후보 내부에서만 Sponsored Placement를 허용한다.

\[
Advertising
\neq
TasteScore\ Manipulation
\]

---

# 13. 해자(Moat)

## 13.1 6D Vector 자체는 해자가 아니다

해자는 스키마가 아니라 실제 데이터와 결합되어 만들어지는 관계 데이터에 있다.

---

## 13.2 User Taste Graph

\[
User
\times
Taste
\times
Context
\times
Food
\]

관계 데이터가 축적된다.

---

## 13.3 Restaurant Taste Evidence Dataset

\[
Restaurant
\times
Menu
\times
TasteAxis
\times
Intensity
\]

데이터가 축적된다.

---

## 13.4 Data Flywheel

```text
추천
↓
선택
↓
주문
↓
User Vector 개선
↓
Restaurant Evidence 증가
↓
Recommendation 개선
↓
더 많은 선택
```

---

## 13.5 Explainable Recommendation

추천 결과를 Dimension Difference로 설명할 수 있다.

---

# 14. 리스크와 대응

| Risk | 영향 | 대응 |
|---|---|---|
| Seed Vector 주관성 | 추천 정확도 왜곡 | MVP 한계 명시 + 사용자 Calibration |
| 6차원으로 맛을 다 설명하지 못함 | 정보 손실 | 축 확장 실험 |
| 10문항 정보 부족 | Cold Start 부정확 | 질문 수 실험 |
| 음식 인지도 편향 | 인기 음식 위주 선택 | 친숙도 비슷한 Pair 설계 |
| LLM 리뷰 Hallucination | 잘못된 Restaurant Delta | Explicit Evidence only |
| 리뷰 조작 | Taste Vector 오염 | 최소 Evidence, 이상치 제거 |
| 리뷰가 적은 식당 | 불공정 | Shrinkage → Base Vector |
| Context Overfitting | 이상 추천 | Sample-size weighting |
| 날씨 상관관계 과장 | 잘못된 해석 | 개인 행동 기반 Delta만 사용 |
| 특정 식당 과집중 | 판매자 반발 | 기존 Ranking 유지 + 추가 Surface |
| LLM 비용 | 비용 증가 | Offline Batch only |
| 리뷰 데이터 부족 | Restaurant Delta 검증 어려움 | Kaggle/공개 리뷰 + Seed Review + Synthetic Augmentation |
| 공개 데이터 Domain Gap | 실제 한국 배달 리뷰와 표현 차이 | 한국어 번역 + 국내형 Seed Review 병행 |
| Synthetic Data 편향 | 지나치게 정형화된 리뷰 학습 | Synthetic 비중 제한 + Human/Public Validation Set 분리 |
| 데이터 라이선스 문제 | 재사용·발표 리스크 | Dataset별 License/Source Provenance 기록 |
| 번역 왜곡 | 정도·부정 표현 손실 | 원문-번역 Pair 보존 + 샘플 수동 검수 |
| 플랫폼 API 미확보 | 실제 주문 연동 불가 | Mock Dataset + PoC 검증 |

---

# 15. 로드맵

## Phase 0 — Data & UX Preparation

- Taste Ontology v1
- Seed Food 20~30개
- Pairwise Question Set
- Mock Users
- Mock Order Data
- Kaggle/공개 Restaurant Review Dataset 후보 조사
- 데이터셋 License 및 Provenance 기록
- 영문 리뷰 한국어 번역 샘플 구축
- 국내 표현용 Manual Seed Review + Human Label 구축
- 필요 시 Teacher Model 기반 Synthetic Review 증강
- Review Validation Set 분리
- UI Wireframe

---

## Phase 1 — Timely Core MVP

```text
Seed Food DB
↓
Pairwise Onboarding
↓
User Vector
↓
Address + Time + Weather API Context
↓
Context-aware User Vector
↓
Food Ranking
↓
Recommendation UI
```

목표:

> **Taste Vector 기반 음식 추천 가능성 검증**

---

## Phase 1.5 — Review Intelligence Prototype

```text
Public/Kaggle Reviews
+ Manual Seed Reviews
+ Optional Synthetic Reviews
↓
Translation / Normalization
↓
Solar Pro 4
↓
Taste Evidence
↓
Python Aggregation
↓
Restaurant Delta
↓
Restaurant Ranking
```

---

## Phase 2 — Validation & Calibration

실제 사용자 20~50명을 대상으로 온보딩, Food Vector, 추천, 리뷰 Extraction을 검증한다.

---

## Phase 3 — Data-Driven Food Vector

\[
F_{manual}
\rightarrow
F_{hybrid}
\rightarrow
F_{data-driven}
\]

방향으로 발전한다.

---

## Phase 4 — Platform Integration

실제 플랫폼의

- 메뉴 DB
- 주문
- 리뷰
- 주소
- 날씨
- 영업상태

데이터와 연결한다.

---

## Phase 5 — Real-Time Session Intelligence

현재 제외한

- Search
- Category Click
- Food Click
- Restaurant Click
- Session Sequence

를 실시간으로 활용한다.

\[
U_{current}
=
U_{long-term}
+
Context
+
U_{session}
\]

---

# 16. 오픈 퀘스천

## Q1. 6 Dimension이면 충분한가?

추가 후보:

- Richness
- Greasy
- Lightness
- Aroma
- Texture

Core에서는 6D 유지.

---

## Q2. Nutty는 다른 5개 축과 동급인가?

서비스 관점의 예측력으로 검증한다.

---

## Q3. 10문항이 최적인가?

6 / 8 / 10 / 12 / 15 비교 실험 필요.

---

## Q4. Pairwise Question은 고정형인가 적응형인가?

MVP: Branching  
장기: Active Preference Learning

---

## Q5. Seed Vector를 누가 결정하는가?

현재 프로젝트 팀이 수동 작성.

향후 사용자·전문가·리뷰 기반 Calibration.

---

## Q6. Distance Metric은 Euclidean이 최적인가?

후보:

- Euclidean
- Weighted Euclidean
- Manhattan
- Mahalanobis
- Learned Distance

---

## Q7. 모든 Dimension을 동일 Weight로 비교하는가?

MVP에서는 동일 Weight.

향후 예측 성능 기반 학습 가능.

---

## Q8. Restaurant Delta ±0.15가 적절한가?

현재 Engineering Prior.

검증 후 조정.

---

## Q9. Address > Time > Weather 우선순위가 맞는가?

현재 가설.

실제 데이터로 재검증한다.

---

## Q10. 날씨 Context 분류 기준은 무엇인가?

MVP 예시:

- Rain/Snow
- Hot
- Cold
- Normal

기준 기온 및 강수 조건은 Weather API와 실제 사용 데이터에 맞춰 Calibration한다.

---

## Q11. Restaurant Ranking에 배달비·평점·ETA는 언제 결합하는가?

Taste Score와 Marketplace Score를 분리한다.

향후:

\[
FinalScore
=
\alpha TasteMatch
+
\beta Quality
+
\gamma ETA
+
\delta Price
\]

형태 검토.

---

## Q12. 추천 다양성은 어떻게 유지하는가?

Top-K 이후 Diversity Reranking 검토.

---

## Q13. 어떤 공개/Kaggle Review Dataset을 사용할 것인가?

최종 Dataset은 다음 기준으로 선정한다.

- Restaurant/Food Review Text 존재
- Taste 관련 표현의 밀도
- Restaurant/Menu Metadata 수준
- PoC 사용이 가능한 License
- 데이터 규모
- 번역 및 가공 난이도

Dataset 이름을 먼저 고정하기보다 실제 샘플을 비교한 뒤 선정한다.

---

## Q14. Synthetic Review는 어느 비율까지 허용할 것인가?

Synthetic Data는 Coverage 확대에는 유용하지만 실제 사용자 언어 분포와 차이가 날 수 있다.

따라서

- Training/Development Data에는 제한적으로 사용 가능
- Validation/Test Set은 Public 또는 Human-authored Data를 우선

원칙을 적용한다.

---

## Q15. 영문 리뷰 번역이 Taste Evidence를 왜곡하지 않는가?

특히

- 정도부사
- 부정
- 비교급
- 반어적 표현

이 번역 과정에서 손실될 수 있다.

원문-번역 Pair를 유지하고 샘플 Human Review를 통해 Translation Error Rate를 확인해야 한다.

---

# 17. 문서 관계와 참고자료

## 17.1 문서 Hierarchy

본 PRD를 Product-level Source of Truth로 사용한다.

관련 문서:

### A. Taste Ontology Specification
6개 Dimension 정의 및 Annotation Rule.

### B. Seed Food Vector Sheet
20~30개 음식 초기 Vector 및 Version.

### C. Pairwise Question Specification
질문 조합, 비교 축, Branch Rule.

### D. User Vector Algorithm Spec
Preference Estimation, Regularization, Distance Formula.

### E. Solar Review Extraction Spec
Prompt, JSON Schema, Allowed/Disallowed Mapping.

### F. Restaurant Delta Algorithm Spec
Evidence → Percentile → Shrinkage → Delta.

### G. Context Calibration Spec
Address / Time / Weather API Context 및 Weight.

### H. Analytics & Experiment Spec
Event, Metric, A/B Test.

### I. API Contract
Frontend ↔ Backend Interface.

### J. UX / Figma
Screen 및 Interaction.

### K. Data Acquisition & Provenance Specification
Kaggle/공개 데이터 선정 기준, 번역 규칙, Manual Seed 생성 규칙, Synthetic Augmentation 정책, License 및 Provenance 관리.

---

## 17.2 추천 API 예시

### Request

```json
{
  "user_id": "U001",
  "context": {
    "address_type": "home",
    "weather": "rain",
    "time_segment": "dinner"
  },
  "top_k": 5
}
```

### Response

```json
{
  "user_vector": {
    "sweet": 0.43,
    "salty": 0.66,
    "sour": 0.21,
    "umami": 0.82,
    "spicy": 0.77,
    "nutty": 0.40
  },
  "recommendations": [
    {
      "food_id": "F001",
      "food_name": "제육볶음",
      "match_score": 0.91,
      "reason": [
        "선호하는 매운맛 수준과 비슷해요",
        "감칠맛 선호와 잘 맞아요"
      ]
    }
  ]
}
```

---

## 17.3 Restaurant API 예시

```text
GET /foods/{foodId}/restaurants?userId={userId}
```

Response:

```json
{
  "food": "제육볶음",
  "restaurants": [
    {
      "restaurant_id": "R001",
      "match_score": 0.94,
      "taste_summary": "다른 제육보다 조금 달고 덜 매운 편"
    },
    {
      "restaurant_id": "R002",
      "match_score": 0.83,
      "taste_summary": "맵고 짭짤한 편"
    }
  ]
}
```

---

## 17.4 핵심 참고 방향

- 배달 플랫폼의 실시간 행동 기반 추천 및 Two-Tower 구조
- Context-aware Restaurant/Food Ranking
- Offline LLM + Online Numeric Serving
- Aspect-Based Sentiment Analysis
- Solar Pro 4 기반 Structured Taste Evidence Extraction

---

# 최종 Product Architecture

```text
                   ┌─────────────────────────┐
                   │      FOOD DATABASE      │
                   │  6D Seed Taste Vector   │
                   └────────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
       Pairwise Onboarding       Public/Kaggle Review
                 │                  + Manual Seed Review
                 │                  + Synthetic(optional)
                 │                             │
                 ▼                             ▼
         User Base Vector        Translation / Normalization
                 │                             │
                 │                             ▼
                 │                         Solar Pro 4
                 │                             │
                 │                     Taste Evidence
       Orders ───┤                             │
                 │                             ▼
                 │                   Restaurant Delta
                 │                             │
                 ▼                             ▼
       Address / Time / Weather       Restaurant Menu Vector
                 │                             │
                 ▼                             │
        Current User Vector                    │
                 │                             │
                 ├─────────────┐               │
                 │             │               │
                 ▼             │               │
          Food Distance        │               │
                 │             │               │
                 ▼             │               │
          Top-K Foods          │               │
                 │             │               │
           Food Selected       │               │
                 │             │               │
                 └─────────────┴───────────────┘
                               │
                               ▼
                       Restaurant Distance
                               │
                               ▼
                    Personalized Restaurant
                           Recommendation
```

---

# 최종 제품 메시지

취향렌즈가 주장하는 것은

> **“AI가 음식의 맛을 완벽하게 숫자로 표현한다.”**

가 아니다.

현재 MVP의 Food Vector는 추천 구조를 검증하기 위한 Seed Data이며 이후 실제 데이터로 고도화한다.

제품의 핵심은

> **평점·거리·가격처럼 ‘식당을 평가하는 기준’만으로 주문하게 하는 것이 아니라, ‘내 입맛과 얼마나 맞는가’라는 개인 Taste Fit을 새로운 선택 기준으로 추가하는 것**

이며,

> **사용자와 음식을 동일한 Taste Space에서 연결하는 것**

그리고

> **주소지, 현재 시간대, 날씨 API에서 받은 현재 날씨 정보에 따라 사용자 Taste Vector를 상황별로 보정하는 것**

그리고

> **리뷰에 존재하는 상대적 맛 정보를 이용해 같은 음식 안에서도 식당별 차이를 구조화하는 것**

이다.

MVP의 리뷰 데이터는 실제 플랫폼 API 확보를 전제로 하지 않고 **Kaggle 등 공개 Restaurant Review Dataset, 한국어 번역본, 사람이 작성한 Seed Review, 필요 시 Teacher Model 기반 Synthetic Review**를 단계적으로 사용한다. 이후 플랫폼 연동이 가능해지면 실제 주문 리뷰 데이터로 교체한다.

따라서 취향렌즈는 기존 배달앱의

> **“어느 식당에서 주문할 것인가?”**

보다 한 단계 앞선

> **“지금 나는 무엇을 먹고 싶은가?”**

를 먼저 해결하고,

그 이후

> **“그 음식을 파는 곳 중 어느 가게의 맛이 내 취향에 가장 가까운가?”**

까지 이어주는 **Taste-first Personalized Food Discovery Layer**를 목표로 한다.
