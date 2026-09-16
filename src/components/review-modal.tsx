"use client";

import { useState } from "react";
import { Star, Sparkles, Check, ArrowRight, X, LoaderCircle } from "lucide-react";
import { apiClient, type ReviewResponse } from "@/lib/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  orderId?: string;
  currentUserVector: number[];
  onUserVectorUpdated?: (newVector: number[]) => void;
};

export default function ReviewModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  menuId,
  menuName,
  orderId,
  currentUserVector,
  onUserVectorUpdated,
}: Props) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImpactDetail, setShowImpactDetail] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.submitReview({
        restaurant_id: restaurantId,
        restaurant_menu_id: menuId,
        rating,
        review_text: reviewText.trim(),
        user_vector: currentUserVector,
        order_id: orderId,
      });
      setResult(res);
      if (res.user_update_applied && res.user_vector_after && onUserVectorUpdated) {
        onUserVectorUpdated(res.user_vector_after);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setReviewText("");
    setShowImpactDetail(false);
    setError(null);
    onClose();
  }

  return (
    <div className="review-modal-backdrop">
      <div className="review-modal">
        <button
          onClick={handleClose}
          className="review-modal-close"
          aria-label="닫기"
        >
          <X size={18} />
        </button>

        {!result ? (
          <div>
            <div style={{ marginBottom: 14 }}>
              <span className="review-badge">
                <Sparkles size={13} /> Solar Pro 4 미각 학습 리뷰
              </span>
              <h2 className="review-title">
                {restaurantName} · {menuName}
              </h2>
              <p className="review-desc">
                솔직한 맛 평가를 남겨주시면 AI가 내 입맛 벡터를 더욱 정밀하게 학습해요.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                  별점
                </label>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="star-btn"
                    >
                      <Star
                        size={26}
                        fill={star <= rating ? "#fbbf24" : "none"}
                        color={star <= rating ? "#fbbf24" : "#d1d5db"}
                      />
                    </button>
                  ))}
                  <span style={{ marginLeft: 8, fontWeight: 700 }}>{rating}.0</span>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                  맛 평가 &amp; 취향 표현
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="예: 다른 집보다 덜 달아서 좋고, 제 입맛에는 조금 더 매워도 좋았을 것 같아요!"
                  rows={4}
                  className="review-textarea"
                  required
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 8 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !reviewText.trim()}
                className="review-submit-btn"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="spin" />
                    <span>Solar Pro 4가 취향을 분석하고 있어요...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>리뷰 등록하고 취향 반영하기</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* PRD Section 76: Review Impact UX */
          <div>
            <div className="review-success-header">
              <div className="review-check-icon">
                <Check size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                  리뷰가 등록됐어요!
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "3px 0 0" }}>
                  Solar Pro 4 해석 완료 · {result.model_used}
                </p>
              </div>
            </div>

            <div className="impact-box">
              <div className="impact-box-header">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} /> 이 리뷰가 내 취향에 어떻게 반영됐을까요?
                </span>
                <button
                  type="button"
                  onClick={() => setShowImpactDetail(!showImpactDetail)}
                  className="impact-detail-btn"
                >
                  {showImpactDetail ? "간략히 보기" : "상세 분석 보기"}
                </button>
              </div>

              {result.user_update_applied && result.impacts.length > 0 ? (
                <div style={{ marginTop: 12 }}>
                  {result.impacts.map((imp, idx) => (
                    <div key={idx} className="impact-axis-card">
                      <div>
                        <div className="impact-axis-label">{imp.axis_label}</div>
                        <div className="impact-axis-evidence">“{imp.evidence_text}”</div>
                      </div>
                      <div className="impact-axis-scores">
                        <span>{imp.before.toFixed(2)}</span>
                        <ArrowRight size={13} color="var(--muted)" />
                        <span className="after">{imp.after.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: "#2e7d32", marginTop: 10, fontWeight: 600 }}>
                    ✨ 내 미각 프로필이 리뷰 선호에 맞춰 미세 조정되었습니다.
                  </p>
                </div>
              ) : (
                /* PRD Section 77 */
                <div className="impact-neutral-card">
                  <p style={{ fontWeight: 700, margin: 0 }}>
                    이번 리뷰에서는 내 취향 점수가 바뀌지 않았어요.
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                    메뉴의 맛 정보는 식당 데이터에 학습되었지만, 개인 선호에 대한 명확한 표현은 없어 프로필은 안전하게 유지되었어요.
                  </p>
                </div>
              )}

              {showImpactDetail && result.menu_taste_claims.length > 0 && (
                <div className="impact-menu-claims">
                  <p style={{ fontWeight: 700, color: "var(--muted)", margin: "0 0 6px" }}>
                    식당 메뉴 데이터에 학습된 맛 특성:
                  </p>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {result.menu_taste_claims.map((c, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        <span className="impact-claim-tag">{c.axis}</span>
                        {" "}“{c.evidence_text}”
                        <span style={{ color: "var(--muted)", marginLeft: 4 }}>
                          (강도 {c.level > 0 ? `+${c.level}` : c.level}, 신뢰도 {Math.round(c.confidence * 100)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="primary"
              style={{ width: "100%", marginTop: 8 }}
            >
              확인 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
