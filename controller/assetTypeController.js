const AssetType = require('../model/AssetType');

// 자산 유형 목록 조회
exports.getAssetTypes = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetTypes = await AssetType.findByUserId(userId);
    res.json(assetTypes);
  } catch (error) {
    console.error('자산 유형 목록 조회 오류:', error);
    
    // 테이블이 존재하지 않는 경우 기본 자산 유형 반환
    if (error.message.includes('asset_types') && error.message.includes("doesn't exist")) {
      console.log('자산 유형 테이블이 아직 생성되지 않았습니다. 기본 자산 유형을 반환합니다.');
      return res.json([
        { id: '1', name: '현금', icon: 'fas fa-money-bill-wave', color: '#4CAF50', description: '현금 및 지갑에 있는 돈', is_default: true },
        { id: '2', name: '예금', icon: 'fas fa-university', color: '#2196F3', description: '은행 예금 계좌', is_default: true },
        { id: '3', name: '적금', icon: 'fas fa-piggy-bank', color: '#FF9800', description: '정기 적금 및 예금', is_default: true },
        { id: '4', name: '투자', icon: 'fas fa-chart-line', color: '#9C27B0', description: '주식, 펀드, 채권 등', is_default: true },
        { id: '5', name: '부동산', icon: 'fas fa-home', color: '#795748', description: '집, 땅, 상가 등', is_default: true },
        { id: '6', name: '기타자산', icon: 'fas fa-box', color: '#607D8B', description: '기타 자산', is_default: true }
      ]);
    }
    
    res.status(500).json({ error: '자산 유형 목록을 가져오는데 실패했습니다.' });
  }
};

// 자산 유형 추가 (사용자 정의)
exports.createAssetType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, icon, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '자산 유형 이름을 입력해주세요.' });
    }

    const assetTypeData = {
      name,
      icon: icon || 'fas fa-wallet',
      color: color || '#000000',
      description,
      user_id: userId
    };

    const newAssetType = await AssetType.create(assetTypeData);
    res.status(201).json(newAssetType);
  } catch (error) {
    console.error('자산 유형 추가 오류:', error);
    res.status(500).json({ error: '자산 유형 추가에 실패했습니다.' });
  }
};

// 자산 유형 수정 (사용자 정의만 가능)
exports.updateAssetType = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetTypeId = req.params.id;
    const { name, icon, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: '자산 유형 이름을 입력해주세요.' });
    }

    // 기본 유형인지 확인
    const existingType = await AssetType.findById(assetTypeId);
    if (!existingType) {
      return res.status(404).json({ error: '자산 유형을 찾을 수 없습니다.' });
    }

    if (existingType.is_default || existingType.user_id !== userId) {
      return res.status(403).json({ error: '기본 자산 유형은 수정할 수 없습니다.' });
    }

    const assetTypeData = {
      name,
      icon: icon || 'fas fa-wallet',
      color: color || '#000000',
      description
    };

    const updatedAssetType = await AssetType.update(assetTypeId, assetTypeData);
    res.json(updatedAssetType);
  } catch (error) {
    console.error('자산 유형 수정 오류:', error);
    res.status(500).json({ error: '자산 유형 수정에 실패했습니다.' });
  }
};

// 자산 유형 삭제 (사용자 정의만 가능)
exports.deleteAssetType = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetTypeId = req.params.id;

    // 기본 유형인지 확인
    const existingType = await AssetType.findById(assetTypeId);
    if (!existingType) {
      return res.status(404).json({ error: '자산 유형을 찾을 수 없습니다.' });
    }

    if (existingType.is_default) {
      return res.status(403).json({ error: '기본 자산 유형은 삭제할 수 없습니다.' });
    }

    const deleted = await AssetType.delete(assetTypeId, userId);
    if (deleted) {
      res.json({ message: '자산 유형이 성공적으로 삭제되었습니다.' });
    } else {
      res.status(500).json({ error: '자산 유형 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('자산 유형 삭제 오류:', error);
    res.status(500).json({ error: '자산 유형 삭제에 실패했습니다.' });
  }
};