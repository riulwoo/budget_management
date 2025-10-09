const { pool, getUtf8Connection } = require('../config/database');

class AssetType {
  static async findByUserId(userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = `
        SELECT * FROM asset_types 
        WHERE user_id = ? OR is_default = TRUE
        ORDER BY is_default DESC, name ASC
      `;
      const results = await conn.query(query, [userId]);
      
      // BigInt -> String 변환
      return results.map(row => {
        for (const key in row) {
          if (typeof row[key] === 'bigint') {
            row[key] = row[key].toString();
          }
        }
        return row;
      });
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async create(data) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const { name, icon, color, description, user_id } = data;
      const query = `
        INSERT INTO asset_types (name, icon, color, description, user_id, is_default)
        VALUES (?, ?, ?, ?, ?, FALSE)
      `;
      const result = await conn.query(query, [name, icon || 'fas fa-wallet', color || '#000000', description, user_id]);
      return { id: result.insertId.toString(), ...data, is_default: false };
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async update(id, data) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const { name, icon, color, description } = data;
      const query = `
        UPDATE asset_types 
        SET name = ?, icon = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_default = FALSE
      `;
      await conn.query(query, [name, icon, color, description, id]);
      return { id, ...data };
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async delete(id, userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      // 기본 자산 유형은 삭제할 수 없음
      const query = `
        DELETE FROM asset_types 
        WHERE id = ? AND user_id = ? AND is_default = FALSE
      `;
      const result = await conn.query(query, [id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async findById(id) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = 'SELECT * FROM asset_types WHERE id = ?';
      const results = await conn.query(query, [id]);
      const row = results[0];
      if (row) {
        // BigInt -> String 변환
        for (const key in row) {
          if (typeof row[key] === 'bigint') {
            row[key] = row[key].toString();
          }
        }
      }
      return row;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = AssetType;