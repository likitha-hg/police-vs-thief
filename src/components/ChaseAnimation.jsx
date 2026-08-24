import { motion } from "framer-motion";
import splashBg from "../assets/images/splash_bg.png";

function ChaseAnimation() {
  return (
    <motion.div
      className="hero-splash"
      initial={{ scale: 1 }}
      animate={{ scale: 1.05 }}
      transition={{
        duration: 4,
        ease: "easeInOut",
      }}
    >
      <img src={splashBg} alt="Splash Background" />
    </motion.div>
  );
}

export default ChaseAnimation;