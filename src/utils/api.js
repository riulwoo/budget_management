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
    
    const response = await fetch(`/api${url}`, {
      headers,
      ...options
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('API 호출 오류:', error);
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