"use client";

import { Button, Space, Typography } from "antd";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStyles } from "./not-found/style";

const NotFound = () => {
  const router = useRouter();
  const { styles } = useStyles();

  return (
    <main className={styles.page} data-ai-page="not-found">
      <div className={styles.gridOverlay} />
      <motion.section
        className={styles.content}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <motion.article
          className={styles.copyCard}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className={styles.label}>
            <Compass size={14} />
            Error 404
          </span>
          <Typography.Title level={1} className={styles.title}>
            Oops, looks like you are <span className={styles.gradientWord}>lost</span>
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            The page you requested does not exist or may have moved. Let&apos;s get you
            back to a stable route.
          </Typography.Paragraph>
          <Space className={styles.actions}>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/")}
              data-ai-action="not-found-go-home"
            >
              Take Me Home
            </Button>
            <Button
              size="large"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              data-ai-action="not-found-go-back"
            >
              Go Back
            </Button>
          </Space>
        </motion.article>

        <motion.div
          className={styles.visualWrap}
          initial={{ opacity: 0, x: 22, rotateY: -8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
        >
          <div className={styles.cubeFrame}>
            <motion.div
              className={`${styles.shard} ${styles.shardOne}`}
              animate={{ y: [0, -10, 0], rotate: [8, 28, 8] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className={`${styles.shard} ${styles.shardTwo}`}
              animate={{ y: [0, 10, 0], rotate: [18, -10, 18] }}
              transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
              className={`${styles.shard} ${styles.shardThree}`}
              animate={{ y: [0, -8, 0], rotate: [0, 36, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
            />
            <motion.div
              className={`${styles.shard} ${styles.shardFour}`}
              animate={{ y: [0, 9, 0], rotate: [10, -20, 10] }}
              transition={{ duration: 5.1, repeat: Infinity, ease: "easeInOut", delay: 0.52 }}
            />
            <div className={styles.ring} />
            <div className={styles.cube}>
              <div className={`${styles.face} ${styles.faceFront}`}>404</div>
              <div className={`${styles.face} ${styles.faceBack}`}>404</div>
              <div className={`${styles.face} ${styles.faceLeft}`}>Oops</div>
              <div className={`${styles.face} ${styles.faceRight}`}>Lost</div>
              <div className={`${styles.face} ${styles.faceTop}`}>Route</div>
              <div className={`${styles.face} ${styles.faceBottom}`}>Retry</div>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
};

export default NotFound;
