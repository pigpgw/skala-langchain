export type Kakao = any;
export type KakaoMapInstance = any;
export type KakaoLatLngBounds = any;

declare global {
  interface Window {
    kakao?: Kakao;
  }
}
