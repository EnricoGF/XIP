import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function MainLayout({ children, title }) {
  return (
    <div className="container">
      <Sidebar />

      <div className="content">
        <Header title={title} />

        <main>{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;