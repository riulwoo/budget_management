const User = require('../model/User');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');

class AuthController {
    // 회원가입
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;
            
            // 필수 필드 검증
            if (!username || !email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: '사용자명, 이메일, 비밀번호는 필수입니다.' 
                });
            }

            // 비밀번호 길이 검증
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: '비밀번호는 최소 6자 이상이어야 합니다.' 
                });
            }

            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '유효한 이메일 주소를 입력해주세요.' 
                });
            }

            // 사용자명 중복 확인
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({ 
                    success: false, 
                    message: '이미 사용 중인 사용자명입니다.' 
                });
            }

            // 이메일 중복 확인
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ 
                    success: false, 
                    message: '이미 사용 중인 이메일입니다.' 
                });
            }

            // 사용자 생성
            const user = await User.create({ username, email, password });
            
            // JWT 토큰 생성
            const token = generateToken(user);
            
            res.status(201).json({ 
                success: true, 
                message: '회원가입이 완료되었습니다.',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    },
                    token
                }
            });
        } catch (error) {
            console.error('회원가입 오류:', error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }

    // 로그인
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // 필수 필드 검증
            if (!username || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: '사용자명과 비밀번호는 필수입니다.' 
                });
            }

            // 사용자 조회
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.' 
                });
            }

            // 비밀번호 검증
            const isValidPassword = User.verifyPassword(password, user.password_hash, user.salt);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.' 
                });
            }

            // JWT 토큰 생성
            const token = generateToken(user);
            
            res.json({ 
                success: true, 
                message: '로그인이 완료되었습니다.',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    },
                    token
                }
            });
        } catch (error) {
            console.error('로그인 오류:', error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }

    // 사용자 정보 조회
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: '사용자를 찾을 수 없습니다.' 
                });
            }

            res.json({ 
                success: true, 
                data: user 
            });
        } catch (error) {
            console.error('프로필 조회 오류:', error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }

    // 비밀번호 변경
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: '현재 비밀번호와 새 비밀번호는 필수입니다.' 
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    message: '새 비밀번호는 최소 6자 이상이어야 합니다.' 
                });
            }

            // 현재 사용자 정보 조회
            const user = await User.findByUsername(req.user.username);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: '사용자를 찾을 수 없습니다.' 
                });
            }

            // 현재 비밀번호 검증
            const isValidPassword = User.verifyPassword(currentPassword, user.password_hash, user.salt);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    success: false, 
                    message: '현재 비밀번호가 올바르지 않습니다.' 
                });
            }

            // 새 비밀번호로 변경
            await User.updatePassword(userId, newPassword);
            
            res.json({ 
                success: true, 
                message: '비밀번호가 변경되었습니다.' 
            });
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    }

    // 아이디(Username) 찾기
    static async findUsername(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
            }
            const user = await User.findByEmail(email);
            if (!user || !user.username) {
                return res.status(404).json({ success: false, message: '해당 이메일로 등록된 아이디가 없습니다.' });
            }
            res.json({ success: true, username: user.username });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 비밀번호 초기화(임시 비밀번호 발급)
    static async resetPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
            }
            const user = await User.findByEmail(email);
            if (!user || !user.id) {
                return res.status(404).json({ success: false, message: '해당 이메일로 등록된 계정이 없습니다.' });
            }
            // 임시 비밀번호 생성
            const tempPassword = crypto.randomBytes(4).toString('hex');
            await User.updatePassword(user.id, tempPassword);
            res.json({ success: true, tempPassword });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = AuthController; 