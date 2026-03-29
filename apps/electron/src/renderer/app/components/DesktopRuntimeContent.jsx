import { ActivitySection } from './content/sections/ActivitySection.jsx';
import { HomeSection } from './content/sections/HomeSection.jsx';
import { RulesSection } from './content/sections/RulesSection.jsx';
import { SettingsSection } from './content/sections/SettingsSection.jsx';
import { ViolationsSection } from './content/sections/ViolationsSection.jsx';

const sectionRenderers = {
  home: HomeSection,
  rules: RulesSection,
  violations: ViolationsSection,
  activity: ActivitySection,
  settings: SettingsSection
};

export function DesktopRuntimeContent(props) {
  const SectionRenderer = sectionRenderers[props.activeSectionId] || HomeSection;

  return (
    <div className="desktop-EnforcementHub">
      <SectionRenderer {...props} />
    </div>
  );
}
