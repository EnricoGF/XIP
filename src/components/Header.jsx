import { useAuth } from "../contexts/AuthContext";

function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="header">
      <div>
        <h2>{title}</h2>
      </div>

      <div className="user-info">
        <img src={user?.photoURL} alt="Usuário" />
        <span>{user?.displayName}</span>
      </div>
    </header>
  );
}

export default Header;