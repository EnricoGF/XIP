import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, provider, db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logoXip from "../assets/logo-xip.png";
import logoX from "../assets/logo-x.png";
import loginBg from "../assets/login-bg.png";
import {
  FaShieldAlt,
  FaCloud,
  FaBolt,
  FaChartLine,
  FaMoneyBillWave
} from "react-icons/fa";
import { FaHandSparkles } from "react-icons/fa6";

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Usuário atual:", user);

    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const loggedUser = result.user;

      const userRef = doc(db, "users", loggedUser.uid);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nome: loggedUser.displayName,
          email: loggedUser.email,
          foto: loggedUser.photoURL,
          criadoEm: new Date(),
        });

        console.log("Usuário criado!");
      } else {
        console.log("Usuário já existe!");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

return (
  <div className="login-container">

  <div
  className="login-left"
  style={{
    backgroundImage: `url(${loginBg})`
  }}
>

  <div className="brand">
    <img
      src={logoXip}
      alt="XIP"
      className="logo-principal"
    />
  </div>

  <div className="hero-text">
    <h2>
      Organize suas finanças,
      acompanhe seus gastos e
      <span> conquiste seus objetivos.</span>
    </h2>
  </div>

  <div className="features">

    <div className="feature-item">
      <FaShieldAlt className="feature-icon" />
      <p>Seguro</p>
    </div>

    <div className="feature-item">
      <FaCloud className="feature-icon" />
      <p>Acesso Online</p>
    </div>

    <div className="feature-item">
      <FaBolt className="feature-icon" />
      <p>Tempo Real</p>
    </div>

  </div>

</div>

    <div className="login-right">

      <div className="login-card">

        <div className="card-logo">
  <img
    src={logoX}
    alt="XIP"
  />
</div>

        <h2>
  Bem-vindo!
  <FaHandSparkles
    style={{
      marginLeft: "10px",
      color: "#2563eb",
      fontSize: "28px"
    }}
  />
</h2>

        <p>
          Faça login para acessar sua conta
          e continuar gerenciando suas finanças.
        </p>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Entrar com Google
        </button>

      </div>

    </div>

  </div>
);
}

export default Login;