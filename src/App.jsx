import { home } from './content/home.en.js';
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
import site from './content/knowledge/site.json';
import { knowledgeCopy, resolutionEntries, serviceMeta, topics as knowledgeTopics } from './content/knowledge.en.js';

const knowledge = { services: site.services, serviceMeta, topics: knowledgeTopics, extraTopics: resolutionEntries, copy: knowledgeCopy };
const assistant = { ...assistantCopy, eligibility, application, knowledge };

export function App() {
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
      <Assistant content={assistant} />
    </>
  );
}
