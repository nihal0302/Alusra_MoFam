import { useState } from 'react';
import { home } from './content/home.en.js';
import { VariantSwitch } from './components/PrototypeSwitches.jsx';
import { demo } from './content/demo.en.js';
import { Navbar } from './components/Navbar.jsx';
import { RegistrationBanner } from './components/RegistrationBanner.jsx';
import { HeroSlider } from './components/HeroSlider.jsx';
import { AboutSection } from './components/AboutSection.jsx';
import { ServicesSection } from './components/ServicesSection.jsx';
import { NewsSection } from './components/NewsSection.jsx';
import { CareersSection } from './components/CareersSection.jsx';
import { ContactSection } from './components/ContactSection.jsx';
import { Footer } from './components/Footer.jsx';
import { Assistant } from './components/assistant/Assistant.jsx';
import * as assistantCopy from './content/assistant.en.js';
import { eligibility } from './content/eligibility.en.js';
import { application } from './content/application.en.js';
import { intake } from './content/intake.en.js';
import { knowledgeCopy, knowledgeServices, resolutionEntries, serviceMeta, topics as knowledgeTopics } from './content/knowledge.en.js';

const knowledge = { services: knowledgeServices, serviceMeta, topics: knowledgeTopics, extraTopics: resolutionEntries, copy: knowledgeCopy };
const assistant = { ...assistantCopy, eligibility, application, intake, knowledge, demo };

export function App() {
  // Testing controls: which chatbot design, and whether the buttons sit inside or outside the replies.
  const [variant, setVariant] = useState('2'); // opens on Variation 2; the switch goes back to Variation 1
  const [buttonsInside, setButtonsInside] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [scenario, setScenario] = useState('free'); // which kind of person the testing samples pretend to be (free = nothing pre-filled)
  return (
    <>
      <Navbar content={home.nav} />
      <RegistrationBanner content={home.banner} />
      <main>
        <HeroSlider content={home.hero} />
        <AboutSection content={home.about} />
        <ServicesSection content={home.services} />
        <NewsSection content={home.news} />
        <CareersSection content={home.careers} />
        <ContactSection content={home.contact} />
      </main>
      <Footer content={home.footer} />
      <VariantSwitch value={variant} onChange={setVariant} buttonsInside={buttonsInside} onButtonsInside={setButtonsInside} scenario={scenario} onScenario={setScenario} scenarios={demo} />
      {/* Keyed by design: switching starts a fresh conversation in the new design (and keeps the chat open if it was open). */}
      <Assistant key={variant} content={assistant} variant={variant} defaultOpen={chatOpen} onOpenChange={setChatOpen} buttonsInside={buttonsInside} scenario={scenario} />
    </>
  );
}
