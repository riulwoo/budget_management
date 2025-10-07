import React, { useState } from 'react';
import './CategoryManager.css';

function CategoryManager({ categories, onAdd, onEdit, onDelete, loading }) {
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedMid, setSelectedMid] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // 대분류, 중분류, 소분류 필터링
  const mainCategories = categories.filter(c => !c.parent_id);
  const midCategories = selectedMain ? categories.filter(c => c.parent_id === selectedMain.id) : [];
  const subCategories = selectedMid ? categories.filter(c => c.parent_id === selectedMid.id) : [];

  // 선택 핸들러
  const handleSelectMain = cat => {
    setSelectedMain(cat);
    setSelectedMid(null);
    setSelectedSub(null);
  };
  const handleSelectMid = cat => {
    setSelectedMid(cat);
    setSelectedSub(null);
  };
  const handleSelectSub = cat => setSelectedSub(cat);

  return (
    <div className="category-manager">
      <div className="category-column">
        <h3>대분류</h3>
        <ul>
          {mainCategories.map(cat => (
            <li
              key={cat.id}
              className={selectedMain?.id === cat.id ? 'selected' : ''}
              onClick={() => handleSelectMain(cat)}
            >
              {cat.name}
            </li>
          ))}
        </ul>
        <button onClick={() => onAdd('main')}>추가</button>
        <button disabled={!selectedMain} onClick={() => selectedMain && onEdit('main', selectedMain)}>수정</button>
        <button disabled={!selectedMain} onClick={() => selectedMain && onDelete(selectedMain)}>삭제</button>
      </div>
      <div className="category-column">
        <h3>중분류</h3>
        <ul>
          {midCategories.map(cat => (
            <li
              key={cat.id}
              className={selectedMid?.id === cat.id ? 'selected' : ''}
              onClick={() => handleSelectMid(cat)}
            >
              {cat.name}
            </li>
          ))}
        </ul>
        <button disabled={!selectedMain} onClick={() => selectedMain && onAdd('mid', selectedMain)}>추가</button>
        <button disabled={!selectedMid} onClick={() => selectedMid && onEdit('mid', selectedMid, mainCategories)}>수정</button>
        <button disabled={!selectedMid} onClick={() => selectedMid && onDelete(selectedMid)}>삭제</button>
      </div>
      <div className="category-column">
        <h3>소분류</h3>
        <ul>
          {subCategories.map(cat => (
            <li
              key={cat.id}
              className={selectedSub?.id === cat.id ? 'selected' : ''}
              onClick={() => handleSelectSub(cat)}
            >
              {cat.name}
            </li>
          ))}
        </ul>
        <button disabled={!selectedMid} onClick={() => selectedMid && onAdd('sub', selectedMid)}>추가</button>
        <button disabled={!selectedSub} onClick={() => selectedSub && onEdit('sub', selectedSub, midCategories)}>수정</button>
        <button disabled={!selectedSub} onClick={() => selectedSub && onDelete(selectedSub)}>삭제</button>
      </div>
    </div>
  );
}

export default CategoryManager;
