import { motion } from 'framer-motion';

export const Loader = ({ message = "Đang tải dữ liệu" }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-sans">
      <div className="flex items-center space-x-2 mb-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-[#C87556] rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15
            }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{message}</p>
    </div>
  );
};
