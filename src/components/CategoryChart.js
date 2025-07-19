import React, { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';

const CategoryChart = () => {
  const { categories } = useData();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && categories.length > 0) {
      // Chart.js가 로드되었는지 확인
      if (typeof Chart === 'undefined') {
        return;
      }

      // 기존 차트가 있으면 제거
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const expenseCategories = categories.filter(cat => cat.type === 'expense');
      
      if (expenseCategories.length === 0) {
        chartRef.current.style.display = 'none';
        return;
      }

      chartRef.current.style.display = 'block';

      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: expenseCategories.map(cat => cat.name),
          datasets: [{
            data: expenseCategories.map(cat => cat.usage_count || 0),
            backgroundColor: expenseCategories.map(cat => cat.color),
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

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [categories]);

  return (
    <canvas ref={chartRef} id="category-chart"></canvas>
  );
};

export default CategoryChart; 