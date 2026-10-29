import { NavLink } from "react-router-dom";
import { FaHome, FaMoneyBillWave, FaReceipt, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import logoXip from "../assets/logo-xip.png";

function Sidebar() {
  const navigate = useNavigate();

const handleLogout = async () => {
  await signOut(auth);
  navigate("/");
};
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src={logoXip}
          alt="XIP"
        />
      </div>

      <nav>
        <NavLink to="/dashboard">
          <FaHome /> Dashboard
        </NavLink>

        <NavLink to="/receitas">
          <FaMoneyBillWave /> Receitas
        </NavLink>

        <NavLink to="/despesas">
          <FaReceipt /> Despesas
        </NavLink>
      </nav>

      <button
  className="logout-btn"
  onClick={handleLogout}
>
  <FaSignOutAlt />
  Sair
</button>
    </aside>
  );
}

export default Sidebar;