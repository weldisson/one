import { Composition } from "remotion";
import { PhotoSlideshow, photoSlideshowSchema } from "./PhotoSlideshow";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PhotoSlideshow"
      component={PhotoSlideshow}
      schema={photoSlideshowSchema}
      durationInFrames={900} // Será calculado dinamicamente pela API
      fps={30}
      width={1080} // Formato 9:16 (vertical)
      height={1920}
      defaultProps={{
        images: [
          "https://via.placeholder.com/1080x1920/ff0000/ffffff?text=Imagem+1",
          "https://via.placeholder.com/1080x1920/00ff00/ffffff?text=Imagem+2",
          "https://via.placeholder.com/1080x1920/0000ff/ffffff?text=Imagem+3",
        ],
        primaryAudioSrc: "https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3",
        secondaryAudioSrc: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
        primaryAudioVolume: 1,
        secondaryAudioVolume: 0.3,
        transitionDuration: 1,
        imageDuration: 3,
        transitionEffect: 'zoom-out',
      }}
    />
  );
}; 