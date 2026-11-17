import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, provider, db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logoXip from "../assets/logo-xip.png";
import logoX from "../assets/logo-x.png";
import loginBg from "../assets/login-bg.png";
import {
  FaShieldAlt,
  FaCloud,
  FaBolt
} from "react-icons/fa";
import { FaHandSparkles } from "react-icons/fa6";

function getLoginErrorMessage(error) {
  switch (error.code) {
    case "auth/unauthorized-domain":
      return "Este endereço não está autorizado no Firebase. Adicione localhost em Authentication > Settings > Authorized domains e acesse pelo endereço http://localhost:4173.";
    case "auth/operation-not-allowed":
      return "O login com Google não está ativado. Habilite o provedor Google em Authentication > Sign-in method no Firebase.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.";
    case "auth/popup-closed-by-user":
      return "O login foi cancelado antes de terminar. Tente novamente.";
    case "auth/network-request-failed":
      return "Não foi possível conectar ao Firebase. Verifique sua conexão e tente novamente.";
    default:
      return `Não foi possível fazer login. Confira a configuração do Firebase e tente novamente. (${error.code || "erro desconhecido"})`;
  }
}

function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    console.log("Usuário atual:", user);

    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setLoginError("");

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
      setLoginError(getLoginErrorMessage(error));
    } finally {
      setIsSigningIn(false);
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

        {loginError && (
          <p className="login-error" role="alert">
            {loginError}
          </p>
        )}

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
        >
          {isSigningIn ? "Conectando..." : "Entrar com Google"}
        </button>

      </div>

    </div>

  </div>
);
}

export default Login;