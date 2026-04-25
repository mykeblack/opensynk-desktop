import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

type Props = {
  children: React.ReactNode;
};

const dashboardPaths = ['/', '/dashboard'];

export default function PageTransition({ children }: Props) {
  const location = useLocation();
  const isDashboard = dashboardPaths.includes(location.pathname);
  const isConsoleMode = document.body.classList.contains('console-mode');

  if (!isConsoleMode) {
    return (
      <motion.div
        key={location.pathname}
        className="page-transition page-transition--desktop"
        initial={{ opacity: 0, y: 12, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.992 }}
        transition={{
          duration: 0.24,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={location.pathname}
      className="page-transition page-transition--console"
      initial={{ x: isDashboard ? '-100%' : '100%' }}
      animate={{ x: 0 }}
      exit={{ x: isDashboard ? '100%' : '-100%' }}
      transition={{
        duration: 0.36,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}