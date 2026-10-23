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
    </>
  );
}
