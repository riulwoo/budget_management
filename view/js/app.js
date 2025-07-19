// 전역 변수
let currentMonth = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
let categories = [];
let transactions = [];
let charts = {};
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let calendarDate = new Date(); // 달력에서 표시할 날짜
let monthlyTransactions = {}; // 월별 거래내역 캐시

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 토큰이 있으면 사용자 정보 로드
    if (authToken) {
        loadUserProfile();
    }
    
    loadCategories();
    loadTransactions();
    updateDashboard();
    document.getElementById('transaction-month').value = currentMonth;
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    updateAuthUI();
});

// API 호출 함수
async function apiCall(url, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // 인증 토큰이 있으면 헤더에 추가
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
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
        alert('오류가 발생했습니다: ' + error.message);
        throw error;
    }
}

// 인증 UI 업데이트
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const calendarAddBtn = document.getElementById('calendar-add-btn');
    const balanceSettingsLink = document.getElementById('balance-settings-link');
    
    if (currentUser) {
        userInfo.style.display = 'block';
        authButtons.style.display = 'none';
        document.getElementById('username-display').textContent = currentUser.username;
        
        if (addTransactionBtn) addTransactionBtn.style.display = 'inline-block';
        if (addCategoryBtn) addCategoryBtn.style.display = 'inline-block';
        if (calendarAddBtn) calendarAddBtn.style.display = 'inline-block';
        if (balanceSettingsLink) balanceSettingsLink.style.display = 'block';
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'block';
        
        if (addTransactionBtn) addTransactionBtn.style.display = 'none';
        if (addCategoryBtn) addCategoryBtn.style.display = 'none';
        if (calendarAddBtn) calendarAddBtn.style.display = 'none';
        if (balanceSettingsLink) balanceSettingsLink.style.display = 'none';
    }
}

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        const user = await apiCall('/auth/profile');
        currentUser = user;
        updateAuthUI();
    } catch (error) {
        // 토큰이 유효하지 않으면 로그아웃
        logout();
    }
}

// 로그인 모달 표시
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    document.getElementById('login-form').reset();
    modal.show();
}

// 회원가입 모달 표시
function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    document.getElementById('register-form').reset();
    modal.show();
}

// 프로필 모달 표시
function showProfileModal() {
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    document.getElementById('profile-username').value = currentUser.username;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('change-password-form').reset();
    modal.show();
}

// 아이디 찾기 모달 표시
function showFindUsernameModal() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) {
        loginModal.hide();
    }
    
    const modal = new bootstrap.Modal(document.getElementById('findUsernameModal'));
    document.getElementById('find-username-form').reset();
    document.getElementById('find-username-result').style.display = 'none';
    modal.show();
}

// 비밀번호 재설정 모달 표시
function showResetPasswordModal() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) {
        loginModal.hide();
    }
    
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    document.getElementById('reset-password-form').reset();
    document.getElementById('reset-password-result').style.display = 'none';
    modal.show();
}

// 로그인
async function login() {
    try {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            alert('사용자명과 비밀번호를 입력해주세요.');
            return;
        }
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            updateAuthUI();
            loadCategories();
            loadTransactions();
            updateDashboard();
            
            alert('로그인이 완료되었습니다.');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}

// 회원가입
async function register() {
    try {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        if (!username || !email || !password || !passwordConfirm) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        if (password.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            updateAuthUI();
            loadCategories();
            loadTransactions();
            updateDashboard();
            
            alert('회원가입이 완료되었습니다.');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert('회원가입 중 오류가 발생했습니다.');
    }
}

// 로그아웃
function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
    
    // 데이터 초기화
    categories = [];
    transactions = [];
    updateCategoriesList();
    updateTransactionsList();
    updateDashboard();
    
    alert('로그아웃되었습니다.');
}

// 비밀번호 변경
async function changePassword() {
    try {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const newPasswordConfirm = document.getElementById('new-password-confirm').value;
        
        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        if (newPassword !== newPasswordConfirm) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }
        
        await apiCall('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
        alert('비밀번호가 변경되었습니다.');
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
}

// 아이디 찾기
async function findUsername() {
    try {
        const email = document.getElementById('find-username-email').value;
        
        if (!email) {
            alert('이메일 주소를 입력해주세요.');
            return;
        }
        
        const response = await fetch('/api/auth/find-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('find-username-result');
        
        if (data.success) {
            resultDiv.className = 'alert alert-success';
            resultDiv.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>아이디 찾기 완료!</strong><br>
                해당 이메일로 등록된 아이디는 <strong>${data.data.username}</strong> 입니다.
            `;
        } else {
            resultDiv.className = 'alert alert-danger';
            resultDiv.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>아이디 찾기 실패</strong><br>
                ${data.message}
            `;
        }
        
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('아이디 찾기 오류:', error);
        alert('아이디 찾기 중 오류가 발생했습니다.');
    }
}

// 비밀번호 재설정
async function resetPassword() {
    try {
        const email = document.getElementById('reset-password-email').value;
        
        if (!email) {
            alert('이메일 주소를 입력해주세요.');
            return;
        }
        
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('reset-password-result');
        
        if (data.success) {
            resultDiv.className = 'alert alert-success';
            resultDiv.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>비밀번호 재설정 완료!</strong><br>
                임시 비밀번호 <strong>${data.data.tempPassword}</strong>가 발급되었습니다.<br>
                로그인 후 반드시 비밀번호를 변경해주세요.
            `;
        } else {
            resultDiv.className = 'alert alert-danger';
            resultDiv.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>비밀번호 재설정 실패</strong><br>
                ${data.message}
            `;
        }
        
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        alert('비밀번호 재설정 중 오류가 발생했습니다.');
    }
}

// 달력 관련 함수들
function showCalendar() {
    document.getElementById('page-title').textContent = '달력';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('calendar-content').style.display = 'block';
    document.getElementById('transactions-content').style.display = 'none';
    document.getElementById('categories-content').style.display = 'none';
    document.getElementById('stats-content').style.display = 'none';
    renderCalendar();
}

function previousMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
}

async function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // 월/년도 표시 업데이트
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    document.getElementById('month-year-display').textContent = `${year}년 ${monthNames[month]}`;
    
    // 해당 월의 거래내역 로드
    await loadMonthlyTransactions(year, month + 1);
    
    // 달력 그리드 생성
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // 요일 헤더 추가
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // 달력 날짜 생성
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    
    // 6주(42일) 표시를 위해 반복
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // 다른 월의 날짜인지 확인
        if (currentDate.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        // 오늘 날짜인지 확인
        if (isCurrentMonth && currentDate.getDate() === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // 날짜 표시
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDate.getDate();
        dayElement.appendChild(dayNumber);
        
        // 해당 날짜의 거래내역 표시
        const dateString = currentDate.toISOString().split('T')[0];
        const dayTransactions = monthlyTransactions[dateString] || [];
        
        if (dayTransactions.length > 0) {
            dayElement.classList.add('has-transactions');
            
            const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            // 거래 요약 표시
            if (income > 0) {
                const incomeElement = document.createElement('div');
                incomeElement.className = 'day-income';
                incomeElement.textContent = `+${income.toLocaleString()}`;
                dayElement.appendChild(incomeElement);
            }
            
            if (expense > 0) {
                const expenseElement = document.createElement('div');
                expenseElement.className = 'day-expense';
                expenseElement.textContent = `-${expense.toLocaleString()}`;
                dayElement.appendChild(expenseElement);
            }
            
            // 거래 개수 표시 (3개 이상일 때)
            if (dayTransactions.length > 2) {
                const countElement = document.createElement('div');
                countElement.className = 'day-transactions';
                countElement.textContent = `+${dayTransactions.length - 2}건`;
                dayElement.appendChild(countElement);
            }
        }
        
        // 날짜 클릭 이벤트
        dayElement.onclick = () => showAddTransactionForDate(dateString);
        
        grid.appendChild(dayElement);
    }
}

async function loadMonthlyTransactions(year, month) {
    try {
        const transactions = await apiCall(`/transactions/${year}/${month}`);
        monthlyTransactions = {};
        
        transactions.forEach(transaction => {
            const date = transaction.date;
            if (!monthlyTransactions[date]) {
                monthlyTransactions[date] = [];
            }
            monthlyTransactions[date].push(transaction);
        });
    } catch (error) {
        console.error('월별 거래내역 로드 오류:', error);
        monthlyTransactions = {};
    }
}

function showAddTransactionForDate(dateString) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    // 해당 날짜의 거래내역이 있으면 상세 정보 표시
    const dayTransactions = monthlyTransactions[dateString] || [];
    if (dayTransactions.length > 0) {
        showDayTransactionsModal(dateString, dayTransactions);
    } else {
        // 거래내역이 없으면 새 거래 추가 모달 표시
        const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-date').value = dateString;
        modal.show();
    }
}

// 날짜별 거래내역 모달 표시
function showDayTransactionsModal(dateString, transactions) {
    const modal = new bootstrap.Modal(document.getElementById('dayTransactionsModal'));
    
    // 날짜 표시
    const date = new Date(dateString);
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    document.getElementById('day-transactions-date').textContent = formattedDate;
    
    // 거래내역 목록 생성
    const transactionsList = document.getElementById('day-transactions-list');
    transactionsList.innerHTML = '';
    
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // 요약 정보 추가
    const summaryHtml = `
        <div class="alert alert-info mb-3">
            <div class="row text-center">
                <div class="col-4">
                    <div class="text-success">수입</div>
                    <div class="fw-bold">+₩${income.toLocaleString()}</div>
                </div>
                <div class="col-4">
                    <div class="text-danger">지출</div>
                    <div class="fw-bold">-₩${expense.toLocaleString()}</div>
                </div>
                <div class="col-4">
                    <div class="text-primary">잔액</div>
                    <div class="fw-bold">₩${(income - expense).toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
    transactionsList.innerHTML = summaryHtml;
    
    // 거래내역 목록 추가
    transactions.forEach(transaction => {
        const transactionHtml = `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <div class="fw-bold">${transaction.description || '설명 없음'}</div>
                    <small class="text-muted">${transaction.category_name || '카테고리 없음'}</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'income' ? '+' : '-'}₩${parseFloat(transaction.amount).toLocaleString()}
                    </div>
                    <small class="text-muted">${transaction.created_at ? new Date(transaction.created_at).toLocaleTimeString() : ''}</small>
                </div>
            </div>
        `;
        transactionsList.innerHTML += transactionHtml;
    });
    
    // 새 거래 추가 버튼 설정
    document.getElementById('add-transaction-for-date').onclick = () => {
        modal.hide();
        const addModal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
        document.getElementById('transaction-form').reset();
        document.getElementById('transaction-date').value = dateString;
        addModal.show();
    };
    
    modal.show();
}

// 카테고리 로드
async function loadCategories() {
    try {
        categories = await apiCall('/categories');
        updateCategorySelects();
        updateCategoriesList();
    } catch (error) {
        console.error('카테고리 로드 오류:', error);
    }
}

// 거래내역 로드
async function loadTransactions() {
    try {
        const [year, month] = currentMonth.split('-');
        transactions = await apiCall(`/transactions/${year}/${month}`);
        updateTransactionsList();
        updateDashboard();
    } catch (error) {
        console.error('거래내역 로드 오류:', error);
    }
}

// 대시보드 업데이트
async function updateDashboard() {
    try {
        const [year, month] = currentMonth.split('-');
        const stats = await apiCall(`/stats/${year}/${month}`);
        const categoryStats = await apiCall(`/stats/${year}/${month}/categories`);
        
        // 통계 업데이트
        document.getElementById('monthly-income').textContent = `₩${stats.income.total.toLocaleString()}`;
        document.getElementById('monthly-expense').textContent = `₩${stats.expense.total.toLocaleString()}`;
        document.getElementById('monthly-balance').textContent = `₩${(stats.income.total - stats.expense.total).toLocaleString()}`;
        
        // 총 잔액 업데이트 (로그인한 사용자인 경우만)
        if (currentUser) {
            try {
                const totalBalance = await apiCall('/balance/total');
                document.getElementById('total-balance').textContent = `₩${totalBalance.current_balance.toLocaleString()}`;
            } catch (error) {
                console.error('총 잔액 로드 오류:', error);
                document.getElementById('total-balance').textContent = '₩0';
            }
        }
        
        // 최근 거래내역 업데이트
        updateRecentTransactions();
        
        // 차트 업데이트
        updateCategoryChart(categoryStats);
    } catch (error) {
        console.error('대시보드 업데이트 오류:', error);
    }
}

// 최근 거래내역 업데이트
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const recentTransactions = transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="text-muted">거래내역이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="d-flex justify-content-between align-items-center mb-2 transaction-item">
            <div>
                <div class="fw-bold">${transaction.description || '설명 없음'}</div>
                <small class="text-muted">${transaction.date}</small>
                ${transaction.category_name ? `<span class="badge category-badge" style="background-color: ${transaction.category_color}">${transaction.category_name}</span>` : ''}
            </div>
            <div class="text-end">
                <div class="fw-bold ${transaction.type === 'income' ? 'income' : 'expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}₩${parseFloat(transaction.amount).toLocaleString()}
                </div>
                ${currentUser ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

// 거래내역 목록 업데이트
function updateTransactionsList() {
    const container = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="text-muted">거래내역이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="d-flex justify-content-between align-items-center mb-3 p-3 border rounded transaction-item">
            <div>
                <div class="fw-bold">${transaction.description || '설명 없음'}</div>
                <small class="text-muted">${transaction.date}</small>
                ${transaction.category_name ? `<span class="badge category-badge" style="background-color: ${transaction.category_color}">${transaction.category_name}</span>` : ''}
            </div>
            <div class="text-end">
                <div class="fw-bold ${transaction.type === 'income' ? 'income' : 'expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}₩${parseFloat(transaction.amount).toLocaleString()}
                </div>
                ${currentUser ? `<div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editTransaction(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

// 카테고리 목록 업데이트
function updateCategoriesList() {
    const container = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted">카테고리가 없습니다.</p>';
        return;
    }
    
    // 카테고리 통계 업데이트
    updateCategoryStats();
    
    container.innerHTML = categories.map(category => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-3 border rounded category-item" data-category-id="${category.id}">
            <div class="d-flex align-items-center">
                <span class="badge category-badge me-2" style="background-color: ${category.color}">${category.name}</span>
                <div>
                    <small class="text-muted d-block">${category.type === 'income' ? '수입' : '지출'}</small>
                    <small class="text-muted">사용 횟수: ${category.usage_count || 0}회</small>
                </div>
            </div>
            ${currentUser ? `<div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editCategory(${category.id})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteCategory(${category.id})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : ''}
        </div>
    `).join('');
}

// 카테고리 통계 업데이트
function updateCategoryStats() {
    const totalCategories = categories.length;
    const incomeCategories = categories.filter(c => c.type === 'income').length;
    const expenseCategories = categories.filter(c => c.type === 'expense').length;
    const usedCategories = categories.filter(c => (c.usage_count || 0) > 0).length;
    
    document.getElementById('total-categories').textContent = totalCategories;
    document.getElementById('income-categories').textContent = incomeCategories;
    document.getElementById('expense-categories').textContent = expenseCategories;
    document.getElementById('used-categories').textContent = usedCategories;
}

// 카테고리 검색 및 필터링
function filterCategories() {
    const searchTerm = document.getElementById('category-search').value.toLowerCase();
    const typeFilter = document.getElementById('category-type-filter').value;
    const sortBy = document.getElementById('category-sort').value;
    
    let filteredCategories = categories.filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || category.type === typeFilter;
        return matchesSearch && matchesType;
    });
    
    // 정렬
    filteredCategories.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return a.type.localeCompare(b.type);
            case 'usage':
                return (b.usage_count || 0) - (a.usage_count || 0);
            default:
                return 0;
        }
    });
    
    // 필터링된 결과 표시
    const container = document.getElementById('categories-list');
    
    if (filteredCategories.length === 0) {
        container.innerHTML = '<p class="text-muted">검색 결과가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = filteredCategories.map(category => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-3 border rounded category-item" data-category-id="${category.id}">
            <div class="d-flex align-items-center">
                <span class="badge category-badge me-2" style="background-color: ${category.color}">${category.name}</span>
                <div>
                    <small class="text-muted d-block">${category.type === 'income' ? '수입' : '지출'}</small>
                    <small class="text-muted">사용 횟수: ${category.usage_count || 0}회</small>
                </div>
            </div>
            ${currentUser ? `<div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="editCategory(${category.id})" title="수정">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="deleteCategory(${category.id})" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>` : ''}
        </div>
    `).join('');
}

// 카테고리 선택 옵션 업데이트
function updateCategorySelects() {
    const selects = ['transaction-category'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">선택하세요</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    });
}

// 차트 업데이트
function updateCategoryChart(categoryStats) {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    
    const expenseStats = categoryStats.filter(stat => stat.type === 'expense');
    
    if (charts.categoryChart) {
        charts.categoryChart.destroy();
    }
    
    if (expenseStats.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    
    ctx.style.display = 'block';
    charts.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseStats.map(stat => stat.category_name),
            datasets: [{
                data: expenseStats.map(stat => stat.total_amount),
                backgroundColor: expenseStats.map(stat => stat.category_color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 페이지 전환 함수들
function showDashboard() {
    document.getElementById('page-title').textContent = '대시보드';
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('calendar-content').style.display = 'none';
    document.getElementById('transactions-content').style.display = 'none';
    document.getElementById('categories-content').style.display = 'none';
    document.getElementById('stats-content').style.display = 'none';
    updateDashboard();
}

function showTransactions() {
    document.getElementById('page-title').textContent = '거래내역';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('calendar-content').style.display = 'none';
    document.getElementById('transactions-content').style.display = 'block';
    document.getElementById('categories-content').style.display = 'none';
    document.getElementById('stats-content').style.display = 'none';
    loadTransactions();
}

function showCategories() {
    document.getElementById('page-title').textContent = '카테고리';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('calendar-content').style.display = 'none';
    document.getElementById('transactions-content').style.display = 'none';
    document.getElementById('categories-content').style.display = 'block';
    document.getElementById('stats-content').style.display = 'none';
    loadCategories();
}

function showStats() {
    document.getElementById('page-title').textContent = '통계';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('calendar-content').style.display = 'none';
    document.getElementById('transactions-content').style.display = 'none';
    document.getElementById('categories-content').style.display = 'none';
    document.getElementById('stats-content').style.display = 'block';
    loadStats();
}

// 모달 표시 함수들
function showAddTransactionModal() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    modal.show();
}

function showAddCategoryModal() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    document.getElementById('category-form').reset();
    document.getElementById('category-color').value = '#007bff';
    updateColorPreview('category-color', 'color-preview');
    modal.show();
}

// 색상 미리보기 업데이트
function updateColorPreview(colorInputId, previewId) {
    const colorInput = document.getElementById(colorInputId);
    const preview = document.getElementById(previewId);
    
    if (colorInput && preview) {
        colorInput.addEventListener('input', function() {
            preview.style.backgroundColor = this.value;
            // 텍스트 색상 조정 (밝은 색상일 때는 검은색, 어두운 색상일 때는 흰색)
            const hex = this.value.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            preview.style.color = brightness > 128 ? '#000' : '#fff';
        });
        
        // 초기 색상 설정
        const initialColor = colorInput.value;
        preview.style.backgroundColor = initialColor;
        const hex = initialColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        preview.style.color = brightness > 128 ? '#000' : '#fff';
    }
}

// 카테고리 수정 모달 표시
async function editCategory(id) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const category = categories.find(c => c.id === id);
    if (!category) {
        alert('카테고리를 찾을 수 없습니다.');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    
    // 폼에 기존 데이터 설정
    document.getElementById('edit-category-id').value = category.id;
    document.getElementById('edit-category-name').value = category.name;
    document.getElementById('edit-category-type').value = category.type;
    document.getElementById('edit-category-color').value = category.color;
    
    // 색상 미리보기 설정
    updateColorPreview('edit-category-color', 'edit-color-preview');
    
    // 사용 현황 정보 표시
    try {
        const usageInfo = await getCategoryUsageInfo(category.id);
        document.getElementById('category-usage-info').innerHTML = usageInfo;
    } catch (error) {
        document.getElementById('category-usage-info').innerHTML = '사용 현황을 불러올 수 없습니다.';
    }
    
    modal.show();
}

// 카테고리 사용 현황 정보 가져오기
async function getCategoryUsageInfo(categoryId) {
    try {
        const response = await fetch(`/api/categories/${categoryId}/usage`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const usage = data.data;
                return `
                    <div class="small">
                        <div>총 사용 횟수: ${usage.total_count}회</div>
                        <div>총 금액: ₩${usage.total_amount.toLocaleString()}</div>
                        <div>최근 사용: ${usage.last_used || '없음'}</div>
                    </div>
                `;
            }
        }
        return '사용 현황 정보를 불러올 수 없습니다.';
    } catch (error) {
        return '사용 현황 정보를 불러올 수 없습니다.';
    }
}

// 거래 추가
async function addTransaction() {
    try {
        const formData = {
            amount: document.getElementById('transaction-amount').value,
            description: document.getElementById('transaction-description').value,
            category_id: document.getElementById('transaction-category').value || null,
            type: document.getElementById('transaction-type').value,
            date: document.getElementById('transaction-date').value
        };
        
        await apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
        loadTransactions();
        
        // 달력이 표시 중이면 달력도 업데이트
        if (document.getElementById('calendar-content').style.display !== 'none') {
            renderCalendar();
        }
        
        alert('거래가 추가되었습니다.');
    } catch (error) {
        console.error('거래 추가 오류:', error);
    }
}

// 카테고리 추가
async function addCategory() {
    try {
        const formData = {
            name: document.getElementById('category-name').value,
            type: document.getElementById('category-type').value,
            color: document.getElementById('category-color').value
        };
        
        await apiCall('/categories', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
        loadCategories();
        alert('카테고리가 추가되었습니다.');
    } catch (error) {
        console.error('카테고리 추가 오류:', error);
    }
}

// 카테고리 수정
async function updateCategory() {
    try {
        const categoryId = document.getElementById('edit-category-id').value;
        const formData = {
            name: document.getElementById('edit-category-name').value,
            type: document.getElementById('edit-category-type').value,
            color: document.getElementById('edit-category-color').value
        };
        
        await apiCall(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
        loadCategories();
        alert('카테고리가 수정되었습니다.');
    } catch (error) {
        console.error('카테고리 수정 오류:', error);
    }
}

// 거래 삭제
async function deleteTransaction(id) {
    if (!confirm('정말로 이 거래를 삭제하시겠습니까?')) return;
    
    try {
        await apiCall(`/transactions/${id}`, {
            method: 'DELETE'
        });
        loadTransactions();
        
        // 달력이 표시 중이면 달력도 업데이트
        if (document.getElementById('calendar-content').style.display !== 'none') {
            renderCalendar();
        }
        
        alert('거래가 삭제되었습니다.');
    } catch (error) {
        console.error('거래 삭제 오류:', error);
    }
}

// 카테고리 삭제
async function deleteCategory(id) {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;
    
    try {
        await apiCall(`/categories/${id}`, {
            method: 'DELETE'
        });
        loadCategories();
        alert('카테고리가 삭제되었습니다.');
    } catch (error) {
        console.error('카테고리 삭제 오류:', error);
    }
}

// 통계 로드
async function loadStats() {
    try {
        const [year, month] = currentMonth.split('-');
        const stats = await apiCall(`/stats/${year}/${month}`);
        const categoryStats = await apiCall(`/stats/${year}/${month}/categories`);
        
        updateMonthlyChart(stats);
        updateStatsChart(categoryStats);
    } catch (error) {
        console.error('통계 로드 오류:', error);
    }
}

// 월별 차트 업데이트
function updateMonthlyChart(stats) {
    const ctx = document.getElementById('monthly-chart');
    if (!ctx) return;
    
    if (charts.monthlyChart) {
        charts.monthlyChart.destroy();
    }
    
    charts.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['수입', '지출'],
            datasets: [{
                label: '금액',
                data: [stats.income.total, stats.expense.total],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 통계 차트 업데이트
function updateStatsChart(categoryStats) {
    const ctx = document.getElementById('stats-chart');
    if (!ctx) return;
    
    if (charts.statsChart) {
        charts.statsChart.destroy();
    }
    
    const labels = categoryStats.map(stat => stat.category_name);
    const data = categoryStats.map(stat => stat.total_amount);
    const colors = categoryStats.map(stat => stat.category_color);
    
    charts.statsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 자본금 설정 모달 표시
async function showBalanceSettings() {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('balanceSettingsModal'));
    
    try {
        // 현재 초기 자본금과 총 잔액 정보 로드
        const [initialBalance, totalBalance] = await Promise.all([
            apiCall('/balance/initial'),
            apiCall('/balance/total')
        ]);
        
        // 폼에 현재 값 설정
        document.getElementById('initial-balance-amount').value = initialBalance.amount || 0;
        document.getElementById('current-total-balance').textContent = `₩${totalBalance.current_balance.toLocaleString()}`;
        
        // 상세 정보 업데이트
        document.getElementById('detail-initial-balance').textContent = `₩${totalBalance.initial_balance.toLocaleString()}`;
        document.getElementById('detail-total-income').textContent = `₩${totalBalance.total_income.toLocaleString()}`;
        document.getElementById('detail-total-expense').textContent = `₩${totalBalance.total_expense.toLocaleString()}`;
        document.getElementById('detail-current-balance').textContent = `₩${totalBalance.current_balance.toLocaleString()}`;
        
        modal.show();
    } catch (error) {
        console.error('자본금 정보 로드 오류:', error);
        alert('자본금 정보를 불러올 수 없습니다.');
    }
}

// 초기 자본금 저장
async function saveInitialBalance() {
    try {
        const amount = parseFloat(document.getElementById('initial-balance-amount').value);
        
        if (isNaN(amount) || amount < 0) {
            alert('유효한 금액을 입력해주세요.');
            return;
        }
        
        await apiCall('/balance/initial', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
        
        bootstrap.Modal.getInstance(document.getElementById('balanceSettingsModal')).hide();
        updateDashboard();
        alert('초기 자본금이 설정되었습니다.');
    } catch (error) {
        console.error('초기 자본금 저장 오류:', error);
        alert('초기 자본금 설정 중 오류가 발생했습니다.');
    }
} 