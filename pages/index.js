import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>The Care Collective</title>
        <meta name="description" content="A system for connecting. A future built on unity." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.tilde}>~</div>
        <h1 className={styles.title}>The Care Collective</h1>
        <p className={styles.tagline}>
          A system for connecting.<br/>A future built on unity.
        </p>
        <a className={styles.cta} href="#">Join the Movement</a>

        <section className={styles.partners}>
          <h2>Our Partners</h2>
          <div className={styles.partnerRow}>
            <img src="/logo1.svg" alt="Partner 1"/>
            <img src="/logo2.svg" alt="Partner 2"/>
            <img src="/logo3.svg" alt="Partner 3"/>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTilde}><strong>~</strong></div>
        <div className={styles.socials}>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://wa.me/YOURNUMBER" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
        <p>©️ 2025 The Care Collective. We’re still listening.</p>
      </footer>
    </div>
  );
}
