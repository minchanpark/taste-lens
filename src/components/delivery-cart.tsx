import {
  ArrowRight,
  Bike,
  Check,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { foodPhoto, money, type Cart, type Checkout } from "@/lib/delivery";
export default function DeliveryCart({
  cart,
  pending,
  completed,
  mode,
  busy,
  loggedIn,
  onMode,
  onQuantity,
  onRemove,
  onReplace,
  onKeep,
  onCheckout,
  onBrowse,
  onHistory,
}: {
  cart: Cart | null;
  pending: Cart | null;
  completed: Checkout | null;
  mode: "delivery" | "pickup";
  busy: boolean;
  loggedIn: boolean;
  onMode: (v: "delivery" | "pickup") => void;
  onQuantity: (n: number) => void;
  onRemove: () => void;
  onReplace: () => void;
  onKeep: () => void;
  onCheckout: () => void;
  onBrowse: () => void;
  onHistory: () => void;
}) {
  if (pending)
    return (
      <div className="cart-replace">
        <ShoppingBag size={35} />
        <h2>다른 가게의 메뉴를 담을까요?</h2>
        <p>
          한 번에 한 가게에서 주문할 수 있어요.
          <br />
          기존 메뉴를 비우고 <b>{pending.food.name}</b>을 담습니다.
        </p>
        <button className="primary full" onClick={onReplace}>
          새 가게 메뉴 담기
        </button>
        <button className="text-button" onClick={onKeep}>
          기존 장바구니 유지하기
        </button>
      </div>
    );
  if (completed)
    return (
      <div className="checkout-success">
        <span>
          <Check size={36} />
        </span>
        <div className="blue-overline">ORDER RECEIVED</div>
        <h2>테스트 주문이 접수됐어요!</h2>
        <p>
          실제 결제나 배달은 진행되지 않습니다.
          <br />
          주문내역에 저장한 메뉴를 확인해 보세요.
        </p>
        <div className="receipt">
          <div>
            <span>주문번호</span>
            <b>{completed.id.slice(0, 8).toUpperCase()}</b>
          </div>
          <div>
            <span>주문 방식</span>
            <b>{completed.mode === "pickup" ? "포장" : "배달"}</b>
          </div>
          <div>
            <span>주문 수량</span>
            <b>{completed.quantity}개</b>
          </div>
          <div>
            <span>테스트 주문 금액</span>
            <b>{money(completed.total)}</b>
          </div>
          <div>
            <span>실제 결제 금액</span>
            <b>0원</b>
          </div>
        </div>
        <button className="primary full" onClick={onHistory}>
          주문내역 보기 <ArrowRight size={16} />
        </button>
        <button className="text-button" onClick={onBrowse}>
          맛있는 메뉴 더 둘러보기
        </button>
      </div>
    );
  if (!cart)
    return (
      <div className="empty-cart">
        <ShoppingBag size={46} />
        <h2>아직 장바구니가 비어 있어요</h2>
        <p>먹고 싶은 메뉴를 골라 담아보세요.</p>
        <button className="primary" onClick={onBrowse}>
          메뉴 보러 가기 <ArrowRight size={16} />
        </button>
      </div>
    );
  const fee = mode === "pickup" ? 0 : 2000;
  return (
    <div className="delivery-cart">
      <span className="blue-overline">YOUR NEXT GOOD MEAL</span>
      <h2>장바구니</h2>
      <div className="cart-store">
        <ShoppingBag size={18} />
        <b>{cart.menu.name}</b>
      </div>
      <div className="cart-item">
        <img src={foodPhoto(cart.food)} alt="메뉴 카테고리 예시" />
        <div>
          <h3>{cart.food.name}</h3>
          <p>{cart.menu.description}</p>
          <b>{money(cart.menu.price)}</b>
        </div>
        <button aria-label="메뉴 삭제" onClick={onRemove} disabled={busy}>
          <Trash2 size={17} />
        </button>
      </div>
      <div className="cart-quantity">
        <span>메뉴 수량</span>
        <div>
          <button
            aria-label="수량 줄이기"
            disabled={busy || cart.quantity <= 1}
            onClick={() => onQuantity(cart.quantity - 1)}
          >
            <Minus size={15} />
          </button>
          <b data-testid="cart-quantity">{cart.quantity}</b>
          <button
            aria-label="수량 늘리기"
            disabled={busy || cart.quantity >= 10}
            onClick={() => onQuantity(cart.quantity + 1)}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div className="cart-mode">
        <button
          disabled={busy}
          className={mode === "delivery" ? "active" : ""}
          onClick={() => onMode("delivery")}
        >
          <Bike size={17} />
          배달
        </button>
        <button
          disabled={busy}
          className={mode === "pickup" ? "active" : ""}
          onClick={() => onMode("pickup")}
        >
          <ShoppingBag size={16} />
          포장
        </button>
      </div>
      <div className="receipt">
        <div>
          <span>메뉴 금액</span>
          <b>{money(cart.menu.price * cart.quantity)}</b>
        </div>
        <div>
          <span>배달비</span>
          <b>{money(fee)}</b>
        </div>
        <div className="receipt-total">
          <span>총 주문 금액</span>
          <b>{money(cart.menu.price * cart.quantity + fee)}</b>
        </div>
      </div>
      <div className="test-payment-note">
        <Check size={15} />
        <span>
          결제 없는 테스트 주문이에요.
          <br />
          실제 식당으로 전달되거나 배달되지 않습니다.
        </span>
      </div>
      <button
        className="primary full checkout-button"
        disabled={busy}
        onClick={onCheckout}
      >
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <ShoppingBag size={18} />
        )}{" "}
        {loggedIn ? "테스트 주문하기" : "로그인하고 주문하기"}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
