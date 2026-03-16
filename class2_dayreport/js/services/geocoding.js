/**
 * 카카오맵 REST API 주소 → 좌표 변환. API 키는 window.KAKAO_MAP_REST_KEY 또는 환경에 설정.
 */
const REST_KEY = typeof window !== 'undefined' ? window.KAKAO_MAP_REST_KEY || '' : '';

export async function geocodeAddress(address) {
  if (!address || !String(address).trim()) return { lat: null, lng: null, error: '주소 없음' };
  if (!REST_KEY) return { lat: null, lng: null, error: 'KAKAO_MAP_REST_KEY 미설정' };
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${REST_KEY}` } }
    );
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      return { lat: parseFloat(doc.y), lng: parseFloat(doc.x), error: null };
    }
    return { lat: null, lng: null, error: '결과 없음' };
  } catch (err) {
    return { lat: null, lng: null, error: err.message || '지오코딩 실패' };
  }
}

export async function geocodeIncident(incident) {
  const { lat, lng, error } = await geocodeAddress(incident.address_raw);
  return { ...incident, lat, lng, geo_failed: !!error };
}
