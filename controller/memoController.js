const Memo = require('../model/Memo');

class MemoController {
  // 내 메모 목록 조회
    static getMyMemos = async (req, res) => {
        try {
        const userId = req.user.id;
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const result = await Memo.getMy(userId, parseInt(page), parseInt(limit), search);
        res.json({
        success: true,
        data: result
        });
    } catch (error) {
        console.error('내 메모 조회 오류:', error);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
        });
    }
    };

    // 공개 메모 목록 조회
    static getPublicMemos = async (req, res) => {
    try {
        console.log('공개 메모 조회 요청:', req.query);
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const result = await Memo.getPublic(parseInt(page), parseInt(limit), search);
        console.log('공개 메모 조회 결과:', result);
        
        // user_id 포함 여부 확인
        if (result.memos && result.memos.length > 0) {
            console.log('첫 번째 공개 메모 데이터 샘플:', {
                id: result.memos[0].id,
                title: result.memos[0].title,
                user_id: result.memos[0].user_id,
                username: result.memos[0].username,
                visibility: result.memos[0].visibility,
                hasUserId: !!result.memos[0].user_id
            });
        }
        
        res.json({
        success: true,
        data: result
        });
    } catch (error) {
        console.error('공개 메모 조회 오류:', error);
        console.error('오류 스택:', error.stack);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error.message 
        });
    }
    };

    // 메모 생성
    static createMemo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, date, priority, visibility, is_completed } = req.body;
        
        console.log('메모 생성 요청:', { userId, title, content, date, priority, visibility, is_completed });
        
        if (!title || !date) {
        console.log('메모 생성 실패: 제목 또는 날짜 누락');
        return res.status(400).json({ 
            success: false,
            message: '제목과 날짜는 필수입니다.' 
        });
        }
        
        const memoData = {
        user_id: userId,
        title,
        content,
        date,
        priority: priority || 'medium',
        visibility: visibility || 'private',
        is_completed: is_completed || false
        };
        
        console.log('메모 데이터:', memoData);
        
        const memo = await Memo.create(memoData);
        console.log('메모 생성 성공:', memo);
        res.status(201).json({
        success: true,
        data: memo
        });
    } catch (error) {
        console.error('메모 생성 오류:', error);
        console.error('오류 스택:', error.stack);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error.message 
        });
    }
    };

    // 메모 수정
    static updateMemo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, content, date, priority, visibility, is_completed } = req.body;
        
        console.log('메모 수정 요청:', { 
            memoId: id, 
            userId: userId, 
            userType: typeof userId,
            parsedId: parseInt(id) 
        });
        
        // 소유자 확인
        const isOwner = await Memo.isOwner(parseInt(id), userId);
        console.log('소유자 확인 결과:', isOwner);
        
        if (!isOwner) {
            console.log('권한 없음 - 메모 수정 거부:', { memoId: id, userId });
            return res.status(403).json({ 
                success: false,
                message: '메모를 수정할 권한이 없습니다.' 
            });
        }
        
        if (!title || !date) {
        return res.status(400).json({ 
            success: false,
            message: '제목과 날짜는 필수입니다.' 
        });
        }
        
        const memoData = {
        title,
        content,
        date,
        priority: priority || 'medium',
        visibility: visibility || 'private',
        is_completed: is_completed || false
        };
        
        const updated = await Memo.update(parseInt(id), memoData);
        
        if (updated) {
        res.json({ 
            success: true,
            data: { message: '메모가 성공적으로 수정되었습니다.' }
        });
        } else {
        res.status(404).json({ 
            success: false,
            message: '메모를 찾을 수 없습니다.' 
        });
        }
    } catch (error) {
        console.error('메모 수정 오류:', error);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
        });
    }
    };

    // 메모 삭제
    static deleteMemo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        console.log('메모 삭제 요청:', { memoId: id, userId });
        
        // 소유자 확인
        const isOwner = await Memo.isOwner(parseInt(id), userId);
        if (!isOwner) {
            console.log('권한 없음 - 메모 삭제 거부:', { memoId: id, userId });
            return res.status(403).json({ 
                success: false,
                message: '메모를 삭제할 권한이 없습니다.' 
            });
        }
        
        const deleted = await Memo.delete(parseInt(id));
        
        if (deleted) {
        res.json({ 
            success: true,
            data: { message: '메모가 성공적으로 삭제되었습니다.' }
        });
        } else {
        res.status(404).json({ 
            success: false,
            message: '메모를 찾을 수 없습니다.' 
        });
        }
    } catch (error) {
        console.error('메모 삭제 오류:', error);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
        });
    }
    };

    // 메모 완료 상태 토글
    static toggleComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        console.log('메모 완료 토글 요청:', { memoId: id, userId });
        
        // 소유자 확인
        const isOwner = await Memo.isOwner(parseInt(id), userId);
        if (!isOwner) {
            console.log('권한 없음 - 메모 완료 토글 거부:', { memoId: id, userId });
            return res.status(403).json({ 
                success: false,
                message: '메모를 수정할 권한이 없습니다.' 
            });
        }
        
        const updated = await Memo.toggleComplete(parseInt(id));
        
        if (updated) {
        res.json({ 
            success: true,
            data: { message: '완료 상태가 변경되었습니다.' }
        });
        } else {
        res.status(404).json({ 
            success: false,
            message: '메모를 찾을 수 없습니다.' 
        });
        }
    } catch (error) {
        console.error('완료 상태 변경 오류:', error);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
        });
    }
    };

    // 특정 날짜 메모 조회
    static getMemosByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user.id;
        
        const memos = await Memo.getByDate(userId, date);
        res.json({
        success: true,
        data: memos
        });
    } catch (error) {
        console.error('날짜별 메모 조회 오류:', error);
        res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.' 
        });
    }
    };
}
module.exports = MemoController;