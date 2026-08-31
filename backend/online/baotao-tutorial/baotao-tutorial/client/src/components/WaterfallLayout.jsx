import { useState, useEffect, useRef } from 'react';
import CapsuleCard from './CapsuleCard';

const WaterfallLayout = ({ items, onUnlock }) => {
  const [columns, setColumns] = useState(3);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setColumns(1);
      } else if (width < 900) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const distributeItems = () => {
    const cols = Array.from({ length: columns }, () => []);

    items.forEach((item, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(item);
    });

    return cols;
  };

  const columnItems = distributeItems();

  return (
    <div className="waterfall-container" ref={containerRef}>
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="waterfall-column">
          {column.map((item) => (
            <CapsuleCard key={item.id} capsule={item} onUnlock={onUnlock} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default WaterfallLayout;
