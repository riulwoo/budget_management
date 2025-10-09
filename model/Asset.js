const { pool, getUtf8Connection } = require('../config/database');

class Asset {
  static async findByUserId(userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = `
        SELECT a.*, at.name as type_name, at.icon, at.color
        FROM assets a
        JOIN asset_types at ON a.asset_type_id = at.id
        WHERE a.user_id = ? AND a.is_active = TRUE
        ORDER BY at.name, a.name
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
      const { name, asset_type_id, amount, description, user_id } = data;
      const query = `
        INSERT INTO assets (name, asset_type_id, amount, description, user_id, is_active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `;
      const result = await conn.query(query, [name, asset_type_id, amount || 0, description, user_id]);
      return { id: result.insertId.toString(), ...data, is_active: true };
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
      const { name, asset_type_id, amount, description } = data;
      const query = `
        UPDATE assets 
        SET name = ?, asset_type_id = ?, amount = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = TRUE
      `;
      await conn.query(query, [name, asset_type_id, amount, description, id]);
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
      // 소프트 삭제
      const query = `
        UPDATE assets 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      const result = await conn.query(query, [id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async findById(id, userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = `
        SELECT a.*, at.name as type_name, at.icon, at.color
        FROM assets a
        JOIN asset_types at ON a.asset_type_id = at.id
        WHERE a.id = ? AND a.user_id = ? AND a.is_active = TRUE
      `;
      const results = await conn.query(query, [id, userId]);
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

  static async getTotalByUserId(userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_assets,
          COUNT(*) as asset_count
        FROM assets 
        WHERE user_id = ? AND is_active = TRUE
      `;
      const results = await conn.query(query, [userId]);
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

  static async getByTypeAndUser(assetTypeId, userId) {
    let conn;
    try {
      conn = await getUtf8Connection();
      const query = `
        SELECT a.*, at.name as type_name, at.icon, at.color
        FROM assets a
        JOIN asset_types at ON a.asset_type_id = at.id
        WHERE a.asset_type_id = ? AND a.user_id = ? AND a.is_active = TRUE
        ORDER BY a.name
      `;
      const results = await conn.query(query, [assetTypeId, userId]);
      
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
}

module.exports = Asset;