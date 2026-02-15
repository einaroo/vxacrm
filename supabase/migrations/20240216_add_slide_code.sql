-- Add code column for storing JSX slide code
ALTER TABLE presentation_slides 
ADD COLUMN IF NOT EXISTS code TEXT;

-- Set default code for existing slides
UPDATE presentation_slides 
SET code = '<motion.div 
  className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-12"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <motion.h1 
    className="text-5xl font-bold text-white mb-4"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    Slide Title
  </motion.h1>
  <motion.p 
    className="text-xl text-slate-300"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    Your content here
  </motion.p>
</motion.div>'
WHERE code IS NULL;
