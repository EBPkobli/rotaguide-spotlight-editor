import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { ProjectsPage } from "./pages/ProjectsPage";
import { EditorPage } from "./pages/EditorPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden bg-[#1e1e1e]">
        <Header />
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
