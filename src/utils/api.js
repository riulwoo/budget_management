// API 호출 함수
export const apiCall = async (url, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // 인증 토큰이 있으면 헤더에 추가
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    
    console.log(`🔄 API 요청: ${options.method || 'GET'} /api${url}`);
    
    const response = await fetch(`/api${url}`, {
      headers,
      ...options
    });
    
    console.log('응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP 오류 응답:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('응답 데이터:', data);
    
    // success 프로퍼티가 없거나 false인 경우 처리
    if (data.hasOwnProperty('success') && !data.success) {
      throw new Error(data.message || '알 수 없는 오류');
    }
    
    // success 프로퍼티가 있으면 data 반환, 없으면 전체 데이터 반환
    const result = data.hasOwnProperty('success') ? data.data : data;
    console.log(`✅ API 응답: ${options.method || 'GET'} /api${url} 완료`);
    return result;
  } catch (error) {
    console.error(`❌ API 오류: ${options.method || 'GET'} /api${url}`, error.message);
    throw error;
  }
};

// 날짜 포맷팅 함수
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
};

// 금액 포맷팅 함수
export const formatAmount = (amount) => {
  return `₩${parseFloat(amount).toLocaleString()}`;
};

// 색상 밝기 계산 함수
export const getColorBrightness = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// 색상에 따른 텍스트 색상 결정
export const getTextColor = (backgroundColor) => {
  const brightness = getColorBrightness(backgroundColor);
  return brightness > 128 ? '#000' : '#fff';
}; 