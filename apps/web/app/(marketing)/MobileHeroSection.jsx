"use client";

import {
  BrandHeroParallax,
  HERO_LEADERBOARD_SEED_ENTRIES,
  LeaderboardWidget,
  REVENUE_MODEL_EYEBROW,
  REVENUE_MODEL_HEADING,
  REVENUE_MODEL_PILLARS,
  REVENUE_MODEL_SIGNOFF,
  REVENUE_MODEL_SUMMARY,
  REVENUE_MODEL_VALUE_PROPS
} from "@saintrocky/ui/web";

const MOBILE_HERO_INTRO_PARAGRAPHS = [
  "I was named after St. Roch, patron saint of dogs, invalids, the falsely accused, bachelors, and a few other varieties of the down-and-out according to Wikipedia. You can call me Rocco.",
  "When Wall St. calls us 'dumb money,' it doesn't quite sting - mostly because it doesn't quite miss either. But dumb money with discipline is a different animal entirely.",
  "Stupidity is a spectrum. I built this platform on the assumption that most people already know what they should be doing - they just need someone annoying enough to remind them. My share of the revenue comes last, after those who hold themselves accountable get theirs. I'm not here to monetize your failures - I'm here to make them expensive enough to stop repeating them. There's a difference, and it matters to me.",
  "Payment is optional. The users exercising discipline collect from the ones who aren't. That's the whole idea.",
  "My assignment: get you to honor the version of yourself that existed before the day started talking you out of it."
];

export default function MobileHeroSection({ heroWordmark }) {
  return (
    <div className="c-MobileHeroSection">
      <BrandHeroParallax
        heroWordmark={heroWordmark}
        variant="wordmarkOnly"
        wordmarkOnlyOverlay={
          <div className="c-MobileHeroSection__heroCopy">
            <p className="c-MobileHeroSection__heroCopyEyebrow">
              Dumb money is still legal tender
            </p>
            <div className="c-MobileHeroSection__heroCopyStack">
              {MOBILE_HERO_INTRO_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph} className="c-MobileHeroSection__heroCopyParagraph">
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="c-MobileHeroSection__heroCopySignoff">- Rocco</p>
          </div>
        }
      />

      <section className="c-MobileHeroSection__revenueModel" aria-label="Revenue model">
        <p className="c-MobileHeroSection__eyebrow">{REVENUE_MODEL_EYEBROW}</p>
        <h2 className="c-MobileHeroSection__sectionHeading">{REVENUE_MODEL_HEADING}</h2>
        <p className="c-MobileHeroSection__sectionSummary">{REVENUE_MODEL_SUMMARY}</p>

        <div className="c-MobileHeroSection__pillarGrid">
          {REVENUE_MODEL_PILLARS.map((pillar) => (
            <article key={pillar.title} className="c-MobileHeroSection__pillarCard">
              <h3 className="c-MobileHeroSection__pillarTitle">{pillar.title}</h3>
              <p className="c-MobileHeroSection__pillarSummary">{pillar.summary}</p>
            </article>
          ))}
        </div>

        <ul className="c-MobileHeroSection__valuePropList">
          {REVENUE_MODEL_VALUE_PROPS.map((valueProp) => (
            <li key={valueProp} className="c-MobileHeroSection__valuePropItem">
              {valueProp}
            </li>
          ))}
        </ul>

        <p className="c-MobileHeroSection__signoffLine c-MobileHeroSection__signoffLine--revenue">
          {REVENUE_MODEL_SIGNOFF}
        </p>
      </section>

      <section className="c-MobileHeroSection__leaderboard" aria-label="Leaderboard">
        <div className="c-MobileHeroSection__leaderboardHeader">
          <p className="c-MobileHeroSection__eyebrow">Discipline leaderboard</p>
          <h2 className="c-MobileHeroSection__sectionHeading">Traders getting paid to behave.</h2>
        </div>
        <LeaderboardWidget
          entries={HERO_LEADERBOARD_SEED_ENTRIES}
          limit={5}
          variant="heroLight"
          enableRealtime={false}
        />
      </section>
    </div>
  );
}
