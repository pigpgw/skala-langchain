export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "",
  KAKAO_JS_KEY: required(
    "VITE_KAKAO_JS_KEY",
    import.meta.env.VITE_KAKAO_JS_KEY,
  ),
} as const;

function required(key: string, value: string | undefined): string {
  if (!value) throw new Error(`환경변수 ${key}가 설정되지 않았습니다`);
  return value;
}
