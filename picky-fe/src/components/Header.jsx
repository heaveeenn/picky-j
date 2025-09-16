
import { useState } from 'react';
import { BookOpen, User } from 'lucide-react';
import Dropdown from './Dropdown';

const Header = ({ onMyPageClick, onLogoutClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownItems = [
    { label: '마이페이지', onClick: onMyPageClick },
    { label: '로그아웃', onClick: onLogoutClick, isDestructive: true },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-gray-800 font-bold">Picky-j</h1>
            <p className="text-gray-500 text-sm">당신을 위한 똑똑한 웹사이트 비서</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="text-gray-500 text-sm">안녕하세요, 사용자님!</span>
            <div className="relative">
              <div 
                className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <User className="w-4 h-4 text-gray-500" />
              </div>
              {isDropdownOpen && <Dropdown items={dropdownItems} onClose={() => setIsDropdownOpen(false)} />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
