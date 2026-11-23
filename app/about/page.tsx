import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <article className={styles.about} aria-labelledby="about-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>About Zhurie &amp; Co</p>
        <p className={styles.edition}>Our perspective</p>
      </header>

      <section className={styles.story}>
        <div className={styles.titleBlock}>
          <p className={styles.sectionLabel}>A considered way of living</p>
          <h1 className={styles.title} id="about-title">
            A life,
            <br />
            <em>well curated.</em>
          </h1>
          <span className={styles.rule} aria-hidden="true" />
        </div>

        <div className={styles.copy}>
          <p className={styles.lead}>
            At Zhurie &amp; Co, we believe that the art of living well lies in the details.
          </p>
          <p>
            We are a lifestyle brand inspired by elegance, individuality and the beauty of thoughtful choices. Our
            collections bring together carefully selected pieces that complement modern living, offering a considered
            balance of style, quality and everyday sophistication.
          </p>
          <p>We believe that the things we choose should reflect who we are and how we wish to live.</p>
        </div>
      </section>

      <footer className={styles.manifesto}>
        <p className={styles.manifestoText}>
          Every detail matters.
          <br />
          Every choice tells a story.
        </p>
        <p className={styles.signature}>
          <strong>ZHURIE &amp; CO — A LIFE, WELL CURATED.</strong>
        </p>
      </footer>
    </article>
  );
}
