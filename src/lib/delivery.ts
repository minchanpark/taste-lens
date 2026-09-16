import type { Food, Menu } from "./taste";
export type Cart = { menu: Menu; food: Food; quantity: number };
export type Checkout = {
  id: string;
  menu_id: string;
  food_id: string;
  quantity: number;
  mode: string;
  unit_price: number;
  delivery_fee: number;
  total: number;
  created_at: string;
};
export function foodPhoto(food: Pick<Food, "id" | "category">) {
  if (food.id === "burger") return "/food/burger.jpg";
  if (food.id === "pizza") return "/food/pizza.jpg";
  if (food.id === "sushi") return "/food/sushi.jpg";
  if (food.category === "치킨" || food.id === "donkatsu")
    return "/food/chicken.jpg";
  if (food.category === "샐러드")
    return "/food/salad.jpg";
  if (
    [
      "ramen",
      "udon",
      "pho",
      "jjajang",
      "naengmyeon",
      "kongguksu",
      "padthai",
      "pasta",
    ].includes(food.id)
  )
    return "/food/noodles.jpg";
  return "/food/korean.jpg";
}
export function deliveryMinutes(menu: Menu) {
  return 20 + (menu.price % 4) * 5 + (menu.id.endsWith("-3") ? 10 : 0);
}
export const money = (n: number) => `${n.toLocaleString("ko-KR")}원`;
