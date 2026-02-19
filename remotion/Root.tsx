import { Composition } from 'remotion';
import { SlideComposition } from './SlideComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Slide"
        component={SlideComposition}
        durationInFrames={150} // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          slideCode: `<motion.div
  className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-12"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <h1 className="text-5xl font-bold text-white">Sample Slide</h1>
</motion.div>`,
        }}
      />

      <Composition
        id="Presentation"
        component={SlideComposition}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          slides: [],
          transitionDuration: 15, // frames for transition
        }}
      />
    </>
  );
};
