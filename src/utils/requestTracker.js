// 요청 추적기 - 중복 API 호출 방지
class RequestTracker {
  constructor() {
    this.pendingRequests = new Map();
    this.completedRequests = new Set();
    this.requestCounts = new Map();
  }

  // 요청 시작 전 체크
  canMakeRequest(key, maxCount = 2) { // 기본값을 2로 줄임
    const count = this.requestCounts.get(key) || 0;
    
    console.log(`요청 추적: ${key} - 현재 ${count}회 호출됨`);
    
    if (count >= maxCount) {
      console.error(`🚫 요청 제한: ${key} - ${maxCount}회 초과하여 차단`);
      return false;
    }
    
    if (this.pendingRequests.has(key)) {
      console.error(`🚫 중복 요청 차단: ${key} - 이미 진행 중`);
      return false;
    }
    
    return true;
  }

  // 요청 시작
  startRequest(key) {
    this.pendingRequests.set(key, Date.now());
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);
    console.log(`요청 시작: ${key} (${count + 1}회째)`);
  }

  // 요청 완료
  endRequest(key) {
    this.pendingRequests.delete(key);
    this.completedRequests.add(key);
    console.log(`요청 완료: ${key}`);
  }

  // 요청 실패
  failRequest(key) {
    this.pendingRequests.delete(key);
    console.log(`요청 실패: ${key}`);
  }

  // 통계 출력
  getStats() {
    return {
      pending: Array.from(this.pendingRequests.keys()),
      completed: Array.from(this.completedRequests),
      counts: Object.fromEntries(this.requestCounts)
    };
  }

  // 리셋
  reset() {
    this.pendingRequests.clear();
    this.completedRequests.clear();
    this.requestCounts.clear();
    console.log('요청 추적기 리셋됨');
  }
}

export const requestTracker = new RequestTracker();

// 디버깅용 - 글로벌 접근 가능
if (typeof window !== 'undefined') {
  window.requestTracker = requestTracker;
}