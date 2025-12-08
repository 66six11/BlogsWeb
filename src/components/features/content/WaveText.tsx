import React, { useEffect, useState, useRef, useMemo, ReactNode } from 'react'

interface WaveTextProps {
  children?: ReactNode;
  texts?: string[];
  appearDelay?: number;
  displayDuration?: number;
  fadeDelay?: number;
  loopDelay?: number;
  distance?: number;
  className?: string;
  autoPlay?: boolean;
  onTextChange?: (index: number, text: string) => void;
}

type AnimationPhase = 'idle' | 'entering' | 'displaying' | 'exiting' | 'resetting';

export const WaveText: React.FC<WaveTextProps> = ({
                                                    children,
                                                    texts = [],
                                                    appearDelay = 100,
                                                    displayDuration = 2000,
                                                    fadeDelay = 80,
                                                    loopDelay = 1000,
                                                    distance = 30,
                                                    className = '',
                                                    autoPlay = true,
                                                    onTextChange
                                                  }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

  // 1. 使用 Ref 追踪最新的 props，避免它们引起 useEffect 不必要的重置
  const textsRef = useRef(texts);
  const onTextChangeRef = useRef(onTextChange);

  // 当 props 变化时更新 refs
  useEffect(() => {
    textsRef.current = texts;
    onTextChangeRef.current = onTextChange;
  }, [texts, onTextChange]);

  const getCurrentText = useMemo(() => {
    if (texts && texts.length > 0) {
      return texts[currentTextIndex % texts.length];
    }
    // ... children 处理逻辑保持不变 ...
    const extractText = (node: ReactNode): string => {
      if (typeof node === 'string') return node;
      else if (typeof node === 'number') return String(node);
      else if (Array.isArray(node)) return node.map(extractText).join('');
      else if (React.isValidElement(node)) {
        const element = node as React.ReactElement<{ children?: ReactNode }>;
        if (element.props?.children) return extractText(element.props.children as ReactNode);
      }
      return '';
    };
    return extractText(children);
  }, [children, texts, currentTextIndex]);

  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [randomIndices, setRandomIndices] = useState<number[]>([])
  const [animationStarted, setAnimationStarted] = useState<boolean>(autoPlay)

  const chars = useMemo(() => Array.from(getCurrentText), [getCurrentText])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  useEffect(() => {
    const indices = Array.from({ length: chars.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    setRandomIndices(indices)
  }, [chars.length, getCurrentText])

  // 重置动画状态
  const resetAnimation = () => {
    clearAllTimeouts();
    setPhase('idle');
  }

  // 2. 优化后的动画循环 useEffect
  useEffect(() => {
    if (!animationStarted) return;

    // 清除旧的定时器
    clearAllTimeouts()
    setPhase('idle');

    const startTimer = setTimeout(() => {
      const runSequence = () => {
        setPhase('entering')
        const totalEnterTime = chars.length * appearDelay + 500

        const displayTimer = setTimeout(() => {
          setPhase('displaying')

          const exitTimer = setTimeout(() => {
            setPhase('exiting')
            const totalExitTime = chars.length * fadeDelay + 500

            const loopTimer = setTimeout(() => {
              setPhase('resetting')

              const restartTimer = setTimeout(() => {
                // 3. 在这里使用 Ref 获取最新的 texts，而不是依赖闭包或 useEffect 依赖项
                const currentTexts = textsRef.current;

                if (currentTexts && currentTexts.length > 0) {
                  // 4. 使用函数式更新确保索引正确递增
                  setCurrentTextIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % currentTexts.length;
                    // 安全地调用回调
                    onTextChangeRef.current?.(nextIndex, currentTexts[nextIndex]);
                    return nextIndex;
                  });
                  // 注意：这里不需要调用 runSequence，因为 setCurrentTextIndex 会改变 getCurrentText，
                  // 从而触发这个 useEffect 重新运行
                } else {
                  // 没有 texts 数组时，手动递归
                  runSequence()
                }
              }, loopDelay)

              timeoutsRef.current.push(restartTimer)
            }, totalExitTime)

            timeoutsRef.current.push(loopTimer)
          }, displayDuration)

          timeoutsRef.current.push(exitTimer)
        }, totalEnterTime)

        timeoutsRef.current.push(displayTimer)
      }

      runSequence()
    }, 0)

    timeoutsRef.current.push(startTimer)

    return () => clearAllTimeouts()
  }, [
    // 5. 关键：移除了 'texts' 依赖，防止父组件重渲染导致动画重置
    // 仅当这些配置或实际显示的文本(getCurrentText)变化时才重启
    chars.length,
    appearDelay,
    displayDuration,
    fadeDelay,
    loopDelay,
    getCurrentText,
    animationStarted
  ])

  // ... 样式计算部分保持不变 ...
  const getStyleForChar = (index: number) => {
    // 保持你原有的逻辑
    const transitionDuration = '500ms'
    const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

    const baseStyle: React.CSSProperties = {
      display: 'inline-block',
      transitionProperty: 'transform, opacity, filter',
      transitionDuration,
      transitionTimingFunction: ease,
      whiteSpace: 'pre',
    }

    if (phase === 'resetting' || phase === 'idle') {
      return {
        ...baseStyle,
        opacity: 0,
        transform: `translateY(-${distance}px)`,
        filter: 'blur(8px)',
        transitionDuration: '0ms',
      }
    }

    if (phase === 'entering') {
      const delay = index * appearDelay
      return {
        ...baseStyle,
        opacity: 1,
        transform: 'translateY(0)',
        filter: 'blur(0px)',
        transitionDelay: `${delay}ms`,
      }
    }

    if (phase === 'displaying') {
      return {
        ...baseStyle,
        opacity: 1,
        transform: 'translateY(0)',
        filter: 'blur(0px)',
        transitionDelay: '0ms',
      }
    }

    if (phase === 'exiting') {
      const randomIndex = randomIndices[index] ?? index
      const delay = randomIndex * fadeDelay
      return {
        ...baseStyle,
        opacity: 0,
        transform: `translateY(-${distance}px)`,
        filter: 'blur(8px)',
        transitionDelay: `${delay}ms`,
      }
    }

    return baseStyle
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap justify-center leading-tight break-words max-w-full tracking-wide">
        {chars.map((char, index) => (
          <span
            key={`${getCurrentText}-${index}-${char}`}
            style={getStyleForChar(index)}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}