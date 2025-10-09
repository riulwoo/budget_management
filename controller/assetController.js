const Asset = require('../model/Asset');
const AssetType = require('../model/AssetType');

// 자산 목록 조회
exports.getAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('자산 목록 조회 요청, userId:', userId);
    const assets = await Asset.findByUserId(userId);
    console.log('자산 목록 조회 완료:', assets.length, '개');
    res.json(assets);
  } catch (error) {
    console.error('자산 목록 조회 오류:', error);
    
    // 테이블이 존재하지 않는 경우 빈 배열 반환
    if (error.message.includes('assets') && (error.message.includes("doesn't exist") || error.message.includes("Table") || error.message.includes("Unknown table"))) {
      console.log('자산 테이블이 아직 생성되지 않았습니다. 빈 배열을 반환합니다.');
      return res.json([]);
    }
    
    res.status(500).json({ error: '자산 목록을 가져오는데 실패했습니다.', details: error.message });
  }
};

// 자산 추가
exports.createAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, asset_type_id, amount, description } = req.body;

    if (!name || !asset_type_id || amount === undefined) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
    }

    // 자산 유형 유효성 검사
    const assetType = await AssetType.findById(asset_type_id);
    if (!assetType) {
      return res.status(400).json({ error: '유효하지 않은 자산 유형입니다.' });
    }

    const assetData = {
      name,
      asset_type_id,
      amount: parseFloat(amount),
      description,
      user_id: userId
    };

    const newAsset = await Asset.create(assetData);
    res.status(201).json(newAsset);
  } catch (error) {
    console.error('자산 추가 오류:', error);
    res.status(500).json({ error: '자산 추가에 실패했습니다.' });
  }
};

// 자산 수정
exports.updateAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;
    const { name, asset_type_id, amount, description } = req.body;

    if (!name || !asset_type_id || amount === undefined) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
    }

    // 자산 존재 여부 확인
    const existingAsset = await Asset.findById(assetId, userId);
    if (!existingAsset) {
      return res.status(404).json({ error: '자산을 찾을 수 없습니다.' });
    }

    // 자산 유형 유효성 검사
    const assetType = await AssetType.findById(asset_type_id);
    if (!assetType) {
      return res.status(400).json({ error: '유효하지 않은 자산 유형입니다.' });
    }

    const assetData = {
      name,
      asset_type_id,
      amount: parseFloat(amount),
      description
    };

    const updatedAsset = await Asset.update(assetId, assetData);
    res.json(updatedAsset);
  } catch (error) {
    console.error('자산 수정 오류:', error);
    res.status(500).json({ error: '자산 수정에 실패했습니다.' });
  }
};

// 자산 삭제
exports.deleteAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;

    // 자산 존재 여부 확인
    const existingAsset = await Asset.findById(assetId, userId);
    if (!existingAsset) {
      return res.status(404).json({ error: '자산을 찾을 수 없습니다.' });
    }

    const deleted = await Asset.delete(assetId, userId);
    if (deleted) {
      res.json({ message: '자산이 성공적으로 삭제되었습니다.' });
    } else {
      res.status(500).json({ error: '자산 삭제에 실패했습니다.' });
    }
  } catch (error) {
    console.error('자산 삭제 오류:', error);
    res.status(500).json({ error: '자산 삭제에 실패했습니다.' });
  }
};

// 총 자산 조회
exports.getTotalAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalData = await Asset.getTotalByUserId(userId);
    res.json(totalData);
  } catch (error) {
    console.error('총 자산 조회 오류:', error);
    res.status(500).json({ error: '총 자산을 가져오는데 실패했습니다.' });
  }
};

// 자산 유형별 조회
exports.getAssetsByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const assetTypeId = req.params.typeId;
    
    const assets = await Asset.getByTypeAndUser(assetTypeId, userId);
    res.json(assets);
  } catch (error) {
    console.error('자산 유형별 조회 오류:', error);
    res.status(500).json({ error: '자산 조회에 실패했습니다.' });
  }
};