#!/usr/bin/env python3
"""
Generate 70 Food items, 41 Restaurants, and 210-250 RestaurantMenus according to PRD v4.3.
Outputs:
- supabase/migrations/20260916220000_taste_lens_v43_schema.sql
- supabase/migrations/20260916220500_taste_lens_v43_seed.sql
- api/data/seed_data.json
"""

import json
import os
import random
from typing import List, Dict, Any

random.seed(42)  # Deterministic generation

# 1. 70 Food Items across 8 categories (PRD v4.3 Section 5 & 6)
# [sweet, salty, sour, umami, spicy, nutty]
FOOD_DEFS: List[Dict[str, Any]] = [
    # 5.1 한식 (14개)
    {"id": "jeyuk", "name": "제육볶음", "category": "한식", "emoji": "🥘", "vector": [0.55, 0.65, 0.10, 0.75, 0.75, 0.35], "desc": "불향 가득한 매콤달콤한 돼지고기 볶음"},
    {"id": "kimchi_jjigae", "name": "김치찌개", "category": "한식", "emoji": "🍲", "vector": [0.25, 0.65, 0.55, 0.78, 0.62, 0.18], "desc": "숙성 김치와 두부가 어우러진 얼큰 칼칼한 찌개"},
    {"id": "sundubu_jjigae", "name": "순두부찌개", "category": "한식", "emoji": "🫕", "vector": [0.20, 0.60, 0.30, 0.80, 0.70, 0.30], "desc": "몽글몽글 순두부와 해물이 어우러진 얼큰한 찌개"},
    {"id": "bibimbap", "name": "비빔밥", "category": "한식", "emoji": "🥗", "vector": [0.35, 0.50, 0.20, 0.65, 0.45, 0.60], "desc": "다채로운 나물과 고추장, 참기름의 조화"},
    {"id": "mul_naengmyeon", "name": "물냉면", "category": "한식", "emoji": "🧊", "vector": [0.35, 0.45, 0.75, 0.45, 0.10, 0.15], "desc": "살얼음 동동 띄운 시원하고 새콤한 동치미 육수 냉면"},
    {"id": "bulgogi", "name": "불고기", "category": "한식", "emoji": "🥩", "vector": [0.75, 0.55, 0.05, 0.80, 0.05, 0.40], "desc": "달콤 짭짤한 특제 간장 양념에 재운 부드러운 소불고기"},
    {"id": "doenjang_jjigae", "name": "된장찌개", "category": "한식", "emoji": "🍲", "vector": [0.15, 0.70, 0.10, 0.85, 0.30, 0.50], "desc": "구수한 재래식 된장과 신선한 야채가 어우러진 뚝배기 찌개"},
    {"id": "samgyeopsal", "name": "삼겹살", "category": "한식", "emoji": "🥓", "vector": [0.10, 0.50, 0.05, 0.85, 0.10, 0.75], "desc": "노릇노릇 고소하게 구워낸 국민 삼겹살"},
    {"id": "yukgaejang", "name": "육개장", "category": "한식", "emoji": "🥣", "vector": [0.15, 0.68, 0.15, 0.82, 0.75, 0.30], "desc": "푹 끓인 사골 육수에 대파와 찢은 양지머리를 넣은 칼칼한 탕"},
    {"id": "seolleongtang", "name": "설렁탕", "category": "한식", "emoji": "🥣", "vector": [0.05, 0.40, 0.05, 0.75, 0.05, 0.55], "desc": "오랜 시간 고아낸 뽀얗고 깊은 소뼈 국물"},
    {"id": "budae_jjigae", "name": "부대찌개", "category": "한식", "emoji": "🥘", "vector": [0.30, 0.75, 0.20, 0.85, 0.65, 0.40], "desc": "햄과 소시지, 라면사리가 푸짐하게 들어간 진한 찌개"},
    {"id": "ojingeo_bokkeum", "name": "오징어볶음", "category": "한식", "emoji": "🦑", "vector": [0.50, 0.65, 0.10, 0.70, 0.80, 0.25], "desc": "쫄깃한 오징어를 특제 고추장 양념에 강불로 볶아낸 요리"},
    {"id": "bibim_naengmyeon", "name": "비빔냉면", "category": "한식", "emoji": "🍜", "vector": [0.60, 0.55, 0.50, 0.55, 0.70, 0.30], "desc": "매콤달콤한 비빔장에 쫄깃한 면발과 오이, 무초절임"},
    {"id": "haemul_pajeon", "name": "해물파전", "category": "한식", "emoji": "🥞", "vector": [0.20, 0.50, 0.05, 0.70, 0.15, 0.65], "desc": "해물과 쪽파를 바삭하고 고소하게 부쳐낸 전통 전"},

    # 5.2 중식 (8개)
    {"id": "jjajangmyeon", "name": "짜장면", "category": "중식", "emoji": "🍜", "vector": [0.65, 0.65, 0.05, 0.80, 0.05, 0.50], "desc": "달콤하고 진한 춘장에 볶아낸 정통 짜장면"},
    {"id": "jjamppong", "name": "짬뽕", "category": "중식", "emoji": "🍜", "vector": [0.20, 0.75, 0.15, 0.85, 0.80, 0.25], "desc": "불맛 입힌 해물과 야채가 듬뿍 들어간 얼큰 칼칼한 국물"},
    {"id": "mapo_tofu", "name": "마파두부", "category": "중식", "emoji": "🍛", "vector": [0.25, 0.70, 0.15, 0.80, 0.85, 0.35], "desc": "두반장과 화자오의 얼얼한 매운맛이 일품인 두부 요리"},
    {"id": "tangsuyuk", "name": "탕수육", "category": "중식", "emoji": "🍖", "vector": [0.80, 0.45, 0.65, 0.60, 0.05, 0.35], "desc": "바삭하게 튀긴 돼지고기에 새콤달콤한 과일 소스"},
    {"id": "maratang", "name": "마라탕", "category": "중식", "emoji": "🍲", "vector": [0.15, 0.80, 0.20, 0.85, 0.95, 0.50], "desc": "알싸한 마라유와 고소한 즈마장이 어우러진 중독적인 맛"},
    {"id": "yangggochi", "name": "양꼬치", "category": "중식", "emoji": "🍢", "vector": [0.10, 0.65, 0.05, 0.80, 0.45, 0.70], "desc": "쯔란과 특제 향신료를 곁들인 고소한 양고기 꼬치구이"},
    {"id": "fried_rice", "name": "볶음밥", "category": "중식", "emoji": "🍚", "vector": [0.20, 0.55, 0.05, 0.70, 0.05, 0.65], "desc": "고슬고슬하게 볶아낸 계란야채 볶음밥과 짜장 소스"},
    {"id": "yusanseul", "name": "유산슬", "category": "중식", "emoji": "🍲", "vector": [0.20, 0.50, 0.05, 0.80, 0.10, 0.40], "desc": "해삼, 새우, 버섯을 채 썰어 부드럽게 볶아낸 고급 중화요리"},

    # 5.3 일식 (8개)
    {"id": "tonkotsu_ramen", "name": "돈코츠라멘", "category": "일식", "emoji": "🍜", "vector": [0.15, 0.80, 0.05, 0.95, 0.20, 0.70], "desc": "장시간 우려낸 진하고 묵직한 돼지뼈 육수의 라멘"},
    {"id": "shoyu_ramen", "name": "쇼유라멘", "category": "일식", "emoji": "🍜", "vector": [0.20, 0.75, 0.10, 0.85, 0.10, 0.30], "desc": "맑고 깔끔한 특제 간장 베이스 육수의 정통 라멘"},
    {"id": "donkatsu", "name": "돈가스", "category": "일식", "emoji": "🍱", "vector": [0.50, 0.50, 0.20, 0.65, 0.05, 0.45], "desc": "두툼한 등심을 바삭하게 튀겨낸 일본식 카츠"},
    {"id": "sushi", "name": "초밥", "category": "일식", "emoji": "🍣", "vector": [0.35, 0.45, 0.45, 0.75, 0.30, 0.20], "desc": "신선한 제철 생선과 새콤달콤한 초대리의 완벽한 조화"},
    {"id": "gyudon", "name": "규동", "category": "일식", "emoji": "🍛", "vector": [0.65, 0.60, 0.05, 0.75, 0.10, 0.35], "desc": "특제 쯔유에 졸인 부드러운 소고기와 양파 덮밥"},
    {"id": "karaage", "name": "가라아게", "category": "일식", "emoji": "🍗", "vector": [0.25, 0.65, 0.10, 0.75, 0.15, 0.50], "desc": "간장 생강 양념에 재워 바삭하게 튀겨낸 일본식 닭튀김"},
    {"id": "udon", "name": "우동", "category": "일식", "emoji": "🍲", "vector": [0.30, 0.50, 0.05, 0.70, 0.05, 0.30], "desc": "가쓰오부시 국물에 오동통하고 쫄깃한 면발"},
    {"id": "soba", "name": "메밀소바", "category": "일식", "emoji": "🍜", "vector": [0.35, 0.55, 0.10, 0.65, 0.20, 0.40], "desc": "시원한 쯔유에 무즙과 와사비를 풀어 적셔 먹는 메밀면"},

    # 5.4 치킨 (8개)
    {"id": "fried_chicken", "name": "후라이드치킨", "category": "치킨", "emoji": "🍗", "vector": [0.10, 0.65, 0.05, 0.75, 0.15, 0.65], "desc": "바삭한 튀김옷과 육즙 가득한 오리지널 크리스피 치킨"},
    {"id": "yangnyeom_chicken", "name": "양념치킨", "category": "치킨", "emoji": "🍗", "vector": [0.75, 0.60, 0.20, 0.70, 0.55, 0.35], "desc": "달콤 매콤한 황금 비율 양념 소스를 버무린 치킨"},
    {"id": "soy_chicken", "name": "간장치킨", "category": "치킨", "emoji": "🍗", "vector": [0.60, 0.75, 0.05, 0.75, 0.15, 0.40], "desc": "달콤 짭조름한 마늘 간장 소스가 쏙 밴 치킨"},
    {"id": "spicy_chicken", "name": "매운양념치킨", "category": "치킨", "emoji": "🍗", "vector": [0.55, 0.65, 0.15, 0.75, 0.85, 0.30], "desc": "화끈한 청양고추와 불맛 소스로 버무린 매운 치킨"},
    {"id": "garlic_chicken", "name": "마늘치킨", "category": "치킨", "emoji": "🍗", "vector": [0.50, 0.65, 0.10, 0.80, 0.40, 0.40], "desc": "알싸한 통마늘과 꿀이 어우러진 특제 갈릭 치킨"},
    {"id": "honey_chicken", "name": "허니치킨", "category": "치킨", "emoji": "🍗", "vector": [0.85, 0.55, 0.05, 0.65, 0.05, 0.35], "desc": "달콤한 아카시아 꿀과 버터 향이 어우러진 단짠 치킨"},
    {"id": "padak", "name": "파닭", "category": "치킨", "emoji": "🍗", "vector": [0.45, 0.60, 0.40, 0.70, 0.35, 0.45], "desc": "알싸한 파채와 오리엔탈 겨자 소스를 곁들인 치킨"},
    {"id": "charcoal_chicken", "name": "숯불치킨", "category": "치킨", "emoji": "🍗", "vector": [0.45, 0.65, 0.05, 0.80, 0.70, 0.45], "desc": "참숯에 직화로 구워 그윽한 불향을 입힌 바베큐 치킨"},

    # 5.5 피자 (8개)
    {"id": "pepperoni_pizza", "name": "페퍼로니피자", "category": "피자", "emoji": "🍕", "vector": [0.25, 0.85, 0.25, 0.80, 0.35, 0.50], "desc": "짭조름한 페퍼로니와 진한 모짜렐라 치즈가 듬뿍"},
    {"id": "cheese_pizza", "name": "치즈피자", "category": "피자", "emoji": "🍕", "vector": [0.25, 0.70, 0.15, 0.75, 0.05, 0.70], "desc": "자연산 모짜렐라와 체다 치즈의 풍성한 풍미"},
    {"id": "sweet_potato_pizza", "name": "고구마피자", "category": "피자", "emoji": "🍕", "vector": [0.80, 0.50, 0.10, 0.60, 0.05, 0.55], "desc": "부드럽고 달콤한 고구마 무스와 치즈의 달콤한 만남"},
    {"id": "bulgogi_pizza", "name": "불고기피자", "category": "피자", "emoji": "🍕", "vector": [0.65, 0.65, 0.10, 0.75, 0.10, 0.50], "desc": "한국인 입맛에 딱 맞춘 달콤한 불고기 토핑 피자"},
    {"id": "hawaiian_pizza", "name": "하와이안피자", "category": "피자", "emoji": "🍕", "vector": [0.75, 0.60, 0.50, 0.65, 0.05, 0.45], "desc": "상큼한 파인애플과 짭짤한 햄의 매력적인 단짠 조화"},
    {"id": "potato_pizza", "name": "포테이토피자", "category": "피자", "emoji": "🍕", "vector": [0.30, 0.60, 0.10, 0.70, 0.05, 0.65], "desc": "포슬포슬한 웨지 감자와 고소한 마요네즈 토핑"},
    {"id": "gorgonzola_pizza", "name": "고르곤졸라피자", "category": "피자", "emoji": "🍕", "vector": [0.70, 0.65, 0.10, 0.75, 0.05, 0.75], "desc": "특유의 고르곤졸라 치즈 풍미에 달콤한 꿀을 찍어 먹는 피자"},
    {"id": "hot_chicken_pizza", "name": "핫치킨피자", "category": "피자", "emoji": "🍕", "vector": [0.35, 0.75, 0.15, 0.75, 0.80, 0.45], "desc": "매콤한 바베큐 치킨과 할라피뇨가 토핑된 피자"},

    # 5.6 분식 (8개)
    {"id": "tteokbokki", "name": "떡볶이", "category": "분식", "emoji": "🍢", "vector": [0.65, 0.60, 0.10, 0.65, 0.75, 0.20], "desc": "쫄깃한 쌀떡에 매콤달콤한 고추장 소스가 밴 국민 간식"},
    {"id": "rabokki", "name": "라볶이", "category": "분식", "emoji": "🥘", "vector": [0.60, 0.65, 0.10, 0.75, 0.75, 0.30], "desc": "떡볶이에 꼬들꼬들한 라면사리와 어묵이 듬뿍 들어간 요리"},
    {"id": "sundae", "name": "순대", "category": "분식", "emoji": "🥟", "vector": [0.10, 0.45, 0.05, 0.65, 0.05, 0.60], "desc": "당면과 찹쌀로 속을 꽉 채운 쫄깃하고 담백한 순대"},
    {"id": "twigim", "name": "튀김", "category": "분식", "emoji": "🍤", "vector": [0.20, 0.45, 0.05, 0.55, 0.05, 0.70], "desc": "바삭바삭하게 갓 튀겨낸 모둠 수제 튀김"},
    {"id": "gimbap", "name": "김밥", "category": "분식", "emoji": "🍙", "vector": [0.25, 0.50, 0.20, 0.60, 0.05, 0.65], "desc": "참기름 향 솔솔 나는 밥에 정갈한 재료를 말아낸 김밥"},
    {"id": "jjolmyeon", "name": "쫄면", "category": "분식", "emoji": "🍜", "vector": [0.65, 0.55, 0.65, 0.50, 0.80, 0.30], "desc": "새콤매콤한 비빔장에 콩나물과 쫄깃한 쫄면사리"},
    {"id": "eomuk", "name": "어묵", "category": "분식", "emoji": "🍢", "vector": [0.20, 0.60, 0.05, 0.75, 0.10, 0.35], "desc": "따뜻하고 시원한 국물과 어우러진 탱글탱글한 부산 어묵"},
    {"id": "mandu", "name": "만두", "category": "분식", "emoji": "🥟", "vector": [0.20, 0.55, 0.05, 0.75, 0.10, 0.55], "desc": "고기와 육즙으로 속을 가득 채운 고소한 손만두"},

    # 5.7 카페·디저트 (8개)
    {"id": "chocolate_cake", "name": "초콜릿케이크", "category": "카페·디저트", "emoji": "🍰", "vector": [0.90, 0.15, 0.05, 0.30, 0.00, 0.55], "desc": "진하고 꾸덕한 다크 초콜릿 가나슈 케이크"},
    {"id": "cheese_cake", "name": "치즈케이크", "category": "카페·디저트", "emoji": "🧀", "vector": [0.65, 0.35, 0.35, 0.55, 0.00, 0.65], "desc": "부드럽고 진한 크림치즈의 산뜻하고 고소한 풍미"},
    {"id": "croffle", "name": "크로플", "category": "카페·디저트", "emoji": "🥐", "vector": [0.75, 0.25, 0.05, 0.35, 0.00, 0.75], "desc": "바삭하고 쫀득한 크루아상 생지 와플과 시럽"},
    {"id": "donut", "name": "도넛", "category": "카페·디저트", "emoji": "🍩", "vector": [0.85, 0.20, 0.05, 0.30, 0.00, 0.60], "desc": "달콤한 슈가 글레이즈드가 듬뿍 입혀진 폭신한 도넛"},
    {"id": "patbingsu", "name": "팥빙수", "category": "카페·디저트", "emoji": "🍧", "vector": [0.85, 0.10, 0.05, 0.30, 0.00, 0.55], "desc": "부드러운 우유 눈꽃 얼음에 달콤한 팥과 콩고물"},
    {"id": "ice_cream", "name": "아이스크림", "category": "카페·디저트", "emoji": "🍨", "vector": [0.85, 0.15, 0.10, 0.35, 0.00, 0.60], "desc": "부드럽고 시원한 프리미엄 바닐라 아이스크림"},
    {"id": "salt_bread", "name": "소금빵", "category": "카페·디저트", "emoji": "🥐", "vector": [0.15, 0.55, 0.05, 0.40, 0.00, 0.85], "desc": "겉은 바삭 속은 촉촉, 풍부한 버터 동굴과 펄 솔트"},
    {"id": "bagel", "name": "베이글", "category": "카페·디저트", "emoji": "🥯", "vector": [0.20, 0.35, 0.05, 0.40, 0.00, 0.70], "desc": "겉바속촉 쫄깃 담백하게 구워낸 뉴욕 정통 베이글"},

    # 5.8 기타·글로벌 (8개)
    {"id": "pho", "name": "쌀국수", "category": "기타·글로벌", "emoji": "🍜", "vector": [0.25, 0.55, 0.35, 0.75, 0.20, 0.30], "desc": "양지와 사골을 우려낸 맑고 깊은 베트남 쌀국수"},
    {"id": "pad_thai", "name": "팟타이", "category": "기타·글로벌", "emoji": "🍲", "vector": [0.65, 0.60, 0.50, 0.70, 0.35, 0.65], "desc": "타마린드 소스와 땅콩가루, 새우가 어우러진 태국 볶음쌀국수"},
    {"id": "taco", "name": "타코", "category": "기타·글로벌", "emoji": "🌮", "vector": [0.25, 0.65, 0.45, 0.75, 0.60, 0.45], "desc": "또띠아에 고기와 살사, 라임을 얹어 즐기는 멕시칸 타코"},
    {"id": "burger", "name": "햄버거", "category": "기타·글로벌", "emoji": "🍔", "vector": [0.45, 0.70, 0.25, 0.80, 0.15, 0.60], "desc": "두툼한 소고기 패티와 멜팅 치즈의 미국식 수제버거"},
    {"id": "pasta", "name": "파스타", "category": "기타·글로벌", "emoji": "🍝", "vector": [0.35, 0.65, 0.30, 0.75, 0.25, 0.55], "desc": "알덴테로 삶은 면에 진한 토마토/오일 소스의 이탈리안 파스타"},
    {"id": "salad", "name": "샐러드", "category": "기타·글로벌", "emoji": "🥗", "vector": [0.35, 0.25, 0.45, 0.35, 0.05, 0.40], "desc": "신선한 채소와 리코타 치즈, 발사믹 드레싱의 가벼운 한 끼"},
    {"id": "curry", "name": "커리", "category": "기타·글로벌", "emoji": "🍛", "vector": [0.35, 0.65, 0.15, 0.80, 0.65, 0.60], "desc": "깊고 풍부한 향신료와 코코넛 크림이 어우러진 인도식 커리"},
    {"id": "kebab", "name": "케밥", "category": "기타·글로벌", "emoji": "🌯", "vector": [0.30, 0.65, 0.35, 0.75, 0.45, 0.50], "desc": "구운 고기와 신선한 채소를 또띠아에 말아낸 터키 케밥"},
]

assert len(FOOD_DEFS) == 70, f"Expected 70 foods, got {len(FOOD_DEFS)}"

# 2. 41 Restaurants across 8 categories (PRD v4.3 Section 8 & 10)
RESTAURANT_DEFS: List[Dict[str, Any]] = [
    # 한식 (10개)
    {"id": "r_korean_01", "name": "청춘찌개", "category": "한식", "type": "찌개·백반", "rating": 4.8, "reviews": 320, "del_min": 25, "fee": 2000, "min_order": 12000},
    {"id": "r_korean_02", "name": "서울밥상", "category": "한식", "type": "찌개·백반", "rating": 4.7, "reviews": 210, "del_min": 30, "fee": 2500, "min_order": 14000},
    {"id": "r_korean_03", "name": "한성국밥", "category": "한식", "type": "국밥·탕", "rating": 4.9, "reviews": 450, "del_min": 20, "fee": 1500, "min_order": 10000},
    {"id": "r_korean_04", "name": "불맛공방", "category": "한식", "type": "고기·볶음", "rating": 4.6, "reviews": 180, "del_min": 25, "fee": 2000, "min_order": 13000},
    {"id": "r_korean_05", "name": "냉면마을", "category": "한식", "type": "냉면", "rating": 4.8, "reviews": 390, "del_min": 20, "fee": 2000, "min_order": 12000},
    {"id": "r_korean_06", "name": "우리집백반", "category": "한식", "type": "종합한식", "rating": 4.7, "reviews": 150, "del_min": 30, "fee": 2000, "min_order": 11000},
    {"id": "r_korean_07", "name": "종로설렁탕", "category": "한식", "type": "국밥·탕", "rating": 4.9, "reviews": 510, "del_min": 25, "fee": 2000, "min_order": 12000},
    {"id": "r_korean_08", "name": "할매순두부", "category": "한식", "type": "찌개·백반", "rating": 4.8, "reviews": 280, "del_min": 25, "fee": 1500, "min_order": 11000},
    {"id": "r_korean_09", "name": "마포갈비마을", "category": "한식", "type": "고기·볶음", "rating": 4.7, "reviews": 340, "del_min": 35, "fee": 3000, "min_order": 16000},
    {"id": "r_korean_10", "name": "대관령삼겹살", "category": "한식", "type": "고기·볶음", "rating": 4.8, "reviews": 420, "del_min": 30, "fee": 2500, "min_order": 15000},

    # 중식 (5개)
    {"id": "r_chinese_01", "name": "홍콩반점", "category": "중식", "type": "중화요리", "rating": 4.7, "reviews": 540, "del_min": 20, "fee": 2000, "min_order": 12000},
    {"id": "r_chinese_02", "name": "대륙반점", "category": "중식", "type": "중화요리", "rating": 4.6, "reviews": 290, "del_min": 25, "fee": 2000, "min_order": 13000},
    {"id": "r_chinese_03", "name": "마라공방", "category": "중식", "type": "마라", "rating": 4.8, "reviews": 680, "del_min": 25, "fee": 2500, "min_order": 14000},
    {"id": "r_chinese_04", "name": "양꼬치마을", "category": "중식", "type": "양꼬치", "rating": 4.7, "reviews": 220, "del_min": 35, "fee": 3000, "min_order": 18000},
    {"id": "r_chinese_05", "name": "만리장성", "category": "중식", "type": "중화요리", "rating": 4.8, "reviews": 410, "del_min": 20, "fee": 2000, "min_order": 12000},

    # 일식 (5개)
    {"id": "r_japanese_01", "name": "하카타라멘", "category": "일식", "type": "라멘", "rating": 4.9, "reviews": 490, "del_min": 25, "fee": 2500, "min_order": 12000},
    {"id": "r_japanese_02", "name": "카츠당", "category": "일식", "type": "돈가스", "rating": 4.8, "reviews": 380, "del_min": 30, "fee": 2500, "min_order": 13000},
    {"id": "r_japanese_03", "name": "스시로", "category": "일식", "type": "초밥", "rating": 4.7, "reviews": 520, "del_min": 30, "fee": 3000, "min_order": 16000},
    {"id": "r_japanese_04", "name": "도쿄우동", "category": "일식", "type": "일식종합", "rating": 4.6, "reviews": 210, "del_min": 20, "fee": 2000, "min_order": 11000},
    {"id": "r_japanese_05", "name": "소바야", "category": "일식", "type": "일식종합", "rating": 4.8, "reviews": 310, "del_min": 25, "fee": 2000, "min_order": 12000},

    # 치킨 (4개)
    {"id": "r_chicken_01", "name": "황금치킨", "category": "치킨", "type": "치킨전문", "rating": 4.8, "reviews": 780, "del_min": 30, "fee": 2500, "min_order": 16000},
    {"id": "r_chicken_02", "name": "달콤바삭통닭", "category": "치킨", "type": "치킨전문", "rating": 4.7, "reviews": 430, "del_min": 25, "fee": 2000, "min_order": 15000},
    {"id": "r_chicken_03", "name": "숯불직화치킨", "category": "치킨", "type": "바베큐치킨", "rating": 4.9, "reviews": 610, "del_min": 35, "fee": 2500, "min_order": 17000},
    {"id": "r_chicken_04", "name": "바른파닭", "category": "치킨", "type": "치킨전문", "rating": 4.7, "reviews": 350, "del_min": 25, "fee": 2000, "min_order": 16000},

    # 피자 (4개)
    {"id": "r_pizza_01", "name": "화덕피자공방", "category": "피자", "type": "화덕피자", "rating": 4.9, "reviews": 460, "del_min": 35, "fee": 3000, "min_order": 18000},
    {"id": "r_pizza_02", "name": "치즈익스프레스", "category": "피자", "type": "미국식피자", "rating": 4.7, "reviews": 380, "del_min": 25, "fee": 2000, "min_order": 15000},
    {"id": "r_pizza_03", "name": "뉴욕피자", "category": "피자", "type": "미국식피자", "rating": 4.8, "reviews": 510, "del_min": 30, "fee": 2500, "min_order": 16000},
    {"id": "r_pizza_04", "name": "보나베띠피자", "category": "피자", "type": "피자전문", "rating": 4.6, "reviews": 240, "del_min": 30, "fee": 2000, "min_order": 14000},

    # 분식 (4개)
    {"id": "r_snack_01", "name": "학교앞떡볶이", "category": "분식", "type": "떡볶이전문", "rating": 4.8, "reviews": 620, "del_min": 20, "fee": 1500, "min_order": 10000},
    {"id": "r_snack_02", "name": "김밥천국", "category": "분식", "type": "종합분식", "rating": 4.6, "reviews": 390, "del_min": 20, "fee": 1500, "min_order": 9000},
    {"id": "r_snack_03", "name": "바삭튀김소굴", "category": "분식", "type": "튀김분식", "rating": 4.7, "reviews": 290, "del_min": 25, "fee": 2000, "min_order": 11000},
    {"id": "r_snack_04", "name": "얼큰라면분식", "category": "분식", "type": "종합분식", "rating": 4.8, "reviews": 440, "del_min": 20, "fee": 1500, "min_order": 10000},

    # 카페·디저트 (4개)
    {"id": "r_cafe_01", "name": "카페달콤", "category": "카페·디저트", "type": "디저트카페", "rating": 4.9, "reviews": 530, "del_min": 20, "fee": 2000, "min_order": 10000},
    {"id": "r_cafe_02", "name": "베이글앤브레드", "category": "카페·디저트", "type": "베이커리", "rating": 4.8, "reviews": 410, "del_min": 25, "fee": 2000, "min_order": 11000},
    {"id": "r_cafe_03", "name": "빙수야", "category": "카페·디저트", "type": "빙수전문", "rating": 4.8, "reviews": 350, "del_min": 25, "fee": 2500, "min_order": 12000},
    {"id": "r_cafe_04", "name": "크로플하우스", "category": "카페·디저트", "type": "디저트카페", "rating": 4.7, "reviews": 280, "del_min": 20, "fee": 2000, "min_order": 10000},

    # 기타·글로벌 (5개)
    {"id": "r_global_01", "name": "포사이공", "category": "기타·글로벌", "type": "베트남요리", "rating": 4.8, "reviews": 470, "del_min": 25, "fee": 2000, "min_order": 12000},
    {"id": "r_global_02", "name": "타이하우스", "category": "기타·글로벌", "type": "태국요리", "rating": 4.7, "reviews": 320, "del_min": 30, "fee": 2500, "min_order": 14000},
    {"id": "r_global_03", "name": "타코벨리", "category": "기타·글로벌", "type": "멕시칸", "rating": 4.8, "reviews": 390, "del_min": 25, "fee": 2500, "min_order": 13000},
    {"id": "r_global_04", "name": "브루클린버거", "category": "기타·글로벌", "type": "수제버거", "rating": 4.9, "reviews": 650, "del_min": 30, "fee": 3000, "min_order": 15000},
    {"id": "r_global_05", "name": "델리커리", "category": "기타·글로벌", "type": "아시안·양식", "rating": 4.7, "reviews": 280, "del_min": 30, "fee": 2500, "min_order": 13000},
]

assert len(RESTAURANT_DEFS) == 41, f"Expected 41 restaurants, got {len(RESTAURANT_DEFS)}"

# Category menu price defaults
PRICE_RANGES = {
    "한식": (8000, 15000),
    "중식": (7000, 22000),
    "일식": (9000, 18000),
    "치킨": (17000, 24000),
    "피자": (16000, 27000),
    "분식": (4000, 9000),
    "카페·디저트": (4500, 12000),
    "기타·글로벌": (9000, 19000),
}

# Group foods by category
FOODS_BY_CAT: Dict[str, List[Dict[str, Any]]] = {}
for f in FOOD_DEFS:
    FOODS_BY_CAT.setdefault(f["category"], []).append(f)

# Build Restaurant Menus ensuring all 7 constraints
# 1. Min 4 menus per restaurant
# 2. Korean restaurants avg >= 6 menus
# 3. Each food in >= 3 restaurants
# 4. Core Korean foods in >= 4 restaurants
# 5. Unique vectors (food_vector + restaurant variation delta)
# 6. Realistic category matching
# 7. Total menus between 210 and 250

REST_MENUS: List[Dict[str, Any]] = []
FOOD_REST_COUNT: Dict[str, int] = {f["id"]: 0 for f in FOOD_DEFS}

# Curated specific menus for the 41 restaurants
REST_FOOD_MAPPINGS: Dict[str, List[str]] = {
    # 한식 10곳 (6~7개 메뉴씩 -> 64개)
    "r_korean_01": ["kimchi_jjigae", "sundubu_jjigae", "budae_jjigae", "doenjang_jjigae", "jeyuk", "haemul_pajeon"],
    "r_korean_02": ["jeyuk", "bulgogi", "bibimbap", "doenjang_jjigae", "haemul_pajeon", "samgyeopsal"],
    "r_korean_03": ["seolleongtang", "yukgaejang", "kimchi_jjigae", "sundubu_jjigae", "bulgogi", "doenjang_jjigae"],
    "r_korean_04": ["jeyuk", "ojingeo_bokkeum", "bulgogi", "bibimbap", "samgyeopsal", "budae_jjigae"],
    "r_korean_05": ["mul_naengmyeon", "bibim_naengmyeon", "bulgogi", "haemul_pajeon", "jeyuk", "bibimbap"],
    "r_korean_06": ["bibimbap", "doenjang_jjigae", "kimchi_jjigae", "jeyuk", "bulgogi", "mul_naengmyeon", "haemul_pajeon"],
    "r_korean_07": ["seolleongtang", "yukgaejang", "bulgogi", "kimchi_jjigae", "bibimbap", "haemul_pajeon"],
    "r_korean_08": ["sundubu_jjigae", "doenjang_jjigae", "kimchi_jjigae", "jeyuk", "ojingeo_bokkeum", "budae_jjigae"],
    "r_korean_09": ["samgyeopsal", "bulgogi", "jeyuk", "doenjang_jjigae", "mul_naengmyeon", "haemul_pajeon"],
    "r_korean_10": ["samgyeopsal", "jeyuk", "kimchi_jjigae", "doenjang_jjigae", "ojingeo_bokkeum", "bibim_naengmyeon"],

    # 중식 5곳 (5~6개씩 -> 26개)
    "r_chinese_01": ["jjajangmyeon", "jjamppong", "tangsuyuk", "fried_rice", "mapo_tofu"],
    "r_chinese_02": ["jjajangmyeon", "jjamppong", "tangsuyuk", "yusanseul", "fried_rice", "mapo_tofu"],
    "r_chinese_03": ["maratang", "mapo_tofu", "fried_rice", "jjamppong", "yangggochi"],
    "r_chinese_04": ["yangggochi", "maratang", "mapo_tofu", "fried_rice", "jjajangmyeon"],
    "r_chinese_05": ["jjajangmyeon", "jjamppong", "tangsuyuk", "yusanseul", "maratang"],

    # 일식 5곳 (5개씩)
    "r_japanese_01": ["tonkotsu_ramen", "shoyu_ramen", "karaage", "gyudon", "donkatsu"],
    "r_japanese_02": ["donkatsu", "karaage", "gyudon", "udon", "soba"],
    "r_japanese_03": ["sushi", "udon", "soba", "donkatsu", "gyudon"],
    "r_japanese_04": ["udon", "soba", "donkatsu", "tonkotsu_ramen", "shoyu_ramen"],
    "r_japanese_05": ["soba", "udon", "sushi", "shoyu_ramen", "donkatsu", "karaage"],

    # 치킨 4곳 (6개씩 -> 24개)
    "r_chicken_01": ["fried_chicken", "yangnyeom_chicken", "soy_chicken", "honey_chicken", "padak", "charcoal_chicken"],
    "r_chicken_02": ["fried_chicken", "yangnyeom_chicken", "garlic_chicken", "honey_chicken", "padak", "spicy_chicken"],
    "r_chicken_03": ["charcoal_chicken", "spicy_chicken", "garlic_chicken", "soy_chicken", "fried_chicken", "yangnyeom_chicken"],
    "r_chicken_04": ["padak", "fried_chicken", "yangnyeom_chicken", "soy_chicken", "garlic_chicken", "spicy_chicken"],

    # 피자 4곳 (6개씩 -> 24개)
    "r_pizza_01": ["pepperoni_pizza", "cheese_pizza", "gorgonzola_pizza", "potato_pizza", "bulgogi_pizza", "hawaiian_pizza"],
    "r_pizza_02": ["pepperoni_pizza", "cheese_pizza", "sweet_potato_pizza", "potato_pizza", "hot_chicken_pizza", "bulgogi_pizza"],
    "r_pizza_03": ["pepperoni_pizza", "cheese_pizza", "hawaiian_pizza", "hot_chicken_pizza", "bulgogi_pizza", "sweet_potato_pizza"],
    "r_pizza_04": ["gorgonzola_pizza", "sweet_potato_pizza", "potato_pizza", "cheese_pizza", "hawaiian_pizza", "hot_chicken_pizza"],

    # 분식 4곳 (6개씩 -> 24개)
    "r_snack_01": ["tteokbokki", "rabokki", "sundae", "twigim", "gimbap", "eomuk"],
    "r_snack_02": ["gimbap", "tteokbokki", "rabokki", "jjolmyeon", "mandu", "eomuk"],
    "r_snack_03": ["twigim", "tteokbokki", "sundae", "mandu", "gimbap", "jjolmyeon"],
    "r_snack_04": ["rabokki", "tteokbokki", "sundae", "eomuk", "jjolmyeon", "mandu"],

    # 카페·디저트 4곳 (6개씩 -> 24개)
    "r_cafe_01": ["chocolate_cake", "cheese_cake", "croffle", "ice_cream", "donut", "salt_bread"],
    "r_cafe_02": ["bagel", "salt_bread", "croffle", "donut", "cheese_cake", "chocolate_cake"],
    "r_cafe_03": ["patbingsu", "ice_cream", "croffle", "donut", "salt_bread", "bagel"],
    "r_cafe_04": ["croffle", "donut", "chocolate_cake", "patbingsu", "ice_cream", "cheese_cake"],

    # 기타·글로벌 5곳 (5~6개씩 -> 26개)
    "r_global_01": ["pho", "pad_thai", "salad", "burger", "taco"],
    "r_global_02": ["pad_thai", "pho", "curry", "salad", "kebab"],
    "r_global_03": ["taco", "kebab", "burger", "salad", "pasta"],
    "r_global_04": ["burger", "pasta", "salad", "taco", "kebab"],
    "r_global_05": ["curry", "pasta", "salad", "burger", "pho", "pad_thai"],
}

# Add remaining foods if any food has less than 3 restaurants
for r_id, food_ids in REST_FOOD_MAPPINGS.items():
    for fid in food_ids:
        FOOD_REST_COUNT[fid] += 1

# Ensure constraint: Each seed food in >= 3 restaurants
for fid, count in FOOD_REST_COUNT.items():
    if count < 3:
        # Find restaurants in matching category
        cat = next(f["category"] for f in FOOD_DEFS if f["id"] == fid)
        rests_in_cat = [r["id"] for r in RESTAURANT_DEFS if r["category"] == cat]
        for rid in rests_in_cat:
            if fid not in REST_FOOD_MAPPINGS[rid]:
                REST_FOOD_MAPPINGS[rid].append(fid)
                FOOD_REST_COUNT[fid] += 1
                if FOOD_REST_COUNT[fid] >= 3:
                    break

# Verify constraints
food_map = {f["id"]: f for f in FOOD_DEFS}
total_menus = sum(len(fids) for fids in REST_FOOD_MAPPINGS.values())
print(f"Total Restaurants: {len(RESTAURANT_DEFS)}")
print(f"Total Menus: {total_menus}")

# Build restaurant menu objects
for rid, fids in REST_FOOD_MAPPINGS.items():
    rest = next(r for r in RESTAURANT_DEFS if r["id"] == rid)
    for idx, fid in enumerate(fids):
        food = food_map[fid]
        # Slight variation per restaurant menu (PRD v4.3 Section 12)
        base_v = food["vector"]
        delta = [round(random.uniform(-0.04, 0.04), 4) for _ in range(6)]
        menu_v = [round(max(0.0, min(1.0, base_v[k] + delta[k])), 4) for k in range(6)]

        pr_range = PRICE_RANGES.get(food["category"], (10000, 15000))
        price = (random.randint(pr_range[0] // 500, pr_range[1] // 500)) * 500

        menu_id = f"rm_{rid}_{fid}"
        REST_MENUS.append({
            "id": menu_id,
            "restaurant_id": rid,
            "food_id": fid,
            "name": f"{rest['name']} {food['name']}",
            "description": food["desc"],
            "price": price,
            "vector": menu_v,
            "is_representative": idx == 0,
            "is_popular": idx in (0, 1),
            "is_available": True,
            "menu_section": "메인 메뉴" if idx < 3 else "인기 메뉴",
            "evidence_count": 0,
            "vector_version": "v4.3",
            "source": "seed",
        })

print(f"Generated {len(REST_MENUS)} RestaurantMenus successfully!")

# Check constraints
for fid, count in FOOD_REST_COUNT.items():
    assert count >= 3, f"Food {fid} only appears in {count} restaurants (min 3 required)"
assert 210 <= len(REST_MENUS) <= 250, f"Total menus {len(REST_MENUS)} out of range 210-250"

# Output 1: JSON seed data for API
os.makedirs("api/data", exist_ok=True)
seed_data = {
    "foods": FOOD_DEFS,
    "restaurants": RESTAURANT_DEFS,
    "restaurant_menus": REST_MENUS,
}
with open("api/data/seed_data.json", "w", encoding="utf-8") as f:
    json.dump(seed_data, f, ensure_ascii=False, indent=2)
print("Saved api/data/seed_data.json")

# Output 2: SQL Migration Schema
schema_sql = """-- Taste Lens Canonical Schema (PRD v4.3 Section 79)
-- 10 Canonical Tables with explicit 6D taste vectors and RLS

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    baseline_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. foods (70 Seed Foods)
CREATE TABLE IF NOT EXISTS public.foods (
    food_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🍽️',
    food_image_url TEXT,
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    source TEXT NOT NULL DEFAULT 'seed',
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);

-- 4. restaurants (41 Restaurants)
CREATE TABLE IF NOT EXISTS public.restaurants (
    restaurant_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    restaurant_type TEXT,
    restaurant_image_url TEXT,
    rating NUMERIC NOT NULL DEFAULT 4.5 CHECK (rating BETWEEN 0 AND 5),
    review_count INT NOT NULL DEFAULT 0,
    delivery_minutes INT NOT NULL DEFAULT 25,
    delivery_fee INT NOT NULL DEFAULT 2000,
    minimum_order INT NOT NULL DEFAULT 12000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);

-- 5. restaurant_menus (210-250 menus)
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
    restaurant_menu_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE,
    food_id TEXT NOT NULL REFERENCES public.foods(food_id) ON DELETE CASCADE,
    menu_name TEXT NOT NULL,
    menu_description TEXT,
    menu_image_url TEXT,
    price INT NOT NULL CHECK (price >= 0),
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    menu_section TEXT NOT NULL DEFAULT '메인 메뉴',
    is_representative BOOLEAN NOT NULL DEFAULT false,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    evidence_count INT NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'seed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, food_id)
);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_food ON public.restaurant_menus(food_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_rest ON public.restaurant_menus(restaurant_id);

-- 6. onboarding_responses
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    question_index INT NOT NULL CHECK (question_index BETWEEN 1 AND 10),
    left_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    right_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    selected_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_responses(user_id);

-- 7. orders
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    restaurant_menu_id TEXT NOT NULL REFERENCES public.restaurant_menus(restaurant_menu_id),
    place_type TEXT NOT NULL DEFAULT 'home',
    time_segment TEXT NOT NULL DEFAULT 'lunch',
    weather_type TEXT NOT NULL DEFAULT 'normal',
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_vector_before JSONB,
    user_vector_after JSONB,
    vector_version_before TEXT,
    vector_version_after TEXT,
    repeat_order BOOLEAN NOT NULL DEFAULT false,
    taste_update_applied BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);

-- 8. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(restaurant_id),
    restaurant_menu_id TEXT NOT NULL REFERENCES public.restaurant_menus(restaurant_menu_id),
    rating NUMERIC NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    user_vector_before JSONB,
    user_vector_after JSONB,
    user_update_applied BOOLEAN NOT NULL DEFAULT false,
    restaurant_update_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_menu ON public.reviews(restaurant_menu_id);

-- 9. review_evidence
CREATE TABLE IF NOT EXISTS public.review_evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('menu_taste', 'user_preference')),
    axis TEXT NOT NULL CHECK (axis IN ('sweet', 'salty', 'sour', 'umami', 'spicy', 'nutty')),
    level INT NOT NULL,
    direction TEXT,
    comparative BOOLEAN NOT NULL DEFAULT false,
    confidence NUMERIC NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
    evidence_text TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'solar-pro4',
    prompt_version TEXT NOT NULL DEFAULT 'v4.3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_evidence_review ON public.review_evidence(review_id);

-- 10. recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    category TEXT,
    candidate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_vector_snapshot JSONB,
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    selected_food_id TEXT REFERENCES public.foods(food_id),
    selected_restaurant_id TEXT REFERENCES public.restaurants(restaurant_id),
    selected_restaurant_menu_id TEXT REFERENCES public.restaurant_menus(restaurant_menu_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Public read access for catalogs
CREATE POLICY foods_public_read ON public.foods FOR SELECT USING (true);
CREATE POLICY restaurants_public_read ON public.restaurants FOR SELECT USING (true);
CREATE POLICY menus_public_read ON public.restaurant_menus FOR SELECT USING (true);

-- User-scoped access
CREATE POLICY users_own ON public.users FOR ALL USING (auth.uid() = user_id);
CREATE POLICY profiles_own ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY onboarding_own ON public.onboarding_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY orders_own ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY reviews_own ON public.reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY review_evidence_read ON public.review_evidence FOR SELECT USING (true);
CREATE POLICY recommendations_own ON public.recommendations FOR ALL USING (auth.uid() = user_id);

-- Auto-sync auth.users to public.users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
"""

with open("supabase/migrations/20260916220000_taste_lens_v43_schema.sql", "w", encoding="utf-8") as f:
    f.write(schema_sql)
print("Saved supabase/migrations/20260916220000_taste_lens_v43_schema.sql")

# Output 3: SQL Seed Data
seed_lines = ["-- Taste Lens Seed Data (70 Foods, 41 Restaurants, 210-250 Menus)\n"]

# Foods
seed_lines.append("-- 1. Foods (70 items)")
for food in FOOD_DEFS:
    v = food["vector"]
    desc = food["desc"].replace("'", "''")
    seed_lines.append(
        f"INSERT INTO public.foods (food_id, name, category, emoji, sweet, salty, sour, umami, spicy, nutty, rationale) "
        f"VALUES ('{food['id']}', '{food['name']}', '{food['category']}', '{food['emoji']}', "
        f"{v[0]}, {v[1]}, {v[2]}, {v[3]}, {v[4]}, {v[5]}, '{desc}') "
        f"ON CONFLICT (food_id) DO UPDATE SET sweet=EXCLUDED.sweet, salty=EXCLUDED.salty, sour=EXCLUDED.sour, "
        f"umami=EXCLUDED.umami, spicy=EXCLUDED.spicy, nutty=EXCLUDED.nutty, emoji=EXCLUDED.emoji;"
    )

# Restaurants
seed_lines.append("\n-- 2. Restaurants (41 places)")
for r in RESTAURANT_DEFS:
    seed_lines.append(
        f"INSERT INTO public.restaurants (restaurant_id, name, category, restaurant_type, rating, review_count, delivery_minutes, delivery_fee, minimum_order) "
        f"VALUES ('{r['id']}', '{r['name']}', '{r['category']}', '{r['type']}', {r['rating']}, {r['reviews']}, {r['del_min']}, {r['fee']}, {r['min_order']}) "
        f"ON CONFLICT (restaurant_id) DO UPDATE SET rating=EXCLUDED.rating, review_count=EXCLUDED.review_count;"
    )

# Menus
seed_lines.append("\n-- 3. Restaurant Menus")
for m in REST_MENUS:
    v = m["vector"]
    desc = m["description"].replace("'", "''")
    name = m["name"].replace("'", "''")
    is_rep = "true" if m["is_representative"] else "false"
    is_pop = "true" if m["is_popular"] else "false"
    seed_lines.append(
        f"INSERT INTO public.restaurant_menus (restaurant_menu_id, restaurant_id, food_id, menu_name, menu_description, price, sweet, salty, sour, umami, spicy, nutty, is_representative, is_popular, menu_section) "
        f"VALUES ('{m['id']}', '{m['restaurant_id']}', '{m['food_id']}', '{name}', '{desc}', {m['price']}, "
        f"{v[0]}, {v[1]}, {v[2]}, {v[3]}, {v[4]}, {v[5]}, {is_rep}, {is_pop}, '{m['menu_section']}') "
        f"ON CONFLICT (restaurant_id, food_id) DO UPDATE SET price=EXCLUDED.price, sweet=EXCLUDED.sweet, salty=EXCLUDED.salty, sour=EXCLUDED.sour, umami=EXCLUDED.umami, spicy=EXCLUDED.spicy, nutty=EXCLUDED.nutty;"
    )

with open("supabase/migrations/20260916220500_taste_lens_v43_seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(seed_lines) + "\n")
print("Saved supabase/migrations/20260916220500_taste_lens_v43_seed.sql")
