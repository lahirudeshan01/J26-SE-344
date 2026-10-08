import "../shared/styles/globals.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import AssessmentEnginePage from "../features/assessment-engine/pages/AssessmentEnginePage";
import ContentEnginePage from "../features/content-engine/pages/ContentEnginePage";
import { ChatProvider } from "../features/content-engine/hooks/ChatContext";
import DigitalTwinPage from "../features/digital-twin/pages/DigitalTwinPage";
import SkillsTrainerPage from "../features/skills-trainer/pages/SkillsTrainerPage";
import { AppShell } from "./layout/AppShell";
import { LanguageProvider } from "./providers/LanguageContext";
import { SidebarProvider } from "./providers/SidebarContext";
import { ThemeProvider } from "./providers/ThemeContext";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <LanguageProvider>
          <SidebarProvider>
            <ChatProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<Navigate to="/content-engine" replace />} />
                    <Route path="/content-engine" element={<ContentEnginePage />} />
                    <Route path="/skills-trainer" element={<SkillsTrainerPage />} />
                    <Route path="/assessment-engine" element={<AssessmentEnginePage />} />
                    <Route path="/digital-twin" element={<DigitalTwinPage />} />
                    <Route path="*" element={<Navigate to="/content-engine" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ChatProvider>
          </SidebarProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}