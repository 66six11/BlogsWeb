import React, { CSSProperties } from 'react';

interface LayeredCharacterIconProps {
  mainSrc: string;
  hairSrc: string;
  hatSrc: string;
  alt?: string;
  size?: number | string; // 圆形裁剪区域的大小
  className?: string;
  scale?: number; // 图片缩放比例
  offsetXPercent?: number; // 水平偏移百分比
  offsetYPercent?: number; // 垂直偏移百分比
}

export const LayeredCharacterIcon: React.FC<LayeredCharacterIconProps> = ({
  mainSrc,
  hairSrc,
  hatSrc,
  alt = "Character Icon",
  size = 48,
  className = "",
  scale = 1,
  offsetXPercent = 0,
  offsetYPercent = 0
}) => {
  const circleSize = typeof size === 'string' ? size : `${size}px`;
  
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: circleSize,
    height: circleSize,
    display: 'inline-block'
  };
  
  // main图层裁剪容器样式
  const mainClipContainerStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    clipPath: 'circle(50% at 50% 50%)',
    WebkitClipPath: 'circle(50% at 50% 50%)',
    zIndex: 1,
  };
  
  // 图像的基础样式 - 固定为容器大小
  const imageBaseStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transform: `scale(${scale}) translate(${offsetXPercent}%, ${offsetYPercent}%)`,
    transformOrigin: 'center center',
  };
  
  // main图层样式 - 图片大小由scale控制
  const mainImageStyle: CSSProperties = {
    ...imageBaseStyle,
  };
  
  // hair图层样式 - 不被裁剪，图片大小由scale控制
  const hairImageStyle: CSSProperties = {
    ...imageBaseStyle,
    zIndex: 2,
  };
  
  // hat图层样式 - 不被裁剪，图片大小由scale控制
  const hatImageStyle: CSSProperties = {
    ...imageBaseStyle,
    zIndex: 3,
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Main layer (body/face) - in the circular area with clipping */}
      <div style={mainClipContainerStyle}>
        <img 
          src={mainSrc} 
          alt={alt} 
          style={mainImageStyle}
          loading="lazy"
          draggable={false}
        />
      </div>
      {/* Hair layer - on top of the circle, not clipped */}
      <img 
        src={hairSrc} 
        alt="Hair" 
        style={hairImageStyle}
        loading="lazy"
        draggable={false}
      />
      {/* Hat layer - on top of everything, not clipped */}
      <img 
        src={hatSrc} 
        alt="Hat" 
        style={hatImageStyle}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
};