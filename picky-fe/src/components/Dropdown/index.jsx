
const Dropdown = ({ items, onClose }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
      {items.map((item, index) => {
        const itemClasses = item.isDestructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-100';

        return (
          <div
            key={index}
            className={`block px-4 py-2 text-sm cursor-pointer ${itemClasses}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
};

export default Dropdown;
