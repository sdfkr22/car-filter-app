import { useEffect, useState } from "react";

export default function ClosurePage() {
  const message = `Site kapandı;
Filtron u bitirirsen açılır.
Bu süreçte “ağırlaştırılmış surat” çekmek istemiyorum.`;


  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setText((prev) => prev + message[i]);
      i++;

      if (i >= message.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.box}>
        <div style={styles.text}>
          {text}
          <span style={styles.cursor}>|</span>
        </div>

        <div style={{ ...styles.footer, opacity: done ? 1 : 0 }}>
          — erişim sonlandırıldı —
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    margin: 0,
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at center, #111, #000)",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  box: {
    maxWidth: "750px",
    padding: "30px",
  },
  text: {
    fontSize: "22px",
    lineHeight: "1.7",
    whiteSpace: "pre-line",
  },
  cursor: {
    marginLeft: "4px",
    animation: "blink 0.8s infinite",
  },
  footer: {
    marginTop: "25px",
    fontSize: "12px",
    color: "#666",
    letterSpacing: "2px",
    transition: "opacity 1s ease",
  },
};
