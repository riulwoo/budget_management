import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount } from '../utils/api';

const BalanceSettings = () => {
  const { currentUser } = useAuth();
  const { totalBalance, setInitialBalance, loading } = useData();
  const [formData, setFormData] = useState({
    amount: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (totalBalance.initial_balance) {
      setFormData({ amount: totalBalance.initial_balance.toString() });
    }
  }, [totalBalance.initial_balance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount < 0) {
        setError('유효한 금액을 입력해주세요.');
        return;
      }

      const result = await setInitialBalance(amount);
      
      if (result.success) {
        setSuccess('초기 자본금이 성공적으로 설정되었습니다.');
      } else {
        setError(result.message || '초기 자본금 설정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setError('초기 자본금 설정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <h3>로그인이 필요합니다</h3>
        <p>자본금 설정을 위해 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>초기 자본금 설정</h2>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>초기 자본금 설정</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                초기 자본금을 설정하면 총 잔액 계산에 반영됩니다.
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">초기 자본금</label>
                  <div className="input-group">
                    <input 
                      type="number" 
                      className="form-control" 
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0" 
                      step="1000" 
                      required 
                    />
                    <span className="input-group-text">원</span>
                  </div>
                  <small className="text-muted">
                    현재 총 잔액: {formatAmount(totalBalance.current_balance)}
                  </small>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving || loading}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>잔액 상세 정보</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-6">
                  <small className="text-muted">초기 자본금</small>
                  <div className="fw-bold">{formatAmount(totalBalance.initial_balance)}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">총 수입</small>
                  <div className="fw-bold text-success">{formatAmount(totalBalance.total_income)}</div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <small className="text-muted">총 지출</small>
                  <div className="fw-bold text-danger">{formatAmount(totalBalance.total_expense)}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">현재 잔액</small>
                  <div className="fw-bold text-primary">{formatAmount(totalBalance.current_balance)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5>계산 공식</h5>
            </div>
            <div className="card-body">
              <div className="small">
                <div className="mb-2">
                  <strong>총 잔액 = 초기 자본금 + 총 수입 - 총 지출</strong>
                </div>
                <div className="text-muted">
                  <div>• 초기 자본금: 설정한 초기 자본</div>
                  <div>• 총 수입: 모든 수입 거래의 합계</div>
                  <div>• 총 지출: 모든 지출 거래의 합계</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSettings; 