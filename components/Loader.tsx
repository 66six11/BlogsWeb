import React, { useState, useEffect } from 'react';

interface LoaderProps {
  // Reserved for future use when loader needs to signal completion
  onComplete?: () => void;
}

const Loader: React.FC<LoaderProps> = () => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const loadingSentences = [
    "正在加载资源...",
    "预加载头像和背景...",
    "准备音频资源...",
    "魔法世界即将呈现...",
    "初始化渲染引擎...",
    "准备进入魔法世界..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSentenceIndex((prevIndex) => (prevIndex + 1) % loadingSentences.length);
    }, 3000); // Change sentence every 3 seconds

    return () => clearInterval(interval);
  }, [loadingSentences.length]);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Note: .loader CSS class is defined in index.html (lines 111-126) with keyframe animation */}
      <div className="loader mb-6" />
      <div className="text-center text-sm theme-text-secondary relative h-6 transition-opacity duration-500">
        {loadingSentences.map((sentence, index) => (
          <p
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              currentSentenceIndex === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {sentence}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Loader;
