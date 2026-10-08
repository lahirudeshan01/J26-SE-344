import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AssessmentEnginePage from "../features/assessment-engine/pages/AssessmentEnginePage";
import ContentEnginePage from "../features/content-engine/pages/ContentEnginePage";
import DigitalTwinPage from "../features/digital-twin/pages/DigitalTwinPage";
import SkillsTrainerPage from "../features/skills-trainer/pages/SkillsTrainerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/skills-trainer" replace />} />
        <Route path="/skills-trainer" element={<SkillsTrainerPage />} />
        <Route path="/assessment-engine" element={<AssessmentEnginePage />} />
        <Route path="/content-engine" element={<ContentEnginePage />} />
        <Route path="/digital-twin" element={<DigitalTwinPage />} />
      </Routes>
    </BrowserRouter>
  );
}
