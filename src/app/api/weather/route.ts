import { NextRequest, NextResponse } from "next/server";
const CITIES: Record<string, [number, number]> = {
  seoul: [37.5665, 126.978],
  busan: [35.1796, 129.0756],
  daejeon: [36.3504, 127.3845],
  jeju: [33.4996, 126.5312],
};
export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") || "seoul";
  if (!CITIES[city])
    return NextResponse.json(
      { error: "지원하지 않는 지역입니다." },
      { status: 400 },
    );
  const [lat, lon] = CITIES[city];
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul`,
      { next: { revalidate: 600 }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) throw new Error("weather unavailable");
    const data = await res.json(),
      temp = data.current?.temperature_2m,
      code = data.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number")
      throw new Error("invalid weather");
    const weather =
      code >= 51 ? "rain" : temp >= 28 ? "hot" : temp <= 5 ? "cold" : "normal";
    return NextResponse.json({
      weather,
      temperature: temp,
      city,
      observed_at: data.current.time,
      source: "Open-Meteo",
    });
  } catch {
    return NextResponse.json({
      weather: "unknown",
      temperature: null,
      city,
      source: "unavailable",
      message: "날씨를 가져오지 못해 날씨 보정을 제외했어요.",
    });
  }
}
