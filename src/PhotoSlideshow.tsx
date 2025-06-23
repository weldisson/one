import React from 'react';
import {
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

// Tipos de efeitos disponíveis
export const transitionEffectSchema = z.enum([
  'fade',           // Fade simples (padrão)
  'crossfade',      // Crossfade/dissolve entre imagens (opacity)
  'zoom-out',       // Zoom out de 120% para 100%
  'zoom-out-fade',  // Zoom-out + Fade combinados
  'zoom-crossfade', // Zoom-out + Crossfade combinados
  'zoom-in',        // Zoom in de 80% para 100%
  'slide-left',     // Desliza da direita para esquerda
  'slide-right',    // Desliza da esquerda para direita
  'slide-up',       // Desliza de baixo para cima
  'slide-down',     // Desliza de cima para baixo
  'rotate-fade',    // Rotação com fade
  'scale-rotate',   // Escala com rotação
]);

export const photoSlideshowSchema = z.object({
  images: z.array(z.string()).min(1).max(5),
  primaryAudioSrc: z.string(),
  secondaryAudioSrc: z.string().optional(),
  primaryAudioVolume: z.number().min(0).max(1).default(1),
  secondaryAudioVolume: z.number().min(0).max(1).default(0.3),
  transitionDuration: z.number().min(0.1).max(5),
  imageDuration: z.number().min(1).max(10),
  transitionEffect: transitionEffectSchema.default('fade'),
});

export type PhotoSlideshowProps = z.infer<typeof photoSlideshowSchema>;

export const PhotoSlideshow: React.FC<PhotoSlideshowProps> = ({
  images,
  primaryAudioSrc,
  secondaryAudioSrc,
  primaryAudioVolume = 1,
  secondaryAudioVolume = 0.3,
  transitionDuration,
  imageDuration,
  transitionEffect = 'fade',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calcular qual imagem deve estar visível no frame atual
  const totalDurationPerImage = imageDuration + transitionDuration;
  const currentImageIndex = Math.floor(frame / (totalDurationPerImage * fps));
  const nextImageIndex = currentImageIndex + 1;

  // Progresso dentro da seção atual (imagem + transição)
  const progressInSection = (frame % (totalDurationPerImage * fps)) / (totalDurationPerImage * fps);

  // Determinar se estamos em transição
  const isInTransition = progressInSection > (imageDuration / totalDurationPerImage);
  const transitionProgress = isInTransition
    ? (progressInSection - (imageDuration / totalDurationPerImage)) / (transitionDuration / totalDurationPerImage)
    : 0;

  // Efeito de spring para transições suaves
  const springValue = spring({
    frame: transitionProgress * transitionDuration * fps,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.1,
    },
  });

  // Função para aplicar diferentes efeitos de transição
  const getTransitionStyle = (imageIndex: number, isCurrentImage: boolean, isNextImage: boolean) => {
    const baseStyle = {
      opacity: 1,
      transform: 'scale(1) translateX(0px) translateY(0px) rotate(0deg)',
      filter: 'brightness(1)',
    };

    // Para zoom-out: aplicar o efeito durante a exibição da imagem, não só na transição
    if (transitionEffect === 'zoom-out' && isCurrentImage) {
      // Progresso dentro da duração total da imagem (incluindo sua própria exibição)
      const imageStartFrame = currentImageIndex * totalDurationPerImage * fps;
      const frameWithinImage = frame - imageStartFrame;
      
      // Zoom-out rápido nos primeiros 1 segundo (30 frames a 30fps)
      const zoomOutDurationFrames = Math.min(fps * 1, imageDuration * fps); // 1 segundo ou duração total se menor
      const zoomProgress = Math.min(frameWithinImage / zoomOutDurationFrames, 1);
      
      // Zoom out de 120% para 100% nos primeiros frames (instantâneo)
      const scale = interpolate(zoomProgress, [0, 1], [1.2, 1.0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      
      // Durante a transição, aplicar fade out
      let opacity = 1;
      if (isInTransition) {
        opacity = interpolate(springValue, [0, 1], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
      }
      
      console.log(`Frame ${frame}: Zoom-out Img${imageIndex} - ZoomProgress: ${zoomProgress.toFixed(2)}, Scale: ${scale.toFixed(2)}, Opacity: ${opacity.toFixed(2)}`);
      
      return {
        opacity,
        transform: `scale(${scale})`,
        filter: 'brightness(1)',
      };
    }

    // Se não está em transição, mostrar apenas a imagem atual
    if (!isInTransition) {
      if (imageIndex === currentImageIndex) {
        return baseStyle;
      }
      return { ...baseStyle, opacity: 0 };
    }

    switch (transitionEffect) {
      case 'crossfade':
        if (isCurrentImage) {
          // Imagem atual: fade out (opacity de 1 para 0)
          const opacity = interpolate(springValue, [0, 1], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          console.log(`Frame ${frame}: Crossfade Current Img${imageIndex} - Opacity: ${opacity.toFixed(2)}`);
          
          return {
            opacity,
            transform: 'scale(1)', // Sem zoom, apenas opacity
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          // Próxima imagem: fade in (opacity de 0 para 1)
          const opacity = interpolate(springValue, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          console.log(`Frame ${frame}: Crossfade Next Img${imageIndex} - Opacity: ${opacity.toFixed(2)}`);
          
          return {
            opacity,
            transform: 'scale(1)', // Sem zoom, apenas opacity
            filter: 'brightness(1)',
          };
        }
        break;

      case 'zoom-out':
        // Para zoom-out, a lógica já foi tratada acima
        if (isNextImage) {
          // Próxima imagem: fade in e começar com zoom 120%
          const opacity = interpolate(springValue, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          return {
            opacity,
            transform: 'scale(1.2)', // Começar com zoom 120%
            filter: 'brightness(1)',
          };
        }
        break;

      case 'zoom-out-fade':
        // Para zoom-out-fade: aplicar zoom-out durante a exibição + fade na transição
        if (isCurrentImage) {
          // Progresso dentro da duração total da imagem (incluindo sua própria exibição)
          const imageStartFrame = currentImageIndex * totalDurationPerImage * fps;
          const frameWithinImage = frame - imageStartFrame;
          
          // Zoom-out rápido nos primeiros 1 segundo (30 frames a 30fps)
          const zoomOutDurationFrames = Math.min(fps * 1, imageDuration * fps); // 1 segundo ou duração total se menor
          const zoomProgress = Math.min(frameWithinImage / zoomOutDurationFrames, 1);
          
          // Zoom out de 120% para 100% nos primeiros frames (instantâneo)
          const scale = interpolate(zoomProgress, [0, 1], [1.2, 1.0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          // Durante a transição, aplicar fade out com zoom e brilho
          let opacity = 1;
          let brightness = 1;
          let finalScale = scale;
          
          if (isInTransition) {
            opacity = interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            
            // Adicionar zoom sutil durante o fade (como no fade original)
            finalScale = interpolate(springValue, [0, 1], [scale, scale * 1.1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            
            // Reduzir brilho durante o fade
            brightness = interpolate(springValue, [0, 1], [1, 0.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
          
          console.log(`Frame ${frame}: Zoom-out-Fade Current Img${imageIndex} - ZoomProgress: ${zoomProgress.toFixed(2)}, Scale: ${finalScale.toFixed(2)}, Opacity: ${opacity.toFixed(2)}`);
          
          return {
            opacity,
            transform: `scale(${finalScale})`,
            filter: `brightness(${brightness})`,
          };
        }
        if (isNextImage) {
          // Próxima imagem: fade in com zoom e movimento
          const opacity = interpolate(springValue, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          // Começar menor e crescer (como no fade original)
          const scale = interpolate(springValue, [0, 1], [0.9, 1.2], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          // Movimento sutil da direita para o centro
          const translateX = interpolate(springValue, [0, 1], [50, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          console.log(`Frame ${frame}: Zoom-out-Fade Next Img${imageIndex} - Opacity: ${opacity.toFixed(2)}, Scale: ${scale.toFixed(2)}`);
          
          return {
            opacity,
            transform: `scale(${scale}) translateX(${translateX}px)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'zoom-crossfade':
        // Para zoom-crossfade: aplicar zoom-out durante a exibição + crossfade na transição
        if (isCurrentImage) {
          // Progresso dentro da duração total da imagem (incluindo sua própria exibição)
          const imageStartFrame = currentImageIndex * totalDurationPerImage * fps;
          const frameWithinImage = frame - imageStartFrame;
          
          // Zoom-out rápido nos primeiros 1 segundo (30 frames a 30fps)
          const zoomOutDurationFrames = Math.min(fps * 1, imageDuration * fps); // 1 segundo ou duração total se menor
          const zoomProgress = Math.min(frameWithinImage / zoomOutDurationFrames, 1);
          
          // Zoom out de 120% para 100% nos primeiros frames (instantâneo)
          const scale = interpolate(zoomProgress, [0, 1], [1.2, 1.0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          // Durante a transição, aplicar crossfade (opacity)
          let opacity = 1;
          if (isInTransition) {
            opacity = interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }
          
          console.log(`Frame ${frame}: Zoom-Crossfade Current Img${imageIndex} - ZoomProgress: ${zoomProgress.toFixed(2)}, Scale: ${scale.toFixed(2)}, Opacity: ${opacity.toFixed(2)}`);
          
          return {
            opacity,
            transform: `scale(${scale})`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          // Próxima imagem: crossfade in (opacity) + começar com zoom 120%
          const opacity = interpolate(springValue, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          console.log(`Frame ${frame}: Zoom-Crossfade Next Img${imageIndex} - Opacity: ${opacity.toFixed(2)}`);
          
          return {
            opacity,
            transform: 'scale(1.2)', // Começar com zoom 120%
            filter: 'brightness(1)',
          };
        }
        break;

      case 'zoom-in':
        if (isCurrentImage) {
          // Imagem atual: fade out
          return {
            opacity: interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: 'scale(1)',
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          // Próxima imagem: zoom in de 80% para 100%
          return {
            opacity: interpolate(springValue, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(springValue, [0, 1], [0.8, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'slide-left':
        if (isCurrentImage) {
          return {
            opacity: 1,
            transform: `translateX(${interpolate(springValue, [0, 1], [0, -100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          return {
            opacity: 1,
            transform: `translateX(${interpolate(springValue, [0, 1], [100, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'slide-right':
        if (isCurrentImage) {
          return {
            opacity: 1,
            transform: `translateX(${interpolate(springValue, [0, 1], [0, 100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          return {
            opacity: 1,
            transform: `translateX(${interpolate(springValue, [0, 1], [-100, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'slide-up':
        if (isCurrentImage) {
          return {
            opacity: 1,
            transform: `translateY(${interpolate(springValue, [0, 1], [0, -100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          return {
            opacity: 1,
            transform: `translateY(${interpolate(springValue, [0, 1], [100, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'slide-down':
        if (isCurrentImage) {
          return {
            opacity: 1,
            transform: `translateY(${interpolate(springValue, [0, 1], [0, 100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          return {
            opacity: 1,
            transform: `translateY(${interpolate(springValue, [0, 1], [-100, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'rotate-fade':
        if (isCurrentImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `rotate(${interpolate(springValue, [0, 1], [0, 15], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}deg) scale(${interpolate(springValue, [0, 1], [1, 0.9], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
            filter: 'brightness(1)',
          };
        }
        if (isNextImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `rotate(${interpolate(springValue, [0, 1], [-15, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}deg) scale(${interpolate(springValue, [0, 1], [0.9, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'scale-rotate':
        if (isCurrentImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(springValue, [0, 1], [1, 1.2], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}) rotate(${interpolate(springValue, [0, 1], [0, -10], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}deg)`,
            filter: `brightness(${interpolate(springValue, [0, 1], [1, 0.7], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
          };
        }
        if (isNextImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(springValue, [0, 1], [0.8, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}) rotate(${interpolate(springValue, [0, 1], [10, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}deg)`,
            filter: 'brightness(1)',
          };
        }
        break;

      case 'fade':
      default:
        // Efeito fade original
        if (isCurrentImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(springValue, [0, 1], [1, 1.1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
            filter: `brightness(${interpolate(springValue, [0, 1], [1, 0.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })})`,
          };
        }
        if (isNextImage) {
          return {
            opacity: interpolate(springValue, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `scale(${interpolate(springValue, [0, 1], [0.9, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}) translateX(${interpolate(springValue, [0, 1], [50, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}px)`,
            filter: 'brightness(1)',
          };
        }
        break;
    }

    // Imagens não visíveis
    return {
      opacity: 0,
      transform: 'scale(0.8)',
      filter: 'brightness(0.5)',
    };
  };

  // Efeitos de transição diferentes
  const getImageStyle = (imageIndex: number) => {
    const isCurrentImage = imageIndex === currentImageIndex;
    const isNextImage = imageIndex === nextImageIndex;
    
    return getTransitionStyle(imageIndex, isCurrentImage, isNextImage);
  };

  // Debug log para verificar o efeito aplicado
  console.log(`Frame ${frame}: Effect=${transitionEffect}, CurrentImg=${currentImageIndex}, InTransition=${isInTransition}, Progress=${transitionProgress.toFixed(2)}`);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Áudio primário (ex: narração/oração) */}
      <Audio src={primaryAudioSrc} volume={primaryAudioVolume} />
      
      {/* Áudio secundário opcional (ex: música de fundo) */}
      {secondaryAudioSrc && (
        <Audio src={secondaryAudioSrc} volume={secondaryAudioVolume} />
      )}

      {/* Renderizar todas as imagens */}
      {images.map((imageSrc, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...getImageStyle(index),
            transition: 'none',
          }}
        >
          <Img
            src={imageSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              borderRadius: '0px',
              boxShadow: 'none',
            }}
          />
        </div>
      ))}

      {/* Overlay com efeito de vinheta */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}; 